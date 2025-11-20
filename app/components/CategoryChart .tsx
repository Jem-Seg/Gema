import { ChartData } from '@/type';
import React, { useEffect, useState } from 'react'
import { getProductCategoryDistribution } from '../actions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell, Legend } from 'recharts';

const CategoryChart = ({ clerkId, structureId }: { clerkId: string; structureId?: string }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Palette de couleurs rétro élégantes
  const COLORS = ['#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A'];
  const ACCENT_COLOR = '#793205';
  const BG_COLOR = '#FEF3C7';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 CategoryChart - Fetching stats for clerkId:', clerkId, 'structureId:', structureId);
        if (clerkId) {
          const result = await getProductCategoryDistribution(clerkId, structureId);
          console.log('📊 CategoryChart - Raw result:', result);
          console.log('📊 CategoryChart - Result type:', typeof result, 'Array?', Array.isArray(result));

          if (result && Array.isArray(result)) {
            setData(result);
            console.log('✅ CategoryChart - Data set successfully, count:', result.length);
            console.log('📋 CategoryChart - First item:', result[0]);
          } else {
            console.log('⚠️ CategoryChart - No valid data received');
            setData([]);
          }
        }
      } catch (error) {
        console.error('❌ CategoryChart - Erreur lors de la récupération des statistiques:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clerkId, structureId]);

  // Calculer le total des produits
  const totalProducts = data.reduce((acc, item) => acc + item.pv, 0);
  const maxValue = Math.max(...data.map(item => item.pv), 0);

  // Custom tooltip avec design rétro
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = totalProducts > 0 ? ((payload[0].value / totalProducts) * 100).toFixed(1) : '0';
      return (
        <div className="bg-amber-50 border-2 border-amber-600 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-amber-900 mb-1">{payload[0].payload.name}</p>
          <p className="text-amber-800 text-sm">
            <span className="font-semibold">{payload[0].value}</span> produits
          </p>
          <p className="text-amber-700 text-xs mt-1">
            {percentage}% du total
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    console.log('📊 CategoryChart - Rendering chart with data:', data);
    return (
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={data}
          margin={{
            top: 30,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          barCategoryGap="20%"
        >
          <defs>
            {COLORS.map((color, index) => (
              <linearGradient key={`gradient-${index}`} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D97706" opacity={0.2} />
          <XAxis
            dataKey="name"
            axisLine={{ stroke: ACCENT_COLOR, strokeWidth: 2 }}
            tickLine={false}
            hide={true}
            height={20}
          />
          <YAxis
            axisLine={{ stroke: ACCENT_COLOR, strokeWidth: 2 }}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: ACCENT_COLOR,
              fontWeight: '500'
            }}
            label={{
              value: 'Nombre de produits',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 13, fill: ACCENT_COLOR, fontWeight: 'bold' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(217, 119, 6, 0.1)' }} />
          <Bar
            dataKey="pv"
            radius={[12, 12, 0, 0]}
            maxBarSize={100}
          >
            <LabelList
              fill={ACCENT_COLOR}
              dataKey="pv"
              position="top"
              style={{ fontSize: '15px', fontWeight: 'bold', textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
            />
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#colorGradient${index % COLORS.length})`}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };


  return (
    <div className='border-2 border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-6 rounded-3xl shadow-lg'>
      {/* En-tête avec statistiques */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Top 5 Catégories
          </h2>
          <div className="badge badge-warning badge-lg font-bold">
            {totalProducts} produits
          </div>
        </div>

        {/* Statistiques rapides */}
        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-700 font-medium">Catégorie #1</p>
              <p className="text-lg font-bold text-amber-900">{data[0]?.name.substring(0, 10)}{data[0]?.name.length > 10 ? '...' : ''}</p>
              <p className="text-sm text-amber-700">{data[0]?.pv} produits</p>
            </div>
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 text-center">
              <p className="text-xs text-orange-700 font-medium">Maximum</p>
              <p className="text-2xl font-bold text-orange-900">{maxValue}</p>
              <p className="text-xs text-orange-700">produits/cat.</p>
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
              <p className="text-xs text-yellow-800 font-medium">Catégories</p>
              <p className="text-2xl font-bold text-yellow-900">{data.length}</p>
              <p className="text-xs text-yellow-800">affichées</p>
            </div>
          </div>
        )}
      </div>

      {/* Graphique */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-96">
          <span className="loading loading-spinner loading-lg text-amber-600"></span>
          <p className="mt-4 text-amber-700 font-medium">Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-amber-600">
          <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="font-semibold text-lg">Aucune donnée disponible</p>
          <p className="text-sm mt-2">Les statistiques s'afficheront ici une fois les produits ajoutés</p>
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
}

export default CategoryChart
