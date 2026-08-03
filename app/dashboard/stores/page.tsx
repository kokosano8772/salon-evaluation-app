"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StoreListToolbar from "@/components/growth-db/store-list/StoreListToolbar";
import StoreListGrid from "@/components/growth-db/store-list/StoreListGrid";
import StoreListPagination from "@/components/growth-db/store-list/StoreListPagination";
import { useStores } from "@/lib/growth-db/hooks";
import { GetStoresParams } from "@/lib/growth-db/repository";

const PAGE_SIZE = 9;

export default function StoreListPage() {
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [googleAdsOnly, setGoogleAdsOnly] = useState(false);
  const [metaAdsOnly, setMetaAdsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<GetStoresParams["sortBy"]>("updatedAt");
  const [sortDir, setSortDir] = useState<GetStoresParams["sortDir"]>("desc");
  const [page, setPage] = useState(1);

  const { items, total, loading } = useStores({
    search,
    area: area || undefined,
    googleAdsOnly: googleAdsOnly || undefined,
    metaAdsOnly: metaAdsOnly || undefined,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div>
      <DashboardHeader
        title="成長データベース"
        description={`登録店舗 ${total}件`}
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "成長データベース" }]}
      />

      <StoreListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        area={area}
        onAreaChange={(v) => {
          setArea(v);
          setPage(1);
        }}
        googleAdsOnly={googleAdsOnly}
        onGoogleAdsOnlyChange={(v) => {
          setGoogleAdsOnly(v);
          setPage(1);
        }}
        metaAdsOnly={metaAdsOnly}
        onMetaAdsOnlyChange={(v) => {
          setMetaAdsOnly(v);
          setPage(1);
        }}
        sortValue={`${sortBy}-${sortDir}`}
        onSortChange={(by, dir) => {
          setSortBy(by);
          setSortDir(dir);
          setPage(1);
        }}
      />

      <StoreListGrid stores={items} loading={loading} />

      <StoreListPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
