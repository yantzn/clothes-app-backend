
/**
 * saveProfile API（POST /profile）
 * ---------------------------------
 * 入力は validators/profileSchema.ts の Zod スキーマが担当。
 * ここでは出力（レスポンス型）を定義する。
 */

export interface SaveProfileResponse {
  message: string;
  userId: string;
}

/**
 * エラーレスポンス共通型
 * ---------------------------------
 * details は ZodError を formatZodError() で整形したもの。
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}
