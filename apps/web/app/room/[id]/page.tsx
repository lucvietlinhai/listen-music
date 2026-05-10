"use client";

import { FormEvent, RefObject, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Share2, Settings, Play, Pause, FastForward, StepForward, Radio, MonitorPlay, AudioLines, Users, ListMusic, CheckCircle2, LogIn, X, MessageSquare, Send, Link as LinkIcon, Trash2, Plus, Volume2, Volume1, VolumeX } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/common/error-state";
import { YoutubePlayer } from "@/components/room/youtube-player";
import { clearAuthSession, getGuestToken, resolveYoutubeUrl, searchYoutubeVideos, fetchRooms, type YoutubeVideoResult } from "@/lib/api";

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
  email?: string | null;
};

type ChatMessage = {
  id: string;
  type: "text" | "system";
  user?: string;
  content: string;
  createdAt?: number;
  reactions?: { [emoji: string]: string[] };
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
  hostName?: string;
  hostEmail?: string;
  nowPlaying?: {
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    requestMessage?: string;
  } | null;
};

const getAdjustedTime = (state: Pick<PlaybackState, "currentTime" | "isPlaying" | "updatedAt">) => {
  if (!state.isPlaying) return state.currentTime;
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  return Math.max(0, state.currentTime + elapsed);
};

const initialQueue: QueueItem[] = [];
/*
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
*/

const members: Member[] = [];
/*
  { id: "m1", name: "Huy", role: "host", avatar: "H" },
  { id: "m2", name: "Linh", role: "member", avatar: "L" },
  { id: "m3", name: "Tú", role: "member", avatar: "T" },
  { id: "m4", name: "Khách 3491", role: "guest", avatar: "K" }
];
*/

const initialMessages: ChatMessage[] = [
  { id: "c1", type: "system", content: "Huy đã tạo phòng." },
  { id: "c2", type: "text", user: "Linh", content: "Bài này mở đầu đúng mood tối nay luôn." },
  { id: "c3", type: "text", user: "Tú", content: "Chuẩn, để mình thêm vài bài chill nữa nhé." }
];

