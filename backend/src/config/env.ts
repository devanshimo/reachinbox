import "dotenv/config";

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  workerConcurrency: Number(
    process.env.WORKER_CONCURRENCY ?? 5,
  ),

  minEmailDelayMs: Number(
    process.env.MIN_EMAIL_DELAY_MS ?? 2000,
  ),

  maxEmailsPerHour: Number(
    process.env.MAX_EMAILS_PER_HOUR ?? 100,
  ),
};