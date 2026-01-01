import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { formatZodError } from "../lib/zodError";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";

import { getHomeToday } from "../services/homeService";

import type { ErrorResponse } from "../types/errors";

/**
 * ホーム画面統合ハンドラー
 * - 入力: pathParameters.userId
 * - 出力: weather + clothes + summary
 *
 * フロー:
 * 1. pathParams を Zod で検証
 * 2. 服装提案を取得（サービス）
 * 3. プロフィールから座標取得 → OpenWeather 天気取得 → weather DTO 構築
 * 4. summary は clothes.suggestion.summary を複製
 * 5. START / SUCCESS / FAILED ログ + エラーマスク
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);

  const userId = event.pathParameters?.userId ?? "";
  log.info("home START", { userId });

  const parsed = GetProfileQuerySchema.safeParse({ userId });
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    log.warn("Validation error in home", { details });

    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details
    };
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const response = await getHomeToday(parsed.data.userId);

    log.info("home SUCCESS", {
      userId: parsed.data.userId,
      membersCount: response.members.length,
      weatherCategory: response.weather.category
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response)
    };
  } catch (err: any) {
    log.error("home FAILED", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};
