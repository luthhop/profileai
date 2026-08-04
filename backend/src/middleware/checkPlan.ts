import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';
import type { AuthenticatedRequest } from './auth';

const FREE_LIMITS: Record<string, number> = {
  linkedin_generate: 1,
  linkedin_modo_alvo: 0,
  linkedin_score: 0,
  cv_generate: 1,
  cv_por_vaga: 0,
  cv_carta: 0,
  vagas_search: 3,
  entrevista_preparacao: 0,
};

export function checkPlan(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).userId;
      if (!userId) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plano, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (sub?.plano === 'pro' && sub?.status === 'active') {
        next();
        return;
      }

      const limit = FREE_LIMITS[feature];

      if (limit === undefined) { next(); return; }

      if (limit === 0) {
        res.status(403).json({
          erro: 'Recurso exclusivo do plano Pro. Faça upgrade para desbloquear.',
          upgrade: true,
        });
        return;
      }

      const { data: usage } = await supabase
        .from('usage_counters')
        .select('count, reset_at')
        .eq('user_id', userId)
        .eq('feature', feature)
        .maybeSingle();

      if (usage) {
        const resetAt = new Date(usage.reset_at);
        if (resetAt < new Date()) {
          await supabase.from('usage_counters').update({
            count: 1,
            reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq('user_id', userId).eq('feature', feature);
          next();
          return;
        }

        if (usage.count >= limit) {
          res.status(403).json({
            erro: 'Limite do plano gratuito atingido. Faça upgrade para o plano Pro.',
            upgrade: true,
          });
          return;
        }

        await supabase.from('usage_counters').update({
          count: usage.count + 1,
        }).eq('user_id', userId).eq('feature', feature);
      } else {
        await supabase.from('usage_counters').insert({
          user_id: userId,
          feature,
          count: 1,
          reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      next();
    } catch (err) {
      console.error('[checkPlan]', err);
      next();
    }
  };
}
