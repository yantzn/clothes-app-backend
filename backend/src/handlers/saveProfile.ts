// handlers/saveProfile.ts
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { saveProfileData } from "../services/profileService.js";
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
    console.log(body);
    if (!body.userId || !body.region || !body.birthday) {
      log.warn("BadRequest in saveProfile", { body });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields (userId, region, birthday)"
        })
      };
    }

    await saveProfileData(body);

    log.info("Profile saved", { userId: body.userId });

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "ok" })
    };
  } catch (err: any) {
    log.error("saveProfile failed", { error: err.message });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};
