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
    title: "Khung dự án & Landing page",
    status: "done",
    summary: "Hoàn tất landing page responsive với cấu trúc section theo kế hoạch.",
    completed: [
      "Monorepo khởi tạo với apps/web và apps/server",
      "Landing page: Navbar, Hero, Use cases, How it works, Features, Footer",
      "Theme + font Be Vietnam Pro + metadata cơ bản"
    ],
    remaining: ["Chưa làm i18n (theo yêu cầu đã bỏ, chỉ dùng tiếng Việt)."],
    notes: ["Lighthouse chưa chốt lại số đo chính thức trong tài liệu."]
  },
  {
    phase: "02",
    title: "Trang Rooms & Modal tạo phòng",
    status: "done",
    summary: "Đủ flow mock tạo phòng/join phòng, có private password modal.",
    completed: [
      "Route /rooms với mock data",
      "RoomCard, skeleton loading, empty state",
      "CreateRoomModal và JoinPrivateModal",
      "Flow redirect sang /room/[id]"
    ],
    remaining: ["Chưa gọi API thật từ backend (đang mock data phía web)."]
  },
  {
    phase: "03",
    title: "Giao diện phòng nhạc UI tĩnh",
    status: "done",
    summary: "Room UI đầy đủ panel, responsive và các tương tác mock.",
    completed: [
      "Layout desktop/tablet/mobile + bottom sheet",
      "Player UI, Queue panel, Members panel, Chat panel",
      "Emoji floating, vote skip UI, overlay lời nhắn AI",
      "Toast nội bộ cho các thao tác chính"
    ],
    remaining: ["Chưa kết nối realtime socket và YouTube IFrame thật."]
  },
  {
    phase: "04",
    title: "Auth UI & Trigger đăng nhập",
    status: "done",
    summary: "Đã có trải nghiệm guest/member theo ngữ cảnh với login modal.",
    completed: [
      "AuthProvider mock toàn app",
      "Navbar chuyển trạng thái guest/member",
      "Trigger login cho chat/reaction/add song/vote",
      "Trang /profile hiển thị dữ liệu tài khoản mock"
    ],
    remaining: ["Chưa tích hợp NextAuth + Google OAuth thật (mới mock UI flow)."]
  },
  {
    phase: "05",
    title: "Polish UI/UX",
    status: "done",
    summary: "Đã thêm loading/error/not-found và tăng độ ổn định UX.",
    completed: [
      "Global not-found và error page tùy biến",
      "Loading states cho /rooms và /room/[id]",
      "ErrorState component dùng chung",
      "Bổ sung aria-label cho nhóm tương tác chính"
    ],
    remaining: ["Chưa audit accessibility đầy đủ bằng tool tự động."]
  },
  {
    phase: "06",
    title: "Backend hạ tầng & API cơ bản",
    status: "in_progress",
    summary: "Server chạy local, có API cơ bản; đang dùng fallback memory.",
    completed: [
      "apps/server: Express + TypeScript + scripts dev/build",
      "API: /health, /api/auth/guest, CRUD /api/rooms",
      "API: /api/youtube/search có cache TTL",
      "Auth middleware JWT cơ bản"
    ],
    remaining: [
      "Chưa tích hợp Prisma + Supabase thật",
      "Chưa dùng Redis thật (mới fallback memory nếu thiếu REDIS_URL)",
      "Frontend /rooms chưa nối API thật"
    ],
    notes: ["Phase 06 đã chạy local nhưng chưa đạt mức production-ready theo plan gốc."]
  },
  {
    phase: "07",
    title: "Socket.IO Realtime Sync",
    status: "pending",
    summary: "Chưa bắt đầu.",
    completed: [],
    remaining: [
      "Socket server + auth handshake",
      "Events room join/leave và player play/pause/seek/next",
      "Drift correction và sync join muộn",
      "Tích hợp YouTube IFrame thật"
    ]
  },
  {
    phase: "08",
    title: "Chat, Queue, Vote, Google Auth",
    status: "pending",
    summary: "Chưa bắt đầu.",
    completed: [],
    remaining: [
      "Chat/reaction realtime qua socket",
      "Queue add/remove và vote skip theo ngưỡng",
      "Google OAuth thật + lưu user DB",
      "API stats cho live counter"
    ]
  },
  {
    phase: "09",
    title: "AI Voice Radio",
    status: "pending",
    summary: "Chưa bắt đầu.",
    completed: [],
    remaining: [
      "TTS service ElevenLabs + fallback FPT.AI",
      "Cache TTS Redis + Supabase Storage",
      "Trigger voice_message_start/done",
      "Fallback Web Speech API phía client"
    ]
  },
  {
    phase: "10",
    title: "Deploy & Launch",
    status: "pending",
    summary: "Chưa bắt đầu.",
    completed: [],
    remaining: [
      "Deploy backend Railway và frontend Vercel",
      "Set env production + CORS + OAuth redirect",
      "Test production 2 thiết bị",
      "Monitoring logs + uptime monitor"
    ]
  }
];

export const executionRules: string[] = [
  "Ưu tiên frontend-first, chỉ backend khi UI/UX đã được duyệt.",
  "Không thay đổi phạm vi phase đang làm nếu chưa ghi rõ vào board.",
  "Mỗi thay đổi phải cập nhật trạng thái phase tương ứng.",
  "Các mục chưa đạt plan gốc phải ghi rõ ở phần Remaining/Notes."
];

