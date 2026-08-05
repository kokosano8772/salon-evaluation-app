// 広告レポートのAI分析用プロンプトを組み立てる。
// ここで渡す数値はすべて lib/growth-db/ad-report-analysis.ts で計算済みのもの。
// AIには一切計算させず、渡された数値をそのまま解釈・文章化させるだけに留める
// （「AIにすべての計算を任せない」という要件のための境界）。

import { AdReport, AGE_GROUPS } from "./ad-report-types";
import { AdReportComparison, CampaignAnalysis, GrowthLinkComparison, MetricComparison } from "./ad-report-analysis";
import { formatMonthLabel, formatPercent, formatYen, formatNumber } from "./format";

function formatChange(comparison: MetricComparison, format: "yen" | "number" | "percent"): string {
  const value = format === "yen" ? formatYen(comparison.current) : format === "percent" ? formatPercent(comparison.current) : formatNumber(comparison.current);
  if (comparison.changePercent === null) return `${value}（前月データなし）`;
  const sign = comparison.changePercent > 0 ? "+" : "";
  return `${value}（前月比 ${sign}${comparison.changePercent}%）`;
}

// 自社の実績上のCTR平均帯（0.3〜0.5%）に照らした評価。この判定はAIにさせず
// コード側で確定させ、AIには「どう評価すべきか」の答えごと渡す。
const CTR_AVERAGE_MIN = 0.3;
const CTR_AVERAGE_MAX = 0.5;

function ctrEvaluationLabel(ctr: number): string {
  if (ctr > CTR_AVERAGE_MAX) return "業界平均（0.3〜0.5%）を上回る非常に良好な結果";
  if (ctr >= CTR_AVERAGE_MIN) return "業界平均（0.3〜0.5%）並みの良好な結果";
  return "業界平均（0.3〜0.5%）をやや下回るものの、まずまずの結果";
}

