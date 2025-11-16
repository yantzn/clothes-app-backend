
export interface ClothesSuggestion {
  userId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  suggestion: string;     // 例: "薄手の長袖 + パーカーがおすすめ"
  items: string[];        // 例: ["長袖シャツ", "パーカー", "スニーカー"]
}
