import mongoose from 'mongoose';
import { getCanonicalCategorySlug } from '../../lib/seoSlug.js';

const CmsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Type is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true
    },
    title: {
      type: String,
      trim: true
    },
    // Tiptap rich text content stored as JSON
    richText: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Plain text version for search/preview
    plainText: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

CmsSchema.pre('validate', function setCanonicalSlug(next) {
  if (this.type) {
    this.type = this.type.trim().toLowerCase();
  }

  if (this.type && this.type !== 'home') {
    this.slug = getCanonicalCategorySlug(this.slug || this.type, this.type);
  } else if (this.type === 'home') {
    this.slug = this.slug || 'home';
  }

  next();
});

// Index for faster queries
CmsSchema.index({ type: 1, isActive: 1 });
CmsSchema.index({ slug: 1, isActive: 1 });
CmsSchema.index({ createdAt: -1 });

const Cms = mongoose.model('Cms', CmsSchema);
export default Cms;
