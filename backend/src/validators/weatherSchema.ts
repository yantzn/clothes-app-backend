import { z } from "zod";

export const GetWeatherSchema = z.object({
  userId: z.string().min(1)
});

export type GetWeatherInput = z.infer<typeof GetWeatherSchema>;
