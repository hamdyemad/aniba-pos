import { useState, useEffect, useMemo } from 'react';
import { X, Minus, Plus, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { productService } from '@/services/productService';
import { PriceDisplay } from '@/components/atoms/PriceDisplay';
import { Button } from '@/components/atoms/Button';
import type { ApiDetailedProduct, ApiConfigNode, ApiVariant } from '@/types/api';

interface ProductDetailsModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, variant?: ApiVariant, quantity?: number) => void;
}

export function ProductDetailsModal({ slug, isOpen, onClose, onAddToCart }: ProductDetailsModalProps) {
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState<ApiDetailedProduct | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState(1);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && slug) {
      const fetchDetails = async () => {
        setLoading(true);
        const data = await productService.getProductBySlug(slug);
        setProductData(data);
        setActiveImage(data?.vendors[0]?.vendor_product?.image || null);
        setLoading(false);
      };
      fetchDetails();
    }
  }, [isOpen, slug]);

  const vendorProduct = productData?.vendors[0]?.vendor_product;
  const configTree = vendorProduct?.configuration_tree || [];
  const productImages: string[] = [];

  // Auto-select logic for single options
  useEffect(() => {
    if (!configTree.length) return;

    let currentNodes: ApiConfigNode[] | undefined = configTree;
    const newSelections = { ...selectedOptions };
    let changed = false;

    while (currentNodes && currentNodes.length > 0) {
      const keyNode: ApiConfigNode = currentNodes[0];
      if (!keyNode) break;

      // If we don't have a selection for this level yet
      if (!newSelections[keyNode.id]) {
        // If there's only one child option at this level, auto-select it
        if (keyNode.children && keyNode.children.length === 1) {
          const onlyOption: ApiConfigNode = keyNode.children[0];
          newSelections[keyNode.id] = onlyOption.id;
          changed = true;
          
          // Move to next level if any
          currentNodes = onlyOption.children;
          continue;
        } else {
          // More than one option or zero, stop auto-selecting
          break;
        }
      } else {
        // Selection exists, move to next level
        const selectedOptionId = newSelections[keyNode.id];
        const selectedOptionNode = keyNode.children?.find((o: ApiConfigNode) => o.id === selectedOptionId);
        currentNodes = selectedOptionNode?.children;
      }
    }

    if (changed) {
      setSelectedOptions(newSelections);
    }
  }, [configTree, selectedOptions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  // Helper to find the current variant based on selections
  const currentVariant = useMemo(() => {
    if (!configTree.length) return null;

    let currentLevelNodes: ApiConfigNode[] | undefined = configTree;
    let lastVariant: ApiVariant | null = null;

    while (currentLevelNodes && currentLevelNodes.length > 0) {
      const keyNode: ApiConfigNode = currentLevelNodes[0];
      if (!keyNode || keyNode.type !== 'key') break;

      const selectedOptionId = selectedOptions[keyNode.id];
      if (!selectedOptionId) return null;

      const optionNode: ApiConfigNode | undefined = keyNode.children?.find((o: ApiConfigNode) => o.id === selectedOptionId);
      if (!optionNode) return null;

      if (optionNode.variant) {
        lastVariant = optionNode.variant;
        break;
      }

      currentLevelNodes = optionNode.children;
    }

    return lastVariant;
  }, [configTree, selectedOptions]);

  // Helper to get selected option labels
  const selectedLabels = useMemo(() => {
    const labels: string[] = [];
    if (!configTree.length) return labels;

    let currentLevelNodes: ApiConfigNode[] | undefined = configTree;
    while (currentLevelNodes && currentLevelNodes.length > 0) {
      const keyNode: ApiConfigNode = currentLevelNodes[0];
      if (!keyNode) break;

      const selectedOptionId = selectedOptions[keyNode.id];
      if (selectedOptionId) {
        const optionNode: ApiConfigNode | undefined = keyNode.children?.find((o: ApiConfigNode) => o.id === selectedOptionId);
        if (optionNode) {
          labels.push(`${keyNode.name}: ${optionNode.name}`);
          currentLevelNodes = optionNode.children;
          continue;
        }
      }
      break;
    }
    return labels;
  }, [configTree, selectedOptions]);

  const handleOptionSelect = (keyId: number, optionId: number) => {
    const newSelections: Record<number, number> = {};
    let currentNodes: ApiConfigNode[] | undefined = configTree;
    
    while (currentNodes && currentNodes.length > 0) {
      const kNode: ApiConfigNode = currentNodes[0];
      if (!kNode) break;
      
      if (kNode.id === keyId) {
        newSelections[kNode.id] = optionId;
        break; // Stop here, subsequent selections are cleared
      }
      
      const sId = selectedOptions[kNode.id];
      if (sId) {
        newSelections[kNode.id] = sId;
        const oNode: ApiConfigNode | undefined = kNode.children?.find((o: ApiConfigNode) => o.id === sId);
        currentNodes = oNode?.children;
      } else {
        break;
      }
    }
    
    setSelectedOptions(newSelections);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal Content */}
      <div 
        dir={isRTL ? 'rtl' : 'ltr'}
        className="relative w-full max-w-6xl bg-[var(--bg-secondary)] rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-2xl animate-scaleIn flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh] th-bg-page"
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 sm:top-8 ${isRTL ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} p-2 rounded-full bg-[var(--bg-overlay)]/80 backdrop-blur-md hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all z-50 th-bg-btn th-text-muted`}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center h-[600px]">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : !productData ? (
          <div className="flex-1 p-12 text-center text-slate-400 th-text-secondary">
            {t('common.error')}
          </div>
        ) : (
          <>
            {/* Left Side: Image (alone at the top/left) */}
            <div className="w-full md:w-[45%] p-6 sm:p-12 flex flex-col gap-6 sm:gap-8 bg-[var(--bg-overlay)] th-bg-overlay items-center justify-center">
              <div 
                className="relative aspect-square w-full max-w-[450px] rounded-2xl sm:rounded-[3rem] overflow-hidden bg-[var(--bg-card)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center group cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setIsImageViewerOpen(true)}
              >
                <img 
                  src={activeImage || vendorProduct?.image} 
                  alt={vendorProduct?.name}
                  className={`w-full h-full object-contain p-12 transition-transform duration-200 ${isHovering ? 'scale-[2.5]' : 'scale-100'}`}
                  style={isHovering ? {
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                  } : undefined}
                />
              </div>

              {/* Thumbnails Gallery */}
              {(() => {
                const allImages = [vendorProduct?.image, ...(productImages || [])].filter(Boolean) as string[];
                if (allImages.length <= 1) return null;
                
                return (
                  <div className="flex flex-wrap gap-4 justify-center">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all bg-[var(--bg-card)] p-2 shadow-sm ${
                          activeImage === img 
                            ? 'border-indigo-500 scale-110 shadow-lg' 
                            : 'border-[var(--border-color)] hover:border-indigo-300'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Content Side */}
            <div className="w-full md:w-[55%] p-6 sm:p-14 overflow-y-auto custom-scrollbar flex flex-col">
              <h1 className="text-2xl sm:text-5xl font-black text-[var(--text-primary)] mb-4 sm:mb-6 leading-[1.1] th-text">
                {vendorProduct?.name}
              </h1>
              
              <div className="mb-10 flex items-center justify-between">
                <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-overlay)] px-3 py-1.5 rounded-lg uppercase tracking-widest th-bg-overlay th-text-muted">
                  {t('pos.sku')}: {currentVariant?.sku || vendorProduct?.sku}
                </span>
                
                {/* Points moved here if needed or kept in card */}
                {vendorProduct?.points && (
                  <div className="px-3 py-1.5 bg-slate-900/40 text-amber-500 text-[10px] font-black rounded-xl border border-amber-500/20 flex items-center gap-2 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    {vendorProduct.points} {t('pos.points')}
                  </div>
                )}
              </div>

              {/* Price & Info Card (Badges moved inside) */}
              <div className="bg-[var(--bg-card)] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 mb-8 sm:mb-10 border border-[var(--border-color)] shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative th-bg-card th-border">
                {/* Badges moved inside the card at top */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--border-light)] pb-6 th-border">
                  <div className="px-3 py-1.5 bg-[var(--bg-overlay)] rounded-full flex items-center gap-2 th-bg-overlay">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider th-text-muted">{t('pos.department')}:</span>
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase th-text-secondary">🏰 {vendorProduct?.department.name}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[var(--bg-overlay)] rounded-full flex items-center gap-2 th-bg-overlay">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider th-text-muted">{t('pos.category')}:</span>
                    <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase th-text-secondary">🧱 {vendorProduct?.category.name}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-500/10 rounded-full flex items-center gap-2 border border-indigo-500/20">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{t('pos.brand')}:</span>
                    <span className="text-[9px] font-black text-indigo-400 uppercase">🏷️ {vendorProduct?.brand.title}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-500/10 rounded-full flex items-center gap-2 border border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{t('pos.featured')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Top Row: Price Label & Stock Badge */}
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] th-text-muted">{t('pos.priceForSelection')}</p>
                    <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center gap-2 border border-emerald-500/20 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {currentVariant?.remaining_stock || vendorProduct?.stock} {t('pos.units')} {t('pos.remaining')}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Actual Price & Discount */}
                  <div className="flex items-baseline gap-4">
                    <PriceDisplay 
                      price={parseFloat(currentVariant?.real_price || '0')} 
                      size="xl" 
                      className="text-indigo-500" 
                    />
                    {(() => {
                      const beforePrice = parseFloat(currentVariant?.fake_price || '0');
                      const afterPrice = parseFloat(currentVariant?.real_price || '0');
                      if (beforePrice > afterPrice) {
                        return (
                          <PriceDisplay 
                            price={beforePrice} 
                            size="md" 
                            className="text-[var(--text-muted)] line-through decoration-red-500/30 th-text-muted mb-1 opacity-60" 
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              {configTree.length > 0 && (
                <div className="space-y-10 mb-12">
                  {(() => {
                    const renderedLevels: React.JSX.Element[] = [];
                    let currentLevelNodes: ApiConfigNode[] | undefined = configTree;

                    while (currentLevelNodes && currentLevelNodes.length > 0) {
                      const keyNode: ApiConfigNode = currentLevelNodes[0]; 
                      if (!keyNode) break;

                      renderedLevels.push(
                        <div key={keyNode.id}>
                          <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 th-text-muted">
                            {keyNode.name}
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {keyNode.children?.map((option: ApiConfigNode) => (
                              <button
                                key={option.id}
                                onClick={() => handleOptionSelect(keyNode.id, option.id)}
                                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-3 ${
                                  selectedOptions[keyNode.id] === option.id
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/20'
                                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-indigo-200 th-bg-btn th-text-muted th-border'
                                }`}
                              >
                                {option.type === 'color' && option.color && (
                                  <span 
                                    className="w-4 h-4 rounded-full border border-white/20" 
                                    style={{ backgroundColor: option.color }} 
                                  />
                                )}
                                {option.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );

                      const selectedOptionId = selectedOptions[keyNode.id];
                      const selectedOptionNode: ApiConfigNode | undefined = keyNode.children?.find((o: ApiConfigNode) => o.id === selectedOptionId);
                      if (selectedOptionNode && selectedOptionNode.children) {
                        currentLevelNodes = selectedOptionNode.children;
                      } else {
                        break;
                      }
                    }
                    return renderedLevels;
                  })()}
                </div>
              )}

              {/* Authentic Box */}
              <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-[var(--bg-overlay)] rounded-2xl sm:rounded-[2rem] border border-[var(--border-color)] mb-8 sm:mb-12 th-bg-overlay th-border">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] p-3 flex items-center justify-center shadow-sm">
                  <img src={productData.vendors[0].vendor.logo} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 th-text-muted">{t('pos.authenticFrom')}</p>
                  <p className="text-lg font-black text-[var(--text-primary)] th-text">{productData.vendors[0].vendor.name}</p>
                </div>
                <div className="px-4 py-2 bg-amber-400/10 text-amber-500 rounded-xl flex items-center gap-2 border border-amber-400/20">
                  <span className="font-black text-sm">0</span>
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-[var(--border-color)] th-border">
                <div className="flex items-center bg-[var(--bg-overlay)] rounded-xl sm:rounded-2xl p-0.5 sm:p-1 th-bg-overlay">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all th-text-muted"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="w-10 text-center text-lg sm:text-xl font-black text-[var(--text-primary)] th-text">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all th-text-muted"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
 
                <Button
                  className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black shadow-xl shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:grayscale disabled:opacity-50"
                  disabled={configTree.length > 0 && !currentVariant}
                  onClick={() => {
                    if (!vendorProduct) return;
                    const productToCart = {
                      id: vendorProduct.id.toString(),
                      name: vendorProduct.name,
                      sku: vendorProduct.sku,
                      price: 0,
                      stock: vendorProduct.stock,
                      image: vendorProduct.image,
                      taxRate: 15,
                      isActive: true,
                      selections: selectedLabels
                    } as any;
                    onAddToCart(productToCart, currentVariant || undefined, quantity);
                  }}
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-base sm:text-lg">{t('pos.pay')} {t('pos.cart')}</span>
                </Button>
 
                <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-100 transition-all th-border">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Full Screen Image Viewer Carousel */}
      {isImageViewerOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center animate-fadeIn p-4 sm:p-12">
          <button 
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-2xl z-50"
          >
            <X className="w-8 h-8" />
          </button>
          
          {(() => {
            const allImages = [vendorProduct?.image, ...(productImages || [])].filter(Boolean) as string[];
            const currentIndex = allImages.indexOf(activeImage || vendorProduct?.image || '');
            
            const goNext = (e: React.MouseEvent) => {
              e.stopPropagation();
              const nextIndex = (currentIndex + 1) % allImages.length;
              setActiveImage(allImages[nextIndex]);
            };

            const goPrev = (e: React.MouseEvent) => {
              e.stopPropagation();
              const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              setActiveImage(allImages[prevIndex]);
            };

            return (
              <div className="relative w-full h-full flex items-center justify-center group/viewer">
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={goPrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all z-50 border border-white/10 opacity-0 group-hover/viewer:opacity-100"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button 
                      onClick={goNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all z-50 border border-white/10 opacity-0 group-hover/viewer:opacity-100"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
                
                <img 
                  src={activeImage || vendorProduct?.image} 
                  alt={vendorProduct?.name}
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)] transition-all duration-500"
                />

                {/* Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/60 text-xs font-black tracking-widest">
                    {currentIndex + 1} / {allImages.length}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
