"use client";

import { use, useState } from "react";
import { ArrowLeft, Check, Loader2, Save, Table2, Sparkles } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CompetitorSessionList from "@/components/growth-db/competitors/CompetitorSessionList";
import CompetitorSearchForm from "@/components/growth-db/competitors/CompetitorSearchForm";
import CompetitorSearchResults from "@/components/growth-db/competitors/CompetitorSearchResults";
import CompetitorComparisonTable from "@/components/growth-db/competitors/CompetitorComparisonTable";
import CompetitorAIAnalysisPanel from "@/components/growth-db/competitors/CompetitorAIAnalysisPanel";
import CompetitorExportMenu from "@/components/growth-db/competitors/CompetitorExportMenu";
import { useStore, useMonthlyMetrics } from "@/lib/growth-db/hooks";
import { useCompetitorSessions } from "@/lib/growth-db/competitor-hooks";
import * as competitorRepo from "@/lib/growth-db/competitor-repository";
import { buildOwnSalonFromStore } from "@/lib/competitor-research/own-salon";
import { computeAutoCellData } from "@/lib/competitor-research/auto-rating";
import {
  AnalysisMode,
  AttractionData,
  CellData,
  ComparisonData,
  RecruitmentData,
  SalonBasic,
  SalonData,
  SalonGenre,
} from "@/lib/competitor-research/types";
import type { SearchResponse } from "@/lib/competitor-research/search-types";

