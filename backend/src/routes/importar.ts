import { Router } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';

const rotasImportar = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function extrairJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

const IMPORT_PROMPT = `Você é um especialista em análise de currículos e perfis profissionais brasileiros.

Sua tarefa: receber o texto extraído de um PDF (currículo ou perfil LinkedIn exportado) e extrair todas as informações estruturadas.

Retorne EXCLUSIVAMENTE um JSON válido — sem markdown, sem blocos de código, sem texto fora do JSON — com exatamente estas chaves:

{
  "nome": "nome completo do profissional",
  "email_contato": "email se encontrado ou null",
  "telefone": "telefone se encontrado ou null",
  "cidade": "cidade se encontrada ou null",
  "estado": "estado/UF se encontrado ou null",
  "linkedin_url": "URL do LinkedIn se encontrada ou null",
  "github_url": "URL do GitHub se encontrada ou null",
  "portfolio_url": "URL do portfólio se encontrada ou null",
  "cargo_desejado": "cargo/título profissional principal",
  "area_desejada": "área de atuação principal",
  "senioridade": "júnior/pleno/sênior/especialista se identificável ou null",
  "objetivo_profissional": "resumo/objetivo profissional se encontrado ou null",
  "experiencias_detalhadas": [
    {
      "empresa": "nome da empresa",
      "cargo": "cargo exercido",
      "inicio": "mês/ano início (ex: Jan 2020)",
      "fim": "mês/ano fim ou vazio se atual",
      "descricao": "responsabilidades e atividades (um bullet por linha separado por \\n)",
      "resultados": "resultados e conquistas (um bullet por linha separado por \\n)",
      "stack": "tecnologias usadas separadas por vírgula",
      "atual": true ou false
    }
  ],
  "formacoes": [
    {
      "instituicao": "nome da instituição",
      "curso": "nome do curso",
      "grau": "bacharelado/tecnólogo/pós/MBA/mestrado/doutorado",
      "periodo": "ex: 2016 – 2020",
      "atividades": "atividades relevantes ou vazio",
      "projetos": "projetos acadêmicos ou vazio"
    }
  ],
  "certificacoes": [
    {
      "nome": "nome da certificação",
      "instituicao": "instituição emissora",
      "data": "data ou ano",
      "link": ""
    }
  ],
  "projetos_pessoais": [
    {
      "nome": "nome do projeto",
      "descricao": "descrição breve",
      "problema": "problema que resolve",
      "stack": "tecnologias usadas",
      "github": "URL se encontrada ou vazio",
      "demo": "URL demo se encontrada ou vazio",
      "periodo": "ano ou período"
    }
  ],
  "habilidades_detalhadas": {
    "tecnicas": ["habilidade técnica 1", "habilidade técnica 2"],
    "comportamentais": ["soft skill 1", "soft skill 2"],
    "ferramentas": ["ferramenta 1", "ferramenta 2"],
    "metodologias": ["metodologia 1", "metodologia 2"]
  },
  "idiomas": [
    { "nome": "Português", "nivel": "Nativo" },
    { "nome": "Inglês", "nivel": "B2 - Intermediário avançado" }
  ],
  "extras": {
    "resumo": "resumo profissional se encontrado ou vazio",
    "conquistas": "conquistas e prêmios ou vazio",
    "publicacoes": "publicações ou vazio",
    "voluntariado": "trabalho voluntário ou vazio",
    "hobbies": ""
  }
}

Diretrizes:
- Extraia o MÁXIMO de informação possível do texto fornecido
- Use apenas dados encontrados no texto — nunca invente
- Se uma seção não tiver dados, retorne array vazio [] ou null/string vazia conforme o tipo
- Padronize datas para formato "Mês Ano" (ex: Jan 2020, Mar 2023)
- Separe experiências diferentes em itens distintos do array
- Identifique habilidades técnicas vs comportamentais vs ferramentas vs metodologias`;

rotasImportar.post('/pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ erro: 'Nenhum arquivo enviado' });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ erro: 'O arquivo deve ser um PDF' });
      return;
    }

    const uint8 = new Uint8Array(req.file.buffer.buffer, req.file.buffer.byteOffset, req.file.buffer.byteLength);
    const parser = new PDFParse({ data: uint8 });
    const parsed = await parser.getText();
    await parser.destroy();
    const textoExtraido = parsed.text.trim();

    if (textoExtraido.length < 50) {
      res.status(400).json({ erro: 'O PDF não contém texto suficiente para extração.' });
      return;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: IMPORT_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Texto extraído do PDF:\n\n${textoExtraido}`,
        },
      ],
    });

    const texto = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const profileData = JSON.parse(extrairJson(texto));

    res.json(profileData);
  } catch (err) {
    console.error('[importar/pdf]', err);
    res.status(500).json({ erro: 'Erro ao processar o PDF. Tente novamente.' });
  }
});

export default rotasImportar;
