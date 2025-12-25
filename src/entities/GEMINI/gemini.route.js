import express from "express";
import { generateLineArtPreview } from "../GEMINI/gemini.controller.js";

const router = express.Router();

// Define the POST route
router.post("/generate-preview", generateLineArtPreview);

export default router;