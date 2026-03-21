// src/components/CompanyHeader.tsx
import React from 'react';

interface CompanyHeaderProps {
  name?: string;           // Nom de l'entreprise, par défaut TIJARIC
  color?: string;          // Couleur du texte
  fontSize?: number;       // Taille du texte
  className?: string;      // Pour ajouter des classes CSS si besoin
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  name = 'TIJARIC',
  color = '#ffffffff',       // Bleu foncé
  fontSize = 24,
  className = '',
}) => {
  return (
    <div
      className={`top bg-blue-900 company-header ${className}`}
      style={{
        color,
        fontSize,
        fontWeight: 'bold',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {name}
    </div>
  );
};

export default CompanyHeader;