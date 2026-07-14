import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AppLayout from '../components/AppLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  nome: string | null;
  area: string | null;
  cargo: string | null;
  stack: string[] | null;
  habilidades: string[] | null;
  objetivo_profissional: string | null;
  formacao: string | null;
  experiencias: { descricao?: string; tempo_na_area?: string } | null;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2c.84-1.24 2.28-2 4-2z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IcoMic() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IcoArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

interface ActionDef {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  path: string;
}

const ACTIONS: ActionDef[] = [
  {
    title: 'Otimizar LinkedIn',
    description: 'Gere headline, about e palavras-chave com IA',
    icon: <IcoLinkedIn />,
    iconBg: 'bg-primary-pale',
    iconColor: 'text-primary',
    path: '/linkedin',
  },
  {
    title: 'Buscar Vagas',
    description: 'Vagas com score de compatibilidade em tempo real',
    icon: <IcoSearch />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    path: '/vagas',
  },
  {
    title: 'Gerar Currículo PDF',
    description: 'Currículo profissional formatado em 1 clique',
    icon: <IcoDoc />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    path: '/curriculo',
  },
  {
    title: 'Praticar Entrevista',
    description: 'Simulação com feedback detalhado da IA',
    icon: <IcoMic />,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    path: '/entrevista',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFirstName(name: string | null | undefined): string {
  if (!name) return 'você';
  return name.split(' ')[0];
}

function getNextSteps(profile: Profile | null): { label: string; description: string }[] {
  const steps: { label: string; description: string }[] = [];

  if (!profile?.experiencias?.descricao) {
    steps.push({
      label: 'Complete suas experiências',
      description: 'Adicione projetos, resultados concretos e tempo de atuação',
    });
  }
  steps.push({
    label: 'Otimize seu LinkedIn com IA',
    description: 'Gere headline e about que se destacam no algoritmo do LinkedIn',
  });
  if (
    profile?.objetivo_profissional?.includes('emprego') ||
    profile?.objetivo_profissional?.includes('visibilidade')
  ) {
    steps.push({
      label: 'Busque vagas compatíveis',
      description: 'Veja oportunidades com score de match personalizado para seu perfil',
    });
  }
  steps.push({
    label: 'Simule uma entrevista',
    description: 'Prepare-se com perguntas reais da sua área e receba feedback da IA',
  });
  if (!profile?.formacao) {
    steps.push({
      label: 'Adicione sua formação',
      description: 'Graduação, pós e certificações aumentam suas chances nas vagas',
    });
  }

  return steps.slice(0, 4);
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate('/', { replace: true }); return; }
      setUser(u);

      const { data } = await supabase
        .from('profiles')
        .select('nome, area, cargo, stack, habilidades, objetivo_profissional, formacao, experiencias')
        .eq('user_id', u.id)
        .maybeSingle();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [navigate]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName = getFirstName(profile?.nome ?? user.user_metadata?.full_name);
  const nextSteps = getNextSteps(profile);

  return (
    <AppLayout user={user}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">

        {/* Saudação */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Olá, {firstName}!
          </h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Veja o resumo do seu perfil e suas próximas ações
          </p>
        </div>

        {/* 4 Action cards */}
        <section>
          <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-widest text-ink/40">
            O que você quer fazer?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ACTIONS.map(card => (
              <button
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group flex items-center gap-4 rounded-card border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/20 hover:shadow-md active:scale-[.99]"
              >
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${card.iconBg} ${card.iconColor}`}>
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold text-ink">{card.title}</p>
                  <p className="mt-0.5 font-body text-xs leading-snug text-ink/50">{card.description}</p>
                </div>
                <span className="flex-shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-primary">
                  <IcoArrow />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Upgrade banner */}
        <button
          onClick={() => navigate('/planos')}
          className="group flex items-center gap-4 rounded-card border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[.995]"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z" />
              <path d="M3 20h18" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold text-ink">Desbloqueie o plano Pro</p>
            <p className="mt-0.5 font-body text-xs leading-snug text-ink/50">
              Modo Alvo, CV por vaga, candidaturas ilimitadas e muito mais por R$39/mês
            </p>
          </div>
          <span className="flex-shrink-0 rounded-btn bg-primary px-4 py-2 font-display text-xs font-semibold text-white transition group-hover:bg-primary-dark">
            Ver planos
          </span>
        </button>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Profile summary */}
          <section className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Seu perfil</h2>
              <button
                onClick={() => navigate('/perfil')}
                className="font-body text-xs text-primary transition hover:underline"
              >
                Editar
              </button>
            </div>

            {profile ? (
              <div className="flex flex-col gap-3">
                {profile.cargo && (
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Cargo</p>
                    <p className="mt-0.5 font-body text-sm text-ink">{profile.cargo}</p>
                  </div>
                )}
                {profile.area && (
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Área</p>
                    <p className="mt-0.5 font-body text-sm text-ink">{profile.area}</p>
                  </div>
                )}
                {profile.objetivo_profissional && (
                  <div>
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Objetivo</p>
                    <p className="mt-0.5 font-body text-sm text-ink">{profile.objetivo_profissional}</p>
                  </div>
                )}
                {profile.stack && profile.stack.length > 0 && (
                  <div>
                    <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Stack</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.stack.slice(0, 8).map(s => (
                        <span key={s} className="rounded-badge bg-primary-pale px-2.5 py-0.5 font-body text-xs font-medium text-primary">
                          {s}
                        </span>
                      ))}
                      {profile.stack.length > 8 && (
                        <span className="rounded-badge bg-gray-100 px-2.5 py-0.5 font-body text-xs text-ink/50">
                          +{profile.stack.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="font-body text-sm text-ink/50">Seu perfil ainda não foi preenchido.</p>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="rounded-btn bg-primary px-4 py-2 font-display text-xs font-semibold text-white transition hover:bg-primary-dark"
                >
                  Preencher perfil
                </button>
              </div>
            )}
          </section>

          {/* Next steps */}
          <section className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="font-display text-base font-semibold text-ink">Próximos passos</h2>
            <ol className="flex flex-col gap-4">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-pale font-display text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-body text-sm font-medium text-ink">{step.label}</p>
                    <p className="mt-0.5 font-body text-xs leading-snug text-ink/50">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

        </div>
      </div>
    </AppLayout>
  );
}
