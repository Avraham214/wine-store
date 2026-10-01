# 🍷 מרתף היין | מערכת חנות יינות בוטיק (Full-Stack REST API)

מערכת מלאה ומתקדמת לניהול חנות יינות בוטיק, המפותחת בסטנדרט תעשייתי גבוה ומבוססת על **Node.js**, **Express**, **Sequelize ORM (SQLite)** ופרונט-אנד ייעודי (SPA).

---

## 🛠️ טכנולוגיות וארכיטקטורה

- **Backend:** Node.js, Express.js (ES Modules)
- **Database & ORM:** SQLite3 מנוהל באמצעות Sequelize ORM
- **Architecture:** Model-View-Controller (MVC) מלא עם הפרדה מודולרית לתיקיות:
  - `Routes/` - הגדרת נתיבי ה-API והפניה לקונטרולרים
  - `Controllers/` - לוגיקת העסקים וניהול שאילתות בסיס הנתונים
  - `Database/models/` - הגדרת מודלים, אימותים (Validations) ויחסים (Associations)
  - `Middlewares/` - אימות JWT, הרשאות מנהל (RBAC) והגנת Rate Limiting
- **Security & Auth:** JWT (Bearer Token), bcrypt (הצפנת סיסמאות), אימות OTP במייל (Nodemailer), הגנת Rate Limiting (`express-rate-limit`)

---

## 📂 מבנה הפרויקט

```text
wine-store-backend/
├── Controllers/            # לוגיקה עסקית ושאילתות
│   ├── cartController.js
│   ├── orderController.js
│   ├── userController.js
│   └── wineController.js
├── Database/
│   ├── config.js          # קונפיגורציית חיבור ל-SQLite
│   ├── db.sqlite          # בסיס הנתונים
│   ├── seed.js            # סקריפט אתחול נתונים
│   └── models/            # מודלים ויחסים ב-Sequelize
│       ├── cartItem.js
│       ├── index.js
│       ├── order.js
│       ├── orderItem.js
│       ├── user.js
│       └── wine.js
├── Middlewares/            # מתווכים
│   ├── authMiddleware.js  # אימות טוקנים והרשאות Admin
│   └── RateLimit.js       # הגנה מפני הצפת בקשות
├── public/                # קובצי Front-End (SPA)
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── Routes/                # הגדרת נתיבים בלבד
│   ├── cartRouter.js
│   ├── orderRouter.js
│   ├── userRouter.js
│   └── wineRouter.js
├── .env.example           # משתני סביבה לדוגמה
├── index.js               # נקודת הכניסה הראשית לשרת
├── package.json
└── test.js                # בדיקות אימות אוטומטיות