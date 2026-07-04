import { generateResponse } from '../../lib/responseFormate.js';
import * as cmsService from './cms.service.js';
import { resolveCanonicalCategorySlug } from '../../lib/seoSlug.js';

/**
 * Create new CMS content
 * POST /content/cms
 */
export const createCmsContent = async (req, res) => {
  try {
    const { type, slug, title, richText, plainText, isActive, order, metadata } =
      req.body;

    if (!type) {
      return generateResponse(res, 400, false, 'Type is required');
    }

    // Parse richText if it's a string (from form-data)
    let parsedRichText = richText;
    if (typeof richText === 'string') {
      try {
        parsedRichText = JSON.parse(richText);
      } catch (e) {
        parsedRichText = richText;
      }
    }

    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        parsedMetadata = {};
      }
    }

    const imageFile = req.files?.image?.[0] || null;

    const content = await cmsService.createCmsContent(
      {
        type,
        slug,
        title,
        richText: parsedRichText,
        plainText,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        metadata: parsedMetadata
      },
      imageFile
    );

    return generateResponse(
      res,
      201,
      true,
      'CMS content created successfully',
      content
    );
  } catch (error) {
    console.error('Create CMS Content Error:', error);
    return generateResponse(
      res,
      500,
      false,
      error.message || 'Failed to create CMS content'
    );
  }
};

/**
 * Get all CMS content
 * GET /content/cms
 */
export const getAllCmsContent = async (req, res) => {
  try {
    const result = await cmsService.getAllCmsContent(req.query);
    return generateResponse(
      res,
      200,
      true,
      'CMS content fetched successfully',
      result
    );
  } catch (error) {
    console.error('Get All CMS Content Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch CMS content');
  }
};

/**
 * Get CMS content by type
 * GET /content/cms/type/:type
 */
export const getCmsContentByType = async (req, res) => {
  try {
    const { type } = req.params;
    const result = await cmsService.getCmsContentByType(type, req.query);
    return generateResponse(
      res,
      200,
      true,
      'CMS content fetched successfully',
      result
    );
  } catch (error) {
    console.error('Get CMS Content By Type Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch CMS content');
  }
};

export const getCmsContentBySlug = async (req, res) => {
  try {
    const slug = resolveCanonicalCategorySlug(req.params.slug);
    const result = await cmsService.getCmsContentBySlug(slug, req.query);
    return generateResponse(
      res,
      200,
      true,
      'CMS content fetched successfully',
      result
    );
  } catch (error) {
    console.error('Get CMS Content By Slug Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch CMS content');
  }
};

/**
 * Get CMS content by ID
 * GET /content/cms/:id
 */
export const getCmsContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await cmsService.getCmsContentById(id);

    if (!content) {
      return generateResponse(res, 404, false, 'CMS content not found');
    }

    return generateResponse(
      res,
      200,
      true,
      'CMS content fetched successfully',
      content
    );
  } catch (error) {
    console.error('Get CMS Content By ID Error:', error);
    return generateResponse(res, 500, false, 'Failed to fetch CMS content');
  }
};

/**
 * Update CMS content by ID
 * PATCH /content/cms/:id
 */
export const updateCmsContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, slug, title, richText, plainText, isActive, order, metadata } =
      req.body;

    // Parse richText if it's a string (from form-data)
    let parsedRichText = richText;
    if (typeof richText === 'string') {
      try {
        parsedRichText = JSON.parse(richText);
      } catch (e) {
        parsedRichText = richText;
      }
    }

    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        parsedMetadata = undefined;
      }
    }

    const imageFile = req.files?.image?.[0] || null;

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (slug !== undefined) updateData.slug = slug;
    if (title !== undefined) updateData.title = title;
    if (parsedRichText !== undefined) updateData.richText = parsedRichText;
    if (plainText !== undefined) updateData.plainText = plainText;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;
    if (parsedMetadata !== undefined) updateData.metadata = parsedMetadata;

    const content = await cmsService.updateCmsContentById(
      id,
      updateData,
      imageFile
    );

    if (!content) {
      return generateResponse(res, 404, false, 'CMS content not found');
    }

    return generateResponse(
      res,
      200,
      true,
      'CMS content updated successfully',
      content
    );
  } catch (error) {
    console.error('Update CMS Content Error:', error);
    return generateResponse(
      res,
      500,
      false,
      error.message || 'Failed to update CMS content'
    );
  }
};

/**
 * Delete CMS content by ID
 * DELETE /content/cms/:id
 */
export const deleteCmsContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await cmsService.deleteCmsContentById(id);

    if (!content) {
      return generateResponse(res, 404, false, 'CMS content not found');
    }

    return generateResponse(
      res,
      200,
      true,
      'CMS content deleted successfully',
      content
    );
  } catch (error) {
    console.error('Delete CMS Content Error:', error);
    return generateResponse(res, 500, false, 'Failed to delete CMS content');
  }
};

/**
 * Get distinct types
 * GET /content/cms/types/list
 */
export const getDistinctTypes = async (req, res) => {
  try {
    const types = await cmsService.getDistinctTypes();
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

/**
 * Bulk update order
 * PATCH /content/cms/order/bulk
 */
export const updateCmsOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return generateResponse(res, 400, false, 'Items array is required');
    }

    await cmsService.updateCmsOrder(items);
    return generateResponse(res, 200, true, 'Order updated successfully');
  } catch (error) {
    console.error('Update CMS Order Error:', error);
    return generateResponse(res, 500, false, 'Failed to update order');
  }
};
