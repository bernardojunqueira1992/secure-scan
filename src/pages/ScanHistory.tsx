import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

export default function ScanHistory() {
  const { data: scans } = useQuery({
    queryKey: ["all_scans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("scans")
        .select("id, url, status, score, created_at, session_id, scan_sessions(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []) as (Tables<"scans"> & { scan_sessions: { name: string } | null })[];
    },
  });

  const completedScans = scans?.filter((s) => s.status === "completed" && s.score !== null) || [];

  const chartData = [...completedScans]
    .reverse()
    .map((s) => ({
      date: format(new Date(s.created_at), "MM/dd"),
      score: s.score,
      url: s.url,
    }));

  const getTrend = (idx: number) => {
    if (idx >= completedScans.length - 1) return null;
    const current = completedScans[idx].score!;
    const prev = completedScans[idx + 1].score;
    if (prev === null) return null;
    if (current > prev) return "up";
    if (current < prev) return "down";
    return "stable";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient-primary">Scan History</h1>
          <p className="text-sm text-muted-foreground">Track your security posture over time</p>
        </div>

        {/* Score Trend Chart */}
        {chartData.length > 1 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
                    <XAxis dataKey="date" stroke="hsl(215, 14%, 50%)" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(215, 14%, 50%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 7%)",
                        border: "1px solid hsl(220, 14%, 16%)",
                        borderRadius: "8px",
                        color: "hsl(210, 20%, 92%)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(142, 71%, 45%)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scans Table */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">All Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {!scans?.length ? (
              <p className="py-8 text-center text-muted-foreground">No scans yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan, idx) => {
                    const trend = scan.status === "completed" ? getTrend(idx) : null;
                    return (
                      <TableRow key={scan.id}>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs">{scan.url}</TableCell>
                        <TableCell><ScoreBadge score={scan.score} size="sm" /></TableCell>
                        <TableCell>
                          {trend === "up" && <TrendingUp className="h-4 w-4 text-primary" />}
                          {trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                          {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {scan.scan_sessions?.name || "(public)"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{scan.status}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(scan.created_at), "PP")}
                        </TableCell>
                        <TableCell>
                          {scan.status === "completed" && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/scan/${scan.id}`}><ExternalLink className="h-3 w-3" /></Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
