

# Scan Process Visualization — Descobertas → Testes → Resultado

## Contexto

O relatório atual pula direto para os resultados. O usuário quer mostrar as 3 fases do scan: o que foi **descoberto**, o que foi **testado**, e depois os **resultados** (que já existem). Os dados dessas fases não existem hoje — o worker precisa enviá-los.

## Abordagem

### 1. Adicionar coluna `metadata` na tabela `scans`

A tabela `scans` não tem campo metadata. Adicionar `metadata jsonb DEFAULT '{}'` para o worker enviar os dados do processo.

Estrutura esperada do worker:

```json
{
  "discovery": {
    "routes": ["/ ", "/login", "/api/v1/users", ...],
    "tables": ["users", "plans", "scans", ...],
    "keys": [{"type": "anon_key", "source": "js_bundle"}],
    "edge_functions": ["scan-worker", "auth-callback"],
    "migrations": 12
  },
  "tests": {
    "routes_without_auth": ["/api/v1/users", "/api/health"],
    "exposed_tables": ["plans", "findings"],
    "exposed_edge_functions": [],
    "exposed_apis": ["/rest/v1/plans"]
  }
}
```

### 2. Nova seção "Processo do Scan" no relatório (entre Header e Resumo Executivo)

Três cards com Tabs ou accordion, usando o design cyber/glassmorphism do projeto:

**Card 1 — 🔍 Descobertas**
- Rotas descobertas (lista com contagem)
- Tabelas encontradas
- Chaves expostas (anon key, etc.)
- Edge Functions
- Migrations

**Card 2 — 🧪 Testes Realizados**
- Rotas sem auth (com ícone ⚠️ para as que falharam)
- Tabelas expostas
- Edge Functions expostas
- APIs e Webhooks expostos

**Card 3 — 📊 Resultado** → scroll suave para o Resumo Executivo existente

Layout: 3 colunas em desktop, stack em mobile. Cada card mostra contagem no header e lista expandível dos itens.

### 3. Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ALTER TABLE scans ADD COLUMN metadata jsonb DEFAULT '{}'` |
| `src/pages/ScanReport.tsx` | Nova seção `ScanProcess` com 3 cards, lê `scan.metadata` |
| `src/components/ScanProcessSection.tsx` | Novo componente para as 3 fases |

### 4. Prompt para o Worker

Após implementar, vou gerar o prompt exato para você ajustar o worker para popular `scans.metadata` com a estrutura `discovery` + `tests` no momento do `UPDATE` do scan.

### Sem breaking changes
- O campo `metadata` é nullable/default `{}`, então scans antigos continuam funcionando
- A seção só aparece se `scan.metadata?.discovery` existir

