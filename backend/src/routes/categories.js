const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name');
    const categories = stmt.all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// Get category by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const category = stmt.get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la catégorie' });
  }
});

// Create a new category
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    const id = uuidv4();
    const stmt = db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)');
    stmt.run(id, name, description || null);
    
    res.status(201).json({ message: 'Catégorie créée avec succès', id });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

// Update a category
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    
    const checkStmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const existingCategory = checkStmt.get(req.params.id);
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    const stmt = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?');
    stmt.run(name || existingCategory.name, description !== undefined ? description : existingCategory.description, req.params.id);
    
    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
  }
});

// Delete a category
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const checkStmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    const category = checkStmt.get(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    // Check if category is in use
    const stockCheckStmt = db.prepare('SELECT COUNT(*) as count FROM stocks WHERE category_id = ?');
    const stockCount = stockCheckStmt.get(req.params.id);
    
    if (stockCount.count > 0) {
      return res.status(400).json({ error: 'Cette catégorie contient des stocks et ne peut pas être supprimée' });
    }
    
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    stmt.run(req.params.id);
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;
