import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { stockService } from '../services/api';
import './StockDetail.css';

const StockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementData, setMovementData] = useState({
    type: 'entrée',
    quantity: 1,
    reason: ''
  });
  const [movementError, setMovementError] = useState('');

  useEffect(() => {
    fetchStockData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchStockData = async () => {
    try {
      const [stockData, movementsData] = await Promise.all([
        stockService.getById(id),
        stockService.getMovements(id)
      ]);
      setStock(stockData);
      setMovements(movementsData);
    } catch (error) {
      console.error('Error fetching stock:', error);
      navigate('/stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    setMovementError('');

    try {
      await stockService.addMovement(id, movementData);
      setShowMovementForm(false);
      setMovementData({ type: 'entrée', quantity: 1, reason: '' });
      fetchStockData();
    } catch (err) {
      setMovementError(err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!stock) {
    return <div className="error">Stock non trouvé</div>;
  }

  return (
    <div className="stock-detail-page">
      <div className="detail-header">
        <div className="header-info">
          <Link to="/stocks" className="back-link">← Retour aux stocks</Link>
          <h1>{stock.name}</h1>
          <span className="category-badge">{stock.category_name || 'Sans catégorie'}</span>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowMovementForm(!showMovementForm)} 
            className="btn-movement"
          >
            {showMovementForm ? 'Annuler' : '➕ Mouvement'}
          </button>
          <Link to={`/stocks/${id}/edit`} className="btn-edit">
            ✏️ Modifier
          </Link>
        </div>
      </div>

      {showMovementForm && (
        <div className="movement-form-card">
          <h3>Nouveau mouvement de stock</h3>
          {movementError && <div className="error-message">{movementError}</div>}
          <form onSubmit={handleMovementSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Type de mouvement</label>
                <select
                  value={movementData.type}
                  onChange={(e) => setMovementData({...movementData, type: e.target.value})}
                >
                  <option value="entrée">Entrée (ajout)</option>
                  <option value="sortie">Sortie (retrait)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={movementData.quantity}
                  onChange={(e) => setMovementData({...movementData, quantity: parseInt(e.target.value, 10)})}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Motif (optionnel)</label>
              <input
                type="text"
                value={movementData.reason}
                onChange={(e) => setMovementData({...movementData, reason: e.target.value})}
                placeholder="Ex: Réapprovisionnement, Distribution..."
              />
            </div>
            <button type="submit" className="btn-submit">
              Enregistrer le mouvement
            </button>
          </form>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-card main-info">
          <h2>Informations</h2>
          <div className="info-item">
            <span className="label">Description</span>
            <span className="value">{stock.description || 'Aucune description'}</span>
          </div>
          <div className="info-item">
            <span className="label">Emplacement</span>
            <span className="value">{stock.location || 'Non défini'}</span>
          </div>
          <div className="info-grid">
            <div className="info-box">
              <span className="box-value">{stock.quantity}</span>
              <span className="box-label">{stock.unit}</span>
            </div>
            <div className={`info-box ${stock.quantity <= stock.min_quantity ? 'warning' : ''}`}>
              <span className="box-value">{stock.min_quantity}</span>
              <span className="box-label">Minimum</span>
            </div>
          </div>
          {stock.quantity <= stock.min_quantity && (
            <div className="alert-low-stock">
              ⚠️ Le stock est en dessous du seuil minimum !
            </div>
          )}
        </div>

        <div className="detail-card movements-card">
          <h2>Historique des mouvements</h2>
          {movements.length === 0 ? (
            <p className="no-movements">Aucun mouvement enregistré</p>
          ) : (
            <div className="movements-list">
              {movements.map(movement => (
                <div key={movement.id} className={`movement-item ${movement.type}`}>
                  <div className="movement-info">
                    <span className={`movement-type ${movement.type}`}>
                      {movement.type === 'entrée' ? '📥' : '📤'} {movement.type}
                    </span>
                    <span className="movement-quantity">
                      {movement.type === 'entrée' ? '+' : '-'}{movement.quantity} {stock.unit}
                    </span>
                  </div>
                  {movement.reason && (
                    <p className="movement-reason">{movement.reason}</p>
                  )}
                  <div className="movement-meta">
                    <span>Par: {movement.username || 'Inconnu'}</span>
                    <span>{new Date(movement.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
