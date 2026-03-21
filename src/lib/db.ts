import Dexie, { type EntityTable } from 'dexie';

export type OrderStatus =
    | 'DEMANDE_RECUE'
    | 'CONFIRMEE'
    | 'ENVOYEE_LIVREUR'
    | 'LIVREE'
    | 'PAYEE'
    | 'ANNULEE'
    | 'TERMINEE'
    | 'PARTIELLE';

export type DeliveryZone = 'Nouakchott' | 'Wilaya';
export type PaymentMethod = 'Prépayé' | 'À la livraison';

export interface Cycle {
    id?: number;
    initialStock: number;
    remainingStock: number;
    startDate: string;
    endDate?: string;
    status: 'ACTIVE' | 'CLOSED';
    totalRevenue?: number;
    totalExpenses?: number;
    netProfit?: number;
}

export interface StockItem {
    id?: number;
    productName: string;
    quantity: number;
    date: string;
    note: string;
    cycleId?: number;
}

export interface Order {
    id?: number;
    clientName: string;
    clientPhone: string;
    address: string;
    quantity: number;
    quantityRemaining?: number;
    price: number;
    deliveryCost: number;
    deliveryZone: DeliveryZone;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    createdAt: string;
    closedAt: string | null;
    cycleId: number;
    transferable: boolean;
    reachedDelivery?: boolean;
}

export interface Delivery {
    id?: number;
    orderId: number;
    deliveryName: string;
    deliveryPhone: string;
}

export interface Settings {
    id?: number;
    distributorName: string;
    productName: string;
    unitPrice: number;
}

class DistributorDatabase extends Dexie {
    stock!: EntityTable<StockItem, 'id'>;
    orders!: EntityTable<Order, 'id'>;
    deliveries!: EntityTable<Delivery, 'id'>;
    cycles!: EntityTable<Cycle, 'id'>;
    settings!: EntityTable<Settings, 'id'>;

    constructor() {
        super('DistributeurDB');
        this.version(4).stores({
            stock: '++id, productName, date, cycleId',
            orders: '++id, status, createdAt, closedAt, cycleId, transferable, reachedDelivery',
            deliveries: '++id, orderId',
            cycles: '++id, status, startDate',
            settings: '++id',
        });
    }
}

export const db = new DistributorDatabase();

export const STATUS_LABELS: Record<OrderStatus, string> = {
    DEMANDE_RECUE: 'Demande reçue',
    CONFIRMEE: 'Confirmée',
    ENVOYEE_LIVREUR: 'Envoyée livreur',
    LIVREE: 'Livrée',
    PAYEE: 'Payée',
    ANNULEE: 'Annulée',
    TERMINEE: 'Terminée',
    PARTIELLE: 'Partielle',
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    DEMANDE_RECUE: ['CONFIRMEE', 'ANNULEE'],
    CONFIRMEE: ['ENVOYEE_LIVREUR', 'ANNULEE'],
    ENVOYEE_LIVREUR: ['LIVREE', 'ANNULEE'],
    LIVREE: ['PAYEE', 'ANNULEE'],
    PAYEE: [],
    ANNULEE: [],
    TERMINEE: [],
    PARTIELLE: [],
};

