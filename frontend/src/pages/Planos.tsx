import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AppLayout from '../components/AppLayout';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoCheck() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
}
function IcoX() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
}
function IcoZap() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
}

interface SubData {
  plano: string;
  status: string;
  current_period_end?: string;
}

const FREE_FEATURES = [
  { text: '1 otimização LinkedIn/mês', included: true },
  { text: '1 CV genérico/mês', included: true },
  { text: 'Busca de vagas (3 buscas/mês)', included: true },
  { text: 'Mock de entrevista', included: true },
  { text: 'Modo Alvo LinkedIn', included: false },
  { text: 'CV para vaga específica', included: false },
  { text: 'Candidatar com IA', included: false },
  { text: 'Tracker de candidaturas', included: false },
  { text: 'Carta de apresentação', included: false },
  { text: 'Preparação para entrevista', included: false },
];

const PRO_FEATURES = [
  { text: 'Otimizações LinkedIn ilimitadas', included: true },
  { text: 'CVs ilimitados', included: true },
  { text: 'Busca de vagas ilimitada', included: true },
  { text: 'Mock de entrevista ilimitado', included: true },
  { text: 'Modo Alvo LinkedIn', included: true },
  { text: 'CV para vaga específica', included: true },
  { text: 'Candidatar com IA', included: true },
  { text: 'Tracker de candidaturas', included: true },
  { text: 'Carta de apresentação', included: true },
  { text: 'Preparação para entrevista', included: true },
];

export default function Planos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubData>({ plano: 'free', status: 'active' });
  const [upgrading, setUpgrading] = useState(false);

  const success = searchParams.get('success') === '1';
  const canceled = searchParams.get('canceled') === '1';

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate('/', { replace: true }); return; }
      setUser(u);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        try {
          const res = await fetch('/api/stripe/subscription', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setSub(data);
          }
        } catch { /* fallback to free */ }
      }

      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleUpgrade() {
    if (!user) return;
    setUpgrading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch { /* ignore */ }
    setUpgrading(false);
  }

  async function handleManage() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch { /* ignore */ }
  }

  if (loading || !user) {
    return (<div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>);
  }

  const isPro = sub.plano === 'pro' && sub.status === 'active';

  return (
    <AppLayout user={user}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Planos</h1>
          <p className="mt-2 font-body text-sm text-ink/50">Escolha o plano ideal para acelerar sua carreira</p>
        </div>

        {/* Banners */}
        {success && (
          <div className="flex items-center justify-center gap-2 rounded-card border border-emerald-100 bg-emerald-50 px-6 py-4">
            <IcoCheck />
            <p className="font-display text-sm font-semibold text-emerald-700">Upgrade realizado com sucesso! Aproveite o plano Pro.</p>
          </div>
        )}
        {canceled && (
          <div className="flex items-center justify-center gap-2 rounded-card border border-amber-100 bg-amber-50 px-6 py-4">
            <p className="font-body text-sm text-amber-700">Pagamento cancelado. Você pode tentar novamente a qualquer momento.</p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Free plan */}
          <div className={`flex flex-col rounded-card border-2 bg-white p-6 shadow-sm ${!isPro ? 'border-primary' : 'border-gray-100'}`}>
            {!isPro && <span className="mb-4 self-start rounded-badge bg-primary-pale px-3 py-1 font-display text-xs font-semibold text-primary">Plano atual</span>}
            <h2 className="font-display text-xl font-bold text-ink">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-ink">R$0</span>
              <span className="font-body text-sm text-ink/40">/mês</span>
            </div>
            <p className="mt-2 font-body text-xs text-ink/50">Perfeito para explorar a plataforma</p>

            <div className="mt-6 flex flex-col gap-2.5">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  {f.included ? (
                    <span className="text-match-high"><IcoCheck /></span>
                  ) : (
                    <span className="text-ink/20"><IcoX /></span>
                  )}
                  <span className={`font-body text-xs ${f.included ? 'text-ink/70' : 'text-ink/30'}`}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro plan */}
          <div className={`flex flex-col rounded-card border-2 bg-white p-6 shadow-sm ${isPro ? 'border-primary' : 'border-gray-100'}`}>
            {isPro && <span className="mb-4 self-start rounded-badge bg-primary-pale px-3 py-1 font-display text-xs font-semibold text-primary">Plano atual</span>}
            {!isPro && <span className="mb-4 self-start rounded-badge bg-primary px-3 py-1 font-display text-xs font-semibold text-white">Recomendado</span>}
            <h2 className="font-display text-xl font-bold text-ink">Pro</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-primary">R$39</span>
              <span className="font-body text-sm text-ink/40">/mês</span>
            </div>
            <p className="mt-2 font-body text-xs text-ink/50">Tudo ilimitado para quem quer resultados</p>

            <div className="mt-6 flex flex-col gap-2.5">
              {PRO_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-match-high"><IcoCheck /></span>
                  <span className="font-body text-xs text-ink/70">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {isPro ? (
                <button
                  onClick={handleManage}
                  className="flex w-full items-center justify-center gap-2 rounded-btn border border-gray-200 px-6 py-3 font-display text-sm font-semibold text-ink/70 transition hover:border-primary hover:text-primary"
                >
                  Gerenciar assinatura
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="flex w-full items-center justify-center gap-2 rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                >
                  {upgrading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Processando…</>
                  ) : (
                    <><IcoZap />Fazer upgrade</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {isPro && sub.current_period_end && (
          <p className="text-center font-body text-xs text-ink/40">
            Sua assinatura renova em {new Date(sub.current_period_end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
