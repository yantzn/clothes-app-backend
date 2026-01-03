// src/handlers/express.ts
// 単一Lambdaのエントリポイント。API Gateway→Lambda→serverless-express が
// Expressアプリ(createApp)へイベント/コンテキストをブリッジします。
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "../app";

const app = createApp();
export const handler = serverlessExpress({ app });
