import { Worker } from "bullmq";
import { redisConnection } from "./connection";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../services/email.service";
import { reserveEmailSlot } from "../rate-limiter/email-rate-limiter";
import { rescheduleForNextWindow } from "../rate-limiter/reschedule-email-job";
import { env } from "../config/env";
import { reserveSendSlot } from "../rate-limiter/email-send-throttle";
import { rescheduleUntilSlot } from "../rate-limiter/email-send-throttle-reschedule";

const worker = new Worker(
  "email-sending",
  async (job, token) => {
    const { emailId } = job.data;

    console.log(`Processing email job: ${emailId}`);

    const email = await prisma.email.findUnique({
      where: {
        id: emailId,
      },
      include: {
        campaign: {
          include: {
            sender: true,
          },
        },
      },
    });

    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    // Idempotency protection.
    if (email.status === "SENT") {
      console.log(
        `Email ${emailId} already sent. Skipping.`,
      );

      return;
    }

    // --------------------------------------------------
    // RATE LIMIT
    // --------------------------------------------------

    const rateLimit = await reserveEmailSlot(
      email.campaign.senderId,
      email.campaign.hourlyLimit,
    );

    if (!rateLimit.allowed) {
      console.log(
        `Hourly limit reached for sender ${email.campaign.senderId}.`,
      );

      console.log(
        `Rescheduling ${emailId} for ${rateLimit.nextWindowAt?.toISOString()}`,
      );

      if (!token) {
        throw new Error(
          "BullMQ worker token unavailable while rescheduling job.",
        );
      }

      await rescheduleForNextWindow(
        job,
        token,
        rateLimit.nextWindowAt!,
      );

      return;
    }

    console.log(
      `Rate-limit slot acquired. Remaining: ${rateLimit.remaining}`,
    );
    // --------------------------------------------------
// MINIMUM SEND DELAY
// --------------------------------------------------

let reservedSendAt: Date;

if (job.data.reservedSendAt) {
  // This job already reserved a send slot before being delayed.
  reservedSendAt = new Date(
    job.data.reservedSendAt,
  );

  console.log(
    `Using previously reserved send slot: ${reservedSendAt.toISOString()}`,
  );
} else {
  // Reserve a new distributed send slot.
  reservedSendAt = await reserveSendSlot(
    email.campaign.senderId,
  );

  console.log(
    `Reserved send slot: ${reservedSendAt.toISOString()}`,
  );
}

if (reservedSendAt.getTime() > Date.now()) {
  console.log(
    `Send slot is in the future. Delaying ${emailId}.`,
  );

  if (!token) {
    throw new Error(
      "BullMQ worker token unavailable while delaying send job.",
    );
  }

  await rescheduleUntilSlot(
    job,
    token,
    reservedSendAt,
  );

  return;
}

    // --------------------------------------------------
    // CLAIM EMAIL
    // --------------------------------------------------

    const claimed = await prisma.email.updateMany({
      where: {
        id: emailId,
        status: "SCHEDULED",
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1,
        },
      },
    });

    if (claimed.count === 0) {
      console.log(
        `Email ${emailId} was already claimed.`,
      );

      return;
    }

    // --------------------------------------------------
    // SEND
    // --------------------------------------------------

    try {
      const result = await sendEmail({
        from: email.campaign.sender.email,
        to: email.recipient,
        subject: email.subject,
        body: email.body,
      });

      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          messageId: result.messageId,
        },
      });

      console.log(
        `Email sent successfully: ${emailId}`,
      );

      if (result.previewUrl) {
        console.log(
          `Preview: ${result.previewUrl}`,
        );
      }
    } catch (error) {
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "FAILED",
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        },
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: env.workerConcurrency,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(
    `Job ${job?.id} failed:`,
    error,
  );
});

console.log(
  `Email worker started with concurrency ${env.workerConcurrency}`,
);