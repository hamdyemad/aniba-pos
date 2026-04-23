import { useRegion } from '@/hooks/useRegion';

interface PriceDisplayProps {
  price: number | string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function PriceDisplay({ price, className = '', size = 'md' }: PriceDisplayProps) {
  const { selectedCountry } = useRegion();
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  const isArabic = localStorage.getItem('language') === 'ar';
  
  const currencySymbol = selectedCountry?.currency.display || 'EGP';
  
  const sizeClasses = {
    xs: { wrapper: 'gap-0.5', symbol: 'text-[8px]', amount: 'text-[10px]' },
    sm: { wrapper: 'gap-1', symbol: 'text-[10px]', amount: 'text-sm' },
    md: { wrapper: 'gap-1', symbol: 'text-xs', amount: 'text-base' },
    lg: { wrapper: 'gap-1.5', symbol: 'text-sm', amount: 'text-2xl' },
    xl: { wrapper: 'gap-2', symbol: 'text-xl', amount: 'text-4xl sm:text-5xl' }
  };

  const currentSize = sizeClasses[size];

  return (
    <span className={`inline-flex items-baseline font-black leading-none ${currentSize.wrapper} ${className}`}>
      {isArabic ? (
        <>
          <span className={`${currentSize.amount}`}>{amount.toFixed(2)}</span>
          <span className={`${currentSize.symbol} text-indigo-500/80`}>{currencySymbol}</span>
        </>
      ) : (
        <>
          <span className={`${currentSize.symbol} text-indigo-500/80`}>{currencySymbol}</span>
          <span className={`${currentSize.amount}`}>{amount.toFixed(2)}</span>
        </>
      )}
    </span>
  );
}
