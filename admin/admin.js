// ===== ADMIN CONFIG =====
const ADMIN_PASSWORD = 'afrae2024'; // Change this!
const AUTH_KEY = 'afrae_admin_auth';
const ORDERS_KEY = 'afrae_orders';
const PRODUCTS_KEY = 'afrae_products';

const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Vase Arabesque', price: 280, category: 'Vases', description: 'Un vase artisanal sculpté à la main en gypse pur.', image: '/assets/product-1.jpg', inStock: true, stock: 5 },
  { id: '2', name: 'Bougeoir Floral', price: 195, category: 'Bougeoirs', description: 'Bougeoir en gypse aux formes florales délicates.', image: '/assets/product-2.jpg', inStock: true, stock: 8 },
  { id: '3', name: 'Miroir Baroque', price: 450, category: 'Miroirs', description: 'Cadre de miroir baroque sculpté en gypse blanc.', image: '/assets/product-3.jpg', inStock: true, stock: 3 },
  { id: '4', name: 'Plateau Géométrique', price: 320, category: 'Plateaux', description: 'Plateau décoratif en gypse aux motifs géométriques.', image: '/assets/product-4.jpg', inStock: true, stock: 6 },
  { id: '5', name: 'Sculpture Murale', price: 580, category: 'Sculptures', description: 'Sculpture murale en relief, travail artisanal minutieux.', image: '/assets/product-1.jpg', inStock: true, stock: 2 },
  { id: '6', name: 'Coupe Décorative', price: 240, category: 'Coupes', description: 'Coupe décorative en gypse blanc, aux lignes épurées.', image: '/assets/product-2.jpg', inStock: false, stock: 0 }
];

// ===== AUTH =====
function isLoggedIn() { return sessionStorage.getItem(AUTH_KEY) === 'true'; }
function login(pwd) {
  if (pwd === ADMIN_PASSWORD) { sessionStorage.setItem(AUTH_KEY, 'true'); return true; }
  return false;
}
function logout() { sessionStorage.removeItem(AUTH_KEY); location.reload(); }

// ===== DATA =====
function getProducts() {
  try {
    const s = localStorage.getItem(PRODUCTS_KEY);
    return s ? JSON.parse(s) : DEFAULT_PRODUCTS;
  } catch { return DEFAULT_PRODUCTS; }
}
function saveProducts(products) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { return []; }
}
function saveOrders(orders) { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
function updateOrder(id, updates) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) { orders[idx] = { ...orders[idx], ...updates }; saveOrders(orders); }
}
function deleteOrder(id) { saveOrders(getOrders().filter(o => o.id !== id)); }

// ===== TOAST =====
function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== ICONS =====
const ic = {
  orders: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
  products: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
  dashboard: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

// ===== CURRENT TAB =====
let currentTab = 'dashboard';
let editingProduct = null;

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
  const title = { dashboard: 'Tableau de bord', orders: 'Commandes', products: 'Produits' };
  document.getElementById('page-title').textContent = title[tab] || tab;
  renderTab(tab);
}

function renderTab(tab) {
  const content = document.getElementById('tab-content');
  if (tab === 'dashboard') renderDashboard(content);
  else if (tab === 'orders') renderOrders(content);
  else if (tab === 'products') renderProducts(content);
}

