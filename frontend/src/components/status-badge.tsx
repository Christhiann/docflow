import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/lib/types";

const styles: Record<DocumentStatus, { label: string; className: string; dot: string }> = {
  PENDING: {
    label: "Na fila",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  PROCESSING: {
    label: "Processando",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500 animate-pulse",
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Falhou",
    className: "bg-red-50 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const style = styles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        style.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}

export function statusLabel(status: DocumentStatus): string {
  return styles[status].label;
}
