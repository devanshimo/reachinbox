import {
  DelayedError,
  Job,
} from "bullmq";

interface EmailJobPayload {
  emailId: string;
}

export async function rescheduleForNextWindow(
  job: Job<EmailJobPayload>,
  token: string,
  nextWindowAt: Date,
): Promise<never> {
  await job.moveToDelayed(
    nextWindowAt.getTime(),
    token,
  );

  throw new DelayedError();
}