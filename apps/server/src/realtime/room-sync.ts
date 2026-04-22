import type { Server, Socket } from "socket.io";
import type { CacheClient } from "../lib/cache";
import type { TtsService } from "../lib/tts-service";
import { verifyToken } from "../lib/auth";
import type { AuthTokenPayload } from "../types";

type RoomPlaybackState = {
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
  hostId: string;
};

type QueueItem = {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  addedBy: string;
  requestMessage?: string;
};

type ChatMessage = {
  id: string;
  type: "text";
  user: string;
  content: string;
  createdAt: number;
};

type RoomStatePayload = {
  roomId: string;
  state: RoomPlaybackState;
  members: number;
  queue: QueueItem[];
  chat: ChatMessage[];
  vote: {
    count: number;
    voters: string[];
  };
};

const DEFAULT_VIDEO_ID = "hLQl3WQQoQ0";
const HEARTBEAT_MS = 5_000;
const CHAT_LIMIT = 60;
const SKIP_THRESHOLD = 0.6;

const stateKey = (roomId: string) => `room:${roomId}:state`;
const membersKey = (roomId: string) => `room:${roomId}:members`;
const queueKey = (roomId: string) => `room:${roomId}:queue`;
const chatKey = (roomId: string) => `room:${roomId}:chat`;
const voteKey = (roomId: string) => `room:${roomId}:vote`;

const activeRooms = new Set<string>();
const voiceLockedRooms = new Set<string>();
const voiceResumeTimers = new Map<string, NodeJS.Timeout>();

const getDefaultState = (userId: string): RoomPlaybackState => ({
  videoId: DEFAULT_VIDEO_ID,
  currentTime: 0,
  isPlaying: false,
  updatedAt: Date.now(),
  hostId: userId
});

const adjustTime = (state: RoomPlaybackState) => {
  if (!state.isPlaying) return state.currentTime;
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  return Math.max(0, state.currentTime + elapsed);
};

const materializeState = (state: RoomPlaybackState): RoomPlaybackState => ({
  ...state,
  currentTime: adjustTime(state),
  updatedAt: Date.now()
});

const loadMembers = async (cache: CacheClient, roomId: string) =>
  (await cache.get<string[]>(membersKey(roomId))) ?? [];

const saveMembers = async (cache: CacheClient, roomId: string, members: string[]) => {
  await cache.set(membersKey(roomId), members, 86400);
};

const loadState = async (cache: CacheClient, roomId: string, userId: string) => {
  const existing = await cache.get<RoomPlaybackState>(stateKey(roomId));
  if (existing) return existing;

  const initial = getDefaultState(userId);
  await cache.set(stateKey(roomId), initial, 86400);
  return initial;
};

const saveState = async (cache: CacheClient, roomId: string, state: RoomPlaybackState) => {
  await cache.set(stateKey(roomId), state, 86400);
};

const loadQueue = async (cache: CacheClient, roomId: string) =>
  (await cache.get<QueueItem[]>(queueKey(roomId))) ?? [];

const saveQueue = async (cache: CacheClient, roomId: string, queue: QueueItem[]) => {
  await cache.set(queueKey(roomId), queue, 86400);
};

const loadChat = async (cache: CacheClient, roomId: string) =>
  (await cache.get<ChatMessage[]>(chatKey(roomId))) ?? [];

const saveChat = async (cache: CacheClient, roomId: string, chat: ChatMessage[]) => {
  await cache.set(chatKey(roomId), chat.slice(-CHAT_LIMIT), 86400);
};

const loadVotes = async (cache: CacheClient, roomId: string) =>
  (await cache.get<string[]>(voteKey(roomId))) ?? [];

const saveVotes = async (cache: CacheClient, roomId: string, voters: string[]) => {
  await cache.set(voteKey(roomId), voters, 86400);
};

const emitQueue = async (io: Server, cache: CacheClient, roomId: string) => {
  const queue = await loadQueue(cache, roomId);
  io.to(roomId).emit("queue:updated", { roomId, queue });
};

