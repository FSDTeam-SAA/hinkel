import { Router } from "express";
import { getStaticPagePublicHandler } from "./staticPage.controller.js";

const router = Router();
router.get("/:key", getStaticPagePublicHandler);

export default router;
