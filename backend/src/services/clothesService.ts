import { AGE_CLOTHES_MATRIX } from "../rules/ageClothesMatrix.js";
import { categorizeTemperature } from "../models/temperature.js";
import type { AgeGroup } from "../models/clothes.js";
import type { ClothesResponse } from "../types/clothes.js";
import { getUserProfile } from "./profileService.js";
import { getWeather } from "../lib/openweather.js";

/**
 * 誕生日（YYYY-MM-DD）から概算の「年齢（年）」を算出するユーティリティ。
 * WHY:
 *  - 服装レコメンドは月齢より粗いグルーピング(乳児/幼児/児童)で十分なため、
 *    厳密な月齢計算ではなく“誕生日を過ぎたか”のみで年齢を減算。
 *  - 負値や不完全な日付入力への安全策として 0 を返し後段の ageGroup 判定に委譲。
 */
const calculateAgeYears = (birthday: string): number => {
  const today = new Date();
  const [y, m, d] = birthday.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return 0;

  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();

  const hasNotHadBirthdayThisYear =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  if (hasNotHadBirthdayThisYear) {
    age--;
  }

  return age < 0 ? 0 : age;
};

/**
 * 年齢(年)から AgeGroup を推定。
 * WHY:
 *  - ドメイン上、体温調節や衣服レイヤー基準を 3 区分に単純化しメンテナンス性を高める。
 *  - しきい値は一元管理し、変更時はここだけ触れば良いようにする。
 */
const toAgeGroup = (ageYears: number): AgeGroup => {
  if (ageYears < 1) return "infant";
  if (ageYears < 6) return "toddler";
  return "child";
};

/**
 * ユーザーIDをもとに、プロフィール + 現在の天気 + 医学的ルールマトリクスを統合して服装提案を生成。
 * フロー:
 *  1. プロフィール取得（存在/位置情報/誕生日の前提チェック）
 *  2. 誕生日 → 粗い年齢計算 → AgeGroup 分類
 *  3. 緯度経度から現在の気温と体感温度取得（feels_like が無ければ気温で代替）
 *  4. 体感温度をカテゴリー化（モデルの温度帯ロジック）
 *  5. 年齢 × 温度帯 → 服装ルールマトリクス参照
 *  6. DTO 組み立て（サービスは HTTP を知らない）
 * WHY:
 *  - 例外はハンドラーでマスクされる前提のため、ここでは早期 throw により異常状態を明示。
 *  - インフラアクセス(OpenWeather/Dynamo)は lib/ 経由で抽象化し、テスト容易性を確保。
 *  - 純粋ロジック部分（年齢計算/カテゴリ判定）は関数分離し差分検証しやすく。
 */
export const getClothes = async (userId: string): Promise<ClothesResponse> => {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error(`User not found: ${userId}`);
  }

  if (!profile.lat || !profile.lon) {
    throw new Error(`User profile has no location (lat/lon): ${userId}`);
  }

  if (!profile.birthday) {
    throw new Error(`User profile has no birthday: ${userId}`);
  }

  // 年齢→AgeGroup（グループ化で行動指針/服装レイヤーを切替）
  const ageYears = calculateAgeYears(profile.birthday);
  const ageGroup = toAgeGroup(ageYears);

  // 現在気象: 体感温度があれば優先し、無い場合は実気温で代替。
  const weather = await getWeather(profile.lat, profile.lon);
  const temp = weather.main.temp;
  const feelsLike = weather.main.feels_like ?? temp;

  // 温度カテゴリ分類（推奨レイヤー選択キー）
  const category = categorizeTemperature(feelsLike);

  // 年齢 × 温度カテゴリでマトリクス参照（医学的注意点含む）
  const rule = AGE_CLOTHES_MATRIX[ageGroup][category];

  return {
    userId,
    ageGroup,
    temperature: {
      value: temp,
      feelsLike,
      category
    },
    suggestion: {
      summary: rule.summary,
      layers: rule.layers,
      notes: rule.notes,
      references: rule.references
    }
  };
};
