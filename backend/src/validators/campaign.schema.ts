import { z } from "zod";

export const createCampaignSchema = z.object({
  senderId: z.string().min(1, "Sender is required"),

  subject: z.string().min(1, "Subject is required"),

  body: z.string().min(1, "Body is required"),

  recipients: z
    .array(z.string().email())
    .min(1, "At least one recipient is required"),

  startTime: z.coerce.date(),

  delaySeconds: z.number().int().nonnegative(),

  hourlyLimit: z.number().int().positive(),
});

export type CreateCampaignInput =
  z.infer<typeof createCampaignSchema>;