// lib/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { logger } from "./logger";

// 汎用的なHTTPクライアントラッパークラス
export class HttpClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config: AxiosRequestConfig = {}) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
      ...config
    });

    // リクエストログ
    this.client.interceptors.request.use((req) => {
      logger.info({
        url: req.url,
        method: req.method,
        params: req.params,
      }, "HTTP Request");
      return req;
    });

    // レスポンスログ・エラー処理
    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        logger.error(
          {
            url: err.config?.url,
            method: err.config?.method,
            status: err.response?.status,
            data: err.response?.data
          },
          "HTTP Error"
        );
        throw err;
      }
    );
  }
}
