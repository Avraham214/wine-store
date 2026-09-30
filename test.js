import app from './index.js';

// Wait briefly for server to start
await new Promise(resolve => setTimeout(resolve, 500));

const BASE_URL = 'http://localhost:3000';
let userToken = '';

// הערה: הטסט מסתמך על debugCode, שמוחזר רק כשאין EMAIL_USER ו-EMAIL_PASS ב-.env
// ורק כש-NODE_ENV אינו production. וודא שרצת קודם npm run seed.
const TEST_EMAIL = 'avreymi218@gmail.com';
const TEST_PASSWORD = '12345';

const runTests = async () => {
  console.log('\n--- Starting Wine Store Backend Verification Tests ---\n');

  try {
    // Test 1: Health check
    console.log('Test 1: GET / (Health Check)');
    const healthRes = await fetch(`${BASE_URL}/`, {
      headers: { 'Accept': 'application/json' }
    });
    const healthData = await healthRes.json();
    console.log(`Status: ${healthRes.status}, Response:`, healthData);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    // Test 2: GET /api/v1/wines
    console.log('\nTest 2: GET /api/v1/wines (List Wines)');
    const winesRes = await fetch(`${BASE_URL}/api/v1/wines`);
    const winesData = await winesRes.json();
    console.log(`Status: ${winesRes.status}, Found ${winesData.length} wines.`);
    if (winesRes.status !== 200 || winesData.length === 0) throw new Error('Wines list failed');
    console.log(`First wine: "${winesData[0].name}" (Stock: ${winesData[0].stock_quantity}, Price: ${winesData[0].price} NIS)`);

    // Test 3: Login (password) + OTP verification
    console.log('\nTest 3: POST /api/v1/users/login + /verify-otp (Authenticate & Get JWT)');
    const loginRes = await fetch(`${BASE_URL}/api/v1/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    const loginData = await loginRes.json();
    console.log(`Login Status: ${loginRes.status}, OTP required: ${!!loginData.requiresOtp}`);
    if (loginRes.status !== 200 || !loginData.requiresOtp) throw new Error('Login step failed');
    if (!loginData.debugCode) throw new Error('No debugCode returned (is EMAIL_USER/EMAIL_PASS set in .env?)');

    const verifyRes = await fetch(`${BASE_URL}/api/v1/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, code: loginData.debugCode })
    });
    const verifyData = await verifyRes.json();
    console.log(`Verify Status: ${verifyRes.status}, Token Received: ${!!verifyData.token}`);
    if (verifyRes.status !== 200 || !verifyData.token) throw new Error('OTP verification failed');
    userToken = verifyData.token;

    // Test 4: Auth Middleware checks
    console.log('\nTest 4: Authentication Middleware checks on /api/v1/cart');
    // Without header
    const noAuthRes = await fetch(`${BASE_URL}/api/v1/cart`);
    console.log(`Without token -> Status: ${noAuthRes.status} (Expected: 401)`);
    if (noAuthRes.status !== 401) throw new Error('Expected 401 for missing token');

    // With invalid token
    const badAuthRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { Authorization: 'Bearer invalid.jwt.token' }
    });
    console.log(`With invalid token -> Status: ${badAuthRes.status} (Expected: 401)`);
    if (badAuthRes.status !== 401) throw new Error('Expected 401 for invalid token');

    // With valid JWT Token
    const validAuthRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const initialCart = await validAuthRes.json();
    console.log(`With valid JWT -> Status: ${validAuthRes.status}, Cart length: ${initialCart.length} (Expected: 200)`);
    if (validAuthRes.status !== 200) throw new Error('Expected 200 for valid JWT');

    // Test 4b: הרשאות מנהל - לקוח רגיל לא יכול להוסיף יין
    console.log('\nTest 4b: Customer cannot create wines (expected 403), guest gets 401');
    const guestWineRes = await fetch(`${BASE_URL}/api/v1/wines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hack', type: 'red', sweetness: 'dry', price: 1 })
    });
    console.log(`Guest -> Status: ${guestWineRes.status} (Expected: 401)`);
    if (guestWineRes.status !== 401) throw new Error('Expected 401 for guest creating wine');

    const customerWineRes = await fetch(`${BASE_URL}/api/v1/wines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ name: 'Hack', type: 'red', sweetness: 'dry', price: 1 })
    });
    console.log(`Customer -> Status: ${customerWineRes.status} (Expected: 403)`);
    if (customerWineRes.status !== 403) throw new Error('Expected 403 for customer creating wine');

    // Test 5: Add items to cart
    console.log('\nTest 5: POST /api/v1/cart (Add items to cart)');
    const addRes1 = await fetch(`${BASE_URL}/api/v1/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wine_id: 1, quantity: 2 })
    });
    const cartItem1 = await addRes1.json();
    console.log(`Added wine 1 (qty 2) -> Status: ${addRes1.status}, Item ID: ${cartItem1.id}`);
    if (addRes1.status !== 200 || cartItem1.quantity !== 2) throw new Error('Failed to add item 1');

    const addRes2 = await fetch(`${BASE_URL}/api/v1/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ wine_id: 2, quantity: 1 })
    });
    const cartItem2 = await addRes2.json();
    console.log(`Added wine 2 (qty 1) -> Status: ${addRes2.status}, Item ID: ${cartItem2.id}`);
    if (addRes2.status !== 200) throw new Error('Failed to add item 2');

    // Test 6: Order checkout transaction
    console.log('\nTest 6: POST /api/v1/orders (Process checkout inside transaction)');
    const stockWine1Before = winesData.find(w => w.id === 1).stock_quantity;
    const checkoutRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ shipping_address: '12 Ben Yehuda St, Tel Aviv' })
    });
    const checkoutData = await checkoutRes.json();
    console.log(`Checkout Status: ${checkoutRes.status} (Expected: 201)`);
    console.log('Order Summary:', {
      order_id: checkoutData.order?.id,
      total_price: checkoutData.order?.total_price,
      status: checkoutData.order?.status
    });
    if (checkoutRes.status !== 201) throw new Error('Order checkout failed');

    // Test 7: Verify cart is cleared
    console.log('\nTest 7: Verify user cart is cleared after checkout');
    const clearedCartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const clearedCart = await clearedCartRes.json();
    console.log(`Cart items remaining: ${clearedCart.length} (Expected: 0)`);
    if (clearedCart.length !== 0) throw new Error('Cart was not cleared after checkout');

    // Test 8: Verify stock deduction
    console.log('\nTest 8: Verify wine stock deduction');
    const wine1AfterRes = await fetch(`${BASE_URL}/api/v1/wines/1`);
    const wine1After = await wine1AfterRes.json();
    console.log(`Wine 1 stock: before=${stockWine1Before}, after=${wine1After.stock_quantity} (Deducted 2)`);
    if (wine1After.stock_quantity !== stockWine1Before - 2) throw new Error('Stock deduction mismatch');

    console.log('\n==========================================');
    console.log(' 🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉 ');
    console.log('==========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failure:', error);
    process.exit(1);
  }
};

runTests();