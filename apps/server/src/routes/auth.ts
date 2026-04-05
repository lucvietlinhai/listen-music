import { Router } from "express";
import { createGuestPayload, signToken } from "../lib/auth";

export const authRouter = Router();

authRouter.post("/guest", (_req, res) => {
  const payload = createGuestPayload();
  const token = signToken(payload);

  res.json({
    token,
    user: payload,
    expiresIn: "24h"
  });
});

