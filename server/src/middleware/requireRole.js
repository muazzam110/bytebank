import { AppError } from "../utils/AppError.js";

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("FORBIDDEN", 403, "You don't have access to this resource."));
    }
    next();
  };
}
