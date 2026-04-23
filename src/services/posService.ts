import { orderDB, syncQueueDB } from '@/db';
import type { Order, SyncQueueItem, CartItem } from '@/types';
import { generateId } from '@/utils/formatters';
import { productService } from './productService';
import api from './api';

/**
 * Order Service - handles order creation, refunds, and sync
 */
export const orderService = {
  async createOrder(order: Order): Promise<Order> {
    await orderDB.create(order);

    // Update stock for each item
    for (const item of order.items) {
      await productService.updateStock(item.product.id, item.quantity);
    }

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: generateId(),
      action: 'create_order',
      payload: order,
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    await syncQueueDB.add(syncItem);

    return order;
  },

  async checkoutToApi(
    cart: CartItem[],
    paymentMethod: string,
    cashReceived?: number,
    changeGiven?: number,
    customerName?: string,
    customerPhone?: string
  ): Promise<any> {
    const products = cart.map(item => ({
      vendor_product_id: item.product.vendorProductId,
      vendor_product_variant_id: parseInt(item.product.id),
      quantity: item.quantity,
    }));

    const paymentTypeMap: Record<string, string> = {
      cash: 'cash',
      card: 'card',
      wallet: 'wallet',
    };

    const body: any = {
      products,
      payment_type: paymentTypeMap[paymentMethod] || 'cash',
    };

    if (paymentMethod === 'cash' && cashReceived !== undefined) {
      body.cash_received = cashReceived;
      body.change_given = changeGiven || 0;
    }

    if (customerName) body.customer_name = customerName;
    if (customerPhone) body.customer_phone = customerPhone;

    const response = await api.post('/pos/checkout', body);
    return response.data;
  },

  _getOrdersPromise: null as Promise<Order[]> | null,
  _lastSessionId: undefined as string | undefined,

  async getOrders(sessionId?: string): Promise<Order[]> {
    // If a request is already in flight for the same session, return it
    if (this._getOrdersPromise && this._lastSessionId === sessionId) {
      return this._getOrdersPromise;
    }

    this._lastSessionId = sessionId;
    this._getOrdersPromise = (async () => {
      try {
        const params: any = { per_page: 50 };
        if (sessionId) {
          params.session_id = sessionId;
        }
        const response = await api.get('/pos/orders', { params });
        if (response.data?.status && Array.isArray(response.data.data)) {
          return response.data.data.map((o: any) => ({
            id: o.id.toString(),
            orderNumber: o.order_number,
            items: (o.products || []).map((p: any) => ({
              product: {
                id: p.vendor_product_variant_id?.toString() || p.id.toString(),
                name: p.product?.name || 'Unknown',
                price: p.unit_price_after_taxes || p.total / p.quantity || 0,
              },
              quantity: p.quantity,
              lineTotal: p.total,
            })),
            subtotal: o.total_product_price,
            taxTotal: o.total_tax,
            discountTotal: o.total_discounts,
            grandTotal: o.total_price,
            payments: [
              {
                method: o.payment_type === 'cash_on_delivery' ? 'cash' : 'card',
                amount: o.total_price,
              },
            ],
            status: o.status === 'refunded' ? 'refunded' : 'completed',
            cashierId: o.cashier?.id?.toString() || '',
            cashierName: o.cashier?.name || '',
            createdAt: o.created_at,
          }));
        }
        return orderDB.getAll();
      } catch (error) {
        console.error('Failed to fetch from API, falling back to local DB', error);
        return orderDB.getAll();
      } finally {
        // Clear the promise cache after completion so subsequent requests can fetch fresh data
        setTimeout(() => {
          if (this._getOrdersPromise) {
             this._getOrdersPromise = null;
          }
        }, 500); // 500ms cache window to absorb concurrent duplicates
      }
    })();

    return this._getOrdersPromise;
  },

  async getTodayOrders(): Promise<Order[]> {
    return orderDB.getToday();
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    return orderDB.getById(id);
  },

  async refundOrder(orderId: string, refundItems?: string[]): Promise<Order | undefined> {
    const order = await orderDB.getById(orderId);
    if (!order) return undefined;

    const refundedOrder: Order = {
      ...order,
      status: refundItems ? 'partial_refund' : 'refunded',
    };

    await orderDB.update(refundedOrder);

    // Restore stock
    const itemsToRefund = refundItems
      ? order.items.filter((item) => refundItems.includes(item.product.id))
      : order.items;

    for (const item of itemsToRefund) {
      const product = await productService.getById(item.product.id);
      if (product) {
        await productService.updateStock(item.product.id, product.stock + item.quantity);
      }
    }

    // Add to sync queue
    const syncItem: SyncQueueItem = {
      id: generateId(),
      action: 'refund_order',
      payload: { orderId, refundItems },
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    await syncQueueDB.add(syncItem);

    return refundedOrder;
  },
};

/**
 * Sync Service - handles data synchronization with backend
 */
export const syncService = {
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return syncQueueDB.getAll();
  },

  async getSyncCount(): Promise<number> {
    return syncQueueDB.count();
  },

  async processSyncQueue(): Promise<{ success: number; failed: number }> {
    const queue = await syncQueueDB.getAll();
    let success = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        // In production, this would send to the actual API
        // await api.post(`/sync/${item.action}`, item.payload);
        console.log(`[Sync] Processing: ${item.action}`, item.payload);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 200));

        await syncQueueDB.remove(item.id);
        success++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await syncQueueDB.updateRetry(item.id, errorMessage);
        failed++;
      }
    }

    return { success, failed };
  },
};
