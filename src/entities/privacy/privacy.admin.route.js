import { Router } from "express";
import {
  getPrivacyPolicyAdminHandler,
  upsertPrivacyPolicyHandler,
} from "./privacy.controller.js";

// If you have auth, plug it here (match your real export names)
// import { protect, requireAdmin } from "../../core/middlewares/authMiddleware.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";

const router = Router();
// router.use(verifyToken, adminMiddleware);
// router.use(protect, requireAdmin);

router.get("/", getPrivacyPolicyAdminHandler);
router.put("/", upsertPrivacyPolicyHandler);

export default router;
