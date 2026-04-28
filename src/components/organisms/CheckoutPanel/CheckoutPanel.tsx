import { useState } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { Button } from '@/components/atoms/Button';
import { hardwareService } from '@/services/hardwareService';
import { useTranslation } from '@/hooks/useTranslation';
import {
  CreditCard,
  Banknote,
  Wallet,
  Percent,
  Receipt,
  X,
  Check,
  Calculator,
  UserCircle,
} from 'lucide-react';
import type { PaymentMethod, PaymentSplit } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import toast from 'react-hot-toast';
import { useRegion } from '@/hooks/useRegion';

interface CheckoutPanelProps {
  onClose: () => void;
}

export function CheckoutPanel({ onClose }: CheckoutPanelProps) {
  const { state, checkout, setGlobalDiscount, clearCart } = usePOS();
  const { formatPrice, selectedCountry } = useRegion();
  const { t } = useTranslation();
  useTheme();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(state.globalDiscount || ''));
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedChange, setCompletedChange] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = selectedMethod === 'cash' ? Math.max(0, cashAmount - state.grandTotal) : 0;
  const canPay = selectedMethod !== 'cash' || cashAmount >= state.grandTotal;

  const quickCashAmounts = [
    Math.ceil(state.grandTotal),
    Math.ceil(state.grandTotal / 10) * 10,
    Math.ceil(state.grandTotal / 50) * 50,
    Math.ceil(state.grandTotal / 100) * 100,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= state.grandTotal).slice(0, 4);

  const handleCheckout = async () => {
    try {
      const payments: PaymentSplit[] = [
        { method: selectedMethod, amount: state.grandTotal },
      ];

      const order = await checkout(
        payments,
        selectedMethod === 'cash' ? cashAmount : undefined,
        customerName || undefined,
        customerPhone || undefined
      );

      setCompletedChange(change);
      setIsCompleted(true);
      toast.success(t('checkout.invoiceSuccess'), { icon: '🧾' });

      // Auto-print receipt
      if (state.settings.printerEnabled) {
        await hardwareService.printReceipt(
          order,
          state.settings.storeName,
          state.settings.storeAddress
        );
      }

      // Open cash drawer
      if (state.settings.cashDrawerEnabled && selectedMethod === 'cash') {
        await hardwareService.openCashDrawer();
      }
    } catch {
      toast.error(t('checkout.invoiceError'));
    }
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setGlobalDiscount(val);
      setShowDiscount(false);
    }
  };

  const handleNumpadClick = (val: string) => {
    if (val === 'C') {
      setCashReceived('');
    } else if (val === '⌫') {
      setCashReceived((prev) => prev.slice(0, -1));
    } else if (val === '.') {
      if (!cashReceived.includes('.')) {
        setCashReceived((prev) => prev + '.');
      }
    } else {
      setCashReceived((prev) => prev + val);
    }
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-6" onMouseDown={onClose}>
        <div className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 text-center bg-[var(--bg-secondary)] border-[var(--border-color)] animate-scaleIn`} onMouseDown={(e) => e.stopPropagation()}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6 animate-bounceIn">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 text-[var(--text-primary)]`}>{t('checkout.successTitle')}</h2>
          <p className={`mb-2 text-[var(--text-muted)]`}>
            {t('checkout.invoiceNumber')} <span className="text-indigo-400 font-mono">{state.lastOrder?.orderNumber}</span>
          </p>
          <p className={`text-3xl font-bold mb-1 text-[var(--text-primary)]`}>
            {formatPrice(state.lastOrder?.grandTotal || 0)}
          </p>
          {completedChange > 0 && (
            <p className="text-lg text-emerald-400 font-medium mb-6">
              {t('checkout.change')} {formatPrice(completedChange)}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => {
                if (state.lastOrder) {
                  hardwareService.printReceipt(
                    state.lastOrder,
                    state.settings.storeName,
                    state.settings.storeAddress
                  );
                }
              }}
            >
              <Receipt className="w-5 h-5" />
              {t('checkout.print')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={onClose}
            >
              {t('checkout.newTransaction')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4" onMouseDown={onClose}>
      <div className={`border rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl bg-[var(--bg-secondary)] border-[var(--border-color)] animate-scaleIn`} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-light)]`}>
          <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]`}>
            <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
            {t('checkout.title')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-10 w-10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div className={`rounded-2xl p-4 space-y-2 bg-[var(--bg-overlay)] border border-[var(--border-color)]`}>
            <div className={`flex justify-between text-[var(--text-secondary)]`}>
              <span>{t('checkout.subtotal')}</span>
              <span>{formatPrice(state.subtotal)}</span>
            </div>
            {state.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>{t('checkout.discount')} {state.globalDiscount > 0 && `(${state.globalDiscount}%)`}</span>
                <span>-{formatPrice(state.discountTotal)}</span>
              </div>
            )}
            {state.taxTotal > 0 && (
              <div className={`flex justify-between text-[var(--text-secondary)]`}>
                <span>{t('checkout.taxVat')}</span>
                <span>{formatPrice(state.taxTotal)}</span>
              </div>
            )}
            <div className={`border-t pt-2 mt-2 border-[var(--border-color)]`}>
              <div className="flex justify-between items-center">
                <span className={`text-lg font-bold text-[var(--text-primary)]`}>{t('checkout.total')}</span>
                <span className="text-2xl font-bold text-indigo-400">
                  {formatPrice(state.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Toggle */}
          {showDiscount ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                className={`flex-1 h-12 border rounded-xl px-4 text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]`}
                placeholder={t('checkout.discountPlaceholder')}
                min="0"
                max="100"
                autoFocus
              />
              <Button variant="success" size="md" onClick={handleApplyDiscount}>
                {t('checkout.apply')}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setShowDiscount(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => setShowDiscount(true)}
            >
              <Percent className="w-4 h-4" />
              {t('checkout.discountOnInvoice')}
            </Button>
          )}

          {/* Payment Methods */}
          <div>
            <p className={`text-sm mb-3 font-medium text-[var(--text-secondary)]`}>{t('checkout.paymentMethod')}</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Button
                variant={selectedMethod === 'cash' ? 'cash' : 'ghost'}
                size="lg"
                onClick={() => setSelectedMethod('cash')}
                className="flex-col gap-1 h-16 sm:h-20 p-1 sm:p-4"
              >
                <Banknote className="w-5 h-5 sm:w-7 sm:h-7" />
                <span className="text-[10px] sm:text-sm">{t('checkout.cash')}</span>
              </Button>
              <Button
                variant={selectedMethod === 'card' ? 'card' : 'ghost'}
                size="lg"
                onClick={() => setSelectedMethod('card')}
                className="flex-col gap-1 h-16 sm:h-20 p-1 sm:p-4"
              >
                <CreditCard className="w-5 h-5 sm:w-7 sm:h-7" />
                <span className="text-[10px] sm:text-sm">{t('checkout.card')}</span>
              </Button>
              <Button
                variant={selectedMethod === 'wallet' ? 'wallet' : 'ghost'}
                size="lg"
                onClick={() => setSelectedMethod('wallet')}
                className="flex-col gap-1 h-16 sm:h-20 p-1 sm:p-4"
              >
                <Wallet className="w-5 h-5 sm:w-7 sm:h-7" />
                <span className="text-[10px] sm:text-sm">{t('checkout.wallet')}</span>
              </Button>
            </div>
          </div>

          {/* Customer Info (Optional) */}
          <div>
            <p className={`text-sm mb-3 font-medium flex items-center gap-2 text-[var(--text-secondary)]`}>
              <UserCircle className="w-4 h-4" />
              {t('checkout.customerInfo')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]`}
                placeholder={t('checkout.customerName')}
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`h-11 border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]`}
                placeholder={t('checkout.customerPhone')}
                dir="ltr"
              />
            </div>
          </div>

          {/* Cash Numpad */}
          {selectedMethod === 'cash' && (
            <div>
              <p className={`text-sm mb-3 font-medium text-[var(--text-secondary)]`}>{t('checkout.amountPaid')}</p>
              
              {/* Cash Display */}
              <div dir="ltr" className={`border rounded-2xl p-3 sm:p-4 mb-3 text-center bg-[var(--bg-overlay)] border-[var(--border-color)]`}>
                <p className={`text-2xl sm:text-3xl font-bold font-mono text-[var(--text-primary)]`}>
                  <span className={`text-base sm:text-lg mr-2 text-[var(--text-muted)]`}>
                    {selectedCountry?.currency.display || 'ج.م'}
                  </span>
                  {cashReceived || '0'}
                </p>
                {cashAmount >= state.grandTotal && (
                  <p className="text-emerald-400 text-base sm:text-lg mt-1 font-medium">
                    {t('checkout.change')} {formatPrice(change)}
                  </p>
                )}
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {quickCashAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="ghost"
                    size="md"
                    className="text-sm"
                    onClick={() => setCashReceived(String(amount))}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              {/* Numpad */}
              <div dir="ltr" className="grid grid-cols-3 gap-2">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map((key) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="lg"
                    className="text-lg sm:text-xl font-mono h-12 sm:h-16"
                    onClick={() => handleNumpadClick(key)}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              size="lg"
              className="flex-none px-6 h-12 sm:h-14"
              onClick={() => {
                clearCart();
                onClose();
              }}
            >
              {t('checkout.cancelInvoice')}
            </Button>
            <Button
              variant="success"
              size="lg"
              className="flex-1 h-12 sm:h-14 font-bold"
              onClick={handleCheckout}
              disabled={state.isProcessing || !canPay || state.cart.length === 0}
              isLoading={state.isProcessing}
            >
              <Receipt className="w-5 h-5" />
              <span className="truncate">{t('checkout.confirmPay')} — {formatPrice(state.grandTotal)}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
