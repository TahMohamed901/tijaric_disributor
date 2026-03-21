// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { type Order, type Cycle, STATUS_LABELS } from './db';

// export const generateDistributorReport = async (
//   distributorName: string,
//   cycle: Cycle,
//   orders: Order[]
// ) => {
//   try {
//     const doc = new jsPDF('p', 'mm', 'a4');
//     let finalY = 20;

//     const today = new Date().toLocaleDateString('fr-FR', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });

//     // ================= HEADER STYLÉ =================
//     doc.setFillColor(41, 128, 185); // bleu entreprise
//     doc.rect(0, 0, 210, 25, 'F'); // rectangle header

//     doc.setFontSize(16);
//     doc.setTextColor(255, 255, 255);
//     doc.setFont('helvetica', 'bold');
//     doc.text(`📊 Rapport Distributeur - ${distributorName}`, 14, 17);

//     doc.setFontSize(10);
//     doc.setFont('helvetica', 'normal');
//     doc.text(`Date: ${today}`, 150, 12);
//     doc.text(`Cycle ID: ${cycle.id || 'N/A'}`, 150, 17);
//     doc.text(`Stock Initial: ${cycle.initialStock}`, 150, 22);
//     doc.text(`Stock Restant: ${cycle.remainingStock}`, 150, 27);

//     finalY = 35;

//     // Helper pour sections
//     const addSectionTitle = (title: string, color: [number, number, number] = [52, 73, 94]) => {
//       if (finalY + 10 > 280) {
//         doc.addPage();
//         finalY = 20;
//       }
//       doc.setFillColor(...color);
//       doc.rect(14, finalY, 182, 8, 'F'); // rectangle section header
//       doc.setFontSize(12);
//       doc.setTextColor(255, 255, 255);
//       doc.setFont('helvetica', 'bold');
//       doc.text(title, 16, finalY + 6);
//       finalY += 10;
//     };

//     // ================= KPI / Stock =================
//     const finishedOrders = orders.filter(o => o.status === 'TERMINEE' || o.status === 'PAYEE');
//     const cancelledOrders = orders.filter(o => o.status === 'ANNULEE');
//     const inProgressOrders = orders.filter(o => !['TERMINEE', 'PAYEE', 'ANNULEE'].includes(o.status));
//     const totalOrders = orders.length;
//     const totalSold = finishedOrders.reduce((sum, o) => sum + o.quantity, 0);

//     addSectionTitle('📊 Résumé Global', [41, 128, 185]);

//     autoTable(doc, {
//       startY: finalY,
//       theme: 'grid',
//       head: [['Indicateur', 'Valeur']],
//       body: [
//         ['Total Commandes', totalOrders],
//         ['Commandes Terminées/Payées', finishedOrders.length],
//         ['Commandes Annulées', cancelledOrders.length],
//         ['Commandes en Cours', inProgressOrders.length],
//         ['Quantité Vendue', totalSold],
//         ['Stock Initial', cycle.initialStock],
//         ['Stock Restant', cycle.remainingStock]
//       ],
//       headStyles: { fillColor: [41, 128, 185], textColor: 255 },
//       styles: { fontSize: 10 },
//       didDrawPage: (data: any) => { finalY = data.cursor.y + 5; }
//     });

//     // ================= ANALYSE FINANCIERE =================
//     const paidOrders = finishedOrders;
//     const grossRevenue = paidOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
//     const deliveryCosts = orders.reduce((sum, o) => sum + (o.reachedDelivery ? o.deliveryCost : 0), 0);
//     const netRevenue = grossRevenue - deliveryCosts;

//     addSectionTitle('💰 Analyse Financière', [39, 174, 96]);

//     autoTable(doc, {
//       startY: finalY,
//       head: [['Indicateur', 'Montant']],
//       body: [
//         ["Chiffre d'Affaires Brut", `${grossRevenue.toLocaleString()} MRU`],
//         ['Total Frais Livraison', `${deliveryCosts.toLocaleString()} MRU`],
//         ['Revenu Net', `${netRevenue.toLocaleString()} MRU`],
//       ],
//       theme: 'grid',
//       headStyles: { fillColor: [39, 174, 96], textColor: 255 },
//       styles: { fontSize: 10 },
//       didDrawPage: (data: any) => { finalY = data.cursor.y + 5; }
//     });

