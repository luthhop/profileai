import { supabase } from './supabase';

export const API = import.meta.env.VITE_API_URL || '';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = new Headers(init.headers);
  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return fetch(url, { ...init, headers });
}

export async function apiError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data.erro) return data.erro;
    if (data.error) return data.error;
    if (data.message) return data.message;
  } catch { /* not JSON */ }

  if (res.status === 401) return 'Sessão expirada. Faça login novamente.';
  if (res.status === 403) return 'Você não tem permissão para esta ação. Verifique seu plano.';
  if (res.status === 429) return 'Muitas requisições. Aguarde um momento e tente novamente.';
  if (res.status >= 500) return 'Erro no servidor. Tente novamente em alguns instantes.';
  return 'Erro inesperado. Tente novamente.';
}
