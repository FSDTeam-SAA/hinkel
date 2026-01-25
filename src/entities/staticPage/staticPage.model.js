import mongoose from "mongoose";

const StaticPageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true }, // Simple string storage
        
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export const StaticPage = mongoose.model("StaticPage", StaticPageSchema);