import {
  Prisma,
  PrismaClient,
} from "../generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export class CampaignRepository {
  create(
    db: Db,
    data: {
      userId: string;
      senderId: string;
      subject: string;
      body: string;
      startTime: Date;
      delaySeconds: number;
      hourlyLimit: number;
    },
  ) {
    return db.campaign.create({ data });
  }
}