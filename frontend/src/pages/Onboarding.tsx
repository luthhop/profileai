import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface StepField {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

interface StepDef {
  aiMessage: string;
  fields: StepField[];
  options?: string[];
}

const STEPS: StepDef[] = [
  {
    aiMessage: 'Olá! Vamos montar seu perfil profissional. Qual é o seu nome completo e em qual área você atua?',
    fields: [
      { key: 'nome', label: 'Nome completo', placeholder: 'Ex: Ana Lima' },
      { key: 'area', label: 'Área de atuação', placeholder: 'Ex: Tecnologia, Marketing, Jurídico…' },
    ],
  },
  {
    aiMessage: 'Qual é o seu cargo atual ou o que você deseja ser? E há quanto tempo você trabalha nessa área?',
    fields: [
      { key: 'cargo', label: 'Cargo atual ou desejado', placeholder: 'Ex: Desenvolvedor Frontend Senior' },
      { key: 'tempo_area', label: 'Tempo na área', placeholder: 'Ex: 3 anos' },
    ],
  },
  {
    aiMessage: 'Conte suas principais experiências com resultados concretos — números, projetos, impacto real. E qual stack você domina?',
    fields: [
      {
        key: 'experiencias_texto',
        label: 'Experiências e resultados',
        placeholder: 'Ex: Liderei migração para cloud que reduziu custos em 30%. Gerenciei squad de 5 pessoas…',
        multiline: true,
      },
      { key: 'stack_texto', label: 'Stack / ferramentas', placeholder: 'Ex: React, Node.js, PostgreSQL, Docker…' },
    ],
  },
  {
    aiMessage: 'Qual é sua formação acadêmica? Tem pós-graduação ou certificações relevantes?',
    fields: [
      {
        key: 'formacao',
        label: 'Formação e certificações',
        placeholder: 'Ex: Ciência da Computação — UNICAMP (2020) | AWS Solutions Architect',
        multiline: true,
      },
    ],
  },
  {
    aiMessage: 'Quase lá! Liste suas top 10 habilidades — pode misturar técnicas e comportamentais.',
    fields: [
      {
        key: 'habilidades_texto',
        label: 'Top 10 habilidades',
        placeholder: 'Ex: React, TypeScript, Liderança, Comunicação, SQL, Git, Scrum, Resolução de problemas…',
        multiline: true,
      },
    ],
  },
  {
    aiMessage: 'Última etapa: qual é o seu principal objetivo profissional agora?',
    fields: [],
    options: ['Buscar novo emprego', 'Aumentar visibilidade no mercado', 'Expandir networking', 'Atrair clientes / freelas'],
  },
];

function splitList(text: string): string[] {
  return text.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
}

function LogoMark() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="11" height="11" rx="3" fill="#fff" />
        <rect x="17" y="4" width="11" height="11" rx="3" fill="#fff" opacity=".6" />
        <rect x="4" y="17" width="11" height="11" rx="3" fill="#fff" opacity=".4" />
        <rect x="17" y="17" width="11" height="11" rx="3" fill="#fff" opacity=".2" />
      </svg>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<{ aiMessage: string; userResponse: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [step]);

  const currentStep = STEPS[step];
  const progress = Math.round((step / STEPS.length) * 100);

  function canProceed(): boolean {
    return (
      currentStep.fields.length > 0 &&
      currentStep.fields.every(f => (fieldValues[f.key] ?? '').trim().length > 0)
    );
  }

  function handleNext() {
    const userResponse = currentStep.fields
      .map(f => fieldValues[f.key]?.trim())
      .filter(Boolean)
      .join(' · ');

    setChatHistory(h => [...h, { aiMessage: currentStep.aiMessage, userResponse }]);
    setCollectedData(d => ({ ...d, ...fieldValues }));
    setFieldValues({});
    setStep(s => s + 1);
  }

  async function handleOptionSelect(option: string) {
    setSaving(true);
    setChatHistory(h => [...h, { aiMessage: currentStep.aiMessage, userResponse: option }]);

    const all: Record<string, string> = { ...collectedData, objetivo_profissional: option };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/'); return; }

    await supabase.from('profiles').insert({
      user_id: user.id,
      nome: all.nome ?? null,
      area: all.area ?? null,
      cargo: all.cargo ?? null,
      experiencias: all.experiencias_texto
        ? { descricao: all.experiencias_texto, tempo_na_area: all.tempo_area ?? null }
        : null,
      stack: splitList(all.stack_texto ?? ''),
      formacao: all.formacao ?? null,
      habilidades: splitList(all.habilidades_texto ?? ''),
      objetivo_profissional: option,
    });

    navigate('/dashboard', { replace: true });
  }

  const allSingleLine = currentStep.fields.length > 0 && currentStep.fields.every(f => !f.multiline);

  return (
    <div className="min-h-screen bg-surface">
      {/* Barra de progresso fixa */}
      <div className="fixed left-0 right-0 top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center gap-4 px-4 py-3">
          <div className="flex flex-shrink-0 items-center gap-2">
            <LogoMark />
            <span className="hidden font-display text-sm font-bold text-primary sm:block">ProfileAI</span>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex justify-between">
              <span className="font-body text-xs text-ink/50">Etapa {step + 1} de {STEPS.length}</span>
              <span className="font-body text-xs font-medium text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-pale">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Área do chat */}
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-12 pt-24">

        {/* Histórico de etapas concluídas */}
        {chatHistory.map((item, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <LogoMark />
              <div className="max-w-xs rounded-card rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <p className="font-body text-sm text-ink/60">{item.aiMessage}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-xs rounded-card rounded-tr-sm bg-primary px-4 py-3">
                <p className="font-body text-sm text-white">{item.userResponse}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Etapa atual */}
        {!saving && (
          <div className="flex flex-col gap-4">
            {/* Pergunta da IA */}
            <div className="flex items-start gap-3">
              <LogoMark />
              <div className="max-w-xs rounded-card rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <p className="font-body text-sm text-ink/80">{currentStep.aiMessage}</p>
              </div>
            </div>

            {/* Opções (etapa 6) */}
            {currentStep.options && (
              <div className="ml-11 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {currentStep.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className="rounded-btn border border-primary/30 bg-white px-4 py-3 text-left font-body text-sm font-medium text-primary transition-all hover:border-primary hover:bg-primary hover:text-white hover:shadow-md active:scale-[.98]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Campos de entrada */}
            {currentStep.fields.length > 0 && (
              <div className="ml-11 flex flex-col gap-2">
                <div className="flex flex-col gap-3 rounded-card border border-gray-100 bg-white p-4 shadow-sm">
                  {currentStep.fields.map(field => (
                    <div key={field.key} className="flex flex-col gap-1.5">
                      <label className="font-display text-xs font-semibold uppercase tracking-wider text-ink/40">
                        {field.label}
                      </label>
                      {field.multiline ? (
                        <textarea
                          rows={3}
                          value={fieldValues[field.key] ?? ''}
                          onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className="resize-none rounded-btn border border-gray-200 px-3 py-2 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValues[field.key] ?? ''}
                          onChange={e => setFieldValues(v => ({ ...v, [field.key]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && canProceed()) {
                              e.preventDefault();
                              handleNext();
                            }
                          }}
                          placeholder={field.placeholder}
                          className="rounded-btn border border-gray-200 px-3 py-2.5 font-body text-sm text-ink placeholder:text-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-body text-xs text-ink/30">
                      {allSingleLine ? 'Enter para avançar' : ''}
                    </span>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="flex items-center gap-1.5 rounded-btn bg-primary px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 active:scale-[.97]"
                    >
                      {step === STEPS.length - 2 ? 'Última etapa' : 'Próximo'}
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Salvando */}
        {saving && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="font-body text-sm text-ink/50">Salvando seu perfil…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
