// export const catchAsync = (fn) => (req, res, next) => {
//   const catchFn = (err) => {
//     if (err instanceof Error) {
//       return res.status(500).json({
//         message: err.message,
//         name: err.name,
//         stack: err.stack
//       });
//     }
//     return res.status(422).json({
//       message: err.message
//     });
//   };
//   const wrapFn = (...args) => fn(...args).catch(catchFn);
//   return wrapFn(req, res, next);
// };


export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
