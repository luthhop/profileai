import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { extrairJson } from '../utils/extrairJson';

// ─── Perfil ──────────────────────────────────────────────────────────────────

export const rotasPerfil = Router();

rotasPerfil.get('/', (_req, res) => {
  res.json({ mensagem: 'Rota de perfil funcionando' });
});

// ─── LinkedIn Coach ───────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é um especialista em LinkedIn e personal branding para o mercado de trabalho brasileiro, com mais de 10 anos de experiência ajudando profissionais de todas as áreas a se posicionarem estrategicamente.

Sua tarefa: analisar o perfil profissional fornecido e gerar conteúdo otimizado para LinkedIn em português do Brasil.

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código, sem texto fora do JSON — com exatamente estas chaves:

{
  "headline": "string com máximo 120 caracteres: cargo + proposta de valor + diferencial relevante para recrutadores",
  "about": "string com 4-5 parágrafos em primeira pessoa (máx. 2.600 caracteres): parágrafo 1 — gancho forte com diferencial; parágrafos 2-3 — trajetória e conquistas com métricas reais; parágrafo 4 — proposta de valor única; parágrafo 5 — CTA claro",
  "habilidades": ["array com exatamente 10 strings — mix de habilidades técnicas e comportamentais alinhadas ao cargo/área"],
  "keywords": ["array com exatamente 20 strings — palavras-chave SEO que recrutadores brasileiros buscam para este perfil: cargos, tecnologias, certificações, soft skills"],
  "dicas": ["array com exatamente 5 strings — dicas específicas e acionáveis baseadas neste perfil para aumentar visibilidade no LinkedIn Brasil"]
}

Diretrizes obrigatórias:
- Use os dados reais do perfil. Nunca invente informações.
- A headline deve conter palavras-chave do cargo e ter proposta de valor clara.
- O about deve começar com uma primeira frase impactante e usar métricas quando disponíveis.
- As keywords devem incluir variações de cargo, área, tecnologias e termos do setor.
- As dicas devem ser específicas para este profissional, não conselhos genéricos de LinkedIn.`;

const MODO_ALVO_PROMPT = `Você é um especialista de elite em LinkedIn, personal branding e recrutamento no mercado brasileiro, com 15+ anos posicionando profissionais estrategicamente para vagas específicas.

Sua tarefa: receber o perfil completo do usuário E a descrição de uma vaga-alvo. Você deve:
1. Extrair TODAS as palavras-chave, stack, requisitos, competências e diferenciais exigidos pela vaga
2. Comparar ponto-a-ponto com o perfil atual do usuário
3. Gerar uma versão OTIMIZADA e CALIBRADA do perfil LinkedIn especificamente para essa vaga
4. Calcular % de match antes (perfil atual) e depois (perfil otimizado)
5. Listar gaps — o que a vaga pede e o usuário ainda precisa desenvolver

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código, sem texto fora do JSON — com exatamente estas chaves:

{
  "match_antes": número inteiro de 0 a 100 representando a aderência do perfil ATUAL à vaga,
  "match_depois": número inteiro de 0 a 100 representando a aderência do perfil OTIMIZADO à vaga,
  "headline_atual": "headline genérica atual baseada no perfil fornecido (max 120 chars)",
  "headline_otimizado": "headline recalibrada com palavras-chave da vaga (max 120 chars)",
  "about_atual": "about genérico de 2-3 parágrafos baseado no perfil",
  "about_otimizado": "about reescrito e calibrado para a vaga específica, 4-5 parágrafos em primeira pessoa, com métricas do perfil real alinhadas aos requisitos da vaga",
  "habilidades_atuais": ["10 habilidades genéricas do perfil atual"],
  "habilidades_otimizadas": ["10 habilidades recalibradas priorizando o que a vaga pede e o usuário tem"],
  "keywords_atuais": ["15 keywords SEO genéricas do perfil"],
  "keywords_otimizadas": ["20 keywords SEO calibradas para a vaga — cargos, stack, certificações, termos do setor"],
  "requisitos_atendidos": ["lista do que a vaga pede e o usuário JÁ tem — seja específico, cite evidência do perfil"],
  "gaps": ["lista do que a vaga pede e o usuário NÃO tem ou precisa desenvolver — com sugestão concreta de como fechar cada gap"]
}

