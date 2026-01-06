import { z } from "zod";
// 家族メンバー要素スキーマ（PATCH統合）
const FamilyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/),
  gender: z.enum(["male", "female", "other"])
});

// プロフィール部分更新用スキーマ（PATCH）
// 変更した項目のみを送る。未指定フィールドは不変。
export const UpdateProfileSchema = z.object({
  region: z.string().min(1).max(100).optional(),
  birthday: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  nickname: z.string().min(1).max(30).optional(),
  family: z.array(FamilyMemberSchema).max(10).optional()
}).refine(
  (val) => Object.values(val).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

export type UpdateProfileChanges = z.infer<typeof UpdateProfileSchema>;
export type UpdateProfileInput = UpdateProfileChanges;
