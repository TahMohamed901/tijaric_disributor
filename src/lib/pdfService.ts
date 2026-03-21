import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Order, type Cycle, STATUS_LABELS } from './db';

export const generateDistributorReport = async (
    distributorName: string,
    cycle: Cycle,
    orders: Order[]
) => {
    try {
        const doc = new jsPDF();
        let finalY = 20;

        const today = new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // 1. Header
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(`Rapport Distributeur - ${distributorName}`, 14, finalY);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date: ${today}`, 14, finalY + 8);
        doc.text(`Cycle ID: ${cycle.id || 'N/A'} | Début: ${new Date(cycle.startDate).toLocaleDateString('fr-FR')}`, 14, finalY + 14);
        doc.text(`Stock Initial: ${cycle.initialStock} | Stock Restant: ${cycle.remainingStock}`, 14, finalY + 20);

        finalY += 30;

        // Helper for sections
        const addSectionTitle = (title: string, spacing = 10) => {
            if (finalY + spacing + 20 > 280) {
                doc.addPage();
                finalY = 20;
            } else {
                finalY += spacing;
            }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 14, finalY);
            finalY += 5;
        };

        // 2. Commandes Terminées
        const finishedOrders = orders.filter(o => o.status === 'TERMINEE');
        addSectionTitle('Commandes Terminées', 0);
        
        if (finishedOrders.length > 0) {
            autoTable(doc, {
                startY: finalY,
                head: [['N°', 'Client', 'Quantité', 'Prix Total', 'Status', 'Date']],
                body: finishedOrders.map((o, index) => [
                    index + 1,
                    o.clientName,
                    o.quantity,
                    `${(o.price * o.quantity + o.deliveryCost).toFixed(2)} MRU`,
                    STATUS_LABELS[o.status],
                    new Date(o.createdAt).toLocaleDateString('fr-FR')
                ]),
                theme: 'grid',
                headStyles: { fillColor: [46, 204, 113] }, // Green for success
                didDrawPage: (data: any) => { finalY = data.cursor!.y; }
            });
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text("Aucune commande terminée.", 14, finalY + 5);
            finalY += 10;
        }

        // 3. Commandes Transférables
        const transferableOrders = orders.filter(o => o.transferable || o.status === 'PARTIELLE');
        addSectionTitle('Commandes Transférables', 10);

        if (transferableOrders.length > 0) {
            autoTable(doc, {
                startY: finalY,
                head: [['N°', 'Client', 'Quantité', 'Status', 'Date Originale']],
                body: transferableOrders.map((o, index) => [
                    index + 1,
                    o.clientName,
                    o.quantity,
                    STATUS_LABELS[o.status],
                    new Date(o.createdAt).toLocaleDateString('fr-FR')
                ]),
                theme: 'grid',
                headStyles: { fillColor: [230, 126, 34] }, // Orange for pending/transferable
                didDrawPage: (data: any) => { finalY = data.cursor!.y; }
            });
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text("Aucune commande transférable.", 14, finalY + 5);
            finalY += 10;
        }

        // 4. Résumé Financier
        const totalNet = finishedOrders.reduce((sum, o) => sum + (o.price * o.quantity), 0);
        addSectionTitle('Résumé Financier', 10);
        autoTable(doc, {
            startY: finalY,
            head: [['Description', 'Valeur']],
            body: [
                ['Total Revenu Net (Produits)', `${totalNet.toFixed(2)} MRU`],
                ['Total Commandes Terminées', finishedOrders.length.toString()],
                ['Total Commandes Transférables', transferableOrders.length.toString()],
            ],
            theme: 'striped',
            headStyles: { fillColor: [52, 73, 94] },
            didDrawPage: (data: any) => { finalY = data.cursor!.y; }
        });

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 285);
        }

        doc.save(`Rapport_Distributeur_${cycle.id || 'C'}_${new Date().toISOString().split('T')[0]}.pdf`);
        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
