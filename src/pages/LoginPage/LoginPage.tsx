import { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { Fingerprint } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import toast from 'react-hot-toast';
import { Logo } from '@/components/atoms/Logo';
export function LoginPage() {
  const { login } = usePOS();
  const { t } = useTranslation();
  useTheme();
  const [pin, setPin] = useState('');

  const handleLogin = async () => {
    if (await login(pin)) {
      toast.success(t('login.success'));
    } else {
      toast.error(t('login.error'));
      setPin('');
    }
  };

  const handleKey = (key: string) => {
    if (key === 'C') setPin('');
    else if (key === 'DEL') setPin(pin.slice(0, -1));
    else if (pin.length < 6) setPin(pin + key);
  };

  const numKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  return (
    <div className={`h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--bg-primary)]`}>
      {/* Ambient background */}
      <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_60%)]`} />
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] blur-[150px] rounded-full pointer-events-none bg-indigo-500/5`} />

      {/* Login Card */}
      <div className={`w-[340px] max-h-[calc(100vh-2rem)] backdrop-blur-2xl border rounded-3xl p-6 z-10 flex flex-col items-center animate-scaleIn bg-[var(--bg-secondary)]/80 border-[var(--border-color)] shadow-2xl`}>
        
        {/* Brand */}
        <div className="mb-6">
          <Logo size="lg" />
        </div>

        <h1 className={`text-xl font-bold mb-0.5 text-[var(--text-primary)]`}>{t('login.title')}</h1>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.3em] mb-5 text-[var(--text-muted)]`}>{t('login.subtitle')}</p>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 mb-5 h-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                pin.length > i
                  ? 'bg-indigo-400 border-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.6)] scale-110'
                  : 'bg-transparent border-[var(--border-color)]'
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div dir="ltr" className="grid grid-cols-3 gap-2 w-full mb-5">
          {numKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className={`h-12 rounded-xl text-base font-semibold transition-all duration-150 cursor-pointer select-none active:scale-90
                ${key === 'C'
                  ? `text-red-500 hover:bg-red-500/15 border border-red-500/10 bg-red-500/5`
                  : key === 'DEL'
                  ? `bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-[var(--border-color)]`
                  : `bg-[var(--bg-overlay)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]`
                }`}
            >
              {key === 'DEL' ? (
                <span className="flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </span>
              ) : key}
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          disabled={pin.length !== 6}
          onClick={handleLogin}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:from-indigo-500 hover:to-indigo-400 shadow-lg shadow-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] cursor-pointer"
        >
          <Fingerprint className="w-5 h-5" />
          {t('login.enterSystem')}
        </button>
      </div>
    </div>
  );
}