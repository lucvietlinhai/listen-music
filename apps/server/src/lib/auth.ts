import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { config } from "../config";
import type { AuthTokenPayload } from "../types";

const JWT_EXPIRES_IN = "24h";

export const createGuestPayload = (): AuthTokenPayload => ({
  userId: `guest_${nanoid(10)}`,
  name: `Khách ${Math.floor(Math.random() * 9000) + 1000}`,
  isGuest: true,
  role: "guest"
});

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token: string): AuthTokenPayload =>
  jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

