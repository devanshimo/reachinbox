import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const campaignController = new CampaignController();

router.post(
  "/campaigns",
  requireAuth,
  campaignController.create,
);

router.get(
  "/emails",
  requireAuth,
  campaignController.getEmails,
);

router.get(
  "/senders",
  requireAuth,
  campaignController.getSenders,
);

export default router;
