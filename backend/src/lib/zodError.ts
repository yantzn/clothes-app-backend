// src/lib/zodError.ts
import type { ZodError } from "zod";
import { ErrorCodeMap } from "../errors/errorCodes.js";
import { ErrorMessages } from "../errors/errorMessages.js";
import type { FieldErrorDetail } from "../types/profile.js";

// ZodError -> { field: [{ code, message }] } 形式に整形
export const formatZodError = (
  err: ZodError
): Record<string, FieldErrorDetail[]> => {
  const errors: Record<string, FieldErrorDetail[]> = {};
  // issues をループしてフィールドごとにエラーを収集
  for (const issue of err.issues) {
    // path が空の場合は全体エラーとして扱う
    const field = issue.path.join(".") || "_errors";
    // issue.code から独自コードとメッセージを取得
    const code = ErrorCodeMap[issue.code] ?? "E999_UNKNOWN";
    const message = ErrorMessages[issue.code] ?? "不正な入力です。";
    // フィールドごとのエラー配列を初期化
    if (!errors[field]) {
      errors[field] = [];
    }
    // エラー詳細を追加
    errors[field].push({ code, message });
  }

  return errors;
};
