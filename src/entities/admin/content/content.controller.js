import { cloudinaryUpload } from '../../../lib/cloudinaryUpload.js';
// Your helper for consistent responses
// import fs from 'fs';
import Item from './content.model.js';
import Header from './header.model.js';
import { generateResponse } from '../../../lib/responseFormate.js';
import {
  getCategoryLookupValues,
  getCanonicalCategorySlug,
  resolveCanonicalCategorySlug,
  withResolvedSlug
} from '../../../lib/seoSlug.js';
// import { cloudinaryDelete } from './cloudinary.js';

/**
 * Create Item
 * Accepts: title, subtitle, type + image file
 * Expects multerUpload([{ name: "image", maxCount: 1 }])
 */

export const createItem = async (req, res) => {
  try {
    let { title, subtitle, type, slug, prompt, color } = req.body;
    // Always store type in lowercase and trimmed for consistency
    if (type) type = type.trim().toLowerCase();
    if (slug) slug = getCanonicalCategorySlug(slug, type || title);

    // Check if image exists
    const file = req.files?.image?.[0];
    if (!file) {
      return generateResponse(res, 400, false, 'Item image is required');
    }

    // Upload main image to Cloudinary
    const sanitizedTitle = `${title.replace(/\s+/g, '-')}-${Date.now()}`;
    const result = await cloudinaryUpload(file.path, sanitizedTitle, 'items');

    // Upload gallery images (optional)
    const galleryFiles = req.files?.gallery || [];
    const gallery = [];
    for (const galleryFile of galleryFiles) {
      const galleryTitle = `${title.replace(/\s+/g, '-')}-gallery-${Date.now()}`;
      const galleryResult = await cloudinaryUpload(
        galleryFile.path,
        galleryTitle,
        'items'
      );
      gallery.push(galleryResult.url);
    }

    // Create DB entry
    const newItem = await Item.create({
      title,
      subtitle,
      type,
      slug,
      prompt,
      color,
      image: result.url,
      gallery
    });

    return generateResponse(
      res,
      201,
      true,
      'Item created successfully',
      newItem
    );
  } catch (error) {
    console.error('Create Item Error:', error);
    return generateResponse(
      res,
      500,
      false,
      error.message || 'Failed to create item'
    );
  }
};
/**
 * Get all items
 */
export const getAllItems = async (req, res) => {
  try {
    // Get type from query string
    const { type, slug } = req.query;

    // Build filter object
    const filter = {};
    if (type) filter.type = type.trim().toLowerCase();
    if (slug) {
      const normalizedSlug = resolveCanonicalCategorySlug(slug);
      const lookupValues = getCategoryLookupValues(normalizedSlug);
      filter.$or = [{ slug: normalizedSlug }, { type: { $in: lookupValues } }];
    }

    // Fetch items matching the filter
    const items = await Item.find(filter);

    return generateResponse(
      res,
      200,
      true,
      'Items fetched successfully',
      items.map((item) => withResolvedSlug(item))
    );
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'Failed to fetch items');
  }
};

/**
 * Get item by ID
 */
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return generateResponse(res, 404, false, 'Item not found');
    return generateResponse(
      res,
      200,
      true,
      'Item fetched successfully',
      withResolvedSlug(item)
    );
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'Failed to fetch item');
  }
};

/**
 * Update item
 */
// export const updateItem = async (req, res) => {
//   try {
//     let { title, subtitle, type, color, prompt } = req.body;
//     // Always store type in lowercase and trimmed for consistency
//     if (type) type = type.trim().toLowerCase();

//     const updateData = { title, subtitle, type, color };
//     if (prompt !== undefined) updateData.prompt = prompt;

//     if (req.files?.image && req.files.image[0]) {
//       const file = req.files.image[0];
//       const sanitizedTitle = `${title?.replace(/\s+/g, '-') || 'item'}-${Date.now()}`;

//       const cloudinaryResult = await cloudinaryUpload(
//         file.path,
//         sanitizedTitle,
//         'items'
//       );
//       updateData.image = cloudinaryResult.url;
//     }

//     if (req.files?.gallery && req.files.gallery.length > 0) {
//       const gallery = [];
//       for (const galleryFile of req.files.gallery) {
//         const galleryTitle = `${title?.replace(/\s+/g, '-') || 'item'}-gallery-${Date.now()}`;
//         const galleryResult = await cloudinaryUpload(
//           galleryFile.path,
//           galleryTitle,
//           'items'
//         );
//         gallery.push(galleryResult.url);
//       }
//       updateData.gallery = gallery;
//     }

//     const updatedItem = await Item.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true }
//     );
//     if (!updatedItem)
//       return generateResponse(res, 404, false, 'Item not found');

//     return generateResponse(
//       res,
//       200,
//       true,
//       'Item updated successfully',
//       updatedItem
//     );
//   } catch (error) {
//     console.error(error);
//     return generateResponse(res, 500, false, 'Failed to update item');
//   }
// };




