import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.routes";
import campaignRouter from "./routes/campaign.routes";
import { prisma } from "./lib/prisma";
import { emailQueue } from "./queue/email.queue";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "https://reachinbox-assignment-production-f2f3.up.railway.app",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/api", campaignRouter);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ok",
      service: "reachinbox-backend",
      database: "connected",
    });
  } catch (error) {
    console.error(
      "Database health check failed:",
      error,
    );

    res.status(503).json({
      status: "error",
      service: "reachinbox-backend",
      database: "disconnected",
    });
  }
});

app.post("/test-queue", async (_req, res) => {
  const job = await emailQueue.add(
    "test-email",
    {
      emailId: "test-email-123",
    },
    {
      delay: 5000,
      removeOnComplete: true,
    },
  );

  res.json({
    message: "Job added",
    jobId: job.id,
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      error: "Internal server error",
    });
  },
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`,
  );
});
