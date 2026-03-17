import { useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { Package, Plus, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function StockPage() {
  const { stockItems, addStock, deleteStock } = useDistributorStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    productName: '',
    quantity: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  const [success, setSuccess] = useState(false);

  const totalStock = stockItems.reduce((sum, s) => sum + s.quantity, 0);

  const handleSubmit = async () => {
    if (!form.productName || !form.quantity) return;
    await addStock({
      productName: form.productName,
      quantity: Number(form.quantity),
      date: new Date(form.date).toISOString(),
      note: form.note,
    });
    setForm({
      productName: '',
      quantity: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    });
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cet article du stock ?')) {
      await deleteStock(id);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mon stock</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Total : {totalStock} unité{totalStock !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 12,
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--color-success)', fontSize: '0.875rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <Check size={16} /> Stock ajouté avec succès
        </div>
      )}

      {stockItems.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>Aucun stock</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Ajoutez le stock reçu du magasin
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stockItems.map((s) => (
            <div key={s.id} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{s.productName}</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <span className="badge" style={{
                      background: 'rgba(20, 184, 166, 0.15)',
                      color: 'var(--color-primary-light)'
                    }}>
                      {s.quantity} unités
                    </span>
                    {s.note && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {s.note}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-danger"
                  style={{ padding: '0.5rem' }}
                  onClick={() => s.id && handleDelete(s.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Ajouter du stock</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nom du produit *</label>
                <input
                  className="form-input"
                  placeholder="ex: Parfum X"
                  value={form.productName}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Quantité reçue *</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Note</label>
                <textarea
                  className="form-input"
                  placeholder="Notes..."
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
                <Plus size={16} /> Ajouter au stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
