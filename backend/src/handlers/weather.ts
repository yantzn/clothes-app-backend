import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { lambdaLogger } from "../lib/lambdaLogger";
import { formatZodError } from "../lib/zodError";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";
import { HourlyWeatherQuerySchema } from "../validators/weatherHourlyQuerySchema";
import type { ErrorResponse } from "../types/errors";
import { getHourlyForUser } from "../services/weatherService";

const safeParse = (body: string | undefined | null): any => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

/**
 * 天気（1時間刻み）ハンドラー
 * - 入力: { region: string, limitHours?: number }
 * - 出力: { region, hourly: HourlyWeatherItem[] }
 * フロー: safeParse → Zod.safeParse → START → service呼び出し → SUCCESS or FAILED
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);
  const method = (event as any)?.requestContext?.http?.method ?? "";
  log.info("weather/hourly START", { method });

  if (method !== "GET") {
    const errorResponse: ErrorResponse = { error: "Method Not Allowed" };
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  const userIdParam = (event.pathParameters as any)?.userId ?? "";
  const userIdParsed = GetProfileQuerySchema.safeParse({ userId: userIdParam });
  if (!userIdParsed.success) {
    const details = formatZodError(userIdParsed.error);
    log.warn("Validation error in weather/hourly (userId)", { details });
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  const queryParsed = HourlyWeatherQuerySchema.safeParse(event.queryStringParameters ?? {});
  if (!queryParsed.success) {
    const details = formatZodError(queryParsed.error);
    log.warn("Validation error in weather/hourly (query)", { details });
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const { userId } = userIdParsed.data;
    const limitHours = (queryParsed.data.limitHours ?? 24) as number;
    const response = await getHourlyForUser(userId, limitHours);
    log.info("weather/hourly SUCCESS", { userId, count: response.hourly.length, intervalHours: response.intervalHours });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response)
    };
  } catch (err: any) {
    log.error("weather/hourly FAILED", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};
