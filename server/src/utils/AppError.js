export class AppError extends Error {
  constructor(code, status, message, details) {
    super(message);
    this.name = "AppError";
    this.code = code; // stable, the frontend branches on this
    this.status = status; // HTTP status
    this.details = details; // optional [{ field, issue }]
  }
}
