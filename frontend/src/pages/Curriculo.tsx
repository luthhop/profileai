import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch, apiError, UpgradeRequiredError } from '../lib/api';
import AppLayout from '../components/AppLayout';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
function IcoMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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
function IcoDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IcoEye() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Curriculo() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'generico' | 'vaga' | 'carta'>('generico');

  // Genérico
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  // Por vaga
  const [vagaTexto, setVagaTexto] = useState('');
  const [vagaUrl, setVagaUrl] = useState('');
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [generatingVaga, setGeneratingVaga] = useState(false);
  const [generatedVaga, setGeneratedVaga] = useState(false);
  const [errorVaga, setErrorVaga] = useState<string | null>(null);
  const [previewVagaHtml, setPreviewVagaHtml] = useState<string | null>(null);
  const [previewingVaga, setPreviewingVaga] = useState(false);

  // Carta de apresentação
  const [cartaVaga, setCartaVaga] = useState('');
  const [cartaVagaUrl, setCartaVagaUrl] = useState('');
  const [extractingCartaUrl, setExtractingCartaUrl] = useState(false);
  const [generatingCarta, setGeneratingCarta] = useState(false);
  const [cartaResult, setCartaResult] = useState<{ carta: string; assunto_email: string } | null>(null);
  const [errorCarta, setErrorCarta] = useState<string | null>(null);
  const [copiedCarta, setCopiedCarta] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeVagaRef = useRef<HTMLIFrameElement>(null);

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

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [navigate]);

  // ── Genérico: Preview ──
  async function handlePreview() {
    if (!profile) return;
    setPreviewing(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/api/cv/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setError('Erro ao gerar preview. Tente novamente.');
    } finally {
      setPreviewing(false);
    }
  }

  // ── Genérico: Download PDF ──
  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await authFetch(`${API}/api/cv/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const blob = await res.blob();
      downloadBlob(blob, `curriculo-${nameSlug()}.pdf`);
      setGenerated(true);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setError('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  // ── Por Vaga: Extrair URL ──
  async function handleExtractUrl() {
    if (!vagaUrl.trim()) return;
    setExtractingUrl(true);
    setErrorVaga(null);
    try {
      const res = await authFetch(`${API}/api/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: vagaUrl.trim() }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as { texto: string };
      setVagaTexto(data.texto);
    } catch {
      setErrorVaga('Não foi possível extrair o conteúdo da URL. Cole o texto manualmente.');
    } finally {
      setExtractingUrl(false);
    }
  }

  // ── Por Vaga: Preview ──
  async function handlePreviewVaga() {
    if (!profile || vagaTexto.trim().length < 20) return;
    setPreviewingVaga(true);
    setErrorVaga(null);
    try {
      const res = await authFetch(`${API}/api/cv/preview-por-vaga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, vaga: vagaTexto }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const html = await res.text();
      setPreviewVagaHtml(html);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setErrorVaga('Erro ao gerar preview. Tente novamente.');
    } finally {
      setPreviewingVaga(false);
    }
  }

  // ── Por Vaga: Download PDF ──
  async function handleGenerateVaga() {
    if (!profile || vagaTexto.trim().length < 20) return;
    setGeneratingVaga(true);
    setErrorVaga(null);
    try {
      const res = await authFetch(`${API}/api/cv/gerar-por-vaga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, vaga: vagaTexto }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const blob = await res.blob();
      downloadBlob(blob, `curriculo-vaga-${nameSlug()}.pdf`);
      setGeneratedVaga(true);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setErrorVaga('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGeneratingVaga(false);
    }
  }

  async function handleExtractCartaUrl() {
    if (!cartaVagaUrl.trim()) return;
    setExtractingCartaUrl(true);
    setErrorCarta(null);
    try {
      const res = await authFetch(`${API}/api/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cartaVagaUrl.trim() }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = (await res.json()) as { texto: string };
      setCartaVaga(data.texto);
    } catch {
      setErrorCarta('Não foi possível extrair o conteúdo da URL.');
    } finally {
      setExtractingCartaUrl(false);
    }
  }

  async function handleGenerateCarta() {
    if (!profile || cartaVaga.trim().length < 20) return;
    setGeneratingCarta(true);
    setErrorCarta(null);
    try {
      const res = await authFetch(`${API}/api/cv/carta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, vaga: cartaVaga }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      const data = await res.json();
      setCartaResult(data);
    } catch (err) {
      if (err instanceof UpgradeRequiredError) { navigate('/planos'); return; }
      setErrorCarta('Erro ao gerar carta de apresentação. Tente novamente.');
    } finally {
      setGeneratingCarta(false);
    }
  }

  async function handleCopyCarta(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedCarta(key);
    setTimeout(() => setCopiedCarta(null), 2000);
  }

  function nameSlug(): string {
    const nome = (profile?.nome as string) ?? 'profissional';
    return nome.toLowerCase().replace(/\s+/g, '-');
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const fields = [
    { label: 'Nome', value: profile?.nome },
    { label: 'Cargo', value: profile?.cargo_desejado ?? profile?.cargo },
    { label: 'Área', value: profile?.area_desejada ?? profile?.area },
    { label: 'Objetivo', value: profile?.objetivo_profissional },
    { label: 'Formação', value: (profile?.formacoes as unknown[])?.length ? 'Preenchido' : profile?.formacao },
    { label: 'Experiências', value: (profile?.experiencias_detalhadas as unknown[])?.length ? `${(profile?.experiencias_detalhadas as unknown[]).length} cadastradas` : (profile?.experiencias as Record<string, unknown>)?.descricao ? 'Preenchido' : null },
    { label: 'Stack', value: (profile?.stack as string[])?.length ? (profile?.stack as string[]).slice(0, 3).join(', ') + ((profile?.stack as string[]).length > 3 ? '…' : '') : null },
    { label: 'Habilidades', value: (profile?.habilidades as string[])?.length ? `${(profile?.habilidades as string[]).length} listadas` : null },
  ];
  const completeness = fields.filter(f => f.value).length;
  const pct = Math.round((completeness / fields.length) * 100);

  return (
    <AppLayout user={user}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Currículo PDF</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Gere um currículo ATS-friendly a partir do seu perfil
          </p>
        </div>

        {/* Sem perfil */}
        {!profile && (
          <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="font-body text-sm text-ink/50">Preencha seu perfil primeiro para gerar o currículo.</p>
            <button
              onClick={() => navigate('/perfil')}
              className="rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Preencher perfil
            </button>
          </div>
        )}

        {profile && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 rounded-btn bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('generico')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-btn px-4 py-2.5 font-display text-sm font-semibold transition ${
                  activeTab === 'generico'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                <IcoDoc />
                CV Genérico
              </button>
              <button
                onClick={() => setActiveTab('vaga')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-btn px-4 py-2.5 font-display text-sm font-semibold transition ${
                  activeTab === 'vaga'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                <IcoTarget />
                CV para Vaga
              </button>
              <button
                onClick={() => setActiveTab('carta')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-btn px-4 py-2.5 font-display text-sm font-semibold transition ${
                  activeTab === 'carta'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                <IcoMail />
                Carta
              </button>
            </div>

            {/* ═══ TAB: CV Genérico ═══ */}
            {activeTab === 'generico' && (
              <>
                {/* Completude do perfil */}
                <div className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-semibold text-ink">Dados do currículo</h2>
                    <button
                      onClick={() => navigate('/perfil')}
                      className="flex items-center gap-1.5 font-body text-xs text-primary transition hover:underline"
                    >
                      <IcoEdit />
                      Editar perfil
                    </button>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="font-body text-xs text-ink/50">Completude do perfil</span>
                        <span className={`font-display text-xs font-semibold ${pct >= 75 ? 'text-match-high' : pct >= 50 ? 'text-match-mid' : 'text-match-low'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-match-high' : pct >= 50 ? 'bg-match-mid' : 'bg-match-low'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {fields.map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${item.value ? 'bg-match-high/20 text-match-high' : 'bg-gray-100 text-gray-300'}`}>
                          {item.value ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          )}
                        </div>
                        <span className="font-display text-xs font-semibold text-ink/35">{item.label}</span>
                        <span className={`truncate font-body text-xs ${item.value ? 'text-ink/70' : 'text-ink/25'}`}>
                          {(item.value as string) ?? 'Não preenchido'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{error}</p>
                )}

                {/* Preview iframe */}
                {previewHtml && (
                  <div className="rounded-card border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                      <h3 className="font-display text-sm font-semibold text-ink">Preview do Currículo</h3>
                      <button
                        onClick={() => setPreviewHtml(null)}
                        className="font-body text-xs text-ink/40 hover:text-ink transition"
                      >
                        Fechar preview
                      </button>
                    </div>
                    <iframe
                      ref={iframeRef}
                      srcDoc={previewHtml}
                      className="w-full border-0"
                      style={{ height: '842px' }}
                      title="Preview CV"
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col items-center gap-4 rounded-card border border-gray-100 bg-white p-8 shadow-sm">
                  {generated && (
                    <div className="flex items-center gap-2 rounded-btn bg-emerald-50 px-4 py-2 text-emerald-700">
                      <IcoCheck />
                      <span className="font-body text-sm font-medium">PDF gerado e baixado com sucesso!</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handlePreview}
                      disabled={previewing}
                      className="flex items-center gap-2 rounded-btn border border-gray-200 bg-white px-6 py-3 font-display text-sm font-semibold text-ink/70 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                    >
                      {previewing ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Carregando…
                        </>
                      ) : (
                        <>
                          <IcoEye />
                          Preview
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="flex items-center gap-2 rounded-btn bg-primary px-8 py-3 font-display text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                    >
                      {generating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Gerando PDF…
                        </>
                      ) : (
                        <>
                          <IcoDownload />
                          {generated ? 'Baixar novamente' : 'Baixar PDF'}
                        </>
                      )}
                    </button>
                  </div>

                  <p className="font-body text-xs text-ink/30">
                    Formato A4 · ATS-friendly · Uma coluna · Sem imagens
                  </p>
                </div>
              </>
            )}

            {/* ═══ TAB: CV para Vaga Específica ═══ */}
            {activeTab === 'vaga' && (
              <>
                {/* Input da vaga */}
                {!previewVagaHtml && (
                  <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <IcoTarget />
                      </div>
                      <div>
                        <h2 className="font-display text-base font-semibold text-ink">CV para Vaga Específica</h2>
                        <p className="font-body text-xs text-ink/50">
                          A IA reordena experiências, reescreve bullets e destaca o que a vaga pede
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">
                        Link da vaga (opcional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={vagaUrl}
                          onChange={e => setVagaUrl(e.target.value)}
                          placeholder="https://www.linkedin.com/jobs/view/..."
                          className="flex-1 rounded-btn border border-gray-200 px-4 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        <button
                          type="button"
                          onClick={handleExtractUrl}
                          disabled={!vagaUrl.trim() || extractingUrl}
                          className="flex items-center gap-1.5 rounded-btn bg-gray-100 px-4 py-2.5 font-display text-xs font-semibold text-ink/60 transition hover:bg-primary-pale hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {extractingUrl ? (
                            <>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              Extraindo…
                            </>
                          ) : (
                            'Extrair texto'
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">
                        Descrição da vaga
                      </label>
                      <textarea
                        value={vagaTexto}
                        onChange={e => setVagaTexto(e.target.value)}
                        placeholder="Cole aqui a descrição completa da vaga — requisitos, responsabilidades, stack…"
                        rows={8}
                        className="w-full resize-none rounded-btn border border-gray-200 px-4 py-3 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <span className="self-end font-body text-xs text-ink/30">
                        {vagaTexto.length} caracteres {vagaTexto.length > 0 && vagaTexto.length < 20 ? '(mínimo 20)' : ''}
                      </span>
                    </div>

                    {errorVaga && (
                      <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{errorVaga}</p>
                    )}

                    {/* Loading state */}
                    {(previewingVaga || generatingVaga) && (
                      <div className="flex flex-col items-center gap-4 rounded-btn border border-amber-200/50 bg-amber-50 p-8">
                        <div className="relative flex h-14 w-14 items-center justify-center">
                          <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/15" />
                          <div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                        </div>
                        <div className="text-center">
                          <p className="font-display text-sm font-semibold text-amber-700">
                            {previewingVaga ? 'IA otimizando seu currículo…' : 'Gerando PDF otimizado…'}
                          </p>
                          <p className="mt-1 font-body text-xs text-amber-600/70">
                            Reordenando experiências e reescrevendo bullets para a vaga
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handlePreviewVaga}
                        disabled={vagaTexto.trim().length < 20 || previewingVaga || generatingVaga}
                        className="flex items-center gap-2 rounded-btn border border-gray-200 bg-white px-5 py-2.5 font-display text-sm font-semibold text-ink/70 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                      >
                        <IcoEye />
                        Preview otimizado
                      </button>
                      <button
                        onClick={handleGenerateVaga}
                        disabled={vagaTexto.trim().length < 20 || generatingVaga || previewingVaga}
                        className="flex items-center gap-2 rounded-btn bg-primary px-6 py-2.5 font-display text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                      >
                        <IcoDownload />
                        Gerar CV para esta vaga
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview vaga */}
                {previewVagaHtml && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-card border border-gray-100 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                        <h3 className="font-display text-sm font-semibold text-ink">Preview — CV Otimizado para a Vaga</h3>
                        <button
                          onClick={() => setPreviewVagaHtml(null)}
                          className="font-body text-xs text-ink/40 hover:text-ink transition"
                        >
                          Voltar
                        </button>
                      </div>
                      <iframe
                        ref={iframeVagaRef}
                        srcDoc={previewVagaHtml}
                        className="w-full border-0"
                        style={{ height: '842px' }}
                        title="Preview CV Vaga"
                      />
                    </div>

                    {generatedVaga && (
                      <div className="flex items-center gap-2 rounded-btn bg-emerald-50 px-4 py-2 text-emerald-700 self-center">
                        <IcoCheck />
                        <span className="font-body text-sm font-medium">PDF gerado e baixado com sucesso!</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={handleGenerateVaga}
                        disabled={generatingVaga}
                        className="flex items-center gap-2 rounded-btn bg-primary px-8 py-3 font-display text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]"
                      >
                        {generatingVaga ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Gerando PDF…
                          </>
                        ) : (
                          <>
                            <IcoDownload />
                            {generatedVaga ? 'Baixar novamente' : 'Baixar PDF'}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { setPreviewVagaHtml(null); setGeneratedVaga(false); }}
                        className="font-body text-xs text-ink/40 transition hover:text-primary"
                      >
                        Analisar outra vaga →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ TAB: Carta de Apresentação ═══ */}
            {activeTab === 'carta' && (
              <>
                {!cartaResult && (
                  <div className="flex flex-col gap-4 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale text-primary"><IcoMail /></div>
                      <div>
                        <h2 className="font-display text-base font-semibold text-ink">Carta de Apresentação</h2>
                        <p className="font-body text-xs text-ink/50">A IA gera uma carta personalizada para a vaga que você quer conquistar</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Link da vaga (opcional)</label>
                      <div className="flex gap-2">
                        <input type="url" value={cartaVagaUrl} onChange={e => setCartaVagaUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/..." className="flex-1 rounded-btn border border-gray-200 px-4 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                        <button type="button" onClick={handleExtractCartaUrl} disabled={!cartaVagaUrl.trim() || extractingCartaUrl} className="flex items-center gap-1.5 rounded-btn bg-gray-100 px-4 py-2.5 font-display text-xs font-semibold text-ink/60 transition hover:bg-primary-pale hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">
                          {extractingCartaUrl ? (<><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />Extraindo…</>) : 'Extrair texto'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">Descrição da vaga</label>
                      <textarea value={cartaVaga} onChange={e => setCartaVaga(e.target.value)} placeholder="Cole a descrição completa da vaga…" rows={6} className="w-full resize-none rounded-btn border border-gray-200 px-4 py-3 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" />
                      <span className="self-end font-body text-xs text-ink/30">{cartaVaga.length} caracteres {cartaVaga.length > 0 && cartaVaga.length < 20 ? '(mínimo 20)' : ''}</span>
                    </div>

                    {errorCarta && <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{errorCarta}</p>}

                    {generatingCarta && (
                      <div className="flex flex-col items-center gap-4 rounded-btn border border-primary/20 bg-primary-pale p-8">
                        <div className="relative flex h-14 w-14 items-center justify-center"><div className="absolute inset-0 animate-ping rounded-full bg-primary/15" /><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
                        <p className="font-display text-sm font-semibold text-primary">Gerando carta personalizada…</p>
                      </div>
                    )}

                    <button onClick={handleGenerateCarta} disabled={cartaVaga.trim().length < 20 || generatingCarta} className="flex items-center gap-2 self-start rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]">
                      <IcoMail /> Gerar carta de apresentação
                    </button>
                  </div>
                )}

                {cartaResult && (
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 rounded-card border border-emerald-100 bg-emerald-50 px-5 py-4">
                      <IcoCheck />
                      <div>
                        <p className="font-display text-sm font-semibold text-emerald-700">Carta gerada com sucesso!</p>
                        <p className="font-body text-xs text-emerald-600">Copie e use no email de candidatura ou no portal da empresa.</p>
                      </div>
                    </div>

                    {/* Assunto */}
                    <div className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-semibold text-ink">Assunto do email</h3>
                        <button onClick={() => handleCopyCarta(cartaResult.assunto_email, 'assunto')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copiedCarta === 'assunto' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                          {copiedCarta === 'assunto' ? <IcoCheck /> : <IcoCopy />}
                          {copiedCarta === 'assunto' ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <p className="font-body text-sm text-ink">{cartaResult.assunto_email}</p>
                    </div>

                    {/* Carta */}
                    <div className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-sm font-semibold text-ink">Carta de apresentação</h3>
                        <button onClick={() => handleCopyCarta(cartaResult.carta, 'carta')} className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 font-display text-xs font-semibold transition ${copiedCarta === 'carta' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-ink/60 hover:bg-primary-pale hover:text-primary'}`}>
                          {copiedCarta === 'carta' ? <IcoCheck /> : <IcoCopy />}
                          {copiedCarta === 'carta' ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <p className="whitespace-pre-line font-body text-sm leading-relaxed text-ink/80">{cartaResult.carta}</p>
                    </div>

                    <button onClick={() => { setCartaResult(null); setErrorCarta(null); }} className="self-start font-body text-xs text-ink/40 transition hover:text-primary">Gerar outra carta →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
