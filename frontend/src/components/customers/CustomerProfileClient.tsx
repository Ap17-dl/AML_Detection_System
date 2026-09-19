"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { RiskBadge } from "@/components/ui/RiskBadge";
import { TrendChart, type TrendPoint } from "@/components/ui/TrendChart";
import type { Customer, Account } from "@/types/data";

interface CustomerRiskHistoryItem {
  history_id: string;
  customer_id: string;
  risk_score: number;
  risk_category: string;
  reason?: string;
  recorded_at: string;
}

interface CustomerRiskProfile {
  customer_id: string;
  full_name: string;
  current_risk_score: number | null;
  current_risk_category: string | null;
  risk_updated_at: string | null;
  history: CustomerRiskHistoryItem[];
}

interface CustomerProfileClientProps {
  customerId: string;
  accessToken: string;
  apiBaseUrl: string;
}

export default function CustomerProfileClient({
  customerId,
  accessToken,
  apiBaseUrl,
}: CustomerProfileClientProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [riskProfile, setRiskProfile] = useState<CustomerRiskProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };

        const [custRes, acctRes, riskRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/v1/customers/${customerId}`, { headers }),
          fetch(`${apiBaseUrl}/api/v1/customers/${customerId}/accounts`, { headers }),
          fetch(`${apiBaseUrl}/api/v1/customers/${customerId}/risk-profile`, { headers }),
        ]);

        if (custRes.ok) setCustomer(await custRes.json());
        if (acctRes.ok) setAccounts(await acctRes.json());
        if (riskRes.ok) setRiskProfile(await riskRes.json());
      } catch {
        // Handled
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [customerId, accessToken, apiBaseUrl]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/customers/${customerId}/recalculate-risk`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const updated: CustomerRiskProfile = await res.json();
        setRiskProfile(updated);
        if (customer) {
          setCustomer({
            ...customer,
            current_risk_score: updated.current_risk_score,
            current_risk_category: updated.current_risk_category,
            risk_updated_at: updated.risk_updated_at,
          });
        }
      }
    } catch {
      // Handled
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border-border h-20 animate-pulse rounded-[var(--radius-card)] border"
          />
        ))}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-body text-text-secondary p-6 text-center">
        Customer not found.
      </div>
    );
  }

  const trendData: TrendPoint[] =
    riskProfile?.history.map((h) => ({
      date: h.recorded_at,
      score: h.risk_score,
      category: h.risk_category,
      reason: h.reason,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/customers"
            className="text-caption text-accent hover:underline"
          >
            ← Back to Customers
          </Link>
          <h1 className="text-page-title text-text-primary mt-2">
            {customer.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {customer.kyc_level && (
              <span className="text-label border-border text-text-secondary rounded-full border px-2 py-0.5 capitalize">
                KYC: {customer.kyc_level}
              </span>
            )}
            <RiskBadge category={customer.current_risk_category} />
            {customer.risk_updated_at && (
              <span className="text-caption text-text-secondary">
                Last evaluated: {new Date(customer.risk_updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface shadow-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {recalculating ? "Recalculating…" : "Recalculate Risk"}
        </button>
      </div>

      {/* Profile details */}
      <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
        <h2 className="text-section-title text-text-primary mb-4">Customer Profile</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 md:grid-cols-3">
          <div>
            <dt className="text-caption text-text-secondary">External Ref</dt>
            <dd className="text-body text-text-primary font-mono">
              {customer.external_ref ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">Country</dt>
            <dd className="text-body text-text-primary">
              {customer.country ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">Occupation</dt>
            <dd className="text-body text-text-primary">
              {customer.occupation ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">Date of Birth</dt>
            <dd className="text-body text-text-primary">
              {customer.date_of_birth
                ? new Date(customer.date_of_birth).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">Onboarded</dt>
            <dd className="text-body text-text-primary">
              {customer.onboarded_at
                ? new Date(customer.onboarded_at).toLocaleDateString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">Current Risk Score</dt>
            <dd className="text-body text-text-primary font-mono font-semibold">
              {customer.current_risk_score != null
                ? (customer.current_risk_score * 100).toFixed(1) + "%"
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Dynamic Risk Trend Chart */}
      <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-section-title text-text-primary">Risk Trend Analysis</h2>
          <span className="text-caption text-text-secondary">
            {trendData.length} evaluation points
          </span>
        </div>
        <TrendChart data={trendData} />
      </div>

      {/* Linked accounts */}
      <div className="border-border bg-surface rounded-[var(--radius-card)] border p-6 shadow-sm">
        <h2 className="text-h2 text-text-primary mb-4">
          Linked Accounts ({accounts.length})
        </h2>
        {accounts.length === 0 ? (
          <p className="text-body text-text-secondary">
            No accounts found for this customer.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-border border-b">
                <th className="text-label text-text-secondary px-3 py-2">
                  Account Number
                </th>
                <th className="text-label text-text-secondary px-3 py-2">
                  Type
                </th>
                <th className="text-label text-text-secondary px-3 py-2">
                  Currency
                </th>
                <th className="text-label text-text-secondary px-3 py-2">
                  Status
                </th>
                <th className="text-label text-text-secondary px-3 py-2">
                  Opened
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct) => (
                <tr
                  key={acct.account_id}
                  className="border-border border-b last:border-b-0"
                >
                  <td className="text-body font-mono px-3 py-2">
                    {acct.account_number}
                  </td>
                  <td className="text-caption text-text-secondary px-3 py-2 capitalize">
                    {acct.account_type ?? "—"}
                  </td>
                  <td className="text-caption px-3 py-2">{acct.currency}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-label rounded-full px-2 py-0.5 ${
                        acct.status === "active"
                          ? "bg-risk-low/10 text-risk-low"
                          : "bg-border text-text-secondary"
                      }`}
                    >
                      {acct.status}
                    </span>
                  </td>
                  <td className="text-caption text-text-secondary px-3 py-2">
                    {acct.opened_at
                      ? new Date(acct.opened_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
