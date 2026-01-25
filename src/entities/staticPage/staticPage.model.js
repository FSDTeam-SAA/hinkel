import mongoose from "mongoose";

const StaticPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },

    content: { type: String, required: true, trim: true, maxlength: 100000 },

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

export const StaticPage = mongoose.model("StaticPage", StaticPageSchema);
