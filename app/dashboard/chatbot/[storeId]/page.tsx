"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Settings, Mail, BookOpen, GitBranch, BarChart3, Copy, Check } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { BotConfig } from "@/components/chatbot/types";

// ウィジェット側（salon-chatbot-widget、別Vercelプロジェクト）の本番ドメイン。
// このプロジェクト（成長DB）からは普段アクセスしないため他のenvと違いここでしか
// 使わないが、ドメインが変わった時にコード修正無しで追従できるよう環境変数にする。
const WIDGET_BASE_URL = process.env.NEXT_PUBLIC_CHATBOT_WIDGET_URL;

interface StoreInfo {
  id: string;
  name: string;
}

const LINKS = [
  { href: "settings", label: "基本設定", icon: Settings, description: "公開状態・モード・ドメイン許可・レート制限・AIプロンプト" },
  { href: "notifications", label: "通知先メール", icon: Mail, description: "応募内容を直送するサロン担当者のメールアドレス" },
  { href: "knowledge", label: "求人情報・FAQ", icon: BookOpen, description: "HPから取り込み、または手入力でAIの回答内容を登録・公開" },
  { href: "flow", label: "選択式フロー", icon: GitBranch, description: "選択式チャットの質問分岐の編集・公開" },
  { href: "usage", label: "利用状況", icon: BarChart3, description: "利用件数・AIトークン使用量・エラーログ" },
];

export default function ChatbotStoreDashboardPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [bot, setBot] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/chatbot/admin/bots/${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        setStore(json.store ?? null);
        setBot(json.bot ?? null);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  if (!bot) return <div className="card-luxury p-12 text-center text-sm text-gray-400">チャットボット設定が見つかりませんでした。</div>;

  // テーマ色・表示位置は基本設定で編集した値をそのまま埋め込みコードに反映する
  // （embed.js側もdata-color/data-positionを読んで表示に使う。設定し忘れている
  // 場合のデフォルトはembed.js・ChatWidgetどちらも#C4788A/bottom-rightで揃えてある）。
  const theme = (bot.theme ?? {}) as { primaryColor?: string; position?: string };
  const themeColor = theme.primaryColor || "#C4788A";
  const themePosition = theme.position === "bottom-left" ? "bottom-left" : "bottom-right";
  const embedSnippet = WIDGET_BASE_URL
    ? `<script src="${WIDGET_BASE_URL.replace(/\/$/, "")}/embed.js" data-bot="${bot.publicBotId}" data-position="${themePosition}" data-color="${themeColor}"></script>`
    : null;

  const handleCopy = async () => {
    if (!embedSnippet) return;
    await navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <DashboardHeader
        title={store?.name ?? ""}
        description="求人チャットボットの設定メニュー"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: store?.name ?? "" },
        ]}
      />

      <div className="card-luxury p-5 mb-6">
        <p className="text-xs text-gray-400 mb-1">公開ID（別Vercelプロジェクトへの埋め込みで使用）</p>
        <code className="text-sm font-mono text-charcoal-900">{bot.publicBotId}</code>
        <p className="text-xs text-gray-400 mt-3">
          公開状態：
          <span className="font-medium text-charcoal-700 ml-1">
            {bot.status === "draft" ? "下書き（未公開）" : bot.status === "published" ? "公開中" : "停止"}
          </span>
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5">埋め込みコード（サロンのLP/HPに貼り付ける）</p>
          {embedSnippet ? (
            <div className="flex items-start gap-2">
              <code className="flex-1 block text-xs font-mono text-charcoal-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                {embedSnippet}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-charcoal-700 hover:bg-gray-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "コピー済み" : "コピー"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-600">
              環境変数 NEXT_PUBLIC_CHATBOT_WIDGET_URL が未設定のため表示できません（Vercelでウィジェット側の本番ドメインを設定してください）。
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={`/dashboard/chatbot/${storeId}/${link.href}`}
            className="card-luxury p-5 hover:shadow-md transition-shadow flex items-start gap-3"
          >
            <link.icon size={20} className="text-[#C4788A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-charcoal-900 text-sm">{link.label}</p>
              <p className="text-xs text-gray-400 mt-1">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
