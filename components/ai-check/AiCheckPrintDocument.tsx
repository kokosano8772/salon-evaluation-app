import {
  AI_CHECK_CATEGORY_LABEL,
  AI_CHECK_RANK_INFO,
  AiCheckCategoryId,
  AiCheckRank,
  AiCheckRecommendation,
} from "@/lib/ai-check/types";

const ACCENT = "#5B9BD5";

const PRIORITY_STYLES = {
  high: { label: "優先度：高", bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#f87171" },
  medium: { label: "優先度：中", bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#fbbf24" },
  low: { label: "優先度：低", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#4ade80" },
};

interface CategoryScoreRow {
  categoryId: AiCheckCategoryId;
  score: number;
  maxScore: number;
}

interface AiCheckPrintDocumentProps {
  url: string;
  totalScore: number;
  rank: AiCheckRank;
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: AiCheckRecommendation[];
  categoryScores: CategoryScoreRow[];
  createdAt: string;
}

// PDF保存専用の静止レイアウト。価値診断側のDiagnosisPrintDocument.tsxと同じ設計思想
// （タブは画面用の仕組みなのでPDFには不要、アニメーションも使わず全セクションを
// 常に完成形で1枚の縦長ドキュメントとして描画する）。lib/pdf.tsのexportResultToPDFは
// 型に依存しない汎用関数になっているため、このコンポーネントをキャプチャ対象として
// そのまま渡せる。
export default function AiCheckPrintDocument({
  url,
  totalScore,
  rank,
  summary,
  target,
  strengths,
  weaknesses,
  recommendations,
  categoryScores,
  createdAt,
}: AiCheckPrintDocumentProps) {
  const rankInfo = AI_CHECK_RANK_INFO[rank];
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - totalScore / 100);

  return (
    <div style={{ width: 480, backgroundColor: "#F5F8FA", fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Header */}
      <div data-print-section style={{ padding: "28px 32px 20px", textAlign: "center" }}>
        <p style={{ color: ACCENT, fontSize: 11, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
          Salon AI Check
        </p>
        <p style={{ color: "#6b7280", fontSize: 11, wordBreak: "break-all" }}>{url}</p>
        <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
          {new Date(createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Score Hero */}
      <div data-print-section style={{ padding: "0 32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 192, height: 192 }}>
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#eef2f5" strokeWidth={6} />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke={ACCENT} strokeWidth={6}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: ACCENT, lineHeight: 1 }}>{totalScore}</span>
            <span style={{ color: "#9ca3af", fontSize: 14, marginTop: 2 }}>/ 100点</span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontSize: 28, fontWeight: 700,
              background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}cc 100%)`,
            }}
          >
            {rank}
          </div>
          <p style={{ marginTop: 8, fontWeight: 600, color: "#1a1a1a", fontSize: 16 }}>{rankInfo.label}</p>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4, textAlign: "center", maxWidth: 240 }}>
            {rankInfo.description}
          </p>
        </div>
      </div>

      {/* AIから見たあなたの美容室 */}
      {summary && (
        <div data-print-section style={{ padding: "0 20px 24px" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
              AIから見たあなたの美容室
            </p>
            <p style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.7, marginBottom: 10 }}>{summary}</p>
            {target && (
              <p style={{ fontSize: 12, color: "#6b7280" }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>想定ターゲット：</span>
                {target}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Strengths / weaknesses */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div data-print-section style={{ padding: "0 20px 24px" }}>
          <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
              強みと弱みのサマリー
            </p>
            {strengths.length > 0 && (
              <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>AIが理解できていること</p>
            )}
            {strengths.map((s, i) => (
              <div key={i} style={{ background: "#f0fdf4", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#166534" }}>{s}</span>
              </div>
            ))}
            {weaknesses.length > 0 && (
              <p style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginTop: 14, marginBottom: 8 }}>AIが理解できていないこと</p>
            )}
            {weaknesses.map((w, i) => (
              <div key={i} style={{ background: "#fef2f2", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#991b1b" }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category score table */}
      <div style={{ padding: "0 20px 24px" }}>
        <div data-print-section style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
            カテゴリ別スコア
          </p>
          {categoryScores.map((c) => {
            const pct = Math.round((c.score / c.maxScore) * 100);
            return (
              <div key={c.categoryId} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>{c.score}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>/ {c.maxScore}</span>
                  </div>
                </div>
                <div style={{ height: 10, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: ACCENT, borderRadius: 999 }} />
                </div>
                <div style={{ textAlign: "right", marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div data-print-section style={{ background: "white", borderRadius: 20, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>カテゴリ</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>スコア</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>達成率</th>
              </tr>
            </thead>
            <tbody>
              {categoryScores.map((c, i) => {
                const pct = Math.round((c.score / c.maxScore) * 100);
                return (
                  <tr key={c.categoryId} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: ACCENT }}>
                      {c.score} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}>/ {c.maxScore}</span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: ACCENT }}>
                      {pct}%
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: "#1a1a1a" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "white" }}>合計</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: ACCENT }}>
                  {totalScore} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}>/ 100</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: ACCENT }}>
                  {totalScore}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ padding: "0 20px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            改善提案（{recommendations.length}件）
          </p>
          {recommendations.map((rec, i) => {
            const priority = PRIORITY_STYLES[rec.priority];
            return (
              <div key={i} data-print-section style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ padding: "16px 20px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: "white", backgroundColor: ACCENT }}>
                      {rec.category}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: priority.text, backgroundColor: priority.bg, border: `1px solid ${priority.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: priority.dot, display: "inline-block" }} />
                      {priority.label}
                    </div>
                  </div>
                  <h3 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: 13, lineHeight: 1.4, marginBottom: 8 }}>{rec.problem}</h3>
                  <p style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.6 }}>{rec.reason}</p>
                </div>
                <div style={{ margin: "0 16px 16px", background: "#F5F8FA", borderRadius: 12, padding: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>今すぐできるアクション</p>
                  <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{rec.solution}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note（静止ドキュメントのためボタンではなく文章のみ） */}
      <div style={{ padding: "0 20px 32px" }}>
        <div data-print-section style={{ background: "#1a1a1a", borderRadius: 20, padding: 24 }}>
          <p style={{ color: "white", fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
            プロと一緒にAI対策を進めませんか？
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
            診断結果をもとに、具体的な改善アクションをご提案します。無料相談は30分から。
          </p>
          <p style={{ color: ACCENT, fontSize: 12, fontWeight: 600 }}>koko-design.com/contact</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 28px", textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 10, letterSpacing: "0.1em" }}>KOKODESIGN</p>
      </div>
    </div>
  );
}
