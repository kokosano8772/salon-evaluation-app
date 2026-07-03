import { Store } from "@/lib/growth-db/types";
import StoreCard from "./StoreCard";

interface StoreListGridProps {
  stores: Store[];
  loading: boolean;
}

export default function StoreListGrid({ stores, loading }: StoreListGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-luxury p-5 h-[140px] animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="card-luxury p-12 text-center text-gray-400 text-sm">
        条件に一致する店舗が見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}
    </div>
  );
}
