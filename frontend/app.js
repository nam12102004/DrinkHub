/* =============================================================
 * DrinkHub — app.js
 * Full role-based SPA client connecting to the backend API
 * Roles: 1=Customer, 2=Shop Owner, 3=Shipper
 * ============================================================= */

const API = 'http://localhost:5000/api';

// =============================================================
// STATE
// =============================================================
const state = {
  user: null,        // { id, role, name }
  activeTab: null,   // current tab key
  shop: null,        // loaded shop data
  categories: [],
  products: [],
  toppings: [],
  cart: [],          // [{product, quantity, selectedToppings:[]}]
  activeCategory: null,
  orders: [],
  ingredients: [],
  stats: [],
  discounts: [],
  selectedDiscount: null,
};

// Account definitions (mirrors seed.js)
const ACCOUNTS = [
  { id: 1, role: 1, name: 'Nguyễn Văn An' },
  { id: 2, role: 1, name: 'Trần Thị Bích' },
  { id: 3, role: 1, name: 'Lê Văn Cường' },
  { id: 4, role: 1, name: 'Phạm Thị Dung' },
  { id: 5, role: 1, name: 'Hoàng Văn Em' },
  { id: 6, role: 2, name: 'Chủ Quán Phúc' },
  { id: 10, role: 2, name: 'Chủ Quán Lâm' },
  { id: 11, role: 2, name: 'Chủ Quán Vy' },
  { id: 7, role: 3, name: 'Shipper Minh' },
  { id: 8, role: 3, name: 'Shipper Hùng' },
  { id: 9, role: 3, name: 'Shipper Tuấn' },
];

const ROLE_LABELS = { 1: 'Khách hàng', 2: 'Chủ Shop', 3: 'Shipper' };

// =============================================================
// API HELPERS
// =============================================================
function authHeaders() {
  if (!state.user) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'x-user-id': String(state.user.id),
    'x-user-role': String(state.user.role),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// =============================================================
// TOAST
// =============================================================
function toast(msg, type = 'info', duration = 3000) {
  const icons = { success: 'check-circle', error: 'alert-circle', info: 'info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  lucide.createIcons({ nodes: [el] });
  setTimeout(() => el.remove(), duration);
}

// =============================================================
// MODAL
// =============================================================
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
  lucide.createIcons({ nodes: [document.getElementById('modal-box')] });
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// =============================================================
// FORMAT HELPERS
// =============================================================
function fmtPrice(n) {
  return Number(n).toLocaleString('vi-VN') + 'đ';
}
function fmtDate(d) {
  return new Date(d).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}
function statusBadge(status) {
  const map = {
    'Chờ duyệt':    'badge-pending',
    'Chờ xác nhận': 'badge-pending',
    'Chờ shipper':  'badge-waiting',
    'Đang giao':    'badge-shipping',
    'Thành công':   'badge-success',
    'Đã hủy':       'badge-canceled',
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
}

// =============================================================
// ROLE COLOR SWITCHER
// =============================================================
function applyRoleTheme(role) {
  const root = document.documentElement;
  if (role === 1) {
    root.style.setProperty('--role-primary',   'var(--customer-primary)');
    root.style.setProperty('--role-secondary', 'var(--customer-secondary)');
    root.style.setProperty('--role-glow',      'var(--customer-glow)');
  } else if (role === 2) {
    root.style.setProperty('--role-primary',   'var(--owner-primary)');
    root.style.setProperty('--role-secondary', 'var(--owner-secondary)');
    root.style.setProperty('--role-glow',      'var(--owner-glow)');
  } else {
    root.style.setProperty('--role-primary',   'var(--shipper-primary)');
    root.style.setProperty('--role-secondary', 'var(--shipper-secondary)');
    root.style.setProperty('--role-glow',      'var(--shipper-glow)');
  }
}

// =============================================================
// ACCOUNT SWITCHER
// =============================================================
function initAccountSwitcher() {
  const btn = document.getElementById('account-btn');
  const dropdown = document.getElementById('account-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
    btn.setAttribute('aria-expanded', false);
  });

  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = parseInt(item.dataset.userId);
      const role   = parseInt(item.dataset.role);
      const account = ACCOUNTS.find(a => a.id === userId);
      if (!account) return;

      // Reset state
      state.cart = [];
      state.shop = null;
      state.activeCategory = null;
      state.orders = [];

      switchAccount(account);
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
}

function switchAccount(account) {
  state.user = account;
  applyRoleTheme(account.role);
  updateAccountUI(account);
  buildRoleNav(account.role);
  updateCartBadge();
  // Navigate to first tab automatically
  const firstTab = getTabsForRole(account.role)[0];
  if (firstTab) switchTab(firstTab.key);
  document.getElementById('welcome-screen').classList.add('hidden');
  document.getElementById('view-container').classList.remove('hidden');
}

function updateAccountUI(account) {
  const roleClass = { 1: 'customer', 2: 'owner', 3: 'shipper' }[account.role];
  const initials  = account.name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
  document.getElementById('account-name').textContent = account.name;
  document.getElementById('account-role-badge').textContent = ROLE_LABELS[account.role];
  const avatar = document.getElementById('account-avatar');
  avatar.innerHTML = initials;
  avatar.className = `account-avatar ${roleClass}-avatar`;

  // Mark selected in dropdown
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.toggle('selected', parseInt(item.dataset.userId) === account.id);
  });
}

// =============================================================
// ROLE NAV
// =============================================================
function getTabsForRole(role) {
  if (role === 1) return [
    { key: 'shops',   icon: 'store',       label: 'Chọn Quán' },
    { key: 'menu',    icon: 'coffee',      label: 'Thực đơn' },
    { key: 'myorders',icon: 'receipt',     label: 'Đơn của tôi' },
  ];
  if (role === 2) return [
    { key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { key: 'ownorders', icon: 'package',          label: 'Đơn hàng' },
    { key: 'products',  icon: 'coffee',           label: 'Sản phẩm' },
    { key: 'inventory', icon: 'boxes',            label: 'Kho' },
    { key: 'vouchers',  icon: 'ticket',           label: 'Mã giảm giá' },
  ];
  if (role === 3) return [
    { key: 'find-orders',  icon: 'search',       label: 'Tìm đơn' },
    { key: 'my-delivery',  icon: 'bike',         label: 'Đang giao' },
  ];
  return [];
}

function buildRoleNav(role) {
  const nav = document.getElementById('role-nav');
  nav.innerHTML = '';
  getTabsForRole(role).forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab';
    btn.dataset.tab = tab.key;
    btn.innerHTML = `<i data-lucide="${tab.icon}"></i>${tab.label}`;
    btn.addEventListener('click', () => switchTab(tab.key));
    nav.appendChild(btn);
  });
  lucide.createIcons({ nodes: [nav] });
}

