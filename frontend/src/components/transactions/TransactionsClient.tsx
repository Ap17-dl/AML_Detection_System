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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Transaction Surveillance
            </h1>
            <span className="bg-brand-blue/10 text-brand-blue dark:text-blue-300 border border-brand-blue/20 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              {data?.total.toLocaleString() ?? 0} Transactions
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time multi-rail feed across wire, online, branch, ATM, and API endpoints.
          </p>
        </div>
        {canImport && (
          <Link
            href="/transactions/import"
            className="bg-brand-navy hover:bg-brand-blue text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-150 inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            <span>Import Batch CSV</span>
          </Link>
        )}
      </div>

      {/* Filters toolbar */}
      <div className="border border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl p-4 shadow-xs">
        <div className="relative min-w-[220px] flex-1">
          <span className="material-symbols-outlined absolute inset-y-0 left-3 flex items-center text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by transaction ref or account ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-border bg-surface text-xs text-text-primary placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 w-full rounded-lg pl-9 pr-3 py-2 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="border border-border bg-surface text-xs text-text-primary rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-blue"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="border border-border bg-surface text-xs text-text-primary rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-blue"
          />
        </div>
        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          className="border border-border bg-surface text-xs text-text-primary rounded-lg px-3 py-2 outline-none focus:border-brand-blue cursor-pointer"
        >
          <option value="">All Channels</option>
          <option value="online">Online Rail</option>
          <option value="branch">Branch Transfer</option>
          <option value="atm">ATM Withdrawal</option>
          <option value="api">API Endpoint</option>
          <option value="wire">Fedwire / SWIFT</option>
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-slide-up">
          <div className="border-border bg-surface flex h-full w-full max-w-lg flex-col overflow-y-auto border-l p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-blue text-[20px]">receipt_long</span>
                  <h2 className="text-base font-bold text-text-primary">
                    Transaction Details
                  </h2>
                </div>
                <span className="text-text-secondary font-mono text-xs mt-0.5 block">
                  {selectedTxn.transaction_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-text-primary rounded-lg p-1.5 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              {/* ML Risk Evaluation Card */}
              <div className="border border-border bg-slate-50/70 dark:bg-slate-900/50 flex flex-col gap-3 rounded-xl p-4 shadow-xs">
                <span className="text-xs font-semibold tracking-wider uppercase text-text-secondary">
                  ML Risk Evaluation
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary">Assigned Risk Tier</span>
                  <RiskBadge category={selectedTxn.risk_category} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-xs text-text-secondary flex justify-between">
                    <span>Probability of Laundering</span>
                    <span className="text-text-primary font-mono font-bold">
                      {selectedTxn.risk_probability != null
                        ? `${(selectedTxn.risk_probability * 100).toFixed(1)}%`
                        : "Pending evaluation"}
                    </span>
                  </div>
                  {selectedTxn.risk_probability != null && (
                    <div className="bg-slate-200 dark:bg-slate-800 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedTxn.risk_category === "high"
                            ? "bg-rose-500"
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
                <div className="text-text-secondary mt-1 flex justify-between border-t border-border pt-2 text-[11px]">
                  <span>Scoring Engine</span>
                  <span className="font-mono text-text-primary font-medium">
                    {selectedTxn.model_version ?? "Ensemble XGBoost + GNN v2.1"}
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
