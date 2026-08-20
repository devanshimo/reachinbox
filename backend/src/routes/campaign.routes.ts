import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";

const router = Router();
const campaignController = new CampaignController();

router.post("/campaigns", campaignController.create);

export default router;