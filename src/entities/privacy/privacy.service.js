import { PrivacyPolicy } from "./privacy.model.js";

// Basic “text-only” guard (reject HTML tags)
function assertPlainText(input, fieldName = "content") {
  if (typeof input !== "string") {
    const err = new Error(`${fieldName} must be a string`);
    err.statusCode = 400;
    throw err;
  }
  // Reject any HTML-like tags
  if (/<\/?[a-z][\s\S]*>/i.test(input)) {
    const err = new Error(`${fieldName} must be plain text (HTML is not allowed)`);
    err.statusCode = 400;
    throw err;
  }
}

export async function upsertPrivacyPolicy(payload, userId) {
  if (payload.title != null) assertPlainText(payload.title, "title");
  if (payload.content != null) assertPlainText(payload.content, "content");

  const update = {
    ...(payload.title != null ? { title: payload.title.trim() } : {}),
    ...(payload.content != null ? { content: payload.content.trim() } : {}),
    ...(payload.status != null ? { status: payload.status } : {}),
    updatedBy: userId,
  };

  // Ensure publishedAt is set when publishing (important for findOneAndUpdate)
  if (payload.status === "published") update.publishedAt = new Date();

  return PrivacyPolicy.findOneAndUpdate(
    { key: "privacy" },
    { $set: update, $setOnInsert: { key: "privacy", createdBy: userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

export async function getPrivacyPolicyAdmin() {
  const doc = await PrivacyPolicy.findOne({ key: "privacy" }).lean();
  if (!doc) {
    const err = new Error("Privacy policy not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

export async function getPrivacyPolicyPublic() {
  const doc = await PrivacyPolicy.findOne({ key: "privacy", status: "published" }).lean();
  if (!doc) {
    const err = new Error("Privacy policy not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
}
