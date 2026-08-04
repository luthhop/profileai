import { Router } from 'express';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';
import { extrairJson } from '../utils/extrairJson';
import { checkPlan } from '../middleware/checkPlan';

const rotasCv = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  nome?: string;
  area?: string;
  cargo?: string;
  stack?: string[];
  experiencias?: { descricao?: string; tempo_na_area?: string };
  formacao?: string;
  habilidades?: string[];
  objetivo_profissional?: string;
  nivel_ingles?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email_contato?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  idiomas?: { nome: string; nivel: string }[];
  cargo_desejado?: string;
  area_desejada?: string;
  senioridade?: string;
  experiencias_detalhadas?: {
    empresa: string;
    cargo: string;
    inicio: string;
    fim: string;
    descricao: string;
    resultados: string;
    stack: string;
    atual: boolean;
  }[];
  formacoes?: {
    instituicao: string;
    curso: string;
    grau: string;
    periodo: string;
    atividades: string;
    projetos: string;
  }[];
  certificacoes?: {
    nome: string;
    instituicao: string;
    data: string;
    link: string;
  }[];
  projetos_pessoais?: {
    nome: string;
    descricao: string;
    problema: string;
    stack: string;
    github: string;
    demo: string;
    periodo: string;
  }[];
  habilidades_detalhadas?: {
    tecnicas: string[];
    comportamentais: string[];
    ferramentas: string[];
    metodologias: string[];
  };
  extras?: {
    resumo: string;
    conquistas: string;
    publicacoes: string;
    voluntariado: string;
    hobbies: string;
  };
}