//     // ================= ANALYSE PAIEMENTS =================
//     const prepaidOrders = orders.filter(o => o.paymentMethod === 'Prépayé');
//     const onDeliveryOrders = orders.filter(o => o.paymentMethod === 'À la livraison');
//     const unpaidOrders = orders.filter(o => !['PAYEE', 'TERMINEE'].includes(o.status));

//     addSectionTitle('💳 Analyse Paiements', [155, 89, 182]);

//     autoTable(doc, {
//       startY: finalY,
//       head: [['Type Paiement', 'Nombre Commandes']],
//       body: [
//         ['Prépayé', prepaidOrders.length],
//         ['À la livraison', onDeliveryOrders.length],
//         ['Non encore finalisées (Non payées)', unpaidOrders.length],
//       ],
//       theme: 'grid',
//       headStyles: { fillColor: [155, 89, 182], textColor: 255 },
//       styles: { fontSize: 10 },
//       didDrawPage: (data: any) => { finalY = data.cursor.y + 5; }
//     });

//     // ================= ANALYSE GEOGRAPHIQUE =================
//     const nouakchottOrders = orders.filter(o => o.deliveryZone === 'Nouakchott');
//     const wilayaOrders = orders.filter(o => o.deliveryZone === 'Wilaya');

//     const wilayaMap: Record<string, number> = {};
//     wilayaOrders.forEach(o => {
//       // For Wilaya orders, the 'address' field stores the selected Wilaya name
//       const wilayaName = o.address || 'Inconnu';
//       if (!wilayaMap[wilayaName]) wilayaMap[wilayaName] = 0;
//       wilayaMap[wilayaName]++;
//     });

//     addSectionTitle('🌍 Analyse Géographique', [241, 196, 15]);

//     autoTable(doc, {
//       startY: finalY,
//       head: [['Zone', 'Nombre Commandes']],
//       body: [
//         ['Nouakchott', nouakchottOrders.length],
//         ['Wilayas (Total)', wilayaOrders.length],
//         ...Object.entries(wilayaMap).map(([w, c]) => [w, c])
//       ],
//       theme: 'grid',
//       headStyles: { fillColor: [241, 196, 15], textColor: 0 },
//       styles: { fontSize: 10 },
//       didDrawPage: (data: any) => { finalY = data.cursor.y + 5; }
//     });

//     // ================= COMMANDES DETAIL =================
//     addSectionTitle('📋 Commandes Détail', [231, 76, 60]);

//     if (orders.length > 0) {
//       autoTable(doc, {
//         startY: finalY,
//         head: [['N°', 'Client', 'Zone', 'Quantité', 'Prix Total', 'Status', 'Date']],
//         body: orders.map((o, index) => [
//           index + 1,
//           o.clientName,
//           o.deliveryZone + (o.deliveryZone === 'Wilaya' ? ` (${o.address})` : ''),
//           o.quantity,
//           `${(o.price * o.quantity).toLocaleString()} MRU`,
//           STATUS_LABELS[o.status],
//           new Date(o.createdAt).toLocaleDateString('fr-FR')
//         ]),
//         theme: 'grid',
//         headStyles: { fillColor: [231, 76, 60], textColor: 255 },
//         styles: { fontSize: 9 },
//         didDrawPage: (data: any) => { finalY = data.cursor.y + 5; }
//       });
//     }

//     // ================= FOOTER =================
//     const pageCount = (doc as any).internal.getNumberOfPages();
//     for (let i = 1; i <= pageCount; i++) {
//       doc.setPage(i);
//       doc.setFontSize(8);
//       doc.setTextColor(100);
//       doc.text(
//         `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleString('fr-FR')}`,
//         14,
//         290
//       );
//     }

//     doc.save(`Rapport_Distributeur_${cycle.id || 'C'}_${new Date().toISOString().split('T')[0]}.pdf`);

