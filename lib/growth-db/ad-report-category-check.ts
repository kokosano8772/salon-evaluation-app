// 「集客」「求人」の区分選択ミスを検知する。キャンペーン名に「(集客)」「(求人)」と
// 明記されている店舗では、選んでいる区分と実際のキャンペーン名が食い違っていないか
// 機械的にチェックできる（FLEUVE/アメラボ等、実際にこの手入力ミスで8ヶ月以上
// 気付かれなかった事例があったため追加）。
// 明記が無いキャンペーン名（集客/求人のどちらか一方しか運用していない店舗等）は
// 判定材料が無いため警告しない。
import { AdReportCategory, AD_REPORT_CATEGORY_LABEL } from "./ad-report-types";

const RECRUITMENT_TAG = /[（(]\s*求人/;
const ACQUISITION_TAG = /[（(]\s*集客/;

export function findCategoryMismatch(
  campaigns: { name: string }[],
  category: AdReportCategory
): string | null {
  const oppositeTag = category === "acquisition" ? RECRUITMENT_TAG : ACQUISITION_TAG;
  const mismatched = campaigns.filter((c) => oppositeTag.test(c.name)).map((c) => c.name);
  if (mismatched.length === 0) return null;

  const wrongLabel = category === "acquisition" ? "求人" : "集客";
  const currentLabel = AD_REPORT_CATEGORY_LABEL[category];
  return `キャンペーン名に「${wrongLabel}」と入っているのに「${currentLabel}」区分で同期されています: ${mismatched.join(" / ")}`;
}
