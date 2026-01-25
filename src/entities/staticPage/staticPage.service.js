import { StaticPage } from "./staticPage.model.js";

function assertPlainText(input, fieldName) {
    if (typeof input !== "string") {
        const err = new Error(`${fieldName} must be a string`);
        err.statusCode = 400;
        throw err;
    }
    // reject HTML tags
    if (/<\/?[a-z][\s\S]*>/i.test(input)) {
        const err = new Error(`${fieldName} must be plain text (HTML is not allowed)`);
        err.statusCode = 400;
        throw err;
    }
}

export async function upsertStaticPage(key, payload, userId) {
    const normKey = String(key).trim().toLowerCase();

    if (payload.title != null) assertPlainText(payload.title, "title");
    if (payload.content != null) assertPlainText(payload.content, "content");

    const update = {
        ...(payload.title != null ? { title: payload.title.trim() } : {}),
        ...(payload.content != null ? { content: payload.content.trim() } : {}),
        ...(payload.status != null ? { status: payload.status } : {}),
        updatedBy: userId,
    };

    if (payload.status === "published") update.publishedAt = new Date();

    return StaticPage.findOneAndUpdate(
        { key: normKey },
        { $set: update, $setOnInsert: { key: normKey, createdBy: userId } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
}

export async function getStaticPageAdmin(key) {
    const normKey = String(key).trim().toLowerCase();
    const doc = await StaticPage.findOne({ key: normKey }).lean();
    if (!doc) {
        const err = new Error("Page not found");
        err.statusCode = 404;
        throw err;
    }
    return doc;
}

export async function getStaticPagePublic(key) {
    const normKey = String(key).trim().toLowerCase();
    const doc = await StaticPage.findOne({ key: normKey, status: "published" }).lean();
    if (!doc) {
        const err = new Error("Page not found");
        err.statusCode = 404;
        throw err;
    }
    return doc;
}
