"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ErrorLogEntry, UsageDay } from "@/components/chatbot/types";

interface Totals {
  chatMessageCount: number;
  aiResponseCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  applicationSuccessCount: number;
  applicationFailureCount: number;
  widgetLoadCount: number;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function ChatbotUsagePage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [month, setMonth] = useState(currentMonth());
  const [days, setDays] = useState<UsageDay[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [tokenLimit, setTokenLimit] = useState<number | null>(null);
  const [costLimit, setCostLimit] = useState<number | null>(null);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/chatbot/admin/usage/${storeId}?month=${month}`).then((r) => r.json()),
      fetch(`/api/chatbot/admin/errors/${storeId}`).then((r) => r.json()),
    ])
      .then(([usageRes, errorsRes]) => {
        setDays(usageRes.days ?? []);
        setTotals(usageRes.totals ?? null);
        setTokenLimit(usageRes.aiMonthlyTokenLimit ?? null);
        setCostLimit(usageRes.aiMonthlyCostLimitUsd ?? null);
        setErrors(errorsRes.errors ?? []);
      })
      .finally(() => setLoading(false));
  }, [storeId, month]);

  const tokenTotal = totals ? totals.inputTokens + totals.outputTokens : 0;
  const tokenOverLimit = tokenLimit !== null && tokenTotal > tokenLimit;
  const costOverLimit = costLimit !== null && (totals?.estimatedCostUsd ?? 0) > costLimit;

  return (
    <div>
      <DashboardHeader
        title="利用状況"
        description="個人情報を含まない匿名集計のみを表示します（会話内容・応募内容は保存していません）。"
        actions={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        }
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "利用状況" },
        ]}
      />

      {loading ? (
        <div className="card-luxury p-12 h-48 animate-pulse bg-gray-50" />
      ) : (
        <>
          {(tokenOverLimit || costOverLimit) && (
            <div className="card-luxury p-4 mb-6 bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700 font-medium">今月の利用が設定した上限を超えています。</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">チャット件数</p>
              <p className="text-xl font-bold text-charcoal-900">{totals?.chatMessageCount ?? 0}</p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">AI応答回数</p>
              <p className="text-xl font-bold text-charcoal-900">{totals?.aiResponseCount ?? 0}</p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">トークン使用量{tokenLimit !== null && ` / 上限${tokenLimit}`}</p>
              <p className={`text-xl font-bold ${tokenOverLimit ? "text-red-500" : "text-charcoal-900"}`}>{tokenTotal}</p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">概算費用(USD){costLimit !== null && ` / 上限${costLimit}`}</p>
              <p className={`text-xl font-bold ${costOverLimit ? "text-red-500" : "text-charcoal-900"}`}>
                ${(totals?.estimatedCostUsd ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">応募送信成功</p>
              <p className="text-xl font-bold text-charcoal-900">{totals?.applicationSuccessCount ?? 0}</p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">応募送信失敗</p>
              <p className="text-xl font-bold text-red-500">{totals?.applicationFailureCount ?? 0}</p>
            </div>
            <div className="card-luxury p-4">
              <p className="text-xs text-gray-400">ウィジェット表示回数</p>
              <p className="text-xl font-bold text-charcoal-900">{totals?.widgetLoadCount ?? 0}</p>
            </div>
          </div>

          <div className="card-luxury overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left p-3">日付</th>
                  <th className="text-right p-3">チャット</th>
                  <th className="text-right p-3">AI応答</th>
                  <th className="text-right p-3">トークン</th>
                  <th className="text-right p-3">費用(USD)</th>
                  <th className="text-right p-3">応募成功</th>
                  <th className="text-right p-3">応募失敗</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className="border-b border-gray-50">
                    <td className="p-3">{d.date}</td>
                    <td className="p-3 text-right">{d.chatMessageCount}</td>
                    <td className="p-3 text-right">{d.aiResponseCount}</td>
                    <td className="p-3 text-right">{d.inputTokens + d.outputTokens}</td>
                    <td className="p-3 text-right">${d.estimatedCostUsd.toFixed(2)}</td>
                    <td className="p-3 text-right">{d.applicationSuccessCount}</td>
                    <td className="p-3 text-right">{d.applicationFailureCount}</td>
                  </tr>
                ))}
                {days.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-xs text-gray-400">
                      この月のデータはありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-bold text-charcoal-900 mb-3">直近のエラーログ</h3>
          <div className="card-luxury divide-y divide-gray-100">
            {errors.length === 0 && <p className="p-5 text-sm text-gray-400">エラーはありません。</p>}
            {errors.map((e) => (
              <div key={e.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-charcoal-700">
                    [{e.errorSource}] {e.errorCode}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(e.createdAt).toLocaleString("ja-JP")}</span>
                </div>
                {e.message && <p className="text-xs text-gray-500 mt-1">{e.message}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
