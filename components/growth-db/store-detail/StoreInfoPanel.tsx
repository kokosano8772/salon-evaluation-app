import Link from "next/link";
import { Pencil, MapPin } from "lucide-react";
import { Store } from "@/lib/growth-db/types";
import { formatYen } from "@/lib/growth-db/format";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-medium text-charcoal-900">{value}</span>
    </div>
  );
}

export default function StoreInfoPanel({ store }: { store: Store }) {
  return (
    <div className="card-luxury p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-lg font-bold text-charcoal-900 leading-snug">{store.name}</h2>
        <Link
          href={`/dashboard/stores/${store.id}/edit`}
          className="flex-shrink-0 w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
        >
          <Pencil size={14} strokeWidth={2} />
        </Link>
      </div>
      <p className="flex items-center gap-1 text-xs text-gray-400 mb-5">
        <MapPin size={12} strokeWidth={2} />
        {store.area}
      </p>

      <div>
        <InfoRow label="電話番号" value={store.phone || "未登録"} />
        <InfoRow label="開業年" value={`${store.openedYear}年`} />
        <InfoRow label="店舗数" value={`${store.storeCount}店舗`} />
        <InfoRow label="席数" value={`${store.seatCount}席`} />
        <InfoRow label="営業時間" value={store.businessHours} />
        <InfoRow label="営業日" value={store.businessDays} />
        <InfoRow label="スタッフ数" value={`${store.staffCount}名`} />
        <InfoRow label="ターゲット" value={store.targetCustomer} />
        <InfoRow label="平均単価" value={formatYen(store.averageUnitPrice)} />
      </div>

      <Link
        href={`/dashboard/stores/${store.id}/data`}
        className="block text-center mt-6 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        月次データを入力する
      </Link>
    </div>
  );
}
