"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const btnColor =
    confirmVariant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-accent hover:bg-accent/90 text-surface";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="border-border bg-surface flex w-full max-w-md flex-col gap-4 rounded-[var(--radius-card)] border p-6 shadow-xl">
        <div>
          <h3 className="text-section-title text-text-primary">{title}</h3>
          <p className="text-body text-text-secondary mt-1">{description}</p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="border-border text-text-secondary hover:bg-bg rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${btnColor}`}
          >
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
