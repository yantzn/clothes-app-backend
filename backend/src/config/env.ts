import dotenv from "dotenv";
dotenv.config();

// 必須キーの存在チェック関数
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Environment variable "${key}" is required but missing.`);
  }
  return value;
};

// ENV オブジェクト（型付き）
export const ENV = {
  region: requireEnv("AWS_REGION"),
  openWeatherKey: requireEnv("OPENWEATHER_API_KEY"),
  rakutenAppId: requireEnv("RAKUTEN_APP_ID"),
  rakutenAffiliateId: process.env.RAKUTEN_AFFILIATE_ID,
  isLocal: process.env.IS_LOCAL === "true"
};
