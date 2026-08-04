import { Router } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';

const rotasCandidaturas = Router();

rotasCandidaturas.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const { data, error } = await supabase
      .from('candidaturas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error('[candidaturas/list]', err);
    res.status(500).json({ erro: 'Erro ao listar candidaturas.' });
  }
});

rotasCandidaturas.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const { vaga_titulo, vaga_empresa, vaga_url, match_score, status, notas } = req.body;

    if (!vaga_titulo) {
      res.status(400).json({ erro: 'vaga_titulo é obrigatório' });
      return;
    }

    const { data, error } = await supabase
      .from('candidaturas')
      .insert({
        user_id: userId,
        vaga_titulo,
        vaga_empresa: vaga_empresa ?? null,
        vaga_url: vaga_url ?? null,
        match_score: match_score ?? null,
        status: status ?? 'salva',
        notas: notas ?? null,
        data_aplicacao: status === 'aplicada' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[candidaturas/create]', err);
    res.status(500).json({ erro: 'Erro ao salvar candidatura.' });
  }
});

rotasCandidaturas.patch('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const { id } = req.params;
    const updates: Record<string, unknown> = {};

    if (req.body.status !== undefined) {
      updates.status = req.body.status;
      if (req.body.status === 'aplicada' && !req.body.data_aplicacao) {
        updates.data_aplicacao = new Date().toISOString();
      }
    }
    if (req.body.notas !== undefined) updates.notas = req.body.notas;
    if (req.body.vaga_titulo !== undefined) updates.vaga_titulo = req.body.vaga_titulo;
    if (req.body.vaga_empresa !== undefined) updates.vaga_empresa = req.body.vaga_empresa;
    if (req.body.data_aplicacao !== undefined) updates.data_aplicacao = req.body.data_aplicacao;

    const { data, error } = await supabase
      .from('candidaturas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('[candidaturas/update]', err);
    res.status(500).json({ erro: 'Erro ao atualizar candidatura.' });
  }
});

rotasCandidaturas.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const { error } = await supabase
      .from('candidaturas')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[candidaturas/delete]', err);
    res.status(500).json({ erro: 'Erro ao excluir candidatura.' });
  }
});

export default rotasCandidaturas;
