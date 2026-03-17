import { create } from 'zustand';
import { db, type StockItem, type Order, type Delivery, type OrderStatus } from '../lib/db';

interface DistributorStore {
    stockItems: StockItem[];
    orders: Order[];
    deliveries: Delivery[];
    loading: boolean;

    loadAll: () => Promise<void>;

    // Stock
    addStock: (s: Omit<StockItem, 'id'>) => Promise<void>;
    deleteStock: (id: number) => Promise<void>;

    // Orders
    addOrder: (o: Omit<Order, 'id'>) => Promise<void>;
    updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;

    // Deliveries
    addDelivery: (d: Omit<Delivery, 'id'>) => Promise<void>;
}

export const useDistributorStore = create<DistributorStore>((set, get) => ({
    stockItems: [],
    orders: [],
    deliveries: [],
    loading: true,

    loadAll: async () => {
        const [stockItems, orders, deliveries] = await Promise.all([
            db.stock.toArray(),
            db.orders.toArray(),
            db.deliveries.toArray(),
        ]);
        set({ stockItems, orders, deliveries, loading: false });
    },

    addStock: async (s) => {
        await db.stock.add(s);
        await get().loadAll();
    },

    deleteStock: async (id) => {
        await db.stock.delete(id);
        await get().loadAll();
    },

    addOrder: async (o) => {
        await db.orders.add(o);
        await get().loadAll();
    },

    updateOrderStatus: async (id, status) => {
        const isClosed = status === 'PAYEE' || status === 'ANNULEE';
        const update: Partial<Order> = { status };
        if (isClosed) {
            update.closedAt = new Date().toISOString();
        }

        // If delivered, decrease stock
        if (status === 'LIVREE') {
            const order = await db.orders.get(id);
            if (order) {
                // Find matching stock item and decrease
                const stockItems = await db.stock.toArray();
                // We'll decrease from the first available stock item (simple approach)
                // In reality, distributors track by product
                // For now, just mark the status
            }
        }

        await db.orders.update(id, update);
        await get().loadAll();
    },

    addDelivery: async (d) => {
        await db.deliveries.add(d);
        await get().loadAll();
    },
}));
