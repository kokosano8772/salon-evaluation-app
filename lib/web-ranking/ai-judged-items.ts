// HPルーブリックのうち、ルールだけでは判定しづらい意味的な3項目をAIに判定させる。
// lib/ai-check/build-ai-check-prompt.tsのAI_JUDGED_ITEMSと同じ「1回の呼び出しで
// true/falseの集合を返させ、配点への変換はコード側の決定的なマッピングで行う」
// パターンを踏襲する（直接importはしない。設計書4.6「AIは採点を無条件で
// 全面委任しない」に対応）。

export interface RankingAiItemDefinition {
  itemKey: string;
  category: string;
  maxScore: number;
  label: string;
}

export const HP_AI_JUDGED_ITEMS: RankingAiItemDefinition[] = [
  {
    itemKey: "cta_visibility",
    category: "集客導線・コンバージョン",
    maxScore: 6,
    label: "予約・問い合わせのCTA（行動喚起ボタン）が、サイトを見てすぐに分かる場所に明確に配置されている",
  },
  {
    itemKey: "cta_consistency",
    category: "集客導線・コンバージョン",
    maxScore: 4,
    label: "予約・問い合わせへの導線が主要ページ間で一貫しており、ページによって手段がバラバラになっていない",
  },
  {
    itemKey: "recruit_conditions_clear",
    category: "採用情報",
    maxScore: 3,
    label: "募集職種・雇用条件（給与・勤務時間等）が応募者にとって明確に説明されている",
  },
];
