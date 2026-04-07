import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Clock, Globe, Zap, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  groupFindingsBySeverity,
  pickQuickWins,
  SEVERITY_LABELS,
  scoreToGrade,
  gradeColor,
  gradeBgColor,
  countBySeverity,
} from "@/domain/scan";
import { supabaseScanRepository } from "@/repositories/supabaseScanRepository";
import { ScanProcessSection } from "@/components/ScanProcessSection";
import { supabaseFindingRepository } from "@/repositories/supabaseFindingRepository";
import type { Json } from "@/integrations/supabase/types";

function getAiPrompt(metadata: Json | null): string | null {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const prompt = (metadata as Record<string, Json | undefined>).ai_prompt;
    if (typeof prompt === "string" && prompt.length > 0) return prompt;
  }
  return null;
}

export default function ScanReport() {
  const { id } = useParams<{ id: string }>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: scan } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => supabaseScanRepository.getById(id!),
    enabled: !!id,
  });

  const { data: findings } = useQuery({
    queryKey: ["findings", id],
    queryFn: () => supabaseFindingRepository.listByScan(id!),
    enabled: !!id,
  });

  const groupedFindings = findings ? groupFindingsBySeverity(findings) : {};
  const quickWins = findings ? pickQuickWins(findings) : [];
  const severityCounts = findings ? countBySeverity(findings) : { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  const grade = scan?.score != null ? scoreToGrade(scan.score) : null;

  const handleCopyPrompt = async (findingId: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(findingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

        {/* Executive Summary */}
        {scan.score != null && grade && (
          <Card className="border-border/20 bg-card/30 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
                {/* Grade circle */}
                <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 ${gradeBgColor(grade)}`}>
                  <span className={`font-mono text-3xl font-bold ${gradeColor(grade)}`}>{grade}</span>
                </div>

                {/* Score */}
                <div className="text-center md:text-left">
                  <p className="font-mono text-4xl font-bold text-foreground">{scan.score}<span className="text-lg text-muted-foreground">/100</span></p>
                  <p className="mt-1 text-sm text-muted-foreground">Score de Segurança</p>
                </div>

                {/* Severity counters */}
                <div className="flex flex-1 flex-wrap justify-center gap-3 md:justify-end">
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/50 px-4 py-2">
                    <span className="text-sm">🔴</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Críticos</p>
                      <p className="font-mono text-lg font-bold text-destructive">{severityCounts.CRITICAL}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/50 px-4 py-2">
                    <span className="text-sm">🟠</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Altos</p>
                      <p className="font-mono text-lg font-bold text-destructive">{severityCounts.HIGH}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/50 px-4 py-2">
                    <span className="text-sm">🟡</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Médios</p>
                      <p className="font-mono text-lg font-bold text-warning">{severityCounts.MEDIUM}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/50 px-4 py-2">
                    <span className="text-sm">🟢</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Baixos</p>
                      <p className="font-mono text-lg font-bold text-primary">{severityCounts.LOW}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-primary">
                <Zap className="h-5 w-5" /> Vitórias Rápidas
              </CardTitle>
              <CardDescription>Problemas mais fáceis de corrigir com maior impacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickWins.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3 rounded-md border border-border/30 bg-card/50 px-3 py-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium">{f.title}</p>
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
                <span>{items!.length} {items!.length === 1 ? "problema" : "problemas"} {SEVERITY_LABELS[severity] || severity.toLowerCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items!.map((f) => {
                const aiPrompt = getAiPrompt(f.metadata);
                return (
                  <div key={f.id} className="rounded-md border border-border/30 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{f.title}</h4>
                        {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
                        {f.location && (
                          <p className="mt-2 font-mono text-xs text-muted-foreground">📍 {f.location}</p>
                        )}
                        {f.remediation && (
                          <div className="mt-2 flex items-start gap-2">
                            <div className="flex-1 rounded bg-primary/5 px-3 py-2 text-sm text-primary">
                              💡 {f.remediation}
                            </div>
                            {aiPrompt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => handleCopyPrompt(f.id, aiPrompt)}
                              >
                                {copiedId === f.id ? (
                                  <><Check className="mr-1 h-3 w-3" /> Copiado!</>
                                ) : (
                                  <><Copy className="mr-1 h-3 w-3" /> 🤖 Copiar Prompt</>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        {!f.remediation && aiPrompt && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-primary"
                              onClick={() => handleCopyPrompt(f.id, aiPrompt)}
                            >
                              {copiedId === f.id ? (
                                <><Check className="mr-1 h-3 w-3" /> Copiado!</>
                              ) : (
                                <><Copy className="mr-1 h-3 w-3" /> 🤖 Copiar Prompt</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
