import { useState } from "react";
import { Search, Store as StoreIcon, X } from "lucide-react";
import { StoreOption } from "./types";

interface StoreOrClientPickerProps {
  mode: "store" | "client";
  onModeChange: (mode: "store" | "client") => void;
  stores: StoreOption[];
  storeId: string | null;
  clientName: string;
  clientContact: string;
  onChangeStoreId: (id: string | null) => void;
  onChangeClientName: (name: string) => void;
  onChangeClientContact: (contact: string) => void;
}

export default function StoreOrClientPicker({
  mode,
  onModeChange,
  stores,
  storeId,
  clientName,
  clientContact,
  onChangeStoreId,
  onChangeClientName,
  onChangeClientContact,
}: StoreOrClientPickerProps) {
  const [search, setSearch] = useState("");
  const selectedStore = stores.find((s) => s.id === storeId) ?? null;
  const filteredStores = stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">宛先</p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            onModeChange("client");
            onChangeStoreId(null);
          }}
          className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
            mode === "client" ? "bg-[#C4788A14] text-[#A85E74] border-[#C4788A55]" : "text-gray-400 border-gray-200"
          }`}
        >
          見込み客（自由入力）
        </button>
        <button
          onClick={() => onModeChange("store")}
          className={`flex-1 text-xs font-medium py-2 rounded-lg border transition-colors ${
            mode === "store" ? "bg-[#C4788A14] text-[#A85E74] border-[#C4788A55]" : "text-gray-400 border-gray-200"
          }`}
        >
          既存クライアントを選択
        </button>
      </div>

      {mode === "store" ? (
        <div>
          {selectedStore ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[#C4788A0D] border border-[#C4788A33]">
              <span className="flex items-center gap-1.5 text-sm font-medium text-charcoal-900">
                <StoreIcon size={14} strokeWidth={2} style={{ color: "#C4788A" }} />
                {selectedStore.name}
              </span>
              <button onClick={() => onChangeStoreId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="店舗名で検索"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredStores.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-2">該当する店舗がありません</p>
                ) : (
                  filteredStores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onChangeStoreId(s.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-charcoal-700 hover:bg-gray-50"
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={clientName}
          onChange={(e) => onChangeClientName(e.target.value)}
          placeholder="クライアント名（会社名・店舗名など）"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
      )}

      {/* ご担当者名（PDFの「ご担当 ○○ 様」欄）。既存クライアント・自由入力どちらを
          選んだ場合でも入力できるようにする（以前は自由入力の時しか欄が無かった）。 */}
      <input
        type="text"
        value={clientContact}
        onChange={(e) => onChangeClientContact(e.target.value)}
        placeholder="ご担当者名（任意）"
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A] mt-2"
      />
    </div>
  );
}
