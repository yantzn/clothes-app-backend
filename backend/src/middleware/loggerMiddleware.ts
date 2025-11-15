// middleware/loggerMiddleware.ts
import pinoHttp from "pino-http";
import { logger } from "../lib/logger.js";

export const loggerMiddleware = pinoHttp({
  logger,
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage(req, res) {
    return `HTTP ${req.method} ${req.url}`;
  },
  customErrorMessage(req, res, err) {
    return `HTTP ERROR ${req.method} ${req.url}`;
  }
});