//     return true;
//   } catch (err) {
//     console.error('Erreur génération PDF:', err);
//     throw err;
//   }
// };


// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { type Order, type Cycle, STATUS_LABELS } from './db';

// export const generateDistributorReport = async (
//   distributorName: string,
//   productName: string,
//   unitPrice: number,
//   cycle: Cycle,
//   orders: Order[]
// ) => {
//   try {
//     const doc = new jsPDF('p', 'mm', 'a4');
//     const today = new Date().toLocaleDateString('fr-FR', {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//     });

//     // --- ENTÊTE SIMPLE ---
//     doc.setFontSize(18);
//     doc.setFont('helvetica', 'bold');
//     doc.text(`Rapport Distributeur - ${distributorName}`, 14, 20);
    
//     doc.setFontSize(11);
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(100);
//     doc.text(today, 14, 28);
    
//     // Ligne de séparation fine
//     doc.setDrawColor(200);
//     doc.line(14, 32, 196, 32);

//     let finalY = 40;

//     // --- CALCULS ---
//     const finishedOrders = orders.filter(o => o.status === 'TERMINEE' || o.status === 'PAYEE');
//     const grossRevenue = finishedOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
//     const deliveryCosts = orders.reduce((sum, o) => sum + (o.reachedDelivery ? o.deliveryCost : 0), 0);
//     const netRevenue = grossRevenue - deliveryCosts;

//     // --- RÉSUMÉ DES REVENUS (Style simple) ---
//     doc.setFontSize(14);
//     doc.setTextColor(0);
//     doc.text('Résumé des Revenus', 14, finalY);
    
//     autoTable(doc, {
//       startY: finalY + 5,
//       theme: 'plain', // Style sans fond coloré
//       head: [['Catégorie', 'Montant (MRU)']],
//       body: [
//         ['Chiffre d\'Affaires Brut', `${grossRevenue.toLocaleString()}`],
//         ['Frais de Livraison', `${deliveryCosts.toLocaleString()}`],
//         ['TOTAL NET', { content: `${netRevenue.toLocaleString()}`, styles: { fontStyle: 'bold' } }],
//       ],
//       headStyles: { fontStyle: 'bold', textColor: 0, lineWidth: 0.1 },
//       margin: { left: 14 },
//       didDrawPage: (data) => { if (data.cursor) finalY = data.cursor.y + 15; }
//     });

//     // --- RÉSUMÉ DU STOCK ---
//     doc.setFontSize(14);
//     doc.text('Résumé du Stock', 14, finalY);

//     autoTable(doc, {
//       startY: finalY + 5,
//       theme: 'plain',
//       head: [['Indicateur', 'Quantité']],
//       body: [
//         ['Stock Initial', cycle.initialStock],
//         ['Vendu', finishedOrders.reduce((sum, o) => sum + o.quantity, 0)],
//         ['Stock Restant', cycle.remainingStock],
//       ],
//       headStyles: { fontStyle: 'bold', textColor: 0 },
//       margin: { left: 14 },
//       didDrawPage: (data) => { if (data.cursor) finalY = data.cursor.y + 15; }
//     });

//     // --- DÉTAILS DES COMMANDES ---
//     doc.setFontSize(14);
//     doc.text('Détail des Commandes', 14, finalY);

//     autoTable(doc, {
//       startY: finalY + 5,
//       theme: 'striped', // Uniquement des lignes légères pour la lecture
//       head: [['Client', 'Zone', 'Qté', 'Total (MRU)', 'Statut']],
//       body: orders.map(o => [
//         o.clientName,
//         o.deliveryZone === 'Wilaya' ? o.address : 'Nouakchott',
//         o.quantity,
//         (o.price * o.quantity).toLocaleString(),
//         STATUS_LABELS[o.status]
//       ]),
//       headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold' },
//       styles: { fontSize: 9 },
//       margin: { left: 14 },
//     });

//     // --- SAUVEGARDE ---
//     doc.save(`Rapport_${distributorName}_${new Date().toISOString().split('T')[0]}.pdf`);
//     return true;

