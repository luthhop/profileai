import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch, apiError } from '../lib/api';
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

interface LinkedinResult {
  headline: string;
  about: string;
  habilidades: string[];
  keywords: string[];
  dicas: string[];
}

interface ModoAlvoResult {
  match_antes: number;
  match_depois: number;
  headline_atual: string;
  headline_otimizado: string;
  about_atual: string;
  about_otimizado: string;
  habilidades_atuais: string[];
  habilidades_otimizadas: string[];
  keywords_atuais: string[];
  keywords_otimizadas: string[];
  requisitos_atendidos: string[];
  gaps: string[];
}

interface ScoreCategoria {
  nome: string;
  score: number;
  status: 'ok' | 'melhorar' | 'ausente';
  dica: string;
}

interface ScoreResult {
  score_total: number;
  categorias: ScoreCategoria[];
  resumo: string;
}

interface HistoryItem {
  id: string;
  headline: string;
  about: string;
  keywords: string[];
  dicas: string[];
  vaga_alvo: string | null;
  created_at: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoSparkle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76a1 1 0 0 0 .95.69h6.07l-4.91 3.57a1 1 0 0 0-.36 1.11L17.41 20 12 16.43 6.59 20l1.88-5.87a1 1 0 0 0-.36-1.11L3.1 9.45H9.17a1 1 0 0 0 .95-.69L12 3z" />
    </svg>
  );
}
function IcoCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function IcoTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IcoArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}
function IcoCheckCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IcoAlertTriangle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoGauge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 12l6-6" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

interface ResultCardProps {
  title: string;
  badge?: string;
  copyKey: string;
  copyText: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  children: React.ReactNode;
}

