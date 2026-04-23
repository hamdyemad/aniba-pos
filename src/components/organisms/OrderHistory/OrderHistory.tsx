import { useState, useEffect } from 'react';
import { Clock, Search, X, Receipt, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { usePOS } from '@/hooks/usePOS';
import { orderService } from '@/services/posService';
import { hardwareService } from '@/services/hardwareService';
import { formatDate } from '@/utils/formatters';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useRegion } from '@/hooks/useRegion';
import type { Order } from '@/types';
import toast from 'react-hot-toast';

interface OrderHistoryProps {
  onClose: () => void;
}

export function OrderHistory({ onClose }: OrderHistoryProps) {
  const { state } = usePOS();
  const { t, isRTL } = useTranslation();
  const { isDark } = useTheme();
  const { formatPrice } = useRegion();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'today'>('today');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    loadOrders();
  }, [state.currentSession?.id]);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, filter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getOrders(state.currentSession?.id);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error(t('orders.loadError') || 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      const orderDate = order.createdAt.split('T')[0].split(' ')[0];
      return matchesSearch && orderDate === today;
    }
    return matchesSearch;
  });

  const handleRefund = async (orderId: string) => {
    if (confirm(t('orders.refundConfirm'))) {
      try {
        await orderService.refundOrder(orderId);
        toast.success(t('orders.refundSuccess'));
        loadOrders();
      } catch (error) {
        toast.error(t('orders.refundError'));
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < filteredOrders.length) {
        setVisibleCount((prev) => prev + 10);
      }
    }
  };

  const handlePrint = async (order: Order) => {
    await hardwareService.printReceipt(order, 'QuickMart POS', 'Cairo, Egypt');
  };

  const statusConfig = {
    completed: { label: t('orders.status.completed'), variant: 'success' as const },
    refunded: { label: t('orders.status.refunded'), variant: 'danger' as const },
    partial_refund: { label: t('orders.status.partial_refund'), variant: 'warning' as const },
    voided: { label: t('orders.status.voided'), variant: 'danger' as const },
  };

  const todayTotal = orders
    .filter((o) => {
      const isCompleted = o.status === 'completed';
      const orderDate = o.createdAt.split('T')[0].split(' ')[0];
      const today = new Date().toISOString().split('T')[0];
      return isCompleted && orderDate === today;
    })
    .reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4" onMouseDown={onClose}>
      <div className={`border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Clock className="w-6 h-6 text-indigo-400" />
              {t('orders.title')}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('orders.todayTotal')} <span className="text-emerald-400 font-bold">{formatPrice(todayTotal)}</span>
              {' • '}{orders.length} {t('orders.ordersCount')}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 pb-2 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('orders.searchPlaceholder')}
              className={`w-full h-10 border rounded-xl ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>
          <div className={`flex rounded-xl border overflow-hidden shrink-0 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                filter === 'today' ? 'bg-indigo-600 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-indigo-600 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              {t('common.all')}
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <Receipt className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-lg font-medium">{t('orders.noOrders')}</p>
            </div>
          ) : (
            filteredOrders.slice(0, visibleCount).map((order) => (
              <div
                key={order.id}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200'}`}
              >
                {/* Order Row */}
                <button
                  className={`w-full p-4 flex items-center justify-between cursor-pointer transition-colors text-right ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-mono font-bold text-indigo-400">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusConfig[order.status].variant} size="sm">
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatPrice(order.grandTotal)}
                    </span>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className={`px-4 pb-4 border-t pt-3 animate-slideDown ${isRTL ? 'text-right' : 'text-left'} ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between text-sm"
                        >
                          <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {item.product.name} × {item.quantity}
                          </span>
                          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatPrice(item.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Payment Info */}
                    <div className="text-xs text-slate-500 mb-3">
                      {t('orders.paid')}{' '}
                      {order.payments
                        .map(
                          (p) =>
                            `${
                              p.method === 'cash'
                                ? t('orders.paymentMethods.cash')
                                : p.method === 'card'
                                ? t('orders.paymentMethods.card')
                                : t('orders.paymentMethods.wallet')
                            } (${formatPrice(p.amount)})`
                        )
                        .join(' + ')}
                      {order.cashReceived &&
                        ` • ${t('orders.paid')} ${formatPrice(order.cashReceived)} • ${t('orders.change')} ${formatPrice(order.changeGiven || 0)}`}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrint(order)}
                        className="gap-2"
                      >
                        <Receipt className="w-4 h-4" />
                        {t('common.print')}
                      </Button>
                      {order.status === 'completed' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRefund(order.id)}
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('orders.refund')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}