// ===== DASHBOARD =====
function renderDashboard(el) {
  const orders = getOrders();
  const products = getProducts();
  const totalRevenue = orders.filter(o => o.paymentStatus === 'payee').reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.deliveryStatus === 'en_attente').length;

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">Commandes totales</div>
        <div class="stat-card-value">${orders.length}</div>
        <div class="stat-card-sub">Toutes les commandes</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">En attente</div>
        <div class="stat-card-value">${pending}</div>
        <div class="stat-card-sub">À traiter</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Revenus payés</div>
        <div class="stat-card-value">${totalRevenue}</div>
        <div class="stat-card-sub">MAD encaissés</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Produits</div>
        <div class="stat-card-value">${products.length}</div>
        <div class="stat-card-sub">${products.filter(p=>p.inStock).length} en stock</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Dernières commandes</div>
        <button class="btn btn-outline btn-sm" onclick="setTab('orders')">Voir toutes</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Client</th><th>Total</th><th>Livraison</th><th>Paiement</th><th>Date</th></tr></thead>
            <tbody>
              ${orders.slice(0, 5).map(o => orderRow(o)).join('') || '<tr><td colspan="5"><div class="empty-table">Aucune commande</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ===== ORDERS =====
function renderOrders(el) {
  const orders = getOrders();
  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Commandes (${orders.length})</div>
        <div style="display:flex;gap:8px;align-items:center">
          <select onchange="filterOrders(this.value)" id="order-filter" style="padding:7px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:0.8rem;cursor:pointer">
            <option value="">Toutes</option>
            <option value="en_attente">En attente</option>
            <option value="livree">Livrées</option>
            <option value="annulee">Annulées</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table id="orders-table">
            <thead><tr><th>ID</th><th>Client</th><th>Articles</th><th>Total</th><th>Livraison</th><th>Paiement</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody id="orders-body">
              ${renderOrderRows(orders)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function filterOrders(status) {
  const orders = status ? getOrders().filter(o => o.deliveryStatus === status) : getOrders();
  document.getElementById('orders-body').innerHTML = renderOrderRows(orders);
}

function renderOrderRows(orders) {
  if (!orders.length) return '<tr><td colspan="8"><div class="empty-table">Aucune commande pour le moment.</div></td></tr>';
  return orders.map(o => `
    <tr>
      <td style="font-size:0.75rem;color:var(--muted);font-family:monospace">${o.id}</td>
      <td>
        <div style="font-weight:500">${o.customerName}</div>
        <div style="font-size:0.78rem;color:var(--muted)">${o.customerPhone}</div>
        <div style="font-size:0.75rem;color:var(--muted)">${o.customerCity}</div>
      </td>
      <td>
        <div class="order-items-mini">
          ${(o.items||[]).map(i => `<span>${i.name} ×${i.quantity}</span>`).join('')}
        </div>
      </td>
      <td style="font-weight:600;color:var(--primary)">${o.total} MAD</td>
      <td>
        <select class="inline-select" onchange="updateDelivery('${o.id}', this.value)">
          <option value="en_attente" ${o.deliveryStatus==='en_attente'?'selected':''}>En attente</option>
          <option value="livree" ${o.deliveryStatus==='livree'?'selected':''}>Livrée</option>
          <option value="annulee" ${o.deliveryStatus==='annulee'?'selected':''}>Annulée</option>
        </select>
      </td>
      <td>
        <select class="inline-select" onchange="updatePayment('${o.id}', this.value)">
          <option value="non_payee" ${o.paymentStatus==='non_payee'?'selected':''}>Non payée</option>
          <option value="payee" ${o.paymentStatus==='payee'?'selected':''}>Payée</option>
        </select>
      </td>
      <td style="font-size:0.8rem;color:var(--muted);white-space:nowrap">
        ${new Date(o.createdAt).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric'})}
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteOrderById('${o.id}')">${ic.trash}</button>
      </td>
    </tr>
  `).join('');
}

function orderRow(o) {
  const dColors = { en_attente: 'badge-warning', livree: 'badge-success', annulee: 'badge-danger' };
  const dLabels = { en_attente: 'En attente', livree: 'Livrée', annulee: 'Annulée' };
  return `
    <tr>
      <td style="font-weight:500">${o.customerName}<br><span style="font-size:0.78rem;color:var(--muted)">${o.customerCity}</span></td>
      <td style="font-weight:600;color:var(--primary)">${o.total} MAD</td>
      <td><span class="badge ${dColors[o.deliveryStatus]}">${dLabels[o.deliveryStatus]}</span></td>
      <td><span class="badge ${o.paymentStatus==='payee'?'badge-success':'badge-muted'}">${o.paymentStatus==='payee'?'Payée':'Non payée'}</span></td>
      <td style="font-size:0.8rem;color:var(--muted)">${new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
    </tr>
  `;
}

function updateDelivery(id, status) {
  updateOrder(id, { deliveryStatus: status });
  showToast('Statut de livraison mis à jour', 'success');
}

function updatePayment(id, status) {
  updateOrder(id, { paymentStatus: status });
  showToast('Statut de paiement mis à jour', 'success');
}

function deleteOrderById(id) {
  if (!confirm('Supprimer cette commande ?')) return;
  deleteOrder(id);
  setTab('orders');
  showToast('Commande supprimée', 'success');
}

// ===== PRODUCTS =====
function renderProducts(el) {
  const products = getProducts();
  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Produits (${products.length})</div>
        <button class="btn btn-primary btn-sm" onclick="openProductModal()">${ic.plus} Ajouter</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Image</th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              ${products.length ? products.map(p => `
                <tr>
                  <td><img src="${p.image}" alt="${p.name}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;background:var(--bg)"></td>
                  <td style="font-weight:500">${p.name}</td>
                  <td style="color:var(--muted)">${p.category}</td>
                  <td style="font-weight:600;color:var(--primary)">${p.price} MAD</td>
                  <td>${p.stock}</td>
                  <td><span class="badge ${p.inStock ? 'badge-success' : 'badge-danger'}">${p.inStock ? 'En stock' : 'Rupture'}</span></td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button class="btn btn-sm btn-outline" onclick="openProductModal('${p.id}')">${ic.edit}</button>
                      <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">${ic.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="7"><div class="empty-table">Aucun produit.</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Product Modal -->
    <div class="modal-overlay" id="product-modal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="modal-title">Nouveau produit</div>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nom *</label>
            <input type="text" id="p-name" placeholder="Nom du produit">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Prix (MAD) *</label>
              <input type="number" id="p-price" min="0" placeholder="Ex: 250">
            </div>
            <div class="form-group">
              <label>Stock</label>
              <input type="number" id="p-stock" min="0" placeholder="Quantité disponible">
            </div>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <input type="text" id="p-cat" placeholder="Ex: Vases, Bougeoirs, Miroirs...">
          </div>
          <div class="form-group">
            <label>URL de l'image</label>
            <input type="text" id="p-img" placeholder="/assets/product-1.jpg">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="p-desc" rows="3" placeholder="Description du produit..."></textarea>
          </div>
          <div class="form-group">
            <div class="toggle-row">
              <label class="toggle">
                <input type="checkbox" id="p-stock-check" checked>
                <span class="toggle-slider"></span>
              </label>
              <label for="p-stock-check">En stock</label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="saveProduct()">Enregistrer</button>
        </div>
      </div>
    </div>
  `;
}

function openProductModal(id = null) {
  editingProduct = id;
  document.getElementById('modal-title').textContent = id ? 'Modifier le produit' : 'Nouveau produit';
  if (id) {
    const p = getProducts().find(x => x.id === id);
    if (p) {
      document.getElementById('p-name').value = p.name;
      document.getElementById('p-price').value = p.price;
      document.getElementById('p-stock').value = p.stock || 0;
      document.getElementById('p-cat').value = p.category || '';
      document.getElementById('p-img').value = p.image || '';
      document.getElementById('p-desc').value = p.description || '';
      document.getElementById('p-stock-check').checked = p.inStock;
    }
  } else {
    document.getElementById('p-name').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-stock').value = '';
    document.getElementById('p-cat').value = '';
    document.getElementById('p-img').value = '';
    document.getElementById('p-desc').value = '';
    document.getElementById('p-stock-check').checked = true;
  }
  document.getElementById('product-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('product-modal').classList.remove('open');
}

function saveProduct() {
  const name = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  if (!name || isNaN(price)) { showToast('Nom et prix obligatoires', 'error'); return; }

  const productData = {
    name,
    price,
    stock: parseInt(document.getElementById('p-stock').value) || 0,
    category: document.getElementById('p-cat').value.trim() || 'Divers',
    image: document.getElementById('p-img').value.trim() || '/assets/product-1.jpg',
    description: document.getElementById('p-desc').value.trim(),
    inStock: document.getElementById('p-stock-check').checked,
  };

  const products = getProducts();
  if (editingProduct) {
    const idx = products.findIndex(p => p.id === editingProduct);
    if (idx !== -1) products[idx] = { ...products[idx], ...productData };
    showToast('Produit modifié', 'success');
  } else {
    products.push({ id: Date.now().toString(), ...productData });
    showToast('Produit ajouté', 'success');
  }
  saveProducts(products);
  closeModal();
  setTab('products');
}

function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  saveProducts(getProducts().filter(p => p.id !== id));
  showToast('Produit supprimé', 'success');
  setTab('products');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showApp();
  }

  // Login form
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const pwd = document.getElementById('admin-password').value;
    if (login(pwd)) {
      showApp();
    } else {
      showToast('Mot de passe incorrect', 'error');
    }
  });
});

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  setTab('dashboard');
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});
