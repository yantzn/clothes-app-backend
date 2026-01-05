import { z } from "zod";

const FamilyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  birthday: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/),
  gender: z.enum(["male", "female", "other"])
});

// 家族情報の全置換（PUT /profile/{userId}）用スキーマ（ボディはfamilyのみ）
export const ReplaceFamilySchema = z.object({
  family: z.array(FamilyMemberSchema).max(10)
});

export type ReplaceFamilyInput = z.infer<typeof ReplaceFamilySchema>;
export type FamilyMemberInput = z.infer<typeof FamilyMemberSchema>;
