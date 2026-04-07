

# Restringir Todas as Tabelas para Apenas Usuários Autenticados

## Problema
Todas as 8 políticas RLS usam o role `{public}`, que inclui tanto `anon` quanto `authenticated`. Isso significa que a anon key pode ler dados (mesmo que `auth.uid()` retorne NULL para anon, bloqueando na prática a maioria das queries — exceto `plans` que tem `USING (true)`).

## O que vai mudar

Recriar todas as políticas existentes trocando o role de `public` para `authenticated`:

| Tabela | Política | Mudança |
|---|---|---|
| `findings` | Users view findings of own scans | `public` → `authenticated` |
| `plans` | Plans are readable by everyone | `public` → `authenticated` |
| `scan_queue` | Users view own queue jobs | `public` → `authenticated` |
| `scan_sessions` | Users manage own sessions | `public` → `authenticated` |
| `scans` | Users insert own scans | `public` → `authenticated` |
| `scans` | Users update own scans | `public` → `authenticated` |
| `scans` | Users view own scans | `public` → `authenticated` |
| `scheduled_scans` | Users manage own scheduled scans | `public` → `authenticated` |
| `subscriptions` | Users view own subscription | `public` → `authenticated` |
| `scanner_heartbeats` | (nenhuma) | Adicionar SELECT para `authenticated` |

## Implementação

Uma única migration SQL que:
1. Dropa cada política existente
2. Recria com `TO authenticated` ao invés de `TO public`
3. Adiciona política SELECT para `scanner_heartbeats` restrita a `authenticated`

## Impacto
- Nenhuma mudança no frontend (usuários já precisam estar logados via `ProtectedRoute`)
- A Edge Function `scanner-gateway` não é afetada (usa `SERVICE_ROLE_KEY` que bypassa RLS)
- A tabela `plans` deixará de ser legível sem login — se houver uma página de pricing pública, precisará de ajuste

