import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | Salon Value Score",
};

const LAST_UPDATED = "2024年12月";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">ホーム</span>
        </Link>
        <h1 className="text-sm font-semibold text-charcoal-900 flex-1 text-center pr-12">
          利用規約
        </h1>
      </div>

      <main className="px-5 py-8 space-y-8 pb-16">
        <p className="text-xs text-gray-400">最終更新：{LAST_UPDATED}</p>

        <p className="text-sm text-gray-600 leading-relaxed">
          本利用規約（以下「本規約」）は、koko design（以下「当社」）が提供する
          Salon Value Score（以下「本サービス」）の利用条件を定めるものです。
          本サービスをご利用いただく場合、本規約に同意したものとみなします。
        </p>

        <Section title="第1条（サービスの概要）">
          <p>
            本サービスは、美容室オーナーが自サロンの経営状況を診断し、
            スコアリングおよび改善提案を受けることができるWebアプリケーションです。
            診断結果はあくまで参考情報であり、経営上の意思決定を保証するものではありません。
          </p>
        </Section>

        <Section title="第2条（利用資格）">
          <p>本サービスは、以下の条件を満たす方がご利用いただけます。</p>
          <ul>
            <li>本規約に同意いただける方</li>
            <li>美容室の経営・運営に関わる方（オーナー・スタッフ等）</li>
            <li>日本国内で合法的に事業を営んでいる方</li>
          </ul>
        </Section>

        <Section title="第3条（禁止事項）">
          <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
          <ul>
            <li>虚偽の情報を入力する行為</li>
            <li>本サービスのシステムに不正にアクセスする行為</li>
            <li>本サービスを商業目的で無断複製・再配布する行為</li>
            <li>他のユーザーや第三者に迷惑をかける行為</li>
            <li>法令または公序良俗に違反する行為</li>
            <li>当社または第三者の知的財産権を侵害する行為</li>
          </ul>
        </Section>

        <Section title="第4条（知的財産権）">
          <p>
            本サービスに含まれるコンテンツ（テキスト・デザイン・ロジック等）に関する
            著作権その他の知的財産権は、当社または正当な権利者に帰属します。
            ユーザーは、当社の事前承諾なく、これらを複製・転用・販売することはできません。
          </p>
        </Section>

        <Section title="第5条（免責事項）">
          <p>
            当社は、本サービスの診断結果・改善提案について、その正確性・完全性・有用性を保証しません。
            診断結果を利用したことによって生じた損害について、当社は一切の責任を負いません。
          </p>
          <p>
            また、システム障害・メンテナンス等によるサービスの中断・停止について、
            当社はその責任を負いかねます。
          </p>
        </Section>

        <Section title="第6条（サービスの変更・終了）">
          <p>
            当社は、ユーザーへの事前通知なく、本サービスの内容を変更または提供を終了することがあります。
            これによりユーザーに損害が生じた場合でも、当社は責任を負いません。
          </p>
        </Section>

        <Section title="第7条（規約の変更）">
          <p>
            当社は、必要に応じて本規約を変更することがあります。
            変更後の規約は本ページに掲載した時点で効力を生じます。
            変更後も継続して本サービスをご利用いただいた場合、変更後の規約に同意したものとみなします。
          </p>
        </Section>

        <Section title="第8条（準拠法・管轄裁判所）">
          <p>
            本規約は日本法に準拠し、本サービスに関する紛争については、
            当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </Section>

        <Section title="第9条（お問い合わせ）">
          <p>本規約に関するお問い合わせは、下記よりご連絡ください。</p>
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
