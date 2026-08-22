import {
  Request,
  Response,
  NextFunction,
} from "express";
import { EmailStatus } from "../generated/prisma/client";
import { createCampaignSchema } from "../validators/campaign.schema";
import { CampaignService } from "../services/campaign.service";

const campaignService = new CampaignService();

export class CampaignController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const input = createCampaignSchema.parse(req.body);
      const userId = req.user!.id;

      const result =
        await campaignService.createCampaign(
          input,
          userId,
        );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getEmails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const status =
        (req.query.status as EmailStatus) ??
        EmailStatus.SCHEDULED;

      if (
        status !== EmailStatus.SCHEDULED &&
        status !== EmailStatus.SENT &&
        status !== EmailStatus.FAILED
      ) {
        return res.status(400).json({
          error: "Invalid email status",
        });
      }

      const userId = req.user!.id;

      const emails =
        await campaignService.getEmailsByStatus(
          userId,
          status,
        );

      res.json(emails);
    } catch (error) {
      next(error);
    }
  };

  getSenders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user!.id;

      const senders =
        await campaignService.getSenders(userId);

      res.json(senders);
    } catch (error) {
      next(error);
    }
  };
}
