import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '@/services/productService';

import type { Product } from '@/types';

import scanSound from '@/assets/scan.mp3';

/**
 * Hook for barcode scanner input detection.
 * Barcode scanners act as keyboard input — they type characters rapidly and end with Enter.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-load audio
  useEffect(() => {
    audioRef.current = new Audio(scanSound);
    audioRef.current.load();
  }, []);

  const playBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
    }
  }, []);

  useEffect(() => {
    console.log('[ScannerHook] Mounted');
    
    // Audio unlock helper
    const unlockAudio = () => {
      console.log('[ScannerHook] Unlocking audio...');
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
          console.log('[ScannerHook] Audio unlocked successfully');
        }).catch((err) => console.warn('[ScannerHook] Audio unlock failed:', err));
      }
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    return () => {
      console.log('[ScannerHook] Unmounting');
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      // 1. SMART FOCUS: Redirect to search if typing while not in an input
      if (!isInput && e.key.length === 1 && /[a-zA-Z0-9-]/.test(e.key)) {
        const searchInput = document.getElementById('product-search-input') as HTMLInputElement;
        if (searchInput) {
          console.log('[ScannerHook] Auto-focusing search input');
          searchInput.focus();
        }
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;
      const isFast = timeDiff < 100; // Stricter for auto-trigger
      
      // 2. MANUAL TRIGGER: Enter key
      if (e.key === 'Enter') {
        const searchInput = document.getElementById('product-search-input') as HTMLInputElement;
        const potentialBarcode = bufferRef.current || (searchInput?.value || '');

        if (potentialBarcode.length >= 2) {
          console.log('[ScannerHook] Enter trigger:', potentialBarcode);
          if (activeElement?.id !== 'product-search-input') {
            e.preventDefault();
          }
          playBeep();
          onScan(potentialBarcode);
          bufferRef.current = '';
        }
        return;
      }

      // 3. CHARACTER CAPTURE
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      if (e.key.length === 1) {
        // If it's fast typing OR starting a new buffer
        if (isFast || bufferRef.current === '') {
          bufferRef.current += e.key;
        } else {
          // Slow human typing - just keep it simple
          bufferRef.current = e.key;
        }

        // 4. AUTO-TRIGGER (For scanners without Enter)
        // If it's been fast so far, set a timeout to "finalize" the scan if no more keys come
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length >= 4) { // Only auto-trigger for reasonable length
            console.log('[ScannerHook] Auto-trigger (timeout):', bufferRef.current);
            playBeep();
            onScan(bufferRef.current);
          }
          bufferRef.current = '';
        }, 200); // Wait 200ms for more characters
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.length >= 2) {
        console.log('[ScannerHook] Global Paste:', pastedText);
        playBeep();
        onScan(pastedText);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('paste', handlePaste, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('paste', handlePaste, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan, playBeep]);
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