const emitVoteState = async (io: Server, cache: CacheClient, roomId: string) => {
  const [voters, members] = await Promise.all([loadVotes(cache, roomId), loadMembers(cache, roomId)]);
  const memberSet = new Set(members);
  const validVoters = voters.filter((id) => memberSet.has(id));
  if (validVoters.length !== voters.length) {
    await saveVotes(cache, roomId, validVoters);
  }
  io.to(roomId).emit("vote:state", {
    roomId,
    count: validVoters.length,
    voters: validVoters,
    members: members.length
  });
};

const emitVoiceMessage = async (
  io: Server,
  ttsService: TtsService | undefined,
  payload: {
    roomId: string;
    userId: string;
    user: string;
    text: string;
    resumeAfterVoice?: boolean;
  }
) => {
  const transcript = payload.text.trim().slice(0, 500);
  if (!payload.roomId || !transcript) return;

  const messageId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  io.to(payload.roomId).emit("voice_message_start", {
    roomId: payload.roomId,
    id: messageId,
    userId: payload.userId,
    user: payload.user,
    text: transcript
  });

  try {
    const synthesized = ttsService
      ? await ttsService.synthesize({ roomId: payload.roomId, text: transcript })
      : {
          provider: "mock" as const,
          transcript,
          audioUrl: null,
          cacheHit: false
        };

    io.to(payload.roomId).emit("voice_message_done", {
      roomId: payload.roomId,
      id: messageId,
      text: synthesized.transcript,
      audioUrl: synthesized.audioUrl,
      provider: synthesized.provider,
      cacheHit: synthesized.cacheHit,
      fallbackWebSpeech: !synthesized.audioUrl,
      resumeAfterVoice: Boolean(payload.resumeAfterVoice)
    });
  } catch (error) {
    io.to(payload.roomId).emit("voice_message_done", {
      roomId: payload.roomId,
      id: messageId,
      text: transcript,
      audioUrl: null,
      provider: "mock",
      cacheHit: false,
      fallbackWebSpeech: true,
      resumeAfterVoice: Boolean(payload.resumeAfterVoice),
      error: error instanceof Error ? error.message : "VOICE_SYNTHESIS_FAILED"
    });
  }
};

const moveToNextTrack = async (
  io: Server,
  cache: CacheClient,
  ttsService: TtsService | undefined,
  payload: {
    roomId: string;
    fallbackUserId: string;
    actor: { userId: string; name: string };
    action: "next" | "vote_skip";
    clearVotes?: boolean;
  }
) => {
  const prev = await loadState(cache, payload.roomId, payload.fallbackUserId);
  const queue = await loadQueue(cache, payload.roomId);
  const [nextTrack, ...rest] = queue;
  const message = nextTrack?.requestMessage?.trim();
  const shouldReadMessageFirst = Boolean(message);
  const existingTimer = voiceResumeTimers.get(payload.roomId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    voiceResumeTimers.delete(payload.roomId);
  }
  if (shouldReadMessageFirst) {
    voiceLockedRooms.add(payload.roomId);
  } else {
    voiceLockedRooms.delete(payload.roomId);
  }

  const nextState: RoomPlaybackState = {
    ...prev,
    videoId: nextTrack?.videoId ?? prev.videoId,
    currentTime: 0,
    updatedAt: Date.now(),
    isPlaying: !shouldReadMessageFirst
  };

  await Promise.all([
    saveQueue(cache, payload.roomId, rest),
    saveState(cache, payload.roomId, nextState),
    payload.clearVotes ? saveVotes(cache, payload.roomId, []) : Promise.resolve()
  ]);
  io.to(payload.roomId).emit("player:state", {
    roomId: payload.roomId,
    state: materializeState(nextState),
    action: payload.action
  });
  await emitQueue(io, cache, payload.roomId);
  if (payload.clearVotes) {
    await emitVoteState(io, cache, payload.roomId);
  }

  if (shouldReadMessageFirst && message) {
    await emitVoiceMessage(io, ttsService, {
      roomId: payload.roomId,
      userId: payload.actor.userId,
      user: payload.actor.name,
      text: message,
      resumeAfterVoice: true
    });
  }
};

