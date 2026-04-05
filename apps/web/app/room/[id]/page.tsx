"use client";

import { FormEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/common/error-state";

type RoomPageProps = {
  params: { id: string };
};

type QueueItem = {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
};

type Member = {
  id: string;
  name: string;
  role: "host" | "member" | "guest";
  avatar: string;
};

type ChatMessage = {
  id: string;
  type: "text" | "system";
  user?: string;
  content: string;
};

type ReactionItem = {
  id: string;
  emoji: string;
  left: number;
};

type ToastItem = {
  id: string;
  message: string;
  icon: string;
};

const searchPool = [
  {
    id: "s1",
    title: "Nơi Này Có Anh",
    channel: "Sơn Tùng M-TP",
    thumbnail:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "s2",
    title: "Waiting For You",
    channel: "MONO",
    thumbnail:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "s3",
    title: "Bước Qua Mùa Cô Đơn",
    channel: "Vũ",
    thumbnail:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "s4",
    title: "Có Chàng Trai Viết Lên Cây",
    channel: "Phan Mạnh Quỳnh",
    thumbnail:
      "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?auto=format&fit=crop&w=600&q=80"
  }
];

const initialQueue: QueueItem[] = [
  {
    id: "q1",
    title: "Nơi Này Có Anh",
    channel: "Sơn Tùng M-TP",
    thumbnail:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "q2",
    title: "Bước Qua Mùa Cô Đơn",
    channel: "Vũ",
    thumbnail:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "q3",
    title: "Chạy Ngay Đi",
    channel: "Sơn Tùng M-TP",
    thumbnail:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=600&q=80"
  }
];

const members: Member[] = [
  { id: "m1", name: "Huy", role: "host", avatar: "H" },
  { id: "m2", name: "Linh", role: "member", avatar: "L" },
  { id: "m3", name: "Tú", role: "member", avatar: "T" },
  { id: "m4", name: "Khách 3491", role: "guest", avatar: "K" }
];

const initialMessages: ChatMessage[] = [
  { id: "c1", type: "system", content: "Huy đã tạo phòng." },
  { id: "c2", type: "text", user: "Linh", content: "Bài này mở đầu đúng mood tối nay luôn." },
  { id: "c3", type: "text", user: "Tú", content: "Chuẩn, để mình thêm vài bài chill nữa nhé." }
];

const emojis = ["❤️", "🔥", "👏", "🎧", "🥹", "✨"];

export default function RoomPage({ params }: RoomPageProps) {
  const { user, requestLogin } = useAuth();

  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<"queue" | "members" | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatInput, setChatInput] = useState("");
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [votes, setVotes] = useState(1);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hasError, setHasError] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fullVoiceText = "Một lời nhắn ẩn danh: Chúc bạn tối nay thật bình yên và ngủ thật ngon.";
  const totalMembers = members.length;
  const role = user ? "host" : "guest";

  const filteredResults = useMemo(() => {
    if (!search.trim()) return searchPool;
    const keyword = search.toLowerCase();
    return searchPool.filter(
      (item) =>
        item.title.toLowerCase().includes(keyword) || item.channel.toLowerCase().includes(keyword)
    );
  }, [search]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "1") {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    if (!showVoiceOverlay) {
      setTypedText("");
      return;
    }

    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setTypedText(fullVoiceText.slice(0, i));
      if (i >= fullVoiceText.length) {
        clearInterval(typeTimer);
      }
    }, 28);

    const closeTimer = setTimeout(() => setShowVoiceOverlay(false), 4300);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(closeTimer);
    };
  }, [showVoiceOverlay]);

  const pushToast = (message: string, icon = "ℹ️") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  };

  const requireLogin = (message: string, action: () => void) => {
    if (!user) {
      requestLogin({ message }, action);
      return;
    }
    action();
  };

  const handleCopyLink = async () => {
    const roomLink = `${window.location.origin}/room/${params.id}`;
    await navigator.clipboard.writeText(roomLink);
    pushToast("Đã copy link phòng", "✅");
  };

  const handleAddSong = (item: QueueItem) => {
    requireLogin("Đăng nhập để thêm bài vào hàng đợi.", () => {
      setQueue((prev) => [...prev, { ...item, id: `${item.id}-${Date.now()}` }]);
      pushToast(`Đã thêm "${item.title}" vào hàng đợi`, "🎵");
    });
  };

  const handleRemoveSong = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    pushToast("Đã xóa bài khỏi hàng đợi", "🗑️");
  };

  const handleSendChat = (event: FormEvent) => {
    event.preventDefault();
    requireLogin("Đăng nhập để gửi tin nhắn trong phòng.", () => {
      const trimmed = chatInput.trim();
      if (!trimmed) return;
      setChatMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, type: "text", user: "Bạn", content: trimmed }
      ]);
      setChatInput("");
    });
  };

  const handleReaction = (emoji: string) => {
    requireLogin("Đăng nhập để thả cảm xúc cùng mọi người.", () => {
      const id = `${Date.now()}-${Math.random()}`;
      const left = Math.floor(Math.random() * 85);
      setReactions((prev) => [...prev, { id, emoji, left }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((item) => item.id !== id));
      }, 1800);
    });
  };

  const handleVote = () => {
    if (hasVoted) return;
    requireLogin("Đăng nhập để bỏ phiếu skip bài hát.", () => {
      setHasVoted(true);
      setVotes((prev) => prev + 1);
    });
  };

  return (
    <>
      <main className="min-h-screen bg-bg pb-28 md:pb-8">
        <header className="border-b border-line/70">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <Link href="/" className="text-lg font-extrabold">
                Listen<span className="text-accent">WithMe</span>
              </Link>
              <h1 className="text-xl font-bold">Phòng: {decodeURIComponent(params.id)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
                {members.length} trực tuyến
              </span>
              <button
                onClick={handleCopyLink}
                aria-label="Sao chép link phòng"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium"
              >
                Share/Copy link
              </button>
              {role === "host" ? (
                <button className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-slate-950">
                  Cài đặt phòng
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-4 py-5">
          {hasError ? (
            <ErrorState
              title="Không thể kết nối phòng"
              message="Mất kết nối tạm thời với dữ liệu phòng. Vui lòng thử lại."
              onRetry={() => window.location.assign(`/room/${params.id}`)}
            />
          ) : null}

          {!hasError ? (
            <div className="grid gap-4 lg:grid-cols-12">
          <aside className="hidden rounded-2xl border border-line bg-card p-4 lg:col-span-3 lg:block">
            <QueuePanel queue={queue} onRemove={handleRemoveSong} />
            <div className="my-4 border-t border-line" />
            <MembersPanel members={members} />
          </aside>

          <section className="space-y-4 md:col-span-1 lg:col-span-6">
            <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80"
                  alt="Ảnh bài hát đang phát"
                  className="h-56 w-full object-cover sm:h-72"
                />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold">Nơi Này Có Anh</h2>
              <p className="mt-1 text-sm text-muted">Sơn Tùng M-TP</p>

              <div className="mt-4 h-2 w-full rounded-full bg-surface">
                <div className="h-2 w-1/3 rounded-full bg-accent" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>01:24</span>
                <span>04:50</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium">
                  Pause
                </button>
                <button className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium">
                  Seek +10s
                </button>
                <button className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium">
                  Next
                </button>
                <button
                  onClick={() => setShowVoiceOverlay(true)}
                  className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent"
                >
                  Demo lời nhắn AI
                </button>
              </div>

              <div className="relative mt-5 rounded-xl border border-line bg-surface p-3">
                <p className="text-sm font-semibold">Thả cảm xúc</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      aria-label={`Thả cảm xúc ${emoji}`}
                      className="rounded-lg border border-line bg-card px-3 py-2 text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-2 h-24 overflow-hidden">
                  {reactions.map((item) => (
                    <span
                      key={item.id}
                      className="reaction-bubble"
                      style={{ left: `${item.left}%` }}
                    >
                      {item.emoji}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Bỏ phiếu skip</p>
                  <p className="text-xs text-muted">
                    {votes}/{totalMembers}
                  </p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-card">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{ width: `${(votes / totalMembers) * 100}%` }}
                  />
                </div>
                <button
                  onClick={handleVote}
                  disabled={hasVoted}
                  aria-label="Bỏ phiếu skip bài hát"
                  className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {hasVoted ? "Bạn đã vote" : "Bỏ phiếu skip"}
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-card p-4 lg:hidden">
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setSheet("queue")}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  Mở Queue
                </button>
                <button
                  onClick={() => setSheet("members")}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                >
                  Mở Thành viên
                </button>
              </div>
              <SearchPanel
                search={search}
                setSearch={setSearch}
                results={filteredResults}
                onAdd={handleAddSong}
              />
            </article>
          </section>

          <aside className="rounded-2xl border border-line bg-card p-4 md:col-span-1 lg:col-span-3">
            {!user ? (
              <div className="mb-3 rounded-lg border border-accent/40 bg-accent-soft/20 p-3 text-sm">
                <p className="font-semibold text-accent">
                  Đang xem với tư cách khách - Đăng nhập để tham gia
                </p>
                <button
                  onClick={() =>
                    requestLogin({ message: "Đăng nhập để gửi tin nhắn và tương tác trong phòng." })
                  }
                  className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : null}
            <ChatPanel
              messages={chatMessages}
              input={chatInput}
              onChangeInput={setChatInput}
              onSubmit={handleSendChat}
              endRef={chatEndRef}
            />
          </aside>
            </div>
          ) : null}
        </section>
      </main>

      {sheet ? (
        <div className="fixed inset-0 z-40 bg-slate-950/60 p-4 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-auto rounded-t-2xl border border-line bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {sheet === "queue" ? "Hàng đợi bài hát" : "Thành viên trong phòng"}
              </h3>
              <button onClick={() => setSheet(null)} className="text-sm text-muted">
                Đóng
              </button>
            </div>
            {sheet === "queue" ? (
              <>
                <SearchPanel
                  search={search}
                  setSearch={setSearch}
                  results={filteredResults}
                  onAdd={handleAddSong}
                />
                <div className="my-4 border-t border-line" />
                <QueuePanel queue={queue} onRemove={handleRemoveSong} />
              </>
            ) : (
              <MembersPanel members={members} />
            )}
          </div>
        </div>
      ) : null}

      {showVoiceOverlay ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-accent/50 bg-card p-6 text-center shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Radio lời nhắn ẩn danh
            </p>
            <p className="mt-4 min-h-14 text-lg font-semibold leading-relaxed">{typedText}</p>
            <div className="mt-4 flex items-end justify-center gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <span
                  key={i}
                  className="eq-bar inline-block h-8 w-1 rounded-full bg-accent"
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed right-4 top-4 z-[60] space-y-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-sm text-text shadow-lg"
          >
            <span>{item.icon}</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function SearchPanel({
  search,
  setSearch,
  results,
  onAdd
}: {
  search: string;
  setSearch: (value: string) => void;
  results: QueueItem[];
  onAdd: (item: QueueItem) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">Tìm kiếm bài hát</label>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
        placeholder="Nhập tên bài hoặc nghệ sĩ"
      />
      <div className="mt-3 space-y-2">
        {results.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2"
          >
            <img src={item.thumbnail} alt={item.title} className="h-12 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted">{item.channel}</p>
            </div>
            <button
              onClick={() => onAdd(item)}
              className="rounded-md border border-line px-2 py-1 text-xs font-semibold"
            >
              Thêm
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function QueuePanel({
  queue,
  onRemove
}: {
  queue: QueueItem[];
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-bold">Hàng đợi</h3>
      <div className="mt-3 space-y-2">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-lg border p-2 ${
              index === 0 ? "border-accent/70 bg-accent-soft/25" : "border-line bg-surface"
            }`}
          >
            <img src={item.thumbnail} alt={item.title} className="h-12 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted">{item.channel}</p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="rounded-md border border-line px-2 py-1 text-xs text-muted"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersPanel({ members }: { members: Member[] }) {
  return (
    <div>
      <h3 className="text-lg font-bold">Thành viên</h3>
      <div className="mt-3 space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-line bg-surface p-2"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card text-sm font-bold">
                {member.avatar}
              </span>
              <span className="text-sm font-medium">{member.name}</span>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                member.role === "host"
                  ? "bg-accent-soft text-accent"
                  : member.role === "member"
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-slate-500/20 text-slate-200"
              }`}
            >
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
  input,
  onChangeInput,
  onSubmit,
  endRef
}: {
  messages: ChatMessage[];
  input: string;
  onChangeInput: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  endRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex h-[70vh] flex-col">
      <h3 className="text-lg font-bold">Chat phòng</h3>
      <div className="mt-3 flex-1 space-y-2 overflow-auto rounded-xl border border-line bg-surface p-3">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "system" ? (
              <p className="rounded-md bg-accent-soft/40 px-2 py-1 text-xs text-accent">
                {message.content}
              </p>
            ) : (
              <p className="text-sm">
                <span className="font-semibold">{message.user}: </span>
                <span className="text-muted">{message.content}</span>
              </p>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => onChangeInput(event.target.value)}
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
          placeholder="Nhập tin nhắn..."
        />
        <button className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-slate-950">
          Gửi
        </button>
      </form>
    </div>
  );
}