function ResultCard({ title, badge, copyKey, copyText, copied, onCopy, children }: ResultCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          {badge && (
            <span className="rounded-badge bg-gray-100 px-2 py-0.5 font-body text-xs text-ink/50">{badge}</span>
          )}
        </div>
        <button
          onClick={() => onCopy(copyText, copyKey)}
          className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${
            copied === copyKey
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'
          }`}
        >
          {copied === copyKey ? <IcoCheck /> : <IcoCopy />}
          {copied === copyKey ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function statusIcon(status: string) {
  if (status === 'ok') return <span className="text-match-high"><IcoCheckCircle /></span>;
  if (status === 'melhorar') return <span className="text-match-mid"><IcoAlertTriangle /></span>;
  return <span className="text-match-low"><IcoAlertTriangle /></span>;
}

function statusBg(status: string) {
  if (status === 'ok') return 'bg-emerald-50 border-emerald-100';
  if (status === 'melhorar') return 'bg-amber-50 border-amber-100';
  return 'bg-red-50 border-red-100';
}

// ─── LinkedinCoach ────────────────────────────────────────────────────────────

export default function LinkedinCoach() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [result, setResult] = useState<LinkedinResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'alvo' | 'score' | 'historico'>('geral');

  // Modo Alvo
  const [vagaTexto, setVagaTexto] = useState('');
  const [vagaUrl, setVagaUrl] = useState('');
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [alvoResult, setAlvoResult] = useState<ModoAlvoResult | null>(null);
  const [generatingAlvo, setGeneratingAlvo] = useState(false);
  const [errorAlvo, setErrorAlvo] = useState<string | null>(null);

  // Score
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [generatingScore, setGeneratingScore] = useState(false);
  const [errorScore, setErrorScore] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  async function loadHistory() {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('linkedin_outputs')
      .select('id, headline, about, keywords, dicas, vaga_alvo, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory((data ?? []) as HistoryItem[]);
    setLoadingHistory(false);
  }

  async function handleGenerate() {
    if (!profile || !user) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await authFetch(`${API}/api/linkedin/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as LinkedinResult;
      setResult(data);

      await supabase.from('linkedin_outputs').insert({
        user_id: user.id,
        headline: data.headline,
        about: data.about,
        keywords: data.keywords,
        dicas: data.dicas,
      });
    } catch {
      setError('Não foi possível gerar o conteúdo. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleExtractUrl(url: string) {
    if (!url.trim()) return;
    setExtractingUrl(true);
    setErrorAlvo(null);
    try {
      const res = await authFetch(`${API}/api/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as { texto: string };
      setVagaTexto(data.texto);
    } catch {
      setErrorAlvo('Não foi possível extrair o conteúdo da URL. Cole o texto manualmente.');
    } finally {
      setExtractingUrl(false);
    }
  }

  async function handleModoAlvo() {
    if (!profile || !user || vagaTexto.trim().length < 20) return;
    setGeneratingAlvo(true);
    setErrorAlvo(null);

    try {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const res = await authFetch(`${API}/api/linkedin/modo-alvo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile, vaga: vagaTexto }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ModoAlvoResult;
      setAlvoResult(data);

      await supabase.from('linkedin_outputs').insert({
        user_id: user.id,
        headline: data.headline_otimizado,
        about: data.about_otimizado,
        keywords: data.keywords_otimizadas,
        dicas: [],
        vaga_alvo: vagaTexto.slice(0, 500),
      });
    } catch {
      setErrorAlvo('Não foi possível gerar a análise. Tente novamente.');
    } finally {
      setGeneratingAlvo(false);
    }
  }

  async function handleScore() {
    if (!profile || !user) return;
    setGeneratingScore(true);
    setErrorScore(null);

    try {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const res = await authFetch(`${API}/api/linkedin/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as ScoreResult;
      setScoreResult(data);
    } catch {
      setErrorScore('Erro ao calcular score. Tente novamente.');
    } finally {
      setGeneratingScore(false);
    }
  }

  function restoreVersion(item: HistoryItem) {
    setResult({
      headline: item.headline,
      about: item.about,
      habilidades: [],
      keywords: item.keywords ?? [],
      dicas: item.dicas ?? [],
    });
    setActiveTab('geral');
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">LinkedIn Coach</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Otimize seu perfil LinkedIn com IA especializada no mercado brasileiro
          </p>
        </div>

        {/* Tabs */}
        {profile && (
          <div className="flex gap-1 overflow-x-auto rounded-btn bg-gray-100 p-1">
            {[
              { key: 'geral' as const, label: 'Otimização Geral', icon: <IcoSparkle /> },
              { key: 'alvo' as const, label: 'Modo Alvo', icon: <IcoTarget /> },
              { key: 'score' as const, label: 'Score', icon: <IcoGauge /> },
              { key: 'historico' as const, label: 'Histórico', icon: <IcoClock /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === 'historico' && history.length === 0) loadHistory();
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-btn px-3 py-2.5 font-display text-xs font-semibold transition ${
                  activeTab === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Sem perfil */}
        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="font-body text-sm text-ink/50">Você ainda não preencheu seu perfil profissional.</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Preencher perfil agora
            </button>
          </div>
        )}

        {/* ═══ TAB: Otimização Geral ═══ */}

        {activeTab === 'geral' && profile && !result && !generating && (
          <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Perfil que será analisado</h2>
              <button onClick={() => navigate('/onboarding')} className="flex items-center gap-1.5 font-body text-xs text-primary transition hover:underline">
                <IcoEdit /> Editar
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.nome && <div><p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Nome</p><p className="mt-0.5 font-body text-sm text-ink">{profile.nome}</p></div>}
              {profile.cargo && <div><p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Cargo</p><p className="mt-0.5 font-body text-sm text-ink">{profile.cargo}</p></div>}
              {profile.area && <div><p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Área</p><p className="mt-0.5 font-body text-sm text-ink">{profile.area}</p></div>}
              {profile.objetivo_profissional && <div><p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Objetivo</p><p className="mt-0.5 font-body text-sm text-ink">{profile.objetivo_profissional}</p></div>}
            </div>
            {profile.stack && profile.stack.length > 0 && (
              <div>
                <p className="mb-1.5 font-display text-xs font-semibold uppercase tracking-wider text-ink/35">Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.stack.slice(0, 8).map(s => (<span key={s} className="rounded-badge bg-primary-pale px-2.5 py-0.5 font-body text-xs font-medium text-primary">{s}</span>))}
                  {profile.stack.length > 8 && <span className="rounded-badge bg-gray-100 px-2.5 py-0.5 font-body text-xs text-ink/50">+{profile.stack.length - 8}</span>}
                </div>
              </div>
            )}
            {error && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{error}</p>}
            <div className="pt-1">
              <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]">
                <IcoSparkle /> Gerar otimização LinkedIn
              </button>
            </div>
          </div>
        )}

        {activeTab === 'geral' && generating && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-primary/20 bg-primary-pale p-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <div className="text-center">
              <p className="font-display text-base font-semibold text-primary">IA analisando seu perfil…</p>
              <p className="mt-1 font-body text-sm text-primary/60">Gerando headline, about, habilidades e palavras-chave</p>
            </div>
          </div>
        )}

        {activeTab === 'geral' && result && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-card border border-emerald-100 bg-emerald-50 px-5 py-4">
              <IcoCheck />
              <div>
                <p className="font-display text-sm font-semibold text-emerald-700">Otimização gerada com sucesso!</p>
                <p className="font-body text-xs text-emerald-600">Resultado salvo no seu histórico. Copie cada seção e cole no seu LinkedIn.</p>
              </div>
            </div>

            <ResultCard title="Headline" badge={`${result.headline.length}/120 chars`} copyKey="headline" copyText={result.headline} copied={copied} onCopy={handleCopy}>
              <p className="font-display text-base font-semibold leading-snug text-ink">{result.headline}</p>
            </ResultCard>

            <ResultCard title="Sobre mim (About)" copyKey="about" copyText={result.about} copied={copied} onCopy={handleCopy}>
              <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink/80">{result.about}</p>
            </ResultCard>

            {result.habilidades.length > 0 && (
              <ResultCard title="Top 10 Habilidades" copyKey="habilidades" copyText={result.habilidades.join(', ')} copied={copied} onCopy={handleCopy}>
                <div className="flex flex-wrap gap-2">
                  {result.habilidades.map(h => (<span key={h} className="rounded-badge bg-primary-pale px-3 py-1 font-body text-xs font-medium text-primary">{h}</span>))}
                </div>
              </ResultCard>
            )}

            {result.keywords.length > 0 && (
              <ResultCard title="20 Palavras-chave SEO" copyKey="keywords" copyText={result.keywords.join(', ')} copied={copied} onCopy={handleCopy}>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map(k => (<span key={k} className="rounded-badge bg-gray-100 px-2.5 py-0.5 font-body text-xs text-ink/70">{k}</span>))}
                </div>
              </ResultCard>
            )}

            {result.dicas.length > 0 && (
              <ResultCard title="5 Dicas de Visibilidade" copyKey="dicas" copyText={result.dicas.map((d, i) => `${i + 1}. ${d}`).join('\n')} copied={copied} onCopy={handleCopy}>
                <ol className="flex flex-col gap-3">
                  {result.dicas.map((dica, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-pale font-display text-xs font-bold text-primary">{i + 1}</span>
                      <p className="font-body text-sm leading-snug text-ink/80">{dica}</p>
                    </li>
                  ))}
                </ol>
              </ResultCard>
            )}

            <button onClick={() => { setResult(null); setError(null); }} className="self-start font-body text-xs text-ink/40 transition hover:text-primary">
              Gerar novamente →
            </button>
          </div>
        )}

        {/* ═══ TAB: Modo Alvo ═══ */}

        {activeTab === 'alvo' && profile && !alvoResult && !generatingAlvo && (
          <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><IcoTarget /></div>
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Modo Alvo</h2>
                <p className="font-body text-xs text-ink/50">Cole a descrição de uma vaga e veja como seu perfil se compara</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Link da vaga (opcional)</label>
              <div className="flex gap-2">
                <input type="url" value={vagaUrl} onChange={e => setVagaUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/..." className="flex-1 rounded-btn border border-gray-200 px-4 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                <button type="button" onClick={() => handleExtractUrl(vagaUrl)} disabled={!vagaUrl.trim() || extractingUrl} className="flex items-center gap-1.5 rounded-btn bg-gray-100 px-4 py-2.5 font-display text-xs font-semibold text-ink/60 transition hover:bg-primary-pale hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">
                  {extractingUrl ? (<><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />Extraindo…</>) : 'Extrair texto'}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Descrição da vaga</label>
              <textarea value={vagaTexto} onChange={e => setVagaTexto(e.target.value)} placeholder="Cole aqui a descrição completa da vaga…" rows={8} className="w-full resize-none rounded-btn border border-gray-200 px-4 py-3 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
              <span className="self-end font-body text-xs text-ink/30">{vagaTexto.length} caracteres {vagaTexto.length < 20 && vagaTexto.length > 0 ? '(mínimo 20)' : ''}</span>
            </div>
            {errorAlvo && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{errorAlvo}</p>}
            <button onClick={handleModoAlvo} disabled={vagaTexto.trim().length < 20} className="flex items-center gap-2 self-start rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]">
              <IcoTarget /> Gerar perfil para esta vaga
            </button>
          </div>
        )}

        {activeTab === 'alvo' && generatingAlvo && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-amber-200/50 bg-amber-50 p-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/15" />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
            <div className="text-center">
              <p className="font-display text-base font-semibold text-amber-700">Analisando vaga vs. seu perfil…</p>
              <p className="mt-1 font-body text-sm text-amber-600/70">Comparando requisitos, gerando versão otimizada e calculando match</p>
            </div>
          </div>
        )}

        {activeTab === 'alvo' && alvoResult && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Match Antes</p>
                <p className={`font-display text-4xl font-bold ${alvoResult.match_antes >= 70 ? 'text-match-high' : alvoResult.match_antes >= 40 ? 'text-match-mid' : 'text-match-low'}`}>{alvoResult.match_antes}%</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full transition-all duration-700 ${alvoResult.match_antes >= 70 ? 'bg-match-high' : alvoResult.match_antes >= 40 ? 'bg-match-mid' : 'bg-match-low'}`} style={{ width: `${alvoResult.match_antes}%` }} /></div>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-card border border-primary/20 bg-primary-pale p-5 shadow-sm">
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-primary/60">Match Depois</p>
                <p className={`font-display text-4xl font-bold ${alvoResult.match_depois >= 70 ? 'text-match-high' : alvoResult.match_depois >= 40 ? 'text-match-mid' : 'text-match-low'}`}>{alvoResult.match_depois}%</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60"><div className={`h-full rounded-full transition-all duration-700 ${alvoResult.match_depois >= 70 ? 'bg-match-high' : alvoResult.match_depois >= 40 ? 'bg-match-mid' : 'bg-match-low'}`} style={{ width: `${alvoResult.match_depois}%` }} /></div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 rounded-card border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                <div className="flex items-center gap-1.5 text-match-high"><IcoArrowUp /><span className="font-display text-3xl font-bold">+{alvoResult.match_depois - alvoResult.match_antes}%</span></div>
                <p className="font-body text-xs text-emerald-600">Ganho com otimização</p>
              </div>
            </div>

            {/* Headline comparison */}
            <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink">Headline</h3>
                <button onClick={() => handleCopy(alvoResult.headline_otimizado, 'alvo-headline')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copied === 'alvo-headline' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                  {copied === 'alvo-headline' ? <IcoCheck /> : <IcoCopy />}
                  {copied === 'alvo-headline' ? 'Copiado!' : 'Copiar otimizado'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-btn border border-gray-100 bg-surface/50 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-ink/30">Atual</p><p className="font-body text-sm text-ink/70">{alvoResult.headline_atual}</p></div>
                <div className="rounded-btn border border-primary/20 bg-primary-pale/30 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-primary/60">Otimizado</p><p className="font-display text-sm font-semibold text-ink">{alvoResult.headline_otimizado}</p></div>
              </div>
            </div>

            {/* About comparison */}
            <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink">Sobre mim (About)</h3>
                <button onClick={() => handleCopy(alvoResult.about_otimizado, 'alvo-about')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copied === 'alvo-about' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                  {copied === 'alvo-about' ? <IcoCheck /> : <IcoCopy />} {copied === 'alvo-about' ? 'Copiado!' : 'Copiar otimizado'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-btn border border-gray-100 bg-surface/50 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-ink/30">Atual</p><p className="whitespace-pre-line font-body text-xs leading-relaxed text-ink/60">{alvoResult.about_atual}</p></div>
                <div className="rounded-btn border border-primary/20 bg-primary-pale/30 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-primary/60">Otimizado</p><p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink/80">{alvoResult.about_otimizado}</p></div>
              </div>
            </div>

            {/* Skills comparison */}
            <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink">Habilidades</h3>
                <button onClick={() => handleCopy(alvoResult.habilidades_otimizadas.join(', '), 'alvo-hab')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copied === 'alvo-hab' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                  {copied === 'alvo-hab' ? <IcoCheck /> : <IcoCopy />} {copied === 'alvo-hab' ? 'Copiado!' : 'Copiar otimizado'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-btn border border-gray-100 bg-surface/50 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-ink/30">Atuais</p><div className="flex flex-wrap gap-1.5">{alvoResult.habilidades_atuais.map(h => (<span key={h} className="rounded-badge bg-gray-100 px-2.5 py-0.5 font-body text-xs text-ink/60">{h}</span>))}</div></div>
                <div className="rounded-btn border border-primary/20 bg-primary-pale/30 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-primary/60">Otimizadas</p><div className="flex flex-wrap gap-1.5">{alvoResult.habilidades_otimizadas.map(h => (<span key={h} className="rounded-badge bg-primary-pale px-2.5 py-0.5 font-body text-xs font-medium text-primary">{h}</span>))}</div></div>
              </div>
            </div>

            {/* Keywords comparison */}
            <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-ink">Palavras-chave SEO</h3>
                <button onClick={() => handleCopy(alvoResult.keywords_otimizadas.join(', '), 'alvo-kw')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copied === 'alvo-kw' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                  {copied === 'alvo-kw' ? <IcoCheck /> : <IcoCopy />} {copied === 'alvo-kw' ? 'Copiado!' : 'Copiar otimizado'}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-btn border border-gray-100 bg-surface/50 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-ink/30">Atuais</p><div className="flex flex-wrap gap-1.5">{alvoResult.keywords_atuais.map(k => (<span key={k} className="rounded-badge bg-gray-100 px-2 py-0.5 font-body text-xs text-ink/50">{k}</span>))}</div></div>
                <div className="rounded-btn border border-primary/20 bg-primary-pale/30 p-4"><p className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-primary/60">Otimizadas</p><div className="flex flex-wrap gap-1.5">{alvoResult.keywords_otimizadas.map(k => (<span key={k} className="rounded-badge bg-primary-pale px-2 py-0.5 font-body text-xs font-medium text-primary">{k}</span>))}</div></div>
              </div>
            </div>

            {/* Requisitos */}
            <div className="rounded-card border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><span className="text-match-high"><IcoCheckCircle /></span><h3 className="font-display text-base font-semibold text-ink">O que você já tem</h3><span className="rounded-badge bg-emerald-50 px-2 py-0.5 font-body text-xs font-medium text-match-high">{alvoResult.requisitos_atendidos.length} requisitos</span></div>
              <ul className="flex flex-col gap-2.5">{alvoResult.requisitos_atendidos.map((item, i) => (<li key={i} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-match-high"><IcoCheckCircle /></span><p className="font-body text-sm text-ink/80">{item}</p></li>))}</ul>
            </div>

            {/* Gaps */}
            <div className="rounded-card border border-amber-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2"><span className="text-match-mid"><IcoAlertTriangle /></span><h3 className="font-display text-base font-semibold text-ink">O que falta desenvolver</h3><span className="rounded-badge bg-amber-50 px-2 py-0.5 font-body text-xs font-medium text-match-mid">{alvoResult.gaps.length} gaps</span></div>
              <ul className="flex flex-col gap-2.5">{alvoResult.gaps.map((item, i) => (<li key={i} className="flex items-start gap-2.5"><span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-match-mid"><IcoAlertTriangle /></span><p className="font-body text-sm text-ink/80">{item}</p></li>))}</ul>
            </div>

            <button onClick={() => { setAlvoResult(null); setErrorAlvo(null); }} className="self-start font-body text-xs text-ink/40 transition hover:text-primary">Analisar outra vaga →</button>
          </div>
        )}

        {/* ═══ TAB: Score ═══ */}

        {activeTab === 'score' && profile && !scoreResult && !generatingScore && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-pale text-primary"><IcoGauge /></div>
            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-ink">Score do seu perfil LinkedIn</h2>
              <p className="mt-1 font-body text-sm text-ink/50">A IA analisa 8 categorias e dá uma nota de 0 a 100 com sugestões de melhoria</p>
            </div>
            {errorScore && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{errorScore}</p>}
            <button onClick={handleScore} className="flex items-center gap-2 rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.98]">
              <IcoGauge /> Calcular score
            </button>
          </div>
        )}

        {activeTab === 'score' && generatingScore && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-primary/20 bg-primary-pale p-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <p className="font-display text-base font-semibold text-primary">Analisando seu perfil LinkedIn…</p>
          </div>
        )}

        {activeTab === 'score' && scoreResult && (
          <div className="flex flex-col gap-5">
            {/* Score total */}
            <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-8 shadow-sm">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Score geral</p>
              <p className={`font-display text-6xl font-bold ${scoreResult.score_total >= 70 ? 'text-match-high' : scoreResult.score_total >= 40 ? 'text-match-mid' : 'text-match-low'}`}>
                {scoreResult.score_total}
              </p>
              <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreResult.score_total >= 70 ? 'bg-match-high' : scoreResult.score_total >= 40 ? 'bg-match-mid' : 'bg-match-low'}`}
                  style={{ width: `${scoreResult.score_total}%` }}
                />
              </div>
              <p className="max-w-md text-center font-body text-sm text-ink/60">{scoreResult.resumo}</p>
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-3">
              {scoreResult.categorias.map((cat, i) => (
                <div key={i} className={`flex items-start gap-4 rounded-card border p-4 ${statusBg(cat.status)}`}>
                  <div className="mt-0.5">{statusIcon(cat.status)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-sm font-semibold text-ink">{cat.nome}</h4>
                      <span className={`font-display text-sm font-bold ${cat.score >= 70 ? 'text-match-high' : cat.score >= 40 ? 'text-match-mid' : 'text-match-low'}`}>
                        {cat.score}/100
                      </span>
                    </div>
                    <p className="mt-1 font-body text-xs text-ink/60">{cat.dica}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => { setScoreResult(null); setErrorScore(null); }} className="self-start font-body text-xs text-ink/40 transition hover:text-primary">
              Recalcular score →
            </button>
          </div>
        )}

        {/* ═══ TAB: Histórico ═══ */}

        {activeTab === 'historico' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Histórico de otimizações</h2>
              <button onClick={loadHistory} disabled={loadingHistory} className="font-body text-xs text-primary transition hover:underline">
                {loadingHistory ? 'Carregando…' : 'Atualizar'}
              </button>
            </div>

            {loadingHistory && history.length === 0 && (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {!loadingHistory && history.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
                <p className="font-body text-sm text-ink/50">Nenhuma otimização gerada ainda.</p>
                <button onClick={() => setActiveTab('geral')} className="font-body text-xs text-primary transition hover:underline">Gerar primeira otimização →</button>
              </div>
            )}

            {history.map(item => (
              <div key={item.id} className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-semibold text-ink">{item.headline}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-body text-[10px] text-ink/30">{formatDate(item.created_at)}</span>
                      {item.vaga_alvo && (
                        <span className="rounded-badge bg-amber-50 px-2 py-0.5 font-body text-[10px] font-medium text-amber-600">Modo Alvo</span>
                      )}
                      {!item.vaga_alvo && (
                        <span className="rounded-badge bg-primary-pale px-2 py-0.5 font-body text-[10px] font-medium text-primary">Geral</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => restoreVersion(item)}
                    className="flex-shrink-0 rounded-btn bg-gray-100 px-3 py-1.5 font-display text-xs font-semibold text-ink/60 transition hover:bg-primary-pale hover:text-primary"
                  >
                    Usar esta versão
                  </button>
                </div>
                <p className="line-clamp-3 font-body text-xs leading-relaxed text-ink/50">{item.about}</p>
                {item.vaga_alvo && (
                  <p className="line-clamp-1 font-body text-[10px] text-ink/30">Vaga: {item.vaga_alvo}</p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
