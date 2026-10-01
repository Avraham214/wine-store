import express from 'express';
import { getAllAdminOrders, updateOrderStatus, getMyOrders, createOrder } from '../Controllers/orderController.js';
import { authMiddleware, requireAdmin } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', authMiddleware, requireAdmin, getAllAdminOrders);
router.put('/admin/:id/status', authMiddleware, requireAdmin, updateOrderStatus);
router.get('/my-orders', authMiddleware, getMyOrders);
router.post('/', authMiddleware, createOrder);

export default router;