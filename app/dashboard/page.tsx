'use client'

import React from 'react'
import Wrapper from '../components/Wrapper'
import { useSession } from 'next-auth/react';
import { getUserMinistereStructures, getUserPermissionsInfo } from '../actions';
import ProductOverview from '../components/ProductOverview';
import CategoryChart from '../components/CategoryChart ';
import RecentTransactions from '../components/RecentTransactions';
import StockSummaryTable from '../components/StockSummaryTable';
import StructureSelector from '../components/StructureSelector';
import DashboardStats from '../components/DashboardStats';
import TrendsOverview from '../components/TrendsOverview';
import TopProductsWidget from '../components/TopProductsWidget';


type UserPermissions = {
  canCreate: boolean;
  canRead: boolean;
  scope: string;
}

type UserData = {
  structureId?: string;
  ministereId?: string;
  isAdmin?: boolean;
  role?: {
    name: string;
  };
}

const Page = () => {

  const { data: session, status } = useSession()
  const user = session?.user
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)
  const [userData, setUserData] = React.useState<UserData | null>(null)
  // Par défaut, afficher toutes les structures du ministère (chaîne vide)
  const [selectedStructureId, setSelectedStructureId] = React.useState<string | undefined>("")
  // Charger les informations de permissions de l'utilisateur
  React.useEffect(() => {
    if (status !== 'authenticated' || !(user as any)?.id) return;

    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissionsInfo((user as any).id);
        setUserPermissions(permissions);

        // Récupérer aussi les structures de l'utilisateur pour avoir l'ID
        const userStructures = await getUserMinistereStructures((user as any).id);
        console.log('🏢 Dashboard - User structures:', userStructures);
        

        
        if (userStructures && userStructures.length > 0) {
          // Si c'est un agent de saisie, prendre sa structure
          // Sinon prendre la première structure disponible
          const firstStructure = userStructures[0]?.structures?.[0];
          if (firstStructure) {
            console.log('✅ Dashboard - Setting userData:', { structureId: firstStructure.id, ministereId: userStructures[0]?.id });
            setUserData({
              structureId: firstStructure.id,
              ministereId: userStructures[0]?.id
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    };
    loadPermissions();
  }, [status, user])

  return (
    <Wrapper>
      {/* Sélecteur global de structure pour les utilisateurs avec accès étendu */}
      {(user as any)?.id && (
        <StructureSelector
          clerkId={(user as any).id}
          selectedStructureId={selectedStructureId}
          onStructureChange={setSelectedStructureId}
          showCurrentFilter={true}
        />
      )}

      {/* Statistiques en haut du dashboard */}
      <DashboardStats structureId={selectedStructureId !== undefined ? selectedStructureId : userData?.structureId} />
      
      <div className='flex flex-col lg:flex-row gap-4'>
        {/* Colonne principale gauche */}
        <div className='lg:w-2/3 space-y-4'>
          {(user as any)?.id && (
            <ProductOverview
              clerkId={(user as any).id}
              structureId={selectedStructureId}
            />
          )}
          
          {(user as any)?.id ? (
            <>
              {console.log('🎯 Dashboard - About to render CategoryChart with:', { clerkId: (user as any).id, structureId: selectedStructureId })}
              <CategoryChart
                clerkId={(user as any).id}
                structureId={selectedStructureId}
              />
            </>
          ) : (
            <div>Chargement des données...</div>
          )}
          
          {(user as any)?.id && (
            <RecentTransactions
              clerkId={(user as any).id}
              structureId={selectedStructureId}
            />
          )}
        </div>
        
        {/* Colonne droite - Stocks et Tendances */}
        <div className='lg:w-1/3 space-y-4'>
          {(user as any)?.id ? (
            <>
              {console.log('🎯 Dashboard - Rendering StockSummaryTable with selectedStructure:', selectedStructureId, 'userData:', userData)}
              <StockSummaryTable
                clerkId={(user as any).id}
                structureId={selectedStructureId !== undefined ? selectedStructureId : userData?.structureId}
              />
              
              {/* Top Produits */}
              <TopProductsWidget
                structureId={selectedStructureId !== undefined ? selectedStructureId : userData?.structureId}
              />
              
              {/* Tendances */}
              <TrendsOverview
                structureId={selectedStructureId !== undefined ? selectedStructureId : userData?.structureId}
              />
            </>
          ) : (
            <div className='border-2 border-base-200 p-6 rounded-3xl'>
              <h2 className="text-xl font-bold mb-4 text-[#793205]">
                Résumé des Stocks
              </h2>
              <div className="text-center py-8 text-gray-500">
                Utilisateur non connecté...
              </div>
            </div>
          )}
        </div>
      </div>

    </Wrapper>
  )
}

export default Page
