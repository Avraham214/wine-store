import express from 'express';
import { Wine } from '../Database/models/index.js';
import { authMiddleware, requireAdmin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/v1/wines - טעינת כל היינות
router.get('/', async (req, res) => {
  try {
    const wines = await Wine.findAll({ order: [['id', 'ASC']] });
    return res.status(200).json(wines);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/v1/wines/:id - טעינת יין לפי ID
router.get('/:id', async (req, res) => {
  try {
    const wine = await Wine.findByPk(req.params.id);
    if (!wine) return res.status(404).json({ error: 'Not Found', message: 'Wine not found' });
    return res.status(200).json(wine);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST /api/v1/wines - יצירת יין חדש (מנהל בלבד)
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, type, sweetness, vintage, alcohol_percentage, volume_ml, price, stock_quantity, description } = req.body;
    if (!name || !type || !sweetness || price === undefined) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }
    const newWine = await Wine.create({
      name, type, sweetness, vintage, alcohol_percentage,
      volume_ml: volume_ml ?? 750,
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity, 10) || 0,
      description
    });
    return res.status(201).json(newWine);
  } catch (error) {
    return res.status(400).json({ error: 'Bad Request', message: error.message });
  }
});

// PUT /api/v1/wines/:id - עדכון יין קיים (מנהל בלבד)
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const wine = await Wine.findByPk(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Not Found', message: 'Wine not found' });
    }

    const { name, price, stock_quantity, description } = req.body;

    // עדכון השדות ישירות במודל
    if (name !== undefined) wine.name = name;
    if (price !== undefined) wine.price = parseFloat(price);
    if (stock_quantity !== undefined) wine.stock_quantity = parseInt(stock_quantity, 10);
    if (description !== undefined) wine.description = description;

    await wine.save();

    return res.status(200).json(wine);
  } catch (error) {
    console.error('Error updating wine:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;