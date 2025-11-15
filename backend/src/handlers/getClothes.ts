// handlers/getClothes.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { getClothesSuggestion } from "../services/clothesService.js";
import { lambdaLogger } from "../lib/lambdaLogger.js";

const safeParse = (body: string | undefined | null): any => {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);

  try {
    const body = safeParse(event.body);

    if (!body.userId || typeof body.feels_like !== "number") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields (userId, feels_like)"
        })
      };
    }

    const suggestion = await getClothesSuggestion(
      body.userId,
      body.feels_like
    );

    log.info("Clothes suggested", {
      userId: body.userId,
      feels_like: body.feels_like
    });

    return {
      statusCode: 200,
      body: JSON.stringify(suggestion)
    };
  } catch (err: any) {
    log.error("getClothes failed", { error: err.message });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
