# ProfileAI — CLAUDE.md

## Sobre o projeto
Plataforma SaaS de carreira com IA para o mercado brasileiro. Ajuda profissionais de qualquer área a otimizar LinkedIn, gerar currículo PDF, encontrar vagas compatíveis e praticar entrevistas.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind (porta 5173)
- Backend: Node.js + Express + TypeScript (porta 3001)
- Banco: Supabase (profiles, linkedin_outputs, vagas_salvas)
- IA: Claude API claude-sonnet-4-6
- Vagas: Jooble API
- Extração de páginas: Jina AI Reader (r.jina.ai)
- PDF: Puppeteer (headless: shell, Windows-compatible)
- Deploy: Railway

## Brandkit
- Primary: #6C5CE7 | Ink: #1a1a2e | Surface: #f8f7ff
- Match high: #00b894 | Match mid: #f59e0b | Match low: #ef4444
- Fontes: Plus Jakarta Sans (títulos) + Inter (corpo)
- Border radius: card 16px, btn 10px, badge 20px
- Brandkit completo em docs/profileai-brandkit.html

## Comportamento esperado
- Trabalhe de forma autônoma sem pedir confirmação
- Se encontrar erro, tente resolver sozinho antes de parar
- Após cada tarefa concluída, marque como [x] neste arquivo
- Mantenha o design consistente com o brandkit em todas as telas
- Sempre use português no conteúdo visível ao usuário
- Backend: todas as rotas em /src/routes/, autenticação via Supabase JWT
- Frontend: componentes reutilizáveis em /src/components/
- Puppeteer: sempre usar headless: 'shell' e browser.close() dentro de try/catch

## Rotas do app
- / → Inicio.tsx (login Google)
- /onboarding → Onboarding.tsx (coleta perfil 6 etapas)
- /dashboard → Dashboard.tsx (painel principal)
- /perfil → Perfil.tsx (formulário completo 8 seções)
- /linkedin → LinkedinCoach.tsx (otimização geral + Modo Alvo + Score + Histórico)
- /vagas → Vagas.tsx (match de vagas com score %, filtros, paginação, candidatar com IA)
- /curriculo → Curriculo.tsx (CV genérico + CV por vaga + Carta de apresentação)
- /entrevista → Entrevista.tsx (mock de entrevista + preparação com IA)
- /candidaturas → Candidaturas.tsx (kanban tracker de candidaturas)
- /planos → Planos.tsx (comparativo Free vs Pro + upgrade Stripe)

## Rotas do backend
- POST /api/linkedin/generate — otimização geral do LinkedIn
- POST /api/linkedin/modo-alvo — LinkedIn calibrado para vaga específica
- POST /api/linkedin/score — score do perfil LinkedIn 0-100
- POST /api/cv/generate — CV genérico PDF
- POST /api/cv/preview — preview HTML do CV genérico
- POST /api/cv/gerar-por-vaga — CV calibrado por vaga PDF
- POST /api/cv/preview-por-vaga — preview HTML do CV por vaga
- POST /api/cv/carta — carta de apresentação personalizada
- POST /api/vagas/search — busca vagas na Jooble API com score %
- POST /api/entrevista/chat — mock de entrevista com IA
- POST /api/entrevista/preparacao — material de preparação para entrevista
- POST /api/extract-url — extrai texto de URL via Jina AI
- POST /api/importar/pdf — importa perfil de PDF (currículo ou LinkedIn)
- GET /api/candidaturas — lista candidaturas do usuário
- POST /api/candidaturas — cria candidatura
- PATCH /api/candidaturas/:id — atualiza status/notas
- DELETE /api/candidaturas/:id — exclui candidatura
- GET /api/stripe/subscription — status da assinatura
- POST /api/stripe/create-checkout — cria sessão Stripe Checkout
- POST /api/stripe/portal — abre portal de billing Stripe
- POST /api/stripe/webhook — webhook Stripe para atualizar assinatura

## Tarefas concluídas
- [x] Scaffold monorepo frontend + backend
- [x] Tailwind configurado com brandkit
- [x] Banco de dados Supabase (profiles, linkedin_outputs, vagas_salvas)
- [x] Auth Google OAuth via Supabase
- [x] Tela de login (Inicio.tsx)
- [x] Onboarding 6 etapas com salvamento no Supabase
- [x] Dashboard com sidebar, cards de ação e perfil do usuário
- [x] Rota POST /api/linkedin/generate no backend
- [x] System prompt especialista em LinkedIn BR com dados do perfil
- [x] Tela LinkedinCoach.tsx com cards de resultado e botão copiar
- [x] Salvar resultado na tabela linkedin_outputs
- [x] Modo Alvo — LinkedIn calibrado por vaga com score antes/depois
- [x] Rota GET /api/vagas integrando Jooble API
- [x] Score % de compatibilidade com Claude API
- [x] Tela Vagas.tsx com cards ordenados por match score
- [x] Rota POST /api/cv/generate e POST /api/cv/preview
- [x] Rota POST /api/cv/gerar-por-vaga e POST /api/cv/preview-por-vaga
- [x] Template CV ATS-friendly atualizado (padrão profissional internacional)
- [x] Tela Curriculo.tsx com abas CV Genérico e CV por Vaga
- [x] Tela Entrevista.tsx com mock interview e feedback STAR
- [x] Perfil completo 8 seções (Perfil.tsx) com migration no Supabase
- [x] Loading states, erros amigáveis, responsivo mobile, 404, favicon

