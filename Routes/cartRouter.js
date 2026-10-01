import express from 'express';
import { getCart, addToCart, removeFromCart } from '../Controllers/cartController.js';
import authMiddleware from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:id', removeFromCart);

export default router;