import {
  DelayedError,
  Job,
} from "bullmq";

import type { EmailJobData } from "../queue/email.queue";

export async function rescheduleUntilSlot(
  job: Job<EmailJobData>,
  token: string,
  reservedAt: Date,
): Promise<never> {
  const delayMs =
    reservedAt.getTime() - Date.now();

  if (delayMs <= 0) {
    throw new Error(
      "rescheduleUntilSlot called for a slot that is already available",
    );
  }

  await job.updateData({
    ...job.data,
    reservedSendAt: reservedAt.getTime(),
  });

  await job.moveToDelayed(
    reservedAt.getTime(),
    token,
  );

  throw new DelayedError();
}