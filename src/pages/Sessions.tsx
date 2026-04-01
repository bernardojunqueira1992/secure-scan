import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Cookie, Plus, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, isPast } from "date-fns";

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
    queryFn: async () => {
      const { data } = await supabase.from("scan_sessions").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const createSession = useMutation({
    mutationFn: async () => {
      // Validate JSON
      try { JSON.parse(cookies); } catch { throw new Error("Invalid JSON. Please paste valid cookie JSON."); }

      const { error } = await supabase.from("scan_sessions").insert({
        user_id: user!.id,
        name,
        url_pattern: urlPattern,
        cookies_encrypted: cookies,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan_sessions"] });
      toast({ title: "Session created", description: `"${name}" is ready to use in scans.` });
      setOpen(false);
      setName("");
      setUrlPattern("");
      setCookies("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scan_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan_sessions"] });
      toast({ title: "Session deleted" });
    },
  });

  const getStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: "No expiry", color: "text-muted-foreground", dot: "bg-muted-foreground" };
    if (isPast(new Date(expiresAt))) return { label: "Expired", color: "text-destructive", dot: "bg-destructive" };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 86400000) return { label: "Expiring soon", color: "text-warning", dot: "bg-warning" };
    return { label: "Active", color: "text-primary", dot: "bg-primary" };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">Login Sessions</h1>
            <p className="text-sm text-muted-foreground">Manage cookie sessions for authenticated scanning</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Login Session</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createSession.mutate(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Name</Label>
                  <Input placeholder="Production Admin" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>URL Pattern</Label>
                  <Input placeholder="https://myapp.com/*" value={urlPattern} onChange={(e) => setUrlPattern(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Wildcards supported: *, **</p>
                </div>
                <div className="space-y-2">
                  <Label>Cookies (JSON format)</Label>
                  <Textarea
                    placeholder={'[\n  {\n    "name": "session_token",\n    "value": "abc123...",\n    "domain": ".myapp.com"\n  }\n]'}
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    required
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold">📖 How to export cookies:</p>
                  <p>1. Install EditThisCookie extension</p>
                  <p>2. Login to your site</p>
                  <p>3. Click extension icon → Export → Copy JSON</p>
                  <p>4. Paste here</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cookie className="h-3 w-3" /> Cookies are stored securely and never shared
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSession.isPending}>
                    {createSession.isPending ? "Saving..." : "Save Session"}
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
              <p className="mt-4 text-muted-foreground">No login sessions yet</p>
              <p className="text-sm text-muted-foreground">Add a session to scan authenticated pages</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const status = getStatus(session.expires_at);
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
                              Used {formatDistanceToNow(new Date(session.last_used_at), { addSuffix: true })}
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
