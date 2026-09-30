import bcrypt from 'bcrypt';
import { sequelize, User, Wine } from './models/index.js';

const SALT_ROUNDS = 10;

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting Database Seeding...');

    // סנכרון ואיפוס טבלאות בסיס הנתונים
    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated).');

    // 1. הצפנת סיסמאות ויצירת משתמשי ברירת מחדל
    const hashedPasswordUser = await bcrypt.hash('12345', SALT_ROUNDS);
    const hashedPasswordAdmin = await bcrypt.hash('Avi214', SALT_ROUNDS);
    const hashedPasswordSara = await bcrypt.hash('sara123', SALT_ROUNDS);
    const hashedPasswordYossi = await bcrypt.hash('yossi999', SALT_ROUNDS);

    const users = await User.bulkCreate([
      {
        id: 'user-001',
        full_name: 'John Doe',
        email: 'avreymi218@gmail.com',
        password: hashedPasswordUser,
        phone: '050-1234567',
        address: 'כפר חב"ד',
        role: 'customer'
      },
      {
        id: 'user-002',
        full_name: 'שרה כהן',
        email: 'sara.cohen@gmail.com',
        password: hashedPasswordSara,
        phone: '052-9876543',
        address: 'תל אביב',
        role: 'customer'
      },
      {
        id: 'user-003',
        full_name: 'יוסי לוי',
        email: 'yossi.levi@gmail.com',
        password: hashedPasswordYossi,
        phone: '054-1112233',
        address: 'חיפה',
        role: 'customer'
      },
      {
        id: 'admin-001',
        full_name: 'Avi Manager',
        email: 'avreymi214@gmail.com',
        password: hashedPasswordAdmin,
        phone: '054-7654321',
        address: 'באר שבע',
        role: 'admin'
      }
    ]);

    console.log(`✅ Created ${users.length} users successfully.`);

    // 2. יצירת רשימת יינות למלאי
    const wines = await Wine.bulkCreate([
      {
        name: 'Cabernet Sauvignon Reserve',
        type: 'red',
        sweetness: 'dry',
        vintage: 2021,
        alcohol_percentage: 14.5,
        volume_ml: 750,
        price: 120.0,
        stock_quantity: 15,
        description: 'Rich, full-bodied red wine with aromas of blackcurrant, cedar, and oak.'
      },
      {
        name: 'Chardonnay Classic',
        type: 'white',
        sweetness: 'dry',
        vintage: 2022,
        alcohol_percentage: 13.0,
        volume_ml: 750,
        price: 85.0,
        stock_quantity: 20,
        description: 'Crisp white wine with notes of green apple, citrus, and a hint of vanilla.'
      },
      {
        name: 'Rosé Sunset',
        type: 'rose',
        sweetness: 'semi-dry',
        vintage: 2023,
        alcohol_percentage: 12.5,
        volume_ml: 750,
        price: 75.0,
        stock_quantity: 10,
        description: 'Refreshing rosé featuring flavors of strawberry, watermelon, and floral hints.'
      },
      {
        name: 'Sparkling Brut Prestige',
        type: 'sparkling',
        sweetness: 'dry',
        vintage: 2020,
        alcohol_percentage: 12.0,
        volume_ml: 750,
        price: 150.0,
        stock_quantity: 8,
        description: 'Elegant sparkling wine with fine bubbles and notes of toasted brioche and pear.'
      },
      {
        name: 'Late Harvest Muscat',
        type: 'dessert',
        sweetness: 'sweet',
        vintage: 2021,
        alcohol_percentage: 11.5,
        volume_ml: 500,
        price: 95.0,
        stock_quantity: 12,
        description: 'Luscious sweet dessert wine with aromas of honey, apricot, and orange blossom.'
      }
    ]);

    console.log(`✅ Created ${wines.length} wines successfully.`);
    console.log('🎉 Seeding completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// הרצה ישירה במידה והקובץ מורץ דרך הסקריפט npm run seed
seedDatabase();