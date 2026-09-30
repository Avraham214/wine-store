import { Router } from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';
import { User } from '../Database/models/index.js';
import { signToken } from '../Middlewares/authMiddleware.js';

const userRouter = Router();
const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;
const otpStore = new Map();

const emailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// יצירת קוד OTP מאובטח ושמירתו לחמש דקות
const createOtp = (email) => {
  const code = randomInt(100000, 1000000).toString();
  otpStore.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });
  return code;
};

// קוד הבדיקה מוחזר בתגובה רק בפיתוח וכשאין מייל מוגדר
const debugCodeFor = (code) => {
  if (!emailConfigured() && process.env.NODE_ENV !== 'production') {
    return code;
  }
  return undefined;
};

// התחברות רגילה עם סיסמה (כניסה ישירה ללא OTP)
userRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Unauthorized', message: 'אימייל או סיסמה שגויים' });
    }

    // יצירת טוקן ישירות כיוון שהסיסמה נכונה
    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'שגיאת שרת' });
  }
});

// התחברות עם קוד אימות בלבד (ללא סיסמה)
userRouter.post('/request-otp-only', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Bad Request', message: 'נדרשת כתובת אימייל' });
    }

    const user = await User.findOne({ where: { email } });

    let debugCode;
    if (user) {
      const otpCode = createOtp(email);

      if (emailConfigured()) {
        await transporter.sendMail({
          from: '"מרתף היין" <no-reply@homewine.com>',
          to: email,
          subject: '🔑 קוד להתחברות ללא סיסמה - מרתף היין',
          html: `<h2>קוד האימות שלך להתחברות ללא סיסמה: <strong>${otpCode}</strong></h2>`
        });
      }
      debugCode = debugCodeFor(otpCode);
    }

    // אותה תשובה גם כשהמשתמש לא קיים, כדי לא לחשוף אילו מיילים רשומים
    return res.status(200).json({
      message: 'OTP sent',
      requiresOtp: true,
      email,
      debugCode
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'שגיאת שרת' });
  }
});

// אימות קוד ה-OTP
userRouter.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = otpStore.get(email);

    if (!record || Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(401).json({ error: 'Unauthorized', message: 'קוד אימות לא תקין או פג תוקף' });
    }

    if (record.code !== code) {
      record.attempts += 1;
      if (record.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(email);
      }
      return res.status(401).json({ error: 'Unauthorized', message: 'קוד אימות לא תקין או פג תוקף' });
    }

    otpStore.delete(email);
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'משתמש לא נמצא' });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'שגיאת שרת' });
  }
});

// הרשמה
userRouter.post('/', async (req, res) => {
  try {
    const { id, full_name, email, password, phone, address } = req.body;
    if (!id || !full_name || !email || !password) {
      return res.status(400).json({ error: 'Bad Request', message: 'חסרים שדות חובה' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      id, full_name, email, password: hashedPassword,
      phone: phone || null, address: address || null, role: 'customer'
    });

    const token = signToken(user);
    res.status(201).json({
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, address: user.address },
      token
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Conflict', message: 'מזהה או אימייל כבר קיימים' });
    }
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Bad Request', message: 'נתונים לא תקינים (בדוק את כתובת האימייל)' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'שגיאת שרת' });
  }
});

export default userRouter;