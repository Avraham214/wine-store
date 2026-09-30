import sequelize from '../config.js';
import User from './user.js';
import Wine from './wine.js';
import CartItem from './cartItem.js';
import Order from './order.js';
import OrderItem from './orderItem.js';

// User & CartItem: User.hasMany(CartItem), CartItem.belongsTo(User)
User.hasMany(CartItem, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });

// Wine & CartItem: Wine.hasMany(CartItem), CartItem.belongsTo(Wine)
Wine.hasMany(CartItem, { foreignKey: 'wine_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Wine, { foreignKey: 'wine_id' });

// User & Order: User.hasMany(Order), Order.belongsTo(User)
User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// Order & Wine (Many-to-Many via OrderItem):
Order.belongsToMany(Wine, { through: OrderItem, foreignKey: 'order_id' });
Wine.belongsToMany(Order, { through: OrderItem, foreignKey: 'wine_id' });

// Direct associations for Order and OrderItem (allows eager loading order items with wine details)
Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Wine.hasMany(OrderItem, { foreignKey: 'wine_id' });
OrderItem.belongsTo(Wine, { foreignKey: 'wine_id' });

export {
  sequelize,
  User,
  Wine,
  CartItem,
  Order,
  OrderItem
};

export default {
  sequelize,
  User,
  Wine,
  CartItem,
  Order,
  OrderItem
};
