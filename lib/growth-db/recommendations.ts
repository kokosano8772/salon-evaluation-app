import { GrowthCategoryId, GrowthCategoryScore } from "./types";

export interface GrowthImprovement {
  categoryId: GrowthCategoryId;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

type Tier = "low" | "mid" | "high";

const TEMPLATES: Record<GrowthCategoryId, Record<Tier, { title: string; description: string }>> = {
  acquisition: {
    low: {
      title: "集客チャネルの分散が急務です",
      description: "特定チャネルへの依存度が高い可能性があります。Google・SNS・紹介など複数チャネルの流入を底上げしましょう。",
    },
    mid: {
      title: "CVRの改善余地があります",
      description: "流入はあるものの来店転換率に伸びしろがあります。予約導線やLPの見直しを検討しましょう。",
    },
    high: {
      title: "集客の仕組みは高水準です",
      description: "現状のチャネル構成を維持しつつ、AI検索対応など新しい流入経路にも投資しましょう。",
    },
  },
  repeat: {
    low: {
      title: "再来率向上が最優先課題です",
      description: "失客率が高い可能性があります。次回予約・LINE登録の声かけを来店ごとの必須フローにしましょう。",
    },
    mid: {
      title: "指名率を伸ばす余地があります",
      description: "リピートは一定水準ですが指名化が課題です。担当制の案内やスタッフ紹介の発信を強化しましょう。",
    },
    high: {
      title: "高いリピート構造ができています",
      description: "既存客からの紹介施策を仕組み化し、さらなる口コミ拡大を狙いましょう。",
    },
  },
  brand: {
    low: {
      title: "オンライン上の信頼獲得が必要です",
      description: "口コミ・評価数がまだ少ない状態です。来店後のレビュー依頼を接客フローに組み込みましょう。",
    },
    mid: {
      title: "指名検索を増やす余地があります",
      description: "認知はあるものの指名検索が伸びていません。スタッフ個人の発信を強化しましょう。",
    },
    high: {
      title: "ブランド力はトップクラスです",
      description: "この評価を採用広報や新規出店の武器として活用しましょう。",
    },
  },
  recruitment: {
    low: {
      title: "応募数の底上げが必要です",
      description: "求人媒体を増やし、職場の雰囲気が伝わる写真・動画コンテンツを拡充しましょう。",
    },
    mid: {
      title: "採用率の改善余地があります",
      description: "応募はあるものの採用まで至っていません。面接プロセスや条件面の見直しを検討しましょう。",
    },
    high: {
      title: "採用力は高水準です",
      description: "採用単価の最適化にも取り組み、投資対効果をさらに高めましょう。",
    },
  },
  organization: {
    low: {
      title: "定着率の改善が急務です",
      description: "離職率が高い可能性があります。1年目スタッフへの教育・面談頻度を増やしましょう。",
    },
    mid: {
      title: "マニュアル・評価制度の整備が有効です",
      description: "組織の土台はありますが、仕組み化がさらに進むと安定度が増します。",
    },
    high: {
      title: "組織力はトップクラスです",
      description: "次の店長・幹部候補の育成にさらに投資し、多店舗展開に備えましょう。",
    },
  },
};

function tierFor(percentage: number): Tier {
  if (percentage < 50) return "low";
  if (percentage < 75) return "mid";
  return "high";
}

const PRIORITY_FOR_TIER: Record<Tier, GrowthImprovement["priority"]> = {
  low: "high",
  mid: "medium",
  high: "low",
};

// スコアの低いカテゴリ順に改善提案を返す
export function buildGrowthImprovements(categoryScores: GrowthCategoryScore[]): GrowthImprovement[] {
  return [...categoryScores]
    .sort((a, b) => a.percentage - b.percentage)
    .map((cs) => {
      const tier = tierFor(cs.percentage);
      const template = TEMPLATES[cs.categoryId][tier];
      return {
        categoryId: cs.categoryId,
        title: template.title,
        description: template.description,
        priority: PRIORITY_FOR_TIER[tier],
      };
    });
}
