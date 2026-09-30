import express from 'express';
import { sequelize, Order, OrderItem, CartItem, Wine } from '../Database/models/index.js';
import { authMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/v1/orders/my-orders
 * @desc    Fetch all past orders for the logged-in user
 */
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.userId },
      include: [{
        model: OrderItem,
        include: [{ model: Wine, attributes: ['name', 'price', 'type'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * @route   POST /api/v1/orders
 * @desc    Process order checkout from cart
 */
router.post('/', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.userId },
      include: [Wine],
      transaction
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Bad Request', message: 'Cart is empty' });
    }

    let totalPrice = 0;
    for (const item of cartItems) {
      if (item.Wine.stock_quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Bad Request',
          message: `Insufficient stock for wine: ${item.Wine.name}`
        });
      }
      totalPrice += item.quantity * item.Wine.price;
    }

    const order = await Order.create({
      user_id: req.userId,
      total_price: totalPrice,
      status: 'pending',
      shipping_address: req.body.shipping_address || req.user.address || 'Standard Delivery'
    }, { transaction });

    for (const item of cartItems) {
      await OrderItem.create({
        order_id: order.id,
        wine_id: item.wine_id,
        quantity: item.quantity,
        price_at_purchase: item.Wine.price
      }, { transaction });

      await item.Wine.decrement('stock_quantity', { by: item.quantity, transaction });
    }

    await CartItem.destroy({ where: { user_id: req.userId }, transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Order Checkout Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export default router;