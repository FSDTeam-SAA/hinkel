import {
    upsertStaticPage,
    getStaticPageAdmin,
    getStaticPagePublic,
} from "./staticPage.service.js";

export async function upsertStaticPageHandler(req, res, next) {
    try {
        const { key } = req.params;
        const userId = req.user?._id;

        const data = await upsertStaticPage(key, req.body, userId);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Page saved",
            data,
        });
    } catch (err) {
        next(err);
    }
}

export async function getStaticPageAdminHandler(req, res, next) {
    try {
        const { key } = req.params;
        const data = await getStaticPageAdmin(key);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Page fetched",
            data,
        });
    } catch (err) {
        next(err);
    }
}

export async function getStaticPagePublicHandler(req, res, next) {
    try {
        const { key } = req.params;
        const data = await getStaticPagePublic(key);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Page fetched",
            data,
        });
    } catch (err) {
        next(err);
    }
}