//   } catch (err) {
//     console.error('Erreur:', err);
//     throw err;
//   }
// };
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { type Order, type Cycle, type Delivery, STATUS_LABELS } from './db';

// export const generateServiceReport = async (
//   serviceName: string,
//   productName: string,
//   unitPrice: number,
//   cycle: Cycle,
//   orders: Order[],
//   deliveries: Delivery[]
// ) => {
//   try {
//     const doc = new jsPDF('p', 'mm', 'a4');
//     const today = new Date().toLocaleDateString('fr-FR', {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//     });

//     // --- EN-TÊTE ---
//     doc.setFontSize(18);
//     doc.setTextColor(40, 40, 40);
//     doc.setFont('helvetica', 'bold');
//     doc.text(`Rapport de Service`, 14, 20);
    
//     doc.setFontSize(10);
//     doc.setFont('helvetica', 'normal');
//     doc.setTextColor(100);
//     doc.text(`${serviceName} | ${today}`, 14, 26);
    
//     doc.setDrawColor(200);
//     doc.line(14, 30, 196, 30);

//     let finalY = 40;

//     // --- SECTION : DÉTAILS DU PRODUIT ---
//     doc.setFontSize(12);
//     doc.setTextColor(41, 128, 185);
//     doc.text('Détails du Produit', 14, finalY);
    
//     autoTable(doc, {
//       startY: finalY + 2,
//       theme: 'plain',
//       body: [
//         ['Produit :', productName],
//         ['Prix Unitaire :', `${unitPrice.toLocaleString('fr-FR', { useGrouping: true })} MRU`],
//       ],
//       columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
//       margin: { left: 14 },
//       didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 12 : finalY + 20; }
//     });

//     // --- CALCULS ---
//     const payeeOrders = orders.filter(o => o.status === 'PAYEE');
    
//     const grossRevenue = payeeOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
//     const reachedDeliveryOrders = orders.filter(o => o.reachedDelivery);
//     const totalDeliveryCosts = reachedDeliveryOrders.reduce((sum, o) => sum + (o.deliveryCost || 0), 0);
//     const netRevenue = grossRevenue - totalDeliveryCosts;

//     const criticalCancellations = orders.filter(o => o.status === 'ANNULEE' && o.reachedDelivery);
//     const totalSent = reachedDeliveryOrders.length;
//     const failureRate = totalSent > 0 ? (criticalCancellations.length / totalSent) * 100 : 0;

//     // --- SECTION : RÉSUMÉ DES REVENUS ---
//     doc.setFontSize(12);
//     doc.setTextColor(41, 128, 185);
//     doc.text('Résumé Financier', 14, finalY);
    
//     autoTable(doc, {
//       startY: finalY + 2,
//       theme: 'plain',
//       head: [['Catégorie', 'Montant (MRU)']],
//       body: [
//         ['Chiffre d\'Affaires Brut (PAYÉES)', grossRevenue.toLocaleString('fr-FR', { useGrouping: true }) + ' MRU'],
//         ['Total Frais de Transport', `- ${totalDeliveryCosts.toLocaleString('fr-FR', { useGrouping: true }) + ' MRU'}`],
//         ['NET À ENCAISSER', { content: `${netRevenue.toLocaleString('fr-FR', { useGrouping: true }) + ' MRU'}`, styles: { fontStyle: 'bold' } }],
//         ['Taux d\'Échec (après envoi)', `${failureRate.toFixed(1)}%`],
//       ],
//       headStyles: { 
//         textColor: 0, 
//         fontStyle: 'bold',
//         lineWidth: { bottom: 0.1 }, 
//         lineColor: 200 
//       },
//       margin: { left: 14 },
//       didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 12 : finalY + 20; }
//     });

//     // --- SECTION : GESTION DU STOCK ---
//     const green: [number, number, number] = [39, 174, 96];
//     const orange: [number, number, number] = [243, 156, 18];
//     const red: [number, number, number] = [231, 76, 60];
//     const boldStyle = 'bold' as const;

