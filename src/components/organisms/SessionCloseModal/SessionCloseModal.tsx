import { useState, useEffect } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { orderService } from '@/services/posService';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Lock, X, Calculator, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { useRegion } from '@/hooks/useRegion';
import toast from 'react-hot-toast';

interface SessionCloseModalProps {
  onClose: () => void;
}

export function SessionCloseModal({ onClose }: SessionCloseModalProps) {
  const { state, closeSession } = usePOS();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { formatPrice, selectedCountry } = useRegion();
  const [actualBalance, setActualBalance] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [totals, setTotals] = useState({ 
    totalSales: 0, 
    totalRefunds: 0, 
    expectedBalance: state.currentSession?.openingBalance || 0 
  });

  useEffect(() => {
    const calculateTotals = async () => {
      if (!state.currentSession) return;
      const orders = await orderService.getOrders();
      const openingTime = new Date(state.currentSession.openingTime).getTime();
      
      const sessionOrders = orders.filter(o => new Date(o.createdAt).getTime() >= openingTime);
      
      const sales = sessionOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.grandTotal, 0);
        
      const refunds = sessionOrders
        .filter(o => o.status === 'refunded' || o.status === 'partial_refund')
        .reduce((sum, o) => sum + o.grandTotal, 0);
        
      const opening = state.currentSession.openingBalance;
      
      setTotals({
        totalSales: sales,
        totalRefunds: refunds,
        expectedBalance: opening + sales - refunds
      });
    };
    calculateTotals();
  }, [state.currentSession]);
  
  const actualAmount = parseFloat(actualBalance) || 0;
  const difference = actualAmount - totals.expectedBalance;

  const handleClose = async () => {
    setIsClosing(true);
    setErrors({});
    try {
      await closeSession(actualAmount, {
        expectedBalance: totals.expectedBalance,
        difference: difference,
        totalSales: totals.totalSales,
        totalRefunds: totals.totalRefunds
      });
      toast.success(t('session.closeSuccess'));
      onClose();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setIsConfirming(false);
      } else {
        toast.error(t('session.closeError'));
      }
    } finally {
      setIsClosing(false);
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] animate-fadeIn p-2 sm:p-6" onMouseDown={onClose}>
      <div className={`border rounded-[2.5rem] w-full max-w-xl max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl relative animate-scaleIn ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/50 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
          <h2 className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className="p-2.5 sm:p-3 bg-red-500/20 rounded-2xl">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            </div>
            {t('session.closeModal.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className={`rounded-2xl h-10 w-10 sm:h-12 sm:w-12 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </Button>
        </div>

        {!isConfirming ? (
          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
            <div className={`rounded-[2rem] p-4 sm:p-6 space-y-3 sm:space-y-4 border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="text-lg">{t('orders.cashier')}</span>
                <span className={`font-medium text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{state.currentSession?.cashierName}</span>
              </div>
              <div className={`flex justify-between items-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="text-lg">{t('sessionHistory.opened')}</span>
                <span className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{new Date(state.currentSession?.openingTime || '').toLocaleTimeString(localStorage.getItem('language') === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
              <div className={`border-t pt-4 flex justify-between items-center ${isDark ? 'border-slate-800/50' : 'border-slate-200'}`}>
                <span className={`text-xl font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('session.openingBalance')}</span>
                <span className="text-2xl font-bold text-indigo-500">{formatPrice(state.currentSession?.openingBalance || 0)}</span>
              </div>
            </div>

            <div>
              <p className={`text-lg font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('session.closeModal.actualBalance')}</p>
              <div className="relative" dir="ltr">
                <Input
                  type="number"
                  value={actualBalance}
                  onChange={(e) => setActualBalance(e.target.value)}
                  onFocus={() => clearError('actual_balance')}
                  className={`text-center text-4xl font-bold h-24 rounded-[1.5rem] pr-20 shadow-inner ${
                    errors.actual_balance 
                      ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-500' 
                      : isDark ? 'bg-slate-950/80 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="0"
                  autoFocus
                />
                <span className={`absolute right-6 top-1/2 -translate-y-1/2 font-bold text-2xl pointer-events-none ${errors.actual_balance ? 'text-red-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>{selectedCountry?.currency.display}</span>
              </div>
              {errors.actual_balance && (
                <p className="mt-2 text-sm font-bold text-red-500 text-center animate-shake">
                  {errors.actual_balance[0]}
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <Button variant="ghost" size="lg" className={`flex-1 h-16 rounded-[1.5rem] text-lg ${!isDark && 'border border-slate-200 bg-white'}`} onClick={onClose}>
                {t('session.closeModal.back')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 h-16 rounded-[1.5rem] text-lg font-bold shadow-lg"
                disabled={!actualBalance}
                onClick={() => setIsConfirming(true)}
              >
                <Calculator className="w-6 h-6 ml-3" />
                {t('session.closeModal.editBalance')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 text-center animate-slideDown">
            <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('session.closeModal.summary')}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t('session.closeModal.totalSales')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(totals.totalSales)}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t('session.closeModal.totalRefunds')}</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(totals.totalRefunds)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-base mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('session.closeModal.expectedBalance')}</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(totals.expectedBalance)}</p>
              </div>
              <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-950/50 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-base mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('sessionHistory.actualBalance')}</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPrice(actualAmount)}</p>
              </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] mb-8 ${difference === 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : difference > 0 ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className={`text-lg mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('session.closeModal.difference')}</p>
              <p className={`text-4xl font-bold ${difference === 0 ? 'text-emerald-500' : difference > 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                {difference > 0 ? '+' : ''}{formatPrice(difference)}
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="ghost" size="lg" className={`flex-1 h-16 rounded-[1.5rem] text-lg ${!isDark && 'border border-slate-200 bg-white'}`} onClick={() => setIsConfirming(false)}>
                {t('session.closeModal.editBalance')}
              </Button>
              <Button variant="danger" size="lg" className="flex-[2] h-16 rounded-[1.5rem] text-lg font-bold shadow-lg shadow-red-500/20" onClick={handleClose} disabled={isClosing}>
                {isClosing ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : t('session.closeModal.confirmClose')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
