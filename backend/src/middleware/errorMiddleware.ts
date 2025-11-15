// ...existing code...
import { logger } from "../lib/logger";

export function errorMiddleware(
  err: any,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction
) {
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  logger.error({
    msg: err.message,
    name: err.name,
    stack: err.stack,
    status,
    type: "http_error",
  });
  res.status(status).json({
    error: err.publicMessage || "Internal Server Error",
    ...(isProd ? {} : { detail: err.message, stack: err.stack?.split("\n").slice(0, 3) }),
  });
}
// ...existing code...
