import { useMemo, useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import {
  Package,
  ShoppingCart,
  Truck,
  Clock,
  DollarSign,
  TrendingUp,
  Play,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { generateDistributorReport } from '../lib/pdfService';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { stockItems, orders, activeCycle, loading, startCycle, closeCycle, resetCycle } = useDistributorStore();
  const [showStartModal, setShowStartModal] = useState(false);
  const [initialStockInput, setInitialStockInput] = useState('12');

  const stats = useMemo(() => {
    const totalStock = activeCycle ? activeCycle.remainingStock : 0;
    const todayOrders = orders.filter((o) => {
      try { return isToday(parseISO(o.createdAt)); } catch { return false; }
    });
    const todayCount = todayOrders.length;
    const delivered = todayOrders.filter((o) => o.status === 'LIVREE' || o.status === 'PAYEE' || o.status === 'TERMINEE').length;
    const pending = todayOrders.filter((o) =>
      o.status === 'DEMANDE_RECUE' || o.status === 'CONFIRMEE' || o.status === 'ENVOYEE_LIVREUR' || o.status === 'PARTIELLE'
    ).length;

    // Revenue: from orders closed today
    const closedToday = orders.filter((o) => {
      if (!o.closedAt) return false;
      try { return isToday(parseISO(o.closedAt)) && (o.status === 'PAYEE' || o.status === 'TERMINEE'); } catch { return false; }
    });
    const revenue = closedToday.reduce((sum, o) => sum + (o.price * o.quantity), 0);

    return { totalStock, todayCount, delivered, pending, revenue };
  }, [stockItems, orders, activeCycle]);

  const handleStartCycle = async () => {
    if (!initialStockInput) return;
    await startCycle(Number(initialStockInput));
    setShowStartModal(false);
    toast.success('Cycle démarré !');
  };

  const handleGenerateReport = async () => {
    if (!activeCycle) return;
    try {
      await generateDistributorReport('Distributeur Ibrahim', activeCycle, orders);
      toast.success('Rapport généré !');
    } catch (err) {
      toast.error('Erreur PDF');
    }
  };

  const handleCloseCycle = async () => {
    if (!window.confirm('Voulez-vous clôturer ce cycle et générer le rapport ?')) return;
    await handleGenerateReport();
    await closeCycle();
    await resetCycle();
    toast.success('Cycle clôturé et nettoyé');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ animation: 'pulse 2s infinite', color: 'var(--color-text-muted)' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {activeCycle ? `Cycle Actif #${activeCycle.id}` : 'Aucun cycle actif'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '0.5rem' }}
            onClick={() => toast('Demande d\'aide envoyée au gérant', { icon: '🆘' })}
          >
            <HelpCircle size={20} />
          </button>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={20} color="white" />
          </div>
        </div>
      </div>

      {/* Cycle Actions */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        {!activeCycle ? (
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => setShowStartModal(true)}>
            <Play size={16} /> Démarrer un cycle
          </button>
        ) : (
          <>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={handleGenerateReport}>
              <FileText size={16} /> Rapport
            </button>
            <button className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--color-error)' }} onClick={handleCloseCycle}>
              <AlertCircle size={16} /> Clôturer Cycle
            </button>
          </>
        )}
      </div>

      {/* KPI Cards Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(20, 184, 166, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Package size={18} color="var(--color-primary-light)" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalStock}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Stock restant</div>
        </div>

        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShoppingCart size={18} color="var(--color-accent)" />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.todayCount}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Commandes aujourd'hui</div>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div style={{ marginBottom: '0.5rem' }}>
            <Truck size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.delivered}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Livrées</div>
        </div>

        <div className="kpi-card">
          <div style={{ marginBottom: '0.5rem' }}>
            <Clock size={18} color="var(--color-warning)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.pending}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>En attente</div>
        </div>

        <div className="kpi-card">
          <div style={{ marginBottom: '0.5rem' }}>
            <DollarSign size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{stats.revenue.toLocaleString()}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>MRU</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={16} /> Commandes récentes
          </h2>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={40} />
            <p>Aucune commande enregistrée</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...orders].reverse().slice(0, 8).map((o) => (
              <a
                key={o.id}
                href={`/orders/${o.id}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1.25rem',
                  borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                  textDecoration: 'none', color: 'inherit',
                  transition: 'background 0.2s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.clientName}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {o.quantity} unité{o.quantity > 1 ? 's' : ''} · {(o.price * o.quantity).toLocaleString()} MRU
                  </div>
                </div>
                <span className={`badge status-${o.status.toLowerCase()}`}>
                  {o.status === 'DEMANDE_RECUE' ? 'Reçue' :
                   o.status === 'CONFIRMEE' ? 'Confirmée' :
                   o.status === 'ENVOYEE_LIVREUR' ? 'En livraison' :
                   o.status === 'LIVREE' ? 'Livrée' :
                   o.status === 'PAYEE' ? 'Payée' : 
                   o.status === 'TERMINEE' ? 'Terminée' :
                   o.status === 'PARTIELLE' ? 'Partielle' : 'Annulée'}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Start Cycle Modal (Simple Overlay) */}
      {showStartModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem', zIndex: 100
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Démarrer un nouveau cycle</h3>
            <label className="form-label">Stock initial</label>
            <input 
              className="form-input" 
              type="number" 
              value={initialStockInput} 
              onChange={e => setInitialStockInput(e.target.value)}
              placeholder="12"
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowStartModal(false)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleStartCycle}>Démarrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

