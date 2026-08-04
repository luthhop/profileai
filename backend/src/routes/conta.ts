import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const rotasConta = Router();

rotasConta.delete('/excluir', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const { error: rpcError } = await supabaseAdmin.rpc('delete_user_data', {
      target_user_id: userId,
    });

    if (rpcError) {
      console.error('[conta/excluir] erro ao deletar dados:', rpcError);
      res.status(500).json({ erro: 'Erro ao excluir dados da conta. Tente novamente.' });
      return;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('[conta/excluir] erro ao deletar auth user:', authError);
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
