// 지시문(큐) 데이터. 자유롭게 수정/추가하세요.
// color: 'green' = 진행, 'yellow' = 주의/변화, 'red' = 정지(손 떼기)
// bpm: [최소, 최대] 템포 (red는 0)
// dur: [최소, 최대] 지속 시간(초) — 난이도에 따라 배율이 적용됩니다.
// mode: 생략 = 항상 나옴
//       "tool"  = 도구 옵션을 켰을 때만
//       "tool2" = 다른 도구 옵션을 켰을 때만
//       "hand"  = 두 옵션이 모두 꺼져 있을 때만
window.CUES = [
  // ── 다른 도구 옵션 전용 (mode: "tool2")
  { text: "다른 도구를 준비하세요", color: "yellow", bpm: [50, 70], dur: [15, 25], mode: "tool2" },
  { text: "다른 도구에 집중하세요", color: "green", bpm: [40, 60], dur: [20, 30], mode: "tool2" },
  { text: "다른 도구는 그대로, 손은 떼기", color: "red", bpm: [0, 0], dur: [15, 25], mode: "tool2" },
  { text: "호흡에 맞춰 천천히", color: "green", bpm: [30, 45], dur: [20, 30], mode: "tool2" },
  { text: "다른 도구 내려놓기", color: "red", bpm: [0, 0], dur: [10, 15], mode: "tool2" },

  // ── 도구 옵션 전용 (mode: "tool")
  { text: "도구로 바꾸세요", color: "yellow", bpm: [60, 80], dur: [15, 25], mode: "tool" },
  { text: "도구로 천천히", color: "green", bpm: [45, 65], dur: [20, 30], mode: "tool" },
  { text: "도구로 박자 유지", color: "green", bpm: [70, 95], dur: [15, 25], mode: "tool" },
  { text: "도구로 빠르게", color: "yellow", bpm: [110, 140], dur: [8, 15], mode: "tool" },
  { text: "도구를 내려놓으세요", color: "red", bpm: [0, 0], dur: [10, 20], mode: "tool" },
  { text: "손으로 돌아가세요", color: "yellow", bpm: [60, 90], dur: [12, 20], mode: "tool" },

  // ── 진행 (green)
  { text: "천천히 시작하세요", color: "green", bpm: [50, 70], dur: [15, 25] },
  { text: "지금 속도를 유지하세요", color: "green", bpm: [70, 90], dur: [15, 30] },
  { text: "편하게 리듬을 타세요", color: "green", bpm: [60, 80], dur: [20, 30] },
  { text: "박자에 정확히 맞추세요", color: "green", bpm: [80, 100], dur: [15, 25] },
  { text: "호흡을 길게 가져가세요", color: "green", bpm: [50, 65], dur: [20, 30] },

  // ── 주의 / 변화 (yellow)
  { text: "속도를 조금 올리세요", color: "yellow", bpm: [100, 120], dur: [10, 20] },
  { text: "빠르게!", color: "yellow", bpm: [120, 150], dur: [8, 15] },
  { text: "아주 느리게 바꾸세요", color: "yellow", bpm: [30, 45], dur: [15, 25] },
  { text: "짧고 강하게", color: "yellow", bpm: [110, 140], dur: [8, 12] },
  { text: "방식을 바꿔 보세요", color: "yellow", bpm: [70, 100], dur: [12, 20] },

  // ── 정지 (red)
  { text: "멈추세요. 손 떼기", color: "red", bpm: [0, 0], dur: [10, 20] },
  { text: "완전히 정지. 숨 고르기", color: "red", bpm: [0, 0], dur: [15, 25] },
  { text: "아무것도 하지 마세요", color: "red", bpm: [0, 0], dur: [10, 15] },
  { text: "잠깐 휴식", color: "red", bpm: [0, 0], dur: [8, 12] },
];
