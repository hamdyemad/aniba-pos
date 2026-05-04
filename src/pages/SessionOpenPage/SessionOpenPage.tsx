import { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { Wallet, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useRegion } from '@/hooks/useRegion';
import { LoginHeader } from '@/components/organisms/AuthHeader/LoginHeader';
import toast from 'react-hot-toast';

export function SessionOpenPage() {
  const { state, openSession } = usePOS();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { selectedCountry } = useRegion();
  const [balance, setBalance] = useState('');
  const [terminalCode, setTerminalCode] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleOpenSession = async () => {
    setIsOpening(true);
    setErrors({});
    try {
      await openSession(parseFloat(balance), terminalCode);
      toast.success(t('session.openSuccess'));
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(t('session.openError'));
      }
    } finally {
      setIsOpening(false);
    }
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className={`h-screen w-full flex items-center justify-center relative overflow-hidden ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <LoginHeader />
      {/* Ambient background */}
      <div className={`absolute inset-0 pointer-events-none ${isDark ? 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]' : 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_60%)]'}`} />
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] blur-[150px] rounded-full pointer-events-none ${isDark ? 'bg-emerald-600/6' : 'bg-emerald-400/10'}`} />

      {/* Card */}
      <div className={`w-[400px] max-h-[calc(100vh-2rem)] backdrop-blur-2xl border rounded-3xl p-8 z-10 flex flex-col items-center animate-scaleIn ${isDark ? 'bg-slate-900/90 border-white/10 shadow-[0_0_80px_-20px_rgba(16,185,129,0.12)]' : 'bg-white/90 border-slate-200 shadow-[0_0_80px_-20px_rgba(16,185,129,0.08)]'}`}>

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-5 ${isDark ? 'bg-emerald-500/12 border-emerald-500/15' : 'bg-emerald-100 border-emerald-200'}`}>
          <Wallet className="w-7 h-7 text-emerald-500" />
        </div>

        {/* Greeting */}
        <h1 className={`text-2xl font-bold mb-1 text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t('session.welcome')} <span className="text-emerald-500">{state.currentUser?.name}</span>
        </h1>
        <p className={`text-sm text-center mb-8 max-w-[320px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          {t('session.instruction')}
        </p>

        {/* Terminal Code Input */}
        <div className="w-full mb-4">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('session.terminalCode')}
          </label>
          <input
            type="text"
            value={terminalCode}
            onChange={(e) => setTerminalCode(e.target.value)}
            onFocus={() => clearError('terminal_code')}
            className={`w-full h-12 border rounded-xl px-4 text-lg font-medium focus:outline-none focus:ring-2 transition-all ${
              errors.terminal_code 
                ? 'bg-red-50/50 border-red-500/50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                : isDark ? 'bg-slate-950/60 border-slate-700/50 text-white focus:border-emerald-500/40 focus:ring-emerald-500/10 placeholder:text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400 focus:ring-emerald-500/20 placeholder:text-slate-400'
            }`}
            placeholder="e.g. T01"
          />
          {errors.terminal_code && (
            <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.terminal_code[0]}
            </p>
          )}
        </div>

        {/* Balance Input */}
        <div className="w-full mb-6">
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t('session.openingBalance')}
          </label>
          <div className="relative" dir="ltr">
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              onFocus={() => clearError('opening_balance')}
              className={`w-full h-16 border rounded-2xl text-center text-3xl font-mono font-bold px-16 focus:outline-none focus:ring-2 transition-all ${
                errors.opening_balance 
                  ? 'bg-red-50/50 border-red-500/50 text-red-900 focus:border-red-500 focus:ring-red-500/10' 
                  : isDark ? 'bg-slate-950/60 border-slate-700/50 text-white focus:border-emerald-500/40 focus:ring-emerald-500/10 placeholder:text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-400 focus:ring-emerald-500/20 placeholder:text-slate-400 shadow-inner'
              }`}
              placeholder="0.00"
              autoFocus
            />
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg border ${errors.opening_balance ? 'bg-red-100 border-red-200' : isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'}`}>
              <span className={`text-xs font-bold ${errors.opening_balance ? 'text-red-500' : isDark ? 'text-slate-500' : 'text-slate-500'}`}>{selectedCountry?.currency.display}</span>
            </div>
          </div>
          {errors.opening_balance && (
            <p className="mt-1.5 text-xs font-bold text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.opening_balance[0]}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          disabled={!balance || parseFloat(balance) < 0 || isOpening}
          onClick={handleOpenSession}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] cursor-pointer"
        >
          {isOpening ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            t('session.openShift')
          )}
        </button>
      </div>
    </div>
  );
}