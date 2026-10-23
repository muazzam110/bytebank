import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

// Express recognizes error handlers by having EXACTLY 4 parameters
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Something went wrong on our side.";
  let details;

  if (err instanceof AppError) {
    ({ status, code, message, details } = err);
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Request body is not valid JSON.";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    code = "VALIDATION_ERROR";
    message = "Request body is too large.";
  } else if (err?.code === 11000) {
    status = 409;
    code = "CONFLICT";
    message = "That value is already in use.";
  }

  if (status >= 500) logger.error({ err, requestId: req.id }, "Unhandled error");

  res.status(status).json({
    success: false,
    error: { code, message, details, requestId: req.id },
  });
}
