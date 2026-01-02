// 表示用の一般年齢区分（lib/age.ts の ageGroup に合わせる）
export type GeneralAgeGroup = "infant" | "toddler" | "child" | "teen" | "adult" | "senior";

export interface HomeMemberCard {
  name: string;
  ageGroup: GeneralAgeGroup;
  suggestion: {
    summary: string;
    layers: string[];
    notes: string[];
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
