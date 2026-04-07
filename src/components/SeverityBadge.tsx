import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  CRITICAL: "border-destructive/50 bg-destructive/10 text-destructive",
  HIGH: "border-destructive/30 bg-destructive/5 text-destructive",
  MEDIUM: "border-warning/50 bg-warning/10 text-warning",
  LOW: "border-muted-foreground/30 bg-muted text-muted-foreground",
  INFO: "border-primary/30 bg-primary/5 text-primary",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", severityStyles[severity] || "")}>
      {severity}
    </Badge>
  );
}
