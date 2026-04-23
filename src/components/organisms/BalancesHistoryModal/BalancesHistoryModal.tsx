import { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

import { X, History, Loader2 } from 'lucide-react';
import type { CashierSession } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useRegion } from '@/hooks/useRegion';
import api from '@/services/api';

interface BalancesHistoryModalProps {
  onClose: () => void;
}

export function BalancesHistoryModal({ onClose }: BalancesHistoryModalProps) {
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { formatPrice } = useRegion();

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/pos/sessions');
        if (response.data.status) {
          const apiSessions = response.data.data.map((s: any) => ({
            id: s.id,
            cashierId: s.cashier?.id?.toString() || s.cashier_id?.toString(),
            cashierName: (s.cashier?.name && s.cashier.name !== 'Unknown') 
              ? s.cashier.name 
              : (s.cashier_name || s.user?.name || 'كاشير'),
            openingTime: s.opened_at,
            closingTime: s.closed_at,
            openingBalance: parseFloat(s.opening_balance),
            closingBalance: parseFloat(s.actual_balance),
            expectedBalance: parseFloat(s.expected_balance),
            difference: parseFloat(s.difference),
            status: s.status,
          }));
          setSessions(apiSessions);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-fadeIn p-6" onMouseDown={onClose}>
      <div className={`border rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between p-8 border-b shrink-0 ${isDark ? 'border-slate-800/50 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
              <History className="w-6 h-6 text-indigo-500" />
            </div>
            {t('sessionHistory.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className={`rounded-2xl h-12 w-12 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-6 h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 min-h-[300px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium animate-pulse">{t('common.loadingHistory')}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              {t('sessionHistory.empty')}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className={`border rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 justify-between transition-colors ${isDark ? 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.cashierName}</h3>
                      <Badge variant={session.status === 'open' ? 'success' : 'default'} size="sm" className="px-3">
                        {session.status === 'open' ? t('sessionHistory.statusOpen') : t('sessionHistory.statusClosed')}
                      </Badge>
                    </div>
                    <div className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('sessionHistory.opened')} <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{new Date(session.openingTime).toLocaleString(t('common.locale') || (t('language') === 'ar' ? 'ar-EG' : 'en-US'))}</span>
                    </div>
                    {session.closingTime && (
                      <div className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('sessionHistory.closed')} <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{new Date(session.closingTime).toLocaleString(t('common.locale') || (t('language') === 'ar' ? 'ar-EG' : 'en-US'))}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex gap-8 items-center text-left p-4 rounded-[1.5rem] ${isDark ? 'bg-slate-900/50' : 'bg-white border border-slate-200'}`} dir="ltr">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('sessionHistory.openingBalance')}</p>
                      <p className={`font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(session.openingBalance)}</p>
                    </div>
                    {session.closingBalance !== undefined && (
                      <div>
                        <p className={`text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('sessionHistory.actualBalance')}</p>
                        <p className="font-mono text-xl text-indigo-500 font-bold">{formatPrice(session.closingBalance)}</p>
                      </div>
                    )}
                    {session.difference !== undefined && (
                      <div className={`p-4 rounded-xl border ${session.difference === 0 ? 'bg-emerald-500/10 border-emerald-500/20' : session.difference > 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t('sessionHistory.difference')}</p>
                        <p className={`font-mono text-2xl font-bold ${session.difference === 0 ? 'text-emerald-500' : session.difference > 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                          {session.difference > 0 ? '+' : ''}{formatPrice(session.difference)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
