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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-xl flex flex-col gap-4">
        <div>
          <h3 className="text-section-title text-text-primary">{title}</h3>
          <p className="text-body text-text-secondary mt-1">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 border-t pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg transition-colors"
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
