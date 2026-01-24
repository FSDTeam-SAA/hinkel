import mongoose from "mongoose";

const FaqItemSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, trim: true, maxlength: 200 },

        answer: {
            raw: { type: String, required: true, trim: true, maxlength: 20000 },
            sanitized: { type: String, trim: true, maxlength: 20000 },
            format: { type: String, enum: ["plain", "markdown", "html"], default: "html" },
        },

        order: { type: Number, default: 0, index: true },
        isActive: { type: Boolean, default: true },
        defaultOpen: { type: Boolean, default: false },
    },
    { _id: true }
);


const FaqCtaSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: true },
        heading: { type: String, trim: true, default: "Still have questions?" },
        text: { type: String, trim: true },

        button: {
            label: { type: String, trim: true, default: "Get in touch" },
            href: { type: String, trim: true, default: "/contact" },
            target: { type: String, enum: ["_self", "_blank"], default: "_self" },
        },

        avatars: [
            {
                url: { type: String, trim: true },
                alt: { type: String, trim: true },
            },
        ],
    },
    { _id: false }
);

const FaqSectionSchema = new mongoose.Schema(
    {
        // Identifies where this FAQ block is used (page/placement)
        // Examples: "pricing", "billing", "home", "product"
        key: { type: String, required: true, trim: true, lowercase: true, unique: true },

        title: { type: String, required: true, trim: true, default: "Frequently asked questions" },
        subtitle: { type: String, trim: true },

        items: { type: [FaqItemSchema], default: [] },
        cta: { type: FaqCtaSchema, default: () => ({ enabled: true }) },

        // Admin lifecycle
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            index: true,
        },
        publishedAt: { type: Date },

        // Auditing
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// Enforce: only one defaultOpen item
FaqSectionSchema.pre("save", function (next) {
    if (this.isModified("items")) {
        let found = false;
        for (const item of this.items) {
            if (!item.defaultOpen) continue;
            if (found) item.defaultOpen = false;
            found = true;
        }
    }
    if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    next();
});

export const FaqSection = mongoose.model("FaqSection", FaqSectionSchema);
