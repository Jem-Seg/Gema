import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import './Categories.css';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await categoryService.update(editingId, formData);
      } else {
        await categoryService.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await categoryService.delete(id);
        setCategories(categories.filter(c => c.id !== id));
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>Gestion des Catégories</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            ➕ Nouvelle catégorie
          </button>
        )}
      </div>

      {showForm && (
        <div className="category-form-card">
          <h3>{editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Annuler
              </button>
              <button type="submit" className="btn-submit">
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <p>Aucune catégorie créée</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Créer votre première catégorie
          </button>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description || 'Aucune description'}</p>
              </div>
              <div className="category-actions">
                <button onClick={() => handleEdit(category)} className="btn-edit">
                  ✏️ Modifier
                </button>
                <button onClick={() => handleDelete(category.id)} className="btn-delete">
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
