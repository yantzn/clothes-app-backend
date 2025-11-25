import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { PostWeatherSchema } from "../validators/weatherSchema";
import { formatZodError } from "../lib/zodError";

import { getWeatherByRegion } from "../services/weatherService";

import type { WeatherResponse } from "../types/weather";
import type { ErrorResponse } from "../types/errors";

/**
 * リクエスト body を安全に JSON パースするヘルパー。
 * 例外投げを避けて `{}` にフォールバックし、後段の Zod バリデーションに統一的なエラー処理を委ねる。
 */
const safeParse = (body: string | undefined | null): any => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

/**
 * 地域名から現在の天気＋温度カテゴリを取得するハンドラー。
 * フロー:
 *  1. JSON 安全パース（失敗時 `{}`）
 *  2. Zod バリデーション (地域形式を検証) → 失敗時 400
 *  3. サービス層 `getWeatherByRegion` へ委譲（OpenWeather geocoding + weather）
 *  4. START / SUCCESS / FAILED 構造化ログ
 *  5. 予期せぬ例外は 500 にマスク（内部詳細はログのみ）
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);
  const body = safeParse(event.body);

  log.info("getWeather START", { rawBody: event.body, parsed: body });

  // Zod バリデーション: 不正入力は副作用前に早期終了。
  const parsed = PostWeatherSchema.safeParse(body);
  if (!parsed.success) {
    const details = formatZodError(parsed.error);

    log.warn("Validation error in getWeather", { details });

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
    const { region } = parsed.data;

    // 地域→緯度経度→天気データ取得（サービス側で外部 API 呼び出しと正規化）。
    const result = await getWeatherByRegion(region);

    const successResponse: WeatherResponse = result;

    log.info("getWeather SUCCESS", {
      region,
      category: result.temperature.category
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };

  } catch (err: any) {
    // 予期せぬ例外。レスポンスへ内部メッセージを露出しない。
    log.error("getWeather FAILED", {
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
