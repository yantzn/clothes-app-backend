import { openWeatherClient } from "../lib/openweatherClient";
import { categorizeTemperature } from "../models/temperature";
import { GENERAL_AGE_CLOTHES_MATRIX } from "../rules/ageClothesMatrix";
import type { AgeGroup } from "../models/clothes";
import type { HomeMemberCard, HomeTodayResult, GeneralAgeGroup } from "../types/home";
import type { UserProfile } from "../models/profile";
import { DynamoUserProfileRepository } from "../repositories/dynamoUserProfileRepository";
import { calculateAge, ageGroup as generalAgeGroup } from "../lib/age";
import { getTodayMessage } from "./todayMessageService";
import { mapToLayerSpec } from "../rules/layerMapping";

const repo = new DynamoUserProfileRepository();

// 一般年齢区分 × 温度帯の拡張マトリクスを直接参照するため、
// childフォールバックや追加補正は不要。

// 型は types/home に集約

export const getHomeToday = async (userId: string): Promise<HomeTodayResult> => {
  const profile: UserProfile | undefined = await repo.getById(userId);
  if (!profile) {
    throw new Error(`User profile not found or missing location: ${userId}`);
  }

  const { lat, lon } = await openWeatherClient.getLatLon(profile.region);
  const weatherRaw = await openWeatherClient.getWeather(lat, lon);
  const temp = weatherRaw.main?.temp as number;
  const feelsLike = (weatherRaw.main?.feels_like ?? temp) as number;
  const humidity = weatherRaw.main?.humidity as number;
  const windSpeed = weatherRaw.wind?.speed as number;
  // 表示はユーザ入力の地域文字列を優先（日本語表記を維持）
  const region = profile.region;
  const conditionSource = Array.isArray(weatherRaw.weather) && weatherRaw.weather[0]?.main
    ? String(weatherRaw.weather[0].main)
    : "";
  const condition = conditionSource.toLowerCase();

  const category = categorizeTemperature(feelsLike);

  // Main user card
  const userAgeYears = calculateAge(profile.birthday);
  const userGeneralAge: GeneralAgeGroup = generalAgeGroup(userAgeYears) as GeneralAgeGroup;
  const userSuggestion = GENERAL_AGE_CLOTHES_MATRIX[userGeneralAge][category];

  const members: HomeMemberCard[] = [
    {
      name: profile.nickname,
      ageGroup: userGeneralAge,
      suggestion: {
        summary: userSuggestion.summary,
        layers: userSuggestion.layers,
        layersDetailed: userSuggestion.layers.map((l) => mapToLayerSpec(l)),
        notes: userSuggestion.notes
      }
    }
  ];

  // Family cards (use parent's location and current weather)
  for (const fam of profile.family ?? []) {
    const famAgeYears = calculateAge(fam.birthday);
    const famGeneralAge: GeneralAgeGroup = generalAgeGroup(famAgeYears) as GeneralAgeGroup;
    const famSuggestion = GENERAL_AGE_CLOTHES_MATRIX[famGeneralAge][category];
    members.push({
      name: fam.name,
      ageGroup: famGeneralAge,
      suggestion: {
        summary: famSuggestion.summary,
        layers: famSuggestion.layers,
        layersDetailed: famSuggestion.layers.map((l) => mapToLayerSpec(l)),
        notes: famSuggestion.notes
      }
    });
  }

  // 今日のひとことは天気ベースのテンプレ生成に統一
  const summary = getTodayMessage({
    feelsLike,
    windSpeed,
    humidity,
    condition
  });

  return {
    summary,
    weather: {
      region,
      value: temp,
      feelsLike,
      humidity,
      windSpeed,
      category,
      condition
    },
    members
  };
};
