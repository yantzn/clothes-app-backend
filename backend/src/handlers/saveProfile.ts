// src/handlers/saveProfile.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { saveProfileData } from "../services/profileService";
import { lambdaLogger } from "../lib/lambdaLogger";
import { SaveProfileSchema } from "../validators/profileSchema";
import { formatZodError } from "../lib/zodError";
import type { ErrorResponse } from "../types/errors";
import type { SaveProfileResponse} from "../types/profile";

/**
 * JSON の安全パース
 */
const safeParse = (body: string | undefined | null): any => {
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

  log.info("saveProfile START", { rawBody: event.body, parsed: body });

  // Zod バリデーション
  const parsed = SaveProfileSchema.safeParse(body);

  if (!parsed.success) {
    // バリデーションエラー処理
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };

    log.warn("Validation error in saveProfile", { details: formatZodError(parsed.error) });

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    // --- 保存処理 ---
    await saveProfileData(parsed.data);

    const successResponse: SaveProfileResponse = {
      message: "Profile saved",
      userId: parsed.data.userId
    };

    log.info("saveProfile SUCCESS", { userId: parsed.data.userId });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };

  } catch (err: any) {
    // --- 例外捕捉 ---
    log.error("saveProfile FAILED", {
      message: err.message,
      stack: err.stack
    });

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error"
    };

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};
