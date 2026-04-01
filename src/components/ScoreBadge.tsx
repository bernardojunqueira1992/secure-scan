import { cn } from "@/lib/utils";

export function ScoreBadge({ score, size = "md" }: { score: number | null; size?: "sm" | "md" | "lg" }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;

  const color = score >= 90 ? "text-primary bg-primary/10" : score >= 70 ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";
  const emoji = score >= 90 ? "🟢" : score >= 70 ? "🟡" : "🔴";
  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-2.5 py-1", lg: "text-2xl px-4 py-2 font-bold" };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-mono font-semibold", color, sizes[size])}>
      {size !== "sm" && emoji} {score}
    </span>
  );
}
