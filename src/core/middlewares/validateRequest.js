// export const validateRequest = (schema) => (req, res, next) => {
//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ error: error.details[0].message });
//     }
//     next();
// };
  


export const validateRequest = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};

  
