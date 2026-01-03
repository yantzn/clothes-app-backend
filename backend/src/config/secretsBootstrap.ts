import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { ENV } from "./env";

// グローバルキャッシュ（ウォーム状態のLambdaやローカルプロセスで再利用）
let initialized = false;
let inFlight: Promise<void> | null = null;
let cachedRaw: string | null = null;
let cachedPayload: Record<string, unknown> | null = null;
let cachedAt: number | null = null;

function isCacheValid(): boolean {
  if (!initialized || cachedAt === null) return false;
  return Date.now() - cachedAt < ENV.secretsTtlMs;
}

/**
 * 本番環境でAWS Secrets Managerからシークレットを取得し、process.envへ反映する初期化関数。
 * 条件:
 * - IS_LOCAL !== "true"
 * - OPENWEATHER_SECRET_ID (シークレット名/ARN) が設定されている
 * 期待フォーマット:
 * SecretString が JSON 文字列で、例:
 * { "OPENWEATHER_API_KEY": "..." }
 */
export async function initSecrets(): Promise<void> {
  const isLocal = process.env.IS_LOCAL === "true";
  const openWeatherSecretId = process.env.OPENWEATHER_SECRET_ID;
  if (isLocal || !openWeatherSecretId) {
    return; // ローカルはdotenv、またはSECRET_ID未設定なら何もしない
  }
  if (isCacheValid()) {
    return; // キャッシュ有効
  }
  if (inFlight) {
    return inFlight; // 進行中の初期化を共有
  }

  inFlight = (async () => {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-northeast-1";
    const client = new SecretsManagerClient({ region });
    const res = await client.send(new GetSecretValueCommand({ SecretId: openWeatherSecretId }));
    const secretString = res.SecretString;
    if (!secretString) {
      initialized = true; // 空でも初期化終了扱い
      inFlight = null;
      return;
    }

    cachedRaw = secretString;
    try {
      const payload = JSON.parse(secretString) as Record<string, unknown>;
      cachedPayload = payload;
      // 既存コードが参照する環境変数へ落とし込み
      if (typeof payload.OPENWEATHER_API_KEY === "string") {
        process.env.OPENWEATHER_API_KEY = payload.OPENWEATHER_API_KEY;
      }
      // 必要に応じて他のキーも追加
    } catch {
      // SecretString がJSON以外の場合はそのままOPENWEATHER_API_KEYに流用
      if (!process.env.OPENWEATHER_API_KEY) {
        process.env.OPENWEATHER_API_KEY = secretString as string;
      }
    }

    initialized = true;
    cachedAt = Date.now();
    inFlight = null;
  })();

  return inFlight;
}

/**
 * 取得済みシークレットのキャッシュを返す（デバッグ/検証用）。
 * raw: SecretString 生文字列（存在する場合）
 * payload: SecretString をJSONとして解釈したオブジェクト（成功時）
 */
export function getCachedSecrets(): { raw?: string; payload?: Record<string, unknown> } {
  return {
    raw: cachedRaw ?? undefined,
    payload: cachedPayload ?? undefined,
  };
}
