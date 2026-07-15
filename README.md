# ProfileAI

Plataforma SaaS de carreira com inteligencia artificial para o mercado brasileiro. Ajuda profissionais de qualquer area a otimizar seu LinkedIn, gerar curriculos PDF, encontrar vagas compativeis com score de match e praticar entrevistas com IA.

## Features

### LinkedIn Coach
- **Otimizacao geral** — gera headline, about, palavras-chave SEO e dicas personalizadas
- **Modo Alvo** — recalibra o perfil LinkedIn para uma vaga especifica com score antes/depois
- **Score 0-100** — analise do perfil com breakdown por categoria (foto, headline, about, experiencias, habilidades, certificacoes, atividade)
- **Historico** — todas as versoes geradas ficam salvas com data e vaga-alvo

### Match de Vagas
- Busca em tempo real via Jooble API com score de compatibilidade calculado por IA
- Filtros avancados: tipo de contrato (CLT/PJ/Estagio), regime (remoto/hibrido/presencial), faixa salarial, data de publicacao
- Botao "Candidatar com IA" que gera LinkedIn Modo Alvo + CV por vaga + carta de apresentacao

### Curriculo
- **CV generico** — PDF ATS-friendly gerado a partir do perfil completo
- **CV por vaga** — PDF calibrado para uma vaga especifica (aceita link ou descricao)
- **Carta de apresentacao** — personalizada para cada vaga
- Preview HTML antes de gerar o PDF

### Entrevistas
- **Mock interview** — simulacao com perguntas da area e feedback no metodo STAR
- **Modo preparacao** — perguntas comportamentais, tecnicas, negociacao salarial e perguntas para fazer ao entrevistador
- Historico de sessoes salvo no Supabase

### Tracker de Candidaturas
- Kanban visual com colunas: Salvas, Aplicadas, Entrevista, Oferta
- Cards arrastaveis entre colunas (drag and drop)
- Modal de detalhes com campo de notas e historico de status
- Salvar candidatura direto do card de vaga

### Importacao Inteligente
- Upload de PDF (curriculo ou perfil LinkedIn exportado)
- IA extrai e preenche automaticamente as 8 secoes do formulario de perfil
- Extracao de descricao de vaga por URL via Jina AI Reader

### Monetizacao
- Plano Free: 1 otimizacao LinkedIn, 1 CV generico, busca limitada
- Plano Pro (R$39/mes): tudo ilimitado + Modo Alvo + CV por vaga + tracker
- Checkout e portal de billing via Stripe
- Middleware de verificacao de plano nas rotas premium

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | Supabase (PostgreSQL + Auth + RLS) |
| IA | Claude API (claude-sonnet-4-6) |
| Vagas | Jooble API |
| Extracao de paginas | Jina AI Reader (r.jina.ai) |
| PDF | Puppeteer (headless) |
| Pagamentos | Stripe |
| Deploy | Railway |

## Instalacao

