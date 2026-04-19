import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { config } from "../config";
import { createGuestPayload, signToken } from "../lib/auth";
import { getPrismaClient } from "../lib/db";
import type { AuthTokenPayload } from "../types";

export const authRouter = Router();
const googleLoginSchema = z.object({
  idToken: z.string().min(20)
});
const googleClient = new OAuth2Client(config.googleClientId);

authRouter.post("/guest", (_req, res) => {
  const payload = createGuestPayload();
  const token = signToken(payload);

  res.json({
    token,
    user: payload,
    expiresIn: "24h"
  });
});

authRouter.post("/google", (req, res) => {
  void (async () => {
    if (!config.googleClientId) {
      res.status(500).json({ error: "GOOGLE_OAUTH_NOT_CONFIGURED" });
      return;
    }

    const parsed = googleLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "VALIDATION_ERROR", detail: parsed.error.flatten() });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: config.googleClientId
    });
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.name) {
      res.status(400).json({ error: "GOOGLE_PROFILE_INCOMPLETE" });
      return;
    }
    if (profile.email_verified === false) {
      res.status(400).json({ error: "GOOGLE_EMAIL_NOT_VERIFIED" });
      return;
    }

    const prisma = getPrismaClient();
    let payload: AuthTokenPayload;

    if (prisma) {
      try {
        const user = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: profile.name,
            avatar: profile.picture ?? null
          },
          create: {
            email: profile.email,
            name: profile.name,
            avatar: profile.picture ?? null
          }
        });

        payload = {
          userId: user.id,
          name: user.name,
          isGuest: false,
          role: "member",
          email: user.email ?? undefined,
          avatar: user.avatar ?? undefined
        };
      } catch (dbError) {
        console.error("google auth db fallback", dbError);
        payload = {
          userId: `google_${profile.sub ?? profile.email}`,
          name: profile.name,
          isGuest: false,
          role: "member",
          email: profile.email,
          avatar: profile.picture ?? undefined
        };
      }
    } else {
      payload = {
        userId: `google_${profile.sub ?? profile.email}`,
        name: profile.name,
        isGuest: false,
        role: "member",
        email: profile.email,
        avatar: profile.picture ?? undefined
      };
    }

    res.json({
      token: signToken(payload),
      user: payload,
      expiresIn: "24h"
    });
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown";
    res.status(401).json({ error: "GOOGLE_AUTH_FAILED", detail: message });
  });
});
