import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { formatZodError } from "../lib/zodError";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";
import { HourlyWeatherQuerySchema } from "../validators/weatherHourlyQuerySchema";
import type { ErrorResponse } from "../types/errors";
import { getHourlyForUser } from "../services/weatherService";

export async function getHourly(req: Request, res: Response, _next: NextFunction): Promise<void> {
  logger.info({ pathParams: req.params, query: req.query }, "weather/hourly START");

  const userIdParam = String(req.params?.userId ?? "");
  const userIdParsed = GetProfileQuerySchema.safeParse({ userId: userIdParam });
  if (!userIdParsed.success) {
    const details = formatZodError(userIdParsed.error);
    logger.warn({ details }, "Validation error in weather/hourly (userId)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  const queryParsed = HourlyWeatherQuerySchema.safeParse(req.query ?? {});
  if (!queryParsed.success) {
    const details = formatZodError(queryParsed.error);
    logger.warn({ details }, "Validation error in weather/hourly (query)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const { userId } = userIdParsed.data;
    const limitHours = (queryParsed.data.limitHours ?? 24) as number;
    const response = await getHourlyForUser(userId, limitHours);
    logger.info({ userId, count: response.hourly.length, intervalHours: response.intervalHours }, "weather/hourly SUCCESS");
    res.status(200).json(response);
  } catch (err: any) {
    logger.error({ message: err?.message, stack: err?.stack }, "weather/hourly FAILED");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}
