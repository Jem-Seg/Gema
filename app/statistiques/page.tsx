'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import StructureStatisticsComponent from '@/app/components/StructureStatistics';
import { Building, Calendar } from 'lucide-react';

interface Structure {
  id: string;
  name: string;
  abreviation?: string;
  ministere: {
    name: string;
    abreviation: string;
  };
}

interface Ministere {
  id: string;
  name: string;
  abreviation: string;
  structures: Structure[];
}

export default function StatistiquesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStructures, setUserStructures] = useState<Ministere[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<string>('');
  const [showStats, setShowStats] = useState(false);

  // Charger les structures accessibles par l'utilisateur
  useEffect(() => {
    const loadUserStructures = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        console.log('🔒 Pas authentifié ou pas d\'ID utilisateur');
        return;
      }

      try {
        console.log('📡 Chargement des structures pour user:', session.user.id);
        const response = await fetch(`/api/user/${session.user.id}`);
        console.log('📡 Réponse API /api/user status:', response.status);
        
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/admin/verify');
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Erreur API user:', errorData);
          throw new Error('Erreur lors du chargement des structures');
        }

        const data = await response.json();
        console.log('✅ Données user reçues:', data);
        const structures = data.structures || [];
        console.log('📋 Structures trouvées:', structures.length);
        
        setUserStructures(structures);
        
        // Sélectionner automatiquement la première structure si une seule disponible
        if (structures.length === 1 && structures[0].structures?.length === 1) {
          const autoSelectedId = structures[0].structures[0].id;
          console.log('🎯 Auto-sélection de la structure:', autoSelectedId);
          setSelectedStructure(autoSelectedId);
        }
      } catch (error) {
        console.error('❌ Erreur chargement structures:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStructures();
  }, [status, session, router]);

  const handleStructureSelect = (structureId: string) => {
    setSelectedStructure(structureId);
    setShowStats(false);
  };

  const handleShowStats = () => {
    if (selectedStructure) {
      setShowStats(true);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Wrapper>
    );
  }

  if (status !== 'authenticated') {
    router.push('/sign-in');
    return null;
  }

  // Obtenir la structure sélectionnée
  const selectedStructureData = userStructures
    .flatMap(m => m.structures)
    .find(s => s.id === selectedStructure);

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-2">
              <Building className="w-8 h-8 text-primary" />
              Statistiques par Structure
            </h1>
            <p className="text-base-content/70">
              Consultez les statistiques détaillées d&apos;alimentation et d&apos;octroi pour chaque structure
            </p>
          </div>
        </div>

        {/* Sélection de la structure */}
        {!showStats && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Sélectionner une structure</h2>
              
              {userStructures.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
                  <p className="text-base-content/70">
                    Aucune structure accessible. Contactez un administrateur.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop - Grille de cartes */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userStructures.map((ministere) =>
                      ministere.structures?.map((structure) => (
                        <div
                          key={structure.id}
                          onClick={() => handleStructureSelect(structure.id)}
                          className={`card border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                            selectedStructure === structure.id
                              ? 'border-primary bg-primary/5'
                              : 'border-base-300 hover:border-primary/50'
                          }`}
                        >
                          <div className="card-body p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  selectedStructure === structure.id
                                    ? 'bg-primary text-primary-content'
                                    : 'bg-base-200'
                                }`}
                              >
                                <Building className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm leading-tight mb-1">
                                  {structure.name}
                                </h3>
                                {structure.abreviation && (
                                  <div className="badge badge-info badge-xs mb-2">
                                    {structure.abreviation}
                                  </div>
                                )}
                                <p className="text-xs text-base-content/60">
                                  {ministere.abreviation}
                                </p>
                              </div>
                              {selectedStructure === structure.id && (
                                <div className="badge badge-primary badge-sm">✓</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Mobile - Select dropdown */}
                  <div className="md:hidden">
                    <label className="label">
                      <span className="label-text font-semibold">Choisir une structure</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={selectedStructure}
                      onChange={(e) => handleStructureSelect(e.target.value)}
                      title="Sélectionner une structure"
                    >
                      <option value="">-- Sélectionner --</option>
                      {userStructures.map((ministere) =>
                        ministere.structures?.map((structure) => (
                          <option key={structure.id} value={structure.id}>
                            {structure.name} ({ministere.abreviation})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Informations sur la structure sélectionnée */}
                  {selectedStructureData && (
                    <div className="alert alert-info">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          <div>
                            <h3 className="font-semibold">{selectedStructureData.name}</h3>
                            <p className="text-sm">
                              Ministère : {selectedStructureData.ministere.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bouton de validation */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleShowStats}
                      disabled={!selectedStructure}
                      className="btn btn-primary gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Afficher les statistiques
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Affichage des statistiques */}
        {showStats && selectedStructure && (
          <>
            {/* Bouton retour */}
            <div>
              <button
                onClick={() => setShowStats(false)}
                className="btn btn-ghost btn-sm gap-2"
              >
                ← Changer de structure
              </button>
            </div>

            {/* Composant de statistiques */}
            <StructureStatisticsComponent structureId={selectedStructure} />
          </>
        )}
      </div>
    </Wrapper>
  );
}
