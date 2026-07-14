import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../lib/supabase';

const FREE_LIMITS: Record<string, number> = {
  linkedin_generate: 1,
  cv_generate: 1,
  vagas_search: 3,
};

function getUserId(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function checkPlan(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      if (!userId) { next(); return; }

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
      if (!limit) { next(); return; }

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
