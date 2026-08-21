// Google広告レポートのAI分析用プロンプトを組み立てる。build-ad-report-prompt.ts（Meta用）と
// 同じ境界方針（数値は全てコード側で計算済みのものを渡し、AIには解釈・文章化だけをさせる）を
// 踏襲するが、Meta用のファイル・処理には一切手を加えず、Google専用として完全に分離する。
//
// MetaはAPIでコンバージョン数を取得できず手入力に頼るため信頼できないが、Google Ads APIの
// metrics.conversionsは確定値がそのまま返るため、コンバージョン数・CVRも信頼して渡してよい。

import { AdReport, AgeGroup, AGE_GROUPS } from "./ad-report-types";
import { AdReportComparison, GrowthLinkComparison, MetricComparison } from "./ad-report-analysis";
import { YoyTrend } from "./ad-report-trend";
import { formatMonthLabel, formatNumber, formatPercent, formatYen } from "./format";

function formatChange(comparison: MetricComparison, format: "yen" | "number" | "percent"): string {
  const value = format === "yen" ? formatYen(comparison.current) : format === "percent" ? formatPercent(comparison.current) : formatNumber(comparison.current);
  if (comparison.changePercent === null) return `${value}（前月データなし）`;
  const sign = comparison.changePercent > 0 ? "+" : "";
  return `${value}（前月比 ${sign}${comparison.changePercent}%）`;
}

// 自社の実績上のCTR平均帯（0.3〜0.5%）に照らした評価。Meta用と同じ帯を使うが、
// Meta側のファイルには手を加えず、Google専用としてこちらに複製する。
const CTR_AVERAGE_MIN = 0.3;
const CTR_AVERAGE_MAX = 0.5;

function ctrEvaluationLabel(ctr: number): string {
  if (ctr > CTR_AVERAGE_MAX) return "業界平均（0.3〜0.5%）を上回る非常に良好な結果";
  if (ctr >= CTR_AVERAGE_MIN) return "業界平均（0.3〜0.5%）並みの良好な結果";
  return "業界平均（0.3〜0.5%）をやや下回るものの、まずまずの結果";
}

function ageGroupLabelForPrompt(ageGroup: AgeGroup): string {
  if (ageGroup === "20-24") return "18-24";
  if (ageGroup === "65+") return "65歳以上";
  return ageGroup;
}

