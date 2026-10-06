import { DiagnosisResult } from "@/lib/types";
import { RANK_INFO, CATEGORIES } from "@/lib/scoring";
import { generateImprovements } from "@/lib/recommendations";
import CategoryIcon from "@/components/ui/CategoryIcon";
import dynamic from "next/dynamic";

const SalonRadarChart = dynamic(() => import("@/components/result/SalonRadarChart"), {
  ssr: false,
});

const PRIORITY_STYLES = {
  high: { label: "優先度：高", bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#f87171" },
  medium: { label: "優先度：中", bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#fbbf24" },
  low: { label: "優先度：低", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#4ade80" },
};

interface DiagnosisPrintDocumentProps {
  result: DiagnosisResult;
  salonName?: string;
}

// PDF保存専用の静止レイアウト。/result の画面はタブ切り替え式のため、表示中の
// タブしかDOMに存在せず、そのままスクリーンショットしても1タブ分しか写せない。
// またframer-motionのアニメーションやCTAボタン・下部固定バーの余白も静止画には
// 不要なため、この専用コンポーネントでは一切アニメーションを使わず、全セクションを
// 1枚の縦に流れるドキュメントとして常に完成形で描画する。
export default function DiagnosisPrintDocument({ result, salonName }: DiagnosisPrintDocumentProps) {
  const rankInfo = RANK_INFO[result.rank];
  const improvements = generateImprovements(result.categoryScores);
  const strengths = [...result.categoryScores].sort((a, b) => b.percentage - a.percentage).slice(0, 2);
  const weaknesses = [...result.categoryScores].sort((a, b) => a.percentage - b.percentage).slice(0, 2);
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - result.totalScore / 100);

  return (
    <div style={{ width: 480, backgroundColor: "#FAF8F3", fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Header */}
      <div data-print-section style={{ padding: "28px 32px 20px", textAlign: "center" }}>
        <p style={{ color: "#C4788A", fontSize: 11, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
          Salon Value Score
        </p>
        {salonName && (
          <p style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{salonName}</p>
        )}
        <p style={{ color: "#6b7280", fontSize: 11 }}>
          {new Date(result.completedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Score Hero */}
      <div data-print-section style={{ padding: "0 32px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 192, height: 192 }}>
          <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f0ede6" strokeWidth={6} />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="#C4788A" strokeWidth={6}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: "#C4788A", lineHeight: 1 }}>{result.totalScore}</span>
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
            {result.rank}
          </div>
          <p style={{ marginTop: 8, fontWeight: 600, color: "#1a1a1a", fontSize: 16 }}>{rankInfo.label}</p>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4, textAlign: "center", maxWidth: 240 }}>
            {rankInfo.description}
          </p>
        </div>
      </div>

      {/* Radar chart */}
      <div data-print-section style={{ padding: "0 20px 24px" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            レーダーチャート
          </p>
          <SalonRadarChart categoryScores={result.categoryScores} animate={false} />
        </div>
      </div>

      {/* Strengths / weaknesses */}
      <div data-print-section style={{ padding: "0 20px 24px" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>
            強みと弱みのサマリー
          </p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>強み（上位）</p>
          {strengths.map((cs) => (
            <div key={cs.categoryId} style={{ display: "flex", justifyContent: "space-between", background: "#f0fdf4", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>{cs.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: cs.color }}>{cs.percentage}%</span>
            </div>
          ))}
          <p style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginTop: 14, marginBottom: 8 }}>重点改善エリア（下位）</p>
          {weaknesses.map((cs) => (
            <div key={cs.categoryId} style={{ display: "flex", justifyContent: "space-between", background: "#fef2f2", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 500 }}>{cs.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: cs.color }}>{cs.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category score table */}
      <div style={{ padding: "0 20px 24px" }}>
        <div data-print-section style={{ background: "white", borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
            カテゴリ別スコア
          </p>
          {result.categoryScores.map((cs) => {
            const category = CATEGORIES.find((c) => c.id === cs.categoryId);
            return (
              <div key={cs.categoryId} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {category && (
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: `${cs.color}18` }}>
                        <CategoryIcon icon={category.icon} size={14} color={cs.color} strokeWidth={1.8} />
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{cs.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cs.color }}>{cs.score}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>/ {cs.maxScore}</span>
                  </div>
                </div>
                <div style={{ height: 10, backgroundColor: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${cs.percentage}%`, backgroundColor: cs.color, borderRadius: 999 }} />
                </div>
                <div style={{ textAlign: "right", marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{cs.percentage}%</span>
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
              {result.categoryScores.map((cs, i) => (
                <tr key={cs.categoryId} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{cs.name}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: cs.color }}>
                    {cs.score} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}>/ {cs.maxScore}</span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: cs.color }}>
                    {cs.percentage}%
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#1a1a1a" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "white" }}>合計</td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#C4788A" }}>
                  {result.totalScore} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}>/ 100</span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#C4788A" }}>
                  {result.totalScore}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvements */}
      <div style={{ padding: "0 20px 32px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
          改善提案（{improvements.length}件）
        </p>
        {improvements.map((imp, i) => {
          const priority = PRIORITY_STYLES[imp.priority];
          const category = CATEGORIES.find((c) => c.id === imp.categoryId);
          const color = category?.color ?? "#999";
          return (
            <div key={i} data-print-section style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "16px 20px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: "white", backgroundColor: color }}>
                    {category && <CategoryIcon icon={category.icon} size={11} color="white" strokeWidth={2} />}
                    <span>{category?.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500, color: priority.text, backgroundColor: priority.bg, border: `1px solid ${priority.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: priority.dot, display: "inline-block" }} />
                    {priority.label}
                  </div>
                </div>
                <h3 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: 13, lineHeight: 1.4, marginBottom: 8 }}>{imp.title}</h3>
                <p style={{ color: "#4b5563", fontSize: 12, lineHeight: 1.6 }}>{imp.description}</p>
              </div>
              <div style={{ margin: "0 16px 16px", background: "#FAF8F3", borderRadius: 12, padding: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>今すぐできるアクション</p>
                <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.6 }}>{imp.action}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note (静止ドキュメントのため、ボタンではなく文章のみ) */}
      <div style={{ padding: "0 20px 32px" }}>
        <div data-print-section style={{ background: "#1a1a1a", borderRadius: 20, padding: 24 }}>
          <p style={{ color: "white", fontSize: 15, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
            プロと一緒に改善を加速させませんか？
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
            診断結果をもとに、経営コンサルタントが具体的なアクションプランをご提案します。無料相談は30分から。
          </p>
          <p style={{ color: "#C4788A", fontSize: 12, fontWeight: 600 }}>koko-design.com/contact</p>
        </div>
      </div>

      <div style={{ padding: "0 20px 28px", textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 10, letterSpacing: "0.1em" }}>KOKODESIGN</p>
      </div>
    </div>
  );
}
