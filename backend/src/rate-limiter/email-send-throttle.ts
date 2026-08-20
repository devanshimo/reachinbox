import type { Redis } from "ioredis";
import { redisConnection } from "../queue/connection";
import { env } from "../config/env";

const RESERVE_SEND_SLOT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local minDelay = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])

local last = tonumber(redis.call("GET", key))

local nextSlot

if last == nil then
  nextSlot = now
elseif last + minDelay > now then
  nextSlot = last + minDelay
else
  nextSlot = now
end

redis.call("SET", key, nextSlot, "EX", ttl)

return tostring(nextSlot)
`;

export function registerSendThrottleCommand(
  redis: Redis,
) {
  redis.defineCommand("reserveSendSlot", {
    numberOfKeys: 1,
    lua: RESERVE_SEND_SLOT_SCRIPT,
  });
}

registerSendThrottleCommand(redisConnection);

export function getSendThrottleKey(
  senderId: string,
) {
  return `send-throttle:${senderId}`;
}

export async function reserveSendSlot(
  senderId: string,
  redis: Redis = redisConnection,
): Promise<Date> {
  const now = Date.now();

  const ttlSeconds = Math.max(
    3600,
    Math.ceil(env.minEmailDelayMs / 1000) + 60,
  );

  const reservedMs =
    await (
      redis as Redis & {
        reserveSendSlot: (
          key: string,
          nowMs: number,
          minDelayMs: number,
          ttlSeconds: number,
        ) => Promise<string>;
      }
    ).reserveSendSlot(
      getSendThrottleKey(senderId),
      now,
      env.minEmailDelayMs,
      ttlSeconds,
    );

  return new Date(Number(reservedMs));
}