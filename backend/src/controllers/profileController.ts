import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";
import { formatZodError } from "../lib/zodError";
import { SaveProfileSchema } from "../validators/profileSchema";
import { UpdateProfileSchema } from "../validators/profileUpdateSchema";
import { ReplaceFamilySchema } from "../validators/profileFamilySchema";
import { GetProfileQuerySchema } from "../validators/profileGetSchema";
import { saveProfileData, updateProfileData, replaceProfileFamily, getUserProfile } from "../services/profileService";
import type { ErrorResponse } from "../types/errors";
import type { SaveProfileResponse } from "../types/profile";

export async function createProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
  logger.info({ body: req.body }, "profile START(POST)");
  const parsed = SaveProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    logger.warn({ details }, "Validation error in profile(POST)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const userId = randomUUID();
    await saveProfileData(parsed.data, userId);
    const successResponse: SaveProfileResponse = { message: "Profile saved", userId };
    logger.info({ userId }, "profile SUCCESS(POST)");
    res.status(201).json(successResponse);
  } catch (err: any) {
    logger.error({ message: err?.message, stack: err?.stack }, "profile FAILED(POST)");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}

export async function updateProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const userId = String(req.params?.userID ?? "");
  logger.info({ userId, body: req.body }, "profile START(PATCH)");
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    logger.warn({ details }, "Validation error in profile(PATCH)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    if (!userId) {
      const errorResponse: ErrorResponse = { error: "Invalid request", details: { userId: ["Required path parameter"] } as any };
      logger.warn({ details: errorResponse.details }, "Validation error in profile(PATCH)");
      res.status(400).json(errorResponse);
      return;
    }
    await updateProfileData(userId, parsed.data as any);
    const successResponse: SaveProfileResponse = { message: "Profile updated", userId };
    logger.info({ userId }, "profile SUCCESS(PATCH)");
    res.status(200).json(successResponse);
  } catch (err: any) {
    if (err && typeof err.message === "string" && err.message.startsWith("User not found")) {
      logger.warn({ message: err.message }, "profile NOT FOUND(PATCH)");
      const errorResponse: ErrorResponse = { error: "Not Found" };
      res.status(404).json(errorResponse);
      return;
    }
    logger.error({ message: err?.message, stack: err?.stack }, "profile FAILED(PATCH)");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}

export async function replaceFamily(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const userId = String(req.params?.userID ?? "");
  logger.info({ userId, body: req.body }, "profile START(PUT)");
  const parsed = ReplaceFamilySchema.safeParse(req.body);
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    logger.warn({ details }, "Validation error in profile(PUT)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    if (!userId) {
      const errorResponse: ErrorResponse = { error: "Invalid request", details: { userId: ["Required path parameter"] } as any };
      logger.warn({ details: errorResponse.details }, "Validation error in profile(PUT)");
      res.status(400).json(errorResponse);
      return;
    }
    const { family } = parsed.data;
    await replaceProfileFamily(userId, family);
    const successResponse: SaveProfileResponse = { message: "Family replaced", userId };
    logger.info({ userId, replacedCount: family.length }, "profile SUCCESS(PUT)");
    res.status(200).json(successResponse);
  } catch (err: any) {
    if (err && typeof err.message === "string" && err.message.startsWith("User not found")) {
      logger.warn({ message: err.message }, "profile NOT FOUND(PUT)");
      const errorResponse: ErrorResponse = { error: "Not Found" };
      res.status(404).json(errorResponse);
      return;
    }
    logger.error({ message: err?.message, stack: err?.stack }, "profile FAILED(PUT)");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}

export async function getProfile(req: Request, res: Response, _next: NextFunction): Promise<void> {
  const userIdParam = String(req.params?.userID ?? req.query?.userId ?? "");
  logger.info({ userId: userIdParam }, "profile START(GET)");
  const parsed = GetProfileQuerySchema.safeParse({ userId: userIdParam });
  if (!parsed.success) {
    const details = formatZodError(parsed.error);
    logger.warn({ details }, "Validation error in profile(GET)");
    const errorResponse: ErrorResponse = { error: "Invalid request", details };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const user = await getUserProfile(parsed.data.userId);
    if (!user) {
      logger.warn({ userId: parsed.data.userId }, "profile NOT FOUND(GET)");
      const errorResponse: ErrorResponse = { error: "Not Found" };
      res.status(404).json(errorResponse);
      return;
    }
    const responseBody = {
      userId: user.userId,
      region: user.region,
      birthday: user.birthday,
      gender: user.gender,
      notificationsEnabled: user.notificationsEnabled,
      nickname: user.nickname,
      family: user.family ?? []
    };
    logger.info({ userId: user.userId }, "profile SUCCESS(GET)");
    res.status(200).json(responseBody);
  } catch (err: any) {
    logger.error({ message: err?.message, stack: err?.stack }, "profile FAILED(GET)");
    const errorResponse: ErrorResponse = { error: "Internal Server Error" };
    res.status(500).json(errorResponse);
  }
}
