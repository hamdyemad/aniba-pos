import { usePOS } from '@/hooks/usePOS';
import { Button } from '@/components/atoms/Button';

import { X, User, Clock, Wallet, TrendingUp } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useRegion } from '@/hooks/useRegion';

interface CurrentSessionModalProps {
  onClose: () => void;
}

export function CurrentSessionModal({ onClose }: CurrentSessionModalProps) {
  const { state } = usePOS();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useRegion();
  const session = state.currentSession;

  if (!session) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-fadeIn p-6" onMouseDown={onClose}>
      <div className={`border rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between p-8 border-b shrink-0 ${isDark ? 'border-slate-800/50 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
              <User className="w-6 h-6 text-indigo-500" />
            </div>
            {t('currentSession.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className={`rounded-2xl h-12 w-12 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.cashierName}</h3>
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t('currentSession.cashierId')} {session.cashierId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">{t('currentSession.openingTime')}</span>
                </div>
                <span className={`font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {new Date(session.openingTime).toLocaleString(t('common.locale') || (t('language') === 'ar' ? 'ar-EG' : 'en-US'))}
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-4 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-bold">{t('currentSession.openingBalance')}</span>
                </div>
                <span className="text-xl font-bold text-indigo-500">
                  {formatPrice(session.openingBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className={`p-5 rounded-[1.5rem] border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('currentSession.statusLabel')}</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">{t('currentSession.statusValue')}</span>
              </div>
            </div>
          </div>

          <Button variant="primary" size="xl" className="w-full h-16 rounded-2xl font-bold" onClick={onClose}>
            {t('currentSession.closeWindow')}
          </Button>
        </div>
      </div>
    </div>
  );
}
