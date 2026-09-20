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
      <div>
        <h1 className="text-display text-text-primary">Customers</h1>
        <p className="text-body text-text-secondary mt-1">
          Browse customer profiles and risk assessments.
        </p>
      </div>

      {/* Filters */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, ref, or country…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="border-border bg-bg text-body text-text-primary placeholder:text-text-secondary focus:ring-accent min-w-[200px] flex-1 rounded-md border px-3 py-2 outline-none focus:ring-2"
        />
        <select
          value={riskCategory}
          onChange={(e) => {
            setRiskCategory(e.target.value);
            setPage(1);
          }}
          className="border-border bg-bg text-body text-text-primary rounded-md border px-3 py-2"
        >
          <option value="">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
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