const nextTrackByVote = async (
  io: Server,
  cache: CacheClient,
  ttsService: TtsService | undefined,
  roomId: string,
  fallbackUserId: string
) => {
  await moveToNextTrack(io, cache, ttsService, {
    roomId,
    fallbackUserId,
    actor: { userId: fallbackUserId, name: "system" },
    action: "vote_skip",
    clearVotes: true
  });
};

const ensureHost = async (
  io: Server,
  cache: CacheClient,
  roomId: string,
  fallbackUserId: string
) => {
  const members = await loadMembers(cache, roomId);
  const state = await loadState(cache, roomId, fallbackUserId);

  if (members.length === 0) {
    activeRooms.delete(roomId);
    return;
  }

  if (!members.includes(state.hostId)) {
    const nextState: RoomPlaybackState = {
      ...state,
      hostId: members[0],
      updatedAt: Date.now()
    };
    await saveState(cache, roomId, nextState);
    io.to(roomId).emit("room:host_changed", { roomId, hostId: nextState.hostId });
  }
};

type SocketAuth = {
  token?: string;
};

type SocketData = {
  auth: AuthTokenPayload;
  roomId?: string;
};

const isHost = (auth: AuthTokenPayload, state: RoomPlaybackState) => auth.userId === state.hostId;

const emitAuthError = (socket: Socket, code: string) => {
  socket.emit("auth:error", { code });
};

export const getRealtimeStats = async (cache: CacheClient) => {
  const roomIds = Array.from(activeRooms.values());
  const memberCounts = await Promise.all(
    roomIds.map(async (roomId) => {
      const members = await loadMembers(cache, roomId);
      return members.length;
    })
  );

  return {
    activeRooms: roomIds.length,
    activeMembers: memberCounts.reduce((sum, value) => sum + value, 0)
  };
};

