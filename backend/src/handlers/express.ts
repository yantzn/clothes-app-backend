// src/handlers/express.ts
// 単一Lambdaのエントリポイント。API Gateway→Lambda→serverless-express が
// Expressアプリ(createApp)へイベント/コンテキストをブリッジします。
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "../app";
import { initSecrets } from "../config/secretsBootstrap";

let server: any;

export const handler = async (event: any, context: any): Promise<unknown> => {
	if (!server) {
		await initSecrets();
		const app = createApp();
		server = serverlessExpress({ app });
	}
	return server(event, context);
};