export function buildAdReportAnalysisPrompt(
  report: AdReport,
  comparison: AdReportComparison,
  campaignAnalysis: CampaignAnalysis,
  growthComparison: GrowthLinkComparison
): string {
  const lines: string[] = [];

  // Meta広告はコンバージョン数を自動取得できず、手入力（未入力なら0）に頼っているため
  // 数値として信用できない。「0件」を実態の不振と誤解してAIが指摘してしまうのを防ぐため、
  // Meta広告のレポートではコンバージョン/CPA/CVRに関する情報を一切AIに渡さない。
  const trustConversions = report.platform !== "meta";

  lines.push(`# ${formatMonthLabel(report.yearMonth)}の広告実績データ（すべて計算済みの確定値）`);
  lines.push("");
  lines.push("## ①前月比較");
  // 広告費の増減はこちら（代理店側）が決めているものであり、店舗オーナー向けの
  // 文章として「上がった／下がった」を話題にすると生々しく響くため含めない。
  lines.push(`- クリック数: ${formatChange(comparison.clicks, "number")}`);
  lines.push(`- CTR: ${formatChange(comparison.ctr, "percent")}`);
  lines.push(`- CTRの評価: ${ctrEvaluationLabel(report.ctr)}（この評価表現をそのまま文章に使うこと。自分で良し悪しを判断し直さない）`);
  lines.push(`- CPC: ${formatChange(comparison.cpc, "yen")}`);
  if (trustConversions) {
    lines.push(`- コンバージョン数: ${formatChange(comparison.conversions, "number")}`);
    lines.push(`- CPA: ${formatChange(comparison.cpa, "yen")}`);
  }

  if (report.ageGroupClicks && report.ageGroupClicks.length > 0) {
    const best = [...report.ageGroupClicks].sort((a, b) => b.clicks - a.clicks)[0];
    lines.push("");
    lines.push("## 年齢層別クリック数（今月）");
    for (const group of AGE_GROUPS) {
      const entry = report.ageGroupClicks.find((e) => e.ageGroup === group);
      if (entry) lines.push(`- ${group}歳: ${entry.clicks}回`);
    }
    lines.push(`- 最も反応が良い年齢層: ${best.ageGroup}歳`);
    if (report.targetAgeRange) lines.push(`- 設定ターゲット年齢: ${report.targetAgeRange}`);
  }

  // best/worst/highSpendLowPerformance/worsenedはすべてコンバージョン・CPA・CVRに
  // 依存した分析のため、Meta広告では丸ごと対象外にする
  if (trustConversions && report.campaigns.length > 0) {
    const campaignLines: string[] = [];
    if (campaignAnalysis.best) {
      campaignLines.push(`- 最も成果が良いキャンペーン: 「${campaignAnalysis.best.name || "（名称未入力）"}」CPA ${formatYen(campaignAnalysis.best.cpa)}`);
    }
    if (campaignAnalysis.worst) {
      const detail =
        campaignAnalysis.worst.conversions === 0
          ? `コンバージョン0件（広告費 ${formatYen(campaignAnalysis.worst.spend)}）`
          : `CPA ${formatYen(campaignAnalysis.worst.cpa)}`;
      campaignLines.push(`- 改善が必要なキャンペーン: 「${campaignAnalysis.worst.name || "（名称未入力）"}」${detail}`);
    }
    for (const c of campaignAnalysis.highSpendLowPerformance) {
      campaignLines.push(`- 広告費を使っているが成果が弱い: 「${c.name || "（名称未入力）"}」広告費 ${formatYen(c.spend)}・CVR ${formatPercent(c.cvr)}`);
    }
    for (const { campaign, cpaChangePercent } of campaignAnalysis.worsened) {
      campaignLines.push(`- 前月よりCPAが悪化: 「${campaign.name || "（名称未入力）"}」CPA ${formatYen(campaign.cpa)}・前月比 +${cpaChangePercent}%`);
    }
    if (campaignLines.length > 0) {
      lines.push("");
      lines.push("## ②キャンペーン分析");
      lines.push(...campaignLines);
    }
  }

  if (growthComparison.totalRevenue !== null) {
    lines.push("");
    lines.push("## ③成長データ（売上・集客）との関連");
    lines.push(`- 月間売上: ${formatChange(growthComparison.totalRevenue, "yen")}`);
    if (growthComparison.newCustomers) lines.push(`- 新規客数: ${formatChange(growthComparison.newCustomers, "number")}`);
    if (growthComparison.existingCustomers) lines.push(`- 既存客数: ${formatChange(growthComparison.existingCustomers, "number")}`);
    if (growthComparison.totalVisits) lines.push(`- 総来店数: ${formatChange(growthComparison.totalVisits, "number")}`);
    if (growthComparison.averageUnitPrice) lines.push(`- 客単価: ${formatChange(growthComparison.averageUnitPrice, "yen")}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "上記はすべて計算済みの確定値です。あなたはこの数値を一切再計算せず、解釈と文章化だけを行ってください。" +
      "美容室オーナー向けの広告運用レポートの「運用状況とご提案」欄に載せる文章を、次の2部構成で日本語で書いてください。" +
      "数値の再掲は根拠として簡潔に触れる程度にとどめ、羅列や表形式にはしないでください。"
  );
  lines.push("");
  lines.push(
    "文体は次のトーンを厳守すること（美容室オーナーが安心して読める、丁寧な報告文にするため）:\n" +
      "・数値が悪化していても、いきなり悪い印象を与えない。まず「大きく崩れることなく」「引き続き良好な水準を維持しています」のように前向きに言い換えてから触れる。\n" +
      "・原因の説明は断定せず、常に柔らかい推測口調にする（「〜の可能性が考えられます」「〜が要因の一つと考えられます」）。「〜が原因です」のような断定は避ける。\n" +
      "・一見不安に見えるデータ（想定外の性別・年齢層への配信など）には、先回りで安心材料を添える（例:「Metaの配信最適化によるもので、特に問題はございません」）。\n" +
      "・CPA・CVR・CPCのような専門用語を並べず、年齢層・クリエイティブ（画像/動画）・ターゲット設定など、オーナーが直感的にイメージできる言葉で語る。\n" +
      "・断定的な命令口調は使わない。\n" +
      '・「〜についてご報告いたします」のような形式的な前置き・挨拶文で書き出さない。1文目からすぐ本題（状況分析）に入ること。'
  );
  lines.push("");
  lines.push(
    "1部目（見出し不要）: 3〜5文・260字以内で、前月比較・キャンペーン分析・成長データとの関連（データがあれば）を踏まえた状況分析を書く。" +
      "良かった点・気になる点の両方に触れる。260字を超えそうな場合は文を削って必ず収めること。"
  );
  lines.push("");
  lines.push(
    '2部目: 1行目に "## 提案" とだけ書いた見出しを置き、その後に2〜3文・160字以内で具体的な改善提案を書く。' +
      "「継続すべきこと」「改善すべきこと」「中止すべきこと」「次に試すべきこと」のうち、データから妥当なものを1〜2個だけ選んで簡潔に述べる。\n" +
      "・「クリック単価を抑制する」「リーチを強化する」のような目標・指標を言い換えただけの抽象的な提案は禁止。" +
      "渡されたデータだけから根拠づけられる、具体的なアクションを書くこと。" +
      "OK例:「ターゲット年齢層を〇〇歳中心に絞り込む」「配信時間を〇時〜〇時に絞る」「反応の良い〇〇キャンペーンへ比重を移す」。\n" +
      "・広告クリエイティブ（画像・動画の中身やデザイン）については一切データを渡していないため、" +
      "「画像を変更する」「動画の構成を変える」のようなクリエイティブの中身に関する提案は絶対に書かないこと（根拠のない作り話になるため）。\n" +
      "・キャンペーン名や年齢層など具体的な固有名詞を使うこと。文末は「〜はいかがでしょうか」「〜をおすすめいたします」" +
      "「ぜひご検討ください」のような依頼・提案調にし、命令調は使わないこと。160字を超えそうな場合は文を削って必ず収めること。"
  );
  lines.push("");
  lines.push("文字数はレポートのレイアウトの都合で厳守してください。合計でも400字を超えないようにしてください。");

  return lines.join("\n");
}
