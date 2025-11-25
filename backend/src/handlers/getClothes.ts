import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context
} from "aws-lambda";

import { lambdaLogger } from "../lib/lambdaLogger";
import { PostClothesSchema } from "../validators/clothesSchema";
import { formatZodError } from "../lib/zodError";

import { getClothes } from "../services/clothesService";
import { getProductsForLayers } from "../services/productService";

import type { ErrorResponse } from "../types/errors";
import type { ClothesResponse } from "../types/clothes";

/**
 * リクエスト body を安全に JSON パースするヘルパー。
 * - 失敗時に例外を投げず `{}` を返して後段の Zod バリデーションへ進ませる。
 * - ここで詳細エラーを返さないことで、エラーフォーマットを単一化（400 → Zod / 500 → 予期せぬ失敗）。
 */
const safeParse = (body: string | undefined | null): any => {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
};

/**
 * 服装レコメンド取得ハンドラー + 楽天商品統合。
 * フロー:
 *  1. JSON 安全パース（例外抑止）
 *  2. Zod バリデーション (safeParse) → 失敗時 400
 *  3. ビジネスロジック: `getClothes` で気象・年齢・マトリクスから提案生成
 *  4. 楽天商品取得: レイヤー×年齢でキーワード生成 → 商品検索（失敗は WARN ログ + 空配列）
 *  5. START / SUCCESS / FAILED ログ出力
 *  6. エラーマスク: 予期せぬ例外は 500 + 内部情報非公開
 */
export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyResultV2> => {
  const log = lambdaLogger(context);
  const body = safeParse(event.body);

  log.info("clothes START", { rawBody: event.body, parsed: body });

  // Zod バリデーション: 不正入力は早期に 400 で終了し、後段の副作用を防ぐ。
  const parsed = PostClothesSchema.safeParse(body);

  if (!parsed.success) {
    const details = formatZodError(parsed.error);

    log.warn("Validation error in clothes", { details });

    const errorResponse: ErrorResponse = {
      error: "Invalid request",
      details
    };

    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }

  try {
    const { userId } = parsed.data;

    // 服装レコメンドのドメイン計算（天気・年齢・温度カテゴリ → 推奨レイヤー）
    const result = await getClothes(userId);

    // 楽天商品統合: 外部 API 失敗は致命的でないため握り潰さず WARN ログ + 空配列。
    let products: any[] = [];
    try {
      products = await getProductsForLayers(result.ageGroup, result.suggestion.layers, 3, userId);
    } catch (e) {
      log.warn("Rakuten products fetch failed", { message: (e as any).message });
    }

    const successResponse: ClothesResponse = { ...result, products };

    log.info("clothes SUCCESS", {
      userId,
      category: result.temperature.category,
      productCount: products.length
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(successResponse)
    };

  } catch (err: any) {
    // 予期せぬ例外。内部情報はレスポンスへ露出せず、ログのみ詳細を出力。
    log.error("clothes FAILED", {
      message: err.message,
      stack: err.stack
    });

    const errorResponse: ErrorResponse = {
      error: "Internal Server Error"
    };

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorResponse)
    };
  }
};
