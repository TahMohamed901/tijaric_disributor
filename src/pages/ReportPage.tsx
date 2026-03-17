import { useMemo, useState } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { FileText, Copy, Share2, Check, Clock, DollarSign, ShoppingCart } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { STATUS_LABELS } from '../lib/db';

export default function ReportPage() {
  const { orders } = useDistributorStore();
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => {
    const today = new Date();
    const dateStr = format(today, 'd MMMM yyyy', { locale: fr });

    // Completed today: closedAt = today AND status is PAYEE or ANNULEE
    const completedToday = orders.filter((o) => {
      if (!o.closedAt) return false;
      try { return isToday(parseISO(o.closedAt)) && (o.status === 'PAYEE' || o.status === 'ANNULEE'); } catch { return false; }
    });
    const paid = completedToday.filter((o) => o.status === 'PAYEE');
    const cancelled = completedToday.filter((o) => o.status === 'ANNULEE');

    // In progress: not closed
    const inProgress = orders.filter((o) =>
      o.status === 'DEMANDE_RECUE' || o.status === 'CONFIRMEE' || o.status === 'ENVOYEE_LIVREUR'
    );

    // Financials
    const totalSales = paid.reduce((sum, o) => sum + o.price, 0);
    const totalDelivery = paid.reduce((sum, o) => sum + o.deliveryCost, 0);
    const netRevenue = totalSales - totalDelivery;

    return { dateStr, paid, cancelled, inProgress, completedToday, totalSales, totalDelivery, netRevenue };
  }, [orders]);

  const generateText = () => {
    let text = `📊 Rapport du ${report.dateStr}\n\n`;
    text += `✅ Commandes terminées : ${report.paid.length}\n`;
    text += `❌ Commandes annulées : ${report.cancelled.length}\n`;
    text += `⏳ Commandes en cours : ${report.inProgress.length}\n\n`;
    text += `💰 Total ventes : ${report.totalSales.toLocaleString()} MRU\n`;
    text += `🚚 Total livraison : ${report.totalDelivery.toLocaleString()} MRU\n`;
    text += `📈 Revenu net : ${report.netRevenue.toLocaleString()} MRU\n`;

    if (report.inProgress.length > 0) {
      text += `\n⏳ Commandes en cours :\n`;
      report.inProgress.forEach((o) => {
        let d = '';
        try { d = format(parseISO(o.createdAt), 'd MMM', { locale: fr }); } catch {}
        text += `• ${o.clientName} (${d}) - ${STATUS_LABELS[o.status]}\n`;
      });
    }
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = encodeURIComponent(generateText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>{report.cancelled.length}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Annulées</div>
        </div>
        <div className="kpi-card" style={{ textAlign: 'center' }}>
          <Clock size={18} color="var(--color-warning)" style={{ marginBottom: '0.375rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{report.inProgress.length}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>En cours</div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <DollarSign size={16} color="var(--color-primary-light)" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Résumé financier</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Total ventes</span>
            <span style={{ fontWeight: 600 }}>{report.totalSales.toLocaleString()} MRU</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Total livraison</span>
            <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>-{report.totalDelivery.toLocaleString()} MRU</span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>Revenu net</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)' }}>{report.netRevenue.toLocaleString()} MRU</span>
          </div>
        </div>
      </div>

      {/* In progress orders */}
      {report.inProgress.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '1rem' }}>
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn-secondary" onClick={handleCopy} style={{ flex: 1, justifyContent: 'center', padding: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {copied ? <><Check size={16} /> Copié !</> : <><Copy size={16} /> Copier</>}
        </button>
        <button className="btn-primary" onClick={handleShare} style={{ flex: 1, justifyContent: 'center', padding: '0.875rem' }}>
          <Share2 size={16} /> WhatsApp
        </button>
      </div>
    </div>
  );
}
