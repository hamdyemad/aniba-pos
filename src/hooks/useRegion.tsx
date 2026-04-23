import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import api from '@/services/api';
import type { ApiCountry } from '@/types/api';

interface RegionContextType {
  countries: ApiCountry[];
  selectedCountry: ApiCountry | null;
  setSelectedCountry: (country: ApiCountry) => void;
  isLoading: boolean;
  formatPrice: (price: number | string) => string;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [countries, setCountries] = useState<ApiCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<ApiCountry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchCountries = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      try {
        const response = await api.get('/area/countries');
        if (response.data.status) {
          const fetchedCountries = response.data.data;
          setCountries(fetchedCountries);
          
          // Check if there's a saved country code in localStorage
          const savedCode = localStorage.getItem('pos-country-code');
          let defaultCountry = null;

          if (savedCode) {
            defaultCountry = fetchedCountries.find((c: ApiCountry) => c.code === savedCode);
          }

          if (!defaultCountry) {
            // Otherwise use the one marked as default: 1
            defaultCountry = fetchedCountries.find((c: ApiCountry) => c.default === 1) || fetchedCountries[0];
          }

          if (defaultCountry) {
            handleSetSelectedCountry(defaultCountry);
          }
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const handleSetSelectedCountry = useCallback((country: ApiCountry) => {
    setSelectedCountry(country);
    localStorage.setItem('pos-country-code', country.code);
    // Update axios header
    api.defaults.headers.common['X-Country-Code'] = country.code;
  }, []);

  const formatPrice = useCallback((price: number | string) => {
    const amount = typeof price === 'string' ? parseFloat(price) : price;
    if (!selectedCountry) return amount.toFixed(2);
    
    const { currency } = selectedCountry;
    // For Arabic, we usually put the symbol after. For others, before.
    const isArabic = localStorage.getItem('language') === 'ar';
    
    return isArabic 
      ? `${amount.toFixed(2)} ${currency.display}`
      : `${currency.display} ${amount.toFixed(2)}`;
  }, [selectedCountry]);

  return (
    <RegionContext.Provider value={{ 
      countries, 
      selectedCountry, 
      setSelectedCountry: handleSetSelectedCountry, 
      isLoading,
      formatPrice
    }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}
