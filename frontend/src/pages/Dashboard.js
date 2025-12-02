import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stockService, categoryService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStocks: 0,
    totalCategories: 0,
    lowStockItems: 0,
    totalValue: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stocks, categories] = await Promise.all([
          stockService.getAll(),
          categoryService.getAll()
        ]);

        const lowStock = stocks.filter(s => s.quantity <= s.min_quantity);

        setStats({
          totalStocks: stocks.length,
          totalCategories: categories.length,
          lowStockItems: lowStock.length,
          totalValue: stocks.reduce((sum, s) => sum + s.quantity, 0)
        });

        setLowStockItems(lowStock.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalStocks}</h3>
            <p>Articles en stock</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{stats.totalCategories}</h3>
            <p>Catégories</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.lowStockItems}</h3>
            <p>Stocks bas</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalValue}</h3>
            <p>Total unités</p>
          </div>
        </div>
      </div>
      
      {lowStockItems.length > 0 && (
        <div className="low-stock-section">
          <h2>⚠️ Articles en stock bas</h2>
          <div className="low-stock-list">
            {lowStockItems.map(item => (
              <div key={item.id} className="low-stock-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-category">{item.category_name || 'Sans catégorie'}</span>
                </div>
                <div className="item-quantity">
                  <span className="current">{item.quantity}</span>
                  <span className="separator">/</span>
                  <span className="minimum">{item.min_quantity}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/stocks?low_stock=true" className="btn-view-all">
            Voir tous les articles en stock bas →
          </Link>
        </div>
      )}
      
      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <Link to="/stocks/new" className="action-card">
            <span className="action-icon">➕</span>
            <span>Nouveau stock</span>
          </Link>
          <Link to="/categories" className="action-card">
            <span className="action-icon">🏷️</span>
            <span>Gérer catégories</span>
          </Link>
          <Link to="/stocks" className="action-card">
            <span className="action-icon">📋</span>
            <span>Liste des stocks</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
