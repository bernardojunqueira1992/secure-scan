import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Search, FlaskConical, BarChart3, Route, Database, Key, Code, FileStack, ShieldAlert, Globe } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface DiscoveryData {
  routes?: string[];
  tables?: string[];
  keys?: { type: string; source: string }[];
  edge_functions?: string[];
  migrations?: number;
}

interface TestsData {
  routes_without_auth?: string[];
  exposed_tables?: string[];
  exposed_edge_functions?: string[];
  exposed_apis?: string[];
}

interface ScanMetadata {
  discovery?: DiscoveryData;
  tests?: TestsData;
}

function parseScanMetadata(metadata: Json | null): ScanMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const m = metadata as Record<string, Json | undefined>;
  if (!m.discovery && !m.tests) return null;
  return metadata as unknown as ScanMetadata;
}

function ExpandableList({ items, emptyText = "Nenhum encontrado" }: { items: string[]; emptyText?: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return <p className="text-xs text-muted-foreground italic">{emptyText}</p>;

  const visible = expanded ? items : items.slice(0, 5);
  return (
    <div>
      <ul className="space-y-1">
        {visible.map((item, i) => (
          <li key={i} className="truncate font-mono text-xs text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
      {items.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Recolher" : `+${items.length - 5} mais`}
        </button>
      )}
    </div>
  );
}

function StatRow({ icon: Icon, label, count, warn }: { icon: React.ElementType; label: string; count: number; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${warn ? "text-warning" : "text-muted-foreground"}`} />
      <span className="flex-1 text-sm">{label}</span>
      <span className={`font-mono text-sm font-bold ${warn && count > 0 ? "text-warning" : "text-foreground"}`}>{count}</span>
    </div>
  );
}

interface ScanProcessSectionProps {
  metadata: Json | null;
}

export function ScanProcessSection({ metadata }: ScanProcessSectionProps) {
  const parsed = parseScanMetadata(metadata);
  if (!parsed) return null;

  const { discovery, tests } = parsed;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Discovery Card */}
      {discovery && (
        <Card className="border-border/20 bg-card/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              Descobertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <StatRow icon={Route} label="Rotas" count={discovery.routes?.length ?? 0} />
              <StatRow icon={Database} label="Tabelas" count={discovery.tables?.length ?? 0} />
              <StatRow icon={Key} label="Chaves" count={discovery.keys?.length ?? 0} />
              <StatRow icon={Code} label="Edge Functions" count={discovery.edge_functions?.length ?? 0} />
              {discovery.migrations != null && (
                <StatRow icon={FileStack} label="Migrations" count={discovery.migrations} />
              )}
            </div>

            <div className="space-y-3 border-t border-border/20 pt-3">
              {(discovery.routes?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Rotas</p>
                  <ExpandableList items={discovery.routes!} />
                </div>
              )}
              {(discovery.tables?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Tabelas</p>
                  <ExpandableList items={discovery.tables!} />
                </div>
              )}
              {(discovery.keys?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Chaves expostas</p>
                  <ExpandableList items={discovery.keys!.map(k => `${k.type} (${k.source})`)} />
                </div>
              )}
              {(discovery.edge_functions?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Edge Functions</p>
                  <ExpandableList items={discovery.edge_functions!} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests Card */}
      {tests && (
        <Card className="border-border/20 bg-card/30 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-warning" />
              Testes Realizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <StatRow icon={ShieldAlert} label="Rotas sem auth" count={tests.routes_without_auth?.length ?? 0} warn />
              <StatRow icon={Database} label="Tabelas expostas" count={tests.exposed_tables?.length ?? 0} warn />
              <StatRow icon={Code} label="Functions expostas" count={tests.exposed_edge_functions?.length ?? 0} warn />
              <StatRow icon={Globe} label="APIs expostas" count={tests.exposed_apis?.length ?? 0} warn />
            </div>

            <div className="space-y-3 border-t border-border/20 pt-3">
              {(tests.routes_without_auth?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">⚠️ Rotas sem autenticação</p>
                  <ExpandableList items={tests.routes_without_auth!} />
                </div>
              )}
              {(tests.exposed_tables?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">⚠️ Tabelas expostas</p>
                  <ExpandableList items={tests.exposed_tables!} />
                </div>
              )}
              {(tests.exposed_edge_functions?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">⚠️ Edge Functions expostas</p>
                  <ExpandableList items={tests.exposed_edge_functions!} />
                </div>
              )}
              {(tests.exposed_apis?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">⚠️ APIs expostas</p>
                  <ExpandableList items={tests.exposed_apis!} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary Card */}
      <Card className="border-border/20 bg-card/30 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Resultado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Veja o resumo executivo e os findings detalhados abaixo.
          </p>
          <button
            onClick={() => document.getElementById("executive-summary")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-3 text-xs text-primary hover:underline"
          >
            ↓ Ir para o resultado
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
