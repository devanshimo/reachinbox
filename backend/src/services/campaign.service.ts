import { randomUUID } from "crypto";
import { EmailStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { emailQueue } from "../queue/email.queue";
import { CampaignRepository } from "../repositories/campaign.repository";
import {
  EmailCreateInput,
  EmailRepository,
} from "../repositories/email.repository";
import { CreateCampaignInput } from "../validators/campaign.schema";

export class CampaignService {
  constructor(
    private campaignRepo = new CampaignRepository(),
    private emailRepo = new EmailRepository(),
  ) {}

  async createCampaign(
    input: CreateCampaignInput,
    userId: string,
  ) {
    const {
      senderId,
      subject,
      body,
      recipients,
      startTime,
      delaySeconds,
      hourlyLimit,
    } = input;

    const emailRecords = recipients.map(
      (recipient, index) => ({
        id: randomUUID(),
        recipient,
        subject,
        body,
        status: EmailStatus.SCHEDULED,
        scheduledAt: new Date(
          startTime.getTime() +
            delaySeconds * index * 1000,
        ),
      }),
    );

    const campaign = await prisma.$transaction(
      async (tx) => {
        const campaign =
          await this.campaignRepo.create(tx, {
            userId,
            senderId,
            subject,
            body,
            startTime,
            delaySeconds,
            hourlyLimit,
          });

        const emailsForInsert: EmailCreateInput[] =
          emailRecords.map((email) => ({
            ...email,
            campaignId: campaign.id,
          }));

        await this.emailRepo.createMany(
          tx,
          emailsForInsert,
        );

        return campaign;
      },
    );

    const emailsWithCampaignId =
      emailRecords.map((email) => ({
        ...email,
        campaignId: campaign.id,
      }));

    await emailQueue.addBulk(
      emailsWithCampaignId.map((email) => ({
        name: "send-email",
        data: {
          emailId: email.id,
        },
        opts: {
          jobId: email.id,
          delay: Math.max(
            0,
            email.scheduledAt.getTime() -
              Date.now(),
          ),
        },
      })),
    );

    return {
      campaign,
      emails: emailsWithCampaignId.map(
        (email) => ({
          id: email.id,
          recipient: email.recipient,
          status: email.status,
          scheduledAt: email.scheduledAt,
        }),
      ),
    };
  }

  async getEmailsByStatus(
    userId: string,
    status: EmailStatus,
  ) {
    return this.emailRepo.findByStatus(
      prisma,
      userId,
      status,
    );
  }

  
}