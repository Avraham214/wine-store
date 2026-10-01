import { CartItem, Wine } from '../Database/models/index.js';

export const getCart = async (req, res) => {
  try {
    const cartItems = await CartItem.findAll({
      where: { user_id: req.userId },
      include: [{ model: Wine }],
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
};

export const addToCart = async (req, res) => {
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

    const wine = await Wine.findByPk(wine_id);
    if (!wine) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Wine with ID ${wine_id} does not exist`
      });
    }

    let cartItem = await CartItem.findOne({
      where: {
        user_id: req.userId,
        wine_id
      }
    });

    const targetQuantity = (cartItem && increment)
      ? cartItem.quantity + parsedQty
      : parsedQty;

    if (wine.stock_quantity < targetQuantity) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Insufficient stock for ${wine.name}. Requested: ${targetQuantity}, available: ${wine.stock_quantity}`
      });
    }

    if (cartItem) {
      cartItem.quantity = targetQuantity;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        user_id: req.userId,
        wine_id,
        quantity: targetQuantity
      });
    }

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
};

export const removeFromCart = async (req, res) => {
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
};