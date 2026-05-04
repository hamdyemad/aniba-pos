import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CartItem, Product, Order, PaymentSplit, POSSettings, Cashier, CashierSession } from '@/types';
import { generateId, generateOrderNumber } from '@/utils/formatters';
import { orderService } from '@/services/posService';
import api from '@/services/api';

// ============ State & Actions ============
interface POSState {
  cart: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  globalDiscount: number;
  isProcessing: boolean;
  lastOrder: Order | null;
  settings: POSSettings;
  currentUser: Cashier | null;
  currentSession: CashierSession | null;
  isInitializing: boolean;
}

const defaultSettings: POSSettings = {
  storeName: 'QuickMart POS',
  storeAddress: 'Cairo, Egypt',
  storePhone: '',
  taxEnabled: true,
  defaultTaxRate: 0.15,
  currency: 'SAR',
  currencySymbol: 'ر.س',
  receiptFooter: 'Thank you for shopping with us!',
  printerEnabled: false,
  cashDrawerEnabled: false,
  offlineMode: false,
};

const initialState: POSState = {
  cart: [],
  subtotal: 0,
  taxTotal: 0,
  discountTotal: 0,
  grandTotal: 0,
  globalDiscount: 0,
  isProcessing: false,
  lastOrder: null,
  settings: defaultSettings,
  currentUser: null,
  currentSession: null,
  isInitializing: true,
};

type POSAction =
  | { type: 'ADD_TO_CART'; product: Product; quantity?: number; variant?: any }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'SET_ITEM_DISCOUNT'; productId: string; discount: number }
  | { type: 'SET_GLOBAL_DISCOUNT'; discount: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_LAST_ORDER'; order: Order }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<POSSettings> }
  | { type: 'SET_USER'; user: Cashier | null }
  | { type: 'SET_SESSION'; session: CashierSession | null }
  | { type: 'SET_INITIALIZING'; isInitializing: boolean };

function calculateTotals(cart: CartItem[], globalDiscountPercentage: number = 0) {
  let itemDiscounts = 0;
  let totalInclusive = 0;

  cart.forEach(item => {
    const itemInclusivePrice = item.product.price * item.quantity;
    const itemDiscountAmt = itemInclusivePrice * ((item.discount || 0) / 100);
    const itemAfterDiscount = itemInclusivePrice - itemDiscountAmt;
    
    totalInclusive += itemAfterDiscount;
    itemDiscounts += itemDiscountAmt;
  });

  const globalDiscountAmt = totalInclusive * (globalDiscountPercentage / 100);
  const discountTotal = itemDiscounts + globalDiscountAmt;
  const grandTotal = Math.max(0, totalInclusive - globalDiscountAmt);

  let subtotal = 0;
  let taxTotal = 0;
  
  cart.forEach(item => {
    const itemInclusivePrice = item.product.price * item.quantity;
    const itemDiscountAmt = itemInclusivePrice * ((item.discount || 0) / 100);
    const itemAfterItemDiscount = itemInclusivePrice - itemDiscountAmt;
    const itemAfterGlobalDiscount = itemAfterItemDiscount * (1 - (globalDiscountPercentage / 100));
    
    const taxRate = item.product.taxRate || 0;
    const itemSubtotal = itemAfterGlobalDiscount / (1 + (taxRate / 100));
    const itemTax = itemAfterGlobalDiscount - itemSubtotal;
    
    subtotal += itemSubtotal;
    taxTotal += itemTax;
  });

  return { subtotal, taxTotal, discountTotal, grandTotal };
}

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const qtyToAdd = action.quantity || 1;
      const product = action.variant ? {
        ...action.product,
        id: `${action.product.id}-${action.variant.id}`, // Unique ID for variant
        sku: action.variant.sku,
        price: parseFloat(action.variant.real_price),
        stock: action.variant.remaining_stock,
        name: `${action.product.name} (${action.variant.sku})`
      } : action.product;

      const existingItem = state.cart.find((item) => item.product.id === product.id);
      let newCart;

      if (existingItem) {
        newCart = state.cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      } else {
        newCart = [...state.cart, { product: product, quantity: qtyToAdd, discount: 0, discountAmount: 0, lineTotal: product.price * qtyToAdd, lineTax: 0 }];
      }

      const totals = calculateTotals(newCart, state.globalDiscount);
      return { ...state, cart: newCart.map(item => ({ ...item, lineTotal: item.product.price * item.quantity })), ...totals };
    }


    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter(
        (item) => item.product.id !== action.productId
      );
      const totals = calculateTotals(newCart, state.globalDiscount);
      return { ...state, cart: newCart, ...totals };
    }

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        const newCart = state.cart.filter(
          (item) => item.product.id !== action.productId
        );
        const totals = calculateTotals(newCart, state.globalDiscount);
        return { ...state, cart: newCart, ...totals };
      }
      const newCart = state.cart.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
      const totals = calculateTotals(newCart, state.globalDiscount);
      return { ...state, cart: newCart, ...totals };
    }

    case 'SET_ITEM_DISCOUNT': {
      const newCart = state.cart.map((item) =>
        item.product.id === action.productId
          ? { ...item, discount: action.discount }
          : item
      );
      const totals = calculateTotals(newCart, state.globalDiscount);
      return { ...state, cart: newCart, ...totals };
    }

    case 'SET_GLOBAL_DISCOUNT': {
      const totals = calculateTotals(state.cart, action.discount);
      return { ...state, ...totals, globalDiscount: action.discount };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [], subtotal: 0, taxTotal: 0, discountTotal: 0, grandTotal: 0, globalDiscount: 0 };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.isProcessing };

    case 'SET_LAST_ORDER':
      return { ...state, lastOrder: action.order };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case 'SET_USER':
      return { ...state, currentUser: action.user };

    case 'SET_SESSION':
      return { ...state, currentSession: action.session };

    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.isInitializing };
      
    default:
      return state;
  }
}

