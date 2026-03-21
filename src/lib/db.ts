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
export type PaymentMethod = 'Cash' | 'Bankily' | 'Masrivi' | 'Sedad';

export interface Cycle {
    id?: number;
    initialStock: number;
    remainingStock: number;
    startDate: string;
    endDate?: string;
    status: 'ACTIVE' | 'CLOSED';
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
}

export interface Delivery {
    id?: number;
    orderId: number;
    deliveryName: string;
    deliveryPhone: string;
}

class DistributorDatabase extends Dexie {
    stock!: EntityTable<StockItem, 'id'>;
    orders!: EntityTable<Order, 'id'>;
    deliveries!: EntityTable<Delivery, 'id'>;
    cycles!: EntityTable<Cycle, 'id'>;

    constructor() {
        super('DistributeurDB');
        this.version(2).stores({
            stock: '++id, productName, date, cycleId',
            orders: '++id, status, createdAt, closedAt, cycleId, transferable',
            deliveries: '++id, orderId',
            cycles: '++id, status, startDate',
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
    LIVREE: ['PAYEE', 'TERMINEE', 'PARTIELLE'],
    PAYEE: ['TERMINEE'],
    TERMINEE: [],
    PARTIELLE: ['TERMINEE', 'ANNULEE'],
    ANNULEE: [],
};

