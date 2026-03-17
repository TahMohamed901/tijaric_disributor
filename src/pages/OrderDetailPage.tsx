import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDistributorStore } from '../stores/distributorStore';
import { ArrowLeft, User, Phone, MapPin, CreditCard, Truck, Check, X as XIcon, ChevronRight } from 'lucide-react';
import { STATUS_LABELS, STATUS_FLOW, type OrderStatus } from '../lib/db';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, deliveries, updateOrderStatus, addDelivery } = useDistributorStore();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ deliveryName: '', deliveryPhone: '' });

  const order = useMemo(() => orders.find((o) => o.id === Number(id)), [orders, id]);
  const delivery = useMemo(() => deliveries.find((d) => d.orderId === Number(id)), [deliveries, id]);

  if (!order) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <p>Commande introuvable</p>
          <button className="btn-secondary" onClick={() => navigate('/orders')} style={{ marginTop: '1rem' }}>Retour</button>
        </div>
      </div>
    );
  }

  const nextStatuses = STATUS_FLOW[order.status];
  const isClosed = order.status === 'PAYEE' || order.status === 'ANNULEE';
  const allStatuses: OrderStatus[] = ['DEMANDE_RECUE', 'CONFIRMEE', 'ENVOYEE_LIVREUR', 'LIVREE', 'PAYEE'];
  const currentIndex = order.status === 'ANNULEE' ? -1 : allStatuses.indexOf(order.status);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === 'ENVOYEE_LIVREUR' && !delivery) {
      setShowDeliveryModal(true);
      return;
    }
    await updateOrderStatus(order.id!, newStatus);
  };

  const handleDeliverySubmit = async () => {
    if (!deliveryForm.deliveryName || !deliveryForm.deliveryPhone) return;
    await addDelivery({ orderId: order.id!, deliveryName: deliveryForm.deliveryName, deliveryPhone: deliveryForm.deliveryPhone });
    await updateOrderStatus(order.id!, 'ENVOYEE_LIVREUR');
    setShowDeliveryModal(false);
  };

  let displayDate = order.createdAt;
  try { displayDate = format(parseISO(order.createdAt), 'd MMM yyyy, HH:mm', { locale: fr }); } catch {}
  let closedDate: string | null = null;
  if (order.closedAt) { try { closedDate = format(parseISO(order.closedAt), 'd MMM yyyy, HH:mm', { locale: fr }); } catch { closedDate = order.closedAt; } }

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={20} /> <span style={{ fontWeight: 600 }}>Commande #{order.id}</span>
        </button>
        <span className={`badge status-${order.status.toLowerCase()}`}>{STATUS_LABELS[order.status]}</span>
      </div>

      {/* Timeline */}
      {order.status !== 'ANNULEE' && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 14, left: '10%', right: '10%', height: 3, background: 'var(--color-border)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 14, left: '10%', height: 3, background: 'var(--color-primary)', borderRadius: 2, width: `${Math.max(0, currentIndex / (allStatuses.length - 1)) * 80}%`, transition: 'width 0.5s ease' }} />
            {allStatuses.map((s, i) => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i <= currentIndex ? 'var(--color-primary)' : 'var(--color-bg)', border: `2px solid ${i <= currentIndex ? 'var(--color-primary)' : 'var(--color-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i <= currentIndex && <Check size={14} color="white" />}
                </div>
                <span style={{ fontSize: '0.5625rem', fontWeight: 500, marginTop: '0.375rem', color: i <= currentIndex ? 'var(--color-primary-light)' : 'var(--color-text-muted)', textAlign: 'center' }}>{STATUS_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client info */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <DetailRow icon={<User size={16} />} label="Client" value={order.clientName} />
          <DetailRow icon={<Phone size={16} />} label="Téléphone" value={order.clientPhone} isPhone />
          {order.address && <DetailRow icon={<MapPin size={16} />} label="Adresse" value={order.address} />}
          <DetailRow icon={<CreditCard size={16} />} label="Paiement" value={order.paymentMethod} />
        </div>
      </div>

      {/* Financials */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          <div><div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Quantité</div><div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{order.quantity}</div></div>
          <div><div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Prix</div><div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{order.price.toLocaleString()} MRU</div></div>
          <div><div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Livraison</div><div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-warning)' }}>{order.deliveryCost.toLocaleString()} MRU</div></div>
        </div>
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Revenu net</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{(order.price - order.deliveryCost).toLocaleString()} MRU</span>
        </div>
      </div>

      {/* Delivery info */}
      {delivery && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}><Truck size={16} color="var(--color-primary-light)" /><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Livreur</span></div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div><div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Nom</div><div style={{ fontWeight: 500 }}>{delivery.deliveryName}</div></div>
            <div><div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Tél</div><div style={{ fontWeight: 500 }}>{delivery.deliveryPhone}</div></div>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Créée</span><span style={{ fontWeight: 500 }}>{displayDate}</span>
        </div>
        {closedDate && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Finalisée</span><span style={{ fontWeight: 500 }}>{closedDate}</span>
        </div>}
      </div>

      {/* Actions */}
      {!isClosed && nextStatuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {nextStatuses.map((s) => (
            <button key={s} className={s === 'ANNULEE' ? 'btn-danger' : 'btn-success'} onClick={() => handleStatusChange(s)} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {s === 'ANNULEE' ? <><XIcon size={16} /> Annuler</> : <><ChevronRight size={16} /> {STATUS_LABELS[s]}</>}
            </button>
          ))}
        </div>
      )}

      {/* Delivery modal */}
      {showDeliveryModal && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontWeight: 600 }}>Informations livreur</h2>
              <button onClick={() => setShowDeliveryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><XIcon size={20} /></button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label className="form-label">Nom *</label><input className="form-input" value={deliveryForm.deliveryName} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryName: e.target.value })} /></div>
              <div><label className="form-label">Téléphone *</label><input className="form-input" type="tel" value={deliveryForm.deliveryPhone} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryPhone: e.target.value })} /></div>
              <button className="btn-primary" onClick={handleDeliverySubmit} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}><Truck size={16} /> Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, isPhone }: { icon: React.ReactNode; label: string; value: string; isPhone?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{label}</div>
        {isPhone ? <a href={`tel:${value}`} style={{ fontWeight: 500, color: 'var(--color-primary-light)', textDecoration: 'none' }}>{value}</a> : <div style={{ fontWeight: 500 }}>{value}</div>}
      </div>
    </div>
  );
}
