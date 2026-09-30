const API_BASE = '/api/v1';

let authToken = localStorage.getItem('token') || '';
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let pendingEmail = '';
let isOtpMode = false;

// DOM Elements
const toast = document.getElementById('toast');
const authSection = document.getElementById('authSection');
const protectedContent = document.getElementById('protectedContent');
const adminSection = document.getElementById('adminSection');
const userInfo = document.getElementById('userInfo');
const loginForm = document.getElementById('loginForm');
const otpForm = document.getElementById('otpForm');
const registerForm = document.getElementById('registerForm');
const passwordGroup = document.getElementById('passwordGroup');
const toggleAuthMode = document.getElementById('toggleAuthMode');
const backToPassword = document.getElementById('backToPassword');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const addWineForm = document.getElementById('addWineForm');
const editWineForm = document.getElementById('editWineForm');
const editWineModal = document.getElementById('editWineModal');
const closeEditWine = document.getElementById('closeEditWine');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const wineGrid = document.getElementById('wineGrid');
const myOrdersBtn = document.getElementById('myOrdersBtn');
const ordersModal = document.getElementById('ordersModal');
const closeOrders = document.getElementById('closeOrders');
const ordersList = document.getElementById('ordersList');

// Cart Elements
const cartBtn = document.getElementById('cartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');

function showToast(message, isError = false) {
  toast.innerText = message;
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
  if (authToken) {
    fetchWines();
    fetchCart();
  }
});

// Tab Switchers
if (tabLogin && tabRegister) {
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    otpForm.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.style.display = 'flex';
    loginForm.style.display = 'none';
    otpForm.style.display = 'none';
  });
}

// Auth Mode Toggle
if (toggleAuthMode) {
  toggleAuthMode.addEventListener('click', () => {
    isOtpMode = true;
    passwordGroup.style.display = 'none';
    document.getElementById('loginPassword').removeAttribute('required');
    toggleAuthMode.style.display = 'none';
    btnLoginSubmit.innerText = 'שלח לי קוד אימות למייל';
  });
}

if (backToPassword) {
  backToPassword.addEventListener('click', () => {
    isOtpMode = false;
    passwordGroup.style.display = 'flex';
    document.getElementById('loginPassword').setAttribute('required', 'true');
    toggleAuthMode.style.display = 'block';
    btnLoginSubmit.innerText = 'התחברות';
    loginForm.style.display = 'flex';
    otpForm.style.display = 'none';
  });
}

function updateUserUI() {
  if (currentUser && authToken) {
    authSection.style.display = 'none';
    protectedContent.style.display = 'block';
    myOrdersBtn.style.display = 'inline-block';
    cartBtn.style.display = 'flex';

    userInfo.innerHTML = `
      <span>שלום, <strong>${currentUser.full_name}</strong> ${currentUser.role === 'admin' ? '<small style="color:var(--gold);">(מנהל)</small>' : ''}</span>
      <button id="logoutBtn" style="background:rgba(255,255,255,0.12); color:#fff; border:1px solid rgba(255,255,255,0.25); padding:5px 12px; border-radius:20px; cursor:pointer; font-weight:600;">התנתק</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', logout);

    if (currentUser.role === 'admin' && adminSection) {
      adminSection.style.display = 'block';
    } else if (adminSection) {
      adminSection.style.display = 'none';
    }
  } else {
    authSection.style.display = 'block';
    protectedContent.style.display = 'none';
    myOrdersBtn.style.display = 'none';
    cartBtn.style.display = 'none';
    if (adminSection) adminSection.style.display = 'none';
    userInfo.innerHTML = '<span style="color:#d1c7bd;">אורח</span>';
  }
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;

  if (!isOtpMode) {
    const password = document.getElementById('loginPassword').value;
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        updateUserUI();
        fetchWines();
        fetchCart();
        showToast('התחברת בהצלחה!');
      } else {
        showToast(data.message || 'אימייל או סיסמה שגויים', true);
      }
    } catch (err) {
      showToast('תקלה בתקשורת עם השרת', true);
    }
  } else {
    try {
      const res = await fetch(`${API_BASE}/users/request-otp-only`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok && data.requiresOtp) {
        pendingEmail = email;
        loginForm.style.display = 'none';
        otpForm.style.display = 'flex';
        if (data.debugCode) {
          showToast(`קוד אימות לבדיקה: ${data.debugCode}`);
        } else {
          showToast('קוד האימות נשלח לתיבת המייל שלך');
        }
      } else {
        showToast(data.message || 'שגיאה בשליחת הקוד', true);
      }
    } catch (err) {
      showToast('תקלה בתקשורת עם השרת', true);
    }
  }
});

otpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('otpCode').value;

  try {
    const res = await fetch(`${API_BASE}/users/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pendingEmail, code })
    });
    const data = await res.json();

    if (res.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateUserUI();
      fetchWines();
      fetchCart();
      showToast('התחברת בהצלחה!');
    } else {
      showToast(data.message || 'קוד לא תקין', true);
    }
  } catch (err) {
    showToast('תקלה באימות הקוד', true);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('regId').value;
  const full_name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value;
  const address = document.getElementById('regAddress').value;

  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, full_name, email, password, phone, address })
    });
    const data = await res.json();

    if (res.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateUserUI();
      fetchWines();
      fetchCart();
      showToast('נרשמת בהצלחה!');
    } else {
      showToast(data.message || 'שגיאה בהרשמה', true);
    }
  } catch (err) {
    showToast('תקלה בתקשורת', true);
  }
});

