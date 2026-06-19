import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Salon Value Score | 美容室価値診断";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CATEGORIES = ["Product", "Customer", "Brand", "Recruit", "Org", "Future"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1a1a1a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,120,138,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,120,138,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Label */}
        <div
          style={{
            display: "flex",
            color: "#C4788A",
            fontSize: 20,
            letterSpacing: "0.35em",
            fontWeight: 600,
          }}
        >
          SALON VALUE SCORE
        </div>

        {/* Score ring + center */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "3px solid #C4788A",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ color: "#C4788A", fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
              ?
            </span>
            <span style={{ color: "#666", fontSize: 14, letterSpacing: "0.1em" }}>/ 100</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ color: "#ffffff", fontSize: 36, fontWeight: 700, letterSpacing: "0.04em" }}>
            Your Salon&apos;s True Value
          </div>
          <div style={{ color: "#888", fontSize: 18, letterSpacing: "0.08em" }}>
            Visualized in 100 Points
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", background: "#C4788A", width: 48, height: 2, borderRadius: 2 }} />

        {/* 6 categories */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: 800 }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              style={{
                display: "flex",
                color: "#888",
                fontSize: 15,
                padding: "6px 18px",
                border: "1px solid #333",
                borderRadius: 24,
                letterSpacing: "0.06em",
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
