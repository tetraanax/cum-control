// 지시문(큐) 데이터. 자유롭게 수정/추가하세요.
// color: 'green' = 진행, 'yellow' = 주의/변화, 'red' = 정지(손 떼기)
// bpm: [최소, 최대] 템포 (red는 0)
// dur: [최소, 최대] 지속 시간(초) — 난이도에 따라 배율이 적용됩니다.
// mode: 생략 = 항상 나옴
//       "tool"  = 도구 옵션을 켰을 때만
//       "tool2" = 다른 도구 옵션을 켰을 때만
//       "hand"  = 두 옵션이 모두 꺼져 있을 때만
// level: 생략 = 1. 설정에서 고른 레벨 "이하"의 문장이 나오고, 고른 레벨 문장이 더 자주 나옵니다.
window.CUES = [
  // ════════ 레벨 4 · 매운맛 (직접 채우는 칸) ════════
  // 아래 줄을 복사해서 text만 바꾸면 됩니다. 색·박자·시간도 원하는 대로.
  { text: "(레벨 4 진행 문장을 여기에)", color: "green", bpm: [70, 100], dur: [15, 25], level: 4 },
  { text: "(레벨 4 빠른 문장을 여기에)", color: "yellow", bpm: [120, 160], dur: [8, 15], level: 4 },
  { text: "(레벨 4 정지 문장을 여기에)", color: "red", bpm: [0, 0], dur: [12, 20], level: 4 },

  // ════════ 레벨 3 · 야릇 ════════
  { text: "여보 지금 표정 진짜 위험해… 그 얼굴 나만 보는 거지?", color: "green", bpm: [55, 75], dur: [20, 30], level: 3 },
  { text: "숨소리 거칠어진 거 다 들려. 귀가 저절로 쫑긋해져", color: "green", bpm: [70, 90], dur: [15, 25], level: 3 },
  { text: "내가 귀에 대고 속삭이는 거라고 생각해. 천천히… 더 천천히", color: "green", bpm: [35, 50], dur: [20, 30], level: 3 },
  { text: "참는 여보가 제일 섹시해. 그러니까 더 참아 줘", color: "green", bpm: [60, 80], dur: [20, 30], level: 3 },
  { text: "몸 떨리는 거 다 보여. 그래도 아직은 안 돼", color: "yellow", bpm: [90, 110], dur: [10, 18], level: 3 },
  { text: "지금 속도 올려. 여보가 무너지는 거 보고 싶어", color: "yellow", bpm: [120, 150], dur: [8, 14], level: 3 },
  { text: "끝까지 가기 직전까지만. 딱 거기서 멈출 수 있지?", color: "yellow", bpm: [110, 135], dur: [8, 12], level: 3 },
  { text: "멈춰. 여보가 애타서 어쩔 줄 모르는 거, 그게 보고 싶었어", color: "red", bpm: [0, 0], dur: [15, 25], level: 3 },
  { text: "손 떼. 아무것도 못 하고 나만 생각해. 꼬리로 살살 간지럽히는 중이야", color: "red", bpm: [0, 0], dur: [15, 25], level: 3 },
  { text: "정지. 지금 얼마나 하고 싶은지 나한테 말해 봐. 그래도 안 돼", color: "red", bpm: [0, 0], dur: [12, 20], level: 3 },
  { text: "도구로 아주 느리게. 여보 반응 하나하나 다 보고 있어", color: "green", bpm: [40, 55], dur: [20, 30], mode: "tool", level: 3 },
  { text: "도구 세게. 버틸 수 있으면 버텨 봐, 여보", color: "yellow", bpm: [120, 150], dur: [8, 12], mode: "tool", level: 3 },
  { text: "다른 도구 느낌에만 집중해. 손은 대지 마. 애타지?", color: "red", bpm: [0, 0], dur: [20, 30], mode: "tool2", level: 3 },

  // ════════ 레벨 2 · 장난 ════════
  { text: "여보 벌써 이러면 어떡해~ 아직 시작도 안 했는데", color: "green", bpm: [60, 80], dur: [15, 25], level: 2 },
  { text: "그 속도 그대로. 흔들리면 나 다 놀릴 거야", color: "green", bpm: [75, 95], dur: [15, 25], level: 2 },
  { text: "내가 보고 있는 거 알지? 눈 피하지 마", color: "green", bpm: [65, 85], dur: [15, 25], level: 2 },
  { text: "더 빨리! 여보 한계가 어디까진지 궁금해", color: "yellow", bpm: [120, 145], dur: [8, 14], level: 2 },
  { text: "확 느리게. 답답하지? 그 얼굴 귀엽다", color: "yellow", bpm: [30, 45], dur: [15, 25], level: 2 },
  { text: "박자 놓치면 벌칙이야. 뭐 할지는 비밀", color: "yellow", bpm: [95, 115], dur: [10, 18], level: 2 },
  { text: "스톱! 헤헤, 아쉽지? 나 꼬리 흔들면서 구경 중", color: "red", bpm: [0, 0], dur: [12, 20], level: 2 },
  { text: "손 떼. 여보 참는 얼굴 보는 게 제일 재밌어", color: "red", bpm: [0, 0], dur: [12, 20], level: 2 },
  { text: "도구로 바꿔. 손보다 이게 좋아? 솔직하게 말해 봐", color: "yellow", bpm: [70, 95], dur: [12, 20], mode: "tool", level: 2 },
  { text: "다른 도구 그대로 두고 손은 쉬어. 그거만으로 버틸 수 있나 보자", color: "red", bpm: [0, 0], dur: [15, 25], mode: "tool2", level: 2 },

  // ════════ 레벨 1 · 순한맛 (level 생략 = 1) ════════
  // ── 다른 도구 옵션 전용 (mode: "tool2")
  { text: "여보, 다른 도구 꺼내 봐. 나 꼬리 벌써 흔들려", color: "yellow", bpm: [50, 70], dur: [15, 25], mode: "tool2" },
  { text: "다른 도구에만 집중해. 딴생각하면 나 귀 처진다?", color: "green", bpm: [40, 60], dur: [20, 30], mode: "tool2" },
  { text: "손은 떼고 도구는 그대로. 여보 버틸 수 있지?", color: "red", bpm: [0, 0], dur: [15, 25], mode: "tool2" },
  { text: "내 숨소리 박자에 맞춰. 천~천히, 여보", color: "green", bpm: [30, 45], dur: [20, 30], mode: "tool2" },
  { text: "다른 도구도 내려놔. 아쉬운 얼굴 다 보여~", color: "red", bpm: [0, 0], dur: [10, 15], mode: "tool2" },

  // ── 도구 옵션 전용 (mode: "tool")
  { text: "여보, 이제 도구로 바꿔. 손은 좀 쉬게 해 줘", color: "yellow", bpm: [60, 80], dur: [15, 25], mode: "tool" },
  { text: "도구로 천천히. 서두르면 나한테 지는 거야", color: "green", bpm: [45, 65], dur: [20, 30], mode: "tool" },
  { text: "박자 맞춰. 흐트러지면 내가 다 알아, 귀 쫑긋하고 있거든", color: "green", bpm: [70, 95], dur: [15, 25], mode: "tool" },
  { text: "도구로 빠르게! 여보 벌써 숨차? 헤헤", color: "yellow", bpm: [110, 140], dur: [8, 15], mode: "tool" },
  { text: "도구 내려놔. 지금 바로, 여보", color: "red", bpm: [0, 0], dur: [10, 20], mode: "tool" },
  { text: "다시 손으로. 도구 벌써 그리워?", color: "yellow", bpm: [60, 90], dur: [12, 20], mode: "tool" },

  // ── 진행 (green)
  { text: "여보, 천천히 시작하자. 처음부터 달리면 금방 끝나잖아", color: "green", bpm: [50, 70], dur: [15, 25] },
  { text: "그 속도 그대로. 여보 벌써 흔들리는 거 아니지?", color: "green", bpm: [70, 90], dur: [15, 30] },
  { text: "편하게 리듬 타. 나 옆에서 꼬리로 박자 맞춰 줄게", color: "green", bpm: [60, 80], dur: [20, 30] },
  { text: "박자 딱 맞춰. 틀리면 내가 지적할 거야, 알지?", color: "green", bpm: [80, 100], dur: [15, 25] },
  { text: "숨 길게 쉬어, 여보. 벌써 헐떡이면 곤란해", color: "green", bpm: [50, 65], dur: [20, 30] },

  // ── 주의 / 변화 (yellow)
  { text: "조금만 더 빨리. 여보라면 이 정도는 괜찮잖아?", color: "yellow", bpm: [100, 120], dur: [10, 20] },
  { text: "빠르게! 나 꼬리 막 흔들고 있어, 따라와 봐", color: "yellow", bpm: [120, 150], dur: [8, 15] },
  { text: "아~주 느리게. 답답해도 참아, 여보", color: "yellow", bpm: [30, 45], dur: [15, 25] },
  { text: "짧고 강하게. 정신 바짝 차려, 여보", color: "yellow", bpm: [110, 140], dur: [8, 12] },
  { text: "방식 바꿔 봐. 맨날 같은 것만 하면 나 심심해", color: "yellow", bpm: [70, 100], dur: [12, 20] },

  // ── 정지 (red)
  { text: "멈춰! 손 떼, 여보. 아쉬워도 안 돼~", color: "red", bpm: [0, 0], dur: [10, 20] },
  { text: "완전히 정지. 숨 골라. 여보 벌써 한계야?", color: "red", bpm: [0, 0], dur: [15, 25] },
  { text: "가만히 있어. 아무것도 하지 마. 할 수 있지, 여보?", color: "red", bpm: [0, 0], dur: [10, 15] },
  { text: "잠깐 쉬자. 여보니까 봐주는 거야, 이번만", color: "red", bpm: [0, 0], dur: [8, 12] },
];
