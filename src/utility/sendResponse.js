export const sendResponse = (res, options = {}) => {
  const {
    statusCode = 200,
    success = statusCode < 400,
    message,
    data,
    meta,
    errors,
  } = options;

  const response = {
    success,
    statusCode,
  };

  if (!success) {
    response.error = getHttpStatusName(statusCode);
  }

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (meta !== undefined) response.meta = meta;
  if (errors !== undefined) response.errors = errors;

  return res.status(statusCode).json(response);
};

const getHttpStatusName = (statusCode) => {
  const map = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };

  return map[statusCode] || 'Error';
};
