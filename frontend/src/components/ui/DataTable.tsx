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
    <div className="border-border bg-surface overflow-hidden rounded-[var(--radius-card)] border shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-border border-b">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-label text-text-secondary px-4 py-3 ${
                    col.sortable
                      ? "hover:text-text-primary cursor-pointer select-none"
                      : ""
                  } ${col.className ?? ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortColumn === col.key && (
                      <span className="text-accent text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-border border-b">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="bg-border h-4 w-24 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-body text-text-secondary px-4 py-12 text-center"
                >
                  {emptyMessage}
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
                    className={`border-border border-b transition-colors last:border-b-0 ${
                      onRowClick ? "hover:bg-bg cursor-pointer" : ""
                    }`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`text-body text-text-primary px-4 py-3 ${col.className ?? ""}`}
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
      <div className="border-border flex items-center justify-between border-t px-4 py-3">
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
            className="text-body border-border text-text-primary hover:bg-bg rounded-md border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-caption text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="text-body border-border text-text-primary hover:bg-bg rounded-md border px-3 py-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