// 空文字/undefinedのキーを除いたコピーを返す（既知の実データで未設定のまま
// AI推測を上書きしてしまわないようにするため）。
function pickDefined<T extends object>(obj: T | undefined): Partial<T> {
  if (!obj) return {};
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== "") (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

type Step = "sessions" | "search" | "compare";
type CompareTab = "table" | "ai";
type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function CompetitorResearchPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);
  const { data: history } = useMonthlyMetrics(storeId);
  const { items: sessions, loading: sessionsLoading, refresh: refreshSessions } = useCompetitorSessions(storeId);

  const [step, setStep] = useState<Step>("sessions");

  // 検索ステップ
  const [region, setRegion] = useState("");
  const [mode, setMode] = useState<AnalysisMode>("both");
  const [genre, setGenre] = useState<SalonGenre | "all">("all");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [allResults, setAllResults] = useState<SalonBasic[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [preparingCompare, setPreparingCompare] = useState(false);
  const [extractionWarnings, setExtractionWarnings] = useState<{ name: string; reason: string }[]>([]);

  // 比較ステップ
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [salons, setSalons] = useState<SalonData[]>([]);
  const [cellData, setCellData] = useState<ComparisonData>({});
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [compareTab, setCompareTab] = useState<CompareTab>("table");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  if (storeLoading || !store) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const latestMonthly = history.length > 0 ? history[history.length - 1] : null;

  function startNewSearch() {
    setRegion(store!.area || "");
    setMode("both");
    setGenre("all");
    setSearchResult(null);
    setAllResults([]);
    setSelectedIds(new Set());
    setStep("search");
  }

  async function runSearch(page: number, append: boolean) {
    if (!region.trim()) return;
    if (append) setLoadingMore(true);
    else setSearching(true);
    try {
      const res = await fetch("/api/growth-db/competitor-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, mode, genre, sortBy: "rating", page, perPage: 20 }),
      });
      const data: SearchResponse = await res.json();
      setSearchResult(data);
      setAllResults((prev) => (append ? [...prev, ...data.salons] : data.salons));
      if (!append) setSelectedIds(new Set());
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }

  function toggleSalon(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function startCompare() {
    const ownSalonBase = buildOwnSalonFromStore(store!, latestMonthly);
    const selectedBasics = allResults.filter((s) => selectedIds.has(s.id));

    setPreparingCompare(true);
    setExtractionWarnings([]);
    try {
      // 以前は「同時に呼ぶとレート制限に引っかかる」と考えて1件ずつ順番に呼んで
      // いたが、実際のエラーは429(レート制限)ではなく504(1件30秒の処理時間切れ)
      // だったため、根本原因はそこではなかった。/api/growth-db/competitor-extract
      // のmaxDurationを60秒に伸ばして直したので、同時実行に戻して速くする。
      type ExtractTarget = { label: string; name: string; area: string; website?: string };
      const ownHomepageUrl = store?.homepageUrls?.[0]?.url;
      const targets: ExtractTarget[] = [
        { label: `${ownSalonBase.name}（自社）`, name: ownSalonBase.name, area: ownSalonBase.area, website: ownHomepageUrl },
        ...selectedBasics.map((s) => ({ label: s.name, name: s.name, area: s.area, website: s.website })),
      ];

      const results = await Promise.all(
        targets.map(async (target) => {
          try {
            const res = await fetch("/api/growth-db/competitor-extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: target.name, area: target.area, website: target.website }),
            });
            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              const reason = typeof errJson.error === "string" ? errJson.error : `HTTP ${res.status}`;
              console.error(`competitor-extract failed for ${target.label}:`, res.status, errJson);
              return { warning: { name: target.label, reason } };
            }
            const extracted = await res.json();
            return { extracted };
          } catch (err) {
            console.error(`competitor-extract threw for ${target.label}:`, err);
            return { warning: { name: target.label, reason: err instanceof Error ? err.message : "通信に失敗しました" } };
          }
        })
      );

      const warnings = results.map((r) => r.warning).filter((w): w is { name: string; reason: string } => !!w);
      setExtractionWarnings(warnings);

      // 自社: 店舗データ由来の実データ(価格帯・席数・評価等)はAIの推測より常に優先する。
      const ownExtracted = results[0].extracted;
      const ownSalon: SalonData = {
        ...ownSalonBase,
        attraction: { ...ownExtracted?.attraction, ...pickDefined(ownSalonBase.attraction) },
        recruitment: { ...ownExtracted?.recruitment, ...pickDefined(ownSalonBase.recruitment) },
      };

      const competitorSalons: SalonData[] = selectedBasics.map((s, i) => {
        const extracted = results[i + 1].extracted;
        // Google Placesから取得できていれば営業時間・定休日はここで先に埋めておく
        const baseAttraction: AttractionData = { businessHours: s.businessHours, closedDays: s.closedDays };
        const baseRecruitment: RecruitmentData = { businessHours: s.businessHours };
        return {
          ...s,
          attraction: { ...baseAttraction, ...extracted?.attraction },
          recruitment: { ...baseRecruitment, ...extracted?.recruitment },
        };
      });

      const newSalons = [ownSalon, ...competitorSalons];
      setSalons(newSalons);
      // 数値・はい/いいえ項目は自社と自動比較して評価を仮入力しておく（手動で上書き可能）
      setCellData(computeAutoCellData(newSalons, mode));
      setAiResult(null);
      setCurrentSessionId(null);
      setCompareTab("table");
      setSaveStatus("idle");
      setStep("compare");
    } finally {
      setPreparingCompare(false);
    }
  }

  async function openSession(sessionId: string) {
    const session = await competitorRepo.getCompetitorSession(sessionId);
    if (!session) return;
    setSalons(session.salons);
    setCellData(session.cellData);
    setAiResult(session.aiResult);
    setMode(session.mode);
    setRegion(session.region);
    setCurrentSessionId(session.id);
    setCompareTab("table");
    setSaveStatus("idle");
    setStep("compare");
  }

  async function deleteSession(sessionId: string) {
    await competitorRepo.deleteCompetitorSession(sessionId);
    refreshSessions();
  }

  function handleCellChange(salonId: string, fieldKey: string, patch: Partial<CellData>) {
    setCellData((prev) => {
      const prevCell = prev[salonId]?.[fieldKey] ?? { value: "", rating: "neutral" as const };
      return {
        ...prev,
        [salonId]: {
          ...prev[salonId],
          [fieldKey]: { ...prevCell, ...patch },
        },
      };
    });
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      if (currentSessionId) {
        await competitorRepo.updateCompetitorSession(currentSessionId, { region, mode, salons, cellData, aiResult });
      } else {
        const created = await competitorRepo.createCompetitorSession(storeId, { region, mode, salons, cellData, aiResult });
        setCurrentSessionId(created.id);
      }
      setSaveStatus("saved");
      refreshSessions();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    }
  }

  const breadcrumbs = [
    { label: "ダッシュボード", href: "/dashboard" },
    { label: "成長データベース", href: "/dashboard/stores" },
    { label: store.name, href: `/dashboard/stores/${storeId}` },
    { label: "競合分析" },
  ];

  return (
    <div>
      <DashboardHeader
        title="競合分析"
        description={store.name}
        breadcrumbs={breadcrumbs}
        actions={
          step !== "sessions" ? (
            <button
              onClick={() => setStep("sessions")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#C4788A]/50"
            >
              <ArrowLeft size={15} />
              セッション一覧へ
            </button>
          ) : undefined
        }
      />

      {step === "sessions" && (
        <CompetitorSessionList
          sessions={sessions}
          loading={sessionsLoading}
          onOpen={openSession}
          onDelete={deleteSession}
          onCreateNew={startNewSearch}
        />
      )}

      {step === "search" && (
        <div className="space-y-6">
          <CompetitorSearchForm
            region={region}
            onRegionChange={setRegion}
            mode={mode}
            onModeChange={setMode}
            genre={genre}
            onGenreChange={setGenre}
            onSearch={() => runSearch(1, false)}
            loading={searching}
          />

          {searchResult && (
            <CompetitorSearchResults
              salons={allResults}
              total={searchResult.total}
              hasMore={searchResult.hasMore}
              source={searchResult.source}
              selectedIds={selectedIds}
              onToggle={toggleSalon}
              onLoadMore={() => runSearch((searchResult.page ?? 1) + 1, true)}
              onStartCompare={startCompare}
              loadingMore={loadingMore}
              preparing={preparingCompare}
            />
          )}
        </div>
      )}

      {step === "compare" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 border-b border-gray-100">
              <button
                onClick={() => setCompareTab("table")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  compareTab === "table" ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
                }`}
              >
                <Table2 size={15} />
                比較表
              </button>
              <button
                onClick={() => setCompareTab("ai")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  compareTab === "ai" ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
                }`}
              >
                <Sparkles size={15} />
                AI分析
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#C4788A]/50 disabled:opacity-60"
              >
                {saveStatus === "saving" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : saveStatus === "saved" ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Save size={14} />
                )}
                {saveStatus === "saved" ? "保存済み" : "保存"}
              </button>
              <CompetitorExportMenu salons={salons} mode={mode} cellData={cellData} region={region} aiResult={aiResult ?? undefined} />
            </div>
          </div>

          {saveStatus === "error" && (
            <p className="text-sm text-red-500">保存に失敗しました。もう一度お試しください。</p>
          )}

          {extractionWarnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-medium">一部のサロンでAI情報取得に失敗しました（営業時間・定休日以外は空欄のままです）:</p>
              {extractionWarnings.map((w) => (
                <p key={w.name}>
                  ・{w.name}: {w.reason}
                </p>
              ))}
            </div>
          )}

          {compareTab === "table" && (
            <CompetitorComparisonTable salons={salons} mode={mode} cellData={cellData} onCellChange={handleCellChange} />
          )}
          {compareTab === "ai" && (
            <CompetitorAIAnalysisPanel
              storeId={storeId}
              salons={salons}
              mode={mode}
              cellData={cellData}
              initialResult={aiResult}
              onComplete={setAiResult}
            />
          )}
        </div>
      )}
    </div>
  );
}
