"use client";

import { type ReactNode } from "react";

/**
 * DataTable — shared reusable table with search, sort, pagination (Design Scheme §5).
 *
 * This is a client-side wrapper; actual data is fetched server-side and passed as items.
 * Pagination is controlled externally via onPageChange for server-side pagination.
 */

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort?: (column: string, order: "asc" | "desc") => void;
  sortColumn?: string;
  sortOrder?: "asc" | "desc";
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T extends object>({
  columns,
  items,
  total,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortColumn,
  sortOrder = "desc",
  onRowClick,
  emptyMessage = "No data found.",
  isLoading = false,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function handleSort(key: string) {
    if (!onSort) return;
    if (sortColumn === key) {
      onSort(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "desc");
    }
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border bg-slate-50/80 dark:bg-slate-900/60 border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-label text-text-secondary px-4 py-3 text-xs font-semibold tracking-wider ${
                    col.sortable
                      ? "hover:text-text-primary cursor-pointer select-none transition-colors"
                      : ""
                  } ${col.className ?? ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="text-xs">
                        {sortColumn === col.key ? (
                          <span className="text-brand-blue font-bold">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">↕</span>
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="bg-slate-200 dark:bg-slate-800 h-4 w-24 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">
                      search_off
                    </span>
                    <p className="text-body text-text-secondary">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const record = item as Record<string, unknown>;
                const itemKey =
                  (record.id as string) ??
                  (record.account_id as string) ??
                  (record.alert_id as string) ??
                  (record.transaction_id as string) ??
                  idx;
                return (
                  <tr
                    key={String(itemKey)}
                    className={`transition-colors duration-150 ${
                      onRowClick
                        ? "hover:bg-brand-blue/5 dark:hover:bg-brand-blue/10 cursor-pointer"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                    }`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`text-body text-text-primary px-4 py-3.5 ${col.className ?? ""}`}
                      >
                        {col.render
                          ? col.render(item)
                          : ((record[col.key] as ReactNode) ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-border bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t px-4 py-3">
        <span className="text-caption text-text-secondary">
          {total === 0
            ? "No results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="border-border bg-surface text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-lg border px-3 py-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-caption text-text-secondary font-mono px-1">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="border-border bg-surface text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-lg border px-3 py-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
