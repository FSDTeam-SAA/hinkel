import express from "express";

import { createItem, deleteItem, getAllItems, getItemById, updateItem } from "./content.controller.js";
import { multerUpload } from "../../../core/middlewares/multer.js";

const router = express.Router();

// Upload one image per item
router.post("/upload", multerUpload([{ name: "image", maxCount: 1 }]), createItem);
router.get("/", getAllItems);
router.get("/:id", getItemById);
router.patch("/:id",  multerUpload([{ name: "image", maxCount: 1 }]), updateItem);
router.delete("/:id", deleteItem);

export default router;
