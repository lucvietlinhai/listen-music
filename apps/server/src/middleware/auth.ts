import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth";
import type { AuthTokenPayload } from "../types";

export type RequestWithAuth = Request & {
  auth?: AuthTokenPayload;
};

export const authOptional = (req: RequestWithAuth, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    req.auth = verifyToken(token);
  } catch {
    req.auth = undefined;
  }
  next();
};

export const authRequired = (req: RequestWithAuth, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }

  const token = header.slice("Bearer ".length);
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "INVALID_TOKEN" });
  }
};

