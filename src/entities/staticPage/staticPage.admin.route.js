import { Router } from "express";
import { saveAboutUsHandler, getAboutUsHandler } from "./staticPage.controller.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";

const router = Router();

// Only Admins can Post or View Drafts here
router.post("/", verifyToken, adminMiddleware, saveAboutUsHandler);
router.get("/", verifyToken, adminMiddleware, getAboutUsHandler);

export default router;