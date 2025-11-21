// src/validators/weatherSchema.ts
import { z } from "zod";

export const PostWeatherSchema = z.object({
  region: z.string().min(1)
});

export type PostWeatherInput = z.infer<typeof PostWeatherSchema>;
