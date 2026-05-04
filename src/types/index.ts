export interface Stage {
  id: number;
  name: string;
  color: string;
  type: string;
}

// ============ Product Types ============
export interface Product {
  id: string;
  vendorProductId: number;
  slug: string;
  name: string;

  nameAr?: string;
  barcode: string;
  sku: string;
  price: number;
  priceBeforeTaxes: number;
  priceBeforeDiscount?: number;
  points?: number;
  costPrice?: number;
  departmentName?: string;
  departmentId: number;
  category: string;
  categoryId: number;
  subcategory?: string;
  subcategoryId?: number | null;
  brandName?: string;
  image?: string;
  images?: string[];
  stock: number;
  unit: string;
  taxRate: number; // percentage
  isActive: boolean;
  updatedAt: string;
  selections?: string[];
  variantTree?: string;
  stage?: Stage;
}


export interface Department {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  departmentId: number;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
}


// ============ Cart Types ============
export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // percentage
  discountAmount: number; // absolute
  lineTotal: number;
  lineTax: number;
}

// ============ Order Types ============
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type OrderStatus = 'completed' | 'refunded' | 'partial_refund' | 'voided';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  payments: PaymentSplit[];
  cashReceived?: number;
  changeGiven?: number;
  status: OrderStatus;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  stage?: Stage;
  createdAt: string;
  syncedAt?: string;
  refundedFrom?: string;
  notes?: string;
}

// ============ Sync Types ============
export type SyncAction = 'create_order' | 'refund_order' | 'update_stock';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  payload: unknown;
  createdAt: string;
  retries: number;
  lastError?: string;
}

// ============ API Types ============
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ============ Settings Types ============
export interface POSSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  currency: string;
  currencySymbol: string;
  receiptFooter: string;
  printerEnabled: boolean;
  cashDrawerEnabled: boolean;
  offlineMode: boolean;
}

// ============ Cashier & Session Types ============
export interface Cashier {
  id: string;
  name: string;
  pin: string;
  role: 'cashier' | 'manager' | 'admin';
}

export interface CashierSession {
  id: string;
  cashierId: string;
  cashierName: string;
  openingTime: string;
  openingBalance: number;
  closingTime?: string;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: 'open' | 'closed';
  totalSales?: number;
  totalRefunds?: number;
  terminalCode?: string;
}