//     const totalVendu = payeeOrders.reduce((sum, o) => sum + o.quantity, 0);
//     const totalRetourne = orders.filter(o => o.status === 'ANNULEE').reduce((sum, o) => sum + o.quantity, 0);
    
//     doc.setFontSize(12);
//     doc.setTextColor(41, 128, 185);
//     doc.text('Gestion du Stock', 14, finalY);

//     autoTable(doc, {
//       startY: finalY + 2,
//       theme: 'plain',
//       head: [['Indicateur', 'Quantité']],
//       body: [
//         ['Stock Initial', String(cycle.initialStock)],
//         ['Stock Vendu (Payé)', { content: String(totalVendu), styles: { textColor: green, fontStyle: boldStyle } }],
//         ['Stock Retourné (Annulé)', { content: String(totalRetourne), styles: { textColor: red } }],
//         ['Stock Physique Restant', { content: String(cycle.remainingStock), styles: { fontStyle: boldStyle } }],
//       ],
//       headStyles: { 
//         textColor: 0, 
//         fontStyle: boldStyle, 
//         lineWidth: { bottom: 0.1 }, 
//         lineColor: 200 
//       },
//       margin: { left: 14 },
//       didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 15 : finalY + 20; }
//     });

//     // --- SECTION : PERTES SUR LIVRAISONS INFRUCTUEUSES ---
//     if (criticalCancellations.length > 0) {
//       doc.setFontSize(12);
//       doc.setTextColor(231, 76, 60); // Rouge pour les pertes
//       doc.text('Pertes sur Livraisons Infructueuses', 14, finalY);

//       autoTable(doc, {
//         startY: finalY + 2,
//         theme: 'striped',
//         head: [['Client', 'Livreur', 'Frais Perdu (MRU)']],
//         headStyles: { fillColor: [231, 76, 60], textColor: 255 },
//         body: criticalCancellations.map(o => {
//           const delivery = deliveries.find(d => d.orderId === o.id);
//           return [
//             o.clientName,
//             delivery ? delivery.deliveryName : 'N/A',
//             (o.deliveryCost || 0).toLocaleString('fr-FR', { useGrouping: true })
//           ];
//         }),
//         styles: { fontSize: 9 },
//         margin: { left: 14 },
//         didDrawPage: (data) => { finalY = data.cursor ? data.cursor.y + 15 : finalY + 20; }
//       });
//     }

//     // --- SECTION : DÉTAIL DES VENTES ---
//     doc.setFontSize(12);
//     doc.setTextColor(41, 128, 185);
//     doc.text('Détail des Ventes (Réussies)', 14, finalY);

//     autoTable(doc, {
//       startY: finalY + 2,
//       theme: 'striped',
//       head: [['Client', 'Zone', 'Qté', 'Frais (MRU)', 'Total (MRU)', 'Statut']],
//       headStyles: { fillColor: [41, 128, 185], textColor: 255 },
//       body: payeeOrders.map(o => [
//         o.clientName,
//         o.deliveryZone === 'Wilaya' ? o.address : 'Nouakchott',
//         o.quantity,
//         (o.deliveryCost || 0).toLocaleString('fr-FR', { useGrouping: true }) + ' MRU',
//         (o.price * o.quantity).toLocaleString('fr-FR', { useGrouping: true }) + ' MRU',
//         STATUS_LABELS[o.status]
//       ]),
//       styles: { fontSize: 9 },
//       margin: { left: 14 },
//     });

//     doc.save(`Rapport_Service_${serviceName}_${new Date().toISOString().split('T')[0]}.pdf`);
//     return true;

//   } catch (err) {
//     console.error('Erreur PDF Service:', err);
//     throw err;
//   }
// };

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
        ['Prix Unitaire :', formatCurrency(unitPrice)],
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
      head: [['Client', 'Zone', 'Qté', 'Frais (MRU)', 'Total (MRU)', 'Statut']],
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      body: payeeOrders.map(o => [
        o.clientName,
        o.deliveryZone === 'Wilaya' ? o.address : 'Nouakchott',
        o.quantity,
        formatCurrency(o.deliveryCost || 0),
        formatCurrency(o.price * o.quantity),
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