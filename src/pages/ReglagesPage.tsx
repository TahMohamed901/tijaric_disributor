import { useState, useRef, useEffect } from 'react';
import { useDistributorStore } from '../stores/distributorStore';
import { Settings, Save, Package, User, DollarSign, Download, Upload, Trash2, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { forceReloadFromServer } from '../lib/utils';

export default function ReglagesPage() {
  const { settings, updateSettings, exportData, importData, resetData } = useDistributorStore();
  
  const [form, setForm] = useState({
    distributorName: settings?.distributorName || '',
    productName: settings?.productName || '',
    unitPrice: settings?.unitPrice?.toString() || '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      distributorName: settings?.distributorName || '',
      productName: settings?.productName || '',
      unitPrice: settings?.unitPrice?.toString() || '',
    });
  }, [settings]);

  

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

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const currentDateTime = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `backup_distributeur_${currentDateTime}.json`;
      const file = new File([blob], filename, { type: 'application/json' });

      const downloadFallback = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Sauvegarde téléchargée avec succès');
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Sauvegarde Distributeur',
            text: 'Voici la sauvegarde de mes données',
          });
          toast.success('Sauvegarde réussie');
        } catch (shareError: any) {
          if (shareError.name === 'AbortError' || shareError.message?.includes('AbortError')) {
            // Utilisateur a annulé le partage, on ne fait rien
            return;
          }
          console.warn('Erreur du partage natif, fallback vers le téléchargement...', shareError);
          downloadFallback();
        }
      } else {
        downloadFallback();
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm("Êtes-vous sûr de vouloir remplacer vos données actuelles ? Cette action est irréversible.")) {
      try {
        const text = await file.text();
        await importData(text);
        toast.success('Données restaurées avec succès');
      } catch (error) {
        toast.error('Erreur lors de la restauration. Fichier invalide.');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (window.confirm("⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer toutes les commandes et l'historique des cycles ?\n\nVos paramètres (Nom et Prix) seront conservés.\n\nCette action est IRRÉVERSIBLE.")) {
      try {
        await resetData();
        toast.success('Données de vente réinitialisées');
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation');
      }
    }
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

      {/* Backup & Restore Section */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text)', marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Database size={18} color="var(--color-accent)" />
        Gestion des données
      </h2>

      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', borderRadius: '0.75rem',
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Download size={18} />
            Sauvegarder mes données
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Exporte vos ventes pour les envoyer sur WhatsApp ou Drive.
          </p>
        </div>

        <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            style={{ display: 'none' }} 
          />
          <button 
            onClick={handleImportClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', borderRadius: '0.75rem',
              background: 'transparent', border: '1px solid var(--color-border)',
              color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Upload size={18} />
            Restaurer une sauvegarde
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Remplace les données actuelles par une ancienne sauvegarde.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
        <button 
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '1rem', borderRadius: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Trash2 size={18} />
          Réinitialiser les données de vente
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
          Vide la liste des commandes et des cycles. Conserve vos paramètres.
        </p>
      </div>

    </div>
  );
}
