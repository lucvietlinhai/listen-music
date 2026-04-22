"use client";

import { FormEvent, RefObject, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { YoutubePlayer } from "@/components/room/youtube-player";
import { getGuestToken, resolveYoutubeUrl, searchYoutubeVideos, type YoutubeVideoResult } from "@/lib/api";

type RoomPageProps = {
  params: { id: string };
};

type QueueItem = {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  requestMessage?: string;
};

type SearchResultItem = {
  videoId: string;
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
  createdAt?: number;
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

type PlaybackState = {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
  hostId: string;
};

const getAdjustedTime = (state: Pick<PlaybackState, "currentTime" | "isPlaying" | "updatedAt">) => {
  if (!state.isPlaying) return state.currentTime;
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  return Math.max(0, state.currentTime + elapsed);
};

const initialQueue: QueueItem[] = [
  {
    id: "q1",
    videoId: "hLQl3WQQoQ0",
    title: "Nơi Này Có Anh",
    channel: "Sơn Tùng M-TP",
    thumbnail:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "q2",
    videoId: "V5BZrR3YkJY",
    title: "Bước Qua Mùa Cô Đơn",
    channel: "Vũ",
    thumbnail:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "q3",
    videoId: "eXz9Hf2eN6Q",
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

const decodeJwtPayload = (token: string): { userId?: string } | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as { userId?: string };
  } catch {
    return null;
  }
};

const speakVietnamese = (text: string) =>
  new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("vi"));
    const preferredFemale = viVoices.find((voice) =>
      /(female|woman|nu|linh|mai|chi|vy|vbee|google)/i.test(`${voice.name} ${voice.voiceURI}`)
    );
    const preferred = preferredFemale ?? viVoices[0];
    if (preferred) {
      utter.voice = preferred;
      utter.lang = preferred.lang;
    } else {
      utter.lang = "vi-VN";
    }
    utter.rate = 1;
    utter.pitch = preferredFemale ? 1.15 : 1.05;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });

const playAudioUrl = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error("AUDIO_PLAYBACK_FAILED"));
    void audio.play().catch((error) => {
      reject(error);
    });
  });

