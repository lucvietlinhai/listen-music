import { io, type Socket } from "socket.io-client";

type GuestAuthResponse = {
  token: string;
};

type JwtPayload = {
  userId?: string;
};

type PlaybackState = {
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
  hostId: string;
};

type ClientSnapshot = {
  userId: string;
  lastState: PlaybackState | null;
  lastReceiveAt: number;
};

const API_BASE = process.env.CHECKPOINT_API_URL ?? "http://localhost:4000";
const SOCKET_URL = process.env.CHECKPOINT_SOCKET_URL ?? API_BASE;
const ROOM_ID = process.env.CHECKPOINT_ROOM_ID ?? "checkpoint-sync-room";

const decodeToken = (token: string): JwtPayload | null => {
  try {
    const [, payload = ""] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getGuestToken = async () => {
  const response = await fetch(`${API_BASE}/api/auth/guest`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Cannot get guest token: ${response.status}`);
  }
  const json = (await response.json()) as GuestAuthResponse;
  return json.token;
};

const estimatedNow = (snapshot: ClientSnapshot) => {
  if (!snapshot.lastState) return 0;
  const state = snapshot.lastState;
  if (!state.isPlaying) return state.currentTime;
  return state.currentTime + (Date.now() - state.updatedAt) / 1000;
};

const connectClient = async (token: string, roomId: string, snapshot: ClientSnapshot) => {
  return await new Promise<Socket>((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      timeout: 8000
    });

    const failTimer = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Socket connect timeout"));
    }, 9000);

    socket.on("connect", () => {
      socket.emit("room:join", { roomId });
    });

    socket.on("room:state", (payload: { state: PlaybackState }) => {
      snapshot.lastState = payload.state;
      snapshot.lastReceiveAt = Date.now();
      clearTimeout(failTimer);
      resolve(socket);
    });

    socket.on("player:state", (payload: { state: PlaybackState }) => {
      snapshot.lastState = payload.state;
      snapshot.lastReceiveAt = Date.now();
    });

    socket.on("player:heartbeat", (payload: { currentTime: number; isPlaying: boolean; updatedAt: number }) => {
      snapshot.lastState = {
        ...(snapshot.lastState ?? { hostId: "" }),
        currentTime: payload.currentTime,
        isPlaying: payload.isPlaying,
        updatedAt: payload.updatedAt
      } as PlaybackState;
      snapshot.lastReceiveAt = Date.now();
    });

    socket.on("connect_error", (error) => {
      clearTimeout(failTimer);
      reject(error);
    });
  });
};

const run = async () => {
  const tokenA = await getGuestToken();
  const tokenB = await getGuestToken();
  const userA = decodeToken(tokenA)?.userId ?? "user-a";
  const userB = decodeToken(tokenB)?.userId ?? "user-b";

  const clientA: ClientSnapshot = { userId: userA, lastState: null, lastReceiveAt: 0 };
  const clientB: ClientSnapshot = { userId: userB, lastState: null, lastReceiveAt: 0 };

  const socketA = await connectClient(tokenA, ROOM_ID, clientA);
  const socketB = await connectClient(tokenB, ROOM_ID, clientB);

  try {
    const hostId = clientA.lastState?.hostId ?? clientA.userId;
    const hostSocket = hostId === clientA.userId ? socketA : socketB;
    hostSocket.emit("player:seek", { roomId: ROOM_ID, currentTime: 15 });
    await wait(250);
    hostSocket.emit("player:play", { roomId: ROOM_ID, currentTime: 15 });

    await wait(6200);

    const t1 = estimatedNow(clientA);
    const t2 = estimatedNow(clientB);
    const drift = Math.abs(t1 - t2);

    console.log(
      JSON.stringify(
        {
          ok: drift < 1,
          driftSeconds: Number(drift.toFixed(3)),
          clientASeconds: Number(t1.toFixed(3)),
          clientBSeconds: Number(t2.toFixed(3)),
          roomId: ROOM_ID
        },
        null,
        2
      )
    );

    if (drift >= 1) {
      process.exitCode = 1;
    }
  } finally {
    socketA.emit("room:leave");
    socketB.emit("room:leave");
    socketA.disconnect();
    socketB.disconnect();
  }
};

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
