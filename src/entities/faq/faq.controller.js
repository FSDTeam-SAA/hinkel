import {
    upsertFaqSection,
    getFaqSectionAdmin,
    getFaqSectionPublic,
} from "./faq.service.js";

// ADMIN: GET section (draft/published)
export async function getFaqSectionAdminHandler(req, res, next) {
    try {
        const { key } = req.params;
        const data = await getFaqSectionAdmin(key);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "FAQ section fetched",
            data,
        });
    } catch (err) {
        next(err);
    }
}

// ADMIN: PUT upsert section
export async function upsertFaqSectionHandler(req, res, next) {
    try {
        const { key } = req.params;
        const userId = req.user?._id; // if your auth middleware sets req.user

        const data = await upsertFaqSection(key, req.body, userId);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "FAQ section saved",
            data,
        });
    } catch (err) {
        // translate service statusCode -> http
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                statusCode: err.statusCode,
                error: err.statusCode === 404 ? "Not Found" : "Error",
                message: err.message,
            });
        }
        next(err);
    }
}

// PUBLIC: GET published section (only active items + sanitized answers)
export async function getFaqSectionPublicHandler(req, res, next) {
    try {
        const { key } = req.params;
        const data = await getFaqSectionPublic(key);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "FAQ fetched",
            data,
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({
                success: false,
                statusCode: err.statusCode,
                error: err.statusCode === 404 ? "Not Found" : "Error",
                message: err.message,
            });
        }
        next(err);
    }
}
