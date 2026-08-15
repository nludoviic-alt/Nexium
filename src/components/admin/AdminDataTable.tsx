import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminTableSearchBar } from "./AdminTableSearchBar";

export interface AdminDataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function AdminDataTable<T>({
  columns,
  rows,
  keyFor,
  totalCount,
  emptyMessage,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  page,
  totalPages,
  onPageChange,
}: {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  totalCount: number;
  emptyMessage: string;
  searchValue: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder: string;
  searchAriaLabel: string;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AdminTableSearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          ariaLabel={searchAriaLabel}
        />
        <span className="text-xs sm:text-sm font-bold text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-xl font-mono shadow-sm">
          {totalCount} résultat{totalCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-[#121a2d]/90 shadow-xl overflow-x-auto backdrop-blur-sm">
        <table className="w-full text-left text-sm sm:text-[15px]">
          <thead className="border-b border-slate-700/50 bg-[#0f1626]/80 text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-5 py-4 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-400 font-sans text-sm sm:text-base">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={keyFor(row)} className="hover:bg-slate-800/40 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-4 ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 text-xs sm:text-sm text-slate-300 font-mono">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid size-9 place-items-center rounded-xl border border-slate-700/60 bg-[#0c121e] hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300 transition"
          >
            <ChevronLeft className="size-4.5" />
          </button>
          <span className="font-semibold">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="Page suivante"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="grid size-9 place-items-center rounded-xl border border-slate-700/60 bg-[#0c121e] hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-slate-300 transition"
          >
            <ChevronRight className="size-4.5" />
          </button>
        </div>
      )}
    </div>
  );
}

