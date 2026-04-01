import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Clock, Globe, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ScanReport() {
  const { id } = useParams<{ id: string }>();

  const { data: scan } = useQuery({
    queryKey: ["scan", id],
    queryFn: async () => {
      const { data } = await supabase.from("scans").select("*").eq("id", id!).single();
      return data;
    },
  });

  const { data: findings } = useQuery({
    queryKey: ["findings", id],
    queryFn: async () => {
      const { data } = await supabase.from("findings").select("*").eq("scan_id", id!).order("severity");
      return data || [];
    },
  });

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const severityLabels: Record<string, string> = {
    CRITICAL: "crítico",
    HIGH: "alto",
    MEDIUM: "médio",
    LOW: "baixo",
  };
  const groupedFindings = severityOrder.reduce((acc, sev) => {
    const items = findings?.filter((f) => f.severity === sev) || [];
    if (items.length) acc[sev] = items;
    return acc;
  }, {} as Record<string, typeof findings>);

  const quickWins = findings
    ?.filter((f) => f.severity === "MEDIUM" || f.severity === "LOW")
    .slice(0, 3) || [];

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ scan, findings }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `securescan-${id}.json`;
    a.click();
  };

  const exportCSV = () => {
    if (!findings?.length) return;
    const headers = "Severidade,Tipo,Título,Localização,Remediação\n";
    const rows = findings.map((f) =>
      `${f.severity},${f.type},"${f.title}","${f.location || ""}","${f.remediation || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `securescan-${id}.csv`;
    a.click();
  };

  if (!scan) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="font-mono text-xl font-bold">Relatório de Varredura</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{scan.url}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {format(new Date(scan.created_at), "PPp", { locale: ptBR })}
              </span>
              {scan.scan_duration_ms && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {(scan.scan_duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScoreBadge score={scan.score} size="lg" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportJSON}>
                <Download className="mr-1 h-3 w-3" /> JSON
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-1 h-3 w-3" /> CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <Zap className="h-5 w-5" /> Vitórias Rápidas
              </CardTitle>
              <CardDescription>Problemas mais fáceis de corrigir com maior impacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickWins.map((f, i) => (
                <div key={f.id} className="flex items-start gap-3 rounded-md border border-border/30 bg-card/50 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    {f.remediation && <p className="mt-1 text-xs text-muted-foreground">{f.remediation}</p>}
                  </div>
                  <SeverityBadge severity={f.severity} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Findings by Severity */}
        {Object.entries(groupedFindings).map(([severity, items]) => (
          <Card key={severity} className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SeverityBadge severity={severity} />
                <span>{items!.length} {items!.length === 1 ? "problema" : "problemas"} {severityLabels[severity] || severity.toLowerCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items!.map((f) => (
                <div key={f.id} className="rounded-md border border-border/30 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{f.title}</h4>
                      {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
                      {f.location && (
                        <p className="mt-2 font-mono text-xs text-muted-foreground">📍 {f.location}</p>
                      )}
                      {f.remediation && (
                        <div className="mt-2 rounded bg-primary/5 px-3 py-2 text-sm text-primary">
                          💡 {f.remediation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {!findings?.length && scan.status === "completed" && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-12 text-center">
              <p className="text-2xl">🎉</p>
              <p className="mt-2 text-lg font-semibold text-primary">Nenhuma vulnerabilidade encontrada!</p>
              <p className="text-sm text-muted-foreground">Sua aplicação passou em todos os testes de segurança.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
