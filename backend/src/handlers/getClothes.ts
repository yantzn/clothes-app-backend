// src/handlers/clothes.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { PostClothesSchema } from "../validators/clothesSchema";
import { formatZodError } from "../lib/zodError";

import { getClothes } from "../services/clothesService";

import type { ErrorResponse } from "../types/errors";
import type { ClothesResponse } from "../types/clothes";

/** JSON safe parsing */
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

  log.info("clothes START", { rawBody: event.body, parsed: body });

  // -----------------------------
  // Zod validation
  // -----------------------------
  const parsed = PostClothesSchema.safeParse(body);

  if (!parsed.success) {
    const details = formatZodError(parsed.error);

    log.warn("Validation error in clothes", { details });

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
    const { userId } = parsed.data;

    const result = await getClothes(userId);

    const successResponse: ClothesResponse = result;

    log.info("clothes SUCCESS", {
      userId,
      category: result.temperature.category
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };

  } catch (err: any) {
    log.error("clothes FAILED", {
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
