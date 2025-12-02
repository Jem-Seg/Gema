const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all stocks with optional filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    
    let query = `
      SELECT s.*, c.name as category_name 
      FROM stocks s 
      LEFT JOIN categories c ON s.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND s.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (low_stock === 'true') {
      query += ' AND s.quantity <= s.min_quantity';
    }

    query += ' ORDER BY s.updated_at DESC';

    const stmt = db.prepare(query);
    const stocks = stmt.all(...params);
    
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des stocks' });
  }
});

// Get stock by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM stocks s 
      LEFT JOIN categories c ON s.category_id = c.id 
      WHERE s.id = ?
    `);
    const stock = stmt.get(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock non trouvé' });
    }
    
    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du stock' });
  }
});

// Create a new stock item
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description, category_id, quantity, unit, min_quantity, location } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO stocks (id, name, description, category_id, quantity, unit, min_quantity, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, name, description || null, category_id || null, quantity || 0, unit || 'pièce', min_quantity || 0, location || null);
    
    // Record initial stock movement
    if (quantity && quantity > 0) {
      const movementId = uuidv4();
      const movementStmt = db.prepare(`
        INSERT INTO stock_movements (id, stock_id, type, quantity, reason, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      movementStmt.run(movementId, id, 'entrée', quantity, 'Stock initial', req.user.id);
    }
    
    res.status(201).json({ message: 'Stock créé avec succès', id });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création du stock' });
  }
});

// Update a stock item
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { name, description, category_id, unit, min_quantity, location } = req.body;
    
    const checkStmt = db.prepare('SELECT * FROM stocks WHERE id = ?');
    const existingStock = checkStmt.get(req.params.id);
    
    if (!existingStock) {
      return res.status(404).json({ error: 'Stock non trouvé' });
    }
    
    const stmt = db.prepare(`
      UPDATE stocks 
      SET name = ?, description = ?, category_id = ?, unit = ?, min_quantity = ?, location = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      name || existingStock.name,
      description !== undefined ? description : existingStock.description,
      category_id !== undefined ? category_id : existingStock.category_id,
      unit || existingStock.unit,
      min_quantity !== undefined ? min_quantity : existingStock.min_quantity,
      location !== undefined ? location : existingStock.location,
      req.params.id
    );
    
    res.json({ message: 'Stock mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
  }
});

// Stock movement (entry/exit)
router.post('/:id/movement', authenticateToken, (req, res) => {
  try {
    const { type, quantity, reason } = req.body;
    
    if (!type || !['entrée', 'sortie'].includes(type)) {
      return res.status(400).json({ error: 'Type de mouvement invalide (entrée ou sortie)' });
    }
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantité invalide' });
    }
    
    const checkStmt = db.prepare('SELECT * FROM stocks WHERE id = ?');
    const stock = checkStmt.get(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock non trouvé' });
    }
    
    let newQuantity;
    if (type === 'entrée') {
      newQuantity = stock.quantity + quantity;
    } else {
      if (stock.quantity < quantity) {
        return res.status(400).json({ error: 'Quantité insuffisante en stock' });
      }
      newQuantity = stock.quantity - quantity;
    }
    
    // Update stock quantity
    const updateStmt = db.prepare('UPDATE stocks SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    updateStmt.run(newQuantity, req.params.id);
    
    // Record movement
    const movementId = uuidv4();
    const movementStmt = db.prepare(`
      INSERT INTO stock_movements (id, stock_id, type, quantity, reason, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    movementStmt.run(movementId, req.params.id, type, quantity, reason || null, req.user.id);
    
    res.json({ message: 'Mouvement enregistré', new_quantity: newQuantity });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du mouvement' });
  }
});

// Get stock movements
router.get('/:id/movements', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT sm.*, u.username 
      FROM stock_movements sm 
      LEFT JOIN users u ON sm.user_id = u.id 
      WHERE sm.stock_id = ?
      ORDER BY sm.created_at DESC
    `);
    const movements = stmt.all(req.params.id);
    
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des mouvements' });
  }
});

// Delete a stock item
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const checkStmt = db.prepare('SELECT * FROM stocks WHERE id = ?');
    const stock = checkStmt.get(req.params.id);
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock non trouvé' });
    }
    
    // Delete related movements first
    const deleteMovements = db.prepare('DELETE FROM stock_movements WHERE stock_id = ?');
    deleteMovements.run(req.params.id);
    
    // Delete stock
    const stmt = db.prepare('DELETE FROM stocks WHERE id = ?');
    stmt.run(req.params.id);
    
    res.json({ message: 'Stock supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du stock' });
  }
});

module.exports = router;
