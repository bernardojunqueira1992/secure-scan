import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Shield, Search, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

const statusLabels: Record<string, string> = {
  pending: "pendente",
  running: "executando",
  completed: "concluído",
  failed: "falhou",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [sessionId, setSessionId] = useState<string>("none");
  const [scanning, setScanning] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ["scan_sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("scan_sessions").select("id, name, url_pattern, expires_at").order("name");
      return data || [];
    },
  });

  const { data: recentScans, refetch: refetchScans } = useQuery({
    queryKey: ["recent_scans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scans")
        .select("id, url, status, score, created_at, session_id, scan_sessions(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return (data || []) as (Tables<"scans"> & { scan_sessions: { name: string } | null })[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('scans-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scans',
      }, () => {
        refetchScans();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetchScans]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    setScanning(true);
    try {
      const scanData: any = { url, user_id: user.id };
      if (sessionId && sessionId !== "none") scanData.session_id = sessionId;

      const { data: scan, error: scanError } = await supabase.from("scans").insert(scanData).select().single();
      if (scanError) throw scanError;

      const queueData: any = { scan_id: scan.id };
      if (sessionId && sessionId !== "none") queueData.session_id = sessionId;

      await supabase.from("scan_queue").insert(queueData);

      toast({ title: "Varredura enfileirada", description: `Escaneando ${url}...` });
      setUrl("");
      refetchScans();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return "✓";
    if (status === "failed") return "✗";
    if (status === "running") return "⟳";
    return "⏳";
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Painel</h1>
          <p className="text-sm text-muted-foreground">Escaneie qualquer URL em busca de vulnerabilidades de segurança</p>
        </div>

        {/* Quick Scan */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-primary" /> Escaneamento Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="flex flex-col gap-4 sm:flex-row">
              <Input
                placeholder="https://meuapp.com/admin"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                required
                className="flex-1"
              />
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sem sessão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Público (sem sessão)</SelectItem>
                  {sessions?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={scanning} className="min-w-[120px]">
                {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                Escanear
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Escaneamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentScans?.length ? (
              <p className="py-8 text-center text-muted-foreground">Nenhum escaneamento ainda. Inicie seu primeiro escaneamento acima!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Pontuação</TableHead>
                    <TableHead>Sessão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs">{scan.url}</TableCell>
                      <TableCell><ScoreBadge score={scan.score} size="sm" /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {scan.scan_sessions?.name || "(público)"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {statusIcon(scan.status)} {statusLabels[scan.status] || scan.status}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {scan.status === "completed" && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/scan/${scan.id}`}><ExternalLink className="h-3 w-3" /></Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
