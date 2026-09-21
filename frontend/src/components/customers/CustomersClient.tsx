"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

import { DataTable, type Column } from "@/components/ui/DataTable";
import { RiskBadge } from "@/components/ui/RiskBadge";
import type { Customer, CustomerListResponse } from "@/types/data";

/**
 * Customer List — Design Scheme §4.6.
 */

interface CustomersClientProps {
  accessToken: string;
  apiBaseUrl: string;
}

export default function CustomersClient({
  accessToken,
  apiBaseUrl,
}: CustomersClientProps) {
  const [data, setData] = useState<CustomerListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riskCategory, setRiskCategory] = useState("");
  const [sortColumn, setSortColumn] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "25",
        sort: sortColumn,
        order: sortOrder,
      });
      if (search) params.set("search", search);
      if (riskCategory) params.set("risk_category", riskCategory);

      const res = await fetch(`${apiBaseUrl}/api/v1/customers?${params}`, {
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
    riskCategory,
    sortColumn,
    sortOrder,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns: Column<Customer>[] = [
    {
      key: "full_name",
      label: "Name",
      sortable: true,
      render: (c) => (
        <Link
          href={`/customers/${c.customer_id}`}
          className="text-accent font-medium hover:underline"
        >
          {c.full_name}
        </Link>
      ),
    },
    {
      key: "external_ref",
      label: "External Ref",
      render: (c) => (
        <span className="text-caption font-mono">{c.external_ref ?? "—"}</span>
      ),
    },
    {
      key: "country",
      label: "Country",
      render: (c) => c.country ?? "—",
    },
    {
      key: "kyc_level",
      label: "KYC Level",
      render: (c) => (
        <span className="text-label text-text-secondary capitalize">
          {c.kyc_level ?? "—"}
        </span>
      ),
    },
    {
      key: "current_risk_category",
      label: "Risk",
      render: (c) => <RiskBadge category={c.current_risk_category} />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (c) => (
        <span className="text-caption text-text-secondary">
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Customer Entity Directory
            </h1>
            <span className="bg-brand-blue/10 text-brand-blue dark:text-blue-300 border border-brand-blue/20 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              {data?.total.toLocaleString() ?? 0} Entities
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Browse monitored legal entities, retail accountholders, and cumulative AML risk profiles.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl p-4 shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <span className="material-symbols-outlined absolute inset-y-0 left-3 flex items-center text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by entity name, external ref, or country code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-border bg-surface text-xs text-text-primary placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 w-full rounded-lg pl-9 pr-3 py-2 outline-none transition-all"
          />
        </div>
        <select
          value={riskCategory}
          onChange={(e) => {
            setRiskCategory(e.target.value);
            setPage(1);
          }}
          className="border border-border bg-surface text-xs text-text-primary rounded-lg px-3 py-2 outline-none focus:border-brand-blue cursor-pointer"
        >
          <option value="">All Risk Tiers</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
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
        isLoading={loading}
        emptyMessage="No customers found."
      />
    </div>
  );
}
