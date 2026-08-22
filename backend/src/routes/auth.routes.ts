import { Router } from "express";
import { google } from "googleapis";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { createToken } from "../lib/auth";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  env.googleClientId,
  env.googleClientSecret,
  env.googleCallbackUrl,
);

// Start Google OAuth
router.get("/google", (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "openid",
      "email",
      "profile",
    ],
    prompt: "select_account",
  });

  res.redirect(url);
});

// Google OAuth callback
router.get(
  "/google/callback",
  async (req, res) => {
    try {
      const { code } = req.query;

      if (typeof code !== "string") {
        return res.status(400).json({
          error:
            "Missing Google authorization code",
        });
      }

      const { tokens } =
        await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
      });

      const { data } =
        await oauth2.userinfo.get();

      if (
        !data.id ||
        !data.email ||
        !data.name
      ) {
        return res.status(400).json({
          error:
            "Google account information is incomplete",
        });
      }

      const user =
        await prisma.user.upsert({
          where: {
            googleId: data.id,
          },
          update: {
            name: data.name,
            email: data.email,
            avatarUrl:
              data.picture ?? null,
          },
          create: {
            googleId: data.id,
            name: data.name,
            email: data.email,
            avatarUrl:
              data.picture ?? null,
          },
        });
        const existingSender =

  await prisma.sender.findFirst({

    where: {

      userId: user.id,

      email: user.email,

    },

  });

if (!existingSender) {

  await prisma.sender.create({

    data: {

      userId: user.id,

      email: user.email,

    },

  });

}

      const token = createToken({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      });

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(
        "http://localhost:5173/scheduled",
      );
    } catch (error) {
      console.error(
        "Google OAuth error:",
        error,
      );

      res.status(500).json({
        error:
          "Google authentication failed",
      });
    }
  },
);

// Get currently authenticated user
router.get(
  "/me",
  requireAuth,
  async (req, res) => {
    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user!.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      });

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    res.json(user);
  },
);

// Logout
router.post(
  "/logout",
  (_req, res) => {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
    });

    res.json({
      message:
        "Logged out successfully",
    });
  },
);

export default router;