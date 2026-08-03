import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') return null;

  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token) return null;

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user.id;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  getUserId(req).then(userId => {
    if (!userId) {
      res.status(401).json({ erro: 'Não autenticado' });
      return;
    }
    (req as Request & { userId: string }).userId = userId;
    next();
  }).catch(() => {
    res.status(401).json({ erro: 'Não autenticado' });
  });
}

export type AuthenticatedRequest = Request & { userId: string };
