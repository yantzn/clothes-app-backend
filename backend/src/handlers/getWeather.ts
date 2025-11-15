// handlers/getWeather.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { getUserProfile } from "../services/profileService.js";
import { fetchWeather } from "../services/weatherService.js";
import { lambdaLogger } from "../lib/lambdaLogger.js";

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);

  try {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "userId is required" })
      };
    }

    const profile = await getUserProfile(userId);

    if (!profile) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: `Profile not found for userId: ${userId}`
        })
      };
    }

    const weather = await fetchWeather(profile.lat, profile.lon);

    log.info("Weather fetched", { userId, lat: profile.lat, lon: profile.lon });

    return {
      statusCode: 200,
      body: JSON.stringify(weather)
    };
  } catch (err: any) {
    log.error("getWeather failed", { error: err.message });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
