import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const rotasEntrevista = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  profile: Record<string, unknown>,
  vagaDescricao?: string,
): string {
  const contextoVaga = vagaDescricao
    ? `\n\nDescrição da vaga que o candidato está se preparando:\n${vagaDescricao}`
    : '';

  return `Você é um entrevistador profissional experiente para o mercado de trabalho brasileiro. Sua tarefa é conduzir uma mock interview realista e construtiva, inteiramente em português do Brasil.

Perfil do candidato:
${JSON.stringify(profile, null, 2)}${contextoVaga}

Regras da entrevista:
1. Faça UMA pergunta por vez. Nunca envie mais de uma pergunta por mensagem.
2. Comece se apresentando brevemente como entrevistador e faça a primeira pergunta.
3. As perguntas devem alternar entre técnicas (da stack/área do candidato) e comportamentais (método STAR).
4. Adapte a dificuldade ao nível do cargo do candidato.
5. Se a resposta for vaga, peça exemplos concretos com métricas.
6. Seja profissional, amigável e encorajador.
7. Faça entre 5 e 7 perguntas no total.

Quando o candidato enviar a mensagem exata "FEEDBACK_FINAL", encerre a entrevista e forneça:

1. **Avaliação Geral** — nota de 0 a 100 e comentário
2. **Pontos Fortes** — lista das melhores respostas com justificativa
3. **Pontos a Melhorar** — respostas fracas com sugestão de como responder melhor usando STAR
4. **Dicas Finais** — 3 dicas práticas para a próxima entrevista real

Formate o feedback de forma clara e organizada com markdown.`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

rotasEntrevista.post('/chat', async (req, res) => {
  try {
    const { profile, vaga_descricao, messages } = req.body as {
      profile: Record<string, unknown>;
      vaga_descricao?: string;
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!profile || !messages) {
      res.status(400).json({ erro: 'profile e messages são obrigatórios' });
      return;
    }

    const system = buildSystemPrompt(profile, vaga_descricao);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const finished = messages.some(m => m.content === 'FEEDBACK_FINAL');

    res.json({ response: text, finished });
  } catch (err) {
    console.error('[entrevista/chat]', err);
    res.status(500).json({ erro: 'Erro na entrevista. Tente novamente.' });
  }
});

// ─── Preparação ─────────────────────────────────────────────────────────────

const PREP_PROMPT = `Você é um coach de entrevistas expert no mercado de trabalho brasileiro, com 15+ anos preparando candidatos para processos seletivos.

Dado o perfil do candidato e opcionalmente uma descrição de vaga, gere um kit completo de preparação para entrevista.

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código — com estas chaves:

{
  "comportamentais": [
    { "pergunta": "pergunta comportamental", "dica": "como responder usando método STAR" }
  ],
  "tecnicas": [
    { "pergunta": "pergunta técnica da área/stack", "dica": "pontos-chave para responder" }
  ],
  "salario": [
    { "dica": "dica de negociação salarial específica para este perfil/cargo" }
  ],
  "perguntar_ao_entrevistador": [
    { "pergunta": "pergunta inteligente para fazer ao entrevistador", "por_que": "por que essa pergunta impressiona" }
  ]
}

Gere exatamente 6 perguntas comportamentais, 6 técnicas, 4 dicas de salário e 5 perguntas para o entrevistador.
Todas devem ser específicas para o perfil e cargo/vaga do candidato, nunca genéricas.`;

rotasEntrevista.post('/preparacao', async (req, res) => {
  try {
    const { profile, vaga_descricao } = req.body as {
      profile: Record<string, unknown>;
      vaga_descricao?: string;
    };

    if (!profile) {
      res.status(400).json({ erro: 'profile é obrigatório' });
      return;
    }

    const content = vagaDescricaoStr(profile, vaga_descricao);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: PREP_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const resultado = JSON.parse(match ? match[1].trim() : text.trim());

    res.json(resultado);
  } catch (err) {
    console.error('[entrevista/preparacao]', err);
    res.status(500).json({ erro: 'Erro ao gerar preparação. Tente novamente.' });
  }
});

function vagaDescricaoStr(profile: Record<string, unknown>, vaga?: string): string {
  let s = `Perfil do candidato:\n${JSON.stringify(profile, null, 2)}`;
  if (vaga) s += `\n\nDescrição da vaga:\n${vaga}`;
  return s;
}

export default rotasEntrevista;
