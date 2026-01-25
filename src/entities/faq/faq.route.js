import { Router } from "express";
import { getFaqSectionPublicHandler } from "./faq.controller.js";

const router = Router();

router.get("/:key", getFaqSectionPublicHandler);

export default router;
