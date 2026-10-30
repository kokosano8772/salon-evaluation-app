import Link from "next/link";
import Logo from "./Logo";

// 一般公開ページ（/、/diagnosis、/ai-check等）共通の会社情報フッター。
// 以前はプライバシー等のリンクのみが3ページに個別実装されており、
// 運営会社の情報（住所・電話番号）がどこにも記載されていなかったため、
// 共通化しつつ会社情報を追加した。
export default function CompanyFooter() {
  return (
    <footer className="px-6 py-8 border-t border-gray-200 space-y-4">
      <div className="flex justify-center">
        <Logo variant="dark" className="h-4 w-auto opacity-70" />
      </div>
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href="/privacy" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
          プライバシーポリシー
        </Link>
        <span className="text-gray-300 text-xs">|</span>
        <Link href="/terms" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
          利用規約
        </Link>
        <span className="text-gray-300 text-xs">|</span>
        <a
          href="https://koko-design.com/contact/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
        >
          お問い合わせ
        </a>
      </div>
      <div className="text-center text-xs text-gray-400 leading-relaxed">
        <p className="font-medium text-gray-500">株式会社ココデザイン</p>
        <p>〒460-0012 愛知県名古屋市中区千代田3丁目11-32 5F</p>
        <p>
          TEL. 090-1287-7557 ／{" "}
          <a
            href="https://koko-design.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors"
          >
            koko-design.com
          </a>
        </p>
      </div>
      <p className="text-gray-400 text-xs text-center">
        © {new Date().getFullYear()} Salon Value Score. All rights reserved.
      </p>
    </footer>
  );
}
