import type { Redis } from "ioredis";
import { redisConnection } from "../queue/connection";

const RESERVE_SLOT_SCRIPT = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = tonumber(redis.call("GET", key) or "0")

if current < limit then
  local newCount = redis.call("INCR", key)

  if newCount == 1 then
    redis.call("EXPIRE", key, ttl)
  end

  return {1, limit - newCount}
else
  return {0, current}
end
`;

export function registerRateLimiter(redis: Redis) {
  redis.defineCommand("reserveEmailSlot", {
    numberOfKeys: 1,
    lua: RESERVE_SLOT_SCRIPT,
  });
}

// Register it for the application's Redis connection.
registerRateLimiter(redisConnection);

function getHourWindow(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");

  return `${year}${month}${day}${hour}`;
}

function getNextHourBoundary(now: Date): Date {
  const next = new Date(now);

  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);

  return next;
}

function getSecondsUntilNextHour(now: Date): number {
  const nextHour = getNextHourBoundary(now);

  // Small buffer so the key definitely survives until the window changes.
  const bufferSeconds = 60;

  return (
    Math.ceil(
      (nextHour.getTime() - now.getTime()) / 1000,
    ) + bufferSeconds
  );
}

export function getRateLimitKey(
  senderId: string,
  date: Date = new Date(),
): string {
  return `email-rate:${senderId}:${getHourWindow(date)}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  nextWindowAt?: Date;
}

export async function reserveEmailSlot(
  senderId: string,
  hourlyLimit: number,
  redis: Redis = redisConnection,
): Promise<RateLimitResult> {
  const now = new Date();

  const key = getRateLimitKey(senderId, now);
  const ttlSeconds = getSecondsUntilNextHour(now);

  const [allowedFlag, remainingOrCurrent] =
    await (
      redis as Redis & {
        reserveEmailSlot: (
          key: string,
          limit: number,
          ttl: number,
        ) => Promise<[number, number]>;
      }
    ).reserveEmailSlot(
      key,
      hourlyLimit,
      ttlSeconds,
    );

  if (allowedFlag === 1) {
    return {
      allowed: true,
      remaining: remainingOrCurrent,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    nextWindowAt: getNextHourBoundary(now),
  };
}