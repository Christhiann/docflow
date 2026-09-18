import { cn } from "@/lib/utils";

interface AlertProps {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

const tones = {
  error: "bg-red-50 text-red-800 border-red-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  info: "bg-accent-soft text-accent-dark border-accent/20",
};

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded border px-3 py-2 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}
