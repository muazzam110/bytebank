import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function csrfGuard(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) return next();

  // Browsers always send Origin on cross-site writes; Postman sends none (so it still works)
  const origin = req.get("origin");
  if (origin && origin !== env.CLIENT_ORIGIN) {
    return next(new AppError("FORBIDDEN", 403, "Request origin is not allowed."));
  }

  // If there IS a body, it must be JSON (blocks form-post CSRF tricks)
  const hasBody = Number(req.get("content-length") || 0) > 0;
  if (hasBody && !req.is("application/json")) {
    return next(new AppError("FORBIDDEN", 403, "Content-Type must be application/json."));
  }
  next();
}
