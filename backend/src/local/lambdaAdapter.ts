// src/local/lambdaAdapter.ts
import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";

// Lambda → Express 応答形式の変換（Adapter パターン）
export const lambdaAdapter = (result: APIGatewayProxyResultV2) => {
  if (typeof result === "string") {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: result
    };
  }

  const structured = result as APIGatewayProxyStructuredResultV2;

  return {
    statusCode: structured.statusCode ?? 200,
    headers: structured.headers ?? { "content-type": "application/json" },
    body: structured.body ?? ""
  };
};
