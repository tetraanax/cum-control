(() => {
  "use strict";

  // ───────── 설정 / 저장소 ─────────
  const STORE_SETTINGS = "ct.settings";
  const STORE_HISTORY = "ct.history";
  const STORE_GATE = "ct.gate";

  const DEFAULTS = {
    minutes: 10,
    difficulty: "normal",
    ending: "lottery",
    sound: true,
    tts: false,
    cdRandom: true,
    cdFixed: 10,
    permitSec: 15,
    videoLoop: true,
    videoSound: false,
    tool: false,
    tool2: false,
    level: 1,
    voice: "",     // 고른 음성 이름 (빈 값 = 기기 기본)
    rate: 1.1,     // 말 속도
    pitch: 1.1,    // 높낮이
    duck: true,    // 읽는 동안 메트로놈 줄이기
  };

  // 지시문 레벨: 고른 레벨 이하의 문장이 나오고, 고른 레벨 문장이 더 자주 나옴
  const LEVELS = {
    1: { label: "순한맛", hint: "다정한 루. 가볍게 즐기기 좋아요." },
    2: { label: "장난", hint: "루가 더 놀리고 도발해요. 레벨 1 문장도 가끔 섞여요." },
    3: { label: "야릇", hint: "애태우고 수위 있는 분위기. 아래 레벨 문장도 가끔 섞여요." },
    4: { label: "매운맛", hint: "cues.js에서 직접 채우는 레벨이에요. 아래 레벨 문장도 가끔 섞여요." },
  };
  const LEVEL_WEIGHT_TOP = 3; // 고른 레벨 문장의 가중치 (아래 레벨은 1)

  // 난이도별 파라미터
  const DIFF = {
    easy:   { label: "쉬움",   redRatio: 0.15, bpmMul: 0.85, durMul: 1.3, baseChance: 0.6 },
    normal: { label: "보통",   redRatio: 0.25, bpmMul: 1.0,  durMul: 1.0, baseChance: 0.45 },
    hard:   { label: "어려움", redRatio: 0.35, bpmMul: 1.15, durMul: 0.8, baseChance: 0.3 },
    hell:   { label: "지옥",   redRatio: 0.45, bpmMul: 1.3,  durMul: 0.6, baseChance: 0.15 },
  };

  const ENDINGS = {
    lottery: { label: "추첨", hint: "시간이 끝나면 확률에 따라 허용 또는 거부가 정해집니다. 참을 때마다 확률이 오릅니다." },
    allow:   { label: "무조건 허용", hint: "끝까지 버티면 반드시 허용됩니다." },
    deny:    { label: "무조건 거부", hint: "끝까지 버텨도 허용되지 않습니다." },
    edge:    { label: "아슬아슬", hint: "허용되지만 허용 시간이 아주 짧습니다(3초)." },
  };

  const HOLD_BONUS = 0.05;
  const HOLD_BONUS_MAX = 0.2;

  const safeGet = (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const safeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let settings = { ...DEFAULTS, ...safeGet(STORE_SETTINGS, {}) };
  const saveSettings = () => safeSet(STORE_SETTINGS, settings);

  // ───────── DOM ─────────
  const $ = (s) => document.querySelector(s);
  const screens = { setup: $("#setup"), play: $("#play"), result: $("#result") };
  const show = (name) => Object.entries(screens).forEach(([k, el]) => (el.hidden = k !== name));

  // ───────── 성인 인증 ─────────
  if (!safeGet(STORE_GATE, false)) $("#gate").hidden = false;
  $("#gate-yes").onclick = () => { safeSet(STORE_GATE, true); $("#gate").hidden = true; };

  // ───────── 설정 UI ─────────
  function bindChips(containerSel, attr, key, transform = (v) => v) {
    const box = $(containerSel);
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      settings[key] = transform(b.dataset[attr]);
      if (key === "minutes") $("#dur-custom").value = "";
      saveSettings();
      renderSetup();
    });
  }
  bindChips("#dur-chips", "min", "minutes", Number);
  bindChips("#diff-chips", "v", "difficulty");
  bindChips("#end-chips", "v", "ending");
  bindChips("#level-chips", "v", "level", Number);

  $("#dur-custom").addEventListener("input", (e) => {
    const v = Math.round(Number(e.target.value));
    if (v >= 1 && v <= 180) { settings.minutes = v; saveSettings(); renderSetup(false); }
  });

  const bindCheck = (sel, key) => $(sel).addEventListener("change", (e) => { settings[key] = e.target.checked; saveSettings(); renderSetup(); });
  const bindNum = (sel, key, min, max) => $(sel).addEventListener("change", (e) => {
    const v = Math.min(max, Math.max(min, Math.round(Number(e.target.value) || min)));
    settings[key] = v; e.target.value = v; saveSettings();
  });
  bindCheck("#opt-sound", "sound");
  bindCheck("#opt-tts", "tts");
  bindCheck("#opt-duck", "duck");
  $("#opt-voice").addEventListener("change", (e) => { settings.voice = e.target.value; saveSettings(); renderSetup(false); });
  for (const [sel, key] of [["#opt-rate", "rate"], ["#opt-pitch", "pitch"]]) {
    $(sel).addEventListener("input", (e) => { settings[key] = Number(e.target.value); saveSettings(); renderSetup(false); });
  }
  $("#tts-test").onclick = () => speak("여보, 나 루야. 이 목소리 어때?", true);

  // 기기에 있는 한국어 음성 목록 채우기 (목록은 늦게 로드되는 경우가 있음)
  // 목록 = 미리 녹음한 루 목소리 팩(voices/manifest.js) + 기기 한국어 음성
  const PACKS = window.VOICE_PACKS || [];
  const packOf = (v) => (v && v.startsWith("pack:") ? PACKS.find((p) => "pack:" + p.id === v) : null);
  function loadVoices() {
    const sel = $("#opt-voice");
    sel.innerHTML = "";
    if (PACKS.length) {
      const g = document.createElement("optgroup");
      g.label = "루 목소리 (미리 녹음)";
      for (const p of PACKS) g.append(new Option(p.label, "pack:" + p.id));
      sel.append(g);
    }
    const g2 = document.createElement("optgroup");
    g2.label = "기기 음성";
    g2.append(new Option("기기 기본", ""));
    const voices = "speechSynthesis" in window ? speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang)) : [];
    for (const v of voices) {
      g2.append(new Option(v.name.replace(/^Microsoft |Google /, "") + (v.localService ? "" : " (온라인)"), v.name));
    }
    sel.append(g2);
    const ok = packOf(settings.voice) || voices.some((v) => v.name === settings.voice);
    sel.value = ok ? settings.voice : "";
  }
  loadVoices();
  if ("speechSynthesis" in window) speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
  bindCheck("#opt-video-loop", "videoLoop");
  bindCheck("#opt-video-sound", "videoSound");
  bindCheck("#opt-tool", "tool");
  bindCheck("#opt-tool2", "tool2");

  // ───────── 배경 영상 ─────────
  // 파일은 기기에서 바로 재생하며 어디에도 업로드되지 않습니다.
  // 모바일에서는 accept="video/*" 덕분에 갤러리(사진 보관함)가 열립니다.
  const video = $("#bg-video");
  let videoUrl = null;
  $("#video-file").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(f);
    video.src = videoUrl;
    $("#video-name").textContent = `선택됨: ${f.name}`;
    $("#video-clear").hidden = false;
    e.target.value = "";
  });
  $("#video-clear").onclick = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = null;
    video.removeAttribute("src");
    video.load();
    $("#video-name").textContent = "선택한 영상이 없습니다. 영상 없이도 할 수 있어요.";
    $("#video-clear").hidden = true;
  };
  function videoStart() {
    const on = !!videoUrl;
    video.hidden = !on;
    $("#cue").classList.toggle("has-video", on);
    if (!on) return;
    video.loop = settings.videoLoop;
    video.muted = !settings.videoSound;
    video.currentTime = 0;
    video.play().catch(() => {
      // 소리 켠 상태로 자동재생이 막히면 음소거로 재시도
      video.muted = true;
      video.play().catch(() => {});
    });
  }
  const videoPause = () => { if (videoUrl) video.pause(); };
  const videoResume = () => { if (videoUrl && !(video.ended && !video.loop)) video.play().catch(() => {}); };
  const videoStop = () => { video.pause(); };
  bindNum("#opt-permit", "permitSec", 5, 60);

  function renderSetup(updateCustom = true) {
    const mark = (sel, attr, val) =>
      document.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle("on", String(b.dataset[attr]) === String(val)));
    mark("#dur-chips", "min", settings.minutes);
    mark("#diff-chips", "v", settings.difficulty);
    mark("#end-chips", "v", settings.ending);
    const preset = [3, 5, 10, 15, 20, 30].includes(settings.minutes);
    if (updateCustom) $("#dur-custom").value = preset ? "" : settings.minutes;
    $("#end-hint").textContent = ENDINGS[settings.ending].hint;
    mark("#level-chips", "v", settings.level);
    $("#level-hint").textContent = (LEVELS[settings.level] || LEVELS[1]).hint;
    $("#opt-sound").checked = settings.sound;
    $("#opt-tts").checked = settings.tts;
    $("#tts-opts").hidden = !settings.tts;
    $("#opt-rate").value = settings.rate;
    $("#opt-pitch").value = settings.pitch;
    $("#rate-val").textContent = `${settings.rate.toFixed(1)}배`;
    $("#pitch-val").textContent = settings.pitch.toFixed(1);
    // 녹음 파일은 높낮이를 바꿀 수 없음
    const isPack = !!packOf(settings.voice);
    $("#opt-pitch").disabled = isPack;
    $("#pitch-note").hidden = !isPack;
    $("#opt-duck").checked = settings.duck;
    $("#opt-permit").value = settings.permitSec;
    $("#opt-video-loop").checked = settings.videoLoop;
    $("#opt-video-sound").checked = settings.videoSound;
    $("#opt-tool").checked = settings.tool;
    $("#opt-tool2").checked = settings.tool2;
  }
  renderSetup();

  // 설정 내보내기 / 불러오기
  $("#export").onclick = () => {
    const blob = new Blob([JSON.stringify({ settings, cues: window.CUES }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "참기타이머-설정.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#import").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.settings) settings = { ...DEFAULTS, ...data.settings };
      if (Array.isArray(data.cues) && data.cues.length) window.CUES = data.cues;
      saveSettings(); renderSetup();
      alert("설정을 불러왔습니다.");
    } catch { alert("파일을 읽을 수 없습니다."); }
    e.target.value = "";
  };

  // ───────── 오디오 / 음성 ─────────
  let audio = null;
  function click(accent) {
    if (!settings.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = accent ? 1200 : 880;
      // 음성이 나오는 동안에는 메트로놈을 작게
      const vol = settings.duck && speaking ? 0.05 : 0.25;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.06);
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.07);
    } catch {}
  }
  let speaking = false;
  // 녹음 파일은 오디오 요소 하나를 계속 재사용 (모바일에서 첫 재생 이후에도 자동 재생이 막히지 않게)
  const voiceAudio = new Audio();
  voiceAudio.preload = "auto";
  voiceAudio.onplaying = () => { speaking = true; };
  voiceAudio.onended = voiceAudio.onpause = voiceAudio.onerror = () => { speaking = false; };
  function stopVoice() {
    voiceAudio.pause();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function speak(text, force = false) {
    if (!settings.tts && !force) return;
    stopVoice();
    // 1) 루 목소리 팩에 이 문장 파일이 있으면 그걸 재생
    const pack = packOf(settings.voice);
    const file = pack && pack.files[text];
    if (file) {
      voiceAudio.src = `voices/${pack.id}/${file}`;
      voiceAudio.playbackRate = settings.rate;
      voiceAudio.preservesPitch = true;
      voiceAudio.play().catch(() => {});
      return;
    }
    // 2) 없으면(새로 추가한 문장 등) 기기 음성으로 읽기
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    const v = settings.voice && !pack && speechSynthesis.getVoices().find((x) => x.name === settings.voice);
    if (v) u.voice = v;
    u.rate = settings.rate;
    u.pitch = settings.pitch;
    u.onstart = () => { speaking = true; };
    u.onend = u.onerror = () => { speaking = false; };
    speechSynthesis.speak(u);
  }

  // ───────── 게임 상태 ─────────
  const rand = (a, b) => a + Math.random() * (b - a);
  const fmt = (s) => {
    s = Math.max(0, Math.ceil(s));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  let G = null;          // 현재 세션
  let rafId = 0;
  let beatTimer = 0;
  let beatCount = 0;

  function chance() {
    const d = DIFF[G.diff];
    return Math.min(1, d.baseChance + Math.min(HOLD_BONUS_MAX, G.holds * HOLD_BONUS));
  }

  function pickCue() {
    const d = DIFF[G.diff];
    // 도구 옵션에 따라 큐 걸러내기
    const allowed = {
      tool: settings.tool,
      tool2: settings.tool2,
      hand: !settings.tool && !settings.tool2,
    };
    const lv = settings.level || 1;
    const pool = window.CUES.filter((c) => (!c.mode || allowed[c.mode]) && (c.level || 1) <= lv);
    const wantRed = Math.random() < d.redRatio;
    let candidates = pool.filter((c) => (c.color === "red") === wantRed && c !== G.cue);
    if (!candidates.length) candidates = pool.filter((c) => c !== G.cue);
    if (!candidates.length) candidates = pool;
    // 가중치 추첨: 고른 레벨 문장이 더 자주
    const w = candidates.map((c) => ((c.level || 1) === lv ? LEVEL_WEIGHT_TOP : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    let c = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) { r -= w[i]; if (r < 0) { c = candidates[i]; break; } }
    const bpm = c.color === "red" ? 0 : Math.round(rand(c.bpm[0], c.bpm[1]) * d.bpmMul);
    const dur = rand(c.dur[0], c.dur[1]) * d.durMul;
    return { ...c, _bpm: bpm, _dur: dur, ref: c };
  }

  function setCue(c) {
    G.cue = c.ref;
    G.cueLeft = c._dur;
    G.bpm = c._bpm;
    setCueClass(c.color);
    $("#cue-text").textContent = c.text;
    $("#cue-bpm").textContent = c._bpm ? `${c._bpm} BPM` : "정지";
    $("#cue-sub").textContent = "";
    speak(c.text);
    restartBeat();
  }

  // 색 클래스만 바꾸고 영상/일시정지 상태 클래스는 유지
  function setCueClass(color) {
    const el = $("#cue");
    el.classList.remove("green", "yellow", "red", "wait");
    el.classList.add(color);
  }

  function restartBeat() {
    clearInterval(beatTimer);
    beatCount = 0;
    if (!G || !G.bpm || G.paused || G.phase !== "play") return;
    const tick = () => {
      click(beatCount % 4 === 0);
      beatCount++;
      const p = $("#pulse");
      p.classList.remove("beat"); void p.offsetWidth; p.classList.add("beat");
    };
    tick();
    beatTimer = setInterval(tick, 60000 / G.bpm);
  }

  function start() {
    G = {
      total: settings.minutes * 60,
      elapsed: 0,
      diff: settings.difficulty,
      ending: settings.ending,
      holds: 0,
      phase: "play",          // play | wait
      paused: false,
      waitLeft: 0,
      cue: null,
      cueLeft: 0,
      bpm: 0,
      last: performance.now(),
    };
    show("play");
    $("#cue").classList.remove("paused");
    videoStart();
    setCue(pickCue());
    updateHud();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function loop(now) {
    if (!G) return;
    const dt = Math.min(1, (now - G.last) / 1000);
    G.last = now;
    if (!G.paused) {
      G.elapsed += dt;
      if (G.phase === "play") {
        G.cueLeft -= dt;
        if (G.cueLeft <= 0) setCue(pickCue());
      } else if (G.phase === "wait") {
        G.waitLeft -= dt;
        $("#cue-sub").textContent = `${Math.ceil(G.waitLeft)}초 후 재개`;
        if (G.waitLeft <= 0) { G.phase = "play"; setCue(pickCue()); }
      }
      if (G.elapsed >= G.total) return finish();
      updateHud();
    }
    rafId = requestAnimationFrame(loop);
  }

  function updateHud() {
    $("#time-left").textContent = fmt(G.total - G.elapsed);
    $("#bar").style.width = `${(G.elapsed / G.total) * 100}%`;
    $("#chance").textContent = G.ending === "lottery" ? `허용 확률 ${Math.round(chance() * 100)}%` : ENDINGS[G.ending].label;
  }

  function hold() {
    if (!G || G.phase !== "play" || G.paused) return;
    G.holds++;
    G.phase = "wait";
    G.waitLeft = settings.cdRandom ? rand(8, 16) : settings.cdFixed;
    G.bpm = 0;
    restartBeat();
    setCueClass("wait");
    $("#cue-text").textContent = "여보 진정해. 아직 멀었어~";
    $("#cue-bpm").textContent = "손 떼고 호흡";
    speak("여보 진정해. 아직 멀었어");
    updateHud();
  }

  function togglePause() {
    if (!G) return;
    G.paused = !G.paused;
    G.last = performance.now();
    $("#cue").classList.toggle("paused", G.paused);
    $("#btn-pause").firstChild.textContent = G.paused ? "계속 " : "일시정지 ";
    G.paused ? videoPause() : videoResume();
    restartBeat();
    updateHud();
  }

  function stopEngine() {
    cancelAnimationFrame(rafId);
    clearInterval(beatTimer);
    videoStop();
    stopVoice();
  }

  function record(outcome) {
    const list = safeGet(STORE_HISTORY, []);
    list.unshift({
      at: Date.now(),
      minutes: Math.round(G.total / 60),
      diff: G.diff,
      ending: G.ending,
      holds: G.holds,
      pct: Math.min(100, Math.round((G.elapsed / G.total) * 100)),
      outcome,
    });
    safeSet(STORE_HISTORY, list.slice(0, 100));
  }

  function finish() {
    stopEngine();
    let allowed, permit = settings.permitSec;
    switch (G.ending) {
      case "allow": allowed = true; break;
      case "deny": allowed = false; break;
      case "edge": allowed = true; permit = 3; break;
      default: allowed = Math.random() < chance();
    }
    record(allowed ? "허용" : "거부");
    showResult(allowed ? "ok" : "no",
      allowed ? "허용" : "거부",
      allowed ? "여보 끝까지 버텼네! 나 꼬리 난리 났어. 이제 해도 돼" : "끝까지 버텼는데… 미안, 이번엔 안 돼. 나도 귀 처졌어",
      `${Math.round(G.total / 60)}분 · ${DIFF[G.diff].label} · ${ENDINGS[G.ending].label}`,
      allowed ? permit : 0);
    speak(allowed ? "여보, 해도 돼" : "여보, 이번엔 안 돼");
  }

  function fail() {
    if (!G) return;
    stopEngine();
    const pct = Math.min(100, Math.round((G.elapsed / G.total) * 100));
    record("실패");
    showResult("", "실패", `${pct}%에서 끝? 여보 벌써? 헤헤`, `${fmt(G.elapsed)} / ${fmt(G.total)}`, 0);
  }

  function quit() {
    if (!G) return;
    stopEngine();
    G = null;
    show("setup");
  }

  let permitTimer = 0;
  function showResult(kind, badge, title, desc, permitSec) {
    show("result");
    const b = $("#result-badge");
    b.className = `badge ${kind}`;
    b.textContent = badge;
    $("#result-title").textContent = title;
    $("#result-desc").textContent = desc;
    const pt = $("#permit-timer");
    clearInterval(permitTimer);
    if (permitSec > 0) {
      let left = permitSec;
      pt.hidden = false;
      pt.textContent = left;
      permitTimer = setInterval(() => {
        left--;
        pt.textContent = left > 0 ? left : "끝";
        if (left <= 0) { clearInterval(permitTimer); click(true); }
      }, 1000);
    } else pt.hidden = true;
    G = null;
  }

  // ───────── 버튼 / 단축키 ─────────
  $("#start").onclick = start;
  $("#again").onclick = () => { clearInterval(permitTimer); show("setup"); };
  $("#btn-quit").onclick = quit;

  document.addEventListener("keydown", (e) => {
    if (!G || e.target.matches("input, textarea")) return;
    if (e.key === "Escape") quit();
  });

  // ───────── 모달 / 기록 ─────────
  document.querySelectorAll("[data-open]").forEach((b) =>
    b.addEventListener("click", () => {
      const d = document.getElementById(b.dataset.open);
      if (d.id === "history") renderHistory();
      d.showModal();
    }));
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  function renderHistory() {
    const list = safeGet(STORE_HISTORY, []);
    const ul = $("#history-list");
    ul.innerHTML = "";
    if (!list.length) { ul.innerHTML = "<li>아직 기록이 없습니다.</li>"; return; }
    for (const h of list) {
      const li = document.createElement("li");
      const d = new Date(h.at);
      li.innerHTML = `<span>${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} · ${h.minutes}분 · ${DIFF[h.diff]?.label ?? h.diff}</span><b>${h.outcome} (${h.pct}%)</b>`;
      ul.appendChild(li);
    }
  }
  $("#history-clear").onclick = () => { safeSet(STORE_HISTORY, []); renderHistory(); };
})();
