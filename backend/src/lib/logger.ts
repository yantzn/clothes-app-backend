// lib/logger.ts
import pino from "pino";
import { ENV } from "../config/env.js";

export const logger = pino(
  ENV.isLocal
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      }
    : {
        level: "info",
        base: undefined // Lambda のデフォルトログ形式に揃える
      }
);
