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
  };

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
    $("#opt-sound").checked = settings.sound;
    $("#opt-tts").checked = settings.tts;
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
      g.gain.setValueAtTime(0.25, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.06);
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.07);
    } catch {}
  }
  function speak(text) {
    if (!settings.tts || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
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
    const pool = window.CUES.filter((c) => !c.mode || allowed[c.mode]);
    const wantRed = Math.random() < d.redRatio;
    let candidates = pool.filter((c) => (c.color === "red") === wantRed && c !== G.cue);
    if (!candidates.length) candidates = pool.filter((c) => c !== G.cue);
    const c = candidates[Math.floor(Math.random() * candidates.length)];
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
    $("#cue-text").textContent = "진정해. 아직 멀었어~";
    $("#cue-bpm").textContent = "손 떼고 호흡";
    speak("진정해. 아직 멀었어");
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
    if ("speechSynthesis" in window) speechSynthesis.cancel();
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
      allowed ? "끝까지 버텼네? 기특해. 이제 해도 돼" : "끝까지 버텼는데… 안타깝다~ 이번엔 안 돼",
      `${Math.round(G.total / 60)}분 · ${DIFF[G.diff].label} · ${ENDINGS[G.ending].label}`,
      allowed ? permit : 0);
    speak(allowed ? "해도 돼" : "안 돼~");
  }

  function fail() {
    if (!G) return;
    stopEngine();
    const pct = Math.min(100, Math.round((G.elapsed / G.total) * 100));
    record("실패");
    showResult("", "실패", `${pct}%에서 끝? 벌써?`, `${fmt(G.elapsed)} / ${fmt(G.total)}`, 0);
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
