// src/handlers/getClothes.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { PostClothesSchema } from "../validators/clothesSchema";
import { formatZodError } from "../lib/zodError";

import { getClothesSuggestionByUserId } from "../services/clothesService";
import type { ErrorResponse } from "../types/errors";
import type { ClothesSuggestion } from "../types/clothes";

/**
 * POST /clothes
 * Body: { userId: string }
 */
const safeParse = (body: string | undefined | null) => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  // ロガー初期化
  const log = lambdaLogger(context);
  // リクエストボディ取得
  const body = safeParse(event.body);
  // Zod バリデーション
  const parsed = PostClothesSchema.safeParse(body);
  // バリデーションエラー
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };

    return {
      statusCode: 400,
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    // 服装提案取得処理
    const successResponse: ClothesSuggestion =
      await getClothesSuggestionByUserId(parsed.data.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(successResponse)
    };
  } catch (err: any) {
    log.error("getClothes failed", { error: err.message });

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error"
    };

    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse)
    };
  }
};
