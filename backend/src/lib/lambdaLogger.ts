// lib/lambdaLogger.ts
import type { Context } from "aws-lambda";
import { logger } from "./logger.js";

export const lambdaLogger = (context: Context) => {
  return {
    info: (msg: string, obj: Record<string, any> = {}) =>
      logger.info({ requestId: context.awsRequestId, ...obj }, msg),

    warn: (msg: string, obj: Record<string, any> = {}) =>
      logger.warn({ requestId: context.awsRequestId, ...obj }, msg),

    error: (msg: string, obj: Record<string, any> = {}) =>
      logger.error({ requestId: context.awsRequestId, ...obj }, msg)
  };
};
