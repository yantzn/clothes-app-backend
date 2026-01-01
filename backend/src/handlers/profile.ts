import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { lambdaLogger } from "../lib/lambdaLogger";
import { SaveProfileSchema } from "../validators/profileSchema";
import { UpdateProfileSchema } from "../validators/profileUpdateSchema";
import { ReplaceFamilySchema } from "../validators/profileFamilySchema";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";
import { formatZodError } from "../lib/zodError";
import { saveProfileData, updateProfileData, replaceProfileFamily, getUserProfile } from "../services/profileService";
import type { ErrorResponse } from "../types/errors";
import type { SaveProfileResponse } from "../types/profile";
import { randomUUID } from "crypto";

const safeParse = (body: string | undefined | null): any => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

// Controller: Create Profile (POST)
const createProfileController = async (
  rawBody: string | undefined | null,
  log: ReturnType<typeof lambdaLogger>
): Promise<APIGatewayProxyResultV2> => {
  const body = safeParse(rawBody);
  const parsed = SaveProfileSchema.safeParse(body);
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };
    log.warn("Validation error in profile(POST)", { details: formatZodError(parsed.error) });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const userId = randomUUID();
    await saveProfileData(parsed.data, userId);

    const successResponse: SaveProfileResponse = {
      message: "Profile saved",
      userId
    };

    log.info("profile SUCCESS(POST)", { userId });

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };
  } catch (err: any) {
    log.error("profile FAILED(POST)", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};

// Controller: Update Profile (PATCH)
const updateProfileController = async (
  event: APIGatewayProxyEventV2,
  log: ReturnType<typeof lambdaLogger>
): Promise<APIGatewayProxyResultV2> => {
  const body = safeParse(event.body);
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };
    log.warn("Validation error in profile(PATCH)", { details: formatZodError(parsed.error) });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const userId = (event.pathParameters as any)?.userId ?? (event.queryStringParameters as any)?.userId ?? "";
    if (!userId) {
      const errorResponse: ErrorResponse = { error: "Invalid request", details: { userId: ["Required path parameter"] } as any };
      log.warn("Validation error in profile(PATCH)", { details: errorResponse.details });
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorResponse)
      };
    }
    const changes = parsed.data as any;
    await updateProfileData(userId, changes);

    const successResponse: SaveProfileResponse = {
      message: "Profile updated",
      userId
    };

    log.info("profile SUCCESS(PATCH)", { userId });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };
  } catch (err: any) {
    if (err && typeof err.message === "string" && err.message.startsWith("User not found")) {
      log.warn("profile NOT FOUND(PATCH)", { message: err.message });
      const errorResponse: ErrorResponse = { error: "Not Found" };
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorResponse)
      };
    }

    log.error("profile FAILED(PATCH)", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};

// Controller: Replace Family (PUT)
const replaceFamilyController = async (
  event: APIGatewayProxyEventV2,
  log: ReturnType<typeof lambdaLogger>
): Promise<APIGatewayProxyResultV2> => {
  const body = safeParse(event.body);
  const parsed = ReplaceFamilySchema.safeParse(body);
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };
    log.warn("Validation error in profile(PUT)", { details: formatZodError(parsed.error) });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const userId = (event.pathParameters as any)?.userId ?? (event.queryStringParameters as any)?.userId ?? "";
    if (!userId) {
      const errorResponse: ErrorResponse = { error: "Invalid request", details: { userId: ["Required path parameter"] } as any };
      log.warn("Validation error in profile(PUT)", { details: errorResponse.details });
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorResponse)
      };
    }
    const { family } = parsed.data;
    await replaceProfileFamily(userId, family);

    const successResponse: SaveProfileResponse = {
      message: "Family replaced",
      userId
    };

    log.info("profile SUCCESS(PUT)", { userId, replacedCount: family.length });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };
  } catch (err: any) {
    if (err && typeof err.message === "string" && err.message.startsWith("User not found")) {
      log.warn("profile NOT FOUND(PUT)", { message: err.message });
      const errorResponse: ErrorResponse = { error: "Not Found" };
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorResponse)
      };
    }

    log.error("profile FAILED(PUT)", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};

// Controller: Get Profile (GET)
const getProfileController = async (
  event: APIGatewayProxyEventV2,
  log: ReturnType<typeof lambdaLogger>
): Promise<APIGatewayProxyResultV2> => {
  const userIdParam = (event.pathParameters as any)?.userId ?? (event.queryStringParameters as any)?.userId ?? "";
  const parsed = GetProfileQuerySchema.safeParse({ userId: userIdParam });
  if (!parsed.success) {
    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details: formatZodError(parsed.error)
    };
    log.warn("Validation error in profile(GET)", { details: formatZodError(parsed.error) });
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const user = await getUserProfile(parsed.data.userId);
    if (!user) {
      log.warn("profile NOT FOUND(GET)", { userId: parsed.data.userId });
      const errorResponse: ErrorResponse = { error: "Not Found" };
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorResponse)
      };
    }

    const responseBody = {
      userId: user.userId,
      lat: user.lat,
      lon: user.lon,
      birthday: user.birthday,
      gender: user.gender,
      notificationsEnabled: user.notificationsEnabled,
      nickname: user.nickname,
      family: user.family ?? []
    };

    log.info("profile SUCCESS(GET)", { userId: user.userId });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseBody)
    };
  } catch (err: any) {
    log.error("profile FAILED(GET)", { message: err.message, stack: err.stack });
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);
  const method = (event as any)?.requestContext?.http?.method ?? "";

  log.info("profile START", { method, rawBody: event.body });

  if (method === "POST") {
    return createProfileController(event.body, log);
  }

  if (method === "PATCH") {
    return updateProfileController(event, log);
  }

  if (method === "PUT") {
    return replaceFamilyController(event, log);
  }

  if (method === "GET") {
    return getProfileController(event, log);
  }

  const errorResponse: ErrorResponse = { error: "Method Not Allowed" };
  return {
    statusCode: 405,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(errorResponse)
  };
};
