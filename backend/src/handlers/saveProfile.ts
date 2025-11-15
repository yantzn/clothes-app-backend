// src/handlers/saveProfile.ts
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { saveProfileData } from "../services/profileService.js";
import { lambdaLogger } from "../lib/lambdaLogger.js";
import { SaveProfileSchema } from "../validators/profileSchema.js";
import { formatZodError } from "../lib/zodError.js";
import type { SaveProfileResponse, ErrorResponse } from "../types/profile";

const safeParse = (body: string | undefined | null) => {
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
  // Initialize logger
  const log = lambdaLogger(context);
  // Parse request body
  const body = safeParse(event.body);

  // Zod validation
  const parsed = SaveProfileSchema.safeParse(body);


  if (!parsed.success) {

    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };

    return {
      statusCode: 400,
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    // データ保存処理
    await saveProfileData(parsed.data);

    const success: SaveProfileResponse = {
      message: "Profile saved",
      userId: parsed.data.userId
    };
    return {
      statusCode: 200,
      body: JSON.stringify(success)
    };
  } catch (err: any) {
    log.error("saveProfile failed", { error: err.message });

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error"
    };

    return {
      statusCode: 500,
      body: JSON.stringify(errorResponse)
    };
  }
};
