import { DiagnosisAnswers, DiagnosisResult, CategoryScore } from "./types";
import { calculateRank } from "./scoring";

export interface QuickQuestion {
  id: string;
  label: string;
  hint: string;
  options: string[];
  scores: number[];
  optionDescriptions: string[];
}

export interface QuickCategory {
  id: string;
  name: string;
  nameEn: string;
  maxScore: number;
  icon: string;
  color: string;
  description: string;
  question: QuickQuestion;
}

export const QUICK_CATEGORIES: QuickCategory[] = [
  {
    id: "product",
    name: "商品力",
    nameEn: "Product Power",
    maxScore: 20,
    icon: "Scissors",
    color: "#C4788A",
    description: "技術・メニュー・サービスの総合的な質",
    question: {
      id: "quick_product",
      label: "技術・メニュー・サービスの質について",
      hint: "あなたがご自身で思うサロン全体のクオリティを正直に評価してください",
      options: ["課題が多いと感じる", "まだまだだなと感じる", "課題はあるが、まあまあだなと感じる", "よく頑張っていると思っている", "周りからもすごいね！と褒められる"],
      scores: [0, 5, 10, 15, 20],
      optionDescriptions: [
        "クレームや不満の声が多く、技術・メニューに課題を感じている",
        "悪くはないが、他店との差別化ができていない",
        "近隣の一般的なサロンと比べて、引けを取らないレベルだと思っている",
        "他店との差別化ができていてリピーターや指名客に支えられている実力がある",
        "口コミ・紹介が絶えず、地域・業界でも認知されている",
      ],
    },
  },
  {
    id: "customer",
    name: "顧客支持力",
    nameEn: "Customer Loyalty",
    maxScore: 20,
    icon: "Heart",
    color: "#7C9EB5",
    description: "リピート・口コミ・顧客との信頼関係の強さ",
    question: {
      id: "quick_customer",
      label: "新規客リピート・顧客への定着",
      hint: "6か月での新規のお客様のリピート率から総合的に見てください",
      options: ["ご新規客リピート率 0〜20%", "ご新規客リピート率 21〜35%", "ご新規客リピート率 36〜50%", "ご新規客リピート率 51〜60%", "ご新規客リピート率 61%以上"],
      scores: [0, 5, 10, 15, 20],
      optionDescriptions: [
        "2回目のご来店されるお客様が少ない",
        "リピート率が低く、常連がなかなか育たない",
        "ある程度リピートはあるが、まだ改善の余地がある",
        "常連客が多く、口コミや紹介も定期的にある",
        "高い再来率・指名率で、既存顧客からの紹介が主な集客になっている",
      ],
    },
  },
  {
    id: "brand",
    name: "ブランド力",
    nameEn: "Brand Power",
    maxScore: 15,
    icon: "Star",
    color: "#9B8DBF",
    description: "SNS・Google・HPなどオンラインでの集客力と認知度",
    question: {
      id: "quick_brand",
      label: "オンライン集客・知名度",
      hint: "SNS・Googleマップ・ホームページなどからお客様が来ているかどうかで判断してください\n※HPBの掲載サロン様は、それ以外の発信・取り組みで選んでください",
      options: ["ほぼ発信なし", "最低限はある", "少し取り組んでいる", "積極的に発信している", "強い集客力がある"],
      scores: [0, 4, 8, 11, 15],
      optionDescriptions: [
        "SNSもホームページも活用できておらず、集客が大手集客ポータルサイト頼みの状態",
        "SNS・Google・HPはあるが更新していない状況",
        "InstagramなどSNSを定期的に更新している",
        "SNS・Google・HPなどを組み合わせてAI検索対策／オンライン集客している",
        "SNSフォロワーが多くGoogleの評価も高い。集客に困らない状態",
      ],
    },
  },
  {
    id: "recruitment",
    name: "採用力",
    nameEn: "Recruitment",
    maxScore: 15,
    icon: "Users",
    color: "#6BAB8A",
    description: "求人・応募・定着など、人材を集めて育てる力",
    question: {
      id: "quick_recruitment",
      label: "求人への応募・スタッフの定着",
      hint: "求人を出したときの応募数と、採用したスタッフが長く続くかどうかで判断してください",
      options: ["全く応募がない", "ほとんど来ない", "たまに来る", "定期的に来る", "常に応募がある"],
      scores: [0, 4, 8, 11, 15],
      optionDescriptions: [
        "求人を出しても全く応募がなく、慢性的な人手不足の状態",
        "年に数件しか応募がなく、採用にとても苦労している",
        "求人を出せば数件の応募はくる程度",
        "月に複数の応募があり、優秀な人材を選べる状態",
        "求人を出す前から問い合わせがある、選ばれるサロン",
      ],
    },
  },
  {
    id: "organization",
    name: "組織力",
    nameEn: "Organization",
    maxScore: 15,
    icon: "Building2",
    color: "#E08B6B",
    description: "仕組み・育成・チームとして自走できる体制",
    question: {
      id: "quick_organization",
      label: "オーナー不在でもサロンが回るか",
      hint: "自分がいなくてもスタッフだけで普通に運営できるかどうかで判断してください",
      options: ["完全に自分頼り", "ほぼ自分頼り", "少し仕組みがある", "ある程度できている", "自走できる組織"],
      scores: [0, 4, 8, 11, 15],
      optionDescriptions: [
        "自分（オーナー）がいないとサロンが回らない状態",
        "不在にするとトラブルが起きやすく、常に気が抜けない",
        "マニュアルや担当分けなど、一部は仕組み化されている",
        "自分がいなくても通常業務はほぼ問題なく回る",
        "スタッフが自律的に動き、自分は経営に集中できる",
      ],
    },
  },
  {
    id: "future",
    name: "将来性",
    nameEn: "Future Potential",
    maxScore: 15,
    icon: "TrendingUp",
    color: "#5B9BD5",
    description: "AI・デジタル・新しい取り組みへの対応力",
    question: {
      id: "quick_future",
      label: "デジタル・新しい取り組みへの対応",
      hint: "LINE・SNS・AI検索など、新しいツールや集客手段にどれだけ対応しているかで判断してください",
      options: ["全く手つかず", "ほぼ対応できていない", "少し始めている", "積極的に取り組んでいる", "先進的に対応している"],
      scores: [0, 4, 8, 11, 15],
      optionDescriptions: [
        "AI・SNS・デジタルツールへの対応が全くできていない",
        "必要性は感じているが、何から始めればいいかわからない",
        "LINEやInstagramなど一部のツールを使い始めている",
        "複数のデジタルツールを活用し、集客・業務効率に活かしている",
        "AI検索対策・データ活用など、最先端の取り組みを実践している",
      ],
    },
  },
];

export function calculateQuickResult(answers: DiagnosisAnswers): DiagnosisResult {
  const categoryScores: CategoryScore[] = QUICK_CATEGORIES.map((cat) => {
    const answerIndex = answers[cat.question.id] ?? 0;
    const score = cat.question.scores[answerIndex] ?? 0;
    return {
      categoryId: cat.id,
      name: cat.name,
      nameEn: cat.nameEn,
      score,
      maxScore: cat.maxScore,
      percentage: Math.round((score / cat.maxScore) * 100),
      color: cat.color,
    };
  });

  const totalScore = categoryScores.reduce((sum, cs) => sum + cs.score, 0);
  const rank = calculateRank(totalScore);

  return {
    totalScore,
    rank,
    categoryScores,
    answers,
    completedAt: new Date().toISOString(),
  };
}
