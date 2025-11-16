// src/types/profile.ts

/**
 * フィールド単位のエラー詳細
 */
export interface FieldErrorDetail {
  code: string;    // 例: "E001_INVALID_TYPE"
  message: string; // 例: "入力形式が正しくありません。"
}

/**
 * saveProfile API（POST /profile）
 * 成功レスポンス
 */
export interface SaveProfileResponse {
  message: string;
  userId: string;
}

/**
 * エラーレスポンス共通型
 * details は ZodError を formatZodError() で整形したもの。
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, FieldErrorDetail[]>;
}