export function buildGoogleAdReportAnalysisPrompt(
  report: AdReport,
  comparison: AdReportComparison,
  growthComparison: GrowthLinkComparison,
  trend: YoyTrend
): string {
  const isRecruitment = report.category === "recruitment";
  const buttonLabel = isRecruitment ? "お問い合わせボタン" : "ご予約ボタン";
  const lines: string[] = [];

  lines.push(`# ${formatMonthLabel(report.yearMonth)}のGoogle広告実績データ（すべて計算済みの確定値）`);
  lines.push("");
  lines.push("## ①前月比較");
  lines.push(`- クリック数: ${formatChange(comparison.clicks, "number")}`);
  lines.push(`- CTR: ${formatChange(comparison.ctr, "percent")}`);
  lines.push(`- CTRの評価: ${ctrEvaluationLabel(report.ctr)}（この評価表現をそのまま文章に使うこと。自分で良し悪しを判断し直さない）`);
  lines.push(`- ${buttonLabel}クリック数: ${formatChange(comparison.conversions, "number")}`);
  lines.push(`- ${buttonLabel}を押した割合: ${formatChange(comparison.cvr, "percent")}`);

  const ageClicks = report.ageGroupClicks ?? [];
  const ageConversions = report.ageGroupConversions ?? [];
  const ageRows = AGE_GROUPS.map((ageGroup) => {
    const clicks = ageClicks.find((a) => a.ageGroup === ageGroup)?.clicks ?? 0;
    const conversions = ageConversions.find((a) => a.ageGroup === ageGroup)?.conversions ?? 0;
    const rate = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0;
    return { ageGroup, clicks, conversions, rate };
  }).filter((r) => r.clicks > 0 || r.conversions > 0);

  if (ageRows.length > 0) {
    const bestByRate = ageRows.reduce((a, b) => (b.rate > a.rate ? b : a));
    lines.push("");
    lines.push(`## 年代別${buttonLabel}を押した割合（今月）`);
    for (const r of ageRows) {
      lines.push(`- ${ageGroupLabelForPrompt(r.ageGroup)}歳: ${r.rate.toFixed(2)}%（${r.conversions}件）`);
    }
    lines.push(`- 最も反応が良い年代: ${ageGroupLabelForPrompt(bestByRate.ageGroup)}歳（この事実だけを使い、他の年代を推測で語らないこと）`);
  }

  const breakdown = report.conversionActionBreakdown ?? [];
  if (breakdown.length > 0) {
    lines.push("");
    lines.push(`## ${buttonLabel}の内訳（今月）`);
    for (const b of breakdown) {
      lines.push(`- ${b.name}: ${b.conversions}件`);
    }
  }

  if (!isRecruitment && report.searchTerms && report.searchTerms.length > 0) {
    lines.push("");
    lines.push("## クリックが多かった検索語句（今月・上位）");
    for (const s of report.searchTerms.slice(0, 3)) {
      lines.push(`- ${s.term}（${s.clicks}クリック）`);
    }
  }

  const hasCurrentTrend = trend.currentCycle.some((p) => p.rate != null);
  if (hasCurrentTrend) {
    const nonNull = trend.currentCycle.filter((p): p is { yearMonth: string; rate: number; clicks: number | null } => p.rate != null);
    const first = nonNull[0];
    const latest = nonNull[nonNull.length - 1];
    lines.push("");
    lines.push("## 直近の推移");
    lines.push(`- ${trend.currentCycleLabel}期間の開始月（${first.yearMonth}）の割合: ${first.rate.toFixed(2)}%`);
    lines.push(`- 直近月（${latest.yearMonth}）の割合: ${latest.rate.toFixed(2)}%`);
  }

  if (growthComparison.totalRevenue !== null) {
    lines.push("");
    lines.push("## 成長データ（売上・集客）との関連");
    lines.push(`- 月間売上: ${formatChange(growthComparison.totalRevenue, "yen")}`);
    if (growthComparison.newCustomers) lines.push(`- 新規客数: ${formatChange(growthComparison.newCustomers, "number")}`);
    if (growthComparison.existingCustomers) lines.push(`- 既存客数: ${formatChange(growthComparison.existingCustomers, "number")}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "上記はすべて計算済みの確定値です。あなたはこの数値を一切再計算せず、解釈と文章化だけを行ってください。" +
      `美容室オーナー向けのGoogle広告${isRecruitment ? "（求人）" : "（集客）"}運用レポートに載せる文章を、次の4部構成で日本語で書いてください。` +
      "数値の再掲は根拠として簡潔に触れる程度にとどめ、羅列や表形式にはしないでください。"
  );
  lines.push("");
  lines.push(
    "文体は次のトーンを厳守すること（美容室オーナーが安心して読める、丁寧な報告文にするため）:\n" +
      "・数値が悪化していても、いきなり悪い印象を与えない。まず前向きに言い換えてから触れる。\n" +
      "・原因の説明は断定せず、常に柔らかい推測口調にする（「〜の可能性が考えられます」「〜が要因の一つと考えられます」）。\n" +
      "・CTR・CVRのような専門用語を並べず、クリック数・年代・検索語句など、オーナーが直感的にイメージできる言葉で語る。\n" +
      "・断定的な命令口調は使わない。\n" +
      '・「〜についてご報告いたします」のような形式的な前置き・挨拶文で書き出さない。1文目からすぐ本題に入ること。\n' +
      '・月に言及する際、西暦（「2026年7月」等の4桁の年）は書かないこと。「7月は」「今月は」のように月だけ、または相対的な言い方にする。\n' +
      "・広告クリエイティブ（画像・動画の中身やデザイン）については一切データを渡していないため、その中身に関する言及・提案は絶対に書かないこと。\n" +
      "・出力はすべてプレーンテキストで、Markdown記法（**太字**、*斜体*、# 見出し、- 箇条書き等）は一切使わないこと" +
      "（見出しやアクション行を指示する \"## 〜\" \"- \" は、後述する構成マーカーとして使う場合のみ許可する）。"
  );
  lines.push("");
  lines.push(
    "1部目（見出し不要）: 1文、どうしても足りない場合のみ2文で、合計50字程度・絶対に60字を超えないように、" +
      "前月比較を踏まえた今月の運用状況の要約を書く。良かった点・気になる点の両方に触れてよいが、1文に収まらないなら" +
      "気になる点は省略してよい。文字数を優先し、内容を削ってでも必ず60字以内に収めること。" +
      '例（この文字数感を必ず守ること）:「ご予約ボタンを押された割合は前月よりやや減少したものの、クリック数はほとんど変わらず安定しております。」（51字）'
  );
  lines.push("");
  lines.push(
    `2部目: 1行目に "## 年代別の傾向" とだけ書いた見出しを置き、その後に1〜2文・70字以内で、年代別データのうち上記で渡した` +
      "「最も反応が良い年代」の事実だけを使って一言添える。他の年代について触れる場合も、渡された数値の範囲内に留めること。" +
      "年代別データが渡されていない場合はこの部を空欄にすること。"
  );
  lines.push("");
  lines.push(
    '3部目: 1行目に "## サロン様へのご提案" とだけ書いた見出しを置く。2行目に、提案内容を一言で表す太字見出しを' +
      "20字前後（25字を絶対に超えない）で書く（体言止めではなく「〜してください」調の短い一文。" +
      "例:「引き続き、メニュー内容をご確認ください」＝19字）。" +
      "3行目以降（1行空けてよい）に、3〜4文・200字以内で具体的な改善提案の本文を書く。" +
      "「反応率を高める」のような目標・指標を言い換えただけの抽象的な提案は禁止。渡されたデータだけから根拠づけられる、具体的なアクションを書くこと" +
      "（例:「反応の良い〇〇歳向けの訴求を強化する」「〇〇という検索語句に合わせたページ内容を充実させる」）。" +
      "文末は「〜はいかがでしょうか」「〜をおすすめいたします」のような依頼・提案調にすること。" +
      "本文の後に1行空けて、この提案に関連する具体的なアクションを2つ、それぞれ「- 」で始めて1行ずつ書く。" +
      "各アクションは10〜14字程度の体言止め（例:「- 変更後メニューの予約状況確認」「- 今後の掲載内容の見直し」）。"
  );
  lines.push("");
  lines.push(
    '4部目: 1行目に "## ココデザインが行う改善策" とだけ書いた見出しを置く。2行目に、改善策を一言で表す太字見出しを' +
      "20字前後（25字を絶対に超えない）で書く（体言止めではなく「〜します」調の短い一文。" +
      "例:「メニューの対象が分かりやすくなるよう調整します」＝23字）。" +
      "3行目以降（1行空けてよい）に、3〜4文・200字以内で、代理店（ココデザイン）側が来月行う運用上の改善アクションを、" +
      "渡されたデータ（内訳・検索語句・年代別など）を根拠にして具体的に書く" +
      "（例:「反応の良い〇〇歳への配信比重を調整いたします」「〇〇という検索語句に合わせた内容を確認してまいります」）。" +
      "本文の後に1行空けて、この改善策に関連する具体的なアクションを2つ、それぞれ「- 」で始めて1行ずつ書く。" +
      "各アクションは10〜14字程度の体言止め（例:「- 対象メニューのラベル追加」「- LP内容と広告文の一致確認」）。"
  );
  lines.push("");
  lines.push(
    "各部の文字数はサロン「oasis-un」の実物レポート（1部目約50字・2部目約65字・見出し約20字・本文（3部目/4部目とも）約190字・" +
      "アクション各10〜14字）を基準にした上限です。レイアウトの都合で厳守してください。" +
      "上限を超えそうな場合は必ず文を削って収めてください。"
  );

  return lines.join("\n");
}
