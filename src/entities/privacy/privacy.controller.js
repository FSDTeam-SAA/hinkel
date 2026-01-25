import {
  upsertPrivacyPolicy,
  getPrivacyPolicyAdmin,
  getPrivacyPolicyPublic,
} from "./privacy.service.js";

export async function upsertPrivacyPolicyHandler(req, res, next) {
  try {
    const userId = req.user?._id; // if auth sets req.user
    const data = await upsertPrivacyPolicy(req.body, userId);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Privacy policy saved",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPrivacyPolicyAdminHandler(req, res, next) {
  try {
    const data = await getPrivacyPolicyAdmin();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Privacy policy fetched",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPrivacyPolicyPublicHandler(req, res, next) {
  try {
    const data = await getPrivacyPolicyPublic();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Privacy policy fetched",
      data,
    });
  } catch (err) {
    next(err);
  }
}
