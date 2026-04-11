import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config";
import { createCacheClient } from "./lib/cache";
import { isDatabaseConfigured } from "./lib/db";
import { roomRepository } from "./lib/room-repository";
import { registerRoomSync } from "./realtime/room-sync";
import { authOptional } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { roomsRouter } from "./routes/rooms";
import { createYoutubeRouter } from "./routes/youtube";

const app = express();
const httpServer = createServer(app);
const cache = createCacheClient();
const io = new Server(httpServer, {
  cors: {
    origin: config.socketCorsOrigin,
    credentials: true
  }
});

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(authOptional);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "listenwithme-server",
    roomStore: roomRepository.mode,
    databaseConfigured: isDatabaseConfigured(),
    cache: cache.mode
  });
});

app.get("/health/deps", async (_req, res) => {
  try {
    const redisPing = await cache.ping();
    res.json({
      ok: true,
      redis: redisPing,
      cacheMode: cache.mode,
      roomStore: roomRepository.mode
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "DEPENDENCY_HEALTH_FAILED",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/youtube", createYoutubeRouter(cache));

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

registerRoomSync(io, cache);

httpServer.listen(config.port, () => {
  console.log(`ListenWithMe server running at http://localhost:${config.port}`);
});
