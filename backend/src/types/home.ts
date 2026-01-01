import type { AgeGroup } from "../models/clothes";

export interface HomeMemberCard {
  name: string;
  ageGroup: AgeGroup;
  suggestion: {
    summary: string;
    layers: string[];
    notes: string[];
    references: string[];
  };
  illustrationUrl?: string;
}

export interface HomeTodayResult {
  summary: string;
  weather: {
    region: string;
    value: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    category: string;
    condition: string;
  };
  members: HomeMemberCard[];
}
