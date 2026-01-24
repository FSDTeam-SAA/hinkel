import { Router } from "express";
import {
  getFaqSectionAdminHandler,
  upsertFaqSectionHandler,
} from "./faq.controller.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";

// Plug your auth middleware here:
// import { protect, requireAdmin } from "../../core/middlewares/authMiddleware.js";

const router = Router();

router.use(verifyToken, adminMiddleware);
// router.use(protect, requireAdmin);

router.get("/:key", getFaqSectionAdminHandler);
router.put("/:key", upsertFaqSectionHandler);

export default router;
