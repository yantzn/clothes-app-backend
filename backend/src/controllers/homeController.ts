import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { formatZodError } from "../lib/zodError";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";
import { getHomeToday } from "../services/homeService";
import type { ErrorResponse } from "../types/errors";

/**
 * Home コントローラ（Express 用）
 * - 入力: req.params.userId
 * - 出力: weather + clothes + summary を JSON で返却
 * - フロー: validate → log START → service → SUCCESS/FAILED → マスク返却
 */
export async function getHomeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = String(req.params?.userId ?? "");
  logger.info({ userId }, "home START");

  const parsed = GetProfileQuerySchema.safeParse({ userId });
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    logger.warn({ details }, "Validation error in home");

    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const response = await getHomeToday(parsed.data.userId);

    logger.info(
      {
        userId: parsed.data.userId,
        membersCount: response.members.length,
        weatherCategory: response.weather.category
      },
      "home SUCCESS"
    );

    res.status(200).json(response);
  } catch (err: any) {
    logger.error({ message: err?.message, stack: err?.stack }, "home FAILED");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}
