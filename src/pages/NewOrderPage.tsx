import { useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import type { DeliveryZone, PaymentMethod } from '../lib/db';
import toast from 'react-hot-toast';

const MAURITANIA_REGIONS = [
  'Hodh Ech Chargui', 'Hodh El Gharbi', 'Assaba', 'Gorgol', 'Brakna', 'Trarza', 
  'Adrar', 'Dakhlet Nouadhibou', 'Tagant', 'Guidimaka', 'Tiris Zemmour', 
  'Inchiri', 'Nouakchott Nord', 'Nouakchott Ouest', 'Nouakchott Sud'
];

export default function NewOrderPage() {
  const { addOrder, activeCycle, settings } = useDistributorStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    address: '',
    quantity: '',
    price: settings?.unitPrice?.toString() || '',
    deliveryZone: 'Nouakchott' as DeliveryZone,
    paymentMethod: 'À la livraison' as PaymentMethod,
  });

  const defaultUnitPrice = settings?.unitPrice || 0;
  const currentPrice = form.price !== '' ? Number(form.price) : defaultUnitPrice;
  const totalPrice = Number(form.quantity) * currentPrice;

  const handleSubmit = async () => {
    if (!form.clientName || !form.clientPhone || !form.quantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!activeCycle) {
      toast.error('Aucun cycle actif. Veuillez démarrer un cycle sur le tableau de bord.');
      return;
    }

    if (Number(form.quantity) > activeCycle.remainingStock) {
        toast.error(`Stock insuffisant. Stock disponible : ${activeCycle.remainingStock}`);
        return;
    }

    const res = await addOrder({
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      address: form.address,
      quantity: Number(form.quantity),
      price: currentPrice, // Save current unit price for history
      deliveryCost: 0,
      deliveryZone: form.deliveryZone,
      paymentMethod: form.paymentMethod,
      status: 'DEMANDE_RECUE',
      createdAt: new Date().toISOString(),
      closedAt: null,
      transferable: false,
    });

    if (res.success) {
      toast.success('Commande enregistrée !');
      navigate('/orders');
    } else {
      toast.error(res.msg || 'Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nouvelle commande</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Enregistrer une commande
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Zone de livraison</label>
              <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 4 }}>
                  <button 
                  onClick={() => setForm({ ...form, deliveryZone: 'Nouakchott' })}
                  style={{ 
                      flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: form.deliveryZone === 'Nouakchott' ? 'var(--color-primary)' : 'transparent',
                      color: form.deliveryZone === 'Nouakchott' ? 'white' : 'var(--color-text-muted)',
                      border: 'none', transition: 'all 0.2s'
                  }}>Nouakchott</button>
                  <button 
                  onClick={() => setForm({ ...form, deliveryZone: 'Wilaya' })}
                  style={{ 
                      flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: form.deliveryZone === 'Wilaya' ? 'var(--color-primary)' : 'transparent',
                      color: form.deliveryZone === 'Wilaya' ? 'white' : 'var(--color-text-muted)',
                      border: 'none', transition: 'all 0.2s'
                  }}>Wilaya</button>
              </div>
            </div>
            <div>
              <label className="form-label">Paiement</label>
              <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 10, padding: 4 }}>
                  <button 
                  onClick={() => setForm({ ...form, paymentMethod: 'Prépayé' })}
                  style={{ 
                      flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: form.paymentMethod === 'Prépayé' ? 'var(--color-success)' : 'transparent',
                      color: form.paymentMethod === 'Prépayé' ? 'white' : 'var(--color-text-muted)',
                      border: 'none', transition: 'all 0.2s'
                  }}>Prépayé</button>
                  <button 
                  onClick={() => setForm({ ...form, paymentMethod: 'À la livraison' })}
                  style={{ 
                      flex: 1, padding: '0.5rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: form.paymentMethod === 'À la livraison' ? 'var(--color-success)' : 'transparent',
                      color: form.paymentMethod === 'À la livraison' ? 'white' : 'var(--color-text-muted)',
                      border: 'none', transition: 'all 0.2s'
                  }}>Livraison</button>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">{form.deliveryZone === 'Wilaya' ? 'Sélectionner la Wilaya' : 'Adresse de livraison'}</label>
            {form.deliveryZone === 'Wilaya' ? (
              <select 
                className="form-select"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                {MAURITANIA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input
                className="form-input"
                placeholder="Adresse complète"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            )}
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
              {activeCycle && (
                  <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      Stock disponible: {activeCycle.remainingStock}
                  </div>
              )}
            </div>
            <div>
              <label className="form-label">Prix unitaire (MRU)</label>
              <input
                className="form-input"
                type="number"
                placeholder={defaultUnitPrice.toString()}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div style={{ 
              padding: '1rem', background: 'rgba(20, 184, 166, 0.05)', 
              borderRadius: 12, border: '1px dashed var(--color-primary-light)',
              display: 'flex', flexDirection: 'column', gap: '0.25rem'
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Montant Total Produit</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                      {totalPrice.toLocaleString()} MRU
                  </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Livraison</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>OFFERTE</span>
              </div>
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

