import {
  Prisma,
  PrismaClient,
  EmailStatus,
} from "../generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export interface EmailCreateInput {
  id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: Date;
}

export class EmailRepository {
  createMany(db: Db, emails: EmailCreateInput[]) {
    return db.email.createMany({
      data: emails,
    });
  }
}