import express from 'express';
import { getAllWines, getWineById, createWine, updateWine } from '../Controllers/wineController.js';
import { authMiddleware, requireAdmin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getAllWines);
router.get('/:id', getWineById);
router.post('/', authMiddleware, requireAdmin, createWine);
router.put('/:id', authMiddleware, requireAdmin, updateWine);

export default router;