# Front-End Prompt: Home Wine Store UI Interface

## Objective
Create a modern, responsive, and visually appealing Single Page Application (SPA) front-end interface for our Home Wine Online Store. The web app should connect seamlessly to our existing Express + Sequelize + SQLite backend running at `http://localhost:3000`.

---

## Technical Specifications
- **Stack**: Pure HTML5, CSS3, Vanilla JavaScript (ES6+ Modules).
- **Design & Layout**: Modern, high-end wine boutique aesthetic (dark burgundy/gold or clean modern minimalist theme). Responsive on desktop and mobile.
- **Backend API Base URL**: `http://localhost:3000/api/v1`

---

## Required Features & Views

### 1. Header & Navigation
- Store Logo/Name ("מרתף היין" / "Wine Cellar").
- Navigation links:
  - Catalog (`#catalog`)
  - Shopping Cart Icon with item count badge (`#cart`).
  - Active User Context Selector (e.g., Header `user_id`: default `user-001`).

### 2. Wine Catalog Section (`#catalog`)
- Fetch wines from `GET http://localhost:3000/api/v1/wines`.
- Display wines in an attractive grid of cards containing:
  - Wine Name, Type (Red, White, Rosé, etc.), Sweetness level, Vintage, and Price.
  - Stock quantity badge ("במלאי: X" / "אזל מהמלאי").
  - Short description.
  - "הוסף לסל" (Add to Cart) button with a quantity selector.

### 3. Shopping Cart Drawer/Modal (`#cart`)
- Fetch current user cart items from `GET http://localhost:3000/api/v1/cart` using the `user_id` header.
- Display cart items with wine details, unit price, quantity, and item subtotal.
- Include a "מחק" (Delete) button per item calling `DELETE http://localhost:3000/api/v1/cart/:id`.
- Display total order price.
- "בצע הזמנה" (Checkout) button triggering `POST http://localhost:3000/api/v1/orders`:
  - Show success feedback upon successful transaction (`201 Created`).
  - Refresh cart and catalog stock levels automatically.

---

## File Structure
Please create a `public/` directory inside the project root containing:
- `public/index.html` - HTML markup and app container.
- `public/styles.css` - Custom styling and responsive layout.
- `public/app.js` - Dynamic API calls (`fetch`), event listeners, and UI rendering logic.

---

## Express Static Files Integration
Update `index.js` to serve the static front-end files:
```javascript
app.use(express.static('public'));