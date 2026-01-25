import { FaqSection } from "./faq.model.js";
import { sanitizeFaqHtml } from "../../lib/sanitizeHtml.js";

function normalizeItems(items = []) {
    let defaultOpenSeen = false;

    return items.map((it, idx) => {
        const raw = it?.answer?.raw ?? it?.answer ?? "";
        const format = it?.answer?.format ?? it?.answerFormat ?? "html";

        const sanitized = format === "html" ? sanitizeFaqHtml(raw) : raw;

        // enforce only one defaultOpen (query updates won't run pre-save hook)
        let defaultOpen = Boolean(it.defaultOpen);
        if (defaultOpen) {
            if (defaultOpenSeen) defaultOpen = false;
            defaultOpenSeen = true;
        }

        return {
            ...it,
            order: Number.isFinite(it.order) ? it.order : idx,
            defaultOpen,
            answer: { raw, sanitized, format },
        };
    });
}

function sanitizeCta(cta) {
    if (!cta) return cta;

    const href = cta?.button?.href;
    const safeHref =
        typeof href === "string" &&
            (href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://") || href.startsWith("mailto:"))
            ? href
            : "/contact";

    return {
        ...cta,
        button: { ...(cta.button || {}), href: safeHref },
    };
}

export async function upsertFaqSection(key, payload, userId) {
    const update = {
        title: payload.title,
        subtitle: payload.subtitle,
        status: payload.status,
        // Safety check: Only sanitize if CTA exists
        cta: payload.cta ? sanitizeCta(payload.cta) : undefined,
        // Safety check: Only normalize if items exist
        items: payload.items ? normalizeItems(payload.items) : [],
        updatedBy: userId,
    };

    // publishedAt enforcement (since pre-save won't run)
    if (payload.status === "published") {
        update.publishedAt = payload.publishedAt || new Date();
    }
    if (payload.status !== "published") {
        update.publishedAt = payload.publishedAt || undefined;
    }

    return FaqSection.findOneAndUpdate(
        { key },
        { $set: update, $setOnInsert: { key, createdBy: userId } },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
}

export async function getFaqSectionAdmin(key) {
    const doc = await FaqSection.findOne({ key }).lean();
    if (!doc) {
        const err = new Error("FAQ section not found");
        err.statusCode = 404;
        throw err;
    }
    return doc;
}

export async function getFaqSectionPublic(key) {
    const doc = await FaqSection.findOne({ key, status: "published" }).lean();
    if (!doc) throw new Error(404, "FAQ not found");

    // Safety check for items
    if (doc.items && doc.items.length > 0) {
        doc.items = doc.items
            .filter((i) => i.isActive)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((i) => ({
                ...i,
                answer: { sanitized: i.answer?.sanitized, format: i.answer?.format },
            }));
    }

    return doc;
}

