import type { Context } from "aws-lambda";
import { logger } from "./logger";

export const lambdaLogger = (context: Context) => {
  const base = {
    requestId: context.awsRequestId,
    functionName: context.functionName,
    invokedFunctionArn: context.invokedFunctionArn,
  };

  return {
    info: (msg: string, obj: Record<string, any> = {}) =>
      logger.info({ ...base, ...obj }, msg),

    warn: (msg: string, obj: Record<string, any> = {}) =>
      logger.warn({ ...base, ...obj }, msg),

    error: (errOrMsg: any, obj: Record<string, any> = {}) => {
      if (errOrMsg instanceof Error) {
        logger.error(
          { ...base, err: errOrMsg, ...obj },
          errOrMsg.message
        );
      } else {
        logger.error(
          { ...base, ...obj },
          String(errOrMsg)
        );
      }
    }
  };
};
