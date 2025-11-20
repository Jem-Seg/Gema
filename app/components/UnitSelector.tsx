'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface UnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

// Unités prédéfinies
const PREDEFINED_UNITS = [
  { value: 'tonne', label: 'Tonne (t)' },
  { value: 'kilogramme', label: 'Kilogramme (kg)' },
  { value: 'gramme', label: 'Gramme (g)' },
  { value: 'milligramme', label: 'Milligramme (mg)' },
  { value: 'hectare', label: 'Hectare (ha)' },
  { value: 'kilomètre', label: 'Kilomètre (km)' },
  { value: 'mètre', label: 'Mètre (m)' },
  { value: 'centimètre', label: 'Centimètre (cm)' },
  { value: 'millimètre', label: 'Millimètre (mm)' },
  { value: 'metre-carre', label: 'Mètre carré (m²)' },
  { value: 'metre-cube', label: 'Mètre cube (m³)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'centilitre', label: 'Centilitre (cL)' },
  { value: 'millilitre', label: 'Millilitre (mL)' },
  { value: 'forfait', label: 'Forfait (ff)' },
  { value: 'heure', label: 'Heure (h)' },
  { value: 'piece', label: 'Pièce (pc)' },
  { value: 'pack', label: 'Pack' },
];

const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange, className = '', required = false }) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [customUnits, setCustomUnits] = useState<Array<{ value: string; label: string }>>([]);

  React.useEffect(() => {
    // Si l'unité actuelle n'est ni prédéfinie ni déjà dans customUnits, l'ajouter
    if (value && 
        !PREDEFINED_UNITS.some(u => u.value === value) && 
        !customUnits.some(u => u.value === value)) {
      setCustomUnits(prev => {
        // Vérifier à nouveau pour éviter les doublons lors de re-renders rapides
        if (prev.some(u => u.value === value)) {
          return prev;
        }
        return [...prev, { value, label: value }];
      });
    }
  }, [value, customUnits]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === '__custom__') {
      setShowCustomInput(true);
      setCustomUnit('');
    } else {
      setShowCustomInput(false);
      onChange(selectedValue);
    }
  };

  const handleAddCustomUnit = () => {
    if (!customUnit.trim()) return;

    // Créer la nouvelle unité
    const newUnit = {
      value: customUnit.trim().toLowerCase().replace(/\s+/g, '-'),
      label: customUnit.trim()
    };

    // Vérifier si l'unité existe déjà dans les unités prédéfinies ou personnalisées
    const exists = [...PREDEFINED_UNITS, ...customUnits].some(
      u => u.value === newUnit.value || u.label.toLowerCase() === newUnit.label.toLowerCase()
    );

    if (exists) {
      alert('Cette unité existe déjà');
      return;
    }

    // Ajouter l'unité personnalisée
    setCustomUnits(prev => [...prev, newUnit]);
    onChange(newUnit.value);
    setShowCustomInput(false);
    setCustomUnit('');
  };

  const handleCancelCustom = () => {
    setShowCustomInput(false);
    setCustomUnit('');
  };

  const handleRemoveCustomUnit = (unitValue: string) => {
    setCustomUnits(prev => prev.filter(u => u.value !== unitValue));
    if (value === unitValue) {
      onChange('');
    }
  };

  // Combiner les unités prédéfinies et personnalisées, en évitant les doublons
  const allUnits = React.useMemo(() => {
    const predefinedValues = new Set(PREDEFINED_UNITS.map(u => u.value));
    const uniqueCustomUnits = customUnits.filter(cu => !predefinedValues.has(cu.value));
    return [...PREDEFINED_UNITS, ...uniqueCustomUnits];
  }, [customUnits]);

  return (
    <div className="space-y-2">
      {!showCustomInput ? (
        <div className="flex gap-2">
          <select
            className={`select select-bordered flex-1 ${className}`}
            value={value}
            onChange={handleSelectChange}
            aria-label="Sélectionner une unité"
            required={required}
          >
            <option value="">Choisir une unité...</option>
            {allUnits.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
            <option value="__custom__" className="text-primary font-semibold">
              ➕ Ajouter une unité personnalisée...
            </option>
          </select>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ex: Boîte, Carton, Unité..."
            className="input input-bordered flex-1"
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomUnit();
              } else if (e.key === 'Escape') {
                handleCancelCustom();
              }
            }}
            autoFocus
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddCustomUnit}
            disabled={!customUnit.trim()}
            title="Ajouter l'unité"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleCancelCustom}
            title="Annuler"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Liste des unités personnalisées avec option de suppression */}
      {customUnits.length > 0 && !showCustomInput && (
        <div className="flex flex-wrap gap-2 mt-2">
          {customUnits.map((unit) => (
            <div
              key={unit.value}
              className="badge badge-info gap-2 py-3 px-3"
            >
              <span>{unit.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveCustomUnit(unit.value)}
                className="hover:text-error transition-colors"
                aria-label={`Supprimer ${unit.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnitSelector;
