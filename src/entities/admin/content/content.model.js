import mongoose from 'mongoose';
import { getCanonicalCategorySlug } from '../../../lib/seoSlug.js';

const ItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    color:{type:String},
    subtitle: { type: String },
    type: { type: String, required: true },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    image: { type: String },
    gallery: { type: [String], default: [] },
    prompt: { type: String }
  },
  { timestamps: true }
);

ItemSchema.pre('validate', function setCanonicalSlug(next) {
  const normalizedType = this.type?.trim().toLowerCase();

  if (normalizedType && normalizedType !== 'home') {
    this.slug = getCanonicalCategorySlug(this.slug || normalizedType, normalizedType);
  } else if (normalizedType === 'home') {
    this.slug = this.slug || 'home';
  }

  next();
});

const Item = mongoose.model("Item", ItemSchema);
export default Item
