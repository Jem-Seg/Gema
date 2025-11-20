import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getStructureStatistics } from '@/app/actions';
import StructureStatisticsComponent from '@/app/components/StructureStatistics';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function StructureStatisticsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { startDate, endDate } = await searchParams;
  
  // Parser les dates si fournies
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;
  
  // Récupérer les statistiques initiales
  const statistics = await getStructureStatistics(id, start, end);
  
  if (!statistics) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 lg:p-8">
      {/* Navigation */}
      <div className="mb-6">
        <Link 
          href="/admin/structures" 
          className="btn btn-ghost btn-sm gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux structures
        </Link>
      </div>

      {/* Titre de la page */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Statistiques de Structure</h1>
        <p className="text-base-content/70 mt-2">
          Analyse détaillée des alimentations et octrois par produit
        </p>
      </div>

      {/* Composant de statistiques */}
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }>
        <StructureStatisticsComponent 
          structureId={id} 
          initialData={statistics}
        />
      </Suspense>
    </div>
  );
}
