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
  { text: "다른 도구 꺼내 봐. 기대돼?", color: "yellow", bpm: [50, 70], dur: [15, 25], mode: "tool2" },
  { text: "다른 도구에만 집중해. 딴생각 금지~", color: "green", bpm: [40, 60], dur: [20, 30], mode: "tool2" },
  { text: "손 떼. 도구는 그대로 두고. 버틸 수 있지?", color: "red", bpm: [0, 0], dur: [15, 25], mode: "tool2" },
  { text: "숨 쉬는 박자에 맞춰. 천~천히", color: "green", bpm: [30, 45], dur: [20, 30], mode: "tool2" },
  { text: "다른 도구도 내려놔. 아쉽지?", color: "red", bpm: [0, 0], dur: [10, 15], mode: "tool2" },

  // ── 도구 옵션 전용 (mode: "tool")
  { text: "이제 도구로 바꿔. 손은 좀 쉬고~", color: "yellow", bpm: [60, 80], dur: [15, 25], mode: "tool" },
  { text: "도구로 천천히. 서두르면 지는 거야", color: "green", bpm: [45, 65], dur: [20, 30], mode: "tool" },
  { text: "도구로 박자 맞춰. 흐트러지면 다 보여", color: "green", bpm: [70, 95], dur: [15, 25], mode: "tool" },
  { text: "도구로 빠르게! 벌써 숨차?", color: "yellow", bpm: [110, 140], dur: [8, 15], mode: "tool" },
  { text: "도구 내려놔. 지금 바로~", color: "red", bpm: [0, 0], dur: [10, 20], mode: "tool" },
  { text: "다시 손으로. 도구가 그리워?", color: "yellow", bpm: [60, 90], dur: [12, 20], mode: "tool" },

  // ── 진행 (green)
  { text: "천천히 시작해. 처음부터 달리면 금방 끝나잖아?", color: "green", bpm: [50, 70], dur: [15, 25] },
  { text: "그 속도 그대로. 벌써 흔들리는 거 아니지?", color: "green", bpm: [70, 90], dur: [15, 30] },
  { text: "편하게 리듬 타 봐. 아직은 여유롭지?", color: "green", bpm: [60, 80], dur: [20, 30] },
  { text: "박자 딱 맞춰. 틀리면 다 티 나~", color: "green", bpm: [80, 100], dur: [15, 25] },
  { text: "숨 길게. 벌써 헐떡이면 곤란하지", color: "green", bpm: [50, 65], dur: [20, 30] },

  // ── 주의 / 변화 (yellow)
  { text: "조금만 더 빨리. 이 정도는 괜찮잖아?", color: "yellow", bpm: [100, 120], dur: [10, 20] },
  { text: "빠르게! 따라올 수 있으면 와 봐", color: "yellow", bpm: [120, 150], dur: [8, 15] },
  { text: "아~주 느리게. 답답해도 참아", color: "yellow", bpm: [30, 45], dur: [15, 25] },
  { text: "짧고 강하게. 정신 바짝 차려", color: "yellow", bpm: [110, 140], dur: [8, 12] },
  { text: "방식 바꿔 봐. 같은 것만 하면 재미없잖아", color: "yellow", bpm: [70, 100], dur: [12, 20] },

  // ── 정지 (red)
  { text: "멈춰. 손 떼. 아쉬워도 어쩔 수 없어~", color: "red", bpm: [0, 0], dur: [10, 20] },
  { text: "완전히 정지. 숨 골라. 벌써 한계야?", color: "red", bpm: [0, 0], dur: [15, 25] },
  { text: "아무것도 하지 마. 가만히. 할 수 있지?", color: "red", bpm: [0, 0], dur: [10, 15] },
  { text: "잠깐 쉬어. 봐주는 거야, 이번만", color: "red", bpm: [0, 0], dur: [8, 12] },
];
