import { Op } from 'sequelize';
import { Wine } from '../Database/models/index.js';

export const getAllWines = async (req, res) => {
  try {
    const {
      type, sweetness, search, minPrice, maxPrice,
      inStock, sortBy = 'id', sortOrder = 'ASC'
    } = req.query;

    const whereCondition = {};

    if (type) whereCondition.type = type;
    if (sweetness) whereCondition.sweetness = sweetness;

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (minPrice || maxPrice) {
      whereCondition.price = {};
      if (minPrice) whereCondition.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereCondition.price[Op.lte] = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      whereCondition.stock_quantity = { [Op.gt]: 0 };
    }

    const validSortFields = ['id', 'name', 'price', 'stock_quantity', 'vintage'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'id';
    const actualSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const wines = await Wine.findAll({
      where: whereCondition,
      order: [[actualSortBy, actualSortOrder]]
    });

    return res.status(200).json(wines);
  } catch (error) {
    console.error('Error fetching wines:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

export const getWineById = async (req, res) => {
  try {
    const wine = await Wine.findByPk(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Not Found', message: 'יין לא נמצא' });
    }
    return res.status(200).json(wine);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

export const createWine = async (req, res) => {
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
};

export const updateWine = async (req, res) => {
  try {
    const wine = await Wine.findByPk(req.params.id);
    if (!wine) {
      return res.status(404).json({ error: 'Not Found', message: 'Wine not found' });
    }

    const { name, price, stock_quantity, description } = req.body;

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
};