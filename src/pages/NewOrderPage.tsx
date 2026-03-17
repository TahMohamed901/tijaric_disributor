import { useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check } from 'lucide-react';
import type { DeliveryZone, PaymentMethod } from '../lib/db';

export default function NewOrderPage() {
  const { addOrder } = useDistributorStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    address: '',
    quantity: '',
    price: '',
    deliveryCost: '',
    deliveryZone: 'Nouakchott' as DeliveryZone,
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.quantity || !form.price) return;
    await addOrder({
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      address: form.address,
      quantity: Number(form.quantity),
      price: Number(form.price),
      deliveryCost: Number(form.deliveryCost) || 0,
      deliveryZone: form.deliveryZone,
      paymentMethod: form.paymentMethod,
      status: 'DEMANDE_RECUE',
      createdAt: new Date().toISOString(),
      closedAt: null,
    });
    navigate('/orders');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle commande</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enregistrer une commande WhatsApp
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(6, 182, 212, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShoppingCart size={20} color="var(--color-accent)" />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Client section */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--color-primary-light)',
            paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-border)'
          }}>
            Informations client
          </div>

          <div>
            <label className="form-label">Nom du client *</label>
            <input
              className="form-input"
              placeholder="ex: Ahmed"
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Téléphone *</label>
            <input
              className="form-input"
              type="tel"
              placeholder="ex: 22123456"
              value={form.clientPhone}
              onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
            />
          </div>

          {/* Order section */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--color-primary-light)',
            paddingBottom: '0.25rem', borderBottom: '1px solid var(--color-border)',
            marginTop: '0.5rem'
          }}>
            Détails commande
          </div>

          <div>
            <label className="form-label">Adresse de livraison</label>
            <input
              className="form-input"
              placeholder="Adresse complète"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Quantité *</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Prix total (MRU) *</label>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Zone de livraison</label>
              <select
                className="form-select"
                value={form.deliveryZone}
                onChange={(e) => setForm({ ...form, deliveryZone: e.target.value as DeliveryZone })}
              >
                <option value="Nouakchott">Nouakchott</option>
                <option value="Wilaya">Wilaya</option>
              </select>
            </div>
            <div>
              <label className="form-label">Paiement</label>
              <select
                className="form-select"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="Bankily">Bankily</option>
                <option value="Masrivi">Masrivi</option>
                <option value="Sedad">Sedad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Coût de livraison (MRU)</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={form.deliveryCost}
              onChange={(e) => setForm({ ...form, deliveryCost: e.target.value })}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', marginTop: '0.5rem' }}
          >
            <Check size={16} /> Enregistrer la commande
          </button>
        </div>
      </div>
    </div>
  );
}
