import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const rotasConta = Router();

rotasConta.delete('/excluir', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

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
