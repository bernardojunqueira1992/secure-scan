

# Atualizar Relatório de Varredura — Resumo Executivo + Prompt IA + Quick Wins

## Mudanças

### 1. Domain layer (`src/domain/scan.ts`)
- Add `scoreToGrade(score: number): string` — maps score to letter grade (A+, A, A-, B+, ... F)
- Add `gradeColor(grade: string): string` — returns tailwind color class based on grade letter
- Add `countBySeverity(findings)` — returns `{ CRITICAL: n, HIGH: n, MEDIUM: n, LOW: n }`
- Update `pickQuickWins` to sort by severity ascending (LOW first, then MEDIUM) and limit to 3

### 2. ScanReport page (`src/pages/ScanReport.tsx`)

**Resumo Executivo section** (after header, before Quick Wins):
- Glassmorphism card (`backdrop-blur-xl bg-card/30 border-border/20`)
- Left: large circle with letter grade, dynamic color (green A/B, yellow C, red D/F)
- Center: numeric score "X/100"
- Right: 4 small severity counter cards in a row with colored dots (🔴 Críticos, 🟠 Altos, 🟡 Médios, 🟢 Baixos)

**Quick Wins** — simplified:
- Remove remediation text from quick win items
- Keep only: number badge + title + severity badge
- Sort by LOW first (ascending severity)

**AI Prompt button** on each finding card:
- Check `f.metadata` for `ai_prompt` field (metadata is `Json | null`, cast safely)
- When present: show a small ghost button "🤖 Copiar Prompt" next to the remediation box
- On click: `navigator.clipboard.writeText(prompt)`, show "Copiado!" for 2s via local state
- Use `useState` with a `copiedId` pattern to track which finding was just copied

### 3. Files to modify
| File | Change |
|------|--------|
| `src/domain/scan.ts` | Add `scoreToGrade`, `gradeColor`, `countBySeverity`; update `pickQuickWins` sort |
| `src/pages/ScanReport.tsx` | Add Executive Summary section, AI prompt button, simplify Quick Wins |

No database or migration changes needed — all data already exists in `findings.metadata` and `scans.score`.

