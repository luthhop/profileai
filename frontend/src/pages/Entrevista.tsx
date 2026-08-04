import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch, apiError } from '../lib/api';
import AppLayout, { LogoMark } from '../components/AppLayout';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Phase = 'setup' | 'interview' | 'feedback';
type Tab = 'mock' | 'preparacao';

interface PrepQuestion { pergunta: string; dica: string }
interface SalaryTip { dica: string }
interface AskQuestion { pergunta: string; por_que: string }

interface PrepResult {
  comportamentais: PrepQuestion[];
  tecnicas: PrepQuestion[];
  salario: SalaryTip[];
  perguntar_ao_entrevistador: AskQuestion[];
}

interface SessionItem {
  id: string;
  vaga: string | null;
  messages_count: number;
  score: number | null;
  created_at: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoSend() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>);
}
function IcoStop() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>);
}
function IcoRefresh() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>);
}
function IcoBook() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>);
}
function IcoMic() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>);
}
function IcoClock() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
}

// ─── Markdown-lite ──────────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="mt-3 mb-1 font-display text-sm font-bold text-ink">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="mt-4 mb-1 font-display text-base font-bold text-ink">{line.slice(3)}</h2>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={i} className="mt-2 font-body text-sm font-semibold text-ink">{line.slice(2, -2)}</p>);
    } else if (line.startsWith('- ')) {
      elements.push(<div key={i} className="ml-2 flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" /><p className="font-body text-sm text-ink/80">{renderInline(line.slice(2))}</p></div>);
    } else if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '');
      const num = line.match(/^(\d+)/)?.[1];
      elements.push(<div key={i} className="ml-1 flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-pale font-display text-xs font-bold text-primary">{num}</span><p className="font-body text-sm text-ink/80">{renderInline(content)}</p></div>);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="font-body text-sm text-ink/80">{renderInline(line)}</p>);
    }
  }
  return elements;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    return part;
  });
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Entrevista() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('mock');

  // Mock interview
  const [phase, setPhase] = useState<Phase>('setup');
  const [vagaDescricao, setVagaDescricao] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preparação
  const [prepResult, setPrepResult] = useState<PrepResult | null>(null);
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [prepVaga, setPrepVaga] = useState('');
  const [errorPrep, setErrorPrep] = useState<string | null>(null);
  const [prepSection, setPrepSection] = useState<'comportamentais' | 'tecnicas' | 'salario' | 'perguntar'>('comportamentais');

  // Session history
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      loadSessions(u.id);
      setLoading(false);
    }
    load();
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function loadSessions(userId: string) {
    const { data } = await supabase
      .from('interview_sessions')
      .select('id, vaga, messages_count, score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data && data.length > 0) {
      setSessions(data);
    } else {
      const saved = localStorage.getItem(`interview_sessions_${userId}`);
      if (saved) {
        try { setSessions(JSON.parse(saved)); } catch { /* ignore */ }
      }
    }
  }

  async function saveSession(msgs: ChatMessage[], vaga: string | undefined) {
    if (!user) return;
    const userMsgs = msgs.filter(m => m.role === 'user' && m.content !== 'FEEDBACK_FINAL' && m.content !== 'Olá, estou pronto para começar a entrevista.');
    const scoreMatch = msgs[msgs.length - 1]?.content.match(/(\d{1,3})\s*(?:\/\s*100|%|pontos)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

    const session: SessionItem = {
      id: crypto.randomUUID(),
      vaga: vaga?.slice(0, 100) || null,
      messages_count: userMsgs.length,
      score,
      created_at: new Date().toISOString(),
    };

    const updated = [session, ...sessions].slice(0, 20);
    setSessions(updated);

    await supabase.from('interview_sessions').insert({
      user_id: user.id,
      vaga: session.vaga,
      messages_count: session.messages_count,
      score: session.score,
    });
  }

  async function callApi(msgs: ChatMessage[]) {
    const res = await authFetch(`${API}/api/entrevista/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, vaga_descricao: vagaDescricao || undefined, messages: msgs }),
    });
    if (!res.ok) throw new Error(await apiError(res));
    return (await res.json()) as { response: string; finished: boolean };
  }

  async function handleStart() {
    if (!profile) return;
    setSending(true);
    setError(null);
    setPhase('interview');
    try {
      const initialMsgs: ChatMessage[] = [{ role: 'user', content: 'Olá, estou pronto para começar a entrevista.' }];
      const data = await callApi(initialMsgs);
      setMessages([...initialMsgs, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Erro ao iniciar entrevista. Tente novamente.');
      setPhase('setup');
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    try {
      const data = await callApi(newMessages);
      const updated = [...newMessages, { role: 'assistant' as const, content: data.response }];
      setMessages(updated);
      if (data.finished) {
        setPhase('feedback');
        saveSession(updated, vagaDescricao || undefined);
      }
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleFinish() {
    setSending(true);
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: 'FEEDBACK_FINAL' }];
    setMessages(newMessages);
    try {
      const data = await callApi(newMessages);
      const updated = [...newMessages, { role: 'assistant' as const, content: data.response }];
      setMessages(updated);
      setPhase('feedback');
      saveSession(updated, vagaDescricao || undefined);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Erro ao gerar feedback. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  function handleRestart() {
    setPhase('setup');
    setMessages([]);
    setInput('');
    setError(null);
    setVagaDescricao('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handlePreparacao() {
    if (!profile) return;
    setGeneratingPrep(true);
    setErrorPrep(null);
    try {
      const { data: fullProfile } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
      const res = await authFetch(`${API}/api/entrevista/preparacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile, vaga_descricao: prepVaga || undefined }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as PrepResult;
      setPrepResult(data);
    } catch (err) {
      setErrorPrep(err instanceof Error && err.message ? err.message : 'Erro ao gerar material de preparação. Tente novamente.');
    } finally {
      setGeneratingPrep(false);
    }
  }

  if (loading || !user) {
    return (<div className="flex h-screen items-center justify-center bg-surface"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>);
  }

  const userMsgCount = messages.filter(m => m.role === 'user' && m.content !== 'FEEDBACK_FINAL' && m.content !== 'Olá, estou pronto para começar a entrevista.').length;

  return (
    <AppLayout user={user}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold tracking-tight text-ink">Entrevistas</h1>
              <p className="font-body text-xs text-ink/50">
                {activeTab === 'mock' && phase === 'setup' && 'Configure e inicie sua simulação'}
                {activeTab === 'mock' && phase === 'interview' && `Pergunta ${userMsgCount + 1} · Responda naturalmente`}
                {activeTab === 'mock' && phase === 'feedback' && 'Entrevista concluída · Veja seu feedback'}
                {activeTab === 'preparacao' && 'Material personalizado para sua próxima entrevista'}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              {activeTab === 'mock' && phase === 'interview' && userMsgCount >= 3 && (
                <button onClick={handleFinish} disabled={sending} className="flex items-center gap-1.5 rounded-btn border border-primary/30 px-4 py-2 font-display text-xs font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50">
                  <IcoStop /> Finalizar
                </button>
              )}
              {activeTab === 'mock' && phase === 'feedback' && (
                <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-btn bg-primary px-4 py-2 font-display text-xs font-semibold text-white transition hover:bg-primary-dark">
                  <IcoRefresh /> Nova entrevista
                </button>
              )}
              <button onClick={() => setShowSessions(!showSessions)} className={`flex items-center gap-1 rounded-btn border px-3 py-2 font-display text-xs font-semibold transition ${showSessions ? 'border-primary bg-primary-pale text-primary' : 'border-gray-200 text-ink/40 hover:border-primary hover:text-primary'}`}>
                <IcoClock /> Histórico
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {phase === 'setup' && (
          <div className="border-b border-gray-100 bg-white px-6">
            <div className="mx-auto flex max-w-3xl gap-1 pt-2">
              {[
                { key: 'mock' as Tab, label: 'Mock Interview', icon: <IcoMic /> },
                { key: 'preparacao' as Tab, label: 'Preparação', icon: <IcoBook /> },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-display text-xs font-semibold transition ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-ink/40 hover:text-ink'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Session history panel */}
        {showSessions && (
          <div className="border-b border-gray-100 bg-white px-6 py-4">
            <div className="mx-auto max-w-3xl">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink">Sessões anteriores</h3>
              {sessions.length === 0 ? (
                <p className="font-body text-xs text-ink/40">Nenhuma sessão registrada ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sessions.slice(0, 10).map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-btn border border-gray-100 bg-surface/50 px-4 py-2.5">
                      <div>
                        <p className="font-body text-xs text-ink/70">{s.vaga || 'Entrevista geral'}</p>
                        <p className="font-body text-[10px] text-ink/30">{formatDate(s.created_at)} · {s.messages_count} respostas</p>
                      </div>
                      {s.score != null && (
                        <span className={`font-display text-sm font-bold ${s.score >= 70 ? 'text-match-high' : s.score >= 40 ? 'text-match-mid' : 'text-match-low'}`}>{s.score}/100</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-6">

            {!profile && (
              <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
                <p className="font-body text-sm text-ink/50">Preencha seu perfil para simular entrevistas.</p>
                <button onClick={() => navigate('/onboarding')} className="rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark">Preencher perfil</button>
              </div>
            )}

            {/* ═══ TAB: Mock Interview ═══ */}

            {activeTab === 'mock' && profile && phase === 'setup' && (
              <div className="flex flex-col gap-5">
                <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 font-display text-base font-semibold text-ink">Configurar entrevista</h2>
                  <p className="mb-4 font-body text-sm text-ink/50">Cole a descrição da vaga (opcional) para perguntas personalizadas.</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Descrição da vaga (opcional)</label>
                    <textarea rows={5} value={vagaDescricao} onChange={e => setVagaDescricao(e.target.value)} placeholder="Cole aqui a descrição completa da vaga…" className="resize-none rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </div>
                </div>
                <div className="rounded-card border border-primary/15 bg-primary-pale p-6">
                  <h3 className="mb-2 font-display text-sm font-semibold text-primary">Como funciona</h3>
                  <ul className="flex flex-col gap-2">
                    {['A IA fará entre 5 e 7 perguntas, alternando técnicas e comportamentais', 'Responda como se fosse uma entrevista real — use exemplos concretos', 'Após 3+ respostas, você pode pedir o feedback final', 'O feedback usa o método STAR e dá nota de 0 a 100'].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-display text-[10px] font-bold text-primary">{i + 1}</span><span className="font-body text-sm text-primary/80">{tip}</span></li>
                    ))}
                  </ul>
                </div>
                {error && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{error}</p>}
                <button onClick={handleStart} disabled={sending} className="flex items-center justify-center gap-2 rounded-btn bg-primary px-8 py-3.5 font-display text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]">
                  {sending ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Iniciando…</>) : 'Iniciar entrevista'}
                </button>
              </div>
            )}

            {/* Chat */}
            {activeTab === 'mock' && (phase === 'interview' || phase === 'feedback') && (
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => {
                  if (msg.content === 'Olá, estou pronto para começar a entrevista.' || msg.content === 'FEEDBACK_FINAL') return null;
                  if (msg.role === 'assistant') {
                    return (<div key={i} className="flex items-start gap-3"><LogoMark size={32} /><div className="max-w-lg rounded-card rounded-tl-sm border border-gray-100 bg-white px-5 py-4 shadow-sm">{renderMarkdown(msg.content)}</div></div>);
                  }
                  return (<div key={i} className="flex justify-end"><div className="max-w-lg rounded-card rounded-tr-sm bg-primary px-5 py-4"><p className="whitespace-pre-line font-body text-sm text-white">{msg.content}</p></div></div>);
                })}
                {sending && (<div className="flex items-start gap-3"><LogoMark size={32} /><div className="flex items-center gap-1 rounded-card rounded-tl-sm border border-gray-100 bg-white px-5 py-4 shadow-sm"><span className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:0ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:150ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-primary/40 [animation-delay:300ms]" /></div></div>)}
                {error && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{error}</p>}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ═══ TAB: Preparação ═══ */}

            {activeTab === 'preparacao' && profile && !prepResult && !generatingPrep && (
              <div className="flex flex-col gap-5">
                <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><IcoBook /></div>
                    <div>
                      <h2 className="font-display text-base font-semibold text-ink">Preparação para Entrevista</h2>
                      <p className="font-body text-xs text-ink/50">A IA gera perguntas e dicas personalizadas para o seu perfil</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Descrição da vaga (opcional)</label>
                    <textarea rows={4} value={prepVaga} onChange={e => setPrepVaga(e.target.value)} placeholder="Cole a descrição da vaga para perguntas mais específicas…" className="resize-none rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                  </div>
                  {errorPrep && <p className="mt-2 rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{errorPrep}</p>}
                  <button onClick={handlePreparacao} className="mt-4 flex items-center gap-2 rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.98]">
                    <IcoBook /> Gerar material de preparação
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preparacao' && generatingPrep && (
              <div className="flex flex-col items-center gap-5 rounded-card border border-amber-200/50 bg-amber-50 p-10">
                <div className="relative flex h-16 w-16 items-center justify-center"><div className="absolute inset-0 animate-ping rounded-full bg-amber-400/15" /><div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" /></div>
                <p className="font-display text-base font-semibold text-amber-700">Gerando material de preparação…</p>
              </div>
            )}

            {activeTab === 'preparacao' && prepResult && (
              <div className="flex flex-col gap-5">
                {/* Section tabs */}
                <div className="flex gap-1 overflow-x-auto rounded-btn bg-gray-100 p-1">
                  {[
                    { key: 'comportamentais' as const, label: 'Comportamentais' },
                    { key: 'tecnicas' as const, label: 'Técnicas' },
                    { key: 'salario' as const, label: 'Negociação salarial' },
                    { key: 'perguntar' as const, label: 'Perguntar ao entrevistador' },
                  ].map(s => (
                    <button key={s.key} onClick={() => setPrepSection(s.key)} className={`flex-1 whitespace-nowrap rounded-btn px-3 py-2 font-display text-xs font-semibold transition ${prepSection === s.key ? 'bg-white text-primary shadow-sm' : 'text-ink/50 hover:text-ink'}`}>{s.label}</button>
                  ))}
                </div>

                {prepSection === 'comportamentais' && (
                  <div className="flex flex-col gap-3">
                    {prepResult.comportamentais.map((q, i) => (
                      <div key={i} className="rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="font-display text-sm font-semibold text-ink">{q.pergunta}</p>
                        <p className="mt-2 rounded-btn bg-primary-pale/50 px-3 py-2 font-body text-xs text-primary/80">{q.dica}</p>
                      </div>
                    ))}
                  </div>
                )}

                {prepSection === 'tecnicas' && (
                  <div className="flex flex-col gap-3">
                    {prepResult.tecnicas.map((q, i) => (
                      <div key={i} className="rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="font-display text-sm font-semibold text-ink">{q.pergunta}</p>
                        <p className="mt-2 rounded-btn bg-primary-pale/50 px-3 py-2 font-body text-xs text-primary/80">{q.dica}</p>
                      </div>
                    ))}
                  </div>
                )}

                {prepSection === 'salario' && (
                  <div className="flex flex-col gap-3">
                    {prepResult.salario.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 font-display text-xs font-bold text-match-high">{i + 1}</span>
                        <p className="font-body text-sm text-ink/80">{s.dica}</p>
                      </div>
                    ))}
                  </div>
                )}

                {prepSection === 'perguntar' && (
                  <div className="flex flex-col gap-3">
                    {prepResult.perguntar_ao_entrevistador.map((q, i) => (
                      <div key={i} className="rounded-card border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="font-display text-sm font-semibold text-ink">"{q.pergunta}"</p>
                        <p className="mt-2 font-body text-xs text-ink/50">{q.por_que}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setPrepResult(null); setErrorPrep(null); }} className="self-start font-body text-xs text-ink/40 transition hover:text-primary">Gerar novo material →</button>
              </div>
            )}
          </div>
        </div>

        {/* Input bar */}
        {activeTab === 'mock' && phase === 'interview' && (
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            <div className="mx-auto flex max-w-3xl gap-3">
              <textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua resposta…" disabled={sending} className="flex-1 resize-none rounded-btn border border-gray-200 px-4 py-3 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50" />
              <button onClick={handleSend} disabled={sending || !input.trim()} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-btn bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.95]"><IcoSend /></button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
