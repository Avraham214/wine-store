import jwt from 'jsonwebtoken';
import { User } from '../Database/models/index.js';

// הסוד חייב להיות מוגדר ב-.env. אין ברירת מחדל בקוד.
const secret = process.env.SECRET;
if (!secret) {
  throw new Error('SECRET is not defined in .env');
}

// פונקציה להנפקת טוקן JWT בעת התחברות או הרשמה
export const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '24h' }
  );
};

// מידלוואיר לאימות ה-JWT Token
export const authMiddleware = async (req, res, next) => {
  try {
    // 1. קריאת ה-Header של Authorization (פורמט: Bearer <TOKEN>)
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization token format (Expected: Bearer <token>)'
      });
    }

    // 2. חילוץ הטוקן
    const token = authHeader.split(' ')[1];

    // 3. אימות ופענוח ה-Token
    const decoded = jwt.verify(token, secret);

    // 4. בדיקה שהמשתמש קיים בבסיס הנתונים
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token: User no longer exists'
      });
    }

    // 5. הצמדת פרטי המשתמש לבקשה למעבר לראוט הבא
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware verification error:', error.message);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

// מידלוואיר שמאפשר גישה למנהלים בלבד. חייב לרוץ אחרי authMiddleware.
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access only'
    });
  }
  next();
};

export default authMiddleware;