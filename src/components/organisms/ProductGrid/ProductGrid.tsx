import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, Plus, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useProductSearch } from '@/hooks/useHardware';
import { usePOS } from '@/hooks/usePOS';
import { productService } from '@/services/productService';
import { Input } from '@/components/atoms/Input';
import { Badge } from '@/components/atoms/Badge';

import { PriceDisplay } from '@/components/atoms/PriceDisplay';
import type { Department, Category, Subcategory } from '@/types';


// Helper component for Product Card to handle local error state for images
function ProductCard({ 
  product, 
  onAddToCart, 
  t, 
  isRTL 
}: { 
  product: any; 
  onAddToCart: (p: any) => void; 
  t: any; 
  isRTL: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const images = product.images || (product.image ? [product.image] : []);
  const hasMultipleImages = images.length > 1;

  // Handle null/missing discount values
  const priceBefore = parseFloat(product.fake_price || product.price_before_taxes || product.priceBeforeDiscount || '0');
  const priceAfter = parseFloat(product.price || '0');
  const hasDiscount = priceBefore > priceAfter;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      onClick={() => product.stock > 0 && onAddToCart(product)}
      className={`group relative flex flex-col bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden transition-all duration-300 cursor-pointer ${
        product.stock <= 0 ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-[0.98]'
      } th-product-card`}
      role="button"
      tabIndex={product.stock > 0 ? 0 : -1}
      onKeyDown={(e) => {
        if (product.stock > 0 && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAddToCart(product);
        }
      }}
    >
      {/* Product Image Carousel */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--bg-overlay)] flex items-center justify-center">
        {images.length > 0 && !imageError ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={product.name} 
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            {hasMultipleImages && (
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {images.map((_: any, i: number) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-indigo-500 w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
            {hasMultipleImages && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Package className="w-12 h-12 text-[var(--text-muted)] opacity-20" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className={`p-4 flex-1 flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between mb-2.5 gap-2">
          {product.points > 0 ? (
            <div className="px-2 py-0.5 bg-amber-400/10 text-amber-500 text-[9px] font-black rounded-lg border border-amber-400/20 flex items-center gap-1 shrink-0 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current" />
              {product.points} {t('pos.points')}
            </div>
          ) : <div />}
          
          <Badge
            variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'}
            size="md"
            className="font-bold text-[11px] px-3 py-1 rounded-xl shadow-md shrink-0 uppercase tracking-tight"
          >
            {product.stock} {t('pos.units')}
          </Badge>
        </div>

        {/* Hierarchy Section */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.brandName && (
            <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-amber-500/10">
              🏷️ {product.brandName}
            </span>
          )}
          {product.departmentName && (
            <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-indigo-500/10">
              🏰 {product.departmentName}
            </span>
          )}
          {product.category && (
            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-emerald-500/10">
              🧱 {product.category}
            </span>
          )}
          {product.subcategory && (
            <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md uppercase tracking-tighter border border-blue-500/10">
              🌿 {product.subcategory}
            </span>
          )}
        </div>

        <div className="flex items-center justify-start mb-2">
          <span className="px-2.5 py-1 bg-[var(--bg-overlay)] text-[var(--text-muted)] text-[10px] font-bold rounded-lg border border-[var(--border-color)] uppercase tracking-wide shadow-sm" dir="ltr">
            SKU: {product.sku}
          </span>
        </div>

        <h3 className="text-sm font-bold text-[var(--text-primary)] th-text line-clamp-2 mb-1 leading-tight tracking-tight">
          {product.name}
        </h3>

        {/* Variant Tree */}
        {product.selections && product.selections.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.selections.map((sel: string, i: number) => (
              <span key={i} className="text-[9px] font-black bg-slate-500/5 text-slate-500/60 px-1.5 py-0.5 rounded border border-slate-500/10 uppercase tracking-tighter">
                {sel}
              </span>
            ))}
          </div>
        ) || (
          <div className="mb-4 h-5" /> // Spacer if no variants
        )}

        {/* Pricing & Stock */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[var(--border-color)] pt-4 th-border">
          <div className="flex flex-col gap-1">
            {hasDiscount && (
              <PriceDisplay 
                price={priceBefore} 
                size="xs" 
                className="text-[var(--text-muted)] line-through decoration-red-500/30 opacity-60" 
              />
            )}
            <PriceDisplay 
              price={priceAfter} 
              size="lg" 
              className="text-indigo-500" 
            />
            {product.taxRate > 0 && (
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                +{product.taxRate}% {t('pos.tax')}
              </span>
            )}
          </div>
          
          <div className="w-11 h-11 rounded-2xl bg-[var(--bg-overlay)] border border-[var(--border-color)] flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-200 shadow-sm active:scale-90">
            <Plus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Out of Stock Overlay */}
      {product.stock <= 0 && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
          <span className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl rotate-[-12deg] shadow-2xl">
            OUT OF STOCK
          </span>
        </div>
      )}
    </div>
  );
}

// Helper component for horizontal scrolling tabs with arrows
function ScrollContainer({ children, isRTL, onEndReached }: { children: React.ReactNode; isRTL: boolean; onEndReached?: () => void }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const isFetchingRef = React.useRef(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const absScrollLeft = Math.abs(scrollLeft);
      
      if (isRTL) {
        // In RTL, scrollLeft is usually 0 at far right and negative as you scroll left
        setShowRight(absScrollLeft > 10);
        setShowLeft(absScrollLeft < scrollWidth - clientWidth - 10);

        // Check if reached end (which is the left side in RTL)
        if (onEndReached && absScrollLeft >= scrollWidth - clientWidth - 100 && !isFetchingRef.current) {
          isFetchingRef.current = true;
          onEndReached();
          // Reset ref after a delay to allow for the new items to be rendered
          setTimeout(() => { isFetchingRef.current = false; }, 1000);
        }
      } else {
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 10);

        // Check if reached end (which is the right side in LTR)
        if (onEndReached && scrollLeft >= scrollWidth - clientWidth - 100 && !isFetchingRef.current) {
          isFetchingRef.current = true;
          onEndReached();
          setTimeout(() => { isFetchingRef.current = false; }, 1000);
        }
      }
    }
  }, [isRTL, onEndReached]);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, children]); // Re-check when children change

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/scroll px-8">
      {showLeft && (
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full shadow-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all animate-fadeIn cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 overflow-x-auto no-scrollbar py-2 flex-nowrap scroll-smooth"
      >
        {children}
      </div>

      {showRight && (
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full shadow-xl text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all animate-fadeIn cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ProductGrid() {
  const { addToCart } = usePOS();
  const { t, isRTL } = useTranslation();
  // Selection state
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');
  const [selectedCatId, setSelectedCatId] = useState<number | 'all'>('all');
  const [selectedSubId, setSelectedSubId] = useState<number | 'all'>('all');

  const { query, search, results, isLoading, isMoreLoading, loadMore, hasMore } = useProductSearch({
    departmentId: selectedDeptId,
    categoryId: selectedCatId,
    subcategoryId: selectedSubId
  });

  // Listen for barcode scans from POSPage
  useEffect(() => {
    const handleBarcodeScanned = (e: Event) => {
      const barcode = (e as CustomEvent).detail;
      if (barcode) {
        search(barcode);
      }
    };

    window.addEventListener('pos-barcode-scanned', handleBarcodeScanned);
    return () => window.removeEventListener('pos-barcode-scanned', handleBarcodeScanned);
  }, [search]);

  // State for hierarchical data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [deptPage, setDeptPage] = useState(1);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [hasMoreDepts, setHasMoreDepts] = useState(true);



  // Load hierarchical data
  useEffect(() => {
    const loadHierarchy = async () => {
      setIsDeptLoading(true);
      const [deptResult] = await Promise.all([
        productService.getDepartments(1),
      ]);
      setDepartments(deptResult.data);
      setDeptPage(1);
      setHasMoreDepts(deptResult.hasMore);
      setIsDeptLoading(false);
    };
    loadHierarchy();
  }, []);

  const loadMoreDepartments = useCallback(async () => {
    if (isDeptLoading || !hasMoreDepts) return;
    
    setIsDeptLoading(true);
    try {
      const nextPage = deptPage + 1;
      const result = await productService.getDepartments(nextPage);
      const newDepts = result.data;
      if (newDepts.length > 0) {
        setDepartments(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const uniqueNew = newDepts.filter(d => !existingIds.has(d.id));
          return [...prev, ...uniqueNew];
        });
        setDeptPage(nextPage);
      }
      setHasMoreDepts(result.hasMore);
    } catch (error) {
      console.error('Failed to load more departments:', error);
    } finally {
      setIsDeptLoading(false);
    }
  }, [deptPage, isDeptLoading, hasMoreDepts]);

  // Aliases for JSX compatibility
  const filteredCategories = categories;
  const filteredSubcategories = subcategories;


  // The API now handles filtering, so 'results' are already filtered
  const filteredProducts = results;

  // Reset lower levels when upper level changes
  const handleDeptChange = async (id: number | 'all') => {
    setSelectedDeptId(id);
    setSelectedCatId('all');
    setSelectedSubId('all');
    setCategories([]);
    setSubcategories([]);

    if (id !== 'all') {
      const cats = await productService.getCategories(id);
      setCategories(cats);
    }
  };

  const handleCatChange = async (id: number | 'all') => {
    setSelectedCatId(id);
    setSelectedSubId('all');
    setSubcategories([]);

    if (id !== 'all') {
      const subs = await productService.getSubcategories(id);
      setSubcategories(subs);
    }
  };

  const handleSubChange = (id: number | 'all') => {
    setSelectedSubId(id);
  };

  // Infinite Scroll Handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Trigger when 100px from the bottom
    const isNearBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    
    if (isNearBottom && !isLoading && !isMoreLoading) {
      loadMore();
    }
  };

  const handleAddToCartDirect = (product: any) => {
    addToCart(product, 1);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900/20 th-bg-page">
      {/* Search Bar */}
      <div className="p-3 sm:p-4 pb-2 sm:pb-3 shrink-0">
        <Input
          isSearch
          placeholder={t('orders.searchPlaceholder')}
          value={query}
          onChange={(e) => search(e.target.value)}
          className="h-12 sm:h-14 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-sm border-slate-700/50 th-bg-input"
          id="product-search-input"
        />
      </div>

      {/* Level 1: Departments (Main Tabs) */}
      <div className="px-3 sm:px-4 pb-2 shrink-0 border-b border-[var(--border-light)]">
        <ScrollContainer isRTL={isRTL} onEndReached={loadMoreDepartments}>
          <button
            onClick={() => handleDeptChange('all')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border shrink-0 ${
              selectedDeptId === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] th-bg-btn th-text-secondary th-border'
            }`}
          >
            {t('common.all')}
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => handleDeptChange(dept.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border shrink-0 ${
                selectedDeptId === dept.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] th-bg-btn th-text-secondary th-border'
              }`}
            >
              {dept.icon && <img src={dept.icon} alt="" className="w-5 h-5 object-contain" />}
              {dept.name}
            </button>
          ))}
        </ScrollContainer>
      </div>

      {/* Level 2: Categories (Sub-Tabs) */}
      {selectedDeptId !== 'all' && filteredCategories.length > 0 && (
        <div className="px-3 sm:px-4 pb-2 shrink-0 animate-slideDown bg-[var(--bg-secondary)]/40">
          <ScrollContainer isRTL={isRTL}>
            <button
              onClick={() => handleCatChange('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                selectedCatId === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] th-bg-btn th-text-muted'
              }`}
            >
              {t('common.all')}
            </button>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCatChange(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  selectedCatId === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] th-bg-btn th-text-muted'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </ScrollContainer>
        </div>
      )}

      {/* Level 3: Subcategories (Pills) */}
      {selectedCatId !== 'all' && filteredSubcategories.length > 0 && (
        <div className="px-3 sm:px-4 pb-2 shrink-0 animate-fadeIn">
          <ScrollContainer isRTL={isRTL}>
            {filteredSubcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubChange(selectedSubId === sub.id ? 'all' : sub.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border shrink-0 ${
                  selectedSubId === sub.id
                    ? 'bg-amber-500 text-slate-900 border-amber-400'
                    : 'bg-[var(--bg-overlay)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-indigo-400'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </ScrollContainer>
        </div>
      )}

      {/* Product Grid */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-4 pb-4 mt-2"
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Search className="w-12 h-12 mb-4 text-slate-700 opacity-20" />
            <p className="text-lg font-medium th-text-secondary">{t('orders.noOrders')}</p>
            <button 
              onClick={() => handleDeptChange('all')}
              className="mt-4 px-6 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-500/20 transition-all"
            >
              {t('pos.clearFilters')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCartDirect} 
                  t={t} 
                  isRTL={isRTL} 
                />
              ))}
            </div>

            {/* Load More Indicator */}
            {isMoreLoading && (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && results.length > 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)] animate-fadeIn">
                <div className="w-16 h-[1px] bg-[var(--border-color)] mb-4" />
                <p className="text-sm font-medium opacity-60 italic">{t('common.endOfResults') || 'End of results'}</p>
              </div>
            )}
          </>
        )}
      </div>


    </div>
  );
}