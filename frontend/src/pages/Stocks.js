import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { stockService, categoryService } from '../services/api';
import './Stocks.css';

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    low_stock: searchParams.get('low_stock') === 'true'
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksData, categoriesData] = await Promise.all([
        stockService.getAll(filters),
        categoryService.getAll()
      ]);
      setStocks(stocksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await stockService.delete(id);
        setStocks(stocks.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting stock:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="stocks-page">
      <div className="page-header">
        <h1>Gestion des Stocks</h1>
        <Link to="/stocks/new" className="btn-primary">
          ➕ Nouveau stock
        </Link>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="category-select"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <label className="low-stock-filter">
          <input
            type="checkbox"
            checked={filters.low_stock}
            onChange={(e) => handleFilterChange('low_stock', e.target.checked)}
          />
          Stocks bas uniquement
        </label>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : stocks.length === 0 ? (
        <div className="empty-state">
          <p>Aucun stock trouvé</p>
          <Link to="/stocks/new" className="btn-primary">
            Créer votre premier stock
          </Link>
        </div>
      ) : (
        <div className="stocks-grid">
          {stocks.map(stock => (
            <div 
              key={stock.id} 
              className={`stock-card ${stock.quantity <= stock.min_quantity ? 'low-stock' : ''}`}
            >
              <div className="stock-header">
                <h3>{stock.name}</h3>
                <span className="category-badge">{stock.category_name || 'Sans catégorie'}</span>
              </div>
              
              <p className="stock-description">{stock.description || 'Aucune description'}</p>
              
              <div className="stock-info">
                <div className="quantity-display">
                  <span className="quantity">{stock.quantity}</span>
                  <span className="unit">{stock.unit}</span>
                </div>
                {stock.quantity <= stock.min_quantity && (
                  <span className="warning-badge">⚠️ Stock bas</span>
                )}
              </div>
              
              <div className="stock-meta">
                {stock.location && (
                  <span className="location">📍 {stock.location}</span>
                )}
                <span className="min-quantity">Min: {stock.min_quantity}</span>
              </div>
              
              <div className="stock-actions">
                <Link to={`/stocks/${stock.id}`} className="btn-view">
                  Voir détails
                </Link>
                <Link to={`/stocks/${stock.id}/edit`} className="btn-edit">
                  Modifier
                </Link>
                <button onClick={() => handleDelete(stock.id)} className="btn-delete">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stocks;
