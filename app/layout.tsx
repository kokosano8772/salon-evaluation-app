import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://salon-value-score.vercel.app";

export const metadata: Metadata = {
  title: "Salon Value Score | 美容室価値診断",
  description:
    "売上だけではわからない「選ばれ続ける力」を100点満点で可視化。美容室オーナーのための経営診断ツール。",
  keywords: "美容室, サロン, 経営診断, スコアリング, ブランド力, 採用力",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Salon Value Score | 美容室価値診断",
    description:
      "売上だけではわからない「選ばれ続ける力」を100点満点で可視化。あなたのサロンの本当の価値を診断します。",
    type: "website",
    url: siteUrl,
    siteName: "Salon Value Score",
    locale: "ja_JP",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Salon Value Score | 美容室価値診断",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salon Value Score | 美容室価値診断",
    description: "売上だけではわからない「選ばれ続ける力」を100点満点で可視化。",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#E2DDD8]">
        <div className="min-h-screen max-w-[480px] mx-auto bg-[#FAF8F3] relative shadow-[0_0_60px_rgba(0,0,0,0.12)]">
          {children}
        </div>

        {/* Desktop floating CTAs — only shown when sidebar space exists (≥640px) */}
        <div className="hidden sm:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
          {/* LINE */}
          <a
            href="https://page.line.me/470bhtcb?oat_content=url&openQrModal=true"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 bg-[#06C755] text-white rounded-2xl px-4 py-5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 10.5C22 6.36 17.52 3 12 3S2 6.36 2 10.5c0 3.64 3.23 6.7 7.59 7.28.3.07.7.2.8.47.09.24.06.61.03.85l-.13.77c-.04.24-.18.93.82.51 1-.42 5.38-3.17 7.35-5.43 1.35-1.49 2.54-3.28 2.54-6.45z"
                fill="white"
              />
            </svg>
            <span
              className="text-[12px] font-bold tracking-wider leading-tight"
              style={{ writingMode: "vertical-rl" }}
            >
              LINE相談
            </span>
          </a>

          {/* 無料相談 */}
          <a
            href="https://koko-design.com/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 text-white rounded-2xl px-4 py-5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            style={{ background: "linear-gradient(160deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span
              className="text-[12px] font-bold tracking-wider leading-tight"
              style={{ writingMode: "vertical-rl" }}
            >
              無料相談
            </span>
          </a>
        </div>
      </body>
    </html>
  );
}
