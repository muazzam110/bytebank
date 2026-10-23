import { AppError } from "../utils/AppError.js";

export const notFound = (req, res, next) =>
  next(new AppError("NOT_FOUND", 404, "Route not found."));