Diretrizes obrigatórias:
- Use APENAS dados reais do perfil. Nunca invente experiências ou habilidades que o usuário não tem.
- O about_otimizado deve reorganizar e enfatizar as experiências do usuário que mais se alinham à vaga.
- As habilidades_otimizadas devem priorizar o que a vaga pede E o usuário possui.
- Os gaps devem ser honestos e incluir sugestões práticas (curso, certificação, projeto).
- O match_antes deve refletir a aderência real; o match_depois reflete o ganho com repositionamento (não com mentiras).`;

const SCORE_PROMPT = `Você é um especialista em LinkedIn e personal branding para o mercado de trabalho brasileiro.

Sua tarefa: avaliar o perfil LinkedIn do usuário e atribuir uma nota de 0 a 100 com breakdown por categoria.

Analise o perfil fornecido e retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código — com estas chaves:

{
  "score_total": número inteiro de 0 a 100,
  "categorias": [
    { "nome": "Foto e banner", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "URL personalizada", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "Headline", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "About completo", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "Experiências com resultados", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "Habilidades e endorsements", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "Certificações e formação", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" },
    { "nome": "Atividade e SSI", "score": 0-100, "status": "ok" | "melhorar" | "ausente", "dica": "dica específica" }
  ],
  "resumo": "Resumo em 2-3 frases do estado do perfil e ações prioritárias"
}

Diretrizes:
- Avalie baseado nos dados disponíveis no perfil
- Se o perfil não tem foto/banner (informação não disponível), considere como "melhorar" e sugira
- score_total é a média ponderada das categorias (headline e about pesam mais)
- As dicas devem ser específicas e acionáveis para este perfil`;

export const rotasLinkedin = Router();

rotasLinkedin.post('/score', async (req, res) => {
  try {
    const { profile } = req.body as { profile: Record<string, unknown> };
    if (!profile) { res.status(400).json({ erro: 'Perfil não fornecido' }); return; }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SCORE_PROMPT,
      messages: [{ role: 'user', content: `Perfil do usuário:\n${JSON.stringify(profile, null, 2)}` }],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const resultado = JSON.parse(extrairJson(texto));
    res.json(resultado);
  } catch (err) {
    console.error('[linkedin/score]', err);
    res.status(500).json({ erro: 'Erro ao calcular score. Tente novamente.' });
  }
});

rotasLinkedin.post('/generate', async (req, res) => {
  try {
    const { profile } = req.body as { profile: Record<string, unknown> };

    if (!profile) {
      res.status(400).json({ erro: 'Perfil não fornecido' });
      return;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Perfil profissional do usuário:\n${JSON.stringify(profile, null, 2)}`,
        },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const resultado = JSON.parse(extrairJson(texto));

    res.json(resultado);
  } catch (err) {
    console.error('[linkedin/generate]', err);
    res.status(500).json({ erro: 'Erro ao processar com IA. Tente novamente.' });
  }
});

rotasLinkedin.post('/modo-alvo', async (req, res) => {
  try {
    const { profile, vaga } = req.body as { profile: Record<string, unknown>; vaga: string };

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
      system: MODO_ALVO_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Perfil completo do usuário:\n${JSON.stringify(profile, null, 2)}\n\n---\n\nDescrição da vaga-alvo:\n${vaga}`,
        },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const resultado = JSON.parse(extrairJson(texto));

    res.json(resultado);
  } catch (err) {
    console.error('[linkedin/modo-alvo]', err);
    res.status(500).json({ erro: 'Erro ao processar Modo Alvo. Tente novamente.' });
  }
});
