'use client'
import React from 'react';

const TestComponent = () => {
  console.log('🧪 TestComponent - Component is rendering');
  
  return (
    <div className='border-2 border-red-500 p-6 rounded-3xl bg-red-50'>
      <h2 className="text-xl font-bold mb-4 text-red-700">
        Composant de Test
      </h2>
      <p className="text-red-600">
        Ce composant de test s&apos;affiche pour vérifier que le rendu fonctionne.
      </p>
      <div className="mt-4 text-sm text-red-500">
        Heure de rendu: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default TestComponent;