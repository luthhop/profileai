import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─── Icons ───────────────────────────────────────────────────────────────────

function IcoDashboard() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IcoLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2c.84-1.24 2.28-2 4-2z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IcoMic() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IcoDoc() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
function IcoPerfil() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IcoKanban() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}
function IcoMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IcoCrown() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-9-4 9-6-7z" />
      <path d="M3 20h18" />
    </svg>
  );
}
function IcoSignOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-xl bg-primary"
      style={{ width: size, height: size }}
    >
      <svg width={Math.round(size * 0.56)} height={Math.round(size * 0.56)} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="11" height="11" rx="3" fill="#fff" />
        <rect x="17" y="4" width="11" height="11" rx="3" fill="#fff" opacity=".6" />
        <rect x="4" y="17" width="11" height="11" rx="3" fill="#fff" opacity=".4" />
        <rect x="17" y="17" width="11" height="11" rx="3" fill="#fff" opacity=".2" />
      </svg>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Dashboard',      path: '/dashboard',  icon: <IcoDashboard /> },
  { label: 'LinkedIn Coach', path: '/linkedin',   icon: <IcoLinkedIn /> },
  { label: 'Vagas',          path: '/vagas',      icon: <IcoSearch /> },
  { label: 'Currículo',      path: '/curriculo',  icon: <IcoDoc /> },
  { label: 'Entrevistas',    path: '/entrevista', icon: <IcoMic /> },
  { label: 'Candidaturas',   path: '/candidaturas', icon: <IcoKanban /> },
  { label: 'Perfil',          path: '/perfil',     icon: <IcoPerfil /> },
  { label: 'Planos',          path: '/planos',     icon: <IcoCrown /> },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  displayName: string;
  email: string | undefined;
  avatarUrl: string | undefined;
  onSignOut: () => void;
  onClose?: () => void;
}

function SidebarContent({ displayName, email, avatarUrl, onSignOut, onClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <LogoMark size={36} />
        <span className="font-display text-xl font-bold text-ink">
          Profile<span className="text-primary">AI</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-btn px-3 py-2.5 font-body text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-pale text-primary'
                  : 'text-ink/60 hover:bg-gray-50 hover:text-ink'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-1 border-t border-gray-100 px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-1.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-pale font-display text-xs font-bold text-primary">
              {getInitials(displayName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-xs font-semibold text-ink">{displayName}</p>
            <p className="truncate font-body text-xs text-ink/40">{email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-btn px-3 py-2 font-body text-xs text-ink/50 transition hover:bg-gray-50 hover:text-ink"
        >
          <IcoSignOut />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ─── AppLayout ────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  user: User;
  children: React.ReactNode;
}

export default function AppLayout({ user, children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  }

  const displayName: string = user.user_metadata?.full_name ?? user.email ?? '—';
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url;

  const sidebarProps: SidebarProps = {
    displayName,
    email: user.email,
    avatarUrl,
    onSignOut: handleSignOut,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-ink/20 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-gray-100 bg-white shadow-2xl md:hidden">
            <SidebarContent {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-btn text-ink/60 transition hover:bg-gray-100"
            aria-label="Abrir menu"
          >
            <IcoMenu />
          </button>
          <LogoMark size={28} />
          <span className="font-display text-base font-bold text-ink">
            Profile<span className="text-primary">AI</span>
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
