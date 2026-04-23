import { usePOS } from '@/hooks/usePOS';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useTranslation } from '@/hooks/useTranslation';
import { Minus, Plus, Trash2, ShoppingCart, Percent } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { useRegion } from '@/hooks/useRegion';

export function CartPanel() {
  const { state, removeFromCart, updateQuantity, setItemDiscount } = usePOS();
  const { formatPrice } = useRegion();
  const { t } = useTranslation();
  useTheme();
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState('');

  const handleApplyDiscount = (productId: string) => {
    const val = parseFloat(discountValue);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setItemDiscount(productId, val);
    }
    setEditingDiscount(null);
    setDiscountValue('');
  };

  if (state.cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 bg-[var(--bg-overlay)]`}>
          <ShoppingCart className={`w-10 h-10 text-[var(--text-muted)]`} />
        </div>
        <p className={`text-lg font-medium text-[var(--text-secondary)]`}>{t('pos.cartEmpty')}</p>
        <p className={`text-sm mt-1 text-[var(--text-muted)]`}>{t('pos.cartEmptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
      <div className="space-y-2">
        {state.cart.map((item, index) => (
          <div
            key={item.product.id}
            className={`group border rounded-xl p-3 transition-all duration-200 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] shadow-sm`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Product Name & Price */}
            <div className="flex items-start gap-3 mb-3">
              {/* Product Image */}
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-overlay)] overflow-hidden shrink-0 border border-[var(--border-color)]">
                {item.product.images?.[0] || item.product.image ? (
                  <img src={item.product.images?.[0] || item.product.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[var(--text-primary)] th-text truncate">
                  {item.product.name}
                </h4>
                {/* SKU */}
                <div className="inline-block px-1.5 py-0.5 bg-indigo-500/5 text-indigo-400 text-[9px] font-black rounded border border-indigo-500/10 mt-1" dir="ltr">
                  SKU: {item.product.sku}
                </div>
                
                {/* Variant Selections */}
                {(item.product as any).selections && (item.product as any).selections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(item.product as any).selections.map((sel: string, i: number) => (
                      <span key={i} className="text-[9px] font-black bg-[var(--bg-overlay)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border-color)] uppercase">
                        {sel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-end shrink-0">
                <p className="text-sm font-black text-indigo-500">
                  {formatPrice(item.lineTotal)}
                </p>
                {item.product.taxRate > 0 && (
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                    +{item.product.taxRate}% {t('pos.tax')}
                  </p>
                )}
                {item.discount > 0 && (
                  <Badge variant="success" size="sm" className="mt-1">
                    -{item.discount}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center text-[var(--text-primary)] th-text font-bold text-sm">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {editingDiscount === item.product.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount(item.product.id)}
                      className={`w-14 h-8 border rounded-lg px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)]`}
                      placeholder="%"
                      min="0"
                      max="100"
                      autoFocus
                    />
                    <Button variant="success" size="icon" className="h-8 w-8 rounded-lg"
                      onClick={() => handleApplyDiscount(item.product.id)}>
                      ✓
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      setEditingDiscount(item.product.id);
                      setDiscountValue(String(item.discount || ''));
                    }}
                    title={t('pos.discount')}>
                    <Percent className="w-3.5 h-3.5" />
                  </Button>
                )}

                <Button variant="ghost" size="icon"
                  className="h-8 w-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                  onClick={() => removeFromCart(item.product.id)}
                  title={t('common.delete')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}