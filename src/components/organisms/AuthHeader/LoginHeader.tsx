import { usePOS } from '@/hooks/usePOS';
import { useTranslation } from '@/hooks/useTranslation';
import { LogOut, User, Terminal } from 'lucide-react';
import { Logo } from '@/components/atoms/Logo';

export function LoginHeader() {
  const { state, logout } = usePOS();
  const { t } = useTranslation();
  const hasToken = !!localStorage.getItem('pos_token');

  if (!hasToken && !state.currentUser) return null;

  return (
    <header className="absolute top-0 left-0 w-full z-50 p-4 sm:p-6 animate-slideDown">
      <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl bg-[var(--bg-secondary)]/40 border border-[var(--border-color)] rounded-2xl px-4 py-2 shadow-xl">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/10 rounded-lg">
            <Terminal className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              {t('header.terminal') || 'Terminal 01'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-overlay)] border border-[var(--border-color)] rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {state.currentUser.name}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all active:scale-95 font-bold text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('session.changeUser') || 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
