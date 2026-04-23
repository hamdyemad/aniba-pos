import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '@/services/productService';

import type { Product } from '@/types';

/**
 * Hook for barcode scanner input detection.
 * Barcode scanners act as keyboard input — they type characters rapidly and end with Enter.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && bufferRef.current.length >= 4) {
        onScan(bufferRef.current);
        bufferRef.current = '';
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset buffer after 100ms of inactivity (scanner is faster than typing)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}

/**
 * Hook for product search with debounce
 */
export function useProductSearch(filters?: { 
  departmentId?: number | 'all', 
  categoryId?: number | 'all', 
  subcategoryId?: number | 'all' 
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  // Load initial products
  useEffect(() => {
    const loadInitial = async () => {
      setIsLoading(true);
      // When filters change, we don't call initialize (which is for boot), 
      // instead we fetch directly from API
      const result = await productService.fetchProductsFromApi(
        1, 
        filters?.departmentId, 
        filters?.categoryId, 
        filters?.subcategoryId
      );
      setAllProducts(result.data);
      setResults(result.data);
      setIsLoading(false);
      setPage(1); 
      setHasMore(result.hasMore);
    };
    loadInitial();
  }, [filters?.departmentId, filters?.categoryId, filters?.subcategoryId]);

  const loadMore = useCallback(async () => {
    if (isMoreLoading || !hasMore || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsMoreLoading(true);
    try {
      const nextPage = page + 1;
      const result = await productService.fetchProductsFromApi(
        nextPage,
        filters?.departmentId,
        filters?.categoryId,
        filters?.subcategoryId,
        query.trim()
      );
      const newProducts = result.data;
      
      if (newProducts.length > 0) {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        });
        if (!query.trim()) {
          setResults(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
            return [...prev, ...uniqueNew];
          });
        }
        setPage(nextPage);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more products:', error);
    } finally {
      setIsMoreLoading(false);
      isFetchingRef.current = false;
    }
  }, [page, isMoreLoading, hasMore, query, filters?.departmentId, filters?.categoryId, filters?.subcategoryId]);


  const search = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const result = await productService.fetchProductsFromApi(
            1,
            filters?.departmentId,
            filters?.categoryId,
            filters?.subcategoryId,
            searchQuery.trim()
          );
          setResults(result.data);
          setPage(1);
          setHasMore(result.hasMore);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [filters?.departmentId, filters?.categoryId, filters?.subcategoryId]
  );

  const refresh = useCallback(async () => {
    const products = await productService.getAll();
    setAllProducts(products);
    setResults(products);
  }, []);

  return { query, search, results, isLoading, isMoreLoading, hasMore, loadMore, allProducts, refresh };
}


/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
