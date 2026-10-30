import type { Metadata } from "next";

// ルートレイアウト（app/layout.tsx）のmetadataは「Salon Value Score | 美容室価値診断」
// 固定で、/ai-check配下の各ページは"use client"のためページ単位でmetadataを上書き
// できない。何も指定しないとAI ChartのURLをシェアした時までルート側の「価値診断」
// ブランドのタイトル・OGP画像になってしまっていた（ユーザー報告）ため、layout単位で
// AI Check専用のmetadataを指定し、配下の全ページに適用する。
export const metadata: Metadata = {
  title: "Salon AI Check | AI対策診断",
  description: "あなたの美容室のサイトが、AI検索でおすすめされやすい状態になっているかを無料診断します。",
  openGraph: {
    title: "Salon AI Check | AI対策診断",
    description: "あなたの美容室のサイトが、AI検索でおすすめされやすい状態になっているかを無料診断します。",
    type: "website",
    siteName: "Salon AI Check",
    locale: "ja_JP",
    images: [
      {
        url: "/ai-check/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Salon AI Check | AI対策診断",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salon AI Check | AI対策診断",
    description: "あなたの美容室のサイトが、AI検索でおすすめされやすい状態になっているかを無料診断します。",
    images: ["/ai-check/opengraph-image"],
  },
};

// 既存の美容室価値診断（app/(diagnosis)/layout.tsx）と同じく、PC幅でも
// スマホサイズのまま中央表示する（この手の診断ツールはスマホでの利用が前提のため）。
export default function AiCheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-[480px] mx-auto bg-[#FAF8F3] relative shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      {children}
    </div>
  );
}