export const registerRoomSync = (io: Server, cache: CacheClient, ttsService?: TtsService) => {
  io.use((socket, next) => {
    const auth = (socket.handshake.auth ?? {}) as SocketAuth;
    const token = auth.token;
    if (!token) {
      next(new Error("AUTH_REQUIRED"));
      return;
    }

    try {
      const decoded = verifyToken(token);
      (socket.data as SocketData).auth = decoded;
      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ roomId }: { roomId: string }) => {
      const auth = (socket.data as SocketData).auth;
      if (!roomId) return;

      socket.join(roomId);
      (socket.data as SocketData).roomId = roomId;
      activeRooms.add(roomId);

      const members = await loadMembers(cache, roomId);
      if (!members.includes(auth.userId)) {
        members.push(auth.userId);
        await saveMembers(cache, roomId, members);
      }

      const state = await loadState(cache, roomId, auth.userId);
      const [queue, chat, voters] = await Promise.all([
        loadQueue(cache, roomId),
        loadChat(cache, roomId),
        loadVotes(cache, roomId)
      ]);
      const payload: RoomStatePayload = {
        roomId,
        state: materializeState(state),
        members: members.length,
        queue,
        chat,
        vote: {
          count: voters.length,
          voters
        }
      };

      socket.emit("room:state", payload);
      socket.to(roomId).emit("room:member_joined", {
        roomId,
        userId: auth.userId,
        members: members.length
      });
      await emitQueue(io, cache, roomId);
    });

    socket.on("room:leave", async () => {
      const auth = (socket.data as SocketData).auth;
      const roomId = (socket.data as SocketData).roomId;
      if (!roomId) return;

      socket.leave(roomId);
      const members = await loadMembers(cache, roomId);
      const updatedMembers = members.filter((member) => member !== auth.userId);
      await saveMembers(cache, roomId, updatedMembers);
      await ensureHost(io, cache, roomId, auth.userId);
      if (updatedMembers.length === 0) {
        voiceLockedRooms.delete(roomId);
        const resumeTimer = voiceResumeTimers.get(roomId);
        if (resumeTimer) {
          clearTimeout(resumeTimer);
          voiceResumeTimers.delete(roomId);
        }
      }
      socket.to(roomId).emit("room:member_left", {
        roomId,
        userId: auth.userId,
        members: updatedMembers.length
      });
      await emitVoteState(io, cache, roomId);
    });

    socket.on(
      "player:play",
      async ({ roomId, currentTime }: { roomId: string; currentTime: number }) => {
        if (voiceLockedRooms.has(roomId)) {
          emitAuthError(socket, "VOICE_IN_PROGRESS");
          return;
        }
        const auth = (socket.data as SocketData).auth;
        const prev = await loadState(cache, roomId, auth.userId);
        if (!isHost(auth, prev)) {
          emitAuthError(socket, "HOST_ONLY_CONTROL");
          return;
        }

        const nextState: RoomPlaybackState = {
          ...prev,
          isPlaying: true,
          currentTime,
          updatedAt: Date.now()
        };
        await saveState(cache, roomId, nextState);
        io.to(roomId).emit("player:state", { roomId, state: materializeState(nextState), action: "play" });
      }
    );

    socket.on(
      "player:pause",
      async ({ roomId, currentTime }: { roomId: string; currentTime: number }) => {
        const auth = (socket.data as SocketData).auth;
        const prev = await loadState(cache, roomId, auth.userId);
        if (!isHost(auth, prev)) {
          emitAuthError(socket, "HOST_ONLY_CONTROL");
          return;
        }

        const nextState: RoomPlaybackState = {
          ...prev,
          isPlaying: false,
          currentTime,
          updatedAt: Date.now()
        };
        await saveState(cache, roomId, nextState);
        io.to(roomId).emit("player:state", { roomId, state: materializeState(nextState), action: "pause" });
      }
    );

    socket.on("player:seek", async ({ roomId, currentTime }: { roomId: string; currentTime: number }) => {
      const auth = (socket.data as SocketData).auth;
      const prev = await loadState(cache, roomId, auth.userId);
      if (!isHost(auth, prev)) {
        emitAuthError(socket, "HOST_ONLY_CONTROL");
        return;
      }

      const nextState: RoomPlaybackState = {
        ...prev,
        currentTime,
        updatedAt: Date.now()
      };
      await saveState(cache, roomId, nextState);
      io.to(roomId).emit("player:state", { roomId, state: materializeState(nextState), action: "seek" });
    });

    socket.on("player:next", async ({ roomId }: { roomId: string }) => {
      const auth = (socket.data as SocketData).auth;
      const prev = await loadState(cache, roomId, auth.userId);
      if (!isHost(auth, prev)) {
        emitAuthError(socket, "HOST_ONLY_CONTROL");
        return;
      }

      await moveToNextTrack(io, cache, ttsService, {
        roomId,
        fallbackUserId: auth.userId,
        actor: { userId: auth.userId, name: auth.name },
        action: "next"
      });
    });

    socket.on("queue:add", async ({ roomId, item }: { roomId: string; item: Omit<QueueItem, "addedBy"> }) => {
      const auth = (socket.data as SocketData).auth;
      const queue = await loadQueue(cache, roomId);
      const requestMessage =
        typeof item.requestMessage === "string" ? item.requestMessage.trim().slice(0, 220) : undefined;
      queue.push({
        ...item,
        addedBy: auth.userId,
        requestMessage
      });
      await saveQueue(cache, roomId, queue);
      await emitQueue(io, cache, roomId);
    });

    socket.on("voice:finished", async ({ roomId }: { roomId: string }) => {
      const auth = (socket.data as SocketData).auth;
      if (!roomId || !voiceLockedRooms.has(roomId)) return;

      const prev = await loadState(cache, roomId, auth.userId);
      if (!isHost(auth, prev)) {
        emitAuthError(socket, "HOST_ONLY_CONTROL");
        return;
      }

      const existingTimer = voiceResumeTimers.get(roomId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        voiceResumeTimers.delete(roomId);
        if (!voiceLockedRooms.has(roomId)) return;
        voiceLockedRooms.delete(roomId);

        const latest = await loadState(cache, roomId, auth.userId);
        const nextState: RoomPlaybackState = {
          ...latest,
          isPlaying: true,
          updatedAt: Date.now()
        };
        await saveState(cache, roomId, nextState);
        io.to(roomId).emit("player:state", {
          roomId,
          state: materializeState(nextState),
          action: "play_after_voice"
        });
      }, 1_000);

      voiceResumeTimers.set(roomId, timer);
    });

    socket.on("chat:send", async ({ roomId, content }: { roomId: string; content: string }) => {
      const auth = (socket.data as SocketData).auth;
      const text = content.trim();
      if (!text || text.length > 300) return;

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        type: "text",
        user: auth.name,
        content: text,
        createdAt: Date.now()
      };

      const chat = await loadChat(cache, roomId);
      chat.push(message);
      await saveChat(cache, roomId, chat);
      io.to(roomId).emit("chat:message", { roomId, message });
    });

    socket.on("reaction:send", ({ roomId, emoji }: { roomId: string; emoji: string }) => {
      const auth = (socket.data as SocketData).auth;
      const value = emoji.trim();
      if (!value || value.length > 8) return;
      io.to(roomId).emit("reaction:added", {
        roomId,
        emoji: value,
        userId: auth.userId,
        user: auth.name,
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
      });
    });

    socket.on("vote:cast", async ({ roomId }: { roomId: string }) => {
      const auth = (socket.data as SocketData).auth;
      const [members, voters] = await Promise.all([loadMembers(cache, roomId), loadVotes(cache, roomId)]);
      if (!members.length) return;

      if (!voters.includes(auth.userId)) {
        voters.push(auth.userId);
        await saveVotes(cache, roomId, voters);
      }

      await emitVoteState(io, cache, roomId);
      const threshold = Math.max(1, Math.ceil(members.length * SKIP_THRESHOLD));
      if (voters.length >= threshold) {
        await nextTrackByVote(io, cache, ttsService, roomId, auth.userId);
      }
    });

    socket.on("queue:remove", async ({ roomId, id }: { roomId: string; id: string }) => {
      const auth = (socket.data as SocketData).auth;
      const state = await loadState(cache, roomId, auth.userId);
      if (!isHost(auth, state)) {
        emitAuthError(socket, "HOST_ONLY_CONTROL");
        return;
      }
      const queue = await loadQueue(cache, roomId);
      await saveQueue(
        cache,
        roomId,
        queue.filter((item) => item.id !== id)
      );
      await emitQueue(io, cache, roomId);
    });

    socket.on("voice:request", async ({ roomId, text }: { roomId: string; text: string }) => {
      const auth = (socket.data as SocketData).auth;
      await emitVoiceMessage(io, ttsService, {
        roomId,
        userId: auth.userId,
        user: auth.name,
        text,
        resumeAfterVoice: false
      });
    });

    socket.on("disconnect", async () => {
      const auth = (socket.data as SocketData).auth;
      const roomId = (socket.data as SocketData).roomId;
      if (!roomId) return;

      const members = await loadMembers(cache, roomId);
      const updatedMembers = members.filter((member) => member !== auth.userId);
      await saveMembers(cache, roomId, updatedMembers);
      await ensureHost(io, cache, roomId, auth.userId);
      if (updatedMembers.length === 0) {
        voiceLockedRooms.delete(roomId);
        const resumeTimer = voiceResumeTimers.get(roomId);
        if (resumeTimer) {
          clearTimeout(resumeTimer);
          voiceResumeTimers.delete(roomId);
        }
      }
      socket.to(roomId).emit("room:member_left", {
        roomId,
        userId: auth.userId,
        members: updatedMembers.length
      });
      await emitVoteState(io, cache, roomId);
    });
  });

  setInterval(async () => {
    const roomIds = Array.from(activeRooms.values());
    await Promise.all(
      roomIds.map(async (roomId) => {
        const members = await loadMembers(cache, roomId);
        if (!members.length) return;
        const state = await loadState(cache, roomId, members[0]);
        io.to(roomId).emit("player:heartbeat", {
          roomId,
          currentTime: adjustTime(state),
          updatedAt: Date.now(),
          isPlaying: state.isPlaying
        });
      })
    );
  }, HEARTBEAT_MS);
};
