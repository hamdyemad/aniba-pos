import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/organisms/Header';
import { ProductGrid } from '@/components/organisms/ProductGrid';
import { CartPanel } from '@/components/organisms/CartPanel';
import { CheckoutPanel } from '@/components/organisms/CheckoutPanel';
import { OrderHistory } from '@/components/organisms/OrderHistory';
import { SessionCloseModal } from '@/components/organisms/SessionCloseModal/SessionCloseModal';
import { BalancesHistoryModal } from '@/components/organisms/BalancesHistoryModal/BalancesHistoryModal';
import { CurrentSessionModal } from '@/components/organisms/CurrentSessionModal/CurrentSessionModal';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { usePOS } from '@/hooks/usePOS';
import { useBarcodeScanner } from '@/hooks/useHardware';

import { productService } from '@/services/productService';
import { useRegion } from '@/hooks/useRegion';


import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHLY_TARGET = 50000; // Default monthly target in SAR

export function POSPage() {
  const { state, addToCart, clearCart, cartItemCount } = usePOS();
  const { formatPrice } = useRegion();
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSessionClose, setShowSessionClose] = useState(false);
  const [showBalancesHistory, setShowBalancesHistory] = useState(false);
  const [showCurrentSession, setShowCurrentSession] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(window.innerWidth >= 768);
  const [monthlyTotal] = useState(0);

  // Load monthly total from orders
  useEffect(() => {
    // Temporarily disabled fetching orders for monthly target 
    // to prevent continuous API calls on the home page.
  }, []);

  const targetPercent = Math.min(100, (monthlyTotal / MONTHLY_TARGET) * 100);
  const remaining = Math.max(0, MONTHLY_TARGET - monthlyTotal);

  // Barcode scanner handler
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      const product = await productService.getByBarcode(barcode);
      if (product) {
        addToCart(product);
        toast.success(`${t('pos.added')} ${product.name}`, { icon: '✅', duration: 1500 });
      } else {
        toast.error(`${t('pos.productNotFound')} ${barcode}`, { icon: '❌', duration: 2000 });
      }
    },
    [addToCart, t]
  );

  useBarcodeScanner(handleBarcodeScan);

  return (
    <div className={`h-[100dvh] flex flex-col overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900 th-bg-page'}`}>
      <Header
        onOpenHistory={() => setShowHistory(true)}
        onOpenSessionClose={() => setShowSessionClose(true)}
        onOpenBalancesHistory={() => setShowBalancesHistory(true)}
        onOpenCurrentSession={() => setShowCurrentSession(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          <ProductGrid />
        </div>

        {/* Cart Sidebar */}
        <aside
          className={`fixed top-16 bottom-0 ${isRTL ? 'left-0' : 'right-0'} z-40 md:relative md:inset-auto w-full sm:w-[380px] ${isDark ? 'bg-slate-900/95 md:bg-slate-900/60' : 'bg-white/95 md:bg-white/80'} backdrop-blur-3xl md:backdrop-blur-xl ${isRTL ? 'border-r' : 'border-l'} ${isDark ? 'border-slate-700/50' : 'border-slate-200'} flex flex-col shrink-0 transition-transform duration-300 ease-in-out th-bg-sidebar ${
            isCartOpen ? 'translate-x-0' : (isRTL ? '-translate-x-full md:translate-x-0 md:w-[60px]' : 'translate-x-full md:translate-x-0 md:w-[60px]')
          }`}
        >
          {/* Toggle */}
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className={`absolute ${isRTL ? '-right-4' : '-left-4'} top-1/2 -translate-y-1/2 w-8 h-16 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-md'} border ${isRTL ? 'rounded-r-xl' : 'rounded-l-xl'} hidden md:flex items-center justify-center ${isDark ? 'text-slate-400' : 'text-slate-500'} hover:text-indigo-400 transition-colors cursor-pointer`}
          >
            {isCartOpen ? (isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />) : (isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
          </button>

          <div className={`flex flex-col h-full ${!isCartOpen && 'md:hidden'}`}>
            {/* Cart Header */}
            <div className={`p-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pos.cart')}</h2>
                  {cartItemCount > 0 && (
                    <Badge variant="primary" size="sm">{cartItemCount}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {state.cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2">
                      <Trash2 className="w-4 h-4" />
                      {t('pos.clear')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setIsCartOpen(false)}
                    className="md:hidden h-8 w-8 p-0">
                    {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Monthly Target Progress */}
            <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('pos.monthlyTarget')}</span>
                </div>
                <span className="text-xs font-bold text-indigo-400">{targetPercent.toFixed(0)}%</span>
              </div>
              {/* Progress Bar */}
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    targetPercent >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : targetPercent >= 70
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      : targetPercent >= 40
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                      : 'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}
                  style={{ width: `${targetPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {formatPrice(monthlyTotal)} {t('pos.achieved')}
                </span>
                {targetPercent < 100 ? (
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {formatPrice(remaining)} {t('pos.remaining')}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {t('pos.targetReached')}
                  </span>
                )}
              </div>
            </div>

            {/* Cart Items */}
            <CartPanel />

            {/* Cart Footer */}
            {state.cart.length > 0 && (
              <div className={`border-t ${isDark ? 'border-slate-700/50 bg-slate-900/80' : 'border-slate-200 bg-white/80'} p-4 space-y-3`}>
                <div className="space-y-1.5">
                  <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span>{t('pos.subtotal')}</span>
                    <span>{formatPrice(state.subtotal)}</span>
                  </div>
                  {state.discountTotal > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>{t('pos.discount')}</span>
                      <span>-{formatPrice(state.discountTotal)}</span>
                    </div>
                  )}
                  {state.taxTotal > 0 && (
                    <div className={`flex justify-between text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>{t('pos.tax')}</span>
                      <span>{formatPrice(state.taxTotal)}</span>
                    </div>
                  )}
                  <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-2`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pos.total')}</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {formatPrice(state.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button variant="success" size="xl" className="w-full text-lg h-16 rounded-2xl"
                  onClick={() => setShowCheckout(true)}>
                  <CreditCard className="w-6 h-6" />
                  {t('pos.pay')} {formatPrice(state.grandTotal)}
                </Button>
              </div>
            )}
          </div>

          {/* Mini sidebar */}
          {!isCartOpen && (
            <div className="hidden md:flex flex-col items-center pt-6 gap-6">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-indigo-400" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">{cartItemCount}</span>
                )}
              </div>
              <div className={`h-px w-8 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
              <div className="flex flex-col gap-4">
                <button onClick={() => setShowCheckout(true)} className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 transition-colors hover:text-white cursor-pointer">
                  <CreditCard className="w-5 h-5" />
                </button>
                <button onClick={clearCart} className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 transition-colors hover:text-white cursor-pointer">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Floating Cart Button - Mobile */}
        {!isCartOpen && (
          <button onClick={() => setIsCartOpen(true)}
            className={`md:hidden fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} w-16 h-16 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center z-50 cursor-pointer`}>
            <div className="relative">
              <ShoppingCart className="w-8 h-8 text-white" />
              {cartItemCount > 0 && (
                <span className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-indigo-600`}>{cartItemCount}</span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Modals */}
      {showCheckout && <CheckoutPanel onClose={() => setShowCheckout(false)} />}
      {showHistory && <OrderHistory onClose={() => setShowHistory(false)} />}
      {showSessionClose && <SessionCloseModal onClose={() => setShowSessionClose(false)} />}
      {showBalancesHistory && <BalancesHistoryModal onClose={() => setShowBalancesHistory(false)} />}
      {showCurrentSession && <CurrentSessionModal onClose={() => setShowCurrentSession(false)} />}
    </div>
  );
}