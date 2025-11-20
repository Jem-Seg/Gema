import { NextRequest, NextResponse } from 'next/server';
import { getStructureStatistics } from '@/app/actions';

/**
 * API Route pour récupérer les statistiques détaillées d'une structure
 * GET /api/structures/[id]/statistics?startDate=...&endDate=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Récupérer les paramètres de date
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // Parser les dates si fournies
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
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
    
    // Récupérer les statistiques
    const statistics = await getStructureStatistics(id, startDate, endDate);
    
    if (!statistics) {
      return NextResponse.json(
        { error: 'Structure non trouvée ou erreur lors de la récupération des statistiques' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(statistics);
    
  } catch (error) {
    console.error('Erreur API statistiques structure:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
