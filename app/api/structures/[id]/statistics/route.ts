import { NextRequest, NextResponse } from 'next/server';
import { getStructureStatistics, getAllStructuresStatistics } from '@/app/actions';
import { auth } from '@/lib/auth';

/**
 * API Route pour récupérer les statistiques détaillées d'une structure
 * GET /api/structures/[id]/statistics?startDate=...&endDate=...
 * Si id est vide ou "all", retourne les statistiques agrégées de toutes les structures accessibles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    console.log('🔍 [API Statistics] ID reçu:', JSON.stringify(id), 'Type:', typeof id);
    
    // Récupérer les paramètres de date
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    console.log('📅 [API Statistics] Dates:', { startDateParam, endDateParam });
    
    // Parser les dates si fournies (accepte les formats ISO complets)
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    console.log('📅 [API Statistics] Dates parsées:', { 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString() 
    });
    
    // Valider les dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date de début invalide' },
        { status: 400 }
      );
    }
    
    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date de fin invalide' },
        { status: 400 }
      );
    }
    
    // Si id est vide ou "all", récupérer les stats de toutes les structures accessibles
    if (!id || id === '' || id === 'all') {
      console.log('🌍 [API Statistics] Mode agrégé détecté - récupération de toutes les structures');
      
      const session = await auth();
      
      if (!session?.user) {
        console.error('❌ [API Statistics] Utilisateur non authentifié');
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
      
      const userId = (session.user as any).id;
      console.log('👤 [API Statistics] User ID:', userId);
      
      const statistics = await getAllStructuresStatistics(userId, startDate, endDate);
      
      if (!statistics) {
        console.error('❌ [API Statistics] Aucune statistique retournée');
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des statistiques' },
          { status: 500 }
        );
      }
      
      console.log('✅ [API Statistics] Statistiques agrégées récupérées');
      return NextResponse.json(statistics);
    }
    
    // Récupérer les statistiques d'une structure spécifique
    console.log('🏢 [API Statistics] Mode structure spécifique - ID:', id);
    const statistics = await getStructureStatistics(id, startDate, endDate);
    
    if (!statistics) {
      console.error('❌ [API Statistics] Structure non trouvée ou erreur');
      return NextResponse.json(
        { error: 'Structure non trouvée ou erreur lors de la récupération des statistiques' },
        { status: 404 }
      );
    }
    
    console.log('✅ [API Statistics] Statistiques structure récupérées');
    return NextResponse.json(statistics);
    
  } catch (error) {
    console.error('❌ [API Statistics] Erreur exception:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
