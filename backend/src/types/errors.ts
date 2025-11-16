
/**
 * 単一フィールドに対する Zod カスタムエラー
 * code: カスタムエラーコード
 * message: 日本語メッセージ
 */
export interface FieldErrorDetail {
  code: string;
  message: string;
}

/**
 * 共通の API エラーレスポンス
 * details は各フィールドごとに複数エラーを持てる仕様
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, FieldErrorDetail[]>;
}
