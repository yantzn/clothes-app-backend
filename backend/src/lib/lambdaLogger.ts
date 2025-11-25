import type { Context } from "aws-lambda";
import { logger } from "./logger";

/**
 * Lambda 環境のリクエスト相関情報（requestId, functionName, invokedFunctionArn）を
 * 既存の pino ロガーに自動付与する軽量ラッパーを生成する。
 *
 * 目的:
 * - START/SUCCESS/FAILED ログへ一貫して相関キーを付与し、観測性（トレース性・集計性）を向上。
 * - `logger` と同形の API (debug/info/warn/error) を提供し置換容易性を確保。
 *
 * 使い方:
 * - handler 内で `const log = lambdaLogger(context)` を生成し、`log.debug/info/warn/error(...)` を呼び出す。
 * - `error` は Error/非 Error 両方を受け取り、適切に構造化して出力する。
 *
 * 返り値:
 * - info/warn/error を持つロガーオブジェクト。各メソッドは常に Lambda の相関情報をマージして出力。
 *
 * 注意:
 * - 追加メタデータは第2引数 `obj` に渡すと構造化フィールドとして統合される。
 * - PII/機微情報は `obj` に含めない（必要なら上位でマスキング）。
 */
export const lambdaLogger = (context: Context) => {
  const base = {
    requestId: context.awsRequestId,
    functionName: context.functionName,
    invokedFunctionArn: context.invokedFunctionArn,
  };
  // WHY: 各ログへ必ず付与する相関キーを一度だけ構築し、重複記述を排除

  return {
    debug: (msg: string, obj: Record<string, any> = {}) =>
      logger.debug({ ...base, ...obj }, msg),
      // WHY: 低コストで詳細診断用の情報を出力。ローカルは level=debug、本番は level=info で抑制。

    info: (msg: string, obj: Record<string, any> = {}) =>
      logger.info({ ...base, ...obj }, msg),
      // WHY: 構造化メタデータを統合しつつメッセージは第2引数（pino 慣習）

    warn: (msg: string, obj: Record<string, any> = {}) =>
      logger.warn({ ...base, ...obj }, msg),

    error: (errOrMsg: any, obj: Record<string, any> = {}) => {
      if (errOrMsg instanceof Error) {
        logger.error(
          { ...base, err: errOrMsg, ...obj },
          errOrMsg.message
        );
        // WHY: Error は err フィールドとして構造化し stack を含めて出力（可観測性向上）
      } else {
        logger.error(
          { ...base, ...obj },
          String(errOrMsg)
        );
        // WHY: 非 Error は文字列に統一してメッセージとして扱う（運用で落ちないことを優先）
      }
    }
  };
};
