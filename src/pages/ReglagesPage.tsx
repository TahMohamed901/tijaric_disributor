import { useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { Settings, Save, Package, User, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReglagesPage() {
  const { settings, updateSettings } = useDistributorStore();
  
  const [form, setForm] = useState({
    distributorName: settings?.distributorName || '',
    productName: settings?.productName || '',
    unitPrice: settings?.unitPrice?.toString() || '',
  });

  const handleSave = async () => {
    if (!form.distributorName || !form.productName || !form.unitPrice) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    await updateSettings({
      id: settings?.id,
      distributorName: form.distributorName,
      productName: form.productName,
      unitPrice: Number(form.unitPrice),
    });
    
    toast.success('Réglages enregistrés !');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Réglages</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Configurez vos informations globales
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(6, 182, 212, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Settings size={20} color="var(--color-accent)" />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={14} /> Nom du Distributeur
          </label>
          <input
            className="form-input"
            value={form.distributorName}
            onChange={(e) => setForm({ ...form, distributorName: e.target.value })}
            placeholder="ex: Distributeur Ibrahim"
          />
        </div>

        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={14} /> Nom du Produit
          </label>
          <input
            className="form-input"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            placeholder="ex: Sacs de Riz"
          />
        </div>

        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={14} /> Prix de Vente Unitaire (MRU)
          </label>
          <input
            className="form-input"
            type="number"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            placeholder="500"
          />
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
            Ce prix sera appliqué automatiquement à chaque nouvelle vente.
          </p>
        </div>

        <button className="btn-primary" onClick={handleSave} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
          <Save size={16} /> Enregistrer
        </button>
      </div>
    </div>
  );
}
