import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export interface EmailJobData {
  emailId: string;
  reservedSendAt?: number;
}

export const emailQueue = new Queue<EmailJobData>("email-sending", {
  connection: redisConnection,
});