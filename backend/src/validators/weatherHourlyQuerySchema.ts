import { z } from "zod";

// GET /weather/hourly/{userId}?limitHours=24 のクエリスキーマ
export const HourlyWeatherQuerySchema = z.object({
  limitHours: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 1 && v <= 48), {
      message: "Must be integer between 1 and 48"
    })
});

export type HourlyWeatherQuery = z.infer<typeof HourlyWeatherQuerySchema>;
