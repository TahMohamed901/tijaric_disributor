import { create } from 'zustand';
import { db, type StockItem, type Order, type Delivery, type OrderStatus, type Cycle, type Settings } from '../lib/db';

interface DistributorStore {
    stockItems: StockItem[];
    orders: Order[];
    deliveries: Delivery[];
    cycles: Cycle[];
    activeCycle: Cycle | null;
    settings: Settings | null;
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
    addOrder: (o: Omit<Order, 'id' | 'cycleId'>) => Promise<{ success: boolean; msg?: string; remaining?: number }>;
    updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;

    // Settings
    updateSettings: (s: Settings) => Promise<void>;

    // Deliveries
    addDelivery: (d: Omit<Delivery, 'id'>, deliveryCost: number) => Promise<void>;
    // Logic helper
    recalculateStock: () => Promise<void>;
}

export const useDistributorStore = create<DistributorStore>((set, get) => ({
    stockItems: [],
    orders: [],
    deliveries: [],
    cycles: [],
    activeCycle: null,
    settings: null,
    loading: true,

    loadAll: async () => {
        const [stockItems, orders, deliveries, cycles, settingsArr] = await Promise.all([
            db.stock.toArray(),
            db.orders.toArray(),
            db.deliveries.toArray(),
            db.cycles.toArray(),
            db.settings.toArray(),
        ]);
        
        let settings = settingsArr[0] || null;
        if (!settings) {
            settings = { distributorName: 'Nom Distributeur', productName: 'Sacs de Riz', unitPrice: 500 };
            const id = await db.settings.add(settings);
            settings.id = id;
        }

        const activeCycle = cycles.find(c => c.status === 'ACTIVE') || null;
        set({ stockItems, orders, deliveries, cycles, activeCycle, settings, loading: false });
        if (activeCycle) {
            await get().recalculateStock();
        }
    },
    
    updateSettings: async (s) => {
        if (s.id) {
            await db.settings.put(s);
        } else {
            const id = await db.settings.add(s);
            s.id = id;
        }
        set({ settings: s });
    },

    recalculateStock: async () => {
        const { activeCycle, orders } = get();
        if (!activeCycle || !activeCycle.id) return;

        const cycleOrders = orders.filter(o => o.cycleId === activeCycle.id && o.status !== 'ANNULEE');
        const usedQuantity = cycleOrders.reduce((sum, o) => sum + o.quantity, 0);
        const remainingStock = activeCycle.initialStock - usedQuantity;

        if (remainingStock !== activeCycle.remainingStock) {
            await db.cycles.update(activeCycle.id, { remainingStock });
            set((state) => ({
                activeCycle: state.activeCycle ? { ...state.activeCycle, remainingStock } : null
            }));
        }
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
        const { activeCycle, orders } = get();
        if (activeCycle && activeCycle.id) {
            const cycleOrders = orders.filter(o => o.cycleId === activeCycle.id);
            const totalRevenue = cycleOrders
                .filter(o => o.status === 'PAYEE')
                .reduce((sum, o) => sum + (o.price * o.quantity), 0);
            
            const totalExpenses = cycleOrders
                .filter(o => o.reachedDelivery)
                .reduce((sum, o) => sum + (o.deliveryCost || 0), 0);
            
            const netProfit = totalRevenue - totalExpenses;

            await db.cycles.update(activeCycle.id, {
                status: 'CLOSED',
                endDate: new Date().toISOString(),
                totalRevenue,
                totalExpenses,
                netProfit
            });
            await get().loadAll();
        }
    },

    resetCycle: async () => {
        const ordersToDelete = get().orders.filter(o => (o.status === 'TERMINEE' || o.status === 'PAYEE' || o.status === 'ANNULEE') && !o.transferable);
        for (const order of ordersToDelete) {
            if (order.id) await db.orders.delete(order.id);
        }
        await get().loadAll();
    },

    addStock: async (s) => {
        const { activeCycle } = get();
        await db.stock.add({ ...s, cycleId: activeCycle?.id });
        await get().loadAll();
        await get().recalculateStock();
    },

    deleteStock: async (id) => {
        await db.stock.delete(id);
        await get().loadAll();
        await get().recalculateStock();
    },

    addOrder: async (o) => {
        const { activeCycle } = get();
        if (!activeCycle) return { success: false, msg: 'Aucun cycle actif' };

        if (o.quantity > activeCycle.remainingStock) {
            return { 
                success: false, 
                msg: `Stock insuffisant. Stock disponible : ${activeCycle.remainingStock}.`,
                remaining: activeCycle.remainingStock
            };
        }

        const newOrder: Order = {
            ...o,
            cycleId: activeCycle.id!,
            createdAt: o.createdAt || new Date().toISOString(),
            reachedDelivery: o.status === 'ENVOYEE_LIVREUR'
        };

        await db.orders.add(newOrder);
        await get().loadAll();
        await get().recalculateStock();
        return { success: true };
    },

    updateOrderStatus: async (id, status) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return;

        const update: Partial<Order> = { status };
        
        if (status === 'PAYEE' || status === 'ANNULEE' || status === 'TERMINEE') {
            update.closedAt = new Date().toISOString();
        }

        if (status === 'ENVOYEE_LIVREUR') {
            update.reachedDelivery = true;
        }

        await db.orders.update(id, update);
        await get().loadAll();
        await get().recalculateStock();
    },

    addDelivery: async (d: Omit<Delivery, 'id'>, deliveryCost: number) => {
        await db.deliveries.add(d);
        await db.orders.update(d.orderId, { deliveryCost, reachedDelivery: true });
        await get().loadAll();
    },
}));

