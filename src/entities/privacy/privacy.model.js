import mongoose from "mongoose";

const PrivacyPolicySchema = new mongoose.Schema(
  {
    // Singleton identifier (keeps it extensible later)
    key: {
      type: String,
      required: true,
      unique: true,
      default: "privacy",
      lowercase: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    // TEXT ONLY (no HTML)
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100000,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    publishedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PrivacyPolicy = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
