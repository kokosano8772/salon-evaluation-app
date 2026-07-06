// 比較データからGeminiへのプロンプトを組み立てる。「salon investigation-app」の
// src/lib/ai/buildPrompt.ts から移植。

import { ATTRACTION_FIELDS, RECRUITMENT_FIELDS } from "./types";
import type { SalonData, AnalysisMode, ComparisonField, ComparisonData } from "./types";

function getFieldValue(
  salon: SalonData,
  field: ComparisonField,
  cellData: ComparisonData
): string {
  // User-edited value takes priority
  const edited = cellData[salon.id]?.[field.key]?.value;
  if (edited !== undefined && edited !== "") return edited;

  // Fall back to salon's built-in data
  const src = field.category === "attraction" ? salon.attraction : salon.recruitment;
  if (!src) return "";
  const raw = (src as Record<string, unknown>)[field.key];
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return (raw as string[]).filter(Boolean).join("、");
  if (typeof raw === "boolean") return raw ? "あり" : "なし";
  if (typeof raw === "number") return raw === 0 ? "" : String(raw);
  return String(raw);
}

export function buildCompetitorAnalysisPrompt(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData
): string {
  const own = salons.find((s) => s.isOwn);
  const competitors = salons.filter((s) => !s.isOwn);

  const attractionFields = mode !== "recruitment" ? ATTRACTION_FIELDS : [];
  const recruitmentFields = mode !== "attraction" ? RECRUITMENT_FIELDS : [];
  const allFields = [...attractionFields, ...recruitmentFields];

  const modeLabel =
    mode === "attraction" ? "集客分析" : mode === "recruitment" ? "求人分析" : "集客・求人分析";

  // Build structured data table
  let dataSection = "";
  for (const field of allFields) {
    const ownValue = own ? getFieldValue(own, field, cellData) : "";
    const competitorValues = competitors.map((c) => {
      const val = getFieldValue(c, field, cellData);
      const rating = cellData[c.id]?.[field.key]?.rating ?? "neutral";
      const ratingLabel =
        rating === "good" ? "（自社比：良い）" :
        rating === "normal" ? "（自社比：普通）" :
        rating === "bad" ? "（自社比：悪い）" : "";
      return `  - ${c.name}: ${val || "不明"}${ratingLabel}`;
    });

    dataSection += `### ${field.label}\n`;
    dataSection += `  - 自社: ${ownValue || "未入力"}\n`;
    dataSection += competitorValues.join("\n") + "\n\n";
  }

  const competitorList = competitors.map((c) =>
    `${c.name}（${c.area ?? ""}、評価 ${c.rating > 0 ? c.rating.toFixed(1) : "不明"}）`
  ).join("、");

  return `あなたは美容サロン業界（美容室・ネイル・アイラッシュ）の専門経営コンサルタントです。
以下の競合比較データをもとに、自社サロンへの具体的・実践的なアドバイスを日本語で提供してください。

## 分析基本情報
- 自社サロン名: ${own?.name ?? "自社サロン"}（${own?.area ?? ""}）
- 競合サロン（${competitors.length}社）: ${competitorList}
- 分析モード: ${modeLabel}

## 比較データ
${dataSection}

---

以下の8つのセクションを、必ず "## " から始まる見出しで区切って出力してください。
各セクションは箇条書きで3〜5点、具体的かつ実行可能な内容を記述してください。

## 自社の強み
## 自社の弱み
## 競合優位点
## 改善ポイント
## 差別化ポイント
## 価格戦略
## 求人改善案
## 集客改善案`;
}
