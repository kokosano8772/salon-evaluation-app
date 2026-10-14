"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Globe, ChevronRight } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const ACCENT = "#C4788A";

const SITE_TYPE_LABEL: Record<string, string> = {
  hp: "HP",
  acquisition_lp: "集客LP",
  recruitment_lp: "採用LP",
};

interface WebAsset {
  id: string;
  site_type: string;
  url: string;
  label: string;
}

interface Salon {
  id: string;
  name: string;
  prefecture: string;
  city: string;
  store_count: number | null;
  webAssets: WebAsset[];
}

export default function WebRankingPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showSalonForm, setShowSalonForm] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [storeCount, setStoreCount] = useState("");
  const [saving, setSaving] = useState(false);

  const [assetFormSalonId, setAssetFormSalonId] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState("");
  const [assetSiteType, setAssetSiteType] = useState("hp");

  const loadSalons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/web-ranking/salons");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
      setSalons(json.salons ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, []);

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/web-ranking/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: salonName.trim(),
          prefecture,
          city,
          storeCount: storeCount ? Number(storeCount) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "登録に失敗しました");
      setSalonName("");
      setPrefecture("");
      setCity("");
      setStoreCount("");
      setShowSalonForm(false);
      await loadSalons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetFormSalonId || !assetUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/web-ranking/web-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId: assetFormSalonId, url: assetUrl.trim(), siteType: assetSiteType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "登録に失敗しました");
      setAssetUrl("");
      setAssetFormSalonId(null);
      await loadSalons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="WEBランキング"
        description={`登録サロン ${salons.length}件（Phase 1: 管理者による手動登録＋HP診断のみ）`}
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "WEBランキング" }]}
        actions={
          <button
            onClick={() => setShowSalonForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: ACCENT }}
          >
            <Plus size={16} strokeWidth={2} />
            サロンを登録
          </button>
        }
      />

      {showSalonForm && (
        <form onSubmit={handleCreateSalon} className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="サロン名"
              required
              className="col-span-2 px-3 py-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              placeholder="都道府県"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="市区町村"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm"
            />
            <input
              value={storeCount}
              onChange={(e) => setStoreCount(e.target.value)}
              type="number"
              min={1}
              placeholder="店舗数（多店舗の場合）"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            登録
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {salons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-charcoal-900">{salon.name}</p>
                  <p className="text-xs text-gray-400">
                    {salon.prefecture}
                    {salon.city}
                    {salon.store_count ? ` ／ ${salon.store_count}店舗` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setAssetFormSalonId(assetFormSalonId === salon.id ? null : salon.id)}
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: ACCENT }}
                >
                  <Plus size={13} strokeWidth={2} />
                  サイトURL登録
                </button>
              </div>

              {assetFormSalonId === salon.id && (
                <form onSubmit={handleRegisterAsset} className="flex gap-2 mb-3 bg-gray-50 rounded-xl p-3">
                  <select
                    value={assetSiteType}
                    onChange={(e) => setAssetSiteType(e.target.value)}
                    className="px-2 py-2 rounded-lg border border-gray-200 text-xs"
                  >
                    <option value="hp">HP</option>
                    <option value="acquisition_lp">集客LP</option>
                    <option value="recruitment_lp">採用LP</option>
                  </select>
                  <input
                    value={assetUrl}
                    onChange={(e) => setAssetUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: ACCENT }}
                  >
                    登録
                  </button>
                </form>
              )}

              <div className="space-y-1.5">
                {salon.webAssets.length === 0 && <p className="text-xs text-gray-300">サイト未登録</p>}
                {salon.webAssets.map((asset) => (
                  <Link
                    key={asset.id}
                    href={`/dashboard/web-ranking/web-assets/${asset.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Globe size={13} strokeWidth={1.8} className="flex-shrink-0 text-gray-400" />
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-white text-gray-500 flex-shrink-0">
                        {SITE_TYPE_LABEL[asset.site_type] ?? asset.site_type}
                      </span>
                      <span className="truncate text-charcoal-700">{asset.url}</span>
                    </span>
                    <ChevronRight size={14} strokeWidth={2} className="flex-shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {salons.length === 0 && <p className="text-sm text-gray-400">まだサロンが登録されていません。</p>}
        </div>
      )}
    </div>
  );
}
