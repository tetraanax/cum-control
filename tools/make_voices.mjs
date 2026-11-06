// 지시문 음성 파일(mp3)을 미리 만들어 ../voices/ 에 저장합니다.
//
// 사용법 (control/tools 폴더에서):
//   npm install                 ← 처음 한 번
//   node make_voices.mjs        ← 문장을 고친 뒤 다시 실행 (바뀐 문장만 새로 만듦)
//
// 필요: Node, ffmpeg(PATH), 인터넷(edge 음성), Piper 모델은 처음 실행 때 자동으로 받음(약 120MB씩).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT = path.join(ROOT, "voices");
const CACHE = path.join(HERE, "cache");

// ───────── 목소리 팩 목록 ─────────
// 빼고 싶은 팩은 줄을 지우거나 주석 처리하세요.
// lengthScale: Piper 말 속도 (클수록 느림). 바꾸면 그 팩 폴더를 지우고 다시 실행하세요.
const HF = "https://huggingface.co/softguy777/snap_piper_korean_22k/resolve/main/";
const PACKS = [
  { id: "injoon", label: "InJoon (Edge 온라인 음성)", engine: "edge", voice: "ko-KR-InJoonNeural" },
  { id: "hyunsu", label: "Hyunsu (Edge 온라인 음성)", engine: "edge", voice: "ko-KR-HyunsuMultilingualNeural" },
  { id: "snap-anime-1", label: "SNAP 애니체 · 20대 표준톤 (오픈소스)", engine: "piper", model: "snap_male12_anime_22k", sid: 1, lengthScale: 1.35 },
  { id: "snap-anime-3", label: "SNAP 애니체 · 20대 세련미성 (오픈소스)", engine: "piper", model: "snap_male12_anime_22k", sid: 3, lengthScale: 1.15 },
  { id: "snap-kind-0", label: "SNAP 친절체 · 20대 미성 (오픈소스)", engine: "piper", model: "snap_male12_kind_22k", sid: 0, lengthScale: 1.35 },
];

// app.js에서 읽어 주는 고정 문장들 (app.js 문구를 바꾸면 여기도 같이)
const EXTRA = [
  "여보, 나 루야. 이 목소리 어때?",
  "여보 진정해. 아직 멀었어",
  "여보, 해도 돼",
  "여보, 이번엔 안 돼",
];

// ───────── 문장 모으기 ─────────
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "cues.js"), "utf8"), ctx);
const texts = [...new Set([...ctx.window.CUES.map((c) => c.text), ...EXTRA])]
  .filter((t) => t && !t.startsWith("(")); // "(레벨 4 ... 여기에)" 같은 빈칸은 건너뜀

const fileFor = (t) => crypto.createHash("sha1").update(t).digest("hex").slice(0, 12) + ".mp3";
const toMp3 = (src, dst) =>
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-ac", "1", "-b:a", "48k", dst]);

// ───────── 엔진 ─────────
async function edgeEngine(pack) {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  await tts.setMetadata(pack.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const tmp = fs.mkdtempSync(path.join(CACHE, "edge-"));
  return {
    async make(text, dst) {
      // 온라인 서비스라 너무 빨리 요청하면 429(요청 제한)가 나옴 → 쉬었다가 재시도
      for (let attempt = 1; ; attempt++) {
        try {
          const { audioFilePath } = await tts.toFile(tmp, text);
          fs.renameSync(audioFilePath, dst);
          await new Promise((r) => setTimeout(r, 400));
          return;
        } catch (e) {
          if (attempt >= 5) throw e;
          const wait = 3000 * attempt;
          console.log(`  재시도 ${attempt} (${wait / 1000}초 대기): ${e.message}`);
          await new Promise((r) => setTimeout(r, wait));
          await tts.setMetadata(pack.voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        }
      }
    },
    close() { tts.close(); fs.rmSync(tmp, { recursive: true, force: true }); },
  };
}

async function download(url, dst) {
  if (fs.existsSync(dst)) return;
  console.log("  내려받는 중:", path.basename(dst));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  fs.writeFileSync(dst + ".part", Buffer.from(await res.arrayBuffer()));
  fs.renameSync(dst + ".part", dst);
}

const piperCache = {};
async function piperEngine(pack) {
  const { loadPiper, writeWav } = await import("./piper.mjs");
  const dir = path.join(CACHE, "piper");
  fs.mkdirSync(dir, { recursive: true });
  const onnx = path.join(dir, pack.model + ".onnx");
  await download(HF + pack.model + ".onnx.json", onnx + ".json");
  await download(HF + pack.model + ".onnx", onnx);
  const p = (piperCache[onnx] ||= await loadPiper(onnx));
  const wav = path.join(CACHE, "tmp.wav");
  return {
    async make(text, dst) {
      writeWav(wav, await p.synth(text, { sid: pack.sid, lengthScale: pack.lengthScale ?? 1 }), p.sampleRate);
      toMp3(wav, dst);
    },
    close() { fs.rmSync(wav, { force: true }); },
  };
}

// ───────── 실행 ─────────
fs.mkdirSync(CACHE, { recursive: true });
const manifest = [];
for (const pack of PACKS) {
  const dir = path.join(OUT, pack.id);
  fs.mkdirSync(dir, { recursive: true });
  const want = new Map(texts.map((t) => [t, fileFor(t)]));
  const todo = texts.filter((t) => !fs.existsSync(path.join(dir, want.get(t))));
  console.log(`[${pack.id}] 문장 ${texts.length}개 중 새로 만들 것 ${todo.length}개`);
  let ok = true;
  if (todo.length) {
    let eng;
    try {
      eng = pack.engine === "edge" ? await edgeEngine(pack) : await piperEngine(pack);
      for (const t of todo) await eng.make(t, path.join(dir, want.get(t)));
    } catch (e) {
      ok = false;
      console.error(`  ✗ ${pack.id} 실패:`, e.message);
    } finally {
      eng?.close();
    }
  }
  // 더 이상 쓰지 않는 파일 정리
  const keep = new Set(want.values());
  for (const f of fs.readdirSync(dir)) if (!keep.has(f)) fs.rmSync(path.join(dir, f));
  const files = {};
  for (const [t, f] of want) if (fs.existsSync(path.join(dir, f))) files[t] = f;
  if (ok || Object.keys(files).length) manifest.push({ id: pack.id, label: pack.label, files });
}

fs.writeFileSync(
  path.join(OUT, "manifest.js"),
  "// tools/make_voices.mjs 가 자동으로 만드는 파일입니다. 직접 고치지 마세요.\n" +
    "window.VOICE_PACKS = " + JSON.stringify(manifest, null, 1) + ";\n",
);
console.log("완료:", manifest.map((m) => `${m.id}(${Object.keys(m.files).length})`).join(", "));
