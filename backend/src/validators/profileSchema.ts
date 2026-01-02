// src/validators/profileSchema.ts
import { z } from "zod";

// プロフィール保存用スキーマ（API側で userId を生成／座標を直接受け付ける）
const FamilyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"])
});

// プロフィール保存用スキーマ（API側で userId を生成／座標を直接受け付ける）
export const SaveProfileSchema = z.object({
  region: z.string().min(1).max(100),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "other"]),
  notificationsEnabled: z.boolean(),
  nickname: z.string().min(1).max(30),
  family: z.array(FamilyMemberSchema).max(10).optional()
});

// スキーマから型を生成
export type SaveProfileInput = z.infer<typeof SaveProfileSchema>;
export type FamilyMemberInput = z.infer<typeof FamilyMemberSchema>;
