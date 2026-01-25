import { PrivacyPolicy } from "./privacy.model.js";

export async function upsertPrivacyPolicy(payload, userId) {
  const update = {
    ...(payload.title != null ? { title: String(payload.title).trim() } : {}),
    ...(payload.content != null ? { content: String(payload.content).trim() } : {}),
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
