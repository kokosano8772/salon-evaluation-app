import { ChevronLeft, ChevronRight } from "lucide-react";

interface StoreListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function StoreListPagination({ page, pageSize, total, onPageChange }: StoreListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <span className="text-sm text-gray-500 tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
