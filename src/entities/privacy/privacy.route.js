import { Router } from "express";
import { getPrivacyPolicyPublicHandler } from "./privacy.controller.js";

const router = Router();
router.get("/", getPrivacyPolicyPublicHandler);

export default router;
