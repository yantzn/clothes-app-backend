// src/handlers/getWeather.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { GetWeatherSchema } from "../validators/weatherSchema";
import { formatZodError } from "../lib/zodError";
import { getWeatherByUserId } from "../services/weatherService";
import type { ErrorResponse } from "../types/errors";
import type { WeatherResponse } from "../types/weather";

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);

  // クエリから userId を取得
  const userId = event.queryStringParameters?.userId;
  const parsed = GetWeatherSchema.safeParse({ userId });

  // Zod バリデーションエラー
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };

    log.warn("Validation error in getWeather", { details: errorResponse.details });

    return {
      statusCode: 400,
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const successResponse: WeatherResponse =
      await getWeatherByUserId(parsed.data.userId);

    return {
      statusCode: 200,
      body: JSON.stringify(successResponse) // ← WeatherResponse に準拠
    };
  } catch (err: any) {
    log.error("getWeather failed", { error: err.message });

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error"
    };

    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse)
    };
  }
};
