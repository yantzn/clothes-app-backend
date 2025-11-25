// ...existing code...
import { logger } from "../lib/logger";

/**
 * Express 用のエラーハンドラ（ローカルミラー環境専用）。
 *
 * 目的:
 * - 例外を構造化ログに記録しつつ、クライアントへは安全にマスクしたメッセージを返す。
 * - 本番では内部情報（詳細メッセージ・スタック）を返さないことで情報漏えいを防止。
 *
 * 設計意図:
 * - ミドルウェア層で HTTP 依存の処理（status/json）を集約し、サービス層は純粋なドメイン例外を投げるだけにする。
 * - `publicMessage` が存在する場合は既知の 4xx 相当のドメインエラーとみなし、ユーザー向け安全文言を返す。
 */
export function errorMiddleware(
  err: any,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction
) {
  // WHY: ハンドラー/サービスで付与された statusCode を優先し、なければ 500（予期しない例外）
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";
  // WHY: 観測性のために構造化ログへ出力（集計しやすいよう type を付与）
  logger.error({
    msg: err.message,
    name: err.name,
    stack: err.stack,
    status,
    type: "http_error",
  });
  // WHY: レスポンスでは内部情報をマスク。本番は詳細・スタックを返さない（セキュリティ優先）
  res.status(status).json({
    error: err.publicMessage || "Internal Server Error",
    ...(isProd ? {} : { detail: err.message, stack: err.stack?.split("\n").slice(0, 3) }),
  });
}
