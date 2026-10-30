import type { Metadata } from "next";
import DashboardNav, { DashboardMobileNav } from "@/components/dashboard/DashboardNav";

// ルートレイアウト（app/layout.tsx）のmetadataは「Salon Value Score | 美容室価値診断」
// 固定で、/dashboard配下にも専用のmetadataが無かったため、タブタイトルが診断ツール名の
// ままになっていた（AIチェック側の修正と同じ経緯）。ログイン画面を含め配下全体に適用する。
// openGraph/twitterはオブジェクト単位で親を上書きする（フィールド単位のマージではない）
// ため、imagesを指定しないとルート側の画像設定ごと失われる。成長DB専用の画像は作らず
// ルートと同じ画像（/opengraph-image）を明示的に指定して引き継ぐ。
export const metadata: Metadata = {
  title: "成長データベース | Salon Value Score",
  description: "店舗ごとの月次データを蓄積し、独自診断スコアで継続的に成長を可視化する管理ツール。",
  openGraph: {
    title: "成長データベース | Salon Value Score",
    description: "店舗ごとの月次データを蓄積し、独自診断スコアで継続的に成長を可視化する管理ツール。",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Salon Value Score" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "成長データベース | Salon Value Score",
    description: "店舗ごとの月次データを蓄積し、独自診断スコアで継続的に成長を可視化する管理ツール。",
    images: ["/opengraph-image"],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <DashboardNav />
      {/* DashboardNavはmd以上でposition:fixedのため通常のflowから外れる。
          同じ幅（w-64=16rem）だけ左マージンを空けて本文と重ならないようにする。 */}
      <div className="flex-1 min-w-0 md:ml-64">
        <DashboardMobileNav />
        <main className="max-w-7xl mx-auto px-5 md:pl-10 md:pr-28 py-8">{children}</main>
      </div>
    </div>
  );
}
