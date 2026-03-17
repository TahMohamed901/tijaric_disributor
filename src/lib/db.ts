import Dexie, { type EntityTable } from 'dexie';

export type OrderStatus =
    | 'DEMANDE_RECUE'
    | 'CONFIRMEE'
    | 'ENVOYEE_LIVREUR'
    | 'LIVREE'
    | 'PAYEE'
    | 'ANNULEE';

export type DeliveryZone = 'Nouakchott' | 'Wilaya';
export type PaymentMethod = 'Cash' | 'Bankily' | 'Masrivi' | 'Sedad';

export interface StockItem {
    id?: number;
    productName: string;
    quantity: number;
    date: string;
    note: string;
}

export interface Order {
    id?: number;
    clientName: string;
    clientPhone: string;
    address: string;
    quantity: number;
    price: number;
    deliveryCost: number;
    deliveryZone: DeliveryZone;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    createdAt: string;
    closedAt: string | null;
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

    constructor() {
        super('DistributeurDB');
        this.version(1).stores({
            stock: '++id, productName, date',
            orders: '++id, status, createdAt, closedAt',
            deliveries: '++id, orderId',
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
};

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    DEMANDE_RECUE: ['CONFIRMEE', 'ANNULEE'],
    CONFIRMEE: ['ENVOYEE_LIVREUR', 'ANNULEE'],
    ENVOYEE_LIVREUR: ['LIVREE', 'ANNULEE'],
    LIVREE: ['PAYEE'],
    PAYEE: [],
    ANNULEE: [],
};
