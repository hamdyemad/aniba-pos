import { openDB, type IDBPDatabase } from 'idb';
import type { Product, Order, SyncQueueItem } from '@/types';

const DB_NAME = 'pos_cashier_db';
const DB_VERSION = 1;

export interface POSDatabase {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-barcode': string; 'by-name': string; 'by-category': string };
  };
  orders: {
    key: string;
    value: Order;
    indexes: { 'by-date': string; 'by-status': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-date': string };
  };
}

let dbInstance: IDBPDatabase<POSDatabase> | null = null;

async function getDB(): Promise<IDBPDatabase<POSDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('by-barcode', 'barcode', { unique: true });
        productStore.createIndex('by-name', 'name', { unique: false });
        productStore.createIndex('by-category', 'category', { unique: false });
      }

      // Orders store
      if (!db.objectStoreNames.contains('orders')) {
        const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
        orderStore.createIndex('by-date', 'createdAt', { unique: false });
        orderStore.createIndex('by-status', 'status', { unique: false });
      }

      // Sync Queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-date', 'createdAt', { unique: false });
      }
    },
  });

  return dbInstance;
}

// ============ Products ============
export const productDB = {
  async getAll(): Promise<Product[]> {
    const db = await getDB();
    return db.getAll('products');
  },

  async getByBarcode(barcode: string): Promise<Product | undefined> {
    const db = await getDB();
    return db.getFromIndex('products', 'by-barcode', barcode);
  },

  async getById(id: string): Promise<Product | undefined> {
    const db = await getDB();
    return db.get('products', id);
  },

  async search(query: string): Promise<Product[]> {
    const db = await getDB();
    const all = await db.getAll('products');
    const q = query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  },

  async bulkPut(products: Product[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    for (const product of products) {
      await tx.store.put(product);
    }
    await tx.done;
  },

  async updateStock(id: string, newStock: number): Promise<void> {
    const db = await getDB();
    const product = await db.get('products', id);
    if (product) {
      product.stock = newStock;
      await db.put('products', product);
    }
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count('products');
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('products');
  },
};


// ============ Orders ============
export const orderDB = {
  async getAll(): Promise<Order[]> {
    const db = await getDB();
    const orders = await db.getAll('orders');
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Order | undefined> {
    const db = await getDB();
    return db.get('orders', id);
  },

  async create(order: Order): Promise<void> {
    const db = await getDB();
    await db.put('orders', order);
  },

  async update(order: Order): Promise<void> {
    const db = await getDB();
    await db.put('orders', order);
  },

  async getToday(): Promise<Order[]> {
    const db = await getDB();
    const all = await db.getAll('orders');
    const today = new Date().toDateString();
    return all
      .filter((o) => new Date(o.createdAt).toDateString() === today)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count('orders');
  },
};

// ============ Sync Queue ============
export const syncQueueDB = {
  async add(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put('syncQueue', item);
  },

  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAll('syncQueue');
  },

  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('syncQueue', id);
  },

  async updateRetry(id: string, error: string): Promise<void> {
    const db = await getDB();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retries += 1;
      item.lastError = error;
      await db.put('syncQueue', item);
    }
  },

  async count(): Promise<number> {
    const db = await getDB();
    return db.count('syncQueue');
  },
};
