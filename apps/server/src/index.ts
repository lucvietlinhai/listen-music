import cors from "cors";
import express from "express";
import { config } from "./config";
import { createCacheClient } from "./lib/cache";
import { authOptional } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { roomsRouter } from "./routes/rooms";
import { createYoutubeRouter } from "./routes/youtube";

const app = express();
const cache = createCacheClient();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(authOptional);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "listenwithme-server" });
});

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/youtube", createYoutubeRouter(cache));

app.use((_req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.listen(config.port, () => {
  console.log(`ListenWithMe server running at http://localhost:${config.port}`);
});

