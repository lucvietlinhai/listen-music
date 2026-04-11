import { Router } from "express";
import { z } from "zod";
import { roomRepository } from "../lib/room-repository";
import { authRequired, type RequestWithAuth } from "../middleware/auth";

const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(80),
  isPublic: z.boolean(),
  password: z.string().min(4).max(40).optional()
});

export const roomsRouter = Router();

roomsRouter.get("/", (_req, res) => {
  void (async () => {
    const rooms = await roomRepository.list();
    res.json({ rooms, source: roomRepository.mode });
  })().catch(() => {
    res.status(500).json({ error: "ROOM_LIST_FAILED" });
  });
});

roomsRouter.get("/:id", (req, res) => {
  void (async () => {
    const room = await roomRepository.get(req.params.id);
    if (!room) {
      res.status(404).json({ error: "ROOM_NOT_FOUND" });
      return;
    }
    res.json(room);
  })().catch(() => {
    res.status(500).json({ error: "ROOM_GET_FAILED" });
  });
});

roomsRouter.post("/", authRequired, (req: RequestWithAuth, res) => {
  void (async () => {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION_ERROR", detail: parsed.error.flatten() });
      return;
    }

    const room = await roomRepository.create({
      name: parsed.data.name,
      isPublic: parsed.data.isPublic,
      passwordHash: parsed.data.password ? `mock_hash_${parsed.data.password}` : undefined,
      hostId: req.auth!.userId
    });
    res.status(201).json(room);
  })().catch((error: Error) => {
    if (error.message === "DATABASE_NOT_CONFIGURED") {
      res.status(500).json({ error: "DATABASE_NOT_CONFIGURED" });
      return;
    }
    res.status(500).json({ error: "ROOM_CREATE_FAILED" });
  });
});

roomsRouter.delete("/:id", authRequired, (req: RequestWithAuth, res) => {
  void (async () => {
    const room = await roomRepository.get(req.params.id);
    if (!room) {
      res.status(404).json({ error: "ROOM_NOT_FOUND" });
      return;
    }
    if (room.hostId !== req.auth!.userId) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }

    await roomRepository.remove(req.params.id);
    res.status(204).send();
  })().catch(() => {
    res.status(500).json({ error: "ROOM_DELETE_FAILED" });
  });
});
