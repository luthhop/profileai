import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch, apiError } from '../lib/api';
import AppLayout from '../components/AppLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Candidatura {
  id: string;
  vaga_titulo: string;
  vaga_empresa: string | null;
  vaga_url: string | null;
  match_score: number | null;
  status: string;
  data_aplicacao: string | null;
  notas: string | null;
  created_at: string;
}

type Status = 'salva' | 'aplicada' | 'entrevista' | 'oferta' | 'rejeitada';

const COLUMNS: { status: Status; label: string; color: string; bg: string }[] = [
  { status: 'salva', label: 'Salvas', color: 'text-ink/60', bg: 'bg-gray-100' },
  { status: 'aplicada', label: 'Aplicadas', color: 'text-blue-600', bg: 'bg-blue-50' },
  { status: 'entrevista', label: 'Entrevista', color: 'text-amber-600', bg: 'bg-amber-50' },
  { status: 'oferta', label: 'Oferta', color: 'text-match-high', bg: 'bg-emerald-50' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoExternal() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function IcoTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function IcoClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-match-high';
  if (score >= 60) return 'text-match-mid';
  return 'text-match-low';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Candidaturas() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editNotas, setEditNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);

  // Add manual
  const [showAdd, setShowAdd] = useState(false);
  const [addTitulo, setAddTitulo] = useState('');
  const [addEmpresa, setAddEmpresa] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [adding, setAdding] = useState(false);

  // Drag
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { navigate('/', { replace: true }); return; }
      setUser(u);
      await fetchCandidaturas(u);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function fetchCandidaturas(_u: User) {
    try {
      const res = await authFetch(`${API}/api/candidaturas`);
      if (!res.ok) throw new Error(await apiError(res));
      const data = await res.json();
      setCandidaturas(data);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Erro ao carregar candidaturas.');
    }
  }

  async function updateStatus(id: string, newStatus: Status) {
    setCandidaturas(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c),
    );

    try {
      await authFetch(`${API}/api/candidaturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      if (user) await fetchCandidaturas(user);
    }
  }

  async function saveNotas(id: string) {
    setSavingNotas(true);
    try {
      await authFetch(`${API}/api/candidaturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: editNotas }),
      });
      setCandidaturas(prev =>
        prev.map(c => c.id === id ? { ...c, notas: editNotas } : c),
      );
    } catch { /* fallback */ }
    setSavingNotas(false);
  }

  async function deleteCandidatura(id: string) {
    const cand = candidaturas.find(c => c.id === id);
    const nome = cand?.vaga_titulo || 'esta candidatura';
    if (!window.confirm(`Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`)) return;

    setCandidaturas(prev => prev.filter(c => c.id !== id));
    setSelectedId(null);

    try {
      await authFetch(`${API}/api/candidaturas/${id}`, {
        method: 'DELETE',
      });
    } catch {
      if (user) await fetchCandidaturas(user);
    }
  }

  async function addCandidatura() {
    if (!addTitulo.trim()) return;

    setAdding(true);
    try {
      const res = await authFetch(`${API}/api/candidaturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaga_titulo: addTitulo.trim(),
          vaga_empresa: addEmpresa.trim() || null,
          vaga_url: addUrl.trim() || null,
          status: 'salva',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidaturas(prev => [data, ...prev]);
        setAddTitulo('');
        setAddEmpresa('');
        setAddUrl('');
        setShowAdd(false);
      }
    } catch { /* ignore */ }
    setAdding(false);
  }

  // Drag handlers
  function onDragStart(id: string) {
    dragItem.current = id;
  }
  function onDragOver(e: React.DragEvent, status: Status) {
    e.preventDefault();
    setDragOverCol(status);
  }
  function onDragLeave() {
    setDragOverCol(null);
  }
  function onDrop(status: Status) {
    setDragOverCol(null);
    if (dragItem.current) {
      updateStatus(dragItem.current, status);
      dragItem.current = null;
    }
  }

  const selected = candidaturas.find(c => c.id === selectedId) ?? null;

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Candidaturas</h1>
            <p className="font-body text-sm text-ink/50">
              {candidaturas.length} candidatura{candidaturas.length !== 1 ? 's' : ''} no total
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 rounded-btn bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.98]"
          >
            <IcoPlus />
            Adicionar
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 bg-white px-6 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Título da vaga *</label>
              <input
                value={addTitulo}
                onChange={e => setAddTitulo(e.target.value)}
                placeholder="Ex: Desenvolvedor React"
                className="rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1 sm:w-40">
              <label className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">Empresa</label>
              <input
                value={addEmpresa}
                onChange={e => setAddEmpresa(e.target.value)}
                placeholder="Empresa"
                className="rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1 sm:w-48">
              <label className="font-display text-[10px] font-semibold uppercase tracking-wider text-ink/30">URL</label>
              <input
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button
              onClick={addCandidatura}
              disabled={!addTitulo.trim() || adding}
              className="rounded-btn bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}

        {error && (
          <p className="mx-6 mt-3 rounded-btn bg-red-50 px-4 py-2 font-body text-sm text-red-600">{error}</p>
        )}

        {/* Kanban Board */}
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {COLUMNS.map(col => {
            const cards = candidaturas.filter(c => c.status === col.status);
            const isOver = dragOverCol === col.status;

            return (
              <div
                key={col.status}
                className={`flex w-72 flex-shrink-0 flex-col rounded-card border transition ${
                  isOver ? 'border-primary bg-primary-pale/50' : 'border-gray-100 bg-white'
                }`}
                onDragOver={e => onDragOver(e, col.status)}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop(col.status)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 border-b border-gray-50 px-4 py-3">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${col.bg} font-display text-[10px] font-bold ${col.color}`}>
                    {cards.length}
                  </span>
                  <span className={`font-display text-sm font-semibold ${col.color}`}>{col.label}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                  {cards.length === 0 && (
                    <p className="py-8 text-center font-body text-xs text-ink/20">
                      Arraste um card para cá
                    </p>
                  )}
                  {cards.map(c => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => onDragStart(c.id)}
                      onClick={() => { setSelectedId(c.id); setEditNotas(c.notas ?? ''); }}
                      className="cursor-pointer rounded-btn border border-gray-100 bg-white p-3 shadow-sm transition hover:border-primary/20 hover:shadow active:scale-[.98]"
                    >
                      <p className="font-display text-xs font-semibold text-ink leading-tight">{c.vaga_titulo}</p>
                      {c.vaga_empresa && (
                        <p className="mt-0.5 font-body text-[10px] text-ink/50">{c.vaga_empresa}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {c.match_score != null && (
                          <span className={`font-display text-xs font-bold ${scoreColor(c.match_score)}`}>
                            {c.match_score}% match
                          </span>
                        )}
                        {c.data_aplicacao && (
                          <span className="font-body text-[10px] text-ink/30">{formatDate(c.data_aplicacao)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Rejeitada column (special) */}
          {(() => {
            const rejeitadas = candidaturas.filter(c => c.status === 'rejeitada');
            const isOver = dragOverCol === 'rejeitada';
            return (
              <div
                className={`flex w-72 flex-shrink-0 flex-col rounded-card border transition ${
                  isOver ? 'border-red-300 bg-red-50/50' : 'border-gray-100 bg-white'
                }`}
                onDragOver={e => onDragOver(e, 'rejeitada')}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop('rejeitada')}
              >
                <div className="flex items-center gap-2 border-b border-gray-50 px-4 py-3">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-50 font-display text-[10px] font-bold text-match-low">
                    {rejeitadas.length}
                  </span>
                  <span className="font-display text-sm font-semibold text-match-low">Rejeitada</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                  {rejeitadas.length === 0 && (
                    <p className="py-8 text-center font-body text-xs text-ink/20">
                      Arraste um card para cá
                    </p>
                  )}
                  {rejeitadas.map(c => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => onDragStart(c.id)}
                      onClick={() => { setSelectedId(c.id); setEditNotas(c.notas ?? ''); }}
                      className="cursor-pointer rounded-btn border border-gray-100 bg-white p-3 opacity-60 shadow-sm transition hover:border-red-200 hover:opacity-100"
                    >
                      <p className="font-display text-xs font-semibold text-ink leading-tight line-through">{c.vaga_titulo}</p>
                      {c.vaga_empresa && (
                        <p className="mt-0.5 font-body text-[10px] text-ink/50">{c.vaga_empresa}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-100 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-display text-base font-bold text-ink">Detalhes da candidatura</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-btn text-ink/40 transition hover:bg-gray-100 hover:text-ink"
              >
                <IcoClose />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">{selected.vaga_titulo}</h3>
                {selected.vaga_empresa && (
                  <p className="mt-0.5 font-body text-sm text-ink/50">{selected.vaga_empresa}</p>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                {selected.match_score != null && (
                  <span className={`rounded-badge px-2.5 py-1 font-display text-xs font-bold ${scoreColor(selected.match_score)} bg-gray-50`}>
                    {selected.match_score}% match
                  </span>
                )}
                {selected.data_aplicacao && (
                  <span className="rounded-badge bg-gray-50 px-2.5 py-1 font-body text-xs text-ink/50">
                    Aplicado em {formatDate(selected.data_aplicacao)}
                  </span>
                )}
                <span className="rounded-badge bg-gray-50 px-2.5 py-1 font-body text-xs text-ink/50">
                  Criado em {formatDate(selected.created_at)}
                </span>
              </div>

              {selected.vaga_url && (
                <a
                  href={selected.vaga_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-sm text-primary transition hover:text-primary-dark"
                >
                  <IcoExternal />
                  Abrir vaga
                </a>
              )}

              {/* Status selector */}
              <div className="flex flex-col gap-2">
                <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {([...COLUMNS.map(c => c.status), 'rejeitada'] as Status[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`rounded-badge px-3 py-1 font-display text-xs font-semibold capitalize transition ${
                        selected.status === s
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-ink/50 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-2">
                <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Notas</label>
                <textarea
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  rows={5}
                  placeholder="Adicione anotações sobre esta candidatura…"
                  className="resize-none rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-300 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  onClick={() => saveNotas(selected.id)}
                  disabled={savingNotas}
                  className="self-start rounded-btn bg-primary px-4 py-2 font-display text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                >
                  {savingNotas ? 'Salvando…' : 'Salvar notas'}
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-100 px-5 py-3">
              <button
                onClick={() => deleteCandidatura(selected.id)}
                className="flex items-center gap-1.5 rounded-btn px-3 py-2 font-body text-xs text-red-500 transition hover:bg-red-50"
              >
                <IcoTrash />
                Excluir candidatura
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
