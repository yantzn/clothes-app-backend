// src/validators/profileSchema.ts
import { z } from "zod";

// プロフィール保存用スキーマ
export const SaveProfileSchema = z.object({
  userId: z.string().min(1),
  region: z.string().min(1),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]).optional(),
  notificationsEnabled: z.boolean()
});

// スキーマから型を生成
export type SaveProfileInput = z.infer<typeof SaveProfileSchema>;