function switchTab(key) {
  state.activeTab = key;
  // Update nav highlight
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === key);
  });
  // Hide cart fab by default, shown only on menu tab
  document.getElementById('cart-fab').classList.add('hidden');
  renderView(key);
}

// =============================================================
// VIEW ROUTER
// =============================================================
function renderView(key) {
  const container = document.getElementById('view-container');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Đang tải...</p></div>';
  const views = {
    shops:        renderShopsView,
    menu:         renderMenuView,
    myorders:     renderMyOrdersView,
    dashboard:    renderDashboardView,
    ownorders:    renderOwnOrdersView,
    products:     renderProductsView,
    inventory:    renderInventoryView,
    vouchers:     renderVouchersView,
    'find-orders': renderFindOrdersView,
    'my-delivery': renderMyDeliveryView,
  };
  const fn = views[key];
  if (fn) fn(container);
  else container.innerHTML = `<div class="empty-state"><p>View "${key}" chưa được triển khai.</p></div>`;
}

// =============================================================
// ============  CUSTOMER VIEWS  ===============================
// =============================================================

// ---- 1. SHOPS LIST ----
async function renderShopsView(container) {
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="store"></i> Chọn Quán</h2>
        <p class="section-subtitle">Chọn quán để xem thực đơn và đặt đồ uống</p>
      </div>
    </div>
    <div class="grid-3" id="shops-grid"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shops = await apiFetch('/shops');
    const grid = document.getElementById('shops-grid');
    if (!shops.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i data-lucide="store"></i><p>Chưa có quán nào. Vui lòng kết nối MongoDB và đợi seed.</p></div>';
      lucide.createIcons({ nodes: [grid] });
      return;
    }
    grid.innerHTML = shops.map(shop => `
      <div class="shop-card" data-shop-id="${shop._id}" onclick="selectShop(${shop._id})">
        <h3 class="shop-name">${shop.name}</h3>
        <p class="shop-desc">${shop.description || 'Quán đồ uống'}</p>
        <div class="shop-meta">
          <span><i data-lucide="map-pin"></i>${shop.address}</span>
          <span><i data-lucide="phone"></i>${shop.phone}</span>
        </div>
      </div>`).join('');
    lucide.createIcons({ nodes: [grid] });
  } catch (e) {
    container.querySelector('#shops-grid').innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i data-lucide="alert-circle"></i><p>Lỗi tải dữ liệu: ${e.message}</p></div>`;
    lucide.createIcons({ nodes: [container] });
  }
}

window.selectShop = function(shopId) {
  state.shop = { _id: shopId };
  switchTab('menu');
};

// ---- 2. MENU ----
async function renderMenuView(container) {
  if (!state.shop) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="store"></i>
        <p>Bạn chưa chọn quán. Hãy vào tab <strong>Chọn Quán</strong> trước.</p>
        <button class="btn btn-primary" onclick="switchTab('shops')"><i data-lucide="arrow-left"></i> Chọn quán</button>
      </div>`;
    lucide.createIcons({ nodes: [container] });
    return;
  }

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title"><i data-lucide="coffee"></i> Thực đơn</h2>
        <p class="section-subtitle" id="shop-name-label">Đang tải tên quán...</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="switchTab('shops')"><i data-lucide="arrow-left"></i> Đổi quán</button>
    </div>
    <div class="category-filter" id="cat-filter"></div>
    <div class="product-grid" id="product-grid"></div>`;
  lucide.createIcons({ nodes: [container] });

  // Show cart FAB
  document.getElementById('cart-fab').classList.remove('hidden');

  try {
    const [shopRes, catRes, prodRes, toppingRes] = await Promise.all([
      apiFetch(`/shops/${state.shop._id}`),
      apiFetch(`/menu/categories?shop_id=${state.shop._id}`),
      apiFetch(`/menu/products?shop_id=${state.shop._id}`),
      apiFetch('/menu/toppings'),
    ]);
    state.shop = shopRes;
    state.categories = catRes;
    state.products = prodRes;
    state.toppings = toppingRes;
    document.getElementById('shop-name-label').textContent = shopRes.name;
    renderCategoryFilter();
    renderProductGrid();
  } catch (e) {
    toast('Lỗi tải menu: ' + e.message, 'error');
  }
}

function renderCategoryFilter() {
  const filter = document.getElementById('cat-filter');
  if (!filter) return;
  filter.innerHTML = `<button class="category-chip ${!state.activeCategory ? 'active' : ''}" onclick="filterCategory(null)">Tất cả</button>`;
  state.categories.forEach(c => {
    filter.innerHTML += `<button class="category-chip ${state.activeCategory === c._id ? 'active' : ''}" onclick="filterCategory(${c._id})">${c.name}</button>`;
  });
}

window.filterCategory = function(catId) {
  state.activeCategory = catId;
  renderCategoryFilter();
  renderProductGrid();
};

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const filtered = state.activeCategory
    ? state.products.filter(p => p.category_id?._id === state.activeCategory || p.category_id === state.activeCategory)
    : state.products;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i data-lucide="package-x"></i><p>Không có sản phẩm trong danh mục này.</p></div>';
    lucide.createIcons({ nodes: [grid] });
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="product-card ${!p.available ? 'unavailable' : ''}" onclick="${p.available ? `openProductModal(${p._id})` : ''}">
      ${p.image
        ? `<img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="product-img-placeholder" ${p.image ? 'style="display:none"' : ''}><i data-lucide="image"></i></div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-footer">
          <span class="product-price">${fmtPrice(p.price)}</span>
          ${p.available
            ? `<button class="btn-add-cart" onclick="event.stopPropagation();openProductModal(${p._id})"><i data-lucide="plus"></i></button>`
            : `<span class="unavailable-tag">Hết hàng</span>`}
        </div>
      </div>
    </div>`).join('');
  lucide.createIcons({ nodes: [grid] });
}

window.openProductModal = function(productId) {
  const product = state.products.find(p => p._id === productId);
  if (!product) return;

  let selectedToppings = [];
  let qty = 1;

  const toppingHtml = state.toppings.length ? `
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.5rem;">Chọn topping:</p>
    <div class="topping-grid" id="topping-grid">
      ${state.toppings.map(t => `
        <button class="topping-chip" data-topping-id="${t._id}" onclick="toggleTopping(${t._id})">
          <span>${t.name}</span>
          <span class="topping-price">+${fmtPrice(t.price)}</span>
        </button>`).join('')}
    </div>` : '';

  openModal(`
    <div class="modal-title">${product.name}</div>
    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:180px;object-fit:cover;border-radius:10px;margin-bottom:1rem;">` : ''}
    <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;">${product.description || ''}</p>
    <div class="modal-qty-row">
      <span>Số lượng:</span>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeModalQty(-1)"><i data-lucide="minus"></i></button>
        <span class="qty-num" id="modal-qty">1</span>
        <button class="qty-btn" onclick="changeModalQty(1)"><i data-lucide="plus"></i></button>
      </div>
    </div>
    ${toppingHtml}
    <p style="font-size:0.85rem;font-weight:700;margin-bottom:1rem;">
      Giá cơ bản: <span style="color:var(--customer-primary)">${fmtPrice(product.price)}</span>
    </p>
    <button class="btn btn-primary btn-full" onclick="addToCart(${productId})">
      <i data-lucide="shopping-cart"></i> Thêm vào giỏ hàng
    </button>
  `);

  window._modalProductId = productId;
  window._modalQty = qty;
  window._modalToppings = selectedToppings;
};

window.toggleTopping = function(toppingId) {
  const arr = window._modalToppings || [];
  const idx = arr.indexOf(toppingId);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(toppingId);
  window._modalToppings = arr;
  document.querySelectorAll('.topping-chip').forEach(chip => {
    chip.classList.toggle('selected', arr.includes(parseInt(chip.dataset.toppingId)));
  });
};

window.changeModalQty = function(delta) {
  window._modalQty = Math.max(1, (window._modalQty || 1) + delta);
  const el = document.getElementById('modal-qty');
  if (el) el.textContent = window._modalQty;
};

window.addToCart = function(productId) {
  const product = state.products.find(p => p._id === productId);
  if (!product) return;
  const qty = window._modalQty || 1;
  const toppingIds = window._modalToppings || [];
  const toppings = state.toppings.filter(t => toppingIds.includes(t._id));

  // Check if same product+toppings already in cart
  const existing = state.cart.find(c =>
    c.product._id === productId &&
    JSON.stringify(c.selectedToppings.map(t => t._id).sort()) === JSON.stringify(toppingIds.slice().sort())
  );
  if (existing) existing.quantity += qty;
  else state.cart.push({ product, quantity: qty, selectedToppings: toppings });

  updateCartBadge();
  closeModal();
  toast(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
};

// Cart sidebar
function updateCartBadge() {
  const total = state.cart.reduce((s, c) => s + c.quantity, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = total;
}

async function openCart() {
  document.getElementById('cart-sidebar').classList.remove('hidden');
  document.getElementById('cart-overlay').classList.remove('hidden');
  state.selectedDiscount = null;
  try {
    state.discounts = await apiFetch(`/discounts?shop_id=${state.shop._id}`);
  } catch (e) {
    state.discounts = [];
  }
  renderCartItems();
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.add('hidden');
  document.getElementById('cart-overlay').classList.add('hidden');
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');
  const empty     = document.getElementById('cart-empty');

  if (!state.cart.length) {
    empty.classList.remove('hidden');
    footer.classList.add('hidden');
    container.innerHTML = '';
    container.appendChild(empty);
    return;
  }

  empty.classList.add('hidden');
  footer.classList.remove('hidden');

  let total = 0;
  container.innerHTML = state.cart.map((item, idx) => {
    const toppingPrice = item.selectedToppings.reduce((s, t) => s + t.price, 0);
    const itemTotal = (item.product.price + toppingPrice) * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item">
        <div style="flex:1">
          <div class="cart-item-name">${item.product.name}</div>
          ${item.selectedToppings.length ? `<div class="cart-item-toppings">+ ${item.selectedToppings.map(t => t.name).join(', ')}</div>` : ''}
          <div class="cart-item-price">${fmtPrice(itemTotal)}</div>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="changeCartQty(${idx}, -1)"><i data-lucide="minus"></i></button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" onclick="changeCartQty(${idx}, 1)"><i data-lucide="plus"></i></button>
            <button class="btn-icon" onclick="removeCartItem(${idx})" title="Xóa" style="margin-left:0.5rem"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('cart-total-price').textContent = fmtPrice(total);
  lucide.createIcons({ nodes: [container] });
}

window.changeCartQty = function(idx, delta) {
  if (state.cart[idx]) {
    state.cart[idx].quantity = Math.max(1, state.cart[idx].quantity + delta);
    renderCartItems();
    updateCartBadge();
  }
};
window.removeCartItem = function(idx) {
  state.cart.splice(idx, 1);
  renderCartItems();
  updateCartBadge();
};

document.getElementById('cart-fab').addEventListener('click', openCart);
document.getElementById('cart-close-btn').addEventListener('click', closeCart);
document.getElementById('cart-overlay').addEventListener('click', closeCart);

window.openCheckoutModal = async function() {
  closeCart();

  // Reset selected discount
  state.selectedDiscount = null;

  // Load available discounts for the current shop
  try {
    state.discounts = await apiFetch(`/discounts?shop_id=${state.shop._id}`);
  } catch (e) {
    state.discounts = [];
  }

  // Calculate cart total price
  let cartTotal = 0;
  const itemsHtml = state.cart.map(item => {
    const toppingPrice = item.selectedToppings.reduce((s, t) => s + t.price, 0);
    const itemTotal = (item.product.price + toppingPrice) * item.quantity;
    cartTotal += itemTotal;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;margin-bottom:0.35rem;border-bottom:1px solid rgba(255,255,255,0.02);padding-bottom:0.35rem;">
        <div style="flex:1">
          <span style="font-weight:600;">${item.product.name}</span> x ${item.quantity}
          ${item.selectedToppings.length ? `<div style="font-size:0.72rem;color:var(--text-muted);">+ ${item.selectedToppings.map(t => t.name).join(', ')}</div>` : ''}
        </div>
        <div style="font-weight:600;margin-left:0.5rem;">${fmtPrice(itemTotal)}</div>
      </div>`;
  }).join('');

  const modalHtml = `
    <div class="modal-title"><i data-lucide="credit-card" style="display:inline-block;vertical-align:middle;margin-right:0.35rem;"></i>Thanh toán Đơn hàng</div>
    
    <div style="margin-bottom:1rem;background:rgba(255,255,255,0.02);border:1px solid var(--glass-border);border-radius:10px;padding:0.75rem;">
      <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-dim);margin-bottom:0.5rem;font-weight:700;">Tóm tắt đơn hàng</div>
      <div style="max-height:120px;overflow-y:auto;margin-bottom:0.5rem;padding-right:0.25rem;">
        ${itemsHtml}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--glass-border);">
        <span>Tổng tiền nước:</span>
        <strong id="checkout-subtotal">${fmtPrice(cartTotal)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-top:0.25rem;color:var(--accent-success);">
        <span>Giảm giá Voucher:</span>
        <strong id="checkout-discount-val">-0đ</strong>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;margin-top:0.5rem;padding-top:0.5rem;border-top:1px dashed rgba(255,255,255,0.12);">
        <span>Cần thanh toán:</span>
        <strong style="color:var(--customer-primary);" id="checkout-total-price">${fmtPrice(cartTotal)}</strong>
      </div>
    </div>

    <div class="form-group">
      <label>Số điện thoại nhận hàng <span class="required">*</span></label>
      <input type="tel" id="checkout-phone" placeholder="Ví dụ: 0901234567" maxlength="10">
    </div>
    <div class="form-group">
      <label>Địa chỉ giao hàng <span class="required">*</span></label>
      <textarea id="checkout-address" rows="2" placeholder="Số nhà, tên đường, phường/xã..."></textarea>
    </div>
    <div class="form-group">
      <label>Ghi chú (Tùy chọn)</label>
      <input type="text" id="checkout-note" placeholder="Ví dụ: Ít đá, ít ngọt...">
    </div>
    
    <div class="form-group" style="position:relative;margin-bottom:1.5rem;">
      <label>Mã giảm giá (Voucher)</label>
      <div class="voucher-dropdown-wrapper">
        <input type="text" id="checkout-voucher-input" placeholder="Nhập để tìm kiếm voucher..." autocomplete="off" style="width:100%;">
        <div id="checkout-voucher-list" class="glass-card hidden" style="position:absolute;top:100%;left:0;right:0;max-height:140px;overflow-y:auto;z-index:2000;margin-top:4px;padding:0.25rem;"></div>
      </div>
    </div>

    <button class="btn btn-primary btn-full" id="checkout-confirm-btn" onclick="submitCheckout()"><i data-lucide="send"></i> Xác nhận đặt hàng</button>
  `;

  openModal(modalHtml);

  // Initialize Searchable Dropdown inside Modal
  const voucherInput = document.getElementById('checkout-voucher-input');
  const voucherList = document.getElementById('checkout-voucher-list');

  if (voucherInput && voucherList) {
    const filterAndRenderCheckoutVouchers = (query = '') => {
      const q = query.trim().toLowerCase();
      const filtered = q === '' 
        ? state.discounts 
        : state.discounts.filter(d => d.name.toLowerCase().includes(q));

      let html = '';
      html += `
        <button class="voucher-option ${!state.selectedDiscount ? 'selected' : ''}" data-id="none">
          <span>Không áp dụng</span>
        </button>`;

      if (filtered.length) {
        html += filtered.map(d => `
          <button class="voucher-option ${state.selectedDiscount && state.selectedDiscount._id === d._id ? 'selected' : ''}" data-id="${d._id}">
            <strong>${d.name}</strong>
            <span style="color:var(--accent-success);font-weight:600;">-${fmtPrice(d.value)}</span>
          </button>`).join('');
      } else {
        html += `<div style="padding:0.5rem;text-align:center;font-size:0.75rem;color:var(--text-dim);">Không tìm thấy voucher</div>`;
      }

      voucherList.innerHTML = html;

      voucherList.querySelectorAll('.voucher-option').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const idVal = btn.dataset.id;
          if (idVal === 'none') {
            state.selectedDiscount = null;
            voucherInput.value = '';
          } else {
            const voucherId = parseInt(idVal);
            state.selectedDiscount = state.discounts.find(x => x._id === voucherId) || null;
            voucherInput.value = state.selectedDiscount ? state.selectedDiscount.name : '';
          }
          voucherList.classList.add('hidden');

          const discountVal = state.selectedDiscount ? state.selectedDiscount.value : 0;
          document.getElementById('checkout-discount-val').textContent = `-${fmtPrice(discountVal)}`;
          const finalTotal = Math.max(0, cartTotal - discountVal);
          document.getElementById('checkout-total-price').textContent = fmtPrice(finalTotal);
        };
      });
    };

    voucherInput.onfocus = () => {
      filterAndRenderCheckoutVouchers(voucherInput.value);
      voucherList.classList.remove('hidden');
    };

    voucherInput.oninput = (e) => {
      filterAndRenderCheckoutVouchers(e.target.value);
    };
  }
};

