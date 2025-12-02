import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { stockService, categoryService } from '../services/api';
import './StockForm.css';

const StockForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    quantity: 0,
    unit: 'pièce',
    min_quantity: 0,
    location: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await categoryService.getAll();
        setCategories(categoriesData);
        
        if (isEdit) {
          const stock = await stockService.getById(id);
          setFormData({
            name: stock.name,
            description: stock.description || '',
            category_id: stock.category_id || '',
            quantity: stock.quantity,
            unit: stock.unit,
            min_quantity: stock.min_quantity,
            location: stock.location || ''
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erreur lors du chargement des données');
      }
    };
    
    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await stockService.update(id, formData);
      } else {
        await stockService.create(formData);
      }
      navigate('/stocks');
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-form-page">
      <div className="form-container">
        <h1>{isEdit ? 'Modifier le stock' : 'Nouveau stock'}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category_id">Catégorie</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Sans catégorie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Emplacement</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Quantité {!isEdit && '*'}</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                disabled={isEdit}
              />
              {isEdit && (
                <small>Utilisez les mouvements pour modifier la quantité</small>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="unit">Unité</label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="min_quantity">Quantité minimum (alerte)</label>
            <input
              type="number"
              id="min_quantity"
              name="min_quantity"
              value={formData.min_quantity}
              onChange={handleChange}
              min="0"
            />
          </div>
          
          <div className="form-actions">
            <Link to="/stocks" className="btn-cancel">
              Annuler
            </Link>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockForm;
