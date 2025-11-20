'use client'
import React, { useEffect, useState } from 'react';
import { getUserMinistereStructures, getUserPermissionsInfo } from '../actions';
import { Filter } from 'lucide-react';
import { Ministere, Structure } from '@prisma/client';

type MinistereWithStructures = Ministere & {
  structures: Structure[]
}

type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
  message: string;
}

interface StructureSelectorProps {
  clerkId: string;
  selectedStructureId: string | undefined;
  onStructureChange: (structureId: string) => void;
  className?: string;
  showCurrentFilter?: boolean;
}

const StructureSelector = ({ clerkId, selectedStructureId, onStructureChange, className = '', showCurrentFilter = false }: StructureSelectorProps) => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [availableStructures, setAvailableStructures] = useState<MinistereWithStructures[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  // Fonction pour obtenir le nom d'une structure
  const getStructureName = (structureId: string): string => {
    if (!structureId || structureId === '') return 'Toutes les structures accessibles';
    
    for (const ministere of availableStructures) {
      const structure = ministere.structures?.find(s => s.id === structureId);
      if (structure) {
        return `${ministere.name} - ${structure.name}`;
      }
    }
    return `Structure (${structureId})`;
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!clerkId) return;
      
      try {
        const [permissions, structures] = await Promise.all([
          getUserPermissionsInfo(clerkId),
          getUserMinistereStructures(clerkId)
        ]);
        
        setUserPermissions(permissions);
        setAvailableStructures(structures || []);
        
        // Afficher le sélecteur si l'utilisateur a accès à plusieurs structures
        const canAccessMultipleStructures = permissions?.scope === 'all' || permissions?.scope === 'ministere';
        const hasMultipleStructures = structures && structures.some(m => m.structures && m.structures.length > 0);
        setShowSelector(canAccessMultipleStructures && hasMultipleStructures);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, [clerkId]);

  if (!showSelector) return null;

  return (
    <div className={`border-2 border-base-200 p-4 rounded-3xl mb-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-5 h-5 text-[#793205]" />
        <h3 className="font-bold text-[#793205]">
          Filtres du tableau de bord
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sélecteur de structure */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Structure :
          </label>
          <select 
            className="select select-bordered w-full select-sm"
            value={selectedStructureId || ''}
            onChange={(e) => onStructureChange(e.target.value)}
            title="Sélectionner une structure"
          >
            <option value="">Toutes les structures accessibles</option>
            {availableStructures.map(ministere => 
              ministere.structures?.map(structure => (
                <option key={structure.id} value={structure.id}>
                  {ministere.name} - {structure.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Filtre actuel */}
        {showCurrentFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtre actuel :
            </label>
            <div className="text-sm bg-blue-50 p-2 rounded border border-blue-200 text-blue-800">
              {getStructureName(selectedStructureId || '')}
            </div>
          </div>
        )}

        {/* Informations sur les permissions */}
        {userPermissions && !showCurrentFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau d&apos;accès :
            </label>
            <div className={`badge ${
              userPermissions.scope === 'all' ? 'badge-success' :
              userPermissions.scope === 'ministere' ? 'badge-info' :
              'badge-accent'
            }`}>
              {userPermissions.scope === 'all' ? 'Tous les ministères' :
               userPermissions.scope === 'ministere' ? 'Ministère' :
               'Structure'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StructureSelector;