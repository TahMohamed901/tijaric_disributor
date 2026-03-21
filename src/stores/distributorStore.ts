import { create } from 'zustand';
import { db, type StockItem, type Order, type Delivery, type OrderStatus, type Cycle } from '../lib/db';

interface DistributorStore {
    stockItems: StockItem[];
    orders: Order[];
    deliveries: Delivery[];
    cycles: Cycle[];
    activeCycle: Cycle | null;
    loading: boolean;

    loadAll: () => Promise<void>;

    // Cycles
    startCycle: (initialStock: number) => Promise<void>;
    closeCycle: () => Promise<void>;
    resetCycle: () => Promise<void>;

    // Stock
    addStock: (s: Omit<StockItem, 'id'>) => Promise<void>;
    deleteStock: (id: number) => Promise<void>;

    // Orders
    addOrder: (o: Omit<Order, 'id' | 'cycleId'>, forcePartial?: boolean) => Promise<{ success: boolean; msg?: string; remaining?: number }>;
    updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;

    // Deliveries
    addDelivery: (d: Omit<Delivery, 'id'>) => Promise<void>;
}

export const useDistributorStore = create<DistributorStore>((set, get) => ({
    stockItems: [],
    orders: [],
    deliveries: [],
    cycles: [],
    activeCycle: null,
    loading: true,

    loadAll: async () => {
        const [stockItems, orders, deliveries, cycles] = await Promise.all([
            db.stock.toArray(),
            db.orders.toArray(),
            db.deliveries.toArray(),
            db.cycles.toArray(),
        ]);
        const activeCycle = cycles.find(c => c.status === 'ACTIVE') || null;
        set({ stockItems, orders, deliveries, cycles, activeCycle, loading: false });
    },

    startCycle: async (initialStock) => {
        const newCycle: Cycle = {
            initialStock,
            remainingStock: initialStock,
            startDate: new Date().toISOString(),
            status: 'ACTIVE',
        };
        await db.cycles.add(newCycle);
        await get().loadAll();
    },

    closeCycle: async () => {
        const { activeCycle } = get();
        if (activeCycle && activeCycle.id) {
            await db.cycles.update(activeCycle.id, {
                status: 'CLOSED',
                endDate: new Date().toISOString(),
            });
            await get().loadAll();
        }
    },

    resetCycle: async () => {
        // Supprimer uniquement les commandes terminées / non transférables
        const ordersToDelete = get().orders.filter(o => o.status === 'TERMINEE' && !o.transferable);
        for (const order of ordersToDelete) {
            if (order.id) await db.orders.delete(order.id);
        }
        await get().loadAll();
    },

    addStock: async (s) => {
        const { activeCycle } = get();
        await db.stock.add({ ...s, cycleId: activeCycle?.id });
        if (activeCycle && activeCycle.id) {
            await db.cycles.update(activeCycle.id, {
                remainingStock: activeCycle.remainingStock + s.quantity,
            });
        }
        await get().loadAll();
    },

    deleteStock: async (id) => {
        const item = await db.stock.get(id);
        await db.stock.delete(id);
        const { activeCycle } = get();
        if (item && activeCycle && activeCycle.id) {
            await db.cycles.update(activeCycle.id, {
                remainingStock: Math.max(0, activeCycle.remainingStock - item.quantity),
            });
        }
        await get().loadAll();
    },

    addOrder: async (o, forcePartial = false) => {
        const { activeCycle } = get();
        if (!activeCycle) return { success: false, msg: 'Aucun cycle actif' };

        let finalQuantity = o.quantity;
        let isPartial = false;

        if (o.quantity > activeCycle.remainingStock) {
            if (!forcePartial) {
                return { 
                    success: false, 
                    msg: `Stock insuffisant. Stock restant : ${activeCycle.remainingStock}. Voulez-vous commander ce stock partiel ?`,
                    remaining: activeCycle.remainingStock
                };
            }
            finalQuantity = activeCycle.remainingStock;
            isPartial = true;
        }

        const newOrder: Order = {
            ...o,
            quantity: finalQuantity,
            cycleId: activeCycle.id!,
            status: isPartial ? 'PARTIELLE' : o.status,
            transferable: isPartial,
            createdAt: o.createdAt || new Date().toISOString(),
        };

        await db.orders.add(newOrder);
        
        await db.cycles.update(activeCycle.id!, {
            remainingStock: activeCycle.remainingStock - finalQuantity
        });

        await get().loadAll();
        return { success: true };
    },

    updateOrderStatus: async (id, status) => {
        const update: Partial<Order> = { status };
        if (status === 'PAYEE' || status === 'ANNULEE' || status === 'TERMINEE') {
            update.closedAt = new Date().toISOString();
        }

        if (status === 'TERMINEE') {
            update.transferable = false;
        }

        await db.orders.update(id, update);
        await get().loadAll();
    },

    addDelivery: async (d) => {
        await db.deliveries.add(d);
        await get().loadAll();
    },
}));