function logout() {
  authToken = '';
  currentUser = null;

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // איפוס טופס ההתחברות
  document.getElementById('loginForm').reset();
  document.getElementById('otpForm').reset();
  document.getElementById('registerForm').reset();

  // חזרה למצב התחברות רגיל עם סיסמה
  isOtpMode = false;
  passwordGroup.style.display = 'flex';
  document.getElementById('loginPassword').setAttribute('required', 'true');
  toggleAuthMode.style.display = 'block';
  btnLoginSubmit.innerText = 'התחברות';

  loginForm.style.display = 'flex';
  otpForm.style.display = 'none';

  updateUserUI();

  cartCount.innerText = '0';
  cartItemsList.innerHTML = '';
  cartTotal.innerText = '0';

  showToast('התנתקת מהחשבון');
}


async function fetchWines() {
  try {
    const res = await fetch(`${API_BASE}/wines`);
    const wines = await res.json();

    wineGrid.innerHTML = wines.map(w => {
      const cleanName = (w.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const cleanDesc = (w.description || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

      return `
        <div class="wine-card">
          <div>
            <h3 class="wine-title">${w.name}</h3>
            <p class="wine-desc">${w.description || 'יין בוטיק איכותי'}</p>
            <div class="wine-tags">
              <span class="tag">${w.type}</span>
              <span class="tag">${w.sweetness}</span>
              <span class="tag">במלאי: ${w.stock_quantity}</span>
            </div>
          </div>
          <div>
            <div class="wine-footer">
              <span class="wine-price">${w.price} ₪</span>
              <button class="btn-add-cart" onclick="window.addToCart(${w.id})" ${w.stock_quantity === 0 ? 'disabled' : ''}>
                ${w.stock_quantity === 0 ? 'אזל' : 'הוסף לסל 🛒'}
              </button>
            </div>
            ${currentUser && currentUser.role === 'admin' ? `
              <button style="background:none; border:none; color:var(--wine-main); text-decoration:underline; cursor:pointer; margin-top:10px; font-size:0.9rem; font-weight:bold;" onclick="window.openEditWineModal(${w.id}, '${cleanName}',${w.price}, ${w.stock_quantity}, '${cleanDesc}')">
                ✏️ ערוך יין
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
}

if (addWineForm) {
  addWineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newWine = {
      name: document.getElementById('wineName').value,
      type: document.getElementById('wineType').value,
      sweetness: document.getElementById('wineSweetness').value,
      price: parseFloat(document.getElementById('winePrice').value),
      stock_quantity: parseInt(document.getElementById('wineStock').value, 10),
      description: document.getElementById('wineDesc').value
    };

    try {
      const res = await fetch(`${API_BASE}/wines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(newWine)
      });

      if (res.ok) {
        showToast('היין נוסף בהצלחה למלאי!');
        addWineForm.reset();
        fetchWines();
      } else {
        const err = await res.json();
        showToast(err.message || 'שגיאה בהוספת היין', true);
      }
    } catch (err) {
      showToast('תקלה בתקשורת עם השרת', true);
    }
  });
}

window.openEditWineModal = function(id, name, price, stock, desc) {
  document.getElementById('editWineId').value = id;
  document.getElementById('editWineName').value = name;
  document.getElementById('editWinePrice').value = price;
  document.getElementById('editWineStock').value = stock;
  document.getElementById('editWineDesc').value = desc;
  editWineModal.style.display = 'flex';
};

if (editWineForm) {
  editWineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editWineId').value;
    const updatedData = {
      name: document.getElementById('editWineName').value,
      price: parseFloat(document.getElementById('editWinePrice').value),
      stock_quantity: parseInt(document.getElementById('editWineStock').value, 10),
      description: document.getElementById('editWineDesc').value
    };

    try {
      const res = await fetch(`${API_BASE}/wines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        showToast('היין עודכן ונשמר בהצלחה!');
        editWineModal.style.display = 'none';
        fetchWines();
      } else {
        const err = await res.json();
        showToast(err.message || 'שגיאה בעדכון היין', true);
      }
    } catch (err) {
      showToast('תקלה בתקשורת עם השרת', true);
    }
  });
}

if (closeEditWine) {
  closeEditWine.addEventListener('click', () => { editWineModal.style.display = 'none'; });
}

window.addToCart = async function(wineId) {
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ wine_id: wineId, quantity: 1, increment: true })
    });

    if (res.ok) {
      showToast('היין נוסף לסל הקניות!');
      await fetchCart();
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
    } else {
      const err = await res.json();
      showToast(err.message || 'שגיאה בהוספה לסל', true);
    }
  } catch (err) {
    console.error(err);
  }
};

