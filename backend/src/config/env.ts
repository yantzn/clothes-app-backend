import dotenv from "dotenv";

// .env を読み込む
dotenv.config();

// ランタイム値を常に最新の process.env から取得するラッパ
export const ENV = {
  get region(): string {
    return process.env.AWS_REGION ?? "ap-northeast-1";
  },
  get openWeatherKey(): string {
    return process.env.OPENWEATHER_API_KEY ?? "";
  },
  get isLocal(): boolean {
    return process.env.IS_LOCAL === "true";
  },
  get secretsTtlMs(): number {
    const minutesStr = process.env.SECRETS_TTL_MINUTES;
    const minutes = minutesStr ? Number(minutesStr) : 60;
    const valid = Number.isFinite(minutes) && minutes > 0 ? minutes : 60;
    return valid * 60 * 1000;
  }
};
