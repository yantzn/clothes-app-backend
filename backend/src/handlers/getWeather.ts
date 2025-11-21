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
  const log = lambdaLogger(context);
  const body = safeParse(event.body);

  log.info("getWeather START", { rawBody: event.body, parsed: body });

  // -----------------------------
  // Zod validation
  // -----------------------------
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
