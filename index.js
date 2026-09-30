import 'dotenv/config'; // טעינת משתני הסביבה מקובץ .env
import express from 'express';
import cors from 'cors';
import path from 'path';
import { sequelize } from './Database/models/index.js';
import wineRouter from './Routes/wineRouter.js';
import cartRouter from './Routes/cartRouter.js';
import orderRouter from './Routes/orderRouter.js';
import userRouter from './Routes/userRouter.js';
import defaultLimit from './Middlewares/RateLimit.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure core middleware
app.use(cors());
app.use(express.json());

// הפעלת הגנת Rate Limit על כל נתיבי ה-API
app.use('/api/v1', defaultLimit);

// 1. Register API Routes
app.use('/api/v1/wines', wineRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/users', userRouter);

// 2. Base route: אם הבקשה מגיעה מדפדפן (text/html) נחזיר index.html, אחרת JSON
app.get('/', (req, res) => {
  const accept = req.headers['accept'] || '';
  if (accept.includes('text/html')) {
    return res.sendFile(path.resolve('public', 'index.html'));
  }
  res.json({
    name: 'Home Wine Store Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      wines: '/api/v1/wines',
      cart: '/api/v1/cart',
      orders: '/api/v1/orders',
      users: '/api/v1/users'
    }
  });
});

// 3. הגשת הקבצים הסטטיים מתוך תיקיית public עבור נתיבים אחרים (CSS, JS, תמונות)
app.use(express.static('public'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Database sync and server initialization
const startServer = async () => {
  try {
    await sequelize.sync();
    console.log('Database synced successfully.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`App URL: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;