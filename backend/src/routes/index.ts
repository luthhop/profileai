import { Router } from 'express';
import { rotasPerfil, rotasLinkedin } from './perfil';
import rotasVagas from './vagas';
import rotasCv from './cv';
import rotasEntrevista from './entrevista';
import rotasImportar from './importar';
import rotasCandidaturas from './candidaturas';
import rotasStripe from './stripe';
import rotasConta from './conta';
import { extractUrl } from '../utils/extractUrl';

const rotas = Router();

rotas.use('/perfil', rotasPerfil);
rotas.use('/linkedin', rotasLinkedin);
rotas.use('/vagas', rotasVagas);
rotas.use('/cv', rotasCv);
rotas.use('/entrevista', rotasEntrevista);
rotas.use('/importar', rotasImportar);
rotas.use('/candidaturas', rotasCandidaturas);
rotas.use('/stripe', rotasStripe);
rotas.use('/conta', rotasConta);

rotas.post('/extract-url', async (req, res) => {
  try {
    const { url } = req.body as { url: string };
    if (!url || typeof url !== 'string') {
      res.status(400).json({ erro: 'URL não fornecida' });
      return;
    }
    const texto = await extractUrl(url);
    res.json({ texto });
  } catch (err) {
    console.error('[extract-url]', err);
    res.status(500).json({ erro: 'Não foi possível extrair o conteúdo da URL.' });
  }
});

export default rotas;
