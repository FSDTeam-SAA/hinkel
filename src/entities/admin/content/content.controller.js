

import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";
// Your helper for consistent responses
import fs from "fs";
import Item from "./content.model.js";
import { generateResponse } from "../../../lib/responseFormate.js";

/**
 * Create Item
 * Accepts: title, subtitle, type + image file
 * Expects multerUpload([{ name: "image", maxCount: 1 }])
 */

export const createItem = async (req, res) => {
  try {
    const { title, subtitle, type } = req.body;

    // Check if image exists
    const file = req.files?.image?.[0];
    if (!file) {
      return generateResponse(res, 400, false, "Item image is required");
    }

    // Upload to Cloudinary
    const sanitizedTitle = `${title.replace(/\s+/g, "-")}-${Date.now()}`;
    const result = await cloudinaryUpload(file.path, sanitizedTitle, "items");

    // Create DB entry
    const newItem = await Item.create({
      title,
      subtitle,
      type,
      image: result.url,
    });

    return generateResponse(res, 201, true, "Item created successfully", newItem);
  } catch (error) {
    console.error("Create Item Error:", error);
    return generateResponse(res, 500, false, error.message || "Failed to create item");
  }
};
/**
 * Get all items
 */
export const getAllItems= async (req, res) => {
  try {
    const items = await Item.find();
    return generateResponse(res, 200, true, "Items fetched successfully", items);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Failed to fetch items");
  }
};

/**
 * Get item by ID
 */
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return generateResponse(res, 404, false, "Item not found");
    return generateResponse(res, 200, true, "Item fetched successfully", item);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Failed to fetch item");
  }
};

/**
 * Update item
 */
export const updateItem = async (req, res) => {
  try {
    const { title, subtitle, type } = req.body;

    const updateData = { title, subtitle, type };

    if (req.files?.image && req.files.image[0]) {
      const file = req.files.image[0];
      const sanitizedTitle = `${title?.replace(/\s+/g, "-") || "item"}-${Date.now()}`;

      const cloudinaryResult = await cloudinaryUpload(file.path, sanitizedTitle, "items");
      updateData.image = cloudinaryResult.url;
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedItem) return generateResponse(res, 404, false, "Item not found");

    return generateResponse(res, 200, true, "Item updated successfully", updatedItem);
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Failed to update item");
  }
};

/**
 * Delete item
 */
export const deleteItem= async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return generateResponse(res, 404, false, "Item not found");

    return generateResponse(res, 200, true, "Item deleted successfully");
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, "Failed to delete item");
  }
};
