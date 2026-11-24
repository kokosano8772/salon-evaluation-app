"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Trash2, Plus, UploadCloud, RefreshCw, Check, X, Download, MessageCircleQuestion, AlertTriangle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  ITEM_TYPE_LABEL,
  KnowledgeItem,
  KnowledgeItemType,
  KnowledgeSource,
  SOURCE_STATUS_LABEL,
  SOURCE_TYPE_LABEL,
  UnansweredQuestion,
} from "@/components/chatbot/types";

const EMPTY_FORM = { itemType: "faq" as KnowledgeItemType, category: "", title: "", body: "" };

interface NamedUrl {
  id: string;
  name: string;
  url: string;
}

const STATUS_STYLE: Record<KnowledgeSource["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  fetched: "bg-blue-50 text-blue-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-50 text-red-500",
  stale: "bg-amber-50 text-amber-600",
};

const PRIMARY_BTN_CLASS =
  "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-50";
const PRIMARY_BTN_STYLE = { background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" };

type Tab = "sources" | "manual" | "unanswered";
const TAB_LABEL: Record<Tab, string> = {
  sources: "HPから取り込む",
  manual: "手動で追加する",
  unanswered: "未回答の質問",
};

export default function ChatbotKnowledgePage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [tab, setTab] = useState<Tab>("sources");

  // --- HPから取り込む（求人情報の主な入力経路） ---
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [recruitmentLpUrls, setRecruitmentLpUrls] = useState<NamedUrl[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourceError, setSourceError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [selectedLpUrl, setSelectedLpUrl] = useState("");
  // 取得内容の編集中ドラフト。source.idごとに持ち、未編集なら保存済みの内容をそのまま表示する。
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // --- 手動で追加する（HPに載っていない情報向け） ---
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemError, setItemError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Record<string, { title: string; body: string; category: string }>>({});

  // --- 未回答の質問（AIが「情報がございません」と答えたもの） ---
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([]);
  const [unansweredLoading, setUnansweredLoading] = useState(true);
  const [unansweredBusyId, setUnansweredBusyId] = useState<string | null>(null);

  const loadSources = () => {
    Promise.all([
      fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources`).then((r) => r.json()),
      fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/recruitment-lp-urls`).then((r) => r.json()),
    ])
      .then(([sourcesRes, lpRes]) => {
        setSources(sourcesRes.sources ?? []);
        setRecruitmentLpUrls(lpRes.urls ?? []);
      })
      .finally(() => setSourcesLoading(false));
  };

  const loadItems = () => {
    fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items`)
      .then((r) => r.json())
      .then((json) => setItems(json.items ?? []))
      .finally(() => setItemsLoading(false));
  };

  const loadUnanswered = () => {
    fetch(`/api/chatbot/admin/bots/${storeId}/unanswered-questions`)
      .then((r) => r.json())
      .then((json) => setUnanswered(json.questions ?? []))
      .finally(() => setUnansweredLoading(false));
  };

  useEffect(() => {
    loadSources();
    loadItems();
    loadUnanswered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openCount = unanswered.filter((q) => q.status === "open").length;

  const handleAddUnansweredToFaq = (q: UnansweredQuestion) => {
    setForm({ itemType: "faq", category: q.category, title: q.summary, body: "" });
    setTab("manual");
    setUnansweredBusyId(q.id);
    fetch(`/api/chatbot/admin/bots/${storeId}/unanswered-questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "added_to_faq" }),
    })
      .then(loadUnanswered)
      .finally(() => setUnansweredBusyId(null));
  };

  const handleDismissUnanswered = (id: string) => {
    setUnansweredBusyId(id);
    fetch(`/api/chatbot/admin/bots/${storeId}/unanswered-questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    })
      .then(loadUnanswered)
      .finally(() => setUnansweredBusyId(null));
  };

  const addSource = async (sourceType: "recruitment_lp" | "manual_url", url: string) => {
    if (!url.trim()) return;
    setSourceError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "追加に失敗しました");
      setManualUrl("");
      setSelectedLpUrl("");
      loadSources();
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleSync = async (id: string) => {
    setBusyId(id);
    setSourceError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadSources();
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveContent = async (id: string) => {
    const draft = drafts[id];
    if (draft === undefined) return;
    setSavingId(id);
    setSourceError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadSources();
    } catch (err) {
      setSourceError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSavingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}/approve`, { method: "POST" });
    setBusyId(null);
    loadSources();
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    setBusyId(null);
    loadSources();
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("この取得元を削除しますか？")) return;
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, { method: "DELETE" });
    loadSources();
  };

  const handleCreateItem = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    setItemError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "追加に失敗しました");
      setForm(EMPTY_FORM);
      loadItems();
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const draftOf = (item: KnowledgeItem) => editing[item.id] ?? { title: item.title, body: item.body, category: item.category };

  const handleSaveItemDraft = async (item: KnowledgeItem) => {
    const d = draftOf(item);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    loadItems();
  };

  const handlePublishItem = async (item: KnowledgeItem) => {
    await handleSaveItemDraft(item);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}/publish`, { method: "POST" });
    loadItems();
  };

  const handleUnpublishItem = async (item: KnowledgeItem) => {
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: false }),
    });
    loadItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("この項目を削除しますか？")) return;
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${id}`, { method: "DELETE" });
    loadItems();
  };

  return (
    <div>
      <DashboardHeader
        title="求人情報・FAQ"
        description="ここに登録・承認された内容だけが、チャットボットの回答に使われます。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "求人情報・FAQ" },
        ]}
      />

      <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
        {(Object.keys(TAB_LABEL) as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === key ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
            }`}
          >
            {TAB_LABEL[key]}
            {key === "unanswered" && openCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                {openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============ 1. HPから取り込む（主な入力経路） ============ */}
      <section className={tab === "sources" ? "" : "hidden"}>
        <p className="text-xs text-gray-400 mb-4">サロンのHPや求人LPのURLを登録すると、内容を取得してAIが読みやすく整理します。確認・承認した分だけ使われます。</p>

        {sourceError && <p className="text-red-500 text-sm mb-3">{sourceError}</p>}

        <div className="card-luxury p-5 mb-4 space-y-4">
          {recruitmentLpUrls.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">成長DBに登録済みの求人LP URLから取り込み</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedLpUrl}
                    onChange={(e) => setSelectedLpUrl(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                  >
                    <option value="">選択してください...</option>
                    {recruitmentLpUrls.map((u) => (
                      <option key={u.id} value={u.url}>
                        {u.name ? `${u.name}: ${u.url}` : u.url}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={() => addSource("recruitment_lp", selectedLpUrl)}
                  disabled={!selectedLpUrl}
                  className={PRIMARY_BTN_CLASS}
                  style={PRIMARY_BTN_STYLE}
                >
                  取り込み
                </button>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">他のURLを追加（HP・採用ページなど）</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <button
                onClick={() => addSource("manual_url", manualUrl)}
                disabled={!manualUrl.trim()}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        {sourcesLoading ? (
          <div className="card-luxury p-12 h-32 animate-pulse bg-gray-50" />
        ) : (
          <div className="space-y-4">
            {sources.length === 0 && <p className="text-sm text-gray-400">まだURLが登録されていません。</p>}
            {sources.map((source) => {
              const draftValue = drafts[source.id] ?? source.fetchedContent ?? "";
              const isDirty = drafts[source.id] !== undefined && drafts[source.id] !== source.fetchedContent;
              const hasContent = source.fetchedContent.trim() !== "";
              const needsApproval = !isDirty && hasContent && source.fetchedContent !== source.approvedContent;
              const canFetch = source.sourceType !== "manual_text";

              return (
                <div key={source.id} className="card-luxury p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mr-2">
                        {SOURCE_TYPE_LABEL[source.sourceType]}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[source.status]}`}>
                        {SOURCE_STATUS_LABEL[source.status]}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteSource(source.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {source.url && <p className="text-xs text-gray-500 mb-3 break-all">{source.url}</p>}

                  {source.fetchWarning && (
                    <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-amber-50 text-amber-700 text-xs">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>{source.fetchWarning}</p>
                    </div>
                  )}

                  {!hasContent && canFetch ? (
                    <div className="flex flex-col items-center justify-center py-7 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 mb-3">まだ内容を取り込んでいません</p>
                      <button onClick={() => handleSync(source.id)} disabled={busyId === source.id} className={PRIMARY_BTN_CLASS} style={PRIMARY_BTN_STYLE}>
                        <Download size={16} />
                        {busyId === source.id ? "取り込み中..." : "HPから取り込む"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-medium text-gray-500">内容</p>
                          {canFetch && (
                            <button
                              onClick={() => handleSync(source.id)}
                              disabled={busyId === source.id}
                              title="HP側の最新の内容を取り直します"
                              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-charcoal-600 disabled:opacity-50"
                            >
                              <RefreshCw size={12} />
                              {busyId === source.id ? "更新中..." : "内容を更新"}
                            </button>
                          )}
                        </div>
                        <textarea
                          value={draftValue}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [source.id]: e.target.value }))}
                          placeholder="ここに直接入力できます。"
                          rows={6}
                          className="w-full text-xs text-charcoal-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap focus:outline-none focus:ring-1 focus:ring-[#C4788A]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {isDirty ? (
                          <button onClick={() => handleSaveContent(source.id)} disabled={savingId === source.id} className={PRIMARY_BTN_CLASS} style={PRIMARY_BTN_STYLE}>
                            {savingId === source.id ? "保存中..." : "保存する"}
                          </button>
                        ) : needsApproval ? (
                          <>
                            <button
                              onClick={() => handleApprove(source.id)}
                              disabled={busyId === source.id}
                              title="この内容をチャットボットの回答に使えるようにします"
                              className={PRIMARY_BTN_CLASS}
                              style={PRIMARY_BTN_STYLE}
                            >
                              <Check size={16} />
                              承認する
                            </button>
                            <button
                              onClick={() => handleReject(source.id)}
                              disabled={busyId === source.id}
                              title="この内容は使わない"
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50"
                            >
                              <X size={14} />
                              却下
                            </button>
                          </>
                        ) : source.status === "approved" ? (
                          <p className="text-xs text-green-600 inline-flex items-center gap-1">
                            <Check size={12} />
                            承認済み・チャットボットで使用中
                          </p>
                        ) : source.status === "rejected" ? (
                          <p className="text-xs text-gray-400">却下済み（チャットボットには使われません）</p>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ 2. 手動で追加する（HPに載っていない情報向け） ============ */}
      <section className={tab === "manual" ? "" : "hidden"}>
        <p className="text-xs text-gray-400 mb-4">見学会の様子など、HPに載っていない情報はここから直接入力してください。</p>

        {itemError && <p className="text-red-500 text-sm mb-3">{itemError}</p>}

        <div className="card-luxury p-5 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={form.itemType}
                onChange={(e) => setForm({ ...form, itemType: e.target.value as KnowledgeItemType })}
                className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white"
              >
                {Object.entries(ITEM_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <input
              type="text"
              placeholder="カテゴリ（任意）"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <input
              type="text"
              placeholder="タイトル（例: 見学会について）"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm sm:col-span-2"
            />
            <textarea
              placeholder="本文"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm sm:col-span-2"
            />
          </div>
          <button
            onClick={handleCreateItem}
            disabled={creating || !form.title.trim()}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
          >
            <Plus size={16} />
            追加
          </button>
        </div>

        {itemsLoading ? (
          <div className="card-luxury p-12 h-48 animate-pulse bg-gray-50" />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const d = draftOf(item);
              const hasUnpublishedChanges = item.isPublished && (d.title !== item.title || d.body !== item.body);
              return (
                <div key={item.id} className="card-luxury p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ITEM_TYPE_LABEL[item.itemType]}</span>
                    <div className="flex items-center gap-2">
                      {item.isPublished ? (
                        <span className="text-xs text-green-600 font-medium">公開中</span>
                      ) : (
                        <span className="text-xs text-gray-400">未公開</span>
                      )}
                      <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={d.title}
                    onChange={(e) => setEditing({ ...editing, [item.id]: { ...d, title: e.target.value } })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium mb-2"
                  />
                  <textarea
                    value={d.body}
                    onChange={(e) => setEditing({ ...editing, [item.id]: { ...d, body: e.target.value } })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSaveItemDraft(item)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-charcoal-700">
                      下書き保存
                    </button>
                    <button
                      onClick={() => handlePublishItem(item)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                      style={PRIMARY_BTN_STYLE}
                    >
                      <UploadCloud size={14} />
                      公開する
                    </button>
                    {item.isPublished && (
                      <button onClick={() => handleUnpublishItem(item)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500">
                        公開を取り下げる
                      </button>
                    )}
                    {hasUnpublishedChanges && <span className="text-xs text-amber-600">※未公開の変更あり</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ 3. 未回答の質問（AIが答えられなかったもの） ============ */}
      <section className={tab === "unanswered" ? "" : "hidden"}>
        <p className="text-xs text-gray-400 mb-4">
          チャットボットのAIが「情報がございません」と答えた質問です。求人・採用に関係のない質問や不適切な質問はここには出ません
          （AIが自動で除外します）。質問文そのものではなく、AIが作った要約だけを表示しています。
        </p>

        {unansweredLoading ? (
          <div className="card-luxury p-12 h-32 animate-pulse bg-gray-50" />
        ) : unanswered.length === 0 ? (
          <p className="text-sm text-gray-400">今のところ未回答の質問はありません。</p>
        ) : (
          <div className="space-y-3">
            {unanswered.map((q) => (
              <div key={q.id} className="card-luxury p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <MessageCircleQuestion size={18} className="text-gray-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    {q.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{q.category}</span>}
                    <p className="text-sm text-charcoal-800 mt-1">{q.summary}</p>
                    {q.status !== "open" && (
                      <p className="text-xs text-gray-400 mt-1">{q.status === "added_to_faq" ? "FAQに追加済み" : "却下済み"}</p>
                    )}
                  </div>
                </div>
                {q.status === "open" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAddUnansweredToFaq(q)}
                      disabled={unansweredBusyId === q.id}
                      className={PRIMARY_BTN_CLASS}
                      style={PRIMARY_BTN_STYLE}
                    >
                      <Plus size={14} />
                      FAQに追加
                    </button>
                    <button
                      onClick={() => handleDismissUnanswered(q.id)}
                      disabled={unansweredBusyId === q.id}
                      title="対応不要として却下する"
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-400 disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