### Pre-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) com projeto criado
- Chave de API da [Anthropic](https://console.anthropic.com)
- Chave de API da [Jooble](https://jooble.org/api/about)
- (Opcional) Conta [Stripe](https://stripe.com) para monetizacao

### 1. Clone o repositorio

```bash
git clone https://github.com/luthhop/profileai.git
cd profileai
```

### 2. Instale as dependencias

```bash
npm run instalar
```

Ou manualmente:

```bash
npm install --prefix frontend
npm install --prefix backend
```

### 3. Configure as variaveis de ambiente

Crie o arquivo `backend/.env` a partir do exemplo:

```bash
cp backend/.env.example backend/.env
```

Crie o arquivo `frontend/.env.local`:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### 4. Configure o banco de dados

Execute os SQLs no SQL Editor do Supabase, nesta ordem:

1. `docs/schema.sql` — tabelas base (profiles, linkedin_outputs, vagas_salvas)
2. `docs/migration_perfil_completo.sql` — colunas do perfil completo
3. `docs/migration_modo_alvo.sql` — coluna vaga_alvo no linkedin_outputs
4. `docs/migration_candidaturas.sql` — tabela de candidaturas
5. `docs/migration_subscriptions.sql` — tabelas de subscriptions e usage_counters

### 5. Execute em modo dev

Em dois terminais separados:

```bash
# Terminal 1 — Backend (porta 3001)
npm run dev:backend

# Terminal 2 — Frontend (porta 5173)
npm run dev:frontend
```

Acesse [http://localhost:5173](http://localhost:5173).

## Variaveis de Ambiente

### Backend (`backend/.env`)

| Variavel | Descricao |
|----------|-----------|
| `PORT` | Porta do servidor (padrao: 3001) |
| `FRONTEND_URL` | URL do frontend para CORS (padrao: http://localhost:5173) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave publica (anon) do Supabase |
| `SUPABASE_SERVICE_KEY` | Chave de servico do Supabase (para operacoes admin) |
| `ANTHROPIC_API_KEY` | Chave de API da Anthropic (Claude) |
| `JOOBLE_API_KEY` | Chave de API da Jooble |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe (opcional) |
| `STRIPE_PRICE_PRO_ID` | ID do preco Pro no Stripe (opcional) |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe (opcional) |

### Frontend (`frontend/.env.local`)

| Variavel | Descricao |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave publica (anon) do Supabase |

## Estrutura do Projeto

```
profileai/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Entry point Express
│   │   ├── lib/
│   │   │   └── supabase.ts          # Clients Supabase (anon + admin)
│   │   ├── middleware/
│   │   │   └── checkPlan.ts         # Verificacao de limites Free/Pro
│   │   ├── routes/
│   │   │   ├── index.ts             # Agregador de rotas
│   │   │   ├── perfil.ts            # LinkedIn Coach (generate, modo-alvo, score)
│   │   │   ├── vagas.ts             # Busca Jooble + score IA
│   │   │   ├── cv.ts                # CV generico, por vaga, carta, preview
│   │   │   ├── entrevista.ts        # Mock interview + preparacao
│   │   │   ├── candidaturas.ts      # CRUD candidaturas
│   │   │   ├── importar.ts          # Importacao de PDF com IA
│   │   │   └── stripe.ts            # Checkout, portal, webhook
│   │   └── utils/
│   │       └── extractUrl.ts        # Extracao de texto via Jina AI
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # Entry point React
│   │   ├── App.tsx                  # Router
│   │   ├── lib/
│   │   │   └── supabase.ts          # Client Supabase
│   │   ├── components/
│   │   │   └── AppLayout.tsx        # Sidebar + layout principal
│   │   └── pages/
│   │       ├── Inicio.tsx           # Login Google
│   │       ├── Onboarding.tsx       # Coleta de perfil (6 etapas)
│   │       ├── Dashboard.tsx        # Painel principal
│   │       ├── Perfil.tsx           # Formulario completo (8 secoes)
│   │       ├── LinkedinCoach.tsx    # Otimizacao + Modo Alvo + Score
│   │       ├── Vagas.tsx            # Match de vagas com filtros
│   │       ├── Curriculo.tsx        # CV generico + por vaga + carta
│   │       ├── Entrevista.tsx       # Mock + preparacao
│   │       ├── Candidaturas.tsx     # Kanban tracker
│   │       ├── Planos.tsx           # Free vs Pro + Stripe
│   │       └── NotFound.tsx         # 404
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── docs/
│   ├── schema.sql                   # Schema inicial do banco
│   ├── migration_perfil_completo.sql
│   ├── migration_modo_alvo.sql
│   ├── migration_candidaturas.sql
│   ├── migration_subscriptions.sql
│   └── profileai-brandkit.html      # Guia visual de cores e tipografia
├── package.json                     # Scripts raiz (dev:frontend, dev:backend)
├── CLAUDE.md                        # Instrucoes para IA
└── .gitignore
```

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev:frontend` | Inicia o frontend em modo dev (porta 5173) |
| `npm run dev:backend` | Inicia o backend em modo dev (porta 3001) |
| `npm run instalar` | Instala dependencias de frontend e backend |

## Licenca

Projeto privado. Todos os direitos reservados.
