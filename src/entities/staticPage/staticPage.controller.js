import { saveAboutUs, getAboutUs } from "./staticPage.service.js";

// POST: Admin saves/updates the content
export const saveAboutUsHandler = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const data = await saveAboutUs(req.body, userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "About Us content published successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

// GET: Everyone (Public or Admin) gets the same content
export const getAboutUsHandler = async (req, res, next) => {
  try {
    const data = await getAboutUs();

    res.status(200).json({
      success: true,
      statusCode: 200,
      data
    });
  } catch (err) {
    // This will catch the 404 from the service if the doc doesn't exist
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message
        });
    }
    next(err);
  }
};