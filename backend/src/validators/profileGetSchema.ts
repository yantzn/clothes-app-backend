import { z } from "zod";

// GET /profile クエリスキーマ
export const GetProfileQuerySchema = z.object({
  userId: z.string().min(1)
});

export type GetProfileQuery = z.infer<typeof GetProfileQuerySchema>;
