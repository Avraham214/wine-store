import { DataTypes } from 'sequelize';
import sequelize from '../config.js';

export const Wine = sequelize.define('Wine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('red', 'white', 'rose', 'sparkling', 'dessert'),
    allowNull: false
  },
  sweetness: {
    type: DataTypes.ENUM('dry', 'semi-dry', 'semi-sweet', 'sweet'),
    allowNull: false
  },
  vintage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  alcohol_percentage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  volume_ml: {
    type: DataTypes.INTEGER,
    defaultValue: 750
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'wines',
  timestamps: true
});

export default Wine;
