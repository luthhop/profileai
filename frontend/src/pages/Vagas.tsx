import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch, apiError, UpgradeRequiredError } from '../lib/api';
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

interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  local: string;
  descricao: string;
  salario: string;
  tipo: string;
  url: string;
  fonte: string;
  atualizada: string;
  match_score: number;
  match_motivo: string;
}

interface SearchHistoryItem {
  keywords: string;
  location: string;
  date: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IcoBookmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IcoBookmarkFill() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IcoExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function IcoZap() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IcoMapPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IcoBuilding() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <path d="M9 18h6" />
    </svg>
  );
}
function IcoFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-match-high';
  if (score >= 60) return 'text-match-mid';
  return 'text-match-low';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-match-high';
  if (score >= 60) return 'bg-match-mid';
  return 'bg-match-low';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
}

const SCORE_FILTERS = [
  { label: 'Todas', min: 0 },
  { label: '60%+', min: 60 },
  { label: '80%+', min: 80 },
];

const CONTRATO_OPTIONS = ['Todos', 'CLT', 'PJ', 'Estágio'];
const REGIME_OPTIONS = ['Todos', 'Remoto', 'Híbrido', 'Presencial'];
const DATA_OPTIONS = [
  { label: 'Qualquer', days: 0 },
  { label: '24h', days: 1 },
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
];
const SALARIO_OPTIONS = [
  { label: 'Qualquer', min: 0 },
  { label: 'Com salário', min: -1 },
  { label: 'R$3k+', min: 3000 },
  { label: 'R$5k+', min: 5000 },
  { label: 'R$10k+', min: 10000 },
];
const ITEMS_PER_PAGE = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Vagas() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullProfile, setFullProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [searching, setSearching] = useState(false);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [minScore, setMinScore] = useState(0);
  const [filtroContrato, setFiltroContrato] = useState('Todos');
  const [filtroRegime, setFiltroRegime] = useState('Todos');
  const [filtroData, setFiltroData] = useState(0);
  const [filtroSalario, setFiltroSalario] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Saved jobs tracking
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Candidatar com IA
  const [candidatandoId, setCandidatandoId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate('/', { replace: true }); return; }
      setUser(u);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', u.id)
        .maybeSingle();

      if (data) {
        setProfile(data as unknown as Profile);
        setFullProfile(data);
        setKeywords(data.cargo_desejado ?? data.cargo ?? data.area ?? '');
      }

      const saved = localStorage.getItem(`search_history_${u.id}`);
      if (saved) {
        try { setSearchHistory(JSON.parse(saved)); } catch { /* ignore */ }
      }

      setLoading(false);
    }
    load();
  }, [navigate]);

  function saveToHistory(kw: string, loc: string) {
    if (!user) return;
    const item: SearchHistoryItem = { keywords: kw, location: loc, date: new Date().toISOString() };
    const updated = [item, ...searchHistory.filter(h => h.keywords !== kw || h.location !== loc)].slice(0, 10);
    setSearchHistory(updated);
    localStorage.setItem(`search_history_${user.id}`, JSON.stringify(updated));
  }

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!keywords.trim() || !profile) return;
    setSearching(true);
    setError(null);
    setCurrentPage(1);

    try {
      const res = await authFetch(`${API}/api/vagas/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords.trim(), location: location.trim() || undefined, profile }),
      });

      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as { vagas: Vaga[]; total: number };
      setVagas(data.vagas);
      setTotal(data.total);
      setSearched(true);
      saveToHistory(keywords.trim(), location.trim());
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setError(err instanceof Error && err.message ? err.message : 'Erro ao buscar vagas. Verifique sua conexão e tente novamente.');
    } finally {
      setSearching(false);
    }
  }

  function handleHistoryClick(h: SearchHistoryItem) {
    setKeywords(h.keywords);
    setLocation(h.location);
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 50);
  }

  async function handleSave(vaga: Vaga) {
    if (!user || savedIds.has(vaga.id)) return;
    setSavingId(vaga.id);

    await Promise.all([
      supabase.from('vagas_salvas').insert({
        user_id: user.id,
        vaga_titulo: vaga.titulo,
        vaga_empresa: vaga.empresa,
        vaga_url: vaga.url,
        match_score: vaga.match_score,
        status: 'salva',
      }),
      authFetch(`${API}/api/candidaturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaga_titulo: vaga.titulo,
          vaga_empresa: vaga.empresa,
          vaga_url: vaga.url,
          match_score: vaga.match_score,
          status: 'salva',
        }),
      }).catch(() => {}),
    ]);

    setSavedIds(prev => new Set(prev).add(vaga.id));
    setSavingId(null);
  }

  async function handleCandidatar(vaga: Vaga) {
    if (!fullProfile || !user) return;
    setCandidatandoId(vaga.id);

    try {
      const descricao = stripHtml(vaga.descricao);

      const [linkedinRes, cvRes] = await Promise.all([
        authFetch(`${API}/api/linkedin/modo-alvo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: fullProfile, vaga: descricao }),
        }),
        authFetch(`${API}/api/cv/gerar-por-vaga`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: fullProfile, vaga: descricao }),
        }),
      ]);

      if (cvRes.ok) {
        const blob = await cvRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `curriculo-${vaga.empresa.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      if (linkedinRes.ok) {
        const linkedinData = await linkedinRes.json();
        await supabase.from('linkedin_outputs').insert({
          user_id: user.id,
          headline: linkedinData.headline_otimizado,
          about: linkedinData.about_otimizado,
          keywords: linkedinData.keywords_otimizadas,
          dicas: [],
          vaga_alvo: descricao.slice(0, 500),
        });
      }

      await handleSave(vaga);
    } catch {
      setError('Erro ao gerar materiais para candidatura.');
    } finally {
      setCandidatandoId(null);
    }
  }

  function parseSalary(salario: string): number {
    if (!salario) return 0;
    const nums = salario.replace(/[^\d.,]/g, ' ').split(/\s+/).filter(Boolean);
    for (const n of nums) {
      const val = parseFloat(n.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(val) && val > 100) return val;
    }
    return 0;
  }

  // Filtering
  const filteredVagas = vagas.filter(v => {
    if (v.match_score < minScore) return false;

    if (filtroContrato !== 'Todos') {
      const tipo = (v.tipo || '').toLowerCase() + ' ' + (v.descricao || '').toLowerCase();
      if (filtroContrato === 'CLT' && !tipo.includes('clt')) return false;
      if (filtroContrato === 'PJ' && !tipo.includes('pj') && !tipo.includes('pessoa jurídica')) return false;
      if (filtroContrato === 'Estágio' && !tipo.includes('estágio') && !tipo.includes('estagio') && !tipo.includes('intern')) return false;
    }

    if (filtroRegime !== 'Todos') {
      const texto = (v.local || '').toLowerCase() + ' ' + (v.tipo || '').toLowerCase() + ' ' + (v.descricao || '').toLowerCase();
      if (filtroRegime === 'Remoto' && !texto.includes('remoto') && !texto.includes('remote') && !texto.includes('home office')) return false;
      if (filtroRegime === 'Híbrido' && !texto.includes('híbrido') && !texto.includes('hibrido') && !texto.includes('hybrid')) return false;
      if (filtroRegime === 'Presencial' && !texto.includes('presencial') && !texto.includes('on-site') && !texto.includes('onsite')) return false;
    }

    if (filtroData > 0 && v.atualizada) {
      const diffDays = (Date.now() - new Date(v.atualizada).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > filtroData) return false;
    }

    if (filtroSalario !== 0) {
      const sal = parseSalary(v.salario);
      if (filtroSalario === -1 && sal === 0) return false;
      if (filtroSalario > 0 && sal < filtroSalario) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVagas.length / ITEMS_PER_PAGE);
  const paginatedVagas = filteredVagas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Match de Vagas</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Busque vagas e veja o score de compatibilidade com seu perfil
          </p>
        </div>

        {/* Sem perfil */}
        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="font-body text-sm text-ink/50">Preencha seu perfil primeiro para buscar vagas com match.</p>
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Preencher perfil
            </button>
          </div>
        )}

        {/* Search form */}
        {profile && (
          <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Cargo ou área</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="Ex: Desenvolvedor React, Marketing Digital…"
                  className="rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-48">
                <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Cidade</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={searching || !keywords.trim()}
                  className="flex items-center gap-2 rounded-btn bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                >
                  {searching ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IcoSearch />
                  )}
                  {searching ? 'Buscando…' : 'Buscar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex h-10 w-10 items-center justify-center rounded-btn border transition ${
                    showFilters ? 'border-primary bg-primary-pale text-primary' : 'border-gray-200 text-ink/40 hover:border-primary hover:text-primary'
                  }`}
                  title="Filtros avançados"
                >
                  <IcoFilter />
                </button>
              </div>
            </div>

            {/* Filtros avançados */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 border-t border-gray-50 pt-3">
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Contrato</span>
                  <div className="flex gap-1">
                    {CONTRATO_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setFiltroContrato(opt); setCurrentPage(1); }}
                        className={`rounded-badge px-2.5 py-1 font-body text-xs transition ${
                          filtroContrato === opt
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Regime</span>
                  <div className="flex gap-1">
                    {REGIME_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { setFiltroRegime(opt); setCurrentPage(1); }}
                        className={`rounded-badge px-2.5 py-1 font-body text-xs transition ${
                          filtroRegime === opt
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Salário</span>
                  <div className="flex gap-1">
                    {SALARIO_OPTIONS.map(opt => (
                      <button
                        key={opt.min}
                        type="button"
                        onClick={() => { setFiltroSalario(opt.min); setCurrentPage(1); }}
                        className={`rounded-badge px-2.5 py-1 font-body text-xs transition ${
                          filtroSalario === opt.min
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Publicação</span>
                  <div className="flex gap-1">
                    {DATA_OPTIONS.map(opt => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => { setFiltroData(opt.days); setCurrentPage(1); }}
                        className={`rounded-badge px-2.5 py-1 font-body text-xs transition ${
                          filtroData === opt.days
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de buscas */}
            {searchHistory.length > 0 && !searched && (
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
                <span className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Recentes:</span>
                {searchHistory.slice(0, 5).map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleHistoryClick(h)}
                    className="flex items-center gap-1 rounded-badge bg-gray-50 px-2.5 py-1 font-body text-xs text-ink/50 transition hover:bg-primary-pale hover:text-primary"
                  >
                    <IcoClock />
                    {h.keywords}{h.location ? ` · ${h.location}` : ''}
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        {/* Error */}
        {error && (
          <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{error}</p>
        )}

        {/* Loading */}
        {searching && (
          <div className="flex flex-col items-center gap-5 rounded-card border border-primary/20 bg-primary-pale p-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            <div className="text-center">
              <p className="font-display text-base font-semibold text-primary">Buscando vagas e calculando match…</p>
              <p className="mt-1 font-body text-sm text-primary/60">A IA está analisando a compatibilidade com seu perfil</p>
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !searching && (
          <>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-body text-sm text-ink/50">
                {filteredVagas.length} vaga{filteredVagas.length !== 1 ? 's' : ''} encontrada{filteredVagas.length !== 1 ? 's' : ''}
                {total > vagas.length && <span className="text-ink/30"> de {total} total</span>}
              </p>
              <div className="flex gap-1.5">
                {SCORE_FILTERS.map(f => (
                  <button
                    key={f.min}
                    onClick={() => { setMinScore(f.min); setCurrentPage(1); }}
                    className={`rounded-badge px-3 py-1 font-display text-xs font-semibold transition ${
                      minScore === f.min
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vaga cards */}
            {paginatedVagas.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
                <p className="font-body text-sm text-ink/50">
                  {vagas.length > 0
                    ? 'Nenhuma vaga atende aos filtros selecionados.'
                    : 'Nenhuma vaga encontrada. Tente outros termos de busca.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedVagas.map(vaga => {
                  const isSaved = savedIds.has(vaga.id);
                  const isSaving = savingId === vaga.id;
                  const isCandidatando = candidatandoId === vaga.id;

                  return (
                    <div
                      key={vaga.id}
                      className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-5 shadow-sm transition hover:border-primary/15"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-sm font-semibold text-ink">{vaga.titulo}</h3>

                          {/* Meta tags */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {vaga.empresa && (
                              <span className="flex items-center gap-1 font-body text-xs text-ink/50">
                                <IcoBuilding />
                                {vaga.empresa}
                              </span>
                            )}
                            {vaga.local && (
                              <span className="flex items-center gap-1 font-body text-xs text-ink/50">
                                <IcoMapPin />
                                {vaga.local}
                              </span>
                            )}
                            {vaga.tipo && (
                              <span className="rounded-badge bg-gray-100 px-2 py-0.5 font-body text-[10px] font-medium text-ink/50">
                                {vaga.tipo}
                              </span>
                            )}
                            {vaga.salario && (
                              <span className="rounded-badge bg-emerald-50 px-2 py-0.5 font-body text-[10px] font-medium text-emerald-700">
                                {vaga.salario}
                              </span>
                            )}
                            {vaga.atualizada && (
                              <span className="flex items-center gap-1 font-body text-[10px] text-ink/30">
                                <IcoClock />
                                {formatDate(vaga.atualizada)}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 line-clamp-2 font-body text-xs leading-relaxed text-ink/60">
                            {stripHtml(vaga.descricao)}
                          </p>
                          <p className="mt-2 font-body text-xs text-primary/70">{vaga.match_motivo}</p>
                        </div>

                        {/* Score */}
                        <div className="hidden flex-shrink-0 text-right sm:block">
                          <div className={`font-display text-2xl font-bold ${scoreColor(vaga.match_score)}`}>
                            {vaga.match_score}%
                          </div>
                          <div className="font-body text-xs text-ink/40">compatível</div>
                          <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${scoreBg(vaga.match_score)}`}
                              style={{ width: `${vaga.match_score}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                        {/* Mobile score */}
                        <div className="flex items-center gap-2 sm:hidden">
                          <span className={`font-display text-lg font-bold ${scoreColor(vaga.match_score)}`}>
                            {vaga.match_score}%
                          </span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
                            <div className={`h-full rounded-full ${scoreBg(vaga.match_score)}`} style={{ width: `${vaga.match_score}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCandidatar(vaga)}
                            disabled={isCandidatando}
                            className="flex items-center gap-1.5 rounded-btn bg-primary px-3 py-1.5 font-display text-xs font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                          >
                            {isCandidatando ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Gerando…
                              </>
                            ) : (
                              <>
                                <IcoZap />
                                Candidatar com IA
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleSave(vaga)}
                            disabled={isSaved || isSaving}
                            title={isSaved ? 'Vaga salva' : 'Salvar vaga'}
                            className={`flex h-8 w-8 items-center justify-center rounded-btn transition ${
                              isSaved
                                ? 'bg-primary-pale text-primary'
                                : 'bg-gray-100 text-ink/40 hover:bg-primary-pale hover:text-primary'
                            } disabled:cursor-not-allowed`}
                          >
                            {isSaving ? (
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-primary border-t-transparent" />
                            ) : isSaved ? (
                              <IcoBookmarkFill />
                            ) : (
                              <IcoBookmark />
                            )}
                          </button>
                          <a
                            href={vaga.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-btn bg-gray-100 text-ink/40 transition hover:bg-primary-pale hover:text-primary"
                            title="Abrir vaga"
                          >
                            <IcoExternal />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-btn border border-gray-200 px-3 py-1.5 font-body text-xs text-ink/50 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ← Anterior
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`flex h-8 w-8 items-center justify-center rounded-btn font-display text-xs font-semibold transition ${
                        currentPage === p
                          ? 'bg-primary text-white'
                          : 'text-ink/40 hover:bg-gray-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-btn border border-gray-200 px-3 py-1.5 font-body text-xs text-ink/50 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
