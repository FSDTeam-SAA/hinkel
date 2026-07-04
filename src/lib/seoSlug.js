const CATEGORY_SLUG_MAP = {
  kids: 'kids-coloring-books',
  'kids coloring books': 'kids-coloring-books',
  pets: 'pet-coloring-books',
  'pet portrait sketchbook': 'pet-coloring-books',
  anime: 'anime-portrait-coloring-books',
  'anime portraits': 'anime-portrait-coloring-books',
  dementia: 'dementia-friendly-coloring-books',
  'dementia friendly': 'dementia-friendly-coloring-books',
  seniors: 'dementia-friendly-coloring-books'
};

const LEGACY_SLUG_ALIASES = {
  kids: 'kids-coloring-books',
  'kids-coloring-books': 'kids-coloring-books',
  pets: 'pet-coloring-books',
  'pet-coloring-books': 'pet-coloring-books',
  anime: 'anime-portrait-coloring-books',
  'anime-portrait-coloring-books': 'anime-portrait-coloring-books',
  dementia: 'dementia-friendly-coloring-books',
  'dementia friendly': 'dementia-friendly-coloring-books',
  'dementia-friendly': 'dementia-friendly-coloring-books',
  'dementia-friendly-coloring-books': 'dementia-friendly-coloring-books',
  seniors: 'dementia-friendly-coloring-books'
};

const CATEGORY_LOOKUP_VALUES = {
  'kids-coloring-books': ['kids', 'kids coloring books'],
  'pet-coloring-books': ['pets', 'pet portrait sketchbook'],
  'anime-portrait-coloring-books': ['anime', 'anime portraits'],
  'dementia-friendly-coloring-books': [
    'dementia',
    'dementia friendly',
    'dementia-friendly',
    'seniors'
  ]
};

const normalizeValue = (value = '') =>
  String(value)
    .trim()
    .toLowerCase();

export const slugify = (value = '') =>
  normalizeValue(value)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

export const getCanonicalCategorySlug = (value = '', fallback = '') => {
  const normalizedValue = normalizeValue(value);

  return (
    CATEGORY_SLUG_MAP[normalizedValue] ||
    LEGACY_SLUG_ALIASES[normalizedValue] ||
    slugify(normalizedValue || fallback)
  );
};

export const resolveCanonicalCategorySlug = (value = '') => {
  const normalizedValue = normalizeValue(decodeURIComponent(value));
  return LEGACY_SLUG_ALIASES[normalizedValue] || slugify(normalizedValue);
};

export const getCategoryLookupValues = (value = '') => {
  const canonicalSlug = resolveCanonicalCategorySlug(value);
  return [canonicalSlug, ...(CATEGORY_LOOKUP_VALUES[canonicalSlug] || [])];
};

export const withResolvedSlug = (record) => {
  if (!record) {
    return record;
  }

  const source = typeof record.toObject === 'function' ? record.toObject() : record;
  const slug = source.slug || getCanonicalCategorySlug(source.slug || source.type || source.title);

  return {
    ...source,
    slug
  };
};