window.submitCheckout = async function() {
  const phone = document.getElementById('checkout-phone')?.value.trim();
  const address = document.getElementById('checkout-address')?.value.trim();
  const note = document.getElementById('checkout-note')?.value.trim();

  if (!phone || !address) { toast('Vui lòng nhập số điện thoại và địa chỉ giao hàng', 'error'); return; }
  if (!state.shop?._id) { toast('Chưa chọn quán', 'error'); return; }

  const btn = document.getElementById('checkout-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner spinner-sm"></div> Đang đặt hàng...';

  try {
    const body = {
      shop_id: state.shop._id,
      phone,
      address,
      note,
      discount_id: state.selectedDiscount ? state.selectedDiscount._id : null,
      items: state.cart.map(c => ({
        product_id: c.product._id,
        quantity: c.quantity,
        toppings: c.selectedToppings.map(t => t._id),
      })),
    };
    await apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) });
    state.cart = [];
    updateCartBadge();
    closeModal();
    toast('🎉 Đặt hàng thành công! Đơn hàng đang chờ shop duyệt.', 'success', 5000);
  } catch (e) {
    toast('Lỗi đặt hàng: ' + e.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send"></i> Xác nhận đặt hàng';
    lucide.createIcons({ nodes: [btn] });
  }
};

