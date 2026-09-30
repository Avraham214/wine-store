import express from 'express';
import { CartItem, Wine } from '../Database/models/index.js';
import authMiddleware from '../Middlewares/authMiddleware.js';

const router = express.Router();

// Protect all cart routes with authMiddleware
router.use(authMiddleware);

/**
 * @route   GET /api/v1/cart
 * @desc    Retrieve current user's cart items with associated Wine details
 * @access  Protected (authMiddleware)
 */
router.get('/', async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Wine
        }
      ],
      order: [['id', 'ASC']]
    });

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve cart items'
    });
  }
});

/**
 * @route   POST /api/v1/cart
 * @desc    Add wine to cart or update quantity if it already exists
 * @access  Protected (authMiddleware)
 * @body    { "wine_id": 1, "quantity": 2 }
 */
router.post('/', async (req, res) => {
  try {
    const { wine_id, quantity = 1, increment } = req.body;

    if (!wine_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'wine_id is required'
      });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'quantity must be a positive integer greater than 0'
      });
    }

    // Verify wine exists
    const wine = await Wine.findByPk(wine_id);
    if (!wine) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Wine with ID ${wine_id} does not exist`
      });
    }

    // Check if cart item already exists for this user and wine
    let cartItem = await CartItem.findOne({
      where: {
        user_id: req.userId,
        wine_id
      }
    });

    const targetQuantity = (cartItem && increment)
      ? cartItem.quantity + parsedQty
      : parsedQty;

    // Check inventory stock availability
    if (wine.stock_quantity < targetQuantity) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Insufficient stock for ${wine.name}. Requested: ${targetQuantity}, available: ${wine.stock_quantity}`
      });
    }

    if (cartItem) {
      // Update quantity if it already exists
      cartItem.quantity = targetQuantity;
      await cartItem.save();
    } else {
      // Add new wine to cart
      cartItem = await CartItem.create({
        user_id: req.userId,
        wine_id,
        quantity: targetQuantity
      });
    }

    // Reload with Wine association included
    const result = await CartItem.findByPk(cartItem.id, {
      include: [{ model: Wine }]
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error adding/updating cart item:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update cart'
    });
  }
});

/**
 * @route   DELETE /api/v1/cart/:id
 * @desc    Remove item from cart by CartItem ID
 * @access  Protected (authMiddleware)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await CartItem.findOne({
      where: {
        id,
        user_id: req.userId
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Cart item with ID ${id} not found for this user`
      });
    }

    await cartItem.destroy();

    return res.status(200).json({
      message: 'Cart item removed successfully',
      id: parseInt(id, 10)
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to remove cart item'
    });
  }
});

export default router;
