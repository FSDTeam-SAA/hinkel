import Cms from './cms.model.js';
import { cloudinaryUpload } from '../../lib/cloudinaryUpload.js';
import {
  getCategoryLookupValues,
  getCanonicalCategorySlug,
  resolveCanonicalCategorySlug,
  withResolvedSlug
} from '../../lib/seoSlug.js';

/**
 * Create new CMS content
 */
export const createCmsContent = async (data, imageFile) => {
  let imageUrl = null;
  const normalizedType = data.type?.trim().toLowerCase();

  // Upload image to Cloudinary if provided
  if (imageFile) {
    const sanitizedName = `cms-${normalizedType}-${Date.now()}`.replace(/\s+/g, '-');
    const result = await cloudinaryUpload(imageFile.path, sanitizedName, 'cms');
    imageUrl = result.url || null;
  }

  const cmsContent = await Cms.create({
    ...data,
    type: normalizedType,
    slug: getCanonicalCategorySlug(data.slug || normalizedType, normalizedType),
    image: imageUrl
  });

  return withResolvedSlug(cmsContent);
};

/**
 * Get all CMS content with optional filtering
 */
export const getAllCmsContent = async (query = {}) => {
  const {
    type,
    slug,
    isActive,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const filter = {};
  if (type) filter.type = type.trim().toLowerCase();
  if (slug) {
    const normalizedSlug = resolveCanonicalCategorySlug(slug);
    filter.$or = [
      { slug: normalizedSlug },
      { type: { $in: getCategoryLookupValues(normalizedSlug) } }
    ];
  }
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [contents, total] = await Promise.all([
    Cms.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
    Cms.countDocuments(filter)
  ]);

  return {
    contents: contents.map((content) => withResolvedSlug(content)),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get CMS content by type
 */
export const getCmsContentByType = async (type, query = {}) => {
  const { isActive, page = 1, limit = 10 } = query;

  const filter = { type: type.trim().toLowerCase() };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [contents, total] = await Promise.all([
    Cms.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Cms.countDocuments(filter)
  ]);

  return {
    contents: contents.map((content) => withResolvedSlug(content)),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

export const getCmsContentBySlug = async (slug, query = {}) => {
  const { isActive, page = 1, limit = 10 } = query;
  const normalizedSlug = resolveCanonicalCategorySlug(slug);
  const filter = {
    $or: [
      { slug: normalizedSlug },
      { type: { $in: getCategoryLookupValues(normalizedSlug) } }
    ]
  };

  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [contents, total] = await Promise.all([
    Cms.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Cms.countDocuments(filter)
  ]);

  return {
    contents: contents.map((content) => withResolvedSlug(content)),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * Get CMS content by ID
 */
export const getCmsContentById = async (id) => {
  const content = await Cms.findById(id);
  return withResolvedSlug(content);
};

/**
 * Update CMS content by ID
 */
export const updateCmsContentById = async (id, data, imageFile) => {
  const existingContent = await Cms.findById(id);
  if (!existingContent) return null;
  const normalizedType = data.type?.trim().toLowerCase() || existingContent.type;

  let imageUrl = existingContent.image;

  // Upload new image if provided
  if (imageFile) {
    const sanitizedName =
      `cms-${normalizedType}-${Date.now()}`.replace(
        /\s+/g,
        '-'
      );
    const result = await cloudinaryUpload(imageFile.path, sanitizedName, 'cms');
    imageUrl = result.url || existingContent.image;
  }

  const updatedContent = await Cms.findByIdAndUpdate(
    id,
    {
      ...data,
      type: normalizedType,
      slug: getCanonicalCategorySlug(
        data.slug || existingContent.slug || normalizedType,
        normalizedType
      ),
      image: imageUrl
    },
    { new: true, runValidators: true }
  );

  return withResolvedSlug(updatedContent);
};

/**
 * Delete CMS content by ID
 */
export const deleteCmsContentById = async (id) => {
  const deletedContent = await Cms.findByIdAndDelete(id);
  return withResolvedSlug(deletedContent);
};

/**
 * Get distinct types
 */
export const getDistinctTypes = async () => {
  const types = await Cms.distinct('type');
  return types;
};

/**
 * Bulk update order
 */
export const updateCmsOrder = async (items) => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { order: item.order }
    }
  }));

  await Cms.bulkWrite(bulkOps);
  return true;
};
