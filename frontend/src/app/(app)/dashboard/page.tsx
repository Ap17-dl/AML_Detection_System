export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <p className="text-h2 text-text-primary">Dashboard</p>
      <p className="text-body text-text-secondary max-w-sm">
        Transaction volumes, alert counts, and risk distribution will appear
        here once ingestion and alerting are built (Sprint 6).
      </p>
    </div>
  );
}
