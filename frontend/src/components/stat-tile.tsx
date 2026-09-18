import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number;
  accent?: "neutral" | "amber" | "emerald" | "red";
  isLoading?: boolean;
}

const accents = {
  neutral: "text-ink",
  amber: "text-amber-700",
  emerald: "text-emerald-700",
  red: "text-red-700",
};

export function StatTile({ label, value, accent = "neutral", isLoading }: StatTileProps) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", accents[accent])}>
        {isLoading ? "—" : value}
      </p>
    </div>
  );
}
