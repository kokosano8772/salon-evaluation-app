"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FormSection from "@/components/growth-db/forms/FormSection";
import { BotConfig, BotMode, BotStatus } from "@/components/chatbot/types";

interface StoreInfo {
  id: string;
  name: string;
}

export default function ChatbotSettingsPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [bot, setBot] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [domainsText, setDomainsText] = useState("");
  const [themePrimaryColor, setThemePrimaryColor] = useState("#C4788A");
  const [themePosition, setThemePosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [themeGreeting, setThemeGreeting] = useState("");

  const load = () => {
    fetch(`/api/chatbot/admin/bots/${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        setStore(json.store ?? null);
        setBot(json.bot ?? null);
        setDomainsText((json.bot?.allowedDomains ?? []).join("\n"));
        const theme = (json.bot?.theme ?? {}) as { primaryColor?: string; position?: string; greeting?: string };
        setThemePrimaryColor(theme.primaryColor || "#C4788A");
        setThemePosition(theme.position === "bottom-left" ? "bottom-left" : "bottom-right");
        setThemeGreeting(theme.greeting ?? "");
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/chatbot/admin/bots/${storeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
  };

  const handleSave = async () => {
    if (!bot) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await patch({
        status: bot.status,
        mode: bot.mode,
        allowedDomains: domainsText.split("\n").map((d) => d.trim()).filter(Boolean),
        theme: { primaryColor: themePrimaryColor, position: themePosition, greeting: themeGreeting },
        rateLimitPerMinute: bot.rateLimitPerMinute,
        rateLimitPerDay: bot.rateLimitPerDay,
        aiMonthlyTokenLimit: bot.aiMonthlyTokenLimit,
        aiMonthlyCostLimitUsd: bot.aiMonthlyCostLimitUsd,
        draftSystemPrompt: bot.draftSystemPrompt,
      });
      setMessage("保存しました");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishPrompt = async () => {
    setPublishing(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/publish-prompt`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "公開に失敗しました");
      setMessage("プロンプトを公開しました");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "公開に失敗しました");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  if (!bot) return <div className="card-luxury p-12 text-center text-sm text-gray-400">チャットボット設定が見つかりませんでした。</div>;

  return (
    <div>
      <DashboardHeader
        title="基本設定"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: store?.name ?? "", href: `/dashboard/chatbot/${storeId}` },
          { label: "基本設定" },
        ]}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

      <div className="space-y-5">
        <FormSection title="公開設定" description="ドメイン許可・レート制限しきい値は保存すると即座に反映されます（下書き/公開の分離なし）。">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">公開状態</span>
            <select
              value={bot.status}
              onChange={(e) => setBot({ ...bot, status: e.target.value as BotStatus })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="draft">下書き（未公開）</option>
              <option value="published">公開中</option>
              <option value="archived">停止</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">モード</span>
            <select
              value={bot.mode}
              onChange={(e) => setBot({ ...bot, mode: e.target.value as BotMode })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="choice">選択式のみ</option>
              <option value="ai">AIのみ</option>
              <option value="hybrid">選択式+AI</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-xs text-gray-500 mb-1.5">
              許可ドメイン（1行に1つ。iframe埋め込みを許可するLPのドメイン）
            </span>
            <textarea
              value={domainsText}
              onChange={(e) => setDomainsText(e.target.value)}
              rows={3}
              placeholder={"example-salon.com\nrecruit.example-salon.com"}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
            />
          </label>
        </FormSection>

        <FormSection title="ウィジェットのテーマ" description="埋め込みチャット画面（別Vercelプロジェクト側）の見た目に反映されます。">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">メインカラー</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themePrimaryColor}
                onChange={(e) => setThemePrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 p-1"
              />
              <input
                type="text"
                value={themePrimaryColor}
                onChange={(e) => setThemePrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
              />
            </div>
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">表示位置（埋め込み時）</span>
            <select
              value={themePosition}
              onChange={(e) => setThemePosition(e.target.value as "bottom-right" | "bottom-left")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="bottom-right">右下</option>
              <option value="bottom-left">左下</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-xs text-gray-500 mb-1.5">挨拶文（未入力時は店舗名から自動生成）</span>
            <input
              type="text"
              value={themeGreeting}
              onChange={(e) => setThemeGreeting(e.target.value)}
              placeholder={`${store?.name ?? "当サロン"}の求人についてお気軽にご質問ください。`}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </label>
        </FormSection>

        <FormSection title="不正利用対策のしきい値" description="実際のカウント・遮断は別Vercelプロジェクト側で行います。ここは管理画面から調整する設定値です。">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">1分あたりの上限リクエスト数</span>
            <input
              type="number"
              value={bot.rateLimitPerMinute}
              onChange={(e) => setBot({ ...bot, rateLimitPerMinute: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">1日あたりの上限リクエスト数</span>
            <input
              type="number"
              value={bot.rateLimitPerDay}
              onChange={(e) => setBot({ ...bot, rateLimitPerDay: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </label>
        </FormSection>

        <FormSection title="AI利用料金の上限" description="任意。chatbot_usage_dailyの当月合計がこの値を超えると利用状況画面に警告を表示します。">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">月間トークン上限（任意）</span>
            <input
              type="number"
              value={bot.aiMonthlyTokenLimit ?? ""}
              onChange={(e) => setBot({ ...bot, aiMonthlyTokenLimit: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">月間費用上限（USD・任意）</span>
            <input
              type="number"
              step="0.01"
              value={bot.aiMonthlyCostLimitUsd ?? ""}
              onChange={(e) => setBot({ ...bot, aiMonthlyCostLimitUsd: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </label>
        </FormSection>

        <div className="card-luxury p-6">
          <div className="mb-5">
            <h3 className="text-base font-bold text-charcoal-900">AIシステムプロンプト</h3>
            <p className="text-xs text-gray-400 mt-1">
              下書きを保存しても、「公開」を押すまで実際のAI応答には反映されません。
            </p>
          </div>
          <label className="block mb-3">
            <span className="block text-xs text-gray-500 mb-1.5">下書き（編集中）</span>
            <textarea
              value={bot.draftSystemPrompt}
              onChange={(e) => setBot({ ...bot, draftSystemPrompt: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePublishPrompt}
              disabled={publishing}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
            >
              {publishing ? "公開中..." : "このプロンプトを公開する"}
            </button>
            {bot.promptPublishedAt && (
              <span className="text-xs text-gray-400">
                最終公開: {new Date(bot.promptPublishedAt).toLocaleString("ja-JP")}
              </span>
            )}
          </div>
          {bot.publishedSystemPrompt !== bot.draftSystemPrompt && (
            <p className="text-xs text-amber-600 mt-2">※下書きに未公開の変更があります。</p>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
