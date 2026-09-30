import { DataTypes } from 'sequelize';
import sequelize from '../config.js';

export const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  wine_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'wines',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  // מונע שתי שורות לאותו יין אצל אותו משתמש (למשל בלחיצה כפולה)
  indexes: [
    { unique: true, fields: ['user_id', 'wine_id'] }
  ]
});

export default CartItem;