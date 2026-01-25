import { Router } from "express";
import { getAboutUsHandler } from "./staticPage.controller.js";

const router = Router();

// Anyone can view the published version
router.get("/", getAboutUsHandler);

export default router;