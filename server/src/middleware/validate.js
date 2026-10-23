import { AppError } from "../utils/AppError.js";

export function validate(schema) {
  return (req, res, next) => {
    // headers included: Phase 3's Idempotency-Key lives in headers
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field:
          i.code === "unrecognized_keys"
            ? i.keys.join(",")
            : i.path.slice(1).join("."), // drop leading "body"
        issue: i.message,
      }));
      return next(new AppError("VALIDATION_ERROR", 400, "Please check the highlighted fields.", details));
    }

    // Replace with the PARSED values (trimmed, lowercased, unknown keys gone)
    const data = result.data;
    if (data.body !== undefined) req.body = data.body;
    if (data.query !== undefined) req.query = data.query;
    if (data.params !== undefined) req.params = data.params;
    next();
  };
}
