export type PhaseStatus = "done" | "in_progress" | "pending";

export type PhaseCard = {
  phase: string;
  title: string;
  status: PhaseStatus;
  summary: string;
  completed: string[];
  remaining: string[];
  notes?: string[];
};

export const phaseCards: PhaseCard[] = [
  {
    phase: "01",
    title: "Khung du an & Landing page",
    status: "done",
    summary: "Hoan tat landing page responsive va cau truc section theo ke hoach.",
    completed: [
      "Monorepo khoi tao voi apps/web va apps/server",
      "Landing page: Navbar, Hero, Use cases, How it works, Features, Footer",
      "Theme + font Be Vietnam Pro + metadata co ban"
    ],
    remaining: ["Khong dung i18n (chi 1 ngon ngu tieng Viet)."],
    notes: ["Lighthouse chua chot chi so chinh thuc."]
  },
  {
    phase: "02",
    title: "Trang Rooms & Modal tao phong",
    status: "done",
    summary: "Day du flow tao phong/join phong, co private password modal.",
    completed: [
      "Route /rooms voi data that tu backend",
      "RoomCard, skeleton loading, empty state",
      "CreateRoomModal va JoinPrivateModal",
      "Flow redirect sang /room/[id]"
    ],
    remaining: ["Khong con hang muc ton dong."]
  },
  {
    phase: "03",
    title: "Giao dien phong nhac",
    status: "done",
    summary: "Room UI day du panel, responsive va cac tuong tac co ban.",
    completed: [
      "Layout desktop/tablet/mobile + bottom sheet",
      "Player UI, Queue panel, Members panel, Chat panel",
      "Emoji floating, vote skip UI, overlay loi nhan AI",
      "Toast noi bo cho thao tac chinh"
    ],
    remaining: ["Dang tiep tuc noi realtime theo phase sau."]
  },
  {
    phase: "04",
    title: "Auth UI & Trigger dang nhap",
    status: "done",
    summary: "Da co luong login modal va trigger theo ngu canh thao tac.",
    completed: [
      "AuthProvider toan app",
      "Navbar chuyen trang thai guest/member",
      "Trigger login cho chat/reaction/add song/vote",
      "Trang /profile hien thi thong tin nguoi dung"
    ],
    remaining: ["Khong con hang muc ton dong."]
  },
  {
    phase: "05",
    title: "Polish UI/UX",
    status: "done",
    summary: "Da them loading/error/not-found va tang do on dinh UX.",
    completed: [
      "Global not-found va error page tuy bien",
      "Loading states cho /rooms va /room/[id]",
      "ErrorState component dung chung",
      "Bo sung aria-label cho nhom tuong tac chinh"
    ],
    remaining: ["Chua audit accessibility day du bang tool tu dong."]
  },
  {
    phase: "06",
    title: "Backend ha tang & API co ban",
    status: "done",
    summary: "Server da dung Supabase (Prisma) va Upstash Redis that.",
    completed: [
      "apps/server: Express + TypeScript + scripts dev/build",
      "API: /health, /api/auth/guest, CRUD /api/rooms",
      "API: /api/youtube/search co cache TTL",
      "Auth middleware JWT co ban",
      "Frontend /rooms goi danh sach phong tu backend",
      "Flow tao phong frontend dung API POST /api/rooms",
      "Prisma schema + repository DB/fallback memory",
      "Prisma migrate thanh cong tren Supabase",
      "Upstash Redis ket noi thanh cong (cache mode = redis)",
      "Health check dependency: /health/deps"
    ],
    remaining: ["Chua chuyen toan bo room data/chat sang persistent storage."],
    notes: ["Dat muc tieu phase 06 cho local + cloud dependencies."]
  },
  {
    phase: "07",
    title: "Socket.IO Realtime Sync",
    status: "done",
    summary: "Da hoan thanh realtime player/queue/member va checkpoint sync <1s.",
    completed: [
      "Socket.IO server tich hop vao backend",
      "Auth handshake token khi ket noi socket",
      "Events room:join/room:leave + member count realtime",
      "Events player:play/pause/seek/next + broadcast state",
      "Heartbeat cho drift correction co ban",
      "Frontend /room/[id] da ket noi socket va nhan state realtime",
      "Khoa quyen host-only cho dieu khien player",
      "Dong bo queue:add/queue:remove realtime qua socket",
      "Tich hop YouTube IFrame player that trong room",
      "Checkpoint sync 2 client dat drift <1s (script checkpoint:sync)"
    ],
    remaining: ["Khong con hang muc ton dong."]
  },
  {
    phase: "08",
    title: "Chat, Queue, Vote, Google Auth",
    status: "done",
    summary: "Da hoan thanh chat/reaction/vote realtime, Google OAuth va API live stats.",
    completed: [
      "Chat realtime qua events chat:send/chat:message",
      "Reaction realtime qua events reaction:send/reaction:added",
      "Vote skip realtime qua events vote:cast/vote:state",
      "Vote skip theo nguong 60% thanh vien online (tu dong chuyen bai)",
      "Google OAuth that: frontend login + backend verify id_token + upsert user Prisma",
      "API /api/stats/live + frontend landing live counter",
      "Tim kiem bai hat YouTube that + them bai bang URL YouTube trong room"
    ],
    remaining: ["Khong con hang muc ton dong."]
  },
  {
    phase: "09",
    title: "AI Voice Radio",
    status: "in_progress",
    summary: "Da chuyen TTS sang FPT AI + event voice realtime + fallback client speech.",
    completed: [
      "TTS service layer backend co cache (Redis/Memory)",
      "Ngung su dung ElevenLabs, chuyen provider TTS sang FPT AI",
      "Trigger realtime voice_message_start/voice_message_done qua Socket.IO",
      "Room UI nhan event voice va fallback Web Speech API khi khong co audio URL"
    ],
    remaining: [
      "Toi uu luu tru audio TTS len storage thay vi cache/data URL",
      "Bo sung co che retry/backoff va observability cho FPT AI TTS"
    ]
  },
  {
    phase: "10",
    title: "Deploy & Launch",
    status: "pending",
    summary: "Chua bat dau.",
    completed: [],
    remaining: [
      "Deploy backend Railway va frontend Vercel",
      "Set env production + CORS + OAuth redirect",
      "Test production 2 thiet bi",
      "Monitoring logs + uptime monitor"
    ]
  }
];

export const executionRules: string[] = [
  "Uu tien frontend-first, chi backend khi UI/UX da duoc duyet.",
  "Khong thay doi pham vi phase dang lam neu chua ghi ro vao board.",
  "Moi thay doi phai cap nhat trang thai phase tuong ung.",
  "Cac muc chua dat plan goc phai ghi ro o Remaining/Notes."
];
