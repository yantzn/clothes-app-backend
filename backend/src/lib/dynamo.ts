import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ENV } from "../config/env";

/**
 * DynamoDB DocumentClient 初期化（インフラ共有クライアント）
 * - ラムダのウォーム状態で再利用されるようモジュールスコープに配置
 * - ローカル環境では DynamoDB Local に接続
 * - AWS SDK v3 を使用（@aws-sdk/client-dynamodb + @aws-sdk/lib-dynamodb）
 *
 * ベストプラクティス:
 * - Repository 層でこの ddb を利用し、条件式付き Put/Update を実施
 * - サービス層は Repository 経由で永続化を行い、直接このクライアントを扱わない
 */
const client = new DynamoDBClient({
  region: ENV.region,
  endpoint: ENV.isLocal ? "http://localhost:8000" : undefined
});

export const ddb = DynamoDBDocumentClient.from(client);
