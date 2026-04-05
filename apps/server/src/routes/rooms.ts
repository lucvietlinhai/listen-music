import { Router } from "express";
import { z } from "zod";
import { roomStore } from "../lib/room-store";
import { authRequired, type RequestWithAuth } from "../middleware/auth";

const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  isPublic: z.boolean(),
  password: z.string().min(4).max(40).optional()
});

export const roomsRouter = Router();

roomsRouter.get("/", (_req, res) => {
  res.json({ rooms: roomStore.list() });
});

roomsRouter.get("/:id", (req, res) => {
  const room = roomStore.get(req.params.id);
  if (!room) {
    res.status(404).json({ error: "ROOM_NOT_FOUND" });
    return;
  }
  res.json(room);
});

roomsRouter.post("/", authRequired, (req: RequestWithAuth, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "VALIDATION_ERROR", detail: parsed.error.flatten() });
    return;
  }

  const room = roomStore.create({
    name: parsed.data.name,
    isPublic: parsed.data.isPublic,
    passwordHash: parsed.data.password ? `mock_hash_${parsed.data.password}` : undefined,
    hostId: req.auth!.userId
  });
  res.status(201).json(room);
});

roomsRouter.delete("/:id", authRequired, (req: RequestWithAuth, res) => {
  const room = roomStore.get(req.params.id);
  if (!room) {
    res.status(404).json({ error: "ROOM_NOT_FOUND" });
    return;
  }
  if (room.hostId !== req.auth!.userId) {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }

  roomStore.remove(req.params.id);
  res.status(204).send();
});