// ============ Context ============
interface POSContextType {
  state: POSState;
  addToCart: (product: Product, quantity?: number, variant?: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  setGlobalDiscount: (discount: number) => void;
  clearCart: () => void;
  checkout: (payments: PaymentSplit[], cashReceived?: number, customerName?: string, customerPhone?: string) => Promise<Order>;
  cartItemCount: number;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  openSession: (openingBalance: number, terminalCode?: string) => Promise<void>;
  closeSession: (closingBalance: number, totals: { expectedBalance: number; difference: number; totalSales: number; totalRefunds: number }) => Promise<void>;
  checkCurrentSession: () => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// ============ Provider ============
export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pos_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved) as Partial<POSSettings>;
        dispatch({ type: 'UPDATE_SETTINGS', settings });
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const addToCart = useCallback((product: Product, quantity?: number, variant?: any) => {
    dispatch({ type: 'ADD_TO_CART', product, quantity, variant });
  }, []);


  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  }, []);

  const setItemDiscount = useCallback((productId: string, discount: number) => {
    dispatch({ type: 'SET_ITEM_DISCOUNT', productId, discount });
  }, []);

  const setGlobalDiscount = useCallback((discount: number) => {
    dispatch({ type: 'SET_GLOBAL_DISCOUNT', discount });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const checkout = useCallback(
    async (payments: PaymentSplit[], cashReceived?: number, customerName?: string, customerPhone?: string): Promise<Order> => {
      dispatch({ type: 'SET_PROCESSING', isProcessing: true });

      try {
        const changeGiven = cashReceived ? Math.max(0, cashReceived - state.grandTotal) : 0;
        const paymentMethod = payments[0]?.method || 'cash';

        // Try API checkout first
        let apiOrderNumber = '';
        let apiOrderId = '';
        try {
          const apiResponse = await orderService.checkoutToApi(
            state.cart,
            paymentMethod,
            cashReceived,
            changeGiven,
            customerName,
            customerPhone
          );
          if (apiResponse.status && apiResponse.data) {
            apiOrderNumber = apiResponse.data.order_number;
            apiOrderId = apiResponse.data.id?.toString() || '';
          }
        } catch (apiError) {
          console.warn('[Checkout] API checkout failed, saving locally for sync:', apiError);
        }

        const order: Order = {
          id: apiOrderId || generateId(),
          orderNumber: apiOrderNumber || generateOrderNumber(),
          items: [...state.cart],
          subtotal: state.subtotal,
          taxTotal: state.taxTotal,
          discountTotal: state.discountTotal,
          grandTotal: state.grandTotal,
          payments,
          cashReceived,
          changeGiven,
          status: 'completed',
          cashierId: state.currentUser?.id || 'cashier-001',
          cashierName: state.currentUser?.name || 'كاشير',
          createdAt: new Date().toISOString(),
          syncedAt: apiOrderId ? new Date().toISOString() : undefined,
        };

        await orderService.createOrder(order);

        dispatch({ type: 'SET_LAST_ORDER', order });
        dispatch({ type: 'CLEAR_CART' });

        return order;
      } finally {
        dispatch({ type: 'SET_PROCESSING', isProcessing: false });
      }
    },
    [state.cart, state.subtotal, state.taxTotal, state.discountTotal, state.grandTotal, state.currentUser]
  );

  const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Auth & Session methods
  const login = useCallback(async (pin: string) => {
    try {
      const response = await api.post('/pos/auth/login', { pin });
      if (response.data.status) {
        const { token, cashier } = response.data.data;
        const user: Cashier = { 
          id: cashier.id.toString(), 
          name: cashier.name, 
          pin: '',
          role: cashier.role.toLowerCase() as any 
        };
        dispatch({ type: 'SET_USER', user });
        localStorage.setItem('pos_user', JSON.stringify(user));
        localStorage.setItem('pos_token', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'SET_USER', user: null });
    dispatch({ type: 'SET_SESSION', session: null });
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_session');
    localStorage.removeItem('pos_token');
  }, []);

  const openSession = useCallback(async (openingBalance: number, terminalCode?: string) => {
    if (!state.currentUser) return;
    try {
      const response = await api.post('/pos/sessions/open', { 
        openingBalance,
        terminal_code: terminalCode 
      });
      if (response.data.status) {
        const data = response.data.data;
        const session: CashierSession = {
          id: data.id,
          cashierId: data.cashier?.id?.toString() || data.cashier_id?.toString() || state.currentUser.id,
          cashierName: state.currentUser.name,
          openingTime: data.opened_at,
          openingBalance: parseFloat(data.opening_balance),
          terminalCode: data.terminal?.terminal_code || data.terminal_code || terminalCode,
          status: 'open',
        };
        dispatch({ type: 'SET_SESSION', session });
        localStorage.setItem('pos_session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Failed to open session:', error);
      throw error;
    }
  }, [state.currentUser]);

  const closeSession = useCallback(async (actualBalance: number, totals: { expectedBalance: number; difference: number; totalSales: number; totalRefunds: number }) => {
    if (!state.currentSession) return;
    
    try {
      const response = await api.post('/pos/sessions/close', {
        sessionId: state.currentSession.id,
        actualBalance,
        expectedBalance: totals.expectedBalance,
        difference: totals.difference,
        totalSales: totals.totalSales,
        totalRefunds: totals.totalRefunds
      });

      if (response.data.status) {
        dispatch({ type: 'SET_SESSION', session: null });
        localStorage.removeItem('pos_session');
      }
    } catch (error) {
      console.error('Failed to close session:', error);
      throw error;
    }
  }, [state.currentSession]);

  const checkCurrentSession = useCallback(async () => {
    try {
      const response = await api.get('/pos/sessions/current');
      if (response.data.status && response.data.data) {
        const data = response.data.data;
        const session: CashierSession = {
          id: data.id,
          cashierId: data.cashier?.id?.toString() || data.cashier_id?.toString(),
          cashierName: (data.cashier?.name && data.cashier.name !== 'Unknown') ? data.cashier.name : (state.currentUser?.name || 'كاشير'),
          openingTime: data.opened_at,
          openingBalance: parseFloat(data.opening_balance),
          terminalCode: data.terminal?.terminal_code || data.terminal_code,
          totalSales: parseFloat(data.total_sales || 0),
          totalRefunds: parseFloat(data.total_refunds || 0),
          status: 'open',
        };
        dispatch({ type: 'SET_SESSION', session });
        localStorage.setItem('pos_session', JSON.stringify(session));
      } else {
        dispatch({ type: 'SET_SESSION', session: null });
        localStorage.removeItem('pos_session');
      }
    } catch (error) {
      console.error('Failed to check current session:', error);
    }
  }, [state.currentUser]);

  const hasCheckedSessionRef = useRef(false);
  
  // Load auth state on mount
  useEffect(() => {
    if (hasCheckedSessionRef.current) return;
    
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      hasCheckedSessionRef.current = true;
      const user = JSON.parse(savedUser);
      dispatch({ type: 'SET_USER', user });
      
      // Check server for current session after setting user
      const checkSession = async () => {
        try {
          const response = await api.get('/pos/sessions/current');
          if (response.data.status && response.data.data) {
            const data = response.data.data;
            const session: CashierSession = {
              id: data.id,
              cashierId: data.cashier?.id?.toString() || data.cashier_id?.toString(),
              cashierName: (data.cashier?.name && data.cashier.name !== 'Unknown') ? data.cashier.name : user.name,
              openingTime: data.opened_at,
              openingBalance: parseFloat(data.opening_balance),
              terminalCode: data.terminal?.terminal_code || data.terminal_code,
              totalSales: parseFloat(data.total_sales || 0),
              totalRefunds: parseFloat(data.total_refunds || 0),
              status: 'open',
            };
            dispatch({ type: 'SET_SESSION', session });
            localStorage.setItem('pos_session', JSON.stringify(session));
          } else {
            // No session on server, clear local if any
            dispatch({ type: 'SET_SESSION', session: null });
            localStorage.removeItem('pos_session');
          }
        } catch (error: any) {
          console.error('Initial session check failed:', error);
          
          // If there's no response at all (offline/network error), fallback to local
          if (!error.response) {
            const savedSession = localStorage.getItem('pos_session');
            if (savedSession) {
              dispatch({ type: 'SET_SESSION', session: JSON.parse(savedSession) });
            }
          } else {
            // Server responded with an error, clear local session to be safe
            dispatch({ type: 'SET_SESSION', session: null });
            localStorage.removeItem('pos_session');
          }
        } finally {
          dispatch({ type: 'SET_INITIALIZING', isInitializing: false });
        }
      };
      checkSession();
    } else {
      dispatch({ type: 'SET_INITIALIZING', isInitializing: false });
    }
  }, []);

  return (
    <POSContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        setItemDiscount,
        setGlobalDiscount,
        clearCart,
        checkout,
        cartItemCount,
        login,
        logout,
        openSession,
        closeSession,
        checkCurrentSession,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS(): POSContextType {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}