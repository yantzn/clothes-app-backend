import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENV } from "../config/env";

/**
 * DynamoDB DocumentClient 初期化（インフラ共有クライアント）
 * - ラムダのウォーム状態で再利用されるようモジュールスコープに配置
 * - ローカル環境では DynamoDB Local に接続
 * - AWS SDK v3 を使用（@aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb）
 *
 * 運用補足（AWSデプロイ時の疎通/認証）:
 * - 正しい接続先: ENV.isLocal !== "true" の場合、`endpoint` は未設定となり、
 *   AWS SDK v3 が `ENV.region`（例: ap-northeast-1）の公式 DynamoDB エンドポイントへ自動接続します。
 */
const client = new DynamoDBClient({
  region: ENV.region,
  endpoint: ENV.isLocal ? "http://localhost:8000" : undefined
});

export const ddb = DynamoDBDocumentClient.from(client);
