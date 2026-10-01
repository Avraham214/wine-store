import app from './index.js';

// ממתינים קלות לעליית השרת
await new Promise(resolve => setTimeout(resolve, 500));

const BASE_URL = 'http://localhost:3000';
let userToken = '';
let adminToken = '';

const TEST_EMAIL = 'avreymi218@gmail.com';
const TEST_PASSWORD = '12345';

const ADMIN_EMAIL = 'avreymi214@gmail.com';
const ADMIN_PASSWORD = 'Avi214';

const runTests = async () => {
  console.log('\n==================================================');
  console.log(' 🍷 Starting Full Wine Store API Verification Tests');
  console.log('==================================================\n');

  try {
    // Test 1: Health Check
    console.log('Test 1: GET / (Health Check & Base Endpoint)');
    const healthRes = await fetch(`${BASE_URL}/`, {
      headers: { 'Accept': 'application/json' }
    });
    const healthData = await healthRes.json();
    console.log(`Status: ${healthRes.status}, Server Status: ${healthData.status}`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    // Test 2: GET /api/v1/wines (List & Dynamic Filtering)
    console.log('\nTest 2: GET /api/v1/wines (Wines Catalog & Dynamic Filters)');
    const winesRes = await fetch(`${BASE_URL}/api/v1/wines`);
    const winesData = await winesRes.json();
    console.log(`Status: ${winesRes.status}, Total wines in DB: ${winesData.length}`);
    if (winesRes.status !== 200 || winesData.length === 0) throw new Error('Wines list failed');

    // Test 2b: Query filtering test
    console.log('Testing query filter: ?type=red&sweetness=dry');
    const filterRes = await fetch(`${BASE_URL}/api/v1/wines?type=red&sweetness=dry`);
    const filteredWines = await filterRes.json();
    console.log(`Filtered Status: ${filterRes.status}, Found: ${filteredWines.length} red dry wines`);
    if (filterRes.status !== 200) throw new Error('Wine filtering failed');

    // Test 3: Authenticate Customer & Admin Users
    console.log('\nTest 3: Authenticate Customer & Admin Users (JWT)');
    
    // Login Customer
    const custLoginRes = await fetch(`${BASE_URL}/api/v1/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const custLoginData = await custLoginRes.json();
    userToken = custLoginData.token;
    console.log(`Customer Login Status: ${custLoginRes.status}, Received Token: ${!!userToken}`);
    if (custLoginRes.status !== 200 || !userToken) throw new Error('Customer authentication failed');

    // Login Admin
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    console.log(`Admin Login Status: ${adminLoginRes.status}, Received Token: ${!!adminToken}`);
    if (adminLoginRes.status !== 200 || !adminToken) throw new Error('Admin authentication failed');

    // Test 4: Auth & Authorization Middlewares Check
    console.log('\nTest 4: Authorization Checks (Admin vs Customer Access)');
    
    // Guest tries to create wine (401)
    const guestWineRes = await fetch(`${BASE_URL}/api/v1/wines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized Wine', type: 'red', sweetness: 'dry', price: 100 })
    });
    console.log(`Guest create wine -> Status: ${guestWineRes.status} (Expected: 401)`);
    if (guestWineRes.status !== 401) throw new Error('Expected 401 for guest');

    // Customer tries to create wine (403)
    const custWineRes = await fetch(`${BASE_URL}/api/v1/wines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: 'Unauthorized Wine', type: 'red', sweetness: 'dry', price: 100 })
    });
    console.log(`Customer create wine -> Status: ${custWineRes.status} (Expected: 403)`);
    if (custWineRes.status !== 403) throw new Error('Expected 403 for regular customer');

    // Test 5: Cart Management
    console.log('\nTest 5: POST & GET /api/v1/cart (Cart Operations)');
    const addCartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wine_id: 1, quantity: 2, increment: false })
    });
    const cartItem = await addCartRes.json();
    console.log(`Add to cart -> Status: ${addCartRes.status}, Item ID: ${cartItem.id}, Qty: ${cartItem.quantity}`);
    if (addCartRes.status !== 200) throw new Error('Add to cart failed');

    // Test 6: Order Checkout Transaction
    console.log('\nTest 6: POST /api/v1/orders (Checkout Transaction)');
    const checkoutRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ shipping_address: '12 Ben Gurion St, Be\'er Sheva' })
    });
    const checkoutData = await checkoutRes.json();
    console.log(`Checkout Status: ${checkoutRes.status} (Expected: 201)`);
    console.log(`Order #${checkoutData.order?.id} created with Total: ${checkoutData.order?.total_price} NIS`);
    if (checkoutRes.status !== 201) throw new Error('Order checkout failed');

    // Test 7: Admin Global Queries
    console.log('\nTest 7: Admin Global Queries (Users & Orders Details)');
    
    // Admin fetches all users
    const adminUsersRes = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersList = await adminUsersRes.json();
    console.log(`Admin GET /users -> Status: ${adminUsersRes.status}, Found: ${usersList.length} users`);
    if (adminUsersRes.status !== 200) throw new Error('Admin fetch users failed');

    // Admin fetches full user details card
    const userDetailRes = await fetch(`${BASE_URL}/api/v1/users/user-001/details`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const userDetail = await userDetailRes.json();
    console.log(`Admin GET /users/user-001/details -> Status: ${userDetailRes.status}`);
    console.log(`User: ${userDetail.full_name}, Cart Items: ${userDetail.CartItems.length}, Past Orders: ${userDetail.Orders.length}`);
    if (userDetailRes.status !== 200 || !userDetail.Orders) throw new Error('Fetch user details failed');

    console.log('\n==================================================');
    console.log(' 🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY! 🎉 ');
    console.log('==================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failure:', error.message);
    process.exit(1);
  }
};

runTests();