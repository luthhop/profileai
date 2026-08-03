import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API, authFetch } from '../lib/api';
import AppLayout from '../components/AppLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Idioma {
  nome: string;
  nivel: string;
}

interface Experiencia {
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  descricao: string;
  resultados: string;
  stack: string;
  atual: boolean;
}

interface Formacao {
  instituicao: string;
  curso: string;
  grau: string;
  periodo: string;
  atividades: string;
  projetos: string;
}

interface Certificacao {
  nome: string;
  instituicao: string;
  data: string;
  link: string;
}

interface Projeto {
  nome: string;
  descricao: string;
  problema: string;
  stack: string;
  github: string;
  demo: string;
  periodo: string;
}

interface Habilidades {
  tecnicas: string[];
  comportamentais: string[];
  ferramentas: string[];
  metodologias: string[];
}

interface Extras {
  resumo: string;
  conquistas: string;
  publicacoes: string;
  voluntariado: string;
  hobbies: string;
}

interface PerfilData {
  nome: string;
  cidade: string;
  estado: string;
  telefone: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  idiomas: Idioma[];
  foto_url: string;
  cargo_desejado: string;
  area_desejada: string;
  senioridade: string;
  pretensao_salarial: string;
  modelo_trabalho: string;
  disponivel_relocar: boolean;
  tipo_empresa: string;
  data_disponivel: string;
  experiencias_detalhadas: Experiencia[];
  formacoes: Formacao[];
  certificacoes: Certificacao[];
  projetos_pessoais: Projeto[];
  habilidades_detalhadas: Habilidades;
  extras: Extras;
}

const EMPTY_PERFIL: PerfilData = {
  nome: '',
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  linkedin_url: '',
  github_url: '',
  portfolio_url: '',
  idiomas: [{ nome: '', nivel: '' }],
  foto_url: '',
  cargo_desejado: '',
  area_desejada: '',
  senioridade: '',
  pretensao_salarial: '',
  modelo_trabalho: '',
  disponivel_relocar: false,
  tipo_empresa: '',
  data_disponivel: '',
  experiencias_detalhadas: [],
  formacoes: [],
  certificacoes: [],
  projetos_pessoais: [],
  habilidades_detalhadas: { tecnicas: [], comportamentais: [], ferramentas: [], metodologias: [] },
  extras: { resumo: '', conquistas: '', publicacoes: '', voluntariado: '', hobbies: '' },
};

const NIVEIS_IDIOMA = ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'];
const SENIORIDADES = ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Especialista', 'Líder/Gestor'];
const MODELOS_TRABALHO = ['Remoto', 'Híbrido', 'Presencial'];
const TIPOS_EMPRESA = ['Startup', 'Grande empresa', 'Internacional', 'Qualquer'];
const FAIXAS_SALARIAIS = ['Até R$ 3.000', 'R$ 3.000 – R$ 5.000', 'R$ 5.000 – R$ 8.000', 'R$ 8.000 – R$ 12.000', 'R$ 12.000 – R$ 18.000', 'R$ 18.000 – R$ 25.000', 'Acima de R$ 25.000', 'A combinar'];

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IcoPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IcoTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IcoCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IcoCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

interface SectionProps {
  number: number;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  saving: boolean;
  saved: boolean;
  children: React.ReactNode;
}

function Section({ number, title, subtitle, open, onToggle, saving, saved, children }: SectionProps) {
  return (
    <div className="rounded-card border border-gray-100 bg-white shadow-sm transition-all">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-pale font-display text-sm font-bold text-primary">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          <p className="mt-0.5 font-body text-xs text-ink/40">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 rounded-badge bg-match-high/10 px-2 py-0.5 font-body text-xs font-medium text-match-high">
              <IcoCheck /> Salvo
            </span>
          )}
          <span className="text-ink/30">
            <IcoChevron open={open} />
          </span>
        </div>
      </button>
      {open && <div className="border-t border-gray-50 px-6 pb-6 pt-5">{children}</div>}
    </div>
  );
}

