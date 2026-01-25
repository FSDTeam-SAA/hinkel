import { Router } from "express";
import {
  getStaticPageAdminHandler,
  upsertStaticPageHandler,
} from "./staticPage.controller.js";

// import { protect, requireAdmin } from "../../core/middlewares/authMiddleware.js";


import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";

const router = Router();
// router.use(protect, requireAdmin);
router.use(verifyToken, adminMiddleware);

router.get("/:key", getStaticPageAdminHandler);
router.put("/:key", upsertStaticPageHandler);

export default router;
