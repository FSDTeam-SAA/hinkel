import { StaticPage } from './staticPage.model.js';

// Admin: Saves or Creates the one and only document
export const saveAboutUs = async (payload, userId) => {
  return await StaticPage.findOneAndUpdate(
    {}, // Empty filter targets the singleton document
    {
      $set: {
        title: payload.title,
        content: payload.content,
        updatedBy: userId
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};

// Public/Admin: Fetches the one and only document
export const getAboutUs = async () => {
  const data = await StaticPage.findOne({}).lean();

  if (!data) {
    const err = new Error('About Us content has not been created yet.');
    err.statusCode = 404;
    throw err;
  }

  return data;
};