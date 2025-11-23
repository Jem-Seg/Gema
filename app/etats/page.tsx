'use client';
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Wrapper from '@/app/components/Wrapper';
import { 
  FileText, 
  Package, 
  Building, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  History,
  Calendar
} from 'lucide-react';
import EtatStockGeneral from '@/app/components/etats/EtatStockGeneral';
import EtatStockParStructure from '@/app/components/etats/EtatStockParStructure';
import EtatAlertes from '@/app/components/etats/EtatAlertes';
import BonEntree from '@/app/components/etats/BonEntree';
import BonSortie from '@/app/components/etats/BonSortie';
import MouvementsPeriode from '@/app/components/etats/MouvementsPeriode';
import HistoriqueArticle from '@/app/components/etats/HistoriqueArticle';
import HistoriqueStructure from '@/app/components/etats/HistoriqueStructure';

interface Structure {
  id: string;
  name: string;
  abreviation?: string;
  ministere: {
    id: string;
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

interface Produit {
  id: string;
  name: string;
}

type TypeEtat = 
  | 'stock-general'
  | 'stock-article'
  | 'stock-structure'
  | 'stock-alertes'
  | 'bon-entree'
  | 'bon-sortie'
  | 'mouvements-periode'
  | 'historique-article'
  | 'historique-structure';

export default function EtatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStructures, setUserStructures] = useState<Ministere[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  
  // Sélections
  const [typeEtat, setTypeEtat] = useState<TypeEtat | null>(null);
  const [structureId, setStructureId] = useState<string>('');
  const [produitId, setProduitId] = useState<string>('');
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  
  // Pour les bons (alimentations/octrois)
  const [alimentations, setAlimentations] = useState<any[]>([]);
  const [octrois, setOctrois] = useState<any[]>([]);
  const [alimentationId, setAlimentationId] = useState<string>('');
  const [octroiId, setOctroiId] = useState<string>('');
  
  // Affichage
  const [showEtat, setShowEtat] = useState(false);

  // Charger les structures accessibles
  useEffect(() => {
    const loadUserStructures = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        return;
      }

      try {
        const response = await fetch(`/api/user/${session.user.id}`);
        if (!response.ok) {
          if (response.status === 403) {
            router.push('/admin/verify');
            return;
          }
          throw new Error('Erreur lors du chargement des structures');
        }

        const data = await response.json();
        setUserStructures(data.structures || []);
      } catch (error) {
        console.error('❌ Erreur chargement structures:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStructures();
  }, [status, session, router]);

  // Charger les produits selon la structure sélectionnée
  useEffect(() => {
    const loadProduits = async () => {
      if (!structureId) {
        setProduits([]);
        return;
      }

      try {
        const response = await fetch(`/api/produits?structureId=${structureId}`);
        if (response.ok) {
          const data = await response.json();
          setProduits(data.produits || data.data || []);
        } else {
          console.error('Erreur API produits:', response.status);
        }
      } catch (error) {
        console.error('❌ Erreur chargement produits:', error);
      }
    };

    loadProduits();
  }, [structureId]);

  // Charger les alimentations/octrois selon la structure
  useEffect(() => {
    const loadMouvements = async () => {
      if (!structureId) {
        setAlimentations([]);
        setOctrois([]);
        return;
      }

      try {
        // Charger les alimentations
        if (typeEtat === 'bon-entree') {
          const response = await fetch(`/api/alimentations?structureId=${structureId}`);
          if (response.ok) {
            const data = await response.json();
            setAlimentations(data.alimentations || []);
          } else {
            console.error('Erreur API alimentations:', response.status);
          }
        }

        // Charger les octrois
        if (typeEtat === 'bon-sortie') {
          const response = await fetch(`/api/octrois?structureId=${structureId}`);
          if (response.ok) {
            const data = await response.json();
            setOctrois(data.octrois || []);
          } else {
            console.error('Erreur API octrois:', response.status);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement mouvements:', error);
      }
    };

    loadMouvements();
  }, [structureId, typeEtat]);

  const handleGenererEtat = () => {
    if (!typeEtat) return;
    
    // Validation selon le type d'état
    if (['stock-article', 'historique-article'].includes(typeEtat) && !produitId) {
      alert('Veuillez sélectionner un article');
      return;
    }
    
    if (['stock-structure', 'historique-structure'].includes(typeEtat) && !structureId) {
      alert('Veuillez sélectionner une structure');
      return;
    }

    if (typeEtat === 'bon-entree' && !alimentationId) {
      alert('Veuillez sélectionner une alimentation');
      return;
    }

    if (typeEtat === 'bon-sortie' && !octroiId) {
      alert('Veuillez sélectionner un octroi');
      return;
    }

    setShowEtat(true);
  };

  const categoriesEtats = [
    {
      titre: 'États de Suivi du Stock',
      icon: Package,
      color: 'blue',
      etats: [
        { id: 'stock-general', label: 'État Général du Stock', icon: FileText },
        { id: 'stock-article', label: 'État du Stock par Article', icon: Package },
        { id: 'stock-structure', label: 'État du Stock par Structure', icon: Building },
        { id: 'stock-alertes', label: 'Seuils d\'Alerte', icon: AlertTriangle },
      ],
    },
    {
      titre: 'Mouvements du Stock',
      icon: TrendingUp,
      color: 'green',
      etats: [
        { id: 'bon-entree', label: 'Bon d\'Entrée (Alimentation)', icon: TrendingUp },
        { id: 'bon-sortie', label: 'Bon de Sortie (Octroi)', icon: TrendingDown },
        { id: 'mouvements-periode', label: 'Mouvements sur Période', icon: Calendar },
        { id: 'historique-article', label: 'Historique par Article', icon: History },
        { id: 'historique-structure', label: 'Historique par Structure', icon: Building },
      ],
    },
  ];

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

  return (
    <Wrapper>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-3xl mb-2">
              <FileText className="w-8 h-8 text-primary" />
              États Imprimables
            </h1>
            <p className="text-base-content/70">
              Générez et imprimez les différents états de suivi du stock et des mouvements
            </p>
          </div>
        </div>

        {!showEtat ? (
          <>
            {/* Sélection du type d'état */}
            <div className="space-y-6">
              {categoriesEtats.map((categorie) => (
                <div key={categorie.titre} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title flex items-center gap-2">
                      <categorie.icon className={`w-6 h-6 text-${categorie.color}-500`} />
                      {categorie.titre}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {categorie.etats.map((etat) => (
                        <button
                          key={etat.id}
                          onClick={() => setTypeEtat(etat.id as TypeEtat)}
                          className={`btn btn-lg justify-start gap-3 ${
                            typeEtat === etat.id ? 'btn-primary' : 'btn-outline'
                          }`}
                        >
                          <etat.icon className="w-5 h-5" />
                          {etat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire de configuration */}
            {typeEtat && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">Configuration de l&apos;État</h3>
                  
                  <div className="space-y-4">
                    {/* Sélection structure */}
                    {!['stock-general', 'stock-alertes'].includes(typeEtat) && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Structure</span>
                        </label>
                        <select
                          className="select select-bordered"
                          value={structureId}
                          onChange={(e) => setStructureId(e.target.value)}
                        >
                          <option value="">-- Sélectionner une structure --</option>
                          {userStructures.map((ministere) =>
                            ministere.structures?.map((structure) => (
                              <option key={structure.id} value={structure.id}>
                                {structure.name} ({ministere.abreviation})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}

                    {/* Sélection produit */}
                    {['stock-article', 'historique-article'].includes(typeEtat) && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Article</span>
                        </label>
                        <select
                          className="select select-bordered"
                          value={produitId}
                          onChange={(e) => setProduitId(e.target.value)}
                          disabled={!structureId}
                        >
                          <option value="">-- Sélectionner un article --</option>
                          {produits.map((produit) => (
                            <option key={produit.id} value={produit.id}>
                              {produit.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sélection alimentation */}
                    {typeEtat === 'bon-entree' && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Alimentation</span>
                        </label>
                        <select
                          className="select select-bordered"
                          value={alimentationId}
                          onChange={(e) => setAlimentationId(e.target.value)}
                          disabled={!structureId}
                        >
                          <option value="">-- Sélectionner une alimentation --</option>
                          {alimentations.length === 0 && structureId && (
                            <option value="" disabled>Aucune alimentation disponible</option>
                          )}
                          {alimentations.map((alim: any) => (
                            <option key={alim.id} value={alim.id}>
                              {alim.numero} - {alim.produit?.name || 'Produit inconnu'} ({new Date(alim.createdAt).toLocaleDateString('fr-FR')})
                            </option>
                          ))}
                        </select>
                        {structureId && alimentations.length === 0 && (
                          <label className="label">
                            <span className="label-text-alt text-warning">Aucune alimentation trouvée pour cette structure</span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Sélection octroi */}
                    {typeEtat === 'bon-sortie' && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Octroi</span>
                        </label>
                        <select
                          className="select select-bordered"
                          value={octroiId}
                          onChange={(e) => setOctroiId(e.target.value)}
                          disabled={!structureId}
                        >
                          <option value="">-- Sélectionner un octroi --</option>
                          {octrois.length === 0 && structureId && (
                            <option value="" disabled>Aucun octroi disponible</option>
                          )}
                          {octrois.map((oct: any) => (
                            <option key={oct.id} value={oct.id}>
                              {oct.numero} - {oct.produit?.name || 'Produit inconnu'} ({new Date(oct.createdAt).toLocaleDateString('fr-FR')})
                            </option>
                          ))}
                        </select>
                        {structureId && octrois.length === 0 && (
                          <label className="label">
                            <span className="label-text-alt text-warning">Aucun octroi trouvé pour cette structure</span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Période */}
                    {['mouvements-periode', 'historique-article', 'historique-structure'].includes(typeEtat) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Date début</span>
                          </label>
                          <input
                            type="date"
                            className="input input-bordered"
                            value={dateDebut}
                            onChange={(e) => setDateDebut(e.target.value)}
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-semibold">Date fin</span>
                          </label>
                          <input
                            type="date"
                            className="input input-bordered"
                            value={dateFin}
                            onChange={(e) => setDateFin(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bouton générer */}
                    <div className="flex gap-2 justify-end mt-6">
                      <button
                        onClick={() => setTypeEtat(null)}
                        className="btn btn-ghost"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleGenererEtat}
                        className="btn btn-primary gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Générer l&apos;État
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Bouton retour */}
            <div>
              <button
                onClick={() => setShowEtat(false)}
                className="btn btn-ghost gap-2"
              >
                ← Retour à la sélection
              </button>
            </div>

            {/* Affichage de l'état */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {typeEtat === 'stock-general' && (
                  <EtatStockGeneral structureId={structureId} />
                )}
                
                {typeEtat === 'stock-structure' && structureId && (
                  <EtatStockParStructure structureId={structureId} />
                )}
                
                {typeEtat === 'stock-alertes' && (
                  <EtatAlertes structureId={structureId} type="tous" />
                )}
                
                {typeEtat === 'bon-entree' && alimentationId && (
                  <BonEntree alimentationId={alimentationId} />
                )}
                
                {typeEtat === 'bon-sortie' && octroiId && (
                  <BonSortie octroiId={octroiId} />
                )}
                
                {typeEtat === 'mouvements-periode' && (
                  <MouvementsPeriode 
                    structureId={structureId}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                    type="tous"
                  />
                )}
                
                {typeEtat === 'historique-article' && produitId && (
                  <HistoriqueArticle 
                    produitId={produitId}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                  />
                )}
                
                {typeEtat === 'historique-structure' && structureId && (
                  <HistoriqueStructure 
                    structureId={structureId}
                    dateDebut={dateDebut}
                    dateFin={dateFin}
                  />
                )}
                
                {/* États non encore implémentés */}
                {typeEtat && !['stock-general', 'stock-structure', 'stock-alertes', 'bon-entree', 'bon-sortie', 'mouvements-periode', 'historique-article', 'historique-structure'].includes(typeEtat) && (
                  <div className="alert alert-info">
                    <FileText className="w-6 h-6" />
                    <div>
                      <div className="font-bold">État {typeEtat}</div>
                      <div className="text-sm">Composant en cours de développement</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Wrapper>
  );
}
