import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/AppLayout';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <LogoMark size={56} />
        <div>
          <h1 className="font-display text-6xl font-bold text-primary">404</h1>
          <p className="mt-2 font-display text-lg font-semibold text-ink">Página não encontrada</p>
          <p className="mt-1 font-body text-sm text-ink/50">
            A página que você procura não existe ou foi movida.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="rounded-btn bg-primary px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[.98]"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </main>
  );
}