window.updateCartQuantity = async function(wineId, newQty) {
  if (newQty <= 0) return;
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ wine_id: wineId, quantity: newQty, increment: false })
    });
    if (res.ok) fetchCart();
  } catch (err) {
    console.error(err);
  }
};

async function fetchCart() {
  if (!authToken) return;
  try {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) return;

    const cart = await res.json();
    cartCount.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    let total = 0;
    cartItemsList.innerHTML = cart.length === 0 
      ? '<p style="text-align:center; color:#888; margin-top:30px;">הסל שלך ריק כרגע</p>' 
      : cart.map(item => {
        const itemTotal = item.quantity * item.Wine.price;
        total += itemTotal;
        return `
          <div class="cart-row">
            <div>
              <strong>${item.Wine.name}</strong><br>
              <small style="color:#777;">${item.Wine.price} ₪</small>
            </div>
            <div class="cart-controls">
              <button class="btn-qty" onclick="window.updateCartQuantity(${item.wine_id}, ${item.quantity - 1})">-</button>
              <span>${item.quantity}</span>
              <button class="btn-qty" onclick="window.updateCartQuantity(${item.wine_id}, ${item.quantity + 1})">+</button>
              <span style="font-weight:bold; margin-right:5px;">${itemTotal} ₪</span>
              <button style="background:none; border:none; cursor:pointer; color:#e74c3c;" onclick="window.removeFromCart(${item.id})">🗑</button>
            </div>
          </div>
        `;
      }).join('');

    cartTotal.innerText = total;
  } catch (err) {
    console.error(err);
  }
}

window.removeFromCart = async function(cartItemId) {
  try {
    const res = await fetch(`${API_BASE}/cart/${cartItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      showToast('הפריט הוסר מהסל');
      fetchCart();
    }
  } catch (err) {
    console.error(err);
  }
};

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ shipping_address: currentUser.address || 'כתובת למשלוח' })
      });

      if (res.ok) {
        showToast('🎉 ההזמנה בוצעה בהצלחה!');
        cartDrawer.classList.remove('open');
        cartOverlay.classList.remove('open');
        fetchCart();
        fetchWines();
      } else {
        const data = await res.json();
        showToast(data.message || 'שגיאה בביצוע ההזמנה', true);
      }
    } catch (err) {
      console.error(err);
    }
  });
}

if (myOrdersBtn) {
  myOrdersBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const orders = await res.json();

      if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align:center;">עדיין לא ביצעת הזמנות בחנות</p>';
      } else {
        ordersList.innerHTML = orders.map(o => `
          <div style="border-bottom:1px solid #eee; padding:12px 0;">
            <div style="display:flex; justify-content:space-between;">
              <strong>הזמנה #${o.id}</strong>
              <span style="color:var(--wine-main); font-weight:bold;">${o.total_price} ₪</span>
            </div>
            <small style="color:#666;">תאריך: ${new Date(o.createdAt).toLocaleDateString('he-IL')} | סטטוס: ${o.status}</small>
            <div style="margin-top:5px; font-size:0.85rem; color:#444;">
              ${o.OrderItems.map(i => `${i.Wine ? i.Wine.name : 'יין'} (${i.quantity} יח')`).join(', ')}
            </div>
          </div>
        `).join('');
      }
      ordersModal.style.display = 'flex';
    } catch (err) {
      console.error(err);
    }
  });
}

if (closeOrders) closeOrders.addEventListener('click', () => { ordersModal.style.display = 'none'; });
if (cartBtn) cartBtn.addEventListener('click', () => { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); });
if (closeCart) closeCart.addEventListener('click', () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); });
if (cartOverlay) cartOverlay.addEventListener('click', () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); });

if (continueShoppingBtn) {
  continueShoppingBtn.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  });
}