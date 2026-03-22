

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Order, type Cycle, type Delivery, STATUS_LABELS } from './db';

// Helper pour formater les prix
const formatCurrency = (value: number | string) => {
    const numberValue = typeof value === 'string' ? parseFloat(value) : value;
    return numberValue.toFixed(2) + ' MRU';
};

export const generateDistributorReport = async (
  distributorName: string,
  productName: string,
  unitPrice: number,
  cycle: Cycle,
  orders: Order[],
  deliveries: Delivery[]
) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const today = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 44, 88); // bleu foncé
    doc.text('TIJARIC', 14, 14);

    // --- EN-TÊTE ---
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rapport de Distribution`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${distributorName} | ${today}`, 14, 26);
    
    doc.setDrawColor(200);
    doc.line(14, 30, 196, 30);

    let finalY = 40;

    // --- DÉTAILS DU PRODUIT ---
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('Détails du Produit', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 2,
      theme: 'plain',
      body: [
        ['Produit :', productName],
        // ['Prix Unitaire :', formatCurrency(unitPrice)],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
      margin: { left: 14 },
      didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 12 : finalY + 20; }
    });

    // --- CALCULS ---
    const payeeOrders = orders.filter(o => o.status === 'PAYEE');
    const grossRevenue = payeeOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
    const reachedDeliveryOrders = orders.filter(o => o.reachedDelivery);
    const totalDeliveryCosts = reachedDeliveryOrders.reduce((sum, o) => sum + (o.deliveryCost || 0), 0);
    const netRevenue = grossRevenue - totalDeliveryCosts;

    const criticalCancellations = orders.filter(o => o.status === 'ANNULEE' && o.reachedDelivery);
    const totalSent = reachedDeliveryOrders.length;
    const failureRate = totalSent > 0 ? (criticalCancellations.length / totalSent) * 100 : 0;

    // --- RÉSUMÉ FINANCIER ---
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('Résumé Financier', 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 2,
      theme: 'plain',
      head: [['Catégorie', 'Montant (MRU)']],
      body: [
        ["Chiffre d'Affaires Brut (PAYÉES)", formatCurrency(grossRevenue)],
        ['Total Frais de Transport', `- ${formatCurrency(totalDeliveryCosts)}`],
        ['NET À ENCAISSER', { content: formatCurrency(netRevenue), styles: { fontStyle: 'bold' } }],
        ['Taux d\'Échec (après envoi)', `${failureRate.toFixed(1)}%`],
      ],
      headStyles: { 
        textColor: 0, 
        fontStyle: 'bold',
        lineWidth: { bottom: 0.1 }, 
        lineColor: 200 
      },
      margin: { left: 14 },
      didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 12 : finalY + 20; }
    });

    // --- GESTION DU STOCK ---
    const green: [number, number, number] = [39, 174, 96];
    const red: [number, number, number] = [231, 76, 60];
    const boldStyle = 'bold' as const;

    const totalVendu = payeeOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRetourne = orders.filter(o => o.status === 'ANNULEE').reduce((sum, o) => sum + o.quantity, 0);
    
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('Gestion du Stock', 14, finalY);

    autoTable(doc, {
      startY: finalY + 2,
      theme: 'plain',
      head: [['Indicateur', 'Quantité']],
      body: [
        ['Stock Initial', String(cycle.initialStock)],
        ['Stock Vendu (Payé)', { content: String(totalVendu), styles: { textColor: green, fontStyle: boldStyle } }],
        ['Stock Retourné (Annulé)', { content: String(totalRetourne), styles: { textColor: red } }],
        ['Stock Physique Restant', { content: String(cycle.remainingStock), styles: { fontStyle: boldStyle } }],
      ],
      headStyles: { 
        textColor: 0, 
        fontStyle: boldStyle, 
        lineWidth: { bottom: 0.1 }, 
        lineColor: 200 
      },
      margin: { left: 14 },
      didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 15 : finalY + 20; }
    });

    // --- PERTES SUR LIVRAISONS INFRUCTUEUSES ---
    if (criticalCancellations.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(231, 76, 60);
      doc.text('Pertes sur Livraisons Infructueuses', 14, finalY);

      autoTable(doc, {
        startY: finalY + 2,
        theme: 'striped',
        head: [['Client', 'Livreur', 'Frais Perdu (MRU)']],
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        body: criticalCancellations.map(o => {
          const delivery = deliveries.find(d => d.orderId === o.id);
          return [
            o.clientName,
            delivery ? delivery.deliveryName : 'N/A',
            formatCurrency(o.deliveryCost || 0)
          ];
        }),
        styles: { fontSize: 9 },
        margin: { left: 14 },
        didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 15 : finalY + 20; }
      });
    }

    // --- DÉTAIL DES VENTES ---
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('Détail des Ventes (Réussies)', 14, finalY);

    autoTable(doc, {
      startY: finalY + 2,
      theme: 'striped',
      head: [['Client', 'Zone', 'Prix Unitaire (MRU)', 'Qté','Total (MRU)','Frais (MRU)', 'Statut']],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      body: payeeOrders.map(o => [
        o.clientName,
        o.deliveryZone === 'Wilaya' ? o.address : 'Nouakchott',
        formatCurrency(o.price),
        o.quantity,
        formatCurrency(o.price * o.quantity),
        formatCurrency(o.deliveryCost || 0),
        STATUS_LABELS[o.status]
      ]),
      styles: { fontSize: 9 },
      margin: { left: 14 },
    });

    doc.save(`Rapport_${distributorName}_${new Date().toISOString().split('T')[0]}.pdf`);
    return true;

  } catch (err) {
    console.error('Erreur PDF:', err);
    throw err;
  }
};