import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const rotasConta = Router();

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

rotasConta.delete('/excluir', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ erro: 'Não autenticado' });
      return;
    }

    await supabaseAdmin.from('candidaturas').delete().eq('user_id', userId);
    await supabaseAdmin.from('vagas_salvas').delete().eq('user_id', userId);
    await supabaseAdmin.from('linkedin_outputs').delete().eq('user_id', userId);
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error('[conta/excluir] erro ao deletar auth user:', error);
      res.status(500).json({ erro: 'Erro ao excluir conta do sistema de autenticação.' });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[conta/excluir]', err);
    res.status(500).json({ erro: 'Erro ao excluir conta. Tente novamente.' });
  }
});

export default rotasConta;
