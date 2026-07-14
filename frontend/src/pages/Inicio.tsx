import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Inicio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handlePostLogin(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) handlePostLogin(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handlePostLogin(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    navigate(data ? '/dashboard' : '/onboarding', { replace: true });
  }

  async function handleGoogleLogin() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo + nome */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M8 24 L16 8 L24 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 19 H21" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold text-primary tracking-tight">
            ProfileAI
          </h1>
          <p className="font-body text-base text-ink/60 text-center">
            sua carreira, acelerada por IA
          </p>
        </div>

        {/* Cartão de login */}
        <div className="w-full rounded-card bg-white p-8 shadow-sm border border-primary/10">
          <p className="font-body text-sm text-ink/50 text-center mb-6">
            Entre com sua conta para continuar
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-btn border border-gray-200 bg-white px-4 py-3 font-body text-sm font-medium text-ink transition-all hover:border-primary/40 hover:bg-primary-pale hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.39a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z" fill="#4285F4" />
                <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.59-4.11H1.07v2.59A9.99 9.99 0 0 0 10 20z" fill="#34A853" />
                <path d="M4.41 11.93A6.01 6.01 0 0 1 4.1 10c0-.67.11-1.32.31-1.93V5.48H1.07A9.99 9.99 0 0 0 0 10c0 1.61.38 3.14 1.07 4.52l3.34-2.59z" fill="#FBBC05" />
                <path d="M10 3.96c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.96.9 12.7 0 10 0A9.99 9.99 0 0 0 1.07 5.48l3.34 2.59C5.2 5.71 7.4 3.96 10 3.96z" fill="#EA4335" />
              </svg>
            )}
            {loading ? 'Redirecionando…' : 'Entrar com Google'}
          </button>
        </div>

        <p className="font-body text-xs text-ink/40 text-center">
          Ao entrar, você concorda com os nossos termos de uso e política de privacidade.
        </p>
      </div>
    </main>
  );
}
