// Piper(VITS) 한국어 모델을 Node에서 직접 실행해 WAV를 만드는 최소 구현.
// SNAP 모델은 phoneme_type "text" — 한글을 호환 자모로 풀어서 넣습니다.
import fs from "node:fs";
import ort from "onnxruntime-node";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

function toJamo(text) {
  let out = "";
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) {
      const i = c - 0xac00;
      out += CHO[Math.floor(i / 588)] + JUNG[Math.floor((i % 588) / 28)] + JONG[i % 28];
    } else out += ch;
  }
  return out;
}

export async function loadPiper(onnxPath) {
  const cfg = JSON.parse(fs.readFileSync(onnxPath + ".json", "utf8"));
  const session = await ort.InferenceSession.create(onnxPath);
  const map = cfg.phoneme_id_map;
  const id = (s) => map[s]?.[0];
  return {
    sampleRate: cfg.audio.sample_rate,
    speakers: cfg.speaker_id_map || {},
    async synth(text, { lengthScale = 1, sid = 0 } = {}) {
      const norm = toJamo(text.replace(/[…]/g, ",").replace(/[~]/g, "").replace(/\s+/g, " ").trim());
      const ids = [id("^"), id("_")];
      for (const ch of norm) {
        const v = id(ch);
        if (v === undefined) continue; // 모르는 문자는 건너뜀
        ids.push(v, id("_"));
      }
      ids.push(id("$"));
      const inf = cfg.inference || {};
      const feeds = {
        input: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor("float32", Float32Array.from([inf.noise_scale ?? 0.667, lengthScale * (inf.length_scale ?? 1), inf.noise_w ?? 0.8]), [3]),
      };
      if (session.inputNames.includes("sid")) feeds.sid = new ort.Tensor("int64", BigInt64Array.from([BigInt(sid)]), [1]);
      // pos: SNAP 전처리기의 품사/운율 정보로 보이나 문서가 없어 0으로 채움
      if (session.inputNames.includes("pos")) feeds.pos = new ort.Tensor("int64", new BigInt64Array(ids.length), [1, ids.length]);
      const out = await session.run(feeds);
      return out[session.outputNames[0]].data; // Float32Array
    },
  };
}

export function writeWav(path, samples, sampleRate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path, buf);
}

// 단독 실행 테스트: node piper.mjs <model.onnx> <out.wav> "문장"
if (process.argv[1] && process.argv[1].endsWith("piper.mjs") && process.argv[2]) {
  const p = await loadPiper(process.argv[2]);
  const s = await p.synth(process.argv[4] || "여보, 나 루야. 이 목소리 어때?", { sid: Number(process.argv[5] || 0) });
  writeWav(process.argv[3], s, p.sampleRate);
  console.log("saved", process.argv[3], (s.length / p.sampleRate).toFixed(2) + "s");
}