export default function RoomPage({ params }: RoomPageProps) {
  const { user, requestLogin } = useAuth();

  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [lastOrderMessage, setLastOrderMessage] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [sheet, setSheet] = useState<"queue" | "members" | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const [votes, setVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [voiceText, setVoiceText] = useState(
    "Một lời nhắn ẩn danh: Chúc bạn tối nay thật bình yên và ngủ thật ngon."
  );
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hasError, setHasError] = useState(false);
  const [onlineCount, setOnlineCount] = useState(members.length);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    videoId: "hLQl3WQQoQ0",
    currentTime: 84,
    isPlaying: false,
    updatedAt: Date.now(),
    hostId: ""
  });
  const [currentUserId, setCurrentUserId] = useState("");
  const [displayTime, setDisplayTime] = useState(84);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const displayTimeRef = useRef(84);
  const hostIdRef = useRef("");
  const totalMembers = Math.max(onlineCount, 1);
  const role = user ? "host" : "guest";
  const canControlPlayer = playback.hostId === currentUserId || !playback.hostId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    const keyword = search.trim();
    if (!keyword) {
      setSearchResults([]);
      setSearchError("");
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError("");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const items = await searchYoutubeVideos(keyword);
          if (cancelled) return;
          setSearchResults(
            items.map((item) => ({
              videoId: item.videoId,
              title: item.title,
              channel: item.channelTitle,
              thumbnail: item.thumbnail
            }))
          );
        } catch {
          if (cancelled) return;
          setSearchError("Không thể tìm kiếm YouTube lúc này");
        } finally {
          if (cancelled) return;
          setSearchLoading(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    displayTimeRef.current = displayTime;
  }, [displayTime]);

  useEffect(() => {
    hostIdRef.current = playback.hostId;
  }, [playback.hostId]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("error") === "1") {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

    const setup = async () => {
      try {
        const token = await getGuestToken();
        if (!mounted) return;
        const decoded = decodeJwtPayload(token);
        if (decoded?.userId) {
          setCurrentUserId(decoded.userId);
        }

        const socket = io(socketUrl, {
          auth: { token },
          transports: ["websocket"]
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          if (!mounted) return;
          setIsSocketConnected(true);
          socket.emit("room:join", { roomId: params.id });
        });

        socket.on("disconnect", () => {
          if (!mounted) return;
          setIsSocketConnected(false);
        });

        socket.on(
          "room:state",
          (payload: {
            members: number;
            state: PlaybackState;
            queue: QueueItem[];
            chat: Array<{ id: string; type: "text"; user: string; content: string; createdAt: number }>;
            vote: { count: number; voters: string[] };
          }) => {
            if (!mounted) return;
            setOnlineCount(payload.members);
            setPlayback(payload.state);
            setDisplayTime(getAdjustedTime(payload.state));
            setQueue(payload.queue);
            setChatMessages(payload.chat);
            setVotes(payload.vote.count);
            setHasVoted(payload.vote.voters.includes(decoded?.userId ?? ""));
          }
        );

        socket.on("room:member_joined", (payload: { members: number }) => {
          if (!mounted) return;
          setOnlineCount(payload.members);
        });

        socket.on("room:member_left", (payload: { members: number }) => {
          if (!mounted) return;
          setOnlineCount(payload.members);
        });

        socket.on("player:state", (payload: { state: PlaybackState }) => {
          if (!mounted) return;
          setPlayback(payload.state);
          setDisplayTime(getAdjustedTime(payload.state));
        });

        socket.on("player:heartbeat", (payload: { currentTime: number; isPlaying: boolean; updatedAt: number }) => {
          if (!mounted) return;
          const estimated = getAdjustedTime({
            currentTime: payload.currentTime,
            isPlaying: payload.isPlaying,
            updatedAt: payload.updatedAt
          });
          const diff = Math.abs(displayTimeRef.current - estimated);
          setPlayback((prev) => ({
            ...prev,
            currentTime: diff > 0.75 ? estimated : prev.currentTime,
            isPlaying: payload.isPlaying,
            updatedAt: payload.updatedAt
          }));
          if (diff > 0.75) {
            setDisplayTime(estimated);
          }
        });

        socket.on("queue:updated", (payload: { queue: QueueItem[] }) => {
          if (!mounted) return;
          setQueue(payload.queue);
        });

        socket.on("chat:message", (payload: { message: ChatMessage }) => {
          if (!mounted) return;
          setChatMessages((prev) => [...prev, payload.message]);
        });

        socket.on("reaction:added", (payload: { emoji: string; id: string }) => {
          if (!mounted) return;
          const left = Math.floor(Math.random() * 85);
          setReactions((prev) => [...prev, { id: payload.id, emoji: payload.emoji, left }]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((item) => item.id !== payload.id));
          }, 1800);
        });

        socket.on("vote:state", (payload: { count: number; voters: string[]; members: number }) => {
          if (!mounted) return;
          setVotes(payload.count);
          setOnlineCount(payload.members);
          setHasVoted(payload.voters.includes(decoded?.userId ?? ""));
        });

        socket.on("auth:error", (payload: { code: string }) => {
          if (!mounted) return;
          if (payload.code === "HOST_ONLY_CONTROL") {
            pushToast("Chỉ host mới có quyền điều khiển player", "⛔");
          }
        });

        socket.on("room:host_changed", (payload: { hostId: string }) => {
          if (!mounted) return;
          setPlayback((prev) => ({
            ...prev,
            hostId: payload.hostId
          }));
          pushToast("Host đã thay đổi trong phòng", "👑");
        });
        socket.on("voice_message_start", (payload: { text: string }) => {
          if (!mounted) return;
          setVoiceText(payload.text);
          setShowVoiceOverlay(true);
        });

        socket.on(
          "voice_message_done",
          (payload: {
            text: string;
            audioUrl: string | null;
            provider: string;
            fallbackWebSpeech: boolean;
            resumeAfterVoice?: boolean;
            error?: string;
          }) => {
            if (!mounted) return;
            const shouldResumePlayback =
              Boolean(payload.resumeAfterVoice) && Boolean(decoded?.userId) && decoded?.userId === hostIdRef.current;

            const playbackPromise = payload.audioUrl
              ? playAudioUrl(payload.audioUrl).catch(() => speakVietnamese(payload.text))
              : payload.fallbackWebSpeech
                ? speakVietnamese(payload.text)
                : Promise.resolve();

            if (shouldResumePlayback) {
              void playbackPromise.finally(() => {
                socket.emit("voice:finished", { roomId: params.id });
              });
            }
            if (payload.provider === "mock") {
              pushToast("Voice fallback trình duyệt (mock)", "⚠️");
              if (payload.error) {
                console.warn("voice provider error", payload.error);
                pushToast(`FPT AI lỗi: ${payload.error.slice(0, 60)}`, "⚠️");
              }
              return;
            }
            pushToast(`Voice ready (${payload.provider})`, "📻");
          }
        );
      } catch {
        setIsSocketConnected(false);
      }
    };

    void setup();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("room:leave");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [params.id]);

  useEffect(() => {
    if (!showVoiceOverlay) {
      setTypedText("");
      return;
    }

    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setTypedText(voiceText.slice(0, i));
      if (i >= voiceText.length) {
        clearInterval(typeTimer);
      }
    }, 28);

    const closeTimer = setTimeout(() => setShowVoiceOverlay(false), 6000);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(closeTimer);
    };
  }, [showVoiceOverlay, voiceText]);

  useEffect(() => {
    if (!playback.isPlaying) return;
    const timer = setInterval(() => {
      setDisplayTime((prev) => prev + 0.25);
    }, 250);
    return () => clearInterval(timer);
  }, [playback.isPlaying]);

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

  const formatSeconds = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const min = Math.floor(safe / 60)
      .toString()
      .padStart(2, "0");
    const sec = (safe % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  const emitPlayerEvent = (
    event: "player:play" | "player:pause" | "player:seek" | "player:next",
    payload?: Record<string, unknown>
  ) => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }
    socket.emit(event, { roomId: params.id, ...payload });
  };

  const handleCopyLink = async () => {
    const roomLink = `${window.location.origin}/room/${params.id}`;
    await navigator.clipboard.writeText(roomLink);
    pushToast("Đã copy link phòng", "✅");
  };

  const handleAddSong = (item: SearchResultItem, requestMessageInput?: string) => {
    requireLogin("Đăng nhập để thêm bài vào hàng đợi.", () => {
      const nextItem = { ...item, id: `${item.videoId}-${Date.now()}` };
      const message = (requestMessageInput ?? orderMessage).trim().slice(0, 220);
      socketRef.current?.emit("queue:add", {
        roomId: params.id,
        item: {
          id: nextItem.id,
          videoId: nextItem.videoId,
          title: nextItem.title,
          channel: nextItem.channel,
          thumbnail: nextItem.thumbnail,
          requestMessage: message || undefined
        }
      });
      if (message) {
        setLastOrderMessage(message);
        /* socketRef.current?.emit("voice:request", {
          roomId: params.id,
          text: `Lời nhắn cho bài ${item.title}: ${message}`
        }); */
      }
      setOrderMessage("");
      pushToast(`Đã thêm "${item.title}" vào hàng đợi`, "🎵");
    });
  };

  const handleAddFromUrl = () => {
    requireLogin("Đăng nhập để thêm bài từ URL YouTube.", () => {
      const raw = youtubeUrl.trim();
      if (!raw) return;

      setUrlLoading(true);
      void (async () => {
        try {
          const item = await resolveYoutubeUrl(raw);
          handleAddSong({
            videoId: item.videoId,
            title: item.title,
            channel: item.channelTitle,
            thumbnail: item.thumbnail
          });
          setYoutubeUrl("");
        } catch {
          pushToast("URL YouTube không hợp lệ hoặc không thể lấy bài", "⚠️");
        } finally {
          setUrlLoading(false);
        }
      })();
    });
  };

  const handleRemoveSong = (id: string) => {
    socketRef.current?.emit("queue:remove", { roomId: params.id, id });
    pushToast("Đã gửi yêu cầu xóa bài khỏi hàng đợi", "🗑️");
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
      socketRef.current?.emit("vote:cast", { roomId: params.id });
    });
  };

  const handleSendChatSocket = (event: FormEvent) => {
    event.preventDefault();
    requireLogin("Đăng nhập để gửi tin nhắn trong phòng.", () => {
      const trimmed = chatInput.trim();
      if (!trimmed) return;
      socketRef.current?.emit("chat:send", { roomId: params.id, content: trimmed });
      setChatInput("");
    });
  };

  const handleReactionSocket = (emoji: string) => {
    requireLogin("Đăng nhập để thả cảm xúc cùng mọi người.", () => {
      socketRef.current?.emit("reaction:send", { roomId: params.id, emoji });
    });
  };

  const handleVoteSocket = () => {
    if (hasVoted) return;
    requireLogin("Đăng nhập để bỏ phiếu skip bài hát.", () => {
      socketRef.current?.emit("vote:cast", { roomId: params.id });
    });
  };

  /* legacy voice handlers removed (kept only for temporary source-encoding cleanup)
  const handleVoiceRequest = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }
    socket.emit("voice:request", {
      roomId: params.id,
      text: "Má»™t lá»i nháº¯n áº©n danh: ChÃºc báº¡n tá»‘i nay tháº­t bÃ¬nh yÃªn vÃ  ngá»§ tháº­t ngon."
    });
  };

  const handleVoiceRequestVi = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }
    socket.emit("voice:request", {
      roomId: params.id,
      text: "Một lời nhắn ẩn danh: Chúc bạn tối nay thật bình yên và ngủ thật ngon."
    });
  };

  const handlePlayRealVoiceMessage = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }

    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn thật để phát. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    socket.emit("voice:request", {
      roomId: params.id,
      text
    });
    pushToast("Đã gửi yêu cầu phát lời nhắn thật", "📻");
  };

  const handlePlayRealVoiceMessageV2 = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }

    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn thật để phát. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    socket.emit("voice:request", {
      roomId: params.id,
      text
    });
    pushToast("Đã gửi yêu cầu phát lời nhắn thật", "📻");
  };

  };
  const handlePlayRealFptVoice = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }

    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn để phát. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    socket.emit("voice:request", { roomId: params.id, text });
    pushToast("Đã gửi phát lời nhắn với FPT AI", "📻");
  };
  */

  const handlePlayRealFptVoiceClean = () => {
    const socket = socketRef.current;
    if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }

    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn để phát. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    socket.emit("voice:request", { roomId: params.id, text });
    pushToast("Đã gửi phát lời nhắn với FPT AI", "📻");
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
                {onlineCount} trực tuyến
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
                <SearchPanel
                  search={search}
                  setSearch={setSearch}
                  results={searchResults}
                  loading={searchLoading}
                  error={searchError}
                  youtubeUrl={youtubeUrl}
                  setYoutubeUrl={setYoutubeUrl}
                  orderMessage={orderMessage}
                  setOrderMessage={setOrderMessage}
                  urlLoading={urlLoading}
                  onAddFromUrl={handleAddFromUrl}
                  onAdd={handleAddSong}
                />
                <div className="my-4 border-t border-line" />
                <QueuePanel queue={queue} onRemove={handleRemoveSong} />
                <div className="my-4 border-t border-line" />
                <MembersPanel members={members} />
              </aside>

              <section className="space-y-4 md:col-span-1 lg:col-span-6">
                <article className="rounded-2xl border border-line bg-card p-4 sm:p-5">
                  <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
                    <YoutubePlayer
                      videoId={playback.videoId}
                      isPlaying={playback.isPlaying}
                      currentTime={displayTime}
                    />
                  </div>
                  <h2 className="mt-4 text-2xl font-extrabold">Nơi Này Có Anh</h2>
                  <p className="mt-1 text-sm text-muted">Sơn Tùng M-TP</p>
                  <p className="mt-1 text-xs text-muted">
                    Realtime: {isSocketConnected ? "Đã kết nối" : "Mất kết nối"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Quyền điều khiển: {canControlPlayer ? "Host" : "Chỉ host mới điều khiển"}
                  </p>

                  <div className="mt-4 h-2 w-full rounded-full bg-surface">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${Math.min((displayTime / 290) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted">
                    <span>{formatSeconds(displayTime)}</span>
                    <span>04:50</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        emitPlayerEvent(playback.isPlaying ? "player:pause" : "player:play", {
                          currentTime: displayTime
                        })
                      }
                      disabled={!canControlPlayer}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {playback.isPlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      onClick={() =>
                        emitPlayerEvent("player:seek", {
                          currentTime: displayTime + 10
                        })
                      }
                      disabled={!canControlPlayer}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Seek +10s
                    </button>
                    <button
                      onClick={() => emitPlayerEvent("player:next")}
                      disabled={!canControlPlayer}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Next
                    </button>
                    <button
                      onClick={handlePlayRealFptVoiceClean}
                      className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-accent"
                    >
                      Nghe lời nhắn (FPT AI)
                    </button>
                  </div>

                  <div className="relative mt-5 rounded-xl border border-line bg-surface p-3">
                    <p className="text-sm font-semibold">Thả cảm xúc</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionSocket(emoji)}
                          aria-label={`Thả cảm xúc ${emoji}`}
                          className="rounded-lg border border-line bg-card px-3 py-2 text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-2 h-24 overflow-hidden">
                      {reactions.map((item) => (
                        <span key={item.id} className="reaction-bubble" style={{ left: `${item.left}%` }}>
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
                      onClick={handleVoteSocket}
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
                    results={searchResults}
                    loading={searchLoading}
                    error={searchError}
                    youtubeUrl={youtubeUrl}
                    setYoutubeUrl={setYoutubeUrl}
                    orderMessage={orderMessage}
                    setOrderMessage={setOrderMessage}
                    urlLoading={urlLoading}
                    onAddFromUrl={handleAddFromUrl}
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
                  onSubmit={handleSendChatSocket}
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
                  results={searchResults}
                  loading={searchLoading}
                  error={searchError}
                  youtubeUrl={youtubeUrl}
                  setYoutubeUrl={setYoutubeUrl}
                  orderMessage={orderMessage}
                  setOrderMessage={setOrderMessage}
                  urlLoading={urlLoading}
                  onAddFromUrl={handleAddFromUrl}
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
  loading,
  error,
  youtubeUrl,
  setYoutubeUrl,
  orderMessage,
  setOrderMessage,
  urlLoading,
  onAddFromUrl,
  onAdd
}: {
  search: string;
  setSearch: (value: string) => void;
  results: SearchResultItem[];
  loading: boolean;
  error: string;
  youtubeUrl: string;
  setYoutubeUrl: (value: string) => void;
  orderMessage: string;
  setOrderMessage: (value: string) => void;
  urlLoading: boolean;
  onAddFromUrl: () => void;
  onAdd: (item: SearchResultItem, requestMessageInput?: string) => void;
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
      <div className="mt-2 flex gap-2">
        <input
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
          placeholder="Dán URL YouTube..."
        />
        <button
          onClick={onAddFromUrl}
          disabled={urlLoading}
          className="rounded-md border border-line px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {urlLoading ? "Đang lấy..." : "Add URL"}
        </button>
      </div>
      {loading ? <p className="mt-2 text-xs text-muted">Đang tìm kiếm...</p> : null}
      <input
        value={orderMessage}
        onChange={(event) => setOrderMessage(event.target.value.slice(0, 220))}
        className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none ring-accent/30 transition focus:ring-2"
        placeholder="Lời nhắn khi order (tùy chọn, tối đa 220 ký tự)"
      />
      {!loading && error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
      {!loading && !error && search.trim() && results.length === 0 ? (
        <p className="mt-2 text-xs text-muted">Không có kết quả phù hợp.</p>
      ) : null}
      <div className="mt-3 space-y-2">
        {results.map((item) => (
          <div key={item.videoId} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-2">
            <img src={item.thumbnail} alt={item.title} className="h-12 w-16 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted">{item.channel}</p>
            </div>
            <button
              onClick={() => onAdd(item, orderMessage)}
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
              {item.requestMessage ? (
                <p className="mt-1 line-clamp-2 text-xs text-amber-200">Lời nhắn: {item.requestMessage}</p>
              ) : null}
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
          <div key={member.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-2">
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


