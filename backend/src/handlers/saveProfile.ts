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
 * リクエスト body を安全に JSON パースするヘルパー。
 * 目的:
 *  - 生文字列の parse 失敗で例外を投げず `{}` を返すことで、
 *    エラー判定を Zod バリデーションに一元化する。
 *  - これによりハンドラ内の例外経路を減らし、ログ/レスポンス形式を統一。
 */
const safeParse = (body: string | undefined | null): any => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

/**
 * プロフィール保存ハンドラー。
 * フロー:
 *  1. body を安全パース（失敗時 `{}`）
 *  2. Zod バリデーション: スキーマ不一致は 400 で早期終了（副作用防止）
 *  3. ビジネスロジック: `saveProfileData` が永続化を担当（Dynamo など）
 *  4. START / SUCCESS / FAILED ログ（requestId 付与で追跡性確保）
 *  5. 予期しない例外は 500 にマスク（内部情報非公開）
 * 設計意図:
 *  - ハンドラーは入出力制御とバリデーションに限定し、副作用/永続化はサービス層へ委譲。
 *  - 例外メッセージは外部へ漏らさず、運用はログ上で調査する前提。
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context); // START 時点で requestId を構造化ログに含める
  const body = safeParse(event.body); // parse 例外を吸収し一貫したバリデーション経路へ

  log.info("saveProfile START", { rawBody: event.body, parsed: body });

  // Zod バリデーション: 入力不正は副作用前に確実に遮断
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
    // 永続化: サービス層で Dynamo への保存ロジックを隠蔽（HTTP 依存排除）
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
    // 予期せぬ例外: 内部情報はレスポンスへ露出せずログのみ詳細
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