document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);

// ---- 3. MY ORDERS (Customer) ----
async function renderMyOrdersView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="receipt"></i> Đơn hàng của tôi</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderView('myorders')"><i data-lucide="refresh-cw"></i> Làm mới</button>
    </div>
    <div id="orders-wrap"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const orders = await apiFetch('/orders');
    state.orders = orders;
    const wrap = document.getElementById('orders-wrap');

    if (!orders.length) {
      wrap.innerHTML = `<div class="empty-state"><i data-lucide="package-x"></i><p>Chưa có đơn hàng nào. Hãy đặt đồ uống nhé!</p></div>`;
      lucide.createIcons({ nodes: [wrap] }); return;
    }

    wrap.innerHTML = `
      <div class="glass-card">
        <table class="orders-table">
          <thead><tr>
            <th>#</th><th>Thời gian</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Đánh giá</th>
          </tr></thead>
          <tbody id="orders-tbody"></tbody>
        </table>
      </div>`;

    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td class="order-id">#${o._id}</td>
        <td>${fmtDate(o.createdAt)}</td>
        <td class="order-address" title="${o.address}">${o.address}</td>
        <td class="order-price">${fmtPrice(o.price)}</td>
        <td>${statusBadge(o.status)}</td>
        <td>${o.status === 'Thành công' ? `<button class="btn btn-sm btn-secondary" onclick="openCommentModal(${o._id},${o.shop_id?._id || o.shop_id})"><i data-lucide="star"></i></button>` : '-'}</td>
      </tr>`).join('');
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    container.querySelector('#orders-wrap').innerHTML = `<div class="empty-state"><i data-lucide="alert-circle"></i><p>${e.message}</p></div>`;
    lucide.createIcons({ nodes: [container] });
  }
}

window.openCommentModal = function(orderId, shopId) {
  let selectedRating = 5;
  openModal(`
    <div class="modal-title">Đánh giá đơn hàng #${orderId}</div>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.75rem;">Chọn sao:</p>
    <div class="star-select" id="star-select">
      ${[1,2,3,4,5].map(s => `<button class="star-btn ${s <= 5 ? 'selected' : ''}" data-star="${s}" onclick="selectStar(${s})">★</button>`).join('')}
    </div>
    <div class="form-group">
      <label for="comment-text">Nhận xét của bạn</label>
      <textarea id="comment-text" rows="3" placeholder="Đồ uống ngon, giao hàng nhanh..."></textarea>
    </div>
    <div class="form-group">
      <label for="comment-product">ID Sản phẩm muốn đánh giá</label>
      <input type="number" id="comment-product" placeholder="Ví dụ: 1" min="1">
    </div>
    <button class="btn btn-primary btn-full" onclick="submitComment(${orderId})">
      <i data-lucide="send"></i> Gửi đánh giá
    </button>
  `);
  window._selectedRating = selectedRating;
};

window.selectStar = function(n) {
  window._selectedRating = n;
  document.querySelectorAll('.star-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.star) <= n);
  });
};

window.submitComment = async function(orderId) {
  const rating   = window._selectedRating || 5;
  const content  = document.getElementById('comment-text')?.value.trim();
  const prodId   = parseInt(document.getElementById('comment-product')?.value);
  if (!prodId)   { toast('Vui lòng nhập ID sản phẩm', 'error'); return; }
  if (!content)  { toast('Vui lòng nhập nhận xét', 'error'); return; }
  try {
    await apiFetch('/interactions/comments', {
      method: 'POST',
      body: JSON.stringify({ product_id: prodId, order_id: orderId, content, rating }),
    });
    closeModal();
    toast('Cảm ơn bạn đã đánh giá!', 'success');
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// =============================================================
// ============  SHOP OWNER VIEWS  =============================
// =============================================================

async function ensureOwnerShop() {
  if (state.shop && state.shop.user_id && (state.shop.user_id._id === state.user.id || state.shop.user_id === state.user.id)) {
    return state.shop;
  }
  const shops = await apiFetch('/shops');
  const myShop = shops.find(s => {
    const ownerId = s.user_id && typeof s.user_id === 'object' ? s.user_id._id : s.user_id;
    return ownerId === state.user.id;
  });
  if (myShop) {
    state.shop = myShop;
    return myShop;
  }
  throw new Error('Không tìm thấy cửa hàng nào liên kết với tài khoản này.');
}

// ---- 4. DASHBOARD (Owner) ----
async function renderDashboardView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="layout-dashboard"></i> Dashboard</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderView('dashboard')"><i data-lucide="refresh-cw"></i> Làm mới</button>
    </div>
    <div class="stats-grid" id="stats-grid">
      ${['Tổng đơn hôm nay','Chờ duyệt','Chờ Shipper','Doanh thu hôm nay'].map(l =>
        `<div class="stat-card owner-accent"><div class="stat-label">${l}</div><div class="stat-value"><div class="spinner spinner-sm"></div></div></div>`
      ).join('')}
    </div>
    <div class="section-header" style="margin-top:1.5rem">
      <h3 class="section-title" style="font-size:1rem"><i data-lucide="package"></i> Đơn hàng mới nhất</h3>
    </div>
    <div id="recent-orders-wrap"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shop = await ensureOwnerShop();
    const orders = await apiFetch(`/orders?shop_id=${shop._id}`);
    state.orders = orders;
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const waiting = orders.filter(o => o.status === 'Chờ duyệt').length;
    const waitShipper = orders.filter(o => o.status === 'Chờ shipper').length;
    const revenue = todayOrders.filter(o => o.status === 'Thành công').reduce((s, o) => s + o.price, 0);

    const cards = document.querySelectorAll('.stat-card');
    const vals = [todayOrders.length, waiting, waitShipper, fmtPrice(revenue)];
    cards.forEach((c, i) => {
      c.querySelector('.stat-value').textContent = vals[i];
    });

    const recent = orders.slice(0, 8);
    const wrap = document.getElementById('recent-orders-wrap');
    if (!recent.length) {
      wrap.innerHTML = '<div class="empty-state"><i data-lucide="package-x"></i><p>Chưa có đơn hàng</p></div>';
      lucide.createIcons({ nodes: [wrap] });
      return;
    }
    wrap.innerHTML = `
      <div class="glass-card">
        <table class="orders-table">
          <thead><tr><th>#</th><th>Khách</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
          <tbody>${recent.map(o => orderRow(o, true)).join('')}</tbody>
        </table>
      </div>`;
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    toast('Lỗi tải dashboard: ' + e.message, 'error');
  }
}

function ownerActionButtons(o) {
  if (o.status === 'Chờ duyệt') {
    return `
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${o._id}, 'Chờ xác nhận')">Xác nhận</button>
        <button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${o._id}, 'Đã hủy')">Hủy</button>
      </div>`;
  }
  if (o.status === 'Chờ xác nhận') {
    return `
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-sm btn-danger" onclick="updateOrderStatus(${o._id}, 'Đã hủy')">Hủy</button>
      </div>`;
  }
  return `<span style="color:var(--text-dim);font-size:0.8rem;">-</span>`;
}

function orderRow(o, showAction = false) {
  const customer = o.user_id?.name || `User #${o.user_id}`;
  return `
    <tr>
      <td class="order-id">#${o._id}</td>
      <td>${customer}</td>
      <td class="order-address" title="${o.address}">${o.address}</td>
      <td class="order-price">${fmtPrice(o.price)}</td>
      <td>${statusBadge(o.status)}</td>
      ${showAction ? `<td>${ownerActionButtons(o)}</td>` : '<td>-</td>'}
    </tr>`;
}

