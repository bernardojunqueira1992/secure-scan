`.

---

## Auditoria Arquitetural — SecureScan

---

### 🚨 1. RED FLAGS (Alertas Criticos)

**1.1. Dominio Inexistente — 100% Anemico**
Nao existe uma camada de dominio. Zero. O projeto nao possui nenhuma pasta `domain/`, nenhuma entidade, nenhum Value Object, nenhuma regra de negocio encapsulada. Tudo e um "pass-through" direto do Supabase SDK para a UI.

- `Dashboard.tsx` (linhas 68-82): Monta o objeto `scanData` inline, faz `supabase.from("scans").insert()` e `supabase.from("scan_queue").insert()` diretamente no handler de evento do formulario. A "regra" de enfileirar um scan e procedural e acoplada ao componente React.
- `Sessions.tsx` (linhas 48-53): Validacao de JSON (`JSON.parse(cookies)`) feita dentro da `mutationFn` do React Query. Essa e uma regra de dominio (validar formato de cookies) vivendo na camada de apresentacao.
- `ScanReport.tsx` (linhas 39-47): Logica de agrupamento por severidade e selecao de "quick wins" embutida diretamente no componente de renderizacao.

**Veredicto**: Modelos sao 100% anemicos — o tipo `Tables<"scans">` importado do auto-generated `types.ts` e apenas um "saco de dados". Nao ha nenhuma entidade de dominio propria.

**1.2. Acoplamento Direto ao Supabase em Todas as Paginas**
Cada pagina importa `supabase` diretamente e faz queries inline:
- `Dashboard.tsx` — 3 chamadas diretas ao Supabase
- `ScanHistory.tsx` — 1 chamada direta
- `ScanReport.tsx` — 2 chamadas diretas
- `Sessions.tsx` — 3 chamadas diretas (select, insert, delete)

Nao existe nenhum Repository, nenhum Service, nenhuma camada de abstracao. Trocar o Supabase por qualquer outro backend exigiria reescrever **cada pagina**.

**1.3. Uso Criminoso de `any`**
- `Dashboard.tsx:67` — `const scanData: any = { ... }` — Type assertion preguicosa que esconde o tipo real do insert
- `Dashboard.tsx:73` — `const queueData: any = { ... }` — Idem
- `Dashboard.tsx:79` — `catch (err: any)` — Erro tratado como `any` em vez de `unknown`
- `Sessions.tsx:60` — `onError: (err: any)` — Mesmo problema
- `useAuth.tsx:6` — `signUp` retorna `Promise<{ error: any }>` — O tipo de erro do Supabase Auth e conhecido (`AuthError`), mas foi descartado com `any`
- `tsconfig.app.json` — `"strict": false`, `"noImplicitAny": false` — **O modo strict esta desligado.** Isso invalida qualquer DoD serio.

**1.4. Nenhuma Separacao de Camadas**
A estrutura `src/pages/` + `src/components/` + `src/hooks/` e flat. Nao ha:
- `src/domain/` — Entidades, Value Objects, regras
- `src/application/` ou `src/services/` — Use cases / application services
- `src/repositories/` — Abstracoes de acesso a dados

---

### 📊 2. DIAGNOSTICO DE METRICAS

**Coesao: BAIXA**
- `Dashboard.tsx` faz tudo: form state, submit handler, query de sessoes, query de scans, subscription realtime, formatacao de status, renderizacao. E uma "God Page" com ~140 linhas misturando 4 responsabilidades distintas.
- `ScanReport.tsx` mistura logica de agrupamento de dados, exportacao JSON/CSV, e renderizacao — 3 responsabilidades.

**Acoplamento: MAXIMO (Afferente e Eferente)**
- Toda pagina depende diretamente de: `@supabase/supabase-js`, `@tanstack/react-query`, `react-router-dom`, `date-fns`, `lucide-react`. Nao ha nenhuma camada intermediaria.
- O cliente Supabase e um singleton global importado por nome — impossivel de mockar em testes unitarios sem monkey-patching.

**Complexidade Ciclomatica: BAIXA-MODERADA**
- A complexidade ciclomatica por funcao e aceitavel (<10 na maioria). O problema nao e complexidade de controle de fluxo, mas sim **complexidade estrutural** (acoplamento).
- `ScoreBadge.tsx:6-7` usa ternarios encadeados (3 niveis) — menor, mas poderia ser um dispatch map.
- `Sessions.tsx:getStatus()` tem 4 branches — aceitavel, mas seria mais limpo como lookup table.

**Conascencia de Posicao: PRESENTE**
- `ScoreBadge({ score, size })` — 2 params, aceitavel.
- `complete_scan_job` RPC aceita 5-6 parametros posicionais no banco — nao afeta o frontend diretamente mas e um smell na API.

---

### 💡 3. PLANO DE REFATORACAO (Hands-on)

**Pior trecho: `Dashboard.tsx` linhas 64-82 — handleScan**

**ANTES** (acoplado, `any`, sem abstracao):
```typescript
// Dashboard.tsx — handler inline acoplado ao Supabase
const handleScan = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!url || !user) return;
  setScanning(true);
  try {
    const scanData: any = { url, user_id: user.id };
    if (sessionId && sessionId !== "none") scanData.session_id = sessionId;
    const { data: scan, error: scanError } = await supabase
      .from("scans").insert(scanData).select().single();
    if (scanError) throw scanError;
    // ... mais Supabase inline
  } catch (err: any) {
    toast({ title: "Erro", description: err.message, variant: "destructive" });
  }
};
```

**DEPOIS** (dominio isolado + repository + tipagem forte):

```typescript
// src/domain/scan.ts — Value Object puro, zero imports de infra
interface CreateScanParams {
  readonly url: string;
  readonly userId: string;
  readonly sessionId: string | null;
}

