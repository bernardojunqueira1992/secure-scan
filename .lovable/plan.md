

# Traduzir toda a interface para Português (BR)

## Escopo
Substituir todos os textos hardcoded em inglês por português brasileiro em todas as páginas e componentes. Sem sistema de i18n — substituição direta.

## Arquivos a alterar

### 1. `index.html`
- Title: "SecureScan — Varredura de Segurança Automatizada"
- Meta descriptions em PT-BR

### 2. `src/pages/Index.tsx` (Landing page)
- Nav: "Entrar", "Comece Grátis"
- Hero: "Encontre vulnerabilidades antes dos atacantes", badge, descrição
- Terminal mock em PT-BR
- Features: títulos e descrições dos 6 cards
- Pricing: nomes dos planos, CTAs, features list
- Footer

### 3. `src/pages/Auth.tsx`
- "Bem-vindo de Volta" / "Comece Agora"
- "Entre na sua conta SecureScan" / "Crie sua conta gratuita"
- Labels: "E-mail", "Senha"
- Botões: "Entrar", "Criar Conta"
- "Não tem conta?" / "Já tem conta?"
- Toasts: "Conta criada", "Verifique seu e-mail..."

### 4. `src/components/AppLayout.tsx`
- Nav items: "Painel", "Histórico", "Sessões"
- "Sair"

### 5. `src/pages/Dashboard.tsx`
- "Painel", "Escaneie qualquer URL..."
- "Escaneamento Rápido", "Escanear Agora"
- "Escaneamentos Recentes", "Nenhum escaneamento ainda..."
- Cabeçalhos da tabela: URL, Pontuação, Sessão, Status, Data
- Placeholder: "Sem sessão", "Público (sem sessão)"
- Toasts

### 6. `src/pages/ScanReport.tsx`
- "Relatório de Escaneamento", "Voltar"
- "Vitórias Rápidas", "Problemas mais fáceis de corrigir"
- Contagem de issues por severidade
- "Nenhuma vulnerabilidade encontrada!", "Sua aplicação passou em todos os testes."

### 7. `src/pages/ScanHistory.tsx`
- "Histórico de Escaneamentos", "Acompanhe sua postura de segurança"
- "Tendência de Pontuação", "Todos os Escaneamentos"
- Cabeçalhos da tabela
- "Nenhum escaneamento ainda"

### 8. `src/pages/Sessions.tsx`
- "Sessões de Login", "Gerencie sessões de cookies..."
- Dialog: "Adicionar Sessão de Login"
- Labels: "Nome da Sessão", "Padrão de URL", "Cookies (formato JSON)"
- Instruções de exportação de cookies
- "Cookies armazenados com segurança..."
- Status: "Sem expiração", "Expirado", "Expirando em breve", "Ativo"
- Botões: "Cancelar", "Salvar Sessão", "Salvando..."

### 9. `src/pages/NotFound.tsx`
- "Página não encontrada", "Voltar para o Início"

### 10. `src/components/ScoreBadge.tsx` e `src/components/SeverityBadge.tsx`
- Verificar se têm textos para traduzir

## Detalhes técnicos
- Substituição direta de strings — sem biblioteca de i18n
- Manter `date-fns` locale como `ptBR` para formatação de datas (importar `{ ptBR }` de `date-fns/locale`)
- Manter termos técnicos como "CORS", "CSP", "HSTS", "API keys" em inglês
- Status de scan (`pending`, `running`, `completed`, `failed`) traduzir na exibição mas manter valores do banco em inglês

