"use client";
// Force dynamic rendering (évite erreurs prerendering)
export const dynamic = 'force-dynamic';


import { Suspense } from 'react';
import StructuresContent from './StructuresContent';

export default function StructuresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
      <StructuresContent />
    </Suspense>
  );
}