const emojis = ["❤️", "🔥", "👏", "🎧", "🥹", "✨", "🎉", "🤣", "🤔", "👀", "💯", "🎵"];

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
  const router = useRouter();
  const { user, requestLogin } = useAuth();
  const [roomName, setRoomName] = useState(decodeURIComponent(params.id));
  const [showSettings, setShowSettings] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
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
  const [volume, setVolume] = useState(100);
  const [lastVolume, setLastVolume] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem("lwm-volume");
    if (saved) {
      const val = Number(saved);
      setVolume(val);
      if (val > 0) setLastVolume(val);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lwm-volume", String(volume));
  }, [volume]);
  const [hasError, setHasError] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [playback, setPlayback] = useState<PlaybackState>({
    videoId: "",
    currentTime: 0,
    isPlaying: false,
    updatedAt: Date.now(),
    hostId: "",
    nowPlaying: null
  });
  const [currentUserId, setCurrentUserId] = useState("");
  const [displayTime, setDisplayTime] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const displayTimeRef = useRef(0);
  const hostIdRef = useRef("");
  const reconnectingForAuthRef = useRef(false);
  const totalMembers = Math.max(onlineCount, 1);
  const role = user ? "host" : "guest";
  const hasTrack = queue.length > 0;
  const canControlPlayer = Boolean(playback.hostId) && playback.hostId === currentUserId;
  const currentTrack =
    playback.nowPlaying ??
    queue.find((item) => item.videoId === playback.videoId) ??
    queue[0] ??
    null;
  const currentTrackPosition = currentTrack ? queue.findIndex((item) => item.videoId === currentTrack.videoId) + 1 : 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    fetchRooms().then((rooms) => {
      const room = rooms.find((r) => r.id === params.id);
      if (room) setRoomName(room.name);
    }).catch(() => {});
  }, [params.id]);

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
    setTrackDuration(0);
  }, [playback.videoId]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("error") === "1") {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

    const setup = async (forceRefreshToken = false) => {
      try {
        if (forceRefreshToken) {
          clearAuthSession();
        }

        const token = await getGuestToken();
        if (!mounted) return;
        const decoded = decodeJwtPayload(token);
        if (decoded?.userId) {
          setCurrentUserId(decoded.userId);
        }

        socketRef.current?.disconnect();
        const socket = io(socketUrl, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          timeout: 10000
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          if (!mounted) return;
          reconnectingForAuthRef.current = false;
          setIsSocketConnected(true);
          socket.emit("room:join", { roomId: params.id });
        });

        socket.on("disconnect", (reason) => {
          if (!mounted) return;
          setIsSocketConnected(false);
          if (reason === "io server disconnect") {
            pushToast("Realtime bi ngat tu server. Dang thu ket noi lai.", "⚠️");
            socket.connect();
          }
        });

        socket.on("connect_error", (error) => {
          if (!mounted) return;
          setIsSocketConnected(false);
          const message = error.message || "SOCKET_CONNECT_ERROR";

          if ((message === "INVALID_TOKEN" || message === "AUTH_REQUIRED") && !reconnectingForAuthRef.current) {
            reconnectingForAuthRef.current = true;
            pushToast("Phien realtime het han. Dang lam moi ket noi.", "⚠️");
            void setup(true);
            return;
          }

          pushToast(`Khong the ket noi realtime: ${message}`, "⚠️");
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

        socket.on("chat:updated", (payload: { message: ChatMessage }) => {
          if (!mounted) return;
          setChatMessages((prev) => prev.map(msg => msg.id === payload.message.id ? payload.message : msg));
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

        socket.on("room:host_changed", (payload: { hostId: string; hostName?: string; hostEmail?: string }) => {
          if (!mounted) return;
          setPlayback((prev) => ({
            ...prev,
            hostId: payload.hostId,
            hostName: payload.hostName,
            hostEmail: payload.hostEmail
          }));
          pushToast(`Host đã được chuyển cho ${payload.hostName || "thành viên mới"}`, "👑");
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

        socket.on("room:deleted", () => {
          if (!mounted) return;
          pushToast("Phòng đã bị xóa bởi chủ phòng", "⚠️");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        });
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
  }, [params.id, user]);

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
    if (!socket || !isSocketConnected) {
      pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
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
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
        return;
      }
      const nextItem = { ...item, id: `${item.videoId}-${Date.now()}` };
      const message = (requestMessageInput ?? orderMessage).trim().slice(0, 300);
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
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
        return;
      }
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
          setSearch("");
        } catch {
          pushToast("URL YouTube không hợp lệ hoặc không thể lấy bài", "⚠️");
        } finally {
          setUrlLoading(false);
        }
      })();
    });
  };

  const handleRemoveSong = (id: string) => {
    if (!socketRef.current || !isSocketConnected) {
      pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
      return;
    }
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
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
        return;
      }
      const trimmed = chatInput.trim();
      if (!trimmed) return;
      socketRef.current?.emit("chat:send", { roomId: params.id, content: trimmed });
      setChatInput("");
    });
  };

  const handleChatReaction = (messageId: string, emoji: string) => {
    requireLogin("Đăng nhập để thả cảm xúc.", () => {
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime.", "⚠️");
        return;
      }
      socketRef.current?.emit("chat:reaction", { roomId: params.id, messageId, emoji });
    });
  };

  const handleReactionSocket = (emoji: string) => {
    requireLogin("Đăng nhập để thả cảm xúc cùng mọi người.", () => {
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
        return;
      }
      socketRef.current?.emit("reaction:send", { roomId: params.id, emoji });
    });
  };

  const handleVoteSocket = () => {
    if (hasVoted) return;
    requireLogin("Đăng nhập để bỏ phiếu skip bài hát.", () => {
      if (!socketRef.current || !isSocketConnected) {
        pushToast("Mất kết nối realtime, vui lòng thử lại sau.", "⚠️");
        return;
      }
      socketRef.current?.emit("vote:cast", { roomId: params.id });
    });
  };

  /* legacy voice handlers removed (kept only for temporary source-encoding cleanup)
  const handleVoiceRequest = () => {
    const socket = socketRef.current;
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
    /* if (!socket) {
      pushToast("Socket chưa kết nối", "⚠️");
      return;
    }
    socket.emit("voice:request", {
      roomId: params.id,
      text: "Một lời nhắn ẩn danh: Chúc bạn tối nay thật bình yên và ngủ thật ngon."
    });
  };

  const handlePlayRealVoiceMessage = () => {
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
      pushToast("Chưa có lời nhắn để đọc. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    setVoiceText(text);
    setShowVoiceOverlay(true);
    pushToast("Đã hiển thị lại lời nhắn", "📝");
  };
  */

  /*
  const handlePlayRealFptVoiceClean = () => {
    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn để đọc. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    setVoiceText(text);
    setShowVoiceOverlay(true);
    pushToast("Đã hiển thị lại lời nhắn", "📝");
    return;

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
    const typed = orderMessage.trim();
    const queued = [...queue]
      .reverse()
      .find((item) => item.requestMessage?.trim())
      ?.requestMessage?.trim();
    const text = typed || queued || lastOrderMessage;
    if (!text) {
      pushToast("Chưa có lời nhắn để đọc. Hãy nhập lời nhắn khi order bài.", "ℹ️");
      return;
    }

    setVoiceText(text);
    setShowVoiceOverlay(true);
    pushToast("Đã hiển thị lại lời nhắn", "📝");
  };

  return (
    <div className="flex h-screen flex-col bg-[#170f23] text-white overflow-hidden">
      <header className="glass flex-shrink-0 z-40 h-14 border-b border-white/[0.05]">
          <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-12">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold tracking-tight text-text">
                Listen<span className="text-accent">WithMe</span>
              </Link>
              <span className="hidden h-5 w-px bg-white/10 sm:block" />
              <h1 className="hidden text-sm font-semibold uppercase tracking-widest text-muted sm:block line-clamp-1 max-w-[200px]">{roomName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleVoteSocket}
                disabled={hasVoted || totalMembers < 2}
                aria-label="Bỏ phiếu skip bài hát"
                className={`text-[11px] font-bold flex items-center gap-1.5 ${hasVoted ? "bg-white/10 text-muted" : "bg-accent/20 text-accent hover:bg-accent/30"} px-3 py-1.5 rounded-full transition-all`}
              >
                {hasVoted ? <CheckCircle2 className="h-3 w-3" /> : <StepForward className="h-3 w-3" />}
                Vote Skip ({votes}/{totalMembers})
              </button>
              <div className="glass-subtle flex items-center gap-2 rounded-full px-3 py-1.5">
                <span className={`status-dot ${isSocketConnected ? "connected" : "disconnected"}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{onlineCount} online</span>
              </div>
              <button onClick={handleCopyLink} aria-label="Sao chép link phòng" className="btn-ghost px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              {canControlPlayer ? (
                <button onClick={() => setShowSettings(true)} className="btn-primary text-xs flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> Settings</button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden px-3 py-4 sm:px-6 lg:px-12">
          {hasError ? (
            <ErrorState
              title="Không thể kết nối phòng"
              message="Mất kết nối tạm thời với dữ liệu phòng. Vui lòng thử lại."
              onRetry={() => window.location.assign(`/room/${params.id}`)}
            />
          ) : null}

          {!hasError ? (
            <div className="grid h-full gap-6 lg:grid-cols-12 items-stretch min-h-0">
              <aside className="hidden lg:col-span-3 lg:flex flex-col h-full min-h-0">
                <div className="glass flex-1 flex flex-col rounded-2xl p-4 shadow-glass overflow-hidden">
                  <div className="flex-shrink-0 mb-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSheet("queue")} className={`btn-ghost flex items-center gap-1.5 text-[11px] px-3 py-1.5 ${sheet === "queue" ? "active-state bg-white/5" : ""}`}>
                        <ListMusic className="h-3.5 w-3.5" /> Hàng đợi
                      </button>
                      <button onClick={() => setSheet("members")} className={`btn-ghost flex items-center gap-1.5 text-[11px] px-3 py-1.5 ${sheet === "members" ? "active-state bg-white/5" : ""}`}>
                        <Users className="h-3.5 w-3.5" /> Thành viên
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    <div className="flex-shrink-0">
                      {user ? (
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
                      ) : (
                        <div className="rounded-xl bg-white/[0.03] p-4 text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Muốn thêm nhạc?</p>
                          <button
                            onClick={() => requestLogin({ message: "Đăng nhập để thêm bài hát vào hàng đợi." })}
                            className="mt-2 w-full rounded-lg bg-accent/10 py-1.5 text-[10px] font-bold text-accent hover:bg-accent/20 transition-all"
                          >
                            Đăng nhập
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar pr-1 min-h-0">
                      {sheet === "members" ? (
                        <MembersPanel 
                          members={[]} 
                          hostId={playback.hostId} 
                          hostName={playback.hostName}
                          hostEmail={playback.hostEmail}
                          currentUser={user} 
                        />
                      ) : (
                        <QueuePanel queue={queue} onRemove={handleRemoveSong} canControl={canControlPlayer} />
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              <section className="h-full flex flex-col min-h-0 md:col-span-1 lg:col-span-6">
                <article className="glass flex-1 flex flex-col justify-between rounded-2xl p-4 shadow-glass transition-all duration-300 hover:shadow-glow-teal relative min-h-0">
                  <div className="flex-1 flex flex-col justify-center min-h-0">
                    {currentTrack ? (
                      <div className="relative group/player aspect-video w-full max-h-[65vh]">
                        <YoutubePlayer
                        videoId={currentTrack.videoId}
                        isPlaying={playback.isPlaying}
                        currentTime={displayTime}
                        showVideo={showVideo}
                        volume={volume}
                        onDurationChange={setTrackDuration}
                      />
                      {!canControlPlayer && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] cursor-not-allowed transition-all hover:bg-black/20">
                          <div className="rounded-full bg-black/40 p-3 backdrop-blur-md border border-white/10 opacity-0 group-hover/player:opacity-100 transition-opacity">
                            <MonitorPlay className="h-6 w-6 text-accent animate-pulse" />
                          </div>
                          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/60 opacity-0 group-hover/player:opacity-100 transition-opacity">
                            Chế độ xem chung (Chỉ Host điều khiển)
                          </p>
                        </div>
                      )}
                        </div>
                      ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#0a0a0a]">
                      <div className="text-center">
                        <ListMusic className="mx-auto h-12 w-12 text-muted/30" />
                        <p className="mt-3 text-sm font-semibold text-muted/50">Chưa có bài hát nào đang phát</p>
                        <p className="mt-1 text-xs text-muted/30">Tìm kiếm và thêm bài hát để bắt đầu</p>
                      </div>
                    </div>
                  )}
                  </div>
                  <div className="mt-6 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-1 text-xl font-bold text-text sm:text-2xl">
                        {currentTrack?.title ?? "Chưa có bài hát nào"}
                      </h2>
                      {currentTrack?.channel ? (
                        <p className="mt-1.5 line-clamp-1 text-xs font-semibold uppercase tracking-widest text-muted">{currentTrack.channel}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent border border-accent/20">
                          <Users className="h-3 w-3" /> 
                          <span className="uppercase tracking-wider">Chủ phòng: {playback.hostId ? (playback.hostId === currentUserId ? "Bạn" : "Host") : "..."}</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-bold text-muted border border-white/5">
                          <ListMusic className="h-3 w-3" />
                          <span className="uppercase tracking-wider">{queue.length} bài trong hàng đợi</span>
                        </div>
                        {isSocketConnected && (
                          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span className="uppercase tracking-wider">Trực tiếp</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {hasTrack ? (
                      <span className="shrink-0 rounded-full bg-white/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                        {currentTrackPosition}/{queue.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="progress-bar-track mt-4">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width:
                          hasTrack && trackDuration > 0
                            ? `${Math.min((displayTime / trackDuration) * 100, 100)}%`
                            : "0%"
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted">
                    <div className="flex gap-4">
                      <span>{formatSeconds(displayTime)}</span>
                      <span>{trackDuration > 0 ? formatSeconds(trackDuration) : "--:--"}</span>
                    </div>

                    {/* Vertical Volume Control */}
                    <div className="relative group/volume flex items-center gap-2">
                      <div className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 opacity-0 pointer-events-none group-hover/volume:opacity-100 group-hover/volume:pointer-events-auto transition-all duration-300 transform translate-y-2 group-hover/volume:translate-y-0 z-50">
                        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-3 border border-white/10 shadow-glow-strong">
                          <span className="text-[10px] font-bold text-accent">{volume}%</span>
                          <div className="h-32 w-8 relative flex justify-center">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVolume(val);
                                if (val > 0) setLastVolume(val);
                              }}
                              className="vertical-slider w-1.5 h-32 bg-white/10 rounded-full appearance-none cursor-pointer"
                              style={{
                                WebkitAppearance: "slider-vertical",
                                accentColor: "var(--accent)"
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (volume > 0) {
                            setLastVolume(volume);
                            setVolume(0);
                          } else {
                            setVolume(lastVolume || 100);
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/5 transition-all text-muted hover:text-accent"
                      >
                        {volume === 0 ? <VolumeX className="h-4 w-4" /> : 
                         volume < 50 ? <Volume1 className="h-4 w-4" /> : 
                         <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() =>
                        emitPlayerEvent(playback.isPlaying ? "player:pause" : "player:play", {
                          currentTime: displayTime
                        })
                      }
                      disabled={!canControlPlayer || !currentTrack}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${
                        playback.isPlaying 
                          ? "bg-white/10 text-white hover:bg-white/20" 
                          : "bg-accent text-black hover:scale-105 shadow-glow-teal"
                      } disabled:opacity-30 disabled:hover:scale-100`}
                    >
                      {playback.isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                      <span>{playback.isPlaying ? "Tạm dừng" : "Phát nhạc"}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-full border border-white/5">
                      <button
                        onClick={() =>
                          emitPlayerEvent("player:seek", {
                            currentTime: displayTime + 10
                          })
                        }
                        disabled={!canControlPlayer || !currentTrack}
                        className="p-2.5 hover:bg-white/10 rounded-full transition-all disabled:opacity-30"
                        title="+10s"
                      >
                        <FastForward className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => emitPlayerEvent("player:next")}
                        disabled={!canControlPlayer || !currentTrack}
                        className="p-2.5 hover:bg-white/10 rounded-full transition-all disabled:opacity-30"
                        title="Tiếp theo"
                      >
                        <StepForward className="h-4 w-4" />
                      </button>
                    </div>



                    <button 
                      onClick={handlePlayRealFptVoiceClean} 
                      disabled={!currentTrack}
                      className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm text-accent rounded-full hover:bg-accent/10 transition-all disabled:opacity-30"
                    >
                      <Radio className="h-4 w-4" /> 
                      <span className="font-bold uppercase tracking-wider text-[11px]">Đọc lời nhắn</span>
                    </button>
                    
                    <button
                      onClick={() => setShowVideo(!showVideo)}
                      disabled={!currentTrack}
                      className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm rounded-full hover:bg-white/5 transition-all disabled:opacity-30"
                    >
                      {showVideo ? <AudioLines className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
                      <span className="font-bold uppercase tracking-wider text-[11px]">{showVideo ? "Sóng nhạc" : "Xem Video"}</span>
                    </button>
                  </div>

                  <div className="relative mt-8 rounded-[24px] bg-white/[0.03] p-1.5 border border-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionSocket(emoji)}
                          aria-label={`Thả cảm xúc ${emoji}`}
                          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 hover:scale-125 transition-all duration-200 text-xl"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-2 h-28 overflow-hidden">
                      {reactions.map((item) => (
                        <span key={item.id} className="reaction-bubble" style={{ left: `${item.left}%` }}>
                          {item.emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="glass rounded-2xl p-5 lg:hidden">
                  <div className="mb-3 flex gap-2">
                    <button onClick={() => setSheet("queue")} className="btn-ghost flex items-center gap-1.5 text-sm">
                      <ListMusic className="h-4 w-4" /> Hàng đợi
                    </button>
                    <button onClick={() => setSheet("members")} className="btn-ghost flex items-center gap-1.5 text-sm">
                      <Users className="h-4 w-4" /> Thành viên
                    </button>
                  </div>
                  
                  {user ? (
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
                  ) : (
                    <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-muted">Đăng nhập để tìm và thêm nhạc</p>
                    </div>
                  )}
                </article>
              </section>

              <aside className="md:col-span-1 lg:col-span-3">
                <div className="glass h-full flex flex-col rounded-2xl p-4 pb-2 shadow-glass transition-all duration-300 hover:shadow-glow-teal">
                {user ? (
                  <ChatPanel
                    messages={chatMessages}
                    input={chatInput}
                    onChangeInput={setChatInput}
                    onSubmit={handleSendChatSocket}
                    onReaction={handleChatReaction}
                    currentUserId={currentUserId}
                    endRef={chatEndRef}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center text-center p-6">
                    <div className="mb-4 rounded-full bg-white/5 p-4">
                      <MessageSquare className="h-8 w-8 text-muted" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold">Phòng chat</h3>
                    <p className="mb-6 text-sm text-muted text-balance text-[13px]">Vui lòng đăng nhập để tham gia trò chuyện cùng mọi người.</p>
                    <button
                      onClick={() => requestLogin({ message: "Đăng nhập để tham gia trò chuyện." })}
                      className="btn-ghost w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold"
                    >
                      Đăng nhập để chat
                    </button>
                  </div>
                )}
                </div>
              </aside>
            </div>
          ) : null}
        </section>

      {sheet ? (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm p-4 lg:hidden" onClick={() => setSheet(null)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-auto rounded-t-3xl glass-strong p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {sheet === "queue" ? "Hàng đợi bài hát" : "Thành viên trong phòng"}
              </h3>
              <button onClick={() => setSheet(null)} className="btn-ghost flex items-center gap-1 text-sm">
                <X className="h-4 w-4" /> Đóng
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
                <QueuePanel queue={queue} onRemove={handleRemoveSong} canControl={canControlPlayer} />
              </>
            ) : (
              <MembersPanel 
                members={[]} 
                hostId={playback.hostId} 
                hostName={playback.hostName}
                hostEmail={playback.hostEmail}
                currentUser={user} 
              />
            )}
          </div>
        </div>
      ) : null}

      {showVoiceOverlay ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md p-4">
          <div className="glass-strong w-full max-w-xl rounded-3xl p-8 text-center shadow-glow-strong animate-slide-up">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <span className="text-lg">📻</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              Radio lời nhắn ẩn danh
            </p>
            <p className="mt-5 min-h-16 text-xl font-semibold leading-relaxed">{typedText}</p>
            <div className="mt-6 flex items-end justify-center gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="eq-bar inline-block w-1 rounded-full"
                  style={{
                    height: `${12 + Math.random() * 20}px`,
                    backgroundColor: `var(--accent)`,
                    animationDelay: `${i * 0.06}s`,
                    filter: `drop-shadow(0 0 5px var(--accent-glow))`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed right-4 top-20 z-[60] space-y-2 sm:right-6">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm shadow-glass toast-enter"
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.message}</span>
          </div>
        ))}
      </div>
      <RoomSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        roomId={params.id}
        socket={socketRef.current}
      />
    </div>
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isYoutubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return pattern.test(url.trim());
  };

  const isUrl = isYoutubeUrl(search);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted/60">Tìm kiếm bài hát hoặc dán Link</label>
      <div className="relative mt-2 flex gap-2">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={(event) => {
              const val = event.target.value;
              setSearch(val);
              setYoutubeUrl(val); // Sync both states
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none pr-10"
            placeholder="Tên bài hát, nghệ sĩ hoặc link YouTube..."
          />
          {isUrl && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent">
              <LinkIcon className="h-4 w-4" />
            </div>
          )}
        </div>
        
        {isUrl && (
          <button
            onClick={onAddFromUrl}
            disabled={urlLoading}
            className="btn-primary shrink-0 flex items-center gap-2 px-4 py-2 text-sm rounded-xl"
          >
            {urlLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Thêm</span>
          </button>
        )}
      </div>

      {/* Dropdown Results - Only show if NOT a URL */}
      {search.trim() && !isUrl && showDropdown && (
        <div className="absolute left-0 right-0 top-[70px] z-[100] mt-1 max-h-80 overflow-y-auto rounded-2xl bg-[#1e152d] border border-white/5 p-2 shadow-2xl">
          {loading ? (
            <p className="p-3 text-xs text-muted animate-pulse">Đang tìm kiếm...</p>
          ) : error ? (
            <p className="p-3 text-xs text-danger">{error}</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-xs text-muted">Không có kết quả phù hợp.</p>
          ) : (
            <div className="space-y-1">
              {results.map((item) => (
                <div key={item.videoId} className="glass-subtle flex items-center gap-3 rounded-xl p-2 transition-all hover:bg-white/[0.04] cursor-default">
                  <img src={item.thumbnail} alt={item.title} className="h-10 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="truncate text-[11px] text-muted">{item.channel}</p>
                  </div>
                  <button
                    onClick={() => {
                      onAdd(item, orderMessage);
                      setSearch("");
                      setShowDropdown(false);
                    }}
                    className="btn-primary shrink-0 px-3 py-1.5 text-xs rounded-full"
                  >
                    + Thêm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted/60">Lời nhắn khi order</label>
          <span className={`text-[10px] font-bold ${300 - orderMessage.length <= 40 ? "text-warning" : "text-muted/40"}`}>
            {orderMessage.length}/300
          </span>
        </div>
        <textarea
          value={orderMessage}
          onChange={(event) => setOrderMessage(event.target.value.slice(0, 300))}
          rows={3}
          className="glass-input w-full resize-y rounded-xl px-3 py-2.5 text-sm leading-6 outline-none"
          placeholder="Lời nhắn khi order (tùy chọn, tối đa 300 ký tự)"
        />
      </div>
    </div>
  );
}

function QueuePanel({
  queue,
  onRemove,
  canControl
}: {
  queue: QueueItem[];
  onRemove: (id: string) => void;
  canControl: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/60">Hàng đợi</h3>
      {queue.length === 0 ? (
        <p className="mt-3 text-xs text-muted/60">Chưa có bài hát nào trong hàng đợi</p>
      ) : null}
      <div className="mt-3 space-y-1.5">
        {queue.map((item, index) => (
          <div
            key={item.id}
            className={`group flex items-center gap-3 rounded-xl p-2 transition-all duration-300 border ${
              index === 0 ? "bg-white/[0.04] border-accent/30" : "bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.02] hover:border-accent/20"
            }`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              index === 0 ? "bg-accent text-black" : "bg-white/[0.06] text-muted"
            }`}>
              {index + 1}
            </span>
            <img src={item.thumbnail} alt={item.title} className="h-10 w-14 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="truncate text-xs text-muted">{item.channel}</p>
              {item.requestMessage ? (
                <p className="mt-1 flex items-start gap-1 line-clamp-1 text-[11px] text-amber-200/80">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" /> {item.requestMessage}
                </p>
              ) : null}
            </div>
            {canControl && (
              <button
                onClick={() => onRemove(item.id)}
                className="rounded-lg bg-transparent px-2 py-2 text-xs text-muted opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersPanel({ 
  members, 
  hostId, 
  hostName,
  hostEmail,
  currentUser 
}: { 
  members: Member[]; 
  hostId?: string;
  hostName?: string;
  hostEmail?: string;
  currentUser?: { name?: string; email?: string; id?: string } | null;
}) {
  const displayMembers: Member[] = [];
  
  // Add Host
  if (hostId) {
    const isMe = currentUser?.id === hostId || (hostId === "host" && !currentUser?.id);
    displayMembers.push({
      id: hostId,
      name: isMe ? (currentUser?.name || currentUser?.email || "Bạn") : (hostName || "Chủ phòng"),
      role: "host",
      avatar: "👑",
      email: isMe ? currentUser?.email : hostEmail
    });
  }

  // Add Current User if not host
  if (currentUser && currentUser.id !== hostId) {
    displayMembers.push({
      id: currentUser.id,
      name: currentUser.name || currentUser.email || "Bạn",
      role: "member",
      avatar: (currentUser.name || "U")[0].toUpperCase(),
      email: currentUser.email
    });
  }

  // Add others
  members.forEach(m => {
    if (!displayMembers.find(dm => dm.id === m.id)) {
      displayMembers.push(m);
    }
  });

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/60">Thành viên ({displayMembers.length})</h3>
      {displayMembers.length === 0 ? (
        <p className="mt-3 text-xs text-muted/60">Chưa có thành viên</p>
      ) : null}
      <div className="mt-3 space-y-1.5">
        {displayMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-xl p-2 bg-white/[0.02] border border-white/[0.03]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                member.role === "host" ? "bg-accent/20 text-accent border-accent/20" : "bg-white/5 text-muted border-white/10"
              }`}>
                {member.avatar || "👤"}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold truncate leading-tight">
                  {member.name}
                  {member.id === currentUser?.id && <span className="ml-1 text-[10px] text-accent/60">(Bạn)</span>}
                </span>
                <span className="text-[10px] text-muted truncate leading-tight">
                  {member.role === "host" ? (member.email || "Host") : (member.email || "Thành viên")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase text-emerald-500/80 tracking-tighter">Online</span>
            </div>
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
  onReaction,
  currentUserId,
  endRef
}: {
  messages: ChatMessage[];
  input: string;
  onChangeInput: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
  endRef: RefObject<HTMLDivElement>;
}) {
  const reactionEmojis = ["❤️", "🔥", "😂", "😮", "😢", "👍"];

  return (
    <div className="flex h-full flex-col">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/40 px-1">Chat phòng</h3>
      <div className="mt-4 flex-1 space-y-6 overflow-auto rounded-[24px] bg-[#1e152d]/40 p-4 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className="animate-fade-in group/msg relative">
            {message.type === "system" ? (
              <div className="rounded-xl bg-accent/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent/60 text-center">
                {message.content}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[12px] font-bold text-accent/90">{message.user}</span>
                  <span className="text-[9px] font-medium text-muted/20">
                    {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="relative inline-block max-w-[95%]">
                  <div className="relative">
                    <p className="text-[13px] leading-relaxed text-text/90 break-words bg-white/[0.03] rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                      {message.content}
                    </p>
                    
                    {/* Reaction Bar on Hover */}
                    <div className="absolute -top-10 left-0 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 pointer-events-none group-hover/msg:pointer-events-auto z-20">
                      <div className="flex gap-1.5 bg-[#2a2139] border border-white/5 rounded-full p-1.5 shadow-glow-strong scale-75 group-hover/msg:scale-100 origin-bottom-left transition-transform">
                        {reactionEmojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => onReaction(message.id, emoji)}
                            className="hover:scale-125 transition-transform p-0.5 leading-none text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Displayed Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
                      {Object.entries(message.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => onReaction(message.id, emoji)}
                          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] transition-all ${
                            users.includes(currentUserId) 
                              ? "bg-accent/20 text-accent" 
                              : "bg-white/5 text-muted"
                          }`}
                        >
                          <span className="text-xs leading-none">{emoji}</span>
                          <span className="font-bold">{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2.5 items-center h-10 mb-2">
        <input
          value={input}
          onChange={(event) => onChangeInput(event.target.value)}
          className="glass-input flex-1 outline-none placeholder:text-muted/30 border-none h-full"
          placeholder="Nhập tin nhắn..."
        />
        <button className="btn-primary flex items-center justify-center w-10 h-10 shrink-0 rounded-full transition-all active:scale-95 shadow-glow-teal/10 !p-0">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

const RoomSettingsModal = ({
  isOpen,
  onClose,
  roomId,
  socket,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  socket: Socket | null;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-glow-strong animate-scale-in border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text">Cài đặt phòng</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-danger text-sm">Xóa phòng</h3>
                <p className="text-xs text-danger/70 mt-1">Hành động này không thể hoàn tác. Mọi người sẽ bị đưa ra khỏi phòng.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn xóa phòng này? Mọi người sẽ bị đưa ra ngoài.")) {
                  socket?.emit("room:delete", { roomId });
                  onClose();
                }
              }}
              className="btn-primary w-full bg-danger hover:bg-danger/80 shadow-glow-strong text-sm py-2"
            >
              Xác nhận Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
