import { productDB } from '@/db';
import type { Product, Department, Category, Subcategory } from '@/types';
import type { 
  ProductsApiResponse, 
  ApiProduct, 
  DepartmentsApiResponse, 
  CategoriesApiResponse, 
  SubcategoriesApiResponse,
  ApiDetailedProduct,
  DetailedProductApiResponse 
} from '@/types/api';
import api from '@/services/api';

let productsPromise: Promise<void> | null = null;
const pendingPromises: Map<string, Promise<any>> = new Map();

/**
 * Product Service - handles product operations with offline-first approach
 */
export const productService = {
  clearCache(): void {
    productsPromise = null;
    pendingPromises.clear();
  },

  async initialize(): Promise<void> {
    if (productsPromise) return productsPromise;
    
    productsPromise = (async () => {
      // Fetch products from page 1 on initial load
      await this.fetchProductsFromApi(1);
    })();
    
    return productsPromise;
  },

  async getDepartments(page: number = 1): Promise<{ data: Department[], hasMore: boolean }> {
    const key = `depts-${page}`;
    if (pendingPromises.has(key)) return pendingPromises.get(key)!;

    const promise = (async () => {
      try {
        const response = await api.get<DepartmentsApiResponse>('/departments', {
          params: { page }
        });
        const data = response.data.data.map(d => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          icon: d.icon
        }));
        const hasMore = response.data.pagination 
          ? response.data.pagination.current_page < response.data.pagination.last_page
          : data.length > 0;
        return { data, hasMore };
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        return { data: [], hasMore: false };
      } finally {
        pendingPromises.delete(key);
      }
    })();

    pendingPromises.set(key, promise);
    return promise;
  },

  async getCategories(departmentId?: number): Promise<Category[]> {
    const key = `categories-${departmentId || 'all'}`;
    if (pendingPromises.has(key)) return pendingPromises.get(key)!;

    const promise = (async () => {
      try {
        const response = await api.get<CategoriesApiResponse>('/categories', {
          params: departmentId ? { department_id: departmentId } : {}
        });
        return response.data.data.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          departmentId: c.department.id
        }));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        return [];
      } finally {
        pendingPromises.delete(key);
      }
    })();

    pendingPromises.set(key, promise);
    return promise;
  },

  async getSubcategories(categoryId?: number): Promise<Subcategory[]> {
    const key = `subcategories-${categoryId || 'all'}`;
    if (pendingPromises.has(key)) return pendingPromises.get(key)!;

    const promise = (async () => {
      try {
        const response = await api.get<SubcategoriesApiResponse>('/subcategories', {
          params: categoryId ? { category_id: categoryId } : {}
        });
        return response.data.data.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          categoryId: s.parent.id
        }));
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
        return [];
      } finally {
        pendingPromises.delete(key);
      }
    })();

    pendingPromises.set(key, promise);
    return promise;
  },

  async fetchProductsFromApi(
    page: number = 1, 
    departmentId?: number | 'all',
    categoryId?: number | 'all',
    subcategoryId?: number | 'all',
    search?: string
  ): Promise<{ data: Product[], hasMore: boolean }> {
    const key = `products-${page}-${departmentId || 'all'}-${categoryId || 'all'}-${subcategoryId || 'all'}-${search || ''}`;
    if (pendingPromises.has(key)) return pendingPromises.get(key)!;

    const promise = (async () => {
      try {
        const params: any = { page };
        if (departmentId && departmentId !== 'all') params.department_id = departmentId;
        if (categoryId && categoryId !== 'all') params.category_id = categoryId;
        if (subcategoryId && subcategoryId !== 'all') params.sub_category_id = subcategoryId;
        if (search) params.search = search;

        const response = await api.get<ProductsApiResponse>('/products/variants', { params });
        if (response.data.status) {
          const mappedProducts: Product[] = response.data.data.map(item => this.mapApiProductToLocal(item));
          // If it's the first page, we clear to ensure fresh start
          if (page === 1) {
            await productDB.clear(); 
          }
          await productDB.bulkPut(mappedProducts);
          
          const hasMore = response.data.pagination 
            ? response.data.pagination.current_page < response.data.pagination.last_page
            : mappedProducts.length > 0;
            
          return { data: mappedProducts, hasMore };
        }
        return { data: [], hasMore: false };
      } catch (error) {
        console.error('Failed to fetch products from API:', error);
        throw error;
      } finally {
        pendingPromises.delete(key);
      }
    })();

    pendingPromises.set(key, promise);
    return promise;
  },


  mapApiProductToLocal(item: ApiProduct): Product {
    const realPrice = parseFloat(item.real_price);
    const priceBeforeTaxes = parseFloat(item.real_price_before_taxes || '0');
    
    // Calculate total tax rate from the taxes array, or fallback to difference logic
    let taxRate = 0;
    if (item.taxes && item.taxes.length > 0) {
      taxRate = item.taxes.reduce((sum, tax) => sum + (tax.is_active ? tax.percentage : 0), 0);
    } else {
      taxRate = priceBeforeTaxes > 0 
        ? Math.round(((realPrice - priceBeforeTaxes) / priceBeforeTaxes) * 100)
        : 15;
    }

    // Collect all available images: variant_images first, then main product image + additional images
    let images: string[] = [];
    if (item.variant_images && item.variant_images.length > 0) {
      images = item.variant_images;
    } else {
      if (item.vendor_product.image) images.push(item.vendor_product.image);
      if (item.vendor_product.additional_images && item.vendor_product.additional_images.length > 0) {
        images = [...images, ...item.vendor_product.additional_images];
      }
    }

    return {
      id: item.id.toString(),
      vendorProductId: item.vendor_product.id,
      slug: item.vendor_product.slug,
      name: `${item.vendor_product.name}${item.variant_name !== '--' ? ` (${item.variant_name})` : ''}`,
      nameAr: item.vendor_product.name,
      barcode: item.sku,
      sku: item.sku,
      price: realPrice,
      priceBeforeTaxes: priceBeforeTaxes,
      priceBeforeDiscount: item.fake_price ? parseFloat(item.fake_price) : 0,
      points: item.points,
      costPrice: priceBeforeTaxes,
      category: item.category.name,
      categoryId: item.category.id,
      departmentId: item.department.id,
      departmentName: item.department.name,
      subcategoryId: item.sub_category?.id || null,
      subcategory: item.sub_category?.name || '',
      brandName: item.brand?.title || '',
      image: item.vendor_product.image,
      images: images,
      stock: item.remaining_stock,
      unit: 'pcs', 
      taxRate: taxRate,
      isActive: true,
      selections: item.variant_tree ? item.variant_tree.split(' → ') : [],
      updatedAt: new Date().toISOString(),
    };
  },

  async getAll(): Promise<Product[]> {
    return productDB.getAll();
  },

  async searchProducts(query: string): Promise<Product[]> {
    if (!query.trim()) return productDB.getAll();
    return productDB.search(query);
  },

  async getByBarcode(barcode: string): Promise<Product | undefined> {
    return productDB.getByBarcode(barcode);
  },

  async getById(id: string): Promise<Product | undefined> {
    return productDB.getById(id);
  },

  async updateStock(productId: string, quantitySold: number): Promise<void> {
    const product = await productDB.getById(productId);
    if (product) {
      await productDB.updateStock(productId, product.stock - quantitySold);
    }
  },

  async getProductBySlug(slug: string): Promise<ApiDetailedProduct | null> {
    try {
      const response = await api.get<DetailedProductApiResponse>(`/products/product-by-slug/${slug}`);
      if (response.data.status) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch detailed product:', error);
      return null;
    }
  },
};