// ─── Reusable form components ────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">{children}</label>;
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
    >
      <option value="">{placeholder ?? 'Selecione...'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');

  function addTag() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span key={i} className="flex items-center gap-1 rounded-badge bg-primary-pale px-2.5 py-0.5 font-body text-xs font-medium text-primary">
            {tag}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="ml-0.5 text-primary/50 hover:text-primary">&times;</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        className="w-full rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

// ─── Perfil Page ─────────────────────────────────────────────────────────────

export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<PerfilData>(EMPTY_PERFIL);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [savedSections, setSavedSections] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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
        setPerfil(prev => ({
          ...prev,
          nome: data.nome ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
          telefone: data.telefone ?? '',
          email: data.email_contato ?? '',
          linkedin_url: data.linkedin_url ?? '',
          github_url: data.github_url ?? '',
          portfolio_url: data.portfolio_url ?? '',
          idiomas: data.idiomas ?? [{ nome: '', nivel: '' }],
          foto_url: data.foto_url ?? '',
          cargo_desejado: data.cargo_desejado ?? data.cargo ?? '',
          area_desejada: data.area_desejada ?? data.area ?? '',
          senioridade: data.senioridade ?? '',
          pretensao_salarial: data.pretensao_salarial ?? '',
          modelo_trabalho: data.modelo_trabalho ?? '',
          disponivel_relocar: data.disponivel_relocar ?? false,
          tipo_empresa: data.tipo_empresa ?? '',
          data_disponivel: data.data_disponivel ?? '',
          experiencias_detalhadas: data.experiencias_detalhadas ?? [],
          formacoes: data.formacoes ?? [],
          certificacoes: data.certificacoes ?? [],
          projetos_pessoais: data.projetos_pessoais ?? [],
          habilidades_detalhadas: data.habilidades_detalhadas ?? { tecnicas: [], comportamentais: [], ferramentas: [], metodologias: [] },
          extras: data.extras ?? { resumo: '', conquistas: '', publicacoes: '', voluntariado: '', hobbies: '' },
        }));
      }

      setLoading(false);
    }
    load();
  }, [navigate]);

  const toggleSection = (n: number) => {
    setOpenSections(prev => ({ ...prev, [n]: !prev[n] }));
  };

  const saveSection = useCallback(async (section: number) => {
    if (!user) return;
    setSavingSection(section);

    let payload: Record<string, unknown> = {};

    switch (section) {
      case 1:
        payload = {
          nome: perfil.nome,
          cidade: perfil.cidade,
          estado: perfil.estado,
          telefone: perfil.telefone,
          email_contato: perfil.email,
          linkedin_url: perfil.linkedin_url,
          github_url: perfil.github_url,
          portfolio_url: perfil.portfolio_url,
          idiomas: perfil.idiomas.filter(i => i.nome.trim()),
          foto_url: perfil.foto_url,
        };
        break;
      case 2:
        payload = {
          cargo_desejado: perfil.cargo_desejado,
          area_desejada: perfil.area_desejada,
          senioridade: perfil.senioridade,
          pretensao_salarial: perfil.pretensao_salarial,
          modelo_trabalho: perfil.modelo_trabalho,
          disponivel_relocar: perfil.disponivel_relocar,
          tipo_empresa: perfil.tipo_empresa,
          data_disponivel: perfil.data_disponivel,
        };
        break;
      case 3:
        payload = { experiencias_detalhadas: perfil.experiencias_detalhadas };
        break;
      case 4:
        payload = { formacoes: perfil.formacoes };
        break;
      case 5:
        payload = { certificacoes: perfil.certificacoes };
        break;
      case 6:
        payload = { projetos_pessoais: perfil.projetos_pessoais };
        break;
      case 7:
        payload = { habilidades_detalhadas: perfil.habilidades_detalhadas };
        break;
      case 8:
        payload = { extras: perfil.extras };
        break;
    }

    await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', user.id);

    setSavingSection(null);
    setSavedSections(prev => new Set(prev).add(section));
    setTimeout(() => setSavedSections(prev => { const s = new Set(prev); s.delete(section); return s; }), 3000);
  }, [user, perfil]);

  const update = <K extends keyof PerfilData>(key: K, value: PerfilData[K]) => {
    setPerfil(prev => ({ ...prev, [key]: value }));
  };

  async function handleImportPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch(`${API}/api/importar/pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ erro: 'Erro desconhecido' }));
        throw new Error(err.erro);
      }

      const data = await res.json();

      const merged: PerfilData = {
        nome: data.nome || perfil.nome,
        cidade: data.cidade || perfil.cidade,
        estado: data.estado || perfil.estado,
        telefone: data.telefone || perfil.telefone,
        email: data.email_contato || perfil.email,
        linkedin_url: data.linkedin_url || perfil.linkedin_url,
        github_url: data.github_url || perfil.github_url,
        portfolio_url: data.portfolio_url || perfil.portfolio_url,
        idiomas: data.idiomas?.length ? data.idiomas : perfil.idiomas,
        foto_url: perfil.foto_url,
        cargo_desejado: data.cargo_desejado || perfil.cargo_desejado,
        area_desejada: data.area_desejada || perfil.area_desejada,
        senioridade: data.senioridade || perfil.senioridade,
        pretensao_salarial: perfil.pretensao_salarial,
        modelo_trabalho: perfil.modelo_trabalho,
        disponivel_relocar: perfil.disponivel_relocar,
        tipo_empresa: perfil.tipo_empresa,
        data_disponivel: perfil.data_disponivel,
        experiencias_detalhadas: data.experiencias_detalhadas?.length ? data.experiencias_detalhadas : perfil.experiencias_detalhadas,
        formacoes: data.formacoes?.length ? data.formacoes : perfil.formacoes,
        certificacoes: data.certificacoes?.length ? data.certificacoes : perfil.certificacoes,
        projetos_pessoais: data.projetos_pessoais?.length ? data.projetos_pessoais : perfil.projetos_pessoais,
        habilidades_detalhadas: (data.habilidades_detalhadas?.tecnicas?.length || data.habilidades_detalhadas?.comportamentais?.length)
          ? data.habilidades_detalhadas
          : perfil.habilidades_detalhadas,
        extras: {
          resumo: data.extras?.resumo || perfil.extras.resumo,
          conquistas: data.extras?.conquistas || perfil.extras.conquistas,
          publicacoes: data.extras?.publicacoes || perfil.extras.publicacoes,
          voluntariado: data.extras?.voluntariado || perfil.extras.voluntariado,
          hobbies: data.extras?.hobbies || perfil.extras.hobbies,
        },
      };

      setPerfil(merged);

      const payload = {
        nome: merged.nome,
        cidade: merged.cidade,
        estado: merged.estado,
        telefone: merged.telefone,
        email_contato: merged.email,
        linkedin_url: merged.linkedin_url,
        github_url: merged.github_url,
        portfolio_url: merged.portfolio_url,
        idiomas: merged.idiomas.filter(i => i.nome.trim()),
        cargo_desejado: merged.cargo_desejado,
        area_desejada: merged.area_desejada,
        senioridade: merged.senioridade,
        experiencias_detalhadas: merged.experiencias_detalhadas,
        formacoes: merged.formacoes,
        certificacoes: merged.certificacoes,
        projetos_pessoais: merged.projetos_pessoais,
        habilidades_detalhadas: merged.habilidades_detalhadas,
        extras: merged.extras,
      };

      await supabase.from('profiles').update(payload).eq('user_id', user.id);
      setOpenSections({ 1: true });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar PDF.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'EXCLUIR' || !user) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API}/api/conta/excluir`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ erro: 'Erro desconhecido' }));
        throw new Error(err.erro);
      }
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir conta.');
      setDeleting(false);
    }
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-6 py-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Meu Perfil</h1>
          <p className="mt-1 font-body text-sm text-ink/50">
            Preencha cada seção para gerar melhores resultados com a IA
          </p>
        </div>

        {/* Importar PDF */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleImportPdf}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 rounded-btn border border-gray-200 bg-white px-4 py-2.5 font-display text-xs font-semibold text-ink/60 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Importando com IA…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Importar do LinkedIn (PDF)
              </>
            )}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 rounded-btn border border-gray-200 bg-white px-4 py-2.5 font-display text-xs font-semibold text-ink/60 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Importando…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Importar currículo (PDF)
              </>
            )}
          </button>
          <span className="font-body text-xs text-ink/30">A IA extrai e preenche automaticamente</span>
        </div>

        {importError && (
          <p className="rounded-btn bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{importError}</p>
        )}

        {/* ── SEÇÃO 1: Dados Pessoais ────────────────────────────────────────── */}
        <Section
          number={1} title="Dados Pessoais" subtitle="Informações de contato e links"
          open={!!openSections[1]} onToggle={() => toggleSection(1)}
          saving={savingSection === 1} saved={savedSections.has(1)}
        >
          <div className="flex flex-col gap-4">
            {/* Foto */}
            <div className="flex items-center gap-4">
              {perfil.foto_url ? (
                <img src={perfil.foto_url} alt="Foto" className="h-16 w-16 rounded-full object-cover border-2 border-primary-pale" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-pale text-primary">
                  <IcoCamera />
                </div>
              )}
              <div className="flex-1 flex flex-col gap-1">
                <Label>URL da foto de perfil</Label>
                <Input value={perfil.foto_url} onChange={v => update('foto_url', v)} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Nome completo</Label>
                <Input value={perfil.nome} onChange={v => update('nome', v)} placeholder="Ana Silva" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Email de contato</Label>
                <Input value={perfil.email} onChange={v => update('email', v)} placeholder="ana@email.com" type="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Cidade</Label>
                <Input value={perfil.cidade} onChange={v => update('cidade', v)} placeholder="São Paulo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Estado</Label>
                <Input value={perfil.estado} onChange={v => update('estado', v)} placeholder="SP" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Telefone</Label>
                <Input value={perfil.telefone} onChange={v => update('telefone', v)} placeholder="(11) 99999-9999" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={perfil.linkedin_url} onChange={v => update('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>GitHub URL</Label>
                <Input value={perfil.github_url} onChange={v => update('github_url', v)} placeholder="https://github.com/..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Portfólio URL</Label>
                <Input value={perfil.portfolio_url} onChange={v => update('portfolio_url', v)} placeholder="https://meusite.com" />
              </div>
            </div>

            {/* Idiomas */}
            <div className="flex flex-col gap-2">
              <Label>Idiomas</Label>
              {perfil.idiomas.map((idioma, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={idioma.nome}
                    onChange={e => {
                      const arr = [...perfil.idiomas];
                      arr[i] = { ...arr[i], nome: e.target.value };
                      update('idiomas', arr);
                    }}
                    placeholder="Ex: Inglês"
                    className="flex-1 rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                  <select
                    value={idioma.nivel}
                    onChange={e => {
                      const arr = [...perfil.idiomas];
                      arr[i] = { ...arr[i], nivel: e.target.value };
                      update('idiomas', arr);
                    }}
                    className="rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    <option value="">Nível</option>
                    {NIVEIS_IDIOMA.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {perfil.idiomas.length > 1 && (
                    <button onClick={() => update('idiomas', perfil.idiomas.filter((_, j) => j !== i))} className="text-ink/30 hover:text-red-500 transition">
                      <IcoTrash />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => update('idiomas', [...perfil.idiomas, { nome: '', nivel: '' }])}
                className="flex items-center gap-1.5 self-start rounded-btn border border-dashed border-gray-300 px-3 py-1.5 font-body text-xs text-ink/50 transition hover:border-primary hover:text-primary"
              >
                <IcoPlus /> Adicionar idioma
              </button>
            </div>

            <button onClick={() => saveSection(1)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar dados pessoais
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 2: Objetivo Profissional ─────────────────────────────────── */}
        <Section
          number={2} title="Objetivo Profissional" subtitle="O que você busca na carreira"
          open={!!openSections[2]} onToggle={() => toggleSection(2)}
          saving={savingSection === 2} saved={savedSections.has(2)}
        >
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Cargo desejado</Label>
                <Input value={perfil.cargo_desejado} onChange={v => update('cargo_desejado', v)} placeholder="Desenvolvedor Full Stack" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Área</Label>
                <Input value={perfil.area_desejada} onChange={v => update('area_desejada', v)} placeholder="Tecnologia" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Senioridade desejada</Label>
                <Select value={perfil.senioridade} onChange={v => update('senioridade', v)} options={SENIORIDADES} placeholder="Selecione..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Pretensão salarial</Label>
                <Select value={perfil.pretensao_salarial} onChange={v => update('pretensao_salarial', v)} options={FAIXAS_SALARIAIS} placeholder="Selecione a faixa..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Modelo de trabalho</Label>
                <Select value={perfil.modelo_trabalho} onChange={v => update('modelo_trabalho', v)} options={MODELOS_TRABALHO} placeholder="Selecione..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de empresa</Label>
                <Select value={perfil.tipo_empresa} onChange={v => update('tipo_empresa', v)} options={TIPOS_EMPRESA} placeholder="Selecione..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Data disponível para início</Label>
                <Input value={perfil.data_disponivel} onChange={v => update('data_disponivel', v)} placeholder="Imediato, 30 dias..." />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={perfil.disponivel_relocar}
                    onChange={e => update('disponivel_relocar', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="font-body text-sm text-ink">Disponível para relocação</span>
                </label>
              </div>
            </div>

            <button onClick={() => saveSection(2)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar objetivo
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 3: Experiências Profissionais ────────────────────────────── */}
        <Section
          number={3} title="Experiências Profissionais" subtitle="Trajetória e resultados"
          open={!!openSections[3]} onToggle={() => toggleSection(3)}
          saving={savingSection === 3} saved={savedSections.has(3)}
        >
          <div className="flex flex-col gap-4">
            {perfil.experiencias_detalhadas.map((exp, i) => (
              <div key={i} className="rounded-btn border border-gray-100 bg-surface/50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-semibold text-ink/50">Experiência {i + 1}</span>
                  <button onClick={() => update('experiencias_detalhadas', perfil.experiencias_detalhadas.filter((_, j) => j !== i))} className="text-ink/30 hover:text-red-500 transition">
                    <IcoTrash />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1"><Label>Empresa</Label><Input value={exp.empresa} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], empresa: v }; update('experiencias_detalhadas', a); }} placeholder="Nome da empresa" /></div>
                  <div className="flex flex-col gap-1"><Label>Cargo</Label><Input value={exp.cargo} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], cargo: v }; update('experiencias_detalhadas', a); }} placeholder="Seu cargo" /></div>
                  <div className="flex flex-col gap-1"><Label>Início</Label><Input value={exp.inicio} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], inicio: v }; update('experiencias_detalhadas', a); }} placeholder="Jan 2020" /></div>
                  <div className="flex flex-col gap-1">
                    <Label>Fim</Label>
                    <Input value={exp.atual ? 'Atual' : exp.fim} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], fim: v }; update('experiencias_detalhadas', a); }} placeholder="Dez 2023" />
                  </div>
                </div>
                <div className="flex flex-col gap-1"><Label>Atividades</Label><Textarea value={exp.descricao} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], descricao: v }; update('experiencias_detalhadas', a); }} placeholder="Descreva suas atividades..." /></div>
                <div className="flex flex-col gap-1"><Label>Resultados com métricas</Label><Textarea value={exp.resultados} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], resultados: v }; update('experiencias_detalhadas', a); }} placeholder="Ex: Aumentei vendas em 25%..." /></div>
                <div className="flex flex-col gap-1"><Label>Stack usada</Label><Input value={exp.stack} onChange={v => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], stack: v }; update('experiencias_detalhadas', a); }} placeholder="React, Node.js, PostgreSQL..." /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={exp.atual} onChange={e => { const a = [...perfil.experiencias_detalhadas]; a[i] = { ...a[i], atual: e.target.checked, fim: e.target.checked ? '' : a[i].fim }; update('experiencias_detalhadas', a); }} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="font-body text-sm text-ink/70">Ainda trabalho aqui</span>
                </label>
              </div>
            ))}
            <button
              onClick={() => update('experiencias_detalhadas', [...perfil.experiencias_detalhadas, { empresa: '', cargo: '', inicio: '', fim: '', descricao: '', resultados: '', stack: '', atual: false }])}
              className="flex items-center gap-1.5 self-start rounded-btn border border-dashed border-gray-300 px-4 py-2 font-body text-sm text-ink/50 transition hover:border-primary hover:text-primary"
            >
              <IcoPlus /> Adicionar experiência
            </button>
            <button onClick={() => saveSection(3)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar experiências
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 4: Formação Acadêmica ────────────────────────────────────── */}
        <Section
          number={4} title="Formação Acadêmica" subtitle="Graduação, pós e cursos"
          open={!!openSections[4]} onToggle={() => toggleSection(4)}
          saving={savingSection === 4} saved={savedSections.has(4)}
        >
          <div className="flex flex-col gap-4">
            {perfil.formacoes.map((form, i) => (
              <div key={i} className="rounded-btn border border-gray-100 bg-surface/50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-semibold text-ink/50">Formação {i + 1}</span>
                  <button onClick={() => update('formacoes', perfil.formacoes.filter((_, j) => j !== i))} className="text-ink/30 hover:text-red-500 transition"><IcoTrash /></button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1"><Label>Instituição</Label><Input value={form.instituicao} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], instituicao: v }; update('formacoes', a); }} placeholder="Universidade X" /></div>
                  <div className="flex flex-col gap-1"><Label>Curso</Label><Input value={form.curso} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], curso: v }; update('formacoes', a); }} placeholder="Ciência da Computação" /></div>
                  <div className="flex flex-col gap-1"><Label>Grau</Label><Input value={form.grau} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], grau: v }; update('formacoes', a); }} placeholder="Bacharelado" /></div>
                  <div className="flex flex-col gap-1"><Label>Período</Label><Input value={form.periodo} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], periodo: v }; update('formacoes', a); }} placeholder="2018 - 2022" /></div>
                </div>
                <div className="flex flex-col gap-1"><Label>Atividades relevantes</Label><Textarea value={form.atividades} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], atividades: v }; update('formacoes', a); }} placeholder="Monitoria, iniciação científica..." /></div>
                <div className="flex flex-col gap-1"><Label>Projetos acadêmicos</Label><Textarea value={form.projetos} onChange={v => { const a = [...perfil.formacoes]; a[i] = { ...a[i], projetos: v }; update('formacoes', a); }} placeholder="TCC, projetos de pesquisa..." /></div>
              </div>
            ))}
            <button
              onClick={() => update('formacoes', [...perfil.formacoes, { instituicao: '', curso: '', grau: '', periodo: '', atividades: '', projetos: '' }])}
              className="flex items-center gap-1.5 self-start rounded-btn border border-dashed border-gray-300 px-4 py-2 font-body text-sm text-ink/50 transition hover:border-primary hover:text-primary"
            >
              <IcoPlus /> Adicionar formação
            </button>
            <button onClick={() => saveSection(4)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar formações
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 5: Certificações e Cursos ────────────────────────────────── */}
        <Section
          number={5} title="Certificações e Cursos" subtitle="Certificados e qualificações extras"
          open={!!openSections[5]} onToggle={() => toggleSection(5)}
          saving={savingSection === 5} saved={savedSections.has(5)}
        >
          <div className="flex flex-col gap-4">
            {perfil.certificacoes.map((cert, i) => (
              <div key={i} className="rounded-btn border border-gray-100 bg-surface/50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-semibold text-ink/50">Certificação {i + 1}</span>
                  <button onClick={() => update('certificacoes', perfil.certificacoes.filter((_, j) => j !== i))} className="text-ink/30 hover:text-red-500 transition"><IcoTrash /></button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1"><Label>Nome</Label><Input value={cert.nome} onChange={v => { const a = [...perfil.certificacoes]; a[i] = { ...a[i], nome: v }; update('certificacoes', a); }} placeholder="AWS Solutions Architect" /></div>
                  <div className="flex flex-col gap-1"><Label>Instituição</Label><Input value={cert.instituicao} onChange={v => { const a = [...perfil.certificacoes]; a[i] = { ...a[i], instituicao: v }; update('certificacoes', a); }} placeholder="Amazon" /></div>
                  <div className="flex flex-col gap-1"><Label>Data</Label><Input value={cert.data} onChange={v => { const a = [...perfil.certificacoes]; a[i] = { ...a[i], data: v }; update('certificacoes', a); }} placeholder="Mar 2024" /></div>
                  <div className="flex flex-col gap-1"><Label>Link do certificado</Label><Input value={cert.link} onChange={v => { const a = [...perfil.certificacoes]; a[i] = { ...a[i], link: v }; update('certificacoes', a); }} placeholder="https://..." /></div>
                </div>
              </div>
            ))}
            <button
              onClick={() => update('certificacoes', [...perfil.certificacoes, { nome: '', instituicao: '', data: '', link: '' }])}
              className="flex items-center gap-1.5 self-start rounded-btn border border-dashed border-gray-300 px-4 py-2 font-body text-sm text-ink/50 transition hover:border-primary hover:text-primary"
            >
              <IcoPlus /> Adicionar certificação
            </button>
            <button onClick={() => saveSection(5)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar certificações
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 6: Projetos Pessoais ─────────────────────────────────────── */}
        <Section
          number={6} title="Projetos Pessoais" subtitle="Side projects e contribuições"
          open={!!openSections[6]} onToggle={() => toggleSection(6)}
          saving={savingSection === 6} saved={savedSections.has(6)}
        >
          <div className="flex flex-col gap-4">
            {perfil.projetos_pessoais.map((proj, i) => (
              <div key={i} className="rounded-btn border border-gray-100 bg-surface/50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-xs font-semibold text-ink/50">Projeto {i + 1}</span>
                  <button onClick={() => update('projetos_pessoais', perfil.projetos_pessoais.filter((_, j) => j !== i))} className="text-ink/30 hover:text-red-500 transition"><IcoTrash /></button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1"><Label>Nome</Label><Input value={proj.nome} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], nome: v }; update('projetos_pessoais', a); }} placeholder="Nome do projeto" /></div>
                  <div className="flex flex-col gap-1"><Label>Período</Label><Input value={proj.periodo} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], periodo: v }; update('projetos_pessoais', a); }} placeholder="2023 - Atual" /></div>
                </div>
                <div className="flex flex-col gap-1"><Label>Descrição</Label><Textarea value={proj.descricao} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], descricao: v }; update('projetos_pessoais', a); }} placeholder="O que faz o projeto..." /></div>
                <div className="flex flex-col gap-1"><Label>Problema que resolve</Label><Textarea value={proj.problema} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], problema: v }; update('projetos_pessoais', a); }} placeholder="Qual problema esse projeto resolve..." /></div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1"><Label>Stack</Label><Input value={proj.stack} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], stack: v }; update('projetos_pessoais', a); }} placeholder="React, Node..." /></div>
                  <div className="flex flex-col gap-1"><Label>GitHub</Label><Input value={proj.github} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], github: v }; update('projetos_pessoais', a); }} placeholder="https://github.com/..." /></div>
                  <div className="flex flex-col gap-1"><Label>Demo</Label><Input value={proj.demo} onChange={v => { const a = [...perfil.projetos_pessoais]; a[i] = { ...a[i], demo: v }; update('projetos_pessoais', a); }} placeholder="https://..." /></div>
                </div>
              </div>
            ))}
            <button
              onClick={() => update('projetos_pessoais', [...perfil.projetos_pessoais, { nome: '', descricao: '', problema: '', stack: '', github: '', demo: '', periodo: '' }])}
              className="flex items-center gap-1.5 self-start rounded-btn border border-dashed border-gray-300 px-4 py-2 font-body text-sm text-ink/50 transition hover:border-primary hover:text-primary"
            >
              <IcoPlus /> Adicionar projeto
            </button>
            <button onClick={() => saveSection(6)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar projetos
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 7: Habilidades ───────────────────────────────────────────── */}
        <Section
          number={7} title="Habilidades" subtitle="Técnicas, comportamentais, ferramentas e metodologias"
          open={!!openSections[7]} onToggle={() => toggleSection(7)}
          saving={savingSection === 7} saved={savedSections.has(7)}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>Habilidades técnicas</Label>
              <TagInput tags={perfil.habilidades_detalhadas.tecnicas} onChange={t => update('habilidades_detalhadas', { ...perfil.habilidades_detalhadas, tecnicas: t })} placeholder="Digite e pressione Enter (ex: React, TypeScript...)" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Habilidades comportamentais</Label>
              <TagInput tags={perfil.habilidades_detalhadas.comportamentais} onChange={t => update('habilidades_detalhadas', { ...perfil.habilidades_detalhadas, comportamentais: t })} placeholder="Liderança, Comunicação, Resolução de problemas..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ferramentas</Label>
              <TagInput tags={perfil.habilidades_detalhadas.ferramentas} onChange={t => update('habilidades_detalhadas', { ...perfil.habilidades_detalhadas, ferramentas: t })} placeholder="VS Code, Figma, Docker, AWS..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Metodologias</Label>
              <TagInput tags={perfil.habilidades_detalhadas.metodologias} onChange={t => update('habilidades_detalhadas', { ...perfil.habilidades_detalhadas, metodologias: t })} placeholder="Scrum, Kanban, Design Thinking..." />
            </div>
            <button onClick={() => saveSection(7)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar habilidades
            </button>
          </div>
        </Section>

        {/* ── SEÇÃO 8: Informações Extras ────────────────────────────────────── */}
        <Section
          number={8} title="Informações Extras" subtitle="Resumo pessoal, conquistas e mais"
          open={!!openSections[8]} onToggle={() => toggleSection(8)}
          saving={savingSection === 8} saved={savedSections.has(8)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Resumo pessoal</Label>
              <Textarea value={perfil.extras.resumo} onChange={v => update('extras', { ...perfil.extras, resumo: v })} placeholder="Fale livremente sobre você, sua trajetória e o que te motiva..." rows={4} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Conquistas e prêmios</Label>
              <Textarea value={perfil.extras.conquistas} onChange={v => update('extras', { ...perfil.extras, conquistas: v })} placeholder="Prêmios, hackathons, reconhecimentos..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Publicações</Label>
              <Textarea value={perfil.extras.publicacoes} onChange={v => update('extras', { ...perfil.extras, publicacoes: v })} placeholder="Artigos, blog posts, palestras..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Voluntariado</Label>
              <Textarea value={perfil.extras.voluntariado} onChange={v => update('extras', { ...perfil.extras, voluntariado: v })} placeholder="Trabalhos voluntários, mentoria..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hobbies relevantes para a área</Label>
              <Textarea value={perfil.extras.hobbies} onChange={v => update('extras', { ...perfil.extras, hobbies: v })} placeholder="Contribuo com open source, participo de comunidades..." />
            </div>
            <button onClick={() => saveSection(8)} className="self-end rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.97]">
              Salvar informações extras
            </button>
          </div>
        </Section>

        {/* ── Zona de Perigo ──────────────────────────────────────────────── */}
        <div className="mt-8 rounded-card border border-red-200 bg-red-50/50 p-6">
          <h2 className="font-display text-lg font-bold text-red-600">Zona de perigo</h2>
          <p className="mt-1 font-body text-sm text-red-500/80">
            Ações irreversíveis. Após excluir sua conta, todos os dados serão permanentemente removidos.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="mt-4 rounded-btn bg-red-600 px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[.97]"
          >
            Excluir minha conta
          </button>
        </div>

      </div>

      {/* Modal de confirmação */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-red-600">Excluir conta permanentemente</h3>
            <p className="mt-2 font-body text-sm text-ink/70">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão apagados: perfil, otimizações do LinkedIn, vagas salvas, candidaturas e assinatura.
            </p>
            <p className="mt-4 font-body text-sm font-semibold text-ink">
              Digite <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-red-600">EXCLUIR</span> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="mt-2 w-full rounded-btn border border-red-300 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              autoFocus
            />
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="rounded-btn border border-gray-200 px-4 py-2.5 font-display text-sm font-semibold text-ink/60 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                className="rounded-btn bg-red-600 px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-red-700 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Excluindo...
                  </span>
                ) : (
                  'Excluir minha conta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