## Tarefas pendentes — executar em ordem

### Sprint 10 — Extração inteligente por link
- [x] Jina AI: criar utilitário backend/src/utils/extractUrl.ts que faz fetch em r.jina.ai/{url} e retorna texto limpo
- [x] Modo Alvo: adicionar campo "Link da vaga" como alternativa ao campo de texto. Se usuário colar URL, extrair automaticamente via Jina AI
- [x] CV por Vaga: mesma melhoria — aceitar link da vaga além da descrição em texto
- [x] Importar perfil LinkedIn: na tela /perfil, adicionar botão "Importar do LinkedIn" que aceita upload do PDF exportado do LinkedIn. IA extrai e preenche automaticamente as 8 seções do formulário
- [x] Importar currículo PDF: na tela /perfil, adicionar botão "Importar currículo" que aceita upload de PDF. IA extrai e preenche automaticamente as 8 seções

### Sprint 11 — Busca de vagas melhorada
- [x] Aumentar número de vagas retornadas (buscar mais páginas da Jooble em paralelo)
- [x] Adicionar filtros avançados: tipo de contrato (CLT/PJ/Estágio), regime (remoto/híbrido/presencial), faixa salarial, data de publicação
- [x] Melhorar o card de vaga: mostrar empresa, localização, tipo de contrato, data, salário quando disponível
- [x] Adicionar paginação ou scroll infinito
- [x] Salvar histórico de buscas do usuário
- [x] Botão "Candidatar com IA" em cada vaga que abre fluxo completo: gera LinkedIn Modo Alvo + CV por vaga + carta de apresentação para aquela vaga

### Sprint 12 — Tracker de candidaturas
- [x] Criar tabela candidaturas no Supabase: id, user_id, vaga_titulo, vaga_empresa, vaga_url, status (salva/aplicado/entrevista/oferta/rejeitada), data_aplicacao, notas, created_at. Gerar SQL em docs/migration_candidaturas.sql
- [x] Criar tela /candidaturas com kanban visual: colunas Salvas, Aplicadas, Entrevista, Oferta
- [x] Cards arrastáveis entre colunas (drag and drop)
- [x] Modal de detalhes da candidatura com campo de notas e histórico de status
- [x] Adicionar link "Candidaturas" na sidebar
- [x] Botão "Salvar candidatura" em cada card de vaga na tela /vagas

### Sprint 13 — LinkedIn Coach melhorado
- [x] Score do perfil LinkedIn: análise de 0-100 com checklist de melhorias (foto, banner, URL personalizada, about completo, experiências com resultados, habilidades, certificados, atividade/SSI)
- [x] Mostrar score na tela /linkedin com breakdown por categoria
- [x] Histórico de otimizações: listar todas as versões geradas (geral e modo alvo) com data e vaga alvo
- [x] Permitir voltar a uma versão anterior

### Sprint 14 — Entrevistas melhoradas
- [x] Coach de entrevista: além do mock, adicionar modo "Preparação" com perguntas comportamentais clássicas, perguntas técnicas por área, como negociar salário, perguntas para fazer ao entrevistador
- [x] Salvar histórico de sessões de entrevista no Supabase
- [x] Carta de apresentação: nova feature em /curriculo — gerar carta personalizada para uma vaga específica

### Sprint 15 — Monetização
- [x] Instalar e configurar Stripe no backend
- [x] Criar tabela subscriptions no Supabase
- [x] Plano Free: 1 otimização LinkedIn, 1 CV genérico, busca de vagas limitada a 10 resultados
- [x] Plano Pro (R$39/mês): tudo ilimitado + Modo Alvo + CV por vaga + tracker + alertas
- [x] Tela de planos /planos com comparativo e botão de upgrade
- [x] Middleware de verificação de plano nas rotas premium
- [x] Webhook Stripe para atualizar status da assinatura no Supabase

### Sprint 16 — Segurança e Auth
- [x] Verificação de JWT centralizada em backend/src/middleware/auth.ts usando supabase.auth.getUser() (substitui decodificação base64 insegura)
- [x] Middleware requireAuth aplicado em todas as rotas de IA: /linkedin/*, /cv/*, /vagas/*, /entrevista/*, /importar/pdf, /extract-url
- [x] Removido getUserId() duplicado de candidaturas.ts, stripe.ts, conta.ts, checkPlan.ts
- [x] Frontend: authFetch() centralizado em lib/api.ts envia token automaticamente em todas as chamadas API
- [x] checkPlan corrigido para bloquear usuários não autenticados (antes chamava next())