export const updateItem = async (req, res) => {
  try {
    let {
      title,
      subtitle,
      type,
      slug,
      color,
      prompt,
      galleryAction,
      removeGalleryUrls
    } = req.body;
    if (type) type = type.trim().toLowerCase();
    if (slug) slug = getCanonicalCategorySlug(slug, type || title);

    // ✅ Fetch existing item first
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) return generateResponse(res, 404, false, "Item not found");

    const updateData = {};

    // ✅ Only add text fields that are actually provided
    if (title    !== undefined) updateData.title    = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (type     !== undefined) updateData.type     = type;
    if (slug     !== undefined) updateData.slug     = slug;
    if (color    !== undefined) updateData.color    = color;
    if (prompt   !== undefined) updateData.prompt   = prompt;
    if (updateData.type && updateData.type !== 'home' && !updateData.slug) {
      updateData.slug = getCanonicalCategorySlug(
        existingItem.slug || updateData.type,
        updateData.type
      );
    }

    // ✅ Handle single image — comes from req.files, NOT req.body
    if (req.files?.image?.[0]) {
      const file           = req.files.image[0];
      const sanitizedTitle = `${(title || existingItem.title).replace(/\s+/g, "-")}-${Date.now()}`;
      const cloudinaryResult = await cloudinaryUpload(file.path, sanitizedTitle, "items");
      updateData.image     = cloudinaryResult.url;
    }

    // ✅ Handle gallery — comes from req.files, NOT req.body
    if (req.files?.gallery?.length > 0) {
      const uploadedUrls = [];

      await Promise.all(
        req.files.gallery.map(async (galleryFile, index) => {
          // ✅ index suffix prevents duplicate filenames in parallel uploads
          const galleryTitle = `${(title || existingItem.title).replace(/\s+/g, "-")}-gallery-${Date.now()}-${index}`;
          const galleryResult = await cloudinaryUpload(galleryFile.path, galleryTitle, "items");
          uploadedUrls.push(galleryResult.url);
        })
      );

      if (galleryAction === "replace") {
        updateData.gallery = uploadedUrls;
      } else {
        // default: append
        updateData.gallery = [...(existingItem.gallery || []), ...uploadedUrls];
      }
    }

    // ✅ Handle gallery URL removal
    if (removeGalleryUrls) {
      const toRemove       = Array.isArray(removeGalleryUrls) ? removeGalleryUrls : [removeGalleryUrls];
      const currentGallery = updateData.gallery ?? existingItem.gallery ?? [];
      updateData.gallery   = currentGallery.filter((url) => !toRemove.includes(url));
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return generateResponse(
      res,
      200,
      true,
      "Item updated successfully",
      withResolvedSlug(updatedItem)
    );
  } catch (error) {
    console.error("[updateItem]", error);
    return generateResponse(res, 500, false, "Failed to update item");
  }
};



/**
 * Delete item
 */
// export const deleteItem = async (req, res) => {
//   try {
//     const deletedItem = await Item.findByIdAndDelete(req.params.id);
//     if (!deletedItem)
//       return generateResponse(res, 404, false, 'Item not found');

//     return generateResponse(res, 200, true, 'Item deleted successfully');
//   } catch (error) {
//     console.error(error);
//     return generateResponse(res, 500, false, 'Failed to delete item');
//   }
// };






export const deleteItem = async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem)
      return generateResponse(res, 404, false, "Item not found");

    // ✅ Collect all Cloudinary image URLs to delete
    const imagesToDelete = [];
    if (deletedItem.image)                     imagesToDelete.push(deletedItem.image);
    if (deletedItem.gallery?.length > 0)       imagesToDelete.push(...deletedItem.gallery);

    // ✅ Delete all images from Cloudinary in parallel
    if (imagesToDelete.length > 0) {
      await Promise.all(
        imagesToDelete.map((url) => cloudinaryDelete(url))
      );
    }

    return generateResponse(res, 200, true, "Item deleted successfully");
  } catch (error) {
    console.error("[deleteItem]", error);
    return generateResponse(res, 500, false, "Failed to delete item");
  }
};

export const getItemBySlug = async (req, res) => {
  try {
    const slug = resolveCanonicalCategorySlug(req.params.slug);
    const lookupValues = getCategoryLookupValues(slug);
    const item = await Item.findOne({
      $or: [{ slug }, { type: { $in: lookupValues } }]
    });

    if (!item) {
      return generateResponse(res, 404, false, 'Item not found');
    }

    return generateResponse(
      res,
      200,
      true,
      'Item fetched successfully',
      withResolvedSlug(item)
    );
  } catch (error) {
    console.error(error);
    return generateResponse(res, 500, false, 'Failed to fetch item');
  }
};




// ==================== HEADER CONTROLLERS ====================

/**
 * Create or Update Header (upsert - only one header exists)
 */
export const createOrUpdateHeader = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    if (!title) {
      return generateResponse(res, 400, false, 'Title is required');
    }

    // Upsert: update if exists, create if not
    const header = await Header.findOneAndUpdate(
      {},
      { title, subtitle },
      { new: true, upsert: true }
    );

    return generateResponse(
      res,
      200,
      true,
      'Header saved successfully',
      header
    );
  } catch (error) {
    console.error('Create/Update Header Error:', error);
    return generateResponse(
      res,
      500,
      false,
      error.message || 'Failed to save header'
    );
  }
};

/**
 * Get Header
 */
export const getHeader = async (req, res) => {
  try {
    const header = await Header.findOne();
    if (!header) {
      return generateResponse(res, 404, false, 'Header not found');
    }
    return generateResponse(
      res,
      200,
      true,
      'Header fetched successfully',
      header
    );
  } catch (error) {
    console.error('Get Header Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch header');
  }
};

/**
 * Get distinct types
 * GET /admin/content/types/list
 */
export const getDistinctTypes = async (req, res) => {
  try {
    const types = await Item.distinct('type');
    return generateResponse(
      res,
      200,
      true,
      'Types fetched successfully',
      types
    );
  } catch (error) {
    console.error('Get Distinct Types Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch types');
  }
};
