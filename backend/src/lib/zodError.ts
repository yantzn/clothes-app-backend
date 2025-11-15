// src/lib/zodError.ts
import { ZodError } from "zod";

// ZodError を整形するユーティリティ関数
export const formatZodError = (err: ZodError) => {
  const errors: Record<string, string[]> = {};

  for (const issue of err.issues) {
    const field = issue.path.join(".") || "_errors";
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(issue.message);
  }

  return errors;
};