interface CvPorVagaAI {
  resumo_profissional: string;
  experiencias: {
    empresa: string;
    cargo: string;
    periodo: string;
    bullets: string[];
  }[];
  habilidades_tecnicas: string[];
  habilidades_comportamentais: string[];
  destaques_para_vaga: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── CSS compartilhado ───────────────────────────────────────────────────────

const CV_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 10pt;
    color: #222;
    line-height: 1.5;
    padding: 40px 48px;
  }

  .header {
    margin-bottom: 28px;
  }
  .header h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #111;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  .header .tagline {
    font-size: 10.5pt;
    color: #444;
    font-weight: 400;
    margin-bottom: 8px;
  }
  .header .tagline .sep {
    color: #bbb;
    margin: 0 6px;
  }
  .header .contato {
    font-size: 8.5pt;
    color: #666;
  }
  .header .contato span + span::before {
    content: '·';
    margin: 0 8px;
    color: #ccc;
  }

  .section {
    margin-bottom: 22px;
  }
  .section h2 {
    font-size: 9.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #333;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  .section p {
    margin-bottom: 4px;
    color: #333;
  }

  .exp-item { margin-bottom: 14px; }
  .exp-line {
    font-size: 10pt;
    margin-bottom: 3px;
  }
  .exp-line .empresa { font-weight: 600; color: #111; }
  .exp-line .sep { color: #bbb; margin: 0 5px; }
  .exp-line .cargo-cidade { color: #333; }
  .exp-line .periodo { color: #777; }
  .exp-desc { padding-left: 0; }
  .exp-bullets { padding-left: 16px; margin-top: 3px; }
  .exp-bullets li {
    margin-bottom: 2px;
    font-size: 9.5pt;
    color: #444;
  }

  .proj-item { margin-bottom: 12px; }
  .proj-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
  }
  .proj-header .proj-nome { font-weight: 600; font-size: 10pt; color: #111; }
  .proj-header .periodo { font-size: 9pt; color: #777; }
  .proj-desc { font-size: 9.5pt; color: #444; margin-bottom: 2px; }
  .proj-stack { font-size: 8.5pt; color: #888; }

  .form-item { margin-bottom: 8px; }
  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .form-header .curso { font-weight: 600; font-size: 10pt; }
  .form-header .periodo { font-size: 9pt; color: #777; }
  .form-inst { font-size: 9.5pt; color: #555; }

  .cert-item { margin-bottom: 4px; font-size: 9.5pt; }
  .cert-item .cert-nome { font-weight: 600; }
  .cert-item .cert-inst { color: #555; }

  .lang-item {
    display: flex;
    justify-content: space-between;
    font-size: 10pt;
    margin-bottom: 3px;
  }
  .lang-item .lang-nome { color: #222; }
  .lang-item .lang-nivel { color: #555; font-size: 9pt; }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .tag {
    display: inline-block;
    background: #f0f0f0;
    color: #333;
    font-size: 8.5pt;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 3px;
  }

  .skill-group { margin-bottom: 8px; }
  .skill-label { font-size: 9pt; font-weight: 600; color: #444; margin-bottom: 3px; }

  .destaque-list { padding-left: 16px; }
  .destaque-list li {
    margin-bottom: 3px;
    font-size: 10pt;
    color: #333;
  }
`;

// ─── Build CV genérico (perfil completo) ─────────────────────────────────────

function buildCvHtml(p: ProfileData): string {
  const nome = p.nome ?? 'Profissional';
  const cargo = p.cargo_desejado ?? p.cargo ?? '';
  const area = p.area_desejada ?? p.area ?? '';
  const stackPrincipal = (p.stack && p.stack.length > 0) ? p.stack.slice(0, 6).join(', ') : '';

  const taglineParts: string[] = [];
  const cargoArea = [cargo, area].filter(Boolean).join(' · ');
  if (cargoArea) taglineParts.push(esc(cargoArea));
  if (stackPrincipal) taglineParts.push(esc(stackPrincipal));

  const contatos: string[] = [];
  if (p.email_contato) contatos.push(esc(p.email_contato));
  if (p.telefone) contatos.push(esc(p.telefone));
  if (p.cidade || p.estado) contatos.push(esc([p.cidade, p.estado].filter(Boolean).join(', ')));
  if (p.linkedin_url) contatos.push(esc(p.linkedin_url));
  if (p.github_url) contatos.push(esc(p.github_url));
  if (p.portfolio_url) contatos.push(esc(p.portfolio_url));

  const secoes: string[] = [];

  // Summary
  const resumo = p.extras?.resumo || p.objetivo_profissional;
  if (resumo) {
    secoes.push(`
      <div class="section">
        <h2>Summary</h2>
        <p>${esc(resumo)}</p>
      </div>`);
  }

  // Experience
  if (p.experiencias_detalhadas && p.experiencias_detalhadas.length > 0) {
    const items = p.experiencias_detalhadas.map(exp => {
      const periodo = exp.atual ? `${esc(exp.inicio)} – Atual` : `${esc(exp.inicio)} – ${esc(exp.fim)}`;
      const bullets = [exp.descricao, exp.resultados].filter(Boolean);
      const bulletHtml = bullets.length > 0
        ? `<ul class="exp-bullets">${bullets.map(b => b!.split(/\n+/).filter(Boolean).map(l => `<li>${esc(l)}</li>`).join('')).join('')}</ul>`
        : '';
      const stackLine = exp.stack ? `<p class="proj-stack">Stack: ${esc(exp.stack)}</p>` : '';
      return `
        <div class="exp-item">
          <div class="exp-line">
            <span class="empresa">${esc(exp.empresa)}</span><span class="sep">|</span><span class="cargo-cidade">${esc(exp.cargo)}</span><span class="sep">|</span><span class="periodo">${periodo}</span>
          </div>
          ${bulletHtml}
          ${stackLine}
        </div>`;
    }).join('');
    secoes.push(`<div class="section"><h2>Experience</h2>${items}</div>`);
  } else if (p.experiencias?.descricao) {
    const paragrafos = p.experiencias.descricao.split(/\n+/).filter(Boolean).map(l => `<p>${esc(l)}</p>`).join('');
    secoes.push(`<div class="section"><h2>Experience</h2>${paragrafos}</div>`);
  }

  // Personal Projects
  if (p.projetos_pessoais && p.projetos_pessoais.length > 0) {
    const items = p.projetos_pessoais.map(proj => {
      const links: string[] = [];
      if (proj.github) links.push(esc(proj.github));
      if (proj.demo) links.push(esc(proj.demo));
      return `
      <div class="proj-item">
        <div class="proj-header">
          <span class="proj-nome">${esc(proj.nome)}</span>
          <span class="periodo">${esc(proj.periodo)}</span>
        </div>
        <div class="proj-desc">${esc(proj.descricao)}</div>
        ${proj.stack ? `<div class="proj-stack">Stack: ${esc(proj.stack)}</div>` : ''}
        ${links.length > 0 ? `<div class="proj-stack">${links.join(' · ')}</div>` : ''}
      </div>`;
    }).join('');
    secoes.push(`<div class="section"><h2>Personal Projects</h2>${items}</div>`);
  }

  // Education
  if (p.formacoes && p.formacoes.length > 0) {
    const items = p.formacoes.map(f => `
      <div class="form-item">
        <div class="form-header">
          <span class="curso">${esc(f.curso)}${f.grau ? ` — ${esc(f.grau)}` : ''}</span>
          <span class="periodo">${esc(f.periodo)}</span>
        </div>
        <div class="form-inst">${esc(f.instituicao)}</div>
      </div>`).join('');
    secoes.push(`<div class="section"><h2>Education</h2>${items}</div>`);
  } else if (p.formacao) {
    const linhas = p.formacao.split(/[|\n]+/).filter(Boolean).map(l => `<p>${esc(l.trim())}</p>`).join('');
    secoes.push(`<div class="section"><h2>Education</h2>${linhas}</div>`);
  }

  // Certifications
  if (p.certificacoes && p.certificacoes.length > 0) {
    const items = p.certificacoes.map(c =>
      `<div class="cert-item"><span class="cert-nome">${esc(c.nome)}</span> — <span class="cert-inst">${esc(c.instituicao)}</span>${c.data ? ` (${esc(c.data)})` : ''}</div>`
    ).join('');
    secoes.push(`<div class="section"><h2>Certifications</h2>${items}</div>`);
  }

  // Languages
  if (p.idiomas && p.idiomas.length > 0) {
    const lines = p.idiomas.filter(i => i.nome).map(i =>
      `<div class="lang-item"><span class="lang-nome">${esc(i.nome)}</span><span class="lang-nivel">${esc(i.nivel)}</span></div>`
    ).join('');
    if (lines) secoes.push(`<div class="section"><h2>Languages</h2>${lines}</div>`);
  } else if (p.nivel_ingles) {
    secoes.push(`<div class="section"><h2>Languages</h2>
      <div class="lang-item"><span class="lang-nome">Inglês</span><span class="lang-nivel">${esc(p.nivel_ingles)}</span></div>
      <div class="lang-item"><span class="lang-nome">Português</span><span class="lang-nivel">Nativo</span></div>
    </div>`);
  }

  // Skills
  const hab = p.habilidades_detalhadas;
  if (hab && (hab.tecnicas.length || hab.comportamentais.length || hab.ferramentas.length || hab.metodologias.length)) {
    let skillHtml = '';
    if (hab.tecnicas.length) {
      skillHtml += `<div class="skill-group"><div class="skill-label">Technical</div><div class="tags">${hab.tecnicas.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
    }
    if (hab.ferramentas.length) {
      skillHtml += `<div class="skill-group"><div class="skill-label">Tools</div><div class="tags">${hab.ferramentas.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
    }
    if (hab.metodologias.length) {
      skillHtml += `<div class="skill-group"><div class="skill-label">Methodologies</div><div class="tags">${hab.metodologias.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
    }
    if (hab.comportamentais.length) {
      skillHtml += `<div class="skill-group"><div class="skill-label">Soft Skills</div><div class="tags">${hab.comportamentais.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
    }
    secoes.push(`<div class="section"><h2>Skills</h2>${skillHtml}</div>`);
  } else if (p.habilidades && p.habilidades.length > 0) {
    const tags = p.habilidades.map(h => `<span class="tag">${esc(h)}</span>`).join('');
    secoes.push(`<div class="section"><h2>Skills</h2><div class="tags">${tags}</div></div>`);
  }

  // Extras
  if (p.extras?.conquistas) {
    secoes.push(`<div class="section"><h2>Achievements</h2><p>${esc(p.extras.conquistas)}</p></div>`);
  }
  if (p.extras?.voluntariado) {
    secoes.push(`<div class="section"><h2>Volunteering</h2><p>${esc(p.extras.voluntariado)}</p></div>`);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>${CV_CSS}</style>
</head>
<body>
  <div class="header">
    <h1>${esc(nome)}</h1>
    ${taglineParts.length > 0 ? `<div class="tagline">${taglineParts.join('<span class="sep">|</span>')}</div>` : ''}
    ${contatos.length > 0 ? `<div class="contato">${contatos.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
  </div>
  ${secoes.join('')}
</body>
</html>`;
}

// ─── Build CV por Vaga (com dados da IA) ─────────────────────────────────────

function buildCvPorVagaHtml(p: ProfileData, ai: CvPorVagaAI): string {
  const nome = p.nome ?? 'Profissional';
  const cargo = p.cargo_desejado ?? p.cargo ?? '';
  const area = p.area_desejada ?? p.area ?? '';
  const stackPrincipal = (p.stack && p.stack.length > 0) ? p.stack.slice(0, 6).join(', ') : '';

  const taglineParts: string[] = [];
  const cargoArea = [cargo, area].filter(Boolean).join(' · ');
  if (cargoArea) taglineParts.push(esc(cargoArea));
  if (stackPrincipal) taglineParts.push(esc(stackPrincipal));

  const contatos: string[] = [];
  if (p.email_contato) contatos.push(esc(p.email_contato));
  if (p.telefone) contatos.push(esc(p.telefone));
  if (p.cidade || p.estado) contatos.push(esc([p.cidade, p.estado].filter(Boolean).join(', ')));
  if (p.linkedin_url) contatos.push(esc(p.linkedin_url));
  if (p.github_url) contatos.push(esc(p.github_url));

  const secoes: string[] = [];

  // Summary (AI-optimized)
  if (ai.resumo_profissional) {
    secoes.push(`<div class="section"><h2>Summary</h2><p>${esc(ai.resumo_profissional)}</p></div>`);
  }

  // Highlights for this role
  if (ai.destaques_para_vaga && ai.destaques_para_vaga.length > 0) {
    const items = ai.destaques_para_vaga.map(d => `<li>${esc(d)}</li>`).join('');
    secoes.push(`<div class="section"><h2>Key Highlights</h2><ul class="destaque-list">${items}</ul></div>`);
  }

  // Experience (AI-reordered)
  if (ai.experiencias && ai.experiencias.length > 0) {
    const items = ai.experiencias.map(exp => {
      const bulletHtml = exp.bullets && exp.bullets.length > 0
        ? `<ul class="exp-bullets">${exp.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
        : '';
      return `
        <div class="exp-item">
          <div class="exp-line">
            <span class="empresa">${esc(exp.empresa)}</span><span class="sep">|</span><span class="cargo-cidade">${esc(exp.cargo)}</span><span class="sep">|</span><span class="periodo">${esc(exp.periodo)}</span>
          </div>
          ${bulletHtml}
        </div>`;
    }).join('');
    secoes.push(`<div class="section"><h2>Experience</h2>${items}</div>`);
  }

  // Education
  if (p.formacoes && p.formacoes.length > 0) {
    const items = p.formacoes.map(f => `
      <div class="form-item">
        <div class="form-header">
          <span class="curso">${esc(f.curso)}${f.grau ? ` — ${esc(f.grau)}` : ''}</span>
          <span class="periodo">${esc(f.periodo)}</span>
        </div>
        <div class="form-inst">${esc(f.instituicao)}</div>
      </div>`).join('');
    secoes.push(`<div class="section"><h2>Education</h2>${items}</div>`);
  } else if (p.formacao) {
    const linhas = p.formacao.split(/[|\n]+/).filter(Boolean).map(l => `<p>${esc(l.trim())}</p>`).join('');
    secoes.push(`<div class="section"><h2>Education</h2>${linhas}</div>`);
  }

  // Certifications
  if (p.certificacoes && p.certificacoes.length > 0) {
    const items = p.certificacoes.map(c =>
      `<div class="cert-item"><span class="cert-nome">${esc(c.nome)}</span> — <span class="cert-inst">${esc(c.instituicao)}</span>${c.data ? ` (${esc(c.data)})` : ''}</div>`
    ).join('');
    secoes.push(`<div class="section"><h2>Certifications</h2>${items}</div>`);
  }

  // Languages
  if (p.idiomas && p.idiomas.length > 0) {
    const lines = p.idiomas.filter(i => i.nome).map(i =>
      `<div class="lang-item"><span class="lang-nome">${esc(i.nome)}</span><span class="lang-nivel">${esc(i.nivel)}</span></div>`
    ).join('');
    if (lines) secoes.push(`<div class="section"><h2>Languages</h2>${lines}</div>`);
  } else if (p.nivel_ingles) {
    secoes.push(`<div class="section"><h2>Languages</h2>
      <div class="lang-item"><span class="lang-nome">Inglês</span><span class="lang-nivel">${esc(p.nivel_ingles)}</span></div>
      <div class="lang-item"><span class="lang-nome">Português</span><span class="lang-nivel">Nativo</span></div>
    </div>`);
  }

  // Skills (AI-optimized)
  let skillHtml = '';
  if (ai.habilidades_tecnicas && ai.habilidades_tecnicas.length > 0) {
    skillHtml += `<div class="skill-group"><div class="skill-label">Technical</div><div class="tags">${ai.habilidades_tecnicas.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
  }
  if (ai.habilidades_comportamentais && ai.habilidades_comportamentais.length > 0) {
    skillHtml += `<div class="skill-group"><div class="skill-label">Soft Skills</div><div class="tags">${ai.habilidades_comportamentais.map(h => `<span class="tag">${esc(h)}</span>`).join('')}</div></div>`;
  }
  if (skillHtml) {
    secoes.push(`<div class="section"><h2>Skills</h2>${skillHtml}</div>`);
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>${CV_CSS}</style>
</head>
<body>
  <div class="header">
    <h1>${esc(nome)}</h1>
    ${taglineParts.length > 0 ? `<div class="tagline">${taglineParts.join('<span class="sep">|</span>')}</div>` : ''}
    ${contatos.length > 0 ? `<div class="contato">${contatos.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
  </div>
  ${secoes.join('')}
</body>
</html>`;
}

// ─── Puppeteer helper ─────────────────────────────────────────────────────────

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    protocolTimeout: 60_000,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    try { await browser.close(); } catch {}
  }
}

// ─── System prompt para CV por Vaga ──────────────────────────────────────────

const CV_POR_VAGA_PROMPT = `Você é um especialista em currículos ATS-friendly para o mercado brasileiro, com 15+ anos de experiência em recrutamento e seleção.

Sua tarefa: receber o perfil completo de um profissional E a descrição de uma vaga-alvo. Você deve reescrever o conteúdo do currículo CALIBRADO e OTIMIZADO para essa vaga específica.

Regras:
1. REORDENE as experiências — a mais relevante para a vaga vem primeiro
2. REESCREVA os bullets de cada experiência para destacar o que a vaga pede (use verbos de ação, métricas reais do perfil)
3. AJUSTE o resumo profissional para a vaga específica
4. SELECIONE e REORDENE as habilidades mais relevantes para a vaga
5. NUNCA invente experiências, empresas, métricas ou habilidades que o profissional não tem
6. Use os dados REAIS do perfil — apenas reorganize, priorize e reescreva de forma otimizada

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código, sem texto fora do JSON — com exatamente estas chaves:

{
  "resumo_profissional": "string — resumo de 3-4 linhas calibrado para a vaga, usando dados reais do perfil",
  "experiencias": [
    {
      "empresa": "nome real da empresa do perfil",
      "cargo": "cargo real",
      "periodo": "Jan 2020 – Dez 2023",
      "bullets": ["bullet 1 reescrito com verbo de ação e métrica", "bullet 2", "bullet 3"]
    }
  ],
  "habilidades_tecnicas": ["até 12 habilidades técnicas ordenadas por relevância para a vaga"],
  "habilidades_comportamentais": ["até 6 soft skills mais relevantes para a vaga"],
  "destaques_para_vaga": ["3-5 pontos que conectam diretamente o perfil aos requisitos da vaga"]
}`;

// ─── Rota: CV Genérico ───────────────────────────────────────────────────────

rotasCv.post('/generate', checkPlan('cv_generate'), async (req, res) => {
  try {
    const { profile } = req.body as { profile: ProfileData };
    if (!profile) {
      res.status(400).json({ erro: 'Perfil não fornecido' });
      return;
    }

    const html = buildCvHtml(profile);
    const pdf = await htmlToPdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="curriculo-${(profile.nome ?? 'profissional').toLowerCase().replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });
    res.end(pdf);
  } catch (err) {
    console.error('[cv/generate]', err);
    res.status(500).json({ erro: 'Erro ao gerar currículo PDF.' });
  }
});

// ─── Rota: Preview HTML genérico ─────────────────────────────────────────────

rotasCv.post('/preview', (req, res) => {
  try {
    const { profile } = req.body as { profile: ProfileData };
    if (!profile) {
      res.status(400).json({ erro: 'Perfil não fornecido' });
      return;
    }
    const html = buildCvHtml(profile);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('[cv/preview]', err);
    res.status(500).json({ erro: 'Erro ao gerar preview.' });
  }
});

// ─── Rota: CV por Vaga (IA + PDF) ────────────────────────────────────────────

rotasCv.post('/gerar-por-vaga', checkPlan('cv_por_vaga'), async (req, res) => {
  try {
    const { profile, vaga } = req.body as { profile: ProfileData; vaga: string };

    if (!profile) {
      res.status(400).json({ erro: 'Perfil não fornecido' });
      return;
    }
    if (!vaga || typeof vaga !== 'string' || vaga.trim().length < 20) {
      res.status(400).json({ erro: 'Cole a descrição completa da vaga (mínimo 20 caracteres)' });
      return;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: CV_POR_VAGA_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Perfil completo do profissional:\n${JSON.stringify(profile, null, 2)}\n\n---\n\nDescrição da vaga-alvo:\n${vaga}`,
        },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const aiResult = JSON.parse(extrairJson(texto)) as CvPorVagaAI;

    const html = buildCvPorVagaHtml(profile, aiResult);
    const pdf = await htmlToPdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="curriculo-vaga-${(profile.nome ?? 'profissional').toLowerCase().replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });
    res.end(pdf);
  } catch (err) {
    console.error('[cv/gerar-por-vaga]', err);
    res.status(500).json({ erro: 'Erro ao gerar currículo para a vaga. Tente novamente.' });
  }
});

// ─── Rota: Preview HTML por Vaga ─────────────────────────────────────────────

rotasCv.post('/preview-por-vaga', async (req, res) => {
  try {
    const { profile, vaga } = req.body as { profile: ProfileData; vaga: string };

    if (!profile) {
      res.status(400).json({ erro: 'Perfil não fornecido' });
      return;
    }
    if (!vaga || typeof vaga !== 'string' || vaga.trim().length < 20) {
      res.status(400).json({ erro: 'Cole a descrição completa da vaga (mínimo 20 caracteres)' });
      return;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: CV_POR_VAGA_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Perfil completo do profissional:\n${JSON.stringify(profile, null, 2)}\n\n---\n\nDescrição da vaga-alvo:\n${vaga}`,
        },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const aiResult = JSON.parse(extrairJson(texto)) as CvPorVagaAI;

    const html = buildCvPorVagaHtml(profile, aiResult);
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('[cv/preview-por-vaga]', err);
    res.status(500).json({ erro: 'Erro ao gerar preview para a vaga.' });
  }
});

// ─── Carta de apresentação ────────────────────────────────────────────────────

const CARTA_PROMPT = `Você é um especialista em redação profissional para o mercado de trabalho brasileiro.

Sua tarefa: gerar uma carta de apresentação personalizada para uma vaga específica, usando os dados reais do perfil do candidato.

A carta deve:
- Ter entre 3 e 4 parágrafos
- Parágrafo 1: gancho forte — por que esta vaga/empresa interessa ao candidato
- Parágrafo 2-3: experiências e conquistas do perfil que se alinham aos requisitos da vaga, com métricas quando disponíveis
- Parágrafo final: proposta de valor e call-to-action profissional
- Tom: profissional, confiante, mas não arrogante
- Idioma: português do Brasil
- Usar APENAS dados reais do perfil — nunca inventar

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown — com:
{
  "carta": "texto completo da carta de apresentação",
  "assunto_email": "sugestão de assunto para email com máximo de 60 caracteres"
}`;

rotasCv.post('/carta', checkPlan('cv_carta'), async (req, res) => {
  try {
    const { profile, vaga } = req.body as { profile: Record<string, unknown>; vaga: string };

    if (!profile) { res.status(400).json({ erro: 'Perfil não fornecido' }); return; }
    if (!vaga || vaga.trim().length < 20) { res.status(400).json({ erro: 'Descrição da vaga muito curta (mín. 20 chars)' }); return; }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: CARTA_PROMPT,
      messages: [{
        role: 'user',
        content: `Perfil do candidato:\n${JSON.stringify(profile, null, 2)}\n\nDescrição da vaga:\n${vaga}`,
      }],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const resultado = JSON.parse(extrairJson(texto));
    res.json(resultado);
  } catch (err) {
    console.error('[cv/carta]', err);
    res.status(500).json({ erro: 'Erro ao gerar carta de apresentação.' });
  }
});

export default rotasCv;