window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    toast(`Đã cập nhật trạng thái → ${newStatus}`, 'success');
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
  renderView(state.activeTab);
};

// ---- 5. OWN ORDERS (Owner) ----
async function renderOwnOrdersView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="package"></i> Quản lý Đơn hàng</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderView('ownorders')"><i data-lucide="refresh-cw"></i> Làm mới</button>
    </div>
    <div id="all-orders-wrap"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shop = await ensureOwnerShop();
    const orders = await apiFetch(`/orders?shop_id=${shop._id}`);
    state.orders = orders;
    const wrap = document.getElementById('all-orders-wrap');
    if (!orders.length) {
      wrap.innerHTML = '<div class="empty-state"><i data-lucide="package-x"></i><p>Chưa có đơn hàng nào</p></div>';
      lucide.createIcons({ nodes: [wrap] }); return;
    }
    wrap.innerHTML = `
      <div class="glass-card">
        <table class="orders-table">
          <thead><tr><th>#</th><th>Thời gian</th><th>Khách</th><th>Địa chỉ</th><th>Tổng tiền</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead>
          <tbody>${orders.map(o => `
            <tr>
              <td class="order-id">#${o._id}</td>
              <td style="font-size:0.78rem;color:var(--text-muted)">${fmtDate(o.createdAt)}</td>
              <td>${o.user_id?.name || `User #${o.user_id}`}</td>
              <td class="order-address" title="${o.address}">${o.address}</td>
              <td class="order-price">${fmtPrice(o.price)}</td>
              <td>${statusBadge(o.status)}</td>
              <td>${ownerActionButtons(o)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

// ---- 6. PRODUCTS MANAGEMENT (Owner) ----
async function renderProductsView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="coffee"></i> Quản lý Sản phẩm</h2>
      <button class="btn btn-primary btn-sm" onclick="openAddProductModal()"><i data-lucide="plus"></i> Thêm sản phẩm</button>
    </div>
    <div class="menu-table-wrap glass-card">
      <table class="menu-table">
        <thead><tr><th>Ảnh</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody id="products-tbody"></tbody>
      </table>
    </div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shop = await ensureOwnerShop();
    const [prods, cats] = await Promise.all([
      apiFetch(`/menu/products?shop_id=${shop._id}`),
      apiFetch(`/menu/categories?shop_id=${shop._id}`),
    ]);
    state.products = prods;
    state.categories = cats;
    const tbody = document.getElementById('products-tbody');
    if (!prods.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-dim)">Chưa có sản phẩm nào</td></tr>';
      return;
    }
    tbody.innerHTML = prods.map(p => `
      <tr>
        <td>${p.image
          ? `<img class="menu-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'">`
          : `<div class="menu-img-placeholder"><i data-lucide="image"></i></div>`}</td>
        <td><strong>${p.name}</strong><br><small style="color:var(--text-muted)">${p.description || ''}</small></td>
        <td>${p.category_id?.name || '-'}</td>
        <td class="order-price">${fmtPrice(p.price)}</td>
        <td><span class="avail-dot ${p.available ? 'yes' : 'no'}"></span> ${p.available ? 'Còn hàng' : 'Hết hàng'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-sm btn-secondary" onclick="openEditProductModal(${p._id})"><i data-lucide="edit-2"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p._id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>`).join('');
    lucide.createIcons({ nodes: [container] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

window.openAddProductModal = function() {
  const catOptions = state.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  openModal(`
    <div class="modal-title">Thêm Sản phẩm mới</div>
    <div class="form-group"><label>Tên sản phẩm <span class="required">*</span></label><input type="text" id="pname" placeholder="Trà Chanh Leo"></div>
    <div class="form-group"><label>Mô tả</label><input type="text" id="pdesc" placeholder="Mô tả ngắn..."></div>
    <div class="form-row">
      <div class="form-group"><label>Giá (đ) <span class="required">*</span></label><input type="number" id="pprice" placeholder="25000" min="0"></div>
      <div class="form-group"><label>Danh mục <span class="required">*</span></label>
        <select id="pcat">${catOptions}</select></div>
    </div>
    <div class="form-group"><label>Link ảnh <span class="required">*</span></label><input type="url" id="pimage" placeholder="https://..."></div>
    <div class="form-group"><label>Trạng thái</label>
      <select id="pavail"><option value="true">Còn hàng</option><option value="false">Hết hàng</option></select></div>
    <button class="btn btn-primary btn-full" onclick="submitAddProduct()"><i data-lucide="save"></i> Lưu sản phẩm</button>
  `);
};

window.submitAddProduct = async function() {
  try {
    const shop = await ensureOwnerShop();
    const body = {
      name: document.getElementById('pname')?.value.trim(),
      description: document.getElementById('pdesc')?.value.trim(),
      price: Number(document.getElementById('pprice')?.value),
      category_id: Number(document.getElementById('pcat')?.value),
      shop_id: shop._id,
      image: document.getElementById('pimage')?.value.trim(),
      available: document.getElementById('pavail')?.value === 'true',
    };
    if (!body.name || !body.price || !body.image) { toast('Vui lòng điền đủ thông tin bắt buộc', 'error'); return; }
    await apiFetch('/menu/products', { method: 'POST', body: JSON.stringify(body) });
    closeModal();
    toast('Thêm sản phẩm thành công!', 'success');
    renderProductsView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.openEditProductModal = function(productId) {
  const p = state.products.find(x => x._id === productId);
  if (!p) return;
  const catOptions = state.categories.map(c => `<option value="${c._id}" ${c._id===p.category_id||c._id===p.category_id?._id?'selected':''}>${c.name}</option>`).join('');
  openModal(`
    <div class="modal-title">Chỉnh sửa: ${p.name}</div>
    <div class="form-group"><label>Tên sản phẩm</label><input type="text" id="ep-name" value="${p.name}"></div>
    <div class="form-group"><label>Mô tả</label><input type="text" id="ep-desc" value="${p.description || ''}"></div>
    <div class="form-row">
      <div class="form-group"><label>Giá (đ)</label><input type="number" id="ep-price" value="${p.price}" min="0"></div>
      <div class="form-group"><label>Danh mục</label><select id="ep-cat">${catOptions}</select></div>
    </div>
    <div class="form-group"><label>Link ảnh</label><input type="url" id="ep-image" value="${p.image}"></div>
    <div class="form-group"><label>Trạng thái</label>
      <select id="ep-avail">
        <option value="true" ${p.available?'selected':''}>Còn hàng</option>
        <option value="false" ${!p.available?'selected':''}>Hết hàng</option>
      </select>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitEditProduct(${productId})"><i data-lucide="save"></i> Cập nhật</button>
  `);
};

window.submitEditProduct = async function(productId) {
  const body = {
    name: document.getElementById('ep-name')?.value.trim(),
    description: document.getElementById('ep-desc')?.value.trim(),
    price: Number(document.getElementById('ep-price')?.value),
    category_id: Number(document.getElementById('ep-cat')?.value),
    image: document.getElementById('ep-image')?.value.trim(),
    available: document.getElementById('ep-avail')?.value === 'true',
  };
  try {
    await apiFetch(`/menu/products/${productId}`, { method: 'PUT', body: JSON.stringify(body) });
    closeModal();
    toast('Cập nhật thành công!', 'success');
    renderProductsView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.deleteProduct = async function(productId) {
  if (!confirm('Xóa sản phẩm này?')) return;
  try {
    await apiFetch(`/menu/products/${productId}`, { method: 'DELETE' });
    toast('Đã xóa sản phẩm', 'success');
    renderProductsView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// ---- 7. INVENTORY (Owner) ----
async function renderInventoryView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="boxes"></i> Kho Nguyên liệu</h2>
      <button class="btn btn-primary btn-sm" onclick="openAddIngredientModal()"><i data-lucide="plus"></i> Thêm nguyên liệu</button>
    </div>
    <div id="ingredient-list"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shop = await ensureOwnerShop();
    const list = await apiFetch(`/interactions/ingredients?shop_id=${shop._id}`);
    state.ingredients = list;
    const wrap = document.getElementById('ingredient-list');
    if (!list.length) {
      wrap.innerHTML = '<div class="empty-state"><i data-lucide="package-x"></i><p>Chưa có nguyên liệu nào trong kho</p></div>';
      lucide.createIcons({ nodes: [wrap] }); return;
    }
    wrap.innerHTML = list.map(ing => `
      <div class="ingredient-item">
        <div>
          <div class="ingredient-name">${ing.name}</div>
          <div class="ingredient-qty">Số lượng: <strong>${ing.quantity}</strong> ${ing.unit || 'đơn vị'}</div>
        </div>
        <div class="ingredient-actions">
          <button class="btn btn-sm btn-secondary" onclick="openEditIngredientModal(${ing._id})"><i data-lucide="edit-2"></i></button>
        </div>
      </div>`).join('');
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

window.openAddIngredientModal = function() {
  openModal(`
    <div class="modal-title">Thêm Nguyên liệu</div>
    <div class="form-group"><label>Tên nguyên liệu <span class="required">*</span></label><input type="text" id="iname" placeholder="Ví dụ: Trà xanh"></div>
    <div class="form-row">
      <div class="form-group"><label>Số lượng <span class="required">*</span></label><input type="number" id="iqty" placeholder="100" min="0"></div>
      <div class="form-group"><label>Đơn vị</label><input type="text" id="iunit" placeholder="kg, lít, gói..."></div>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitAddIngredient()"><i data-lucide="save"></i> Lưu</button>
  `);
};

window.submitAddIngredient = async function() {
  try {
    const shop = await ensureOwnerShop();
    const body = {
      shop_id: shop._id,
      name: document.getElementById('iname')?.value.trim(),
      quantity: Number(document.getElementById('iqty')?.value),
      unit: document.getElementById('iunit')?.value.trim(),
    };
    if (!body.name) { toast('Nhập tên nguyên liệu', 'error'); return; }
    await apiFetch('/interactions/ingredients', { method: 'POST', body: JSON.stringify(body) });
    closeModal();
    toast('Thêm nguyên liệu thành công!', 'success');
    renderInventoryView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.openEditIngredientModal = function(ingId) {
  const ing = state.ingredients.find(x => x._id === ingId);
  if (!ing) return;
  openModal(`
    <div class="modal-title">Cập nhật: ${ing.name}</div>
    <div class="form-row">
      <div class="form-group"><label>Số lượng mới</label><input type="number" id="eq" value="${ing.quantity}" min="0"></div>
      <div class="form-group"><label>Đơn vị</label><input type="text" id="eu" value="${ing.unit || ''}"></div>
    </div>
    <button class="btn btn-primary btn-full" onclick="submitEditIngredient(${ingId})"><i data-lucide="save"></i> Cập nhật</button>
  `);
};

window.submitEditIngredient = async function(ingId) {
  const body = {
    quantity: Number(document.getElementById('eq')?.value),
    unit: document.getElementById('eu')?.value.trim(),
  };
  try {
    await apiFetch(`/interactions/ingredients/${ingId}`, { method: 'PUT', body: JSON.stringify(body) });
    closeModal();
    toast('Cập nhật kho thành công!', 'success');
    renderInventoryView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// =============================================================
// ============  VOUCHERS VIEWS  ===============================
// =============================================================

// ---- 7.5. VOUCHERS MANAGEMENT (Owner) ----
async function renderVouchersView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="ticket"></i> Quản lý Mã giảm giá</h2>
      <button class="btn btn-primary btn-sm" onclick="openAddVoucherModal()"><i data-lucide="plus"></i> Thêm mã giảm giá</button>
    </div>
    <div class="menu-table-wrap glass-card">
      <table class="menu-table">
        <thead><tr><th>Mã code</th><th>Mức giảm</th><th>Hạn sử dụng</th><th>Thao tác</th></tr></thead>
        <tbody id="vouchers-tbody"></tbody>
      </table>
    </div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const shop = await ensureOwnerShop();
    const discounts = await apiFetch(`/discounts?shop_id=${shop._id}`);
    state.discounts = discounts;
    const tbody = document.getElementById('vouchers-tbody');
    if (!discounts.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-dim)">Chưa có mã giảm giá nào</td></tr>';
      return;
    }
    tbody.innerHTML = discounts.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td class="order-price">-${fmtPrice(d.value)}</td>
        <td>${d.expiration ? fmtDate(d.expiration) : 'Không giới hạn hạn dùng'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn btn-sm btn-secondary" onclick="openEditVoucherModal(${d._id})"><i data-lucide="edit-2"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteVoucher(${d._id})"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>`).join('');
    lucide.createIcons({ nodes: [container] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

window.openAddVoucherModal = function() {
  openModal(`
    <div class="modal-title">Thêm Mã giảm giá mới</div>
    <div class="form-group"><label>Mã code <span class="required">*</span></label><input type="text" id="vname" placeholder="Ví dụ: KM20K"></div>
    <div class="form-group"><label>Giá trị giảm (đ) <span class="required">*</span></label><input type="number" id="vvalue" placeholder="20000" min="0"></div>
    <div class="form-group"><label>Hạn sử dụng (Không bắt buộc)</label><input type="datetime-local" id="vexpiration"></div>
    <button class="btn btn-primary btn-full" onclick="submitAddVoucher()"><i data-lucide="save"></i> Lưu mã</button>
  `);
};

window.submitAddVoucher = async function() {
  try {
    const shop = await ensureOwnerShop();
    const name = document.getElementById('vname')?.value.trim();
    const value = Number(document.getElementById('vvalue')?.value);
    const expirationVal = document.getElementById('vexpiration')?.value;
    
    if (!name || value === undefined) { toast('Nhập tên mã và giá trị giảm', 'error'); return; }
    
    const body = {
      name,
      value,
      shop_id: shop._id,
      expiration: expirationVal ? new Date(expirationVal).toISOString() : null
    };

    await apiFetch('/discounts', { method: 'POST', body: JSON.stringify(body) });
    closeModal();
    toast('Thêm mã giảm giá thành công!', 'success');
    renderVouchersView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.openEditVoucherModal = function(id) {
  const d = state.discounts.find(x => x._id === id);
  if (!d) return;
  const expStr = d.expiration ? new Date(d.expiration).toISOString().slice(0, 16) : '';
  openModal(`
    <div class="modal-title">Sửa: ${d.name}</div>
    <div class="form-group"><label>Mã code <span class="required">*</span></label><input type="text" id="ev-name" value="${d.name}"></div>
    <div class="form-group"><label>Giá trị giảm (đ) <span class="required">*</span></label><input type="number" id="ev-value" value="${d.value}" min="0"></div>
    <div class="form-group"><label>Hạn sử dụng</label><input type="datetime-local" id="ev-expiration" value="${expStr}"></div>
    <button class="btn btn-primary btn-full" onclick="submitEditVoucher(${id})"><i data-lucide="save"></i> Cập nhật</button>
  `);
};

window.submitEditVoucher = async function(id) {
  try {
    const name = document.getElementById('ev-name')?.value.trim();
    const value = Number(document.getElementById('ev-value')?.value);
    const expirationVal = document.getElementById('ev-expiration')?.value;
    
    if (!name || value === undefined) { toast('Nhập tên mã và giá trị giảm', 'error'); return; }
    
    const body = {
      name,
      value,
      expiration: expirationVal ? new Date(expirationVal).toISOString() : null
    };

    await apiFetch(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    closeModal();
    toast('Cập nhật mã giảm giá thành công!', 'success');
    renderVouchersView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.deleteVoucher = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này không?')) return;
  try {
    await apiFetch(`/discounts/${id}`, { method: 'DELETE' });
    toast('Đã xóa mã giảm giá', 'success');
    renderVouchersView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// =============================================================
// ============  SHIPPER VIEWS  ================================
// =============================================================

// ---- 8. FIND ORDERS (Shipper) ----
async function renderFindOrdersView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="search"></i> Tìm Đơn Giao</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderView('find-orders')"><i data-lucide="refresh-cw"></i> Làm mới</button>
    </div>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1.25rem">Các đơn hàng đang chờ xác nhận để shipper nhận giao:</p>
    <div id="find-orders-list"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const orders = await apiFetch('/orders?status=Chờ xác nhận');
    const wrap = document.getElementById('find-orders-list');
    if (!orders.length) {
      wrap.innerHTML = '<div class="empty-state"><i data-lucide="package-check"></i><p>Không có đơn nào đang chờ shipper nhận giao</p></div>';
      lucide.createIcons({ nodes: [wrap] }); return;
    }
    wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.75rem">
      ${orders.map(o => `
        <div class="shipper-order-card">
          <div class="shipper-order-info">
            <div class="shipper-order-id">#${o._id} · ${fmtDate(o.createdAt)}</div>
            <div class="shipper-order-addr"><i data-lucide="map-pin" style="width:13px;height:13px;display:inline-block;margin-right:3px"></i>${o.address}</div>
            <div class="shipper-order-meta">📞 ${o.phone}${o.note ? ` · 📝 ${o.note}` : ''}</div>
          </div>
          <div class="shipper-order-price">${fmtPrice(o.price)}</div>
          <div class="shipper-order-actions">
            <button class="btn btn-sm btn-success" onclick="claimOrder(${o._id})">
              <i data-lucide="package-check"></i> Nhận đơn
            </button>
          </div>
        </div>`).join('')}
    </div>`;
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

window.claimOrder = async function(orderId) {
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Chờ shipper' }) });
    toast(`✅ Đã nhận đơn #${orderId}! Chuyển sang "Chờ shipper"`, 'success', 4000);
    renderFindOrdersView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// ---- 9. MY DELIVERY (Shipper) ----
async function renderMyDeliveryView(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2 class="section-title"><i data-lucide="bike"></i> Đơn Đang Giao</h2>
      <button class="btn btn-secondary btn-sm" onclick="renderView('my-delivery')"><i data-lucide="refresh-cw"></i> Làm mới</button>
    </div>
    <div id="delivery-list"></div>`;
  lucide.createIcons({ nodes: [container] });

  try {
    const [waitOrders, shippingOrders] = await Promise.all([
      apiFetch('/orders?status=Chờ shipper'),
      apiFetch('/orders?status=Đang giao')
    ]);
    const orders = [...waitOrders, ...shippingOrders];
    const wrap = document.getElementById('delivery-list');
    if (!orders.length) {
      wrap.innerHTML = '<div class="empty-state"><i data-lucide="bike"></i><p>Bạn chưa có đơn nào đang nhận hoặc đang giao</p></div>';
      lucide.createIcons({ nodes: [wrap] }); return;
    }
    wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.75rem">
      ${orders.map(o => {
        let actionButtons = '';
        if (o.status === 'Chờ shipper') {
          actionButtons = `
            <button class="btn btn-sm btn-success" onclick="pickupOrder(${o._id})">
              <i data-lucide="shopping-bag"></i> Đã nhận đơn tại shop
            </button>`;
        } else if (o.status === 'Đang giao') {
          actionButtons = `
            <div style="display:flex;gap:0.4rem;">
              <button class="btn btn-sm btn-success" onclick="completeOrder(${o._id})">
                <i data-lucide="check-circle"></i> Giao thành công
              </button>
              <button class="btn btn-sm btn-danger" onclick="cancelOrder(${o._id})">
                <i data-lucide="x-circle"></i> Hủy giao hàng
              </button>
            </div>`;
        }
        return `
          <div class="shipper-order-card">
            <div class="shipper-order-info">
              <div class="shipper-order-id">#${o._id} · ${fmtDate(o.createdAt)} · ${statusBadge(o.status)}</div>
              <div class="shipper-order-addr"><i data-lucide="map-pin" style="width:13px;height:13px;display:inline-block;margin-right:3px"></i>${o.address}</div>
              <div class="shipper-order-meta">📞 ${o.phone}${o.note ? ` · 📝 ${o.note}` : ''}</div>
            </div>
            <div class="shipper-order-price">${fmtPrice(o.price)}</div>
            <div class="shipper-order-actions">
              ${actionButtons}
            </div>
          </div>`;
      }).join('')}
    </div>`;
    lucide.createIcons({ nodes: [wrap] });
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
}

window.pickupOrder = async function(orderId) {
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Đang giao' }) });
    toast(`✅ Đã nhận đồ uống tại shop!`, 'success');
    renderMyDeliveryView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.completeOrder = async function(orderId) {
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Thành công' }) });
    toast(`🎉 Đơn #${orderId} đã giao thành công!`, 'success', 4000);
    renderMyDeliveryView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

window.cancelOrder = async function(orderId) {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
  try {
    await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Đã hủy' }) });
    toast(`❌ Đơn hàng #${orderId} đã hủy giao hàng!`, 'error');
    renderMyDeliveryView(document.getElementById('view-container'));
  } catch (e) {
    toast('Lỗi: ' + e.message, 'error');
  }
};

// =============================================================
// API STATUS CHECK
// =============================================================
async function checkApiStatus() {
  const badge = document.getElementById('api-status');
  try {
    const res = await fetch('http://localhost:5000');
    if (res.ok) {
      badge.className = 'api-status-badge online';
      badge.querySelector('.status-text').textContent = 'Backend: Online';
    } else throw new Error();
  } catch {
    badge.className = 'api-status-badge offline';
    badge.querySelector('.status-text').textContent = 'Backend: Offline';
  }
}

// =============================================================
// MODAL CLOSE
// =============================================================
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// =============================================================
// INIT
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initAccountSwitcher();
  checkApiStatus();
  setInterval(checkApiStatus, 15000);

  // Close searchable voucher dropdown list on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.voucher-dropdown-wrapper')) {
      const list = document.getElementById('voucher-dropdown-list');
      if (list) list.classList.add('hidden');
    }
  });
});
