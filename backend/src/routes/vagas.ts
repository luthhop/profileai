import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { extrairJson } from '../utils/extrairJson';

const rotasVagas = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const JOOBLE_KEY = process.env.JOOBLE_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoobleJob {
  title: string;
  location: string;
  snippet: string;
  salary: string;
  source: string;
  type: string;
  link: string;
  company: string;
  updated: string;
  id: string;
}

interface ScoredVaga {
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

// ─── Scoring ──────────────────────────────────────────────────────────────────

const SCORE_SYSTEM = `Você é um especialista em recrutamento e matching de vagas para o mercado brasileiro.

Dado o perfil profissional de um candidato e uma lista de vagas, avalie a compatibilidade de cada vaga com o candidato.

Para cada vaga, atribua:
- score: número inteiro de 0 a 100 representando a compatibilidade
- motivo: frase curta (máx. 80 chars) explicando o score

Critérios de pontuação:
- 90-100: Vaga perfeita — cargo, stack e senioridade batem exatamente
- 70-89: Boa compatibilidade — maioria dos requisitos atendidos
- 50-69: Compatibilidade parcial — área relacionada mas gaps significativos
- 0-49: Baixa compatibilidade — área ou nível muito diferentes

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem texto extra — neste formato:
[{"id": "job_id", "score": 85, "motivo": "Stack React/Node alinhada, senioridade compatível"}]`;

async function scoreChunk(
  profile: Record<string, unknown>,
  jobs: JoobleJob[],
): Promise<Map<string, { score: number; motivo: string }>> {
  const jobsSummary = jobs.map(j => ({
    id: j.id,
    titulo: j.title,
    empresa: j.company,
    local: j.location,
    descricao: j.snippet,
    tipo: j.type,
  }));

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SCORE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Perfil do candidato:\n${JSON.stringify(profile, null, 2)}\n\nVagas para avaliar:\n${JSON.stringify(jobsSummary, null, 2)}`,
      },
    ],
  });

  const text = res.content[0].type === 'text' ? res.content[0].text : '[]';
  const parsed = JSON.parse(extrairJson(text)) as { id: string; score: number; motivo: string }[];

  const map = new Map<string, { score: number; motivo: string }>();
  for (const item of parsed) {
    map.set(item.id, { score: item.score, motivo: item.motivo });
  }
  return map;
}

async function fetchJooblePages(
  keywords: string,
  location: string | undefined,
  pages: number,
): Promise<{ jobs: JoobleJob[]; total: number }> {
  const fetches = Array.from({ length: pages }, (_, i) =>
    fetch(`https://jooble.org/api/${JOOBLE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, ...(location ? { location } : {}), page: i + 1 }),
    }).then(async r => {
      if (!r.ok) return null;
      return (await r.json()) as { totalCount: number; jobs: JoobleJob[] };
    }).catch(() => null),
  );

  const results = await Promise.all(fetches);
  const allJobs: JoobleJob[] = [];
  let total = 0;
  const seenIds = new Set<string>();

  for (const r of results) {
    if (!r) continue;
    total = Math.max(total, r.totalCount);
    for (const j of r.jobs ?? []) {
      if (!seenIds.has(j.id)) {
        seenIds.add(j.id);
        allJobs.push(j);
      }
    }
  }

  return { jobs: allJobs, total };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

rotasVagas.post('/search', async (req, res) => {
  try {
    const { keywords, location, profile, page = 1 } = req.body as {
      keywords: string;
      location?: string;
      profile: Record<string, unknown>;
      page?: number;
    };

    if (!keywords || !profile) {
      res.status(400).json({ erro: 'keywords e profile são obrigatórios' });
      return;
    }

    if (!JOOBLE_KEY) {
      res.status(500).json({ erro: 'Chave da Jooble API não configurada no servidor.' });
      return;
    }

    const pagesToFetch = page === 1 ? 3 : 1;
    const startPage = page === 1 ? 1 : page;

    let allJobs: JoobleJob[];
    let total: number;

    if (pagesToFetch > 1) {
      const result = await fetchJooblePages(keywords, location, pagesToFetch);
      allJobs = result.jobs;
      total = result.total;
    } else {
      const joobleRes = await fetch(`https://jooble.org/api/${JOOBLE_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, ...(location ? { location } : {}), page: startPage }),
      });

      if (!joobleRes.ok) {
        const body = await joobleRes.text().catch(() => '');
        console.error(`[vagas/search] Jooble retornou status ${joobleRes.status}: ${body}`);
        res.status(502).json({ erro: `Erro ao consultar Jooble (status ${joobleRes.status}).` });
        return;
      }

      const joobleData = (await joobleRes.json()) as { totalCount: number; jobs: JoobleJob[] };
      allJobs = joobleData.jobs ?? [];
      total = joobleData.totalCount;
    }

    if (allJobs.length === 0) {
      res.json({ vagas: [], total: 0 });
      return;
    }

    // Scoring com Claude — chunks de 10 em paralelo
    const CHUNK_SIZE = 10;
    const chunks: JoobleJob[][] = [];
    for (let i = 0; i < allJobs.length; i += CHUNK_SIZE) {
      chunks.push(allJobs.slice(i, i + CHUNK_SIZE));
    }

    const scoreMaps = await Promise.all(chunks.map(chunk => scoreChunk(profile, chunk)));
    const mergedScores = new Map<string, { score: number; motivo: string }>();
    for (const m of scoreMaps) {
      for (const [k, v] of m) mergedScores.set(k, v);
    }

    const vagas: ScoredVaga[] = allJobs.map(j => {
      const s = mergedScores.get(j.id) ?? { score: 50, motivo: 'Score estimado' };
      return {
        id: j.id,
        titulo: j.title,
        empresa: j.company,
        local: j.location,
        descricao: j.snippet,
        salario: j.salary,
        tipo: j.type,
        url: j.link,
        fonte: j.source,
        atualizada: j.updated,
        match_score: s.score,
        match_motivo: s.motivo,
      };
    });

    vagas.sort((a, b) => b.match_score - a.match_score);

    res.json({ vagas, total });
  } catch (err) {
    console.error('[vagas/search]', err);
    res.status(500).json({ erro: 'Erro ao buscar vagas. Tente novamente.' });
  }
});

export default rotasVagas;
