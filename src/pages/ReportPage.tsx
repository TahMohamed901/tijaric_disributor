import { useMemo, useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { FileText, Copy, Share2, Check, Clock, DollarSign, ShoppingCart, Download } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { STATUS_LABELS } from '../lib/db';
import { generateDistributorReport } from '../lib/pdfService';
import toast from 'react-hot-toast';
import { forceReloadFromServer } from '../lib/utils';

export default function ReportPage() {
  const { orders, activeCycle, settings, deliveries } = useDistributorStore();
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    const today = new Date();
    const dateStr = format(today, 'd MMMM yyyy', { locale: fr });

    // Orders for current cycle
    const cycleOrders = activeCycle ? orders.filter(o => o.cycleId === activeCycle.id) : orders;
    
    const paid = cycleOrders.filter((o) => o.status === 'PAYEE');
    const criticalCancellations = cycleOrders.filter((o) => o.status === 'ANNULEE' && o.reachedDelivery);
    const inProgress = cycleOrders.filter((o) =>
      !['PAYEE', 'ANNULEE', 'TERMINEE'].includes(o.status)
    );

    // Financials
    const grossRevenue = paid.reduce((sum, o) => sum + (o.price * o.quantity), 0);
    const totalDeliveryCosts = cycleOrders.reduce((sum, o) => sum + (o.reachedDelivery ? (o.deliveryCost || 0) : 0), 0);
    const netRevenue = grossRevenue - totalDeliveryCosts;

    const totalSent = cycleOrders.filter(o => o.reachedDelivery).length;
    const failureRate = totalSent > 0 ? (criticalCancellations.length / totalSent) * 100 : 0;

    return { 
      dateStr, 
      paid, 
      criticalCancellations, 
      inProgress, 
      cycleOrders, 
      grossRevenue, 
      totalDeliveryCosts, 
      netRevenue,
      failureRate
    };
  }, [orders, activeCycle]);

  const generateText = () => {
    let text = `📊 *Rapport de Distribution*\n`;
    text += `📅 Date : ${report.dateStr}\n`;
    if (activeCycle) text += `🔄 Cycle #${activeCycle.id}\n`;
    text += `\n--------------------------\n`;
    
    // Résumé Global Stock
    const totalVendu = report.paid.reduce((sum, o) => sum + o.quantity, 0);
    const totalRetourne = report.cycleOrders.filter(o => o.status === 'ANNULEE').reduce((sum, o) => sum + o.quantity, 0);
    
    text += `📦 Stock Initial : ${activeCycle?.initialStock || 0}\n`;
    text += `✅ Stock Vendu : ${totalVendu}\n`;
    text += `❌ Stock Retourné : ${totalRetourne}\n`;
    
    text += `\n--------------------------\n`;
    text += `💰 *CA Brut :* ${report.grossRevenue.toLocaleString()} MRU\n`;
    text += `🚚 *Frais Transport :* ${report.totalDeliveryCosts.toLocaleString()} MRU\n`;
    text += `📈 *Taux d'Échec :* ${report.failureRate.toFixed(1)}%\n`;
    text += `💵 *NET À ENCAISSER :* ${report.netRevenue.toLocaleString()} MRU\n`;

    if (report.criticalCancellations.length > 0) {
      text += `\n⚠️ *Pertes sur Livraisons :*\n`;
      report.criticalCancellations.forEach((o) => {
        const d = deliveries.find(del => del.orderId === o.id);
        text += `• ${o.clientName} (Livreur: ${d ? d.deliveryName : 'N/A'}) : -${o.deliveryCost} MRU\n`;
      });
    }

    if (report.inProgress.length > 0) {
      text += `\n⏳ *Commandes en cours :*\n`;
      report.inProgress.forEach((o) => {
        text += `• ${o.clientName} (${STATUS_LABELS[o.status]})\n`;
      });
    }
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Rapport copié !');
  };

  const handleShare = () => {
    const text = encodeURIComponent(generateText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!activeCycle) {
      toast.error('Aucun cycle actif pour générer un PDF');
      return;
    }
    try {
      await generateDistributorReport(
        settings?.distributorName || "", 
        settings?.productName || "",
        settings?.unitPrice || 0,
        activeCycle, 
        orders,
        deliveries
      );
      toast.success('PDF généré !');
      forceReloadFromServer()
    } catch (err) {
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapport</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{report.dateStr}</p>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={20} color="white" />
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <ShoppingCart size={18} color="var(--color-success)" style={{ marginBottom: '0.375rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{report.paid.length}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Terminées</div>
        </div>
        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>{report.criticalCancellations.length}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Pertes (Post-envoi)</div>
        </div>
        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <Clock size={18} color="var(--color-warning)" style={{ marginBottom: '0.375rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{report.inProgress.length}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>En cours</div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <DollarSign size={16} color="var(--color-primary-light)" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Résumé financier du cycle</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>CA BRUT</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-success)' }}>{report.grossRevenue.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>FRAIS LIVREURS</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-warning)' }}>{report.totalDeliveryCosts.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.625rem', marginBottom: '0.25rem' }}>NET À ENCAISSER</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{report.netRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Taux d'échec après envoi : <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{report.failureRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Share2 size={18} /> Partager le Rapport
        </h2>
        
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', 
          fontSize: '0.875rem', marginBottom: '1rem', whiteSpace: 'pre-wrap',
          border: '1px solid var(--color-border)', color: 'var(--color-text-muted)'
        }}>
          {generateText()}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="btn-primary" onClick={handleDownloadPDF} style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
          <Download size={16} /> Télécharger le rapport détaillé (PDF)
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleCopy} style={{ flex: 1, justifyContent: 'center', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {copied ? <><Check size={16} /> Copié !</> : <><Copy size={16} /> Copier Texte</>}
          </button>
          <button className="btn-secondary" onClick={handleShare} style={{ flex: 1, justifyContent: 'center', padding: '0.875rem' }}>
            <Share2 size={16} /> WhatsApp
          </button>
        </div>
      </div>
      
      {/* In progress orders */}
      {report.inProgress.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--color-warning)" /> Commandes en cours
            </h2>
          </div>
          {report.inProgress.map((o) => {
            let d = '';
            try { d = format(parseISO(o.createdAt), 'd MMM', { locale: fr }); } catch {}
            return (
              <div key={o.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(51,65,85,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.clientName}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{d} · {o.price.toLocaleString()} MRU</div>
                </div>
                <span className={`badge status-${o.status.toLowerCase()}`}>{STATUS_LABELS[o.status]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

