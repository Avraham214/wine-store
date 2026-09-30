# Project Prompt: Home Wine Online Store Backend (Express + Sequelize + SQLite)

## Objective
Build a RESTful API Backend server for a home wine online store using Node.js, Express.js, Sequelize ORM, and SQLite database. The system handles user authentication context, wine inventory management, a shopping cart system, and an order processing engine that automatically updates stock levels.

---

## Technical Stack & Architecture
- **Environment**: Node.js (ES Modules: `"type": "module"`)
- **Framework**: Express.js
- **ORM**: Sequelize v6
- **Database**: SQLite3 (`./Database/db.sqlite`)
- **Core Packages**: `express`, `sequelize`, `sqlite3`, `cors`

---

## Project Folder Structure

```text
wine-store-backend/
├── Database/
│   ├── config.js               # Database connection & sync setup
│   ├── db.sqlite               # SQLite database file
│   └── models/
│       ├── user.js             # User model
│       ├── wine.js             # Wine model & inventory
│       ├── cartItem.js         # Cart Item model
│       ├── order.js            # Order model
│       ├── orderItem.js        # Order Items model
│       └── index.js            # Centralized Associations & Exports
├── Middlewares/
│   └── authMiddleware.js       # User ID / Authentication check
├── Routes/
│   ├── wineRouter.js           # Public/Admin wine routes
│   ├── cartRouter.js           # User cart management routes
│   └── orderRouter.js          # Order checkout & stock deduction routes
├── index.js                    # Main server entry point
└── package.json

Detailed Data Models & Fields
1. User (users)
id (STRING, Primary Key) - Unique identifier (e.g., National ID or UUID).

full_name (STRING, Not Null) - Customer's full name.

email (STRING, Not Null, Unique, isEmail validation) - Customer email.

password (STRING, Not Null) - User password.

phone (STRING, Nullable) - Phone number.

address (STRING, Nullable) - Shipping address.

role (ENUM: 'customer', 'admin', Default: 'customer').

2. Wine (wines)
id (INTEGER, Primary Key, Auto Increment).

name (STRING, Not Null) - Wine name (e.g., "Cabernet Sauvignon Reserve").

type (STRING / ENUM: 'red', 'white', 'rose', 'sparkling', 'dessert', Not Null).

sweetness (STRING / ENUM: 'dry', 'semi-dry', 'semi-sweet', 'sweet', Not Null).

vintage (INTEGER, Nullable) - Harvest year (e.g., 2021).

alcohol_percentage (FLOAT, Nullable) - Alcohol content.

volume_ml (INTEGER, Default: 750) - Bottle volume.

price (FLOAT, Not Null, min: 0) - Price per bottle in NIS.

stock_quantity (INTEGER, Not Null, Default: 0, min: 0) - Available bottles in stock.

description (TEXT, Nullable) - Tasting notes and pairing suggestions.

3. CartItem (cart_items)
id (INTEGER, Primary Key, Auto Increment).

user_id (Foreign Key -> User).

wine_id (Foreign Key -> Wine).

quantity (INTEGER, Not Null, Default: 1, min: 1).

4. Order (orders)
id (INTEGER, Primary Key, Auto Increment).

user_id (Foreign Key -> User).

total_price (FLOAT, Not Null, min: 0) - Total order amount.

status (ENUM: 'pending', 'processing', 'completed', 'cancelled', Default: 'pending').

shipping_address (STRING, Nullable).

5. OrderItem (order_items)
id (INTEGER, Primary Key, Auto Increment).

order_id (Foreign Key -> Order).

wine_id (Foreign Key -> Wine).

quantity (INTEGER, Not Null, min: 1).

price_at_purchase (FLOAT, Not Null) - Historical price per item at time of order.

Sequelize Associations (Database/models/index.js)
User & CartItem: User.hasMany(CartItem), CartItem.belongsTo(User)

Wine & CartItem: Wine.hasMany(CartItem), CartItem.belongsTo(Wine)

User & Order: User.hasMany(Order), Order.belongsTo(User)

Order & Wine (Many-to-Many via OrderItem):

Order.belongsToMany(Wine, { through: OrderItem, foreignKey: 'order_id' })

Wine.belongsToMany(Order, { through: OrderItem, foreignKey: 'wine_id' })

Middleware Rules (Middlewares/authMiddleware.js)
Inspect req.headers['user_id'].

Verify user existence in DB.

Attach req.userId to request or return 401 Unauthorized if missing/invalid.

API Endpoints Specification
1. Wines (/api/v1/wines)
GET / -> Fetch list of all wines and available inventory stock (200 OK).

2. Cart (/api/v1/cart) - Protected by authMiddleware
GET / -> Retrieve current user's cart items with associated Wine details (200 OK).

POST / -> Add wine to cart or update quantity if it already exists (200 OK). Body: { "wine_id": 1, "quantity": 2 }.

DELETE /:id -> Remove item from cart by CartItem ID (200 OK).

3. Orders (/api/v1/orders) - Protected by authMiddleware
POST / -> Process order checkout inside a Sequelize Transaction:

Fetch user's cart items. Return 400 Bad Request if empty.

Verify that wine.stock_quantity >= cartItem.quantity for each item. Return 400 Bad Request if insufficient stock.

Calculate total_price.

Create Order record.

Create OrderItem entries and deduct purchased quantities from Wine.stock_quantity.

Clear user's CartItems.

Commit transaction and return 201 Created.

Main Entry Point (index.js)
Configure Express with express.json() and cors().

Register routes under /api/v1/wines, /api/v1/cart, and /api/v1/orders.

Listen on port 3000 and trigger sequelize.sync().