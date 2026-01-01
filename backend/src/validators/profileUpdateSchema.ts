import { z } from "zod";

// プロフィール部分更新用スキーマ（PATCH）
// 変更した項目のみを送る。未指定フィールドは不変。
export const UpdateProfileSchema = z.object({
  lat: z.number().optional(),
  lon: z.number().optional(),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  nickname: z.string().min(1).max(30).optional()
}).refine(
  (val) => Object.values(val).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

export type UpdateProfileChanges = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileInput = UpdateProfileChanges;
