"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { ExplanationPanel } from "@/components/ui/ExplanationPanel";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { Transaction, TransactionListResponse } from "@/types/data";

/**
 * Transaction Monitor — Design Scheme §4.3 (AML-FR-04/05/06).
 *
 * Toolbar: search, date-range filters, channel filter, "Import CSV" button.
 * DataTable: Timestamp, Origin, Destination, Amount, Type, Risk, Channel.
 */

interface TransactionsClientProps {
  accessToken: string;
  apiBaseUrl: string;
  canImport: boolean; // true for data_operator and administrator
}

export default function TransactionsClient({
  accessToken,
  apiBaseUrl,
  canImport,
}: TransactionsClientProps) {
  const [data, setData] = useState<TransactionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [channel, setChannel] = useState("");
  const [sortColumn, setSortColumn] = useState("occurred_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "25",
        sort: sortColumn,
        order: sortOrder,
      });
      if (search) params.set("search", search);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (channel) params.set("channel", channel);

      const res = await fetch(`${apiBaseUrl}/api/v1/transactions?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // TODO: error state
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    apiBaseUrl,
    page,
    search,
    dateFrom,
    dateTo,
    channel,
    sortColumn,
    sortOrder,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: Column<Transaction>[] = [
    {
      key: "occurred_at",
      label: "Timestamp",
      sortable: true,
      render: (t) => (
        <span className="text-caption font-mono">
          {new Date(t.occurred_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "origin_account_id",
      label: "Origin",
      render: (t) => (
        <span className="text-caption font-mono">
          {t.origin_account_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "destination_account_id",
      label: "Destination",
      render: (t) => (
        <span className="text-caption font-mono">
          {t.destination_account_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (t) => (
        <span className="font-mono">
          {Number(t.amount).toLocaleString(undefined, {
            style: "currency",
            currency: t.currency || "USD",
          })}
        </span>
      ),
    },
    {
      key: "transaction_type",
      label: "Type",
      render: (t) => (
        <span className="text-label text-text-secondary capitalize">
          {t.transaction_type ?? "—"}
        </span>
      ),
    },
    {
      key: "risk_category",
      label: "Risk",
      render: (t) => <RiskBadge category={t.risk_category} />,
    },
    {
      key: "channel",
      label: "Channel",
      render: (t) => (
        <span className="text-caption text-text-secondary capitalize">
          {t.channel ?? "—"}
        </span>
      ),
    },
  ];

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page-title text-text-primary">
            Transaction Monitoring
          </h1>
          <p className="text-body text-text-secondary">
            Inspect live transactions, review ML risk evaluations, and filter by
            risk category.
          </p>
        </div>
        {canImport && (
          <Link
            href="/transactions/import"
            className="bg-accent hover:bg-accent/90 text-surface inline-flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-colors"
          >
            Import CSV
          </Link>
        )}
      </div>

      {/* Filters toolbar */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by ref or account…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border-border bg-bg text-body text-text-primary placeholder:text-text-secondary focus:ring-accent min-w-[200px] flex-1 rounded-md border px-3 py-2 outline-none focus:ring-2"
        />
        <div className="flex items-center gap-2">
          <label className="text-caption text-text-secondary">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="border-border bg-bg text-body text-text-primary rounded-md border px-2 py-1.5"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-caption text-text-secondary">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="border-border bg-bg text-body text-text-primary rounded-md border px-2 py-1.5"
          />
        </div>
        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          className="border-border bg-bg text-body text-text-primary rounded-md border px-3 py-2"
        >
          <option value="">All Channels</option>
          <option value="online">Online</option>
          <option value="branch">Branch</option>
          <option value="atm">ATM</option>
          <option value="api">API</option>
          <option value="wire">Wire</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        items={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        onSort={(col, ord) => {
          setSortColumn(col);
          setSortOrder(ord);
          setPage(1);
        }}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onRowClick={(item) => setSelectedTxn(item)}
        isLoading={loading}
        emptyMessage="No transactions found. Import a CSV to get started."
      />

      {/* Transaction Detail Drawer */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="border-border bg-surface flex h-full w-full max-w-lg flex-col overflow-y-auto border-l p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-section-title text-text-primary">
                  Transaction Details
                </h2>
                <span className="text-text-secondary font-mono text-xs">
                  {selectedTxn.transaction_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-text-secondary hover:bg-bg hover:text-text-primary rounded-md p-1.5"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              {/* ML Risk Evaluation Card */}
              <div className="border-border bg-bg flex flex-col gap-3 rounded-lg border p-4">
                <span className="text-label text-text-secondary font-semibold tracking-wider uppercase">
                  ML Risk Evaluation
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-body font-medium">Risk Category</span>
                  <RiskBadge category={selectedTxn.risk_category} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-body text-text-secondary flex justify-between">
                    <span>Probability of Laundering</span>
                    <span className="text-text-primary font-mono font-medium">
                      {selectedTxn.risk_probability != null
                        ? `${(selectedTxn.risk_probability * 100).toFixed(1)}%`
                        : "Pending evaluation"}
                    </span>
                  </div>
                  {selectedTxn.risk_probability != null && (
                    <div className="bg-border h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          selectedTxn.risk_category === "high"
                            ? "bg-red-500"
                            : selectedTxn.risk_category === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, selectedTxn.risk_probability * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-text-secondary mt-1 flex justify-between border-t pt-2 text-xs">
                  <span>Scoring Model</span>
                  <span className="font-mono">
                    {selectedTxn.model_version ?? "XGBoost v1.0"}
                  </span>
                </div>
              </div>

              {/* Explainable AI SHAP Panel */}
              <ExplanationPanel
                transactionId={selectedTxn.transaction_id}
                apiBaseUrl={apiBaseUrl}
                accessToken={accessToken}
              />

              {/* Transaction Properties */}
              <div className="flex flex-col gap-3">
                <span className="text-label text-text-secondary font-semibold tracking-wider uppercase">
                  Transaction Metadata
                </span>
                <div className="text-body grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Amount
                    </span>
                    <span className="font-mono text-lg font-semibold">
                      {Number(selectedTxn.amount).toLocaleString(undefined, {
                        style: "currency",
                        currency: selectedTxn.currency || "USD",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Type
                    </span>
                    <span className="capitalize">
                      {selectedTxn.transaction_type ?? "Standard Transfer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Channel
                    </span>
                    <span className="capitalize">
                      {selectedTxn.channel ?? "Online"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Timestamp
                    </span>
                    <span className="text-caption font-mono">
                      {new Date(selectedTxn.occurred_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Origin Account ID
                    </span>
                    <span className="text-text-primary font-mono text-xs break-all">
                      {selectedTxn.origin_account_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-caption block">
                      Destination Account ID
                    </span>
                    <span className="text-text-primary font-mono text-xs break-all">
                      {selectedTxn.destination_account_id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
