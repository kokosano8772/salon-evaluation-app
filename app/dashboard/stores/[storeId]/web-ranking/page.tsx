"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StoreWebRankingSearchForm from "@/components/growth-db/web-ranking/StoreWebRankingSearchForm";
import StoreWebRankingCandidateList from "@/components/growth-db/web-ranking/StoreWebRankingCandidateList";
import StoreWebRankingResultList from "@/components/growth-db/web-ranking/StoreWebRankingResultList";
import { useStore } from "@/lib/growth-db/hooks";
import { SalonGenre } from "@/lib/competitor-research/types";
import {
  CompareResultRow,
  DiscoverCandidate,
  ensureOwnAsset,
  fetchComparison,
  registerCompetitorAsset,
  runAudit,
} from "@/lib/web-ranking/store-ranking-client";

type Step = "search" | "result";

export default function StoreWebRankingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);

  const [step, setStep] = useState<Step>("search");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState<SalonGenre | "all">("all");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState("");

  const [preparing, setPreparing] = useState(false);
  const [registrationWarnings, setRegistrationWarnings] = useState<{ name: string; reason: string }[]>([]);
  const [auditWarnings, setAuditWarnings] = useState<{ name: string; reason: string }[]>([]);
  const [results, setResults] = useState<CompareResultRow[]>([]);

  // storeの読み込み完了後、検索エリアの初期値として店舗のareaを一度だけ流し込む
  // （useStateの初期値はマウント時のstoreがまだnullの間に確定してしまうため）。
  useEffect(() => {
    if (store && region === "") setRegion(store.area || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  if (storeLoading || !store) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const ownHomepageUrl = store.homepageUrls[0]?.url;

  function startNewSearch() {
    setRegion(store!.area || "");
    setGenre("all");
    setCandidates([]);
    setSelectedWebsites(new Set());
    setSearchError("");
    setStep("search");
  }

  async function runSearch() {
    if (!region.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch("/api/web-ranking/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefecture: region, city: "", genre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "検索に失敗しました");
        setCandidates([]);
        return;
      }
      // 自社サイトと同じURLの候補は、自社を自分自身の競合として出さないよう除外する
      const filtered = (data.candidates as DiscoverCandidate[]).filter((c) => c.website !== ownHomepageUrl);
      setCandidates(filtered);
      setSelectedWebsites(new Set());
    } finally {
      setSearching(false);
    }
  }

  function toggleCandidate(website: string) {
    setSelectedWebsites((prev) => {
      const next = new Set(prev);
      if (next.has(website)) next.delete(website);
      else next.add(website);
      return next;
    });
  }

  async function startComparison() {
    setPreparing(true);
    setRegistrationWarnings([]);
    setAuditWarnings([]);
    try {
      const own = await ensureOwnAsset(storeId);

      const selected = candidates.filter((c) => selectedWebsites.has(c.website));
      const registerResults = await Promise.all(
        selected.map(async (c) => {
          if (c.webAssetId) return { webAssetId: c.webAssetId };
          try {
            const webAssetId = await registerCompetitorAsset(c);
            return { webAssetId };
          } catch (err) {
            return { warning: { name: c.name, reason: err instanceof Error ? err.message : "登録に失敗しました" } };
          }
        })
      );
      const regWarnings = registerResults.map((r) => r.warning).filter((w): w is { name: string; reason: string } => !!w);
      setRegistrationWarnings(regWarnings);
      const competitorWebAssetIds = registerResults.map((r) => r.webAssetId).filter((id): id is string => !!id);

      // 1回目: 鮮度チェックのためだけに比較を取得する
      const firstPass = await fetchComparison(own.webAssetId, competitorWebAssetIds);
      const needsAuditIds = firstPass.filter((r) => r.needsAudit).map((r) => r.webAssetId);
      const nameByAssetId = new Map(firstPass.map((r) => [r.webAssetId, r.salonName]));

      const auditResults = await Promise.all(
        needsAuditIds.map(async (id) => {
          try {
            await runAudit(id);
            return { ok: true };
          } catch (err) {
            return {
              warning: { name: nameByAssetId.get(id) ?? id, reason: err instanceof Error ? err.message : "診断に失敗しました" },
            };
          }
        })
      );
      setAuditWarnings(auditResults.map((r) => r.warning).filter((w): w is { name: string; reason: string } => !!w));

      const finalResults = await fetchComparison(own.webAssetId, competitorWebAssetIds);
      setResults(finalResults);
      setStep("result");
    } finally {
      setPreparing(false);
    }
  }

  const breadcrumbs = [
    { label: "ダッシュボード", href: "/dashboard" },
    { label: "成長データベース", href: "/dashboard/stores" },
    { label: store.name, href: `/dashboard/stores/${storeId}` },
    { label: "WEBランキング" },
  ];

  return (
    <div>
      <DashboardHeader
        title="WEBランキング"
        description={store.name}
        breadcrumbs={breadcrumbs}
        actions={
          step === "result" ? (
            <button
              onClick={startNewSearch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#C4788A]/50"
            >
              <ArrowLeft size={15} />
              検索条件に戻る
            </button>
          ) : undefined
        }
      />

      {!ownHomepageUrl ? (
        <div className="card-luxury p-6 text-sm text-amber-700 bg-amber-50 border border-amber-200">
          自社サイトのURLが未登録です。先に店舗情報の編集画面で「ホームページURL」を登録してください。
          <Link href={`/dashboard/stores/${storeId}/edit`} className="ml-1 underline font-medium">
            店舗情報を編集する
          </Link>
        </div>
      ) : (
        <>
          {step === "search" && (
            <div className="space-y-6">
              {region === "" && candidates.length === 0 && !searching && (
                <p className="text-xs text-gray-400 -mt-2">
                  自社サイトの診断と、選んだ地域の競合サイトの診断を行い、順位を比較します。
                </p>
              )}
              <StoreWebRankingSearchForm
                region={region}
                onRegionChange={setRegion}
                genre={genre}
                onGenreChange={setGenre}
                onSearch={runSearch}
                loading={searching}
              />

              {searchError && <p className="text-sm text-red-500">{searchError}</p>}

              {candidates.length > 0 && (
                <StoreWebRankingCandidateList
                  candidates={candidates}
                  selectedWebsites={selectedWebsites}
                  onToggle={toggleCandidate}
                  onStart={startComparison}
                  preparing={preparing}
                />
              )}
            </div>
          )}

          {step === "result" && (
            <div className="space-y-6">
              {(registrationWarnings.length > 0 || auditWarnings.length > 0) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 space-y-1">
                  <p className="font-medium">一部のサイトで登録・診断に失敗しました:</p>
                  {[...registrationWarnings, ...auditWarnings].map((w, i) => (
                    <p key={i}>
                      ・{w.name}: {w.reason}
                    </p>
                  ))}
                </div>
              )}
              <StoreWebRankingResultList results={results} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
