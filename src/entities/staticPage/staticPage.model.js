import mongoose from "mongoose";

const StaticPageSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[a-z0-9-]+$/, // e.g. "privacy", "about", "terms"
        },

        title: { type: String, required: true, trim: true, maxlength: 200 },

        // TEXT ONLY (no HTML)
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
