import {
  Request,
  Response,
  NextFunction,
} from "express";
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
      const input =
        createCampaignSchema.parse(req.body);

      const userId =
        "cmt1useq10000wn0f9vsawx7a";

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
}