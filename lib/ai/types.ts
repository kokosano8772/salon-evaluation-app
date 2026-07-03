// プロバイダーに依存しない型。Gemini/Claudeどちらの実装でもこの形を返す。
export interface AiGrowthSuggestion {
  categoryId: string;
  title: string;
  description: string;
}