function buildScanInsert(params: CreateScanParams) {
  return {
    url: params.url,
    user_id: params.userId,
    ...(params.sessionId ? { session_id: params.sessionId } : {}),
  } as const;
}

// src/repositories/scanRepository.ts — contrato (interface)
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

interface ScanRepository {
  create(data: TablesInsert<"scans">): Promise<Tables<"scans">>;
  listRecent(limit: number): Promise<Tables<"scans">[]>;
}

// src/repositories/supabaseScanRepository.ts — implementacao concreta
import { supabase } from "@/integrations/supabase/client";
import type { ScanRepository } from "./scanRepository";

export const supabaseScanRepository: ScanRepository = {
  async create(data) {
    const { data: scan, error } = await supabase
      .from("scans").insert(data).select().single();
    if (error) throw error;
    return scan;
  },
  async listRecent(limit) {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};

// Dashboard.tsx — agora limpo
import { buildScanInsert } from "@/domain/scan";
import { supabaseScanRepository } from "@/repositories/supabaseScanRepository";

const handleScan = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!url || !user) return;
  setScanning(true);
  try {
    const insertData = buildScanInsert({
      url,
      userId: user.id,
      sessionId: sessionId !== "none" ? sessionId : null,
    });
    await supabaseScanRepository.create(insertData);
    toast({ title: "Varredura enfileirada", description: `Escaneando ${url}...` });
    setUrl("");
    refetchScans();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    toast({ title: "Erro", description: message, variant: "destructive" });
  } finally {
    setScanning(false);
  }
};
```

**Ganhos**: `any` eliminado, dominio puro (zero imports de infra), repository mockavel via interface para testes, handler do componente reduzido a orquestracao.

---

### 🛡️ 4. FUNCAO DE APTIDAO (Fitness Function)

**Opcao A — `dependency-cruiser` (recomendado, zero config de build)**

```javascript
// .dependency-cruiser.cjs
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-no-infra",
      comment: "Camada de domínio NUNCA pode importar infraestrutura",
      severity: "error",
      from: { path: "^src/domain/" },
      to: {
        path: [
          "^src/integrations/",
          "@supabase",
          "@tanstack",
          "react-router",
          "react",
        ],
      },
    },
    {
      name: "domain-no-ui",
      comment: "Domínio não pode importar componentes UI",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { path: "^src/components/" },
    },
    {
      name: "repository-interface-only",
      comment: "Pages/hooks devem usar interface do repository, não implementação direta do Supabase",
      severity: "warn",
      from: { path: "^src/(pages|hooks)/" },
      to: { path: "^src/integrations/supabase/client" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.app.json" },
  },
};
```

**CI script** (`package.json`):
```json
{
  "scripts": {
    "arch:check": "depcruise src --config .dependency-cruiser.cjs --output-type err"
  }
}
```

**Opcao B — Teste arquitetural com `ts-arch` (roda no Vitest)**

```typescript
// src/test/architecture.test.ts
import { filesOfProject } from "ts-arch";

describe("Fitness Functions — Limites Arquiteturais", () => {
  it("domain/ não importa supabase", async () => {
    const rule = filesOfProject()
      .inFolder("domain")
      .shouldNot()
      .dependOnFiles()
      .inFolder("integrations");

    await expect(rule).toPassAsync();
  });

  it("domain/ não importa React", async () => {
    const rule = filesOfProject()
      .inFolder("domain")
      .shouldNot()
      .dependOnFiles()
      .matchingPattern("react");

    await expect(rule).toPassAsync();
  });
});
```

---

### Resumo Executivo

| Pilar | Nota | Veredicto |
|-------|------|-----------|
| Dominio/DDD | 0/10 | Inexistente. 100% anemico. |
| Coesao | 3/10 | God Pages, responsabilidades misturadas |
| Acoplamento | 2/10 | Supabase hardcoded em toda pagina |
| Complexidade Ciclomatica | 7/10 | Aceitavel por funcao |
| DoD / Type Safety | 2/10 | `strict: false`, `any` disseminado |

**Prioridade #1**: Ligar `strict: true` no tsconfig e eliminar todos os `any`. Isso sozinho expoe dezenas de problemas escondidos.

**Prioridade #2**: Criar a camada `domain/` + `repositories/` e extrair a logica de negocio dos componentes React.

<lov-actions>
<lov-suggestion message="Implemente a refatoração arquitetural: crie as pastas domain/ e repositories/, extraia interfaces de repository para scans e sessions, e mova a lógica de negócio para fora dos componentes React">Implementar camada de domínio + repositories</lov-suggestion>
<lov-suggestion message="Ative strict: true e noImplicitAny: true no tsconfig.app.json e corrija todos os erros de tipagem resultantes, eliminando todos os usos de 'any'">Ativar strict mode e eliminar any</lov-suggestion>
<lov-suggestion message="Configure dependency-cruiser com as regras de fitness function arquitetural para garantir no CI que domain/ nunca importe infraestrutura">Configurar fitness functions no CI</lov-suggestion>
</lov-actions><lov-code></lov-code>
