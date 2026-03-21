import { useMemo, useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Filter, Plus } from 'lucide-react';
import { STATUS_LABELS, type OrderStatus } from '../lib/db';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Toutes', value: '' },
  { label: 'Demande reçue', value: 'DEMANDE_RECUE' },
  { label: 'Confirmée', value: 'CONFIRMEE' },
  { label: 'En livraison', value: 'ENVOYEE_LIVREUR' },
  { label: 'Livrée', value: 'LIVREE' },
  { label: 'Payée', value: 'PAYEE' },
  { label: 'Annulée', value: 'ANNULEE' },
];

export default function OrdersPage() {
  const { orders } = useDistributorStore();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    let list = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filterStatus) {
      list = list.filter((o) => o.status === filterStatus);
    }
    return list;
  }, [orders, filterStatus]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Commandes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {filtered.length} commande{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/orders/new')}>
          <Plus size={16} /> Nouvelle
        </button>
      </div>

      {/* Status filter pills */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1rem',
        overflowX: 'auto', paddingBottom: '0.25rem',
        WebkitOverflowScrolling: 'touch'
      }}>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 9999,
              border: '1px solid',
              borderColor: filterStatus === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
              background: filterStatus === opt.value ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
              color: filterStatus === opt.value ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Filter size={48} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>Aucune commande</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {filterStatus ? 'Aucune commande avec ce statut' : 'Commencez par ajouter une commande'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((o) => {
            let displayDate: string;
            try {
              displayDate = format(parseISO(o.createdAt), 'd MMM', { locale: fr });
            } catch {
              displayDate = '';
            }
            return (
              <div
                key={o.id}
                className="glass-card"
                style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
                onClick={() => navigate(`/orders/${o.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{o.clientName}</h3>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        {displayDate}
                      </span>
                    </div>
                    <div style={{
                      color: 'var(--color-text-muted)', fontSize: '0.8125rem',
                      marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap'
                    }}>
                      <span>{o.quantity} unité{o.quantity > 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>
                        {o.price.toLocaleString()} MRU
                      </span>
                      <span>·</span>
                      <span>{o.deliveryZone}</span>
                      <span>·</span>
                      <span style={{ 
                        color: (o.status === 'ANNULEE' && (o.deliveryCost || 0) > 0) ? 'var(--color-danger)' : 'inherit',
                        fontWeight: (o.status === 'ANNULEE' && (o.deliveryCost || 0) > 0) ? 600 : 400
                      }}>
                        Frais: {(['DEMANDE_RECUE', 'CONFIRMEE'].includes(o.status)) ? '-' : `${(o.deliveryCost || 0).toLocaleString()} MRU`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {o.status === 'ANNULEE' && o.reachedDelivery && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '0.125rem 0.375rem', borderRadius: 4 }}>
                        ⚠️ Perte
                      </span>
                    )}
                    <span className={`badge status-${o.status.toLowerCase()}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
