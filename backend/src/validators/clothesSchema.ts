import { z } from "zod";

export const PostClothesSchema = z.object({
  userId: z.string().min(1)
});

export type PostClothesInput = z.infer<typeof PostClothesSchema>;
