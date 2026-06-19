import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Salon Value Score",
};

const LAST_UPDATED = "2024年12月";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">ホーム</span>
        </Link>
        <h1 className="text-sm font-semibold text-charcoal-900 flex-1 text-center pr-12">
          プライバシーポリシー
        </h1>
      </div>

      <main className="px-5 py-8 space-y-8 pb-16">
        <p className="text-xs text-gray-400">最終更新：{LAST_UPDATED}</p>

        <Section title="1. 基本方針">
          <p>
            koko design（以下「当社」）は、Salon Value Score（以下「本サービス」）において、ユーザーのプライバシーを尊重し、
            個人情報の保護に努めます。本ポリシーは、本サービスにおける情報の取り扱いについて説明するものです。
          </p>
        </Section>

        <Section title="2. 収集する情報">
          <p>本サービスでは、以下の情報を収集することがあります。</p>
          <ul>
            <li>診断フォームへの入力内容（美容室の経営状況に関する回答）</li>
            <li>アクセスログ（IPアドレス、ブラウザ種別、閲覧ページ等）</li>
            <li>Cookie および類似技術により取得される情報</li>
          </ul>
          <p className="mt-3 text-gray-500 text-xs">
            ※ 診断データはお客様のブラウザ（localStorage）内にのみ保存されます。
            当社サーバーへの送信は行っておりません。
          </p>
        </Section>

        <Section title="3. 情報の利用目的">
          <p>収集した情報は、以下の目的で利用します。</p>
          <ul>
            <li>診断スコアの計算・表示</li>
            <li>サービスの品質向上・機能改善</li>
            <li>アクセス解析（Google Analytics等）</li>
            <li>お問い合わせへの対応</li>
          </ul>
        </Section>

        <Section title="4. 第三者への提供">
          <p>
            当社は、以下の場合を除き、収集した情報を第三者に提供しません。
          </p>
          <ul>
            <li>法令に基づく場合</li>
            <li>人の生命・身体・財産の保護のために必要な場合</li>
            <li>公衆衛生の向上・児童の健全育成のために必要な場合</li>
          </ul>
        </Section>

        <Section title="5. アクセス解析ツールについて">
          <p>
            本サービスでは、Googleによるアクセス解析ツール「Google Analytics」を使用することがあります。
            Google Analyticsは、Cookieを使用してデータを収集します。
            このデータは匿名で収集されており、個人を特定するものではありません。
          </p>
          <p className="mt-2">
            Google Analytics の利用規約については
            <a
              href="https://marketingplatform.google.com/about/analytics/terms/jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C4788A] underline ml-1"
            >
              こちら
            </a>
            をご確認ください。
          </p>
        </Section>

        <Section title="6. Cookieの管理">
          <p>
            ブラウザの設定によりCookieを無効にすることができますが、
            その場合、本サービスの一部機能が正常に動作しない場合があります。
          </p>
        </Section>

        <Section title="7. プライバシーポリシーの変更">
          <p>
            当社は、必要に応じて本ポリシーを変更することがあります。
            変更後のポリシーは本ページに掲載した時点で効力を生じるものとします。
          </p>
        </Section>

        <Section title="8. お問い合わせ">
          <p>本ポリシーに関するお問い合わせは、下記よりご連絡ください。</p>
          <p className="mt-2">
            <a
              href="https://koko-design.com/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C4788A] underline"
            >
              お問い合わせフォーム
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-charcoal-900 border-l-2 border-[#C4788A] pl-3">
        {title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 pl-1">
        {children}
      </div>
    </section>
  );
}
