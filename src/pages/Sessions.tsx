import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Cookie, Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSessionStatus, buildSessionInsert } from "@/domain/session";
import { supabaseSessionRepository } from "@/repositories/supabaseSessionRepository";

export default function Sessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [urlPattern, setUrlPattern] = useState("");
  const [cookies, setCookies] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["scan_sessions"],
    queryFn: () => supabaseSessionRepository.list(),
  });

  const createSession = useMutation({
    mutationFn: async () => {
      const data = buildSessionInsert({
        userId: user!.id,
        name,
        urlPattern,
        cookies,
      });
      await supabaseSessionRepository.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan_sessions"] });
      toast({ title: "Sessão criada", description: `"${name}" está pronta para uso nas varreduras.` });
      setOpen(false);
      setName("");
      setUrlPattern("");
      setCookies("");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro", description: message, variant: "destructive" });
    },
  });

  const deleteSession = useMutation({
    mutationFn: (id: string) => supabaseSessionRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan_sessions"] });
      toast({ title: "Sessão excluída" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Sessões de Login</h1>
            <p className="text-sm text-muted-foreground">Gerencie sessões de cookies para varredura autenticada</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Sessão</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Adicionar Sessão de Login</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createSession.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Sessão</Label>
                  <Input placeholder="Admin Produção" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Padrão de URL</Label>
                  <Input placeholder="https://meuapp.com/*" value={urlPattern} onChange={(e) => setUrlPattern(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Wildcards suportados: *, **</p>
                </div>
                <div className="space-y-2">
                  <Label>Cookies (formato JSON)</Label>
                  <Textarea
                    placeholder={'[\n  {\n    "name": "session_token",\n    "value": "abc123...",\n    "domain": ".meuapp.com"\n  }\n]'}
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    required
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold">📖 Como exportar cookies:</p>
                  <p>1. Instale a extensão EditThisCookie</p>
                  <p>2. Faça login no seu site</p>
                  <p>3. Clique no ícone da extensão → Exportar → Copiar JSON</p>
                  <p>4. Cole aqui</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cookie className="h-3 w-3" /> Cookies são armazenados com segurança e nunca compartilhados
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createSession.isPending}>
                    {createSession.isPending ? "Salvando..." : "Salvar Sessão"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !sessions?.length ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Cookie className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Nenhuma sessão de login ainda</p>
              <p className="text-sm text-muted-foreground">Adicione uma sessão para escanear páginas autenticadas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const status = getSessionStatus(session.expires_at);
              return (
                <Card key={session.id} className="border-border/50 bg-card/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${status.dot}`} />
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{session.url_pattern}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className={status.color}>{status.label}</span>
                          {session.last_used_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Usado {formatDistanceToNow(new Date(session.last_used_at), { addSuffix: true, locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession.mutate(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
