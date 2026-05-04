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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchLower) ||
      (order.customerName || '').toLowerCase().includes(searchLower) ||
      order.items.some(item => item.product.name.toLowerCase().includes(searchLower));

    if (filter === 'today') {
      const orderDate = new Date(order.createdAt);
      // Check if date is valid. If invalid (NaN), show it in Today to be safe in Arabic locale
      if (isNaN(orderDate.getTime())) return matchesSearch;

      const today = new Date();
      const isSameDay = 
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear();
        
      return matchesSearch && isSameDay;
    }
    return matchesSearch;
  });

  const handleRefund = async (orderId: string, productId?: string) => {
    const message = productId ? t('orders.refundItemConfirm') : t('orders.refundConfirm');
    if (confirm(message || (productId ? 'Are you sure you want to refund this item?' : 'Are you sure you want to refund this order?'))) {
      try {
        await orderService.refundOrder(orderId, productId ? [productId] : undefined);
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
    await hardwareService.printReceipt(
      order, 
      state.settings.storeName, 
      state.settings.storeAddress
    );
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
      try {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        const isSameDay = 
          orderDate.getDate() === today.getDate() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getFullYear() === today.getFullYear();
        return isCompleted && isSameDay;
      } catch {
        return false;
      }
    })
    .reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-2 sm:p-4" onMouseDown={onClose}>
      <div className={`border rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl animate-scaleIn ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="min-w-0">
            <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              <span className="truncate">{t('orders.title')}</span>
            </h2>
            <p className={`text-[10px] sm:text-sm mt-0.5 sm:mt-1 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('orders.todayTotal')} <span className="text-emerald-400 font-bold">{formatPrice(todayTotal)}</span>
              {' • '}{orders.length} {t('orders.ordersCount')}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl h-10 w-10 flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-3 sm:p-4 pb-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('orders.searchPlaceholder')}
              className={`w-full h-9 sm:h-10 border rounded-xl ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>
          <div className={`flex rounded-xl border overflow-hidden shrink-0 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <button
              onClick={() => setFilter('today')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                filter === 'today' ? 'bg-indigo-600 text-white' : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
              }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-bold text-indigo-400 truncate">
                          {order.orderNumber}
                        </p>
                        {order.stage ? (
                          <div 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 shrink-0"
                            style={{ backgroundColor: order.stage.color }}
                          >
                            {order.stage.name}
                          </div>
                        ) : (
                          <Badge variant={statusConfig[order.status].variant} size="sm">
                            {statusConfig[order.status].label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
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
                    {/* Customer Info */}
                    {(order.customerName || order.customerPhone) && (
                      <div className={`mb-4 p-3 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {t('checkout.customerInfo')}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {order.customerName && (
                            <div className="flex flex-col">
                              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('checkout.customerName')}</span>
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.customerName}</span>
                            </div>
                          )}
                          {order.customerPhone && (
                            <div className="flex flex-col">
                              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('checkout.customerPhone')}</span>
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`} dir="ltr">{order.customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-3"
                        >
                          {/* Item Image */}
                          <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                            {item.product.image ? (
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-slate-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                  {item.product.name}
                                </p>
                                {item.product.sku && (
                                  <p className="text-[10px] text-indigo-400 font-mono font-bold mt-0.5">
                                    {item.product.sku}
                                  </p>
                                )}
                              </div>
                              <span className={`text-sm font-bold shrink-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {formatPrice(item.lineTotal)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-end mt-1">
                              <div className="flex flex-col gap-0.5">
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {formatPrice(item.product.price)} × {item.quantity}
                                </p>
                                {item.product.variantTree && (
                                  <p className="text-[10px] text-emerald-400/80 font-medium leading-relaxed">
                                    {item.product.variantTree}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Item Refund Action */}
                          {order.status !== 'refunded' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefund(order.id, item.product.id);
                              }}
                              className={`h-8 gap-1.5 text-[10px] shrink-0 ${isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' : 'text-red-500 hover:text-red-600 hover:bg-red-50'}`}
                            >
                              <RotateCcw className="w-3 h-3" />
                              {t('orders.refund')}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Payment Info */}
                    <div className={`text-xs p-3 rounded-xl mb-4 ${isDark ? 'bg-slate-800/30 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>
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
                        </span>
                      </div>
                      {order.cashReceived && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>
                            {t('orders.paid')} {formatPrice(order.cashReceived)} • {t('orders.change')} {formatPrice(order.changeGiven || 0)}
                          </span>
                        </div>
                      )}
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