// ============================================================
// Perla Admin — admin.js
// Firebase Firestore — commandes visibles sur tous les appareils
// ============================================================

// ===== MÊME CONFIG FIREBASE QUE app.js =====
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDUI_nyb_UiEKg-vYmgt-NhjloprrdhmGM",
  authDomain:        "perla-accessories.firebaseapp.com",
  projectId:         "perla-accessories",
  storageBucket:     "perla-accessories.firebasestorage.app",
  messagingSenderId: "79521737952",
  appId:             "1:79521737952:web:d1f499fbf797806a03f485"
};

const ADMIN_PASSWORD = "perla2024"; // ⚠️ Changez ce mot de passe !
const AUTH_KEY       = 'perla_admin_auth';
const ORDERS_KEY     = 'perla_orders';
const PRODUCTS_KEY   = 'perla_products';

let db = null;
let firebaseReady = false;
let allOrders = [];
let currentOrderId = null;

// ===== FIREBASE INIT =====
function initFirebase() {
  return new Promise((resolve) => {
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
    s1.onload = () => {
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
      s2.onload = () => {
        try {
          if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
          db = firebase.firestore();
          firebaseReady = true;
          setSyncStatus('connected', '☁️ Cloud connecté');
        } catch(e) {
          firebaseReady = false;
          setSyncStatus('local', '⚠️ Mode local');
        }
        resolve();
      };
      s2.onerror = () => { firebaseReady = false; setSyncStatus('local', '⚠️ Mode local'); resolve(); };
      document.head.appendChild(s2);
    };
    s1.onerror = () => { firebaseReady = false; setSyncStatus('local', '⚠️ Mode local'); resolve(); };
    document.head.appendChild(s1);
  });
}

function setSyncStatus(type, text) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = 'sync-status ' + type;
  el.querySelector('span').textContent = text;
}

// ===== AUTH =====
function login() {
  const pwd = document.getElementById('admin-password').value;
  if (pwd === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'ok');
    document.getElementById('login-screen').style.display  = 'none';
    document.getElementById('admin-panel').style.display   = 'flex';
    loadOrders();
    loadProducts();
  } else {
    document.getElementById('login-error').textContent = '❌ Mot de passe incorrect';
    document.getElementById('admin-password').value = '';
  }
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}

function checkAuth() {
  if (localStorage.getItem(AUTH_KEY) === 'ok') {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display  = 'flex';
    loadOrders();
    loadProducts();
  }
}

// ===== TABS =====
function showTab(tab) {
  ['orders','products','stats'].forEach(t => {
    const s = document.getElementById('section-' + t);
    const n = document.getElementById('tab-' + t);
    if (s) s.style.display = t === tab ? 'block' : 'none';
    if (n) n.classList.toggle('active', t === tab);
  });
  if (tab === 'stats') renderStats();
}

// ===== LOAD ORDERS =====
async function loadOrders() {
  const container = document.getElementById('orders-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Chargement des commandes...</span></div>';

  if (firebaseReady && db) {
    try {
      const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(300).get();
      allOrders = snapshot.docs.map(doc => ({ ...doc.data(), _source: 'cloud' }));
    } catch(e) {
      console.warn('Erreur Firebase lecture:', e);
      allOrders = getLocalOrders();
    }
  } else {
    allOrders = getLocalOrders();
  }

  // Merge local orders not yet in cloud
  if (!firebaseReady) {
    const local = getLocalOrders();
    local.forEach(lo => {
      if (!allOrders.find(o => o.id === lo.id)) allOrders.push(lo);
    });
  }

  // Update badge
  const pending = allOrders.filter(o => o.deliveryStatus === 'en_attente').length;
  const badge = document.getElementById('orders-badge');
  if (badge) { badge.textContent = pending > 0 ? pending : ''; badge.style.display = pending > 0 ? '' : 'none'; }

  renderOrdersTable(allOrders);
}

function getLocalOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch { return []; }
}

// ===== RENDER ORDERS TABLE =====
function renderOrdersTable(orders) {
  const container = document.getElementById('orders-container');
  if (!orders.length) {
    container.innerHTML = '<div class="empty-orders"><div style="font-size:3rem">📭</div><h3>Aucune commande</h3><p>Les nouvelles commandes apparaîtront ici</p></div>';
    return;
  }

  const sourceInfo = firebaseReady
    ? '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:0.78rem;color:#7ecb7e"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg> ' + orders.length + ' commande(s) synchronisée(s) depuis le cloud — visibles sur tous vos appareils</div>'
    : '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:0.78rem;color:#f0a060">⚠️ Mode local — configurez Firebase pour la synchronisation multi-appareils</div>';

  container.innerHTML = sourceInfo +
    '<div class="orders-table"><table>' +
      '<thead><tr>' +
        '<th>Commande</th>' +
        '<th>Client</th>' +
        '<th>Ville</th>' +
        '<th>Total</th>' +
        '<th>Statut livraison</th>' +
        '<th>Paiement</th>' +
        '<th>Date</th>' +
        '<th></th>' +
      '</tr></thead>' +
      '<tbody>' +
        orders.map(o => orderRowHTML(o)).join('') +
      '</tbody>' +
    '</table></div>';
}

function orderRowHTML(o) {
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';
  return '<tr>' +
    '<td><span class="order-id">' + o.id + '</span></td>' +
    '<td><div class="customer-name">' + (o.customerName || '—') + '</div><div class="customer-phone">' + (o.customerPhone || '') + '</div></td>' +
    '<td>' + (o.customerCity || '—') + '</td>' +
    '<td><strong>' + (o.total || 0) + ' MAD</strong></td>' +
    '<td><span class="status-badge status-' + (o.deliveryStatus || 'en_attente') + '">' + statusLabel(o.deliveryStatus) + '</span></td>' +
    '<td><span class="status-badge pay-' + (o.paymentStatus || 'non_payee') + '">' + payLabel(o.paymentStatus) + '</span></td>' +
    '<td style="font-size:0.78rem;color:var(--muted)">' + date + '</td>' +
    '<td>' +
      '<button class="action-btn" onclick="openOrderDetail(\'' + o.id + '\')" title="Voir détail">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '</button>' +
    '</td>' +
  '</tr>';
}

function statusLabel(s) {
  return { en_attente:'⏳ En attente', confirmee:'✅ Confirmée', en_livraison:'🚚 En livraison', livree:'🎉 Livrée', annulee:'❌ Annulée' }[s] || s || '⏳ En attente';
}
function payLabel(s) {
  return { non_payee:'Non payée', payee:'Payée' }[s] || s || 'Non payée';
}

// ===== FILTER =====
function filterOrders(status) {
  const filtered = status ? allOrders.filter(o => o.deliveryStatus === status) : allOrders;
  renderOrdersTable(filtered);
}

// ===== ORDER DETAIL MODAL =====
function openOrderDetail(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  currentOrderId = id;
  const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  document.getElementById('modal-content').innerHTML =
    '<div class="order-detail-header">' +
      '<div class="order-detail-id">' + o.id + '</div>' +
      '<div class="order-detail-customer">' + (o.customerName || '—') + '</div>' +
      '<div style="color:var(--muted);font-size:0.8rem;margin-top:4px">' + date + '</div>' +
    '</div>' +

    '<div class="order-detail-section">' +
      '<h4>Informations client</h4>' +
      '<div class="order-info-grid">' +
        '<div class="order-info-item"><div class="order-info-label">Téléphone</div><div class="order-info-val"><a href="tel:' + o.customerPhone + '" style="color:var(--gold-dark)">' + (o.customerPhone || '—') + '</a></div></div>' +
        '<div class="order-info-item"><div class="order-info-label">Ville</div><div class="order-info-val">' + (o.customerCity || '—') + '</div></div>' +
        '<div class="order-info-item" style="grid-column:1/-1"><div class="order-info-label">Adresse</div><div class="order-info-val">' + (o.customerAddress || '—') + '</div></div>' +
        (o.notes ? '<div class="order-info-item" style="grid-column:1/-1"><div class="order-info-label">Notes</div><div class="order-info-val">' + o.notes + '</div></div>' : '') +
      '</div>' +
    '</div>' +

    '<div class="order-detail-section">' +
      '<h4>Articles commandés</h4>' +
      (o.items || []).map(item =>
        '<div class="order-item">' +
          '<span>' + item.name + ' × ' + item.quantity + '</span>' +
          '<span>' + (item.price * item.quantity) + ' MAD</span>' +
        '</div>'
      ).join('') +
      '<div class="order-total-row"><span>Total</span><span>' + (o.total || 0) + ' MAD</span></div>' +
    '</div>' +

    '<div class="order-detail-section">' +
      '<h4>Mettre à jour le statut</h4>' +
      '<div class="status-select-row">' +
        '<select class="status-select" id="delivery-select" onchange="updateStatus()">' +
          ['en_attente','confirmee','en_livraison','livree','annulee'].map(s =>
            '<option value="' + s + '" ' + (o.deliveryStatus === s ? 'selected' : '') + '>' + statusLabel(s) + '</option>'
          ).join('') +
        '</select>' +
        '<select class="status-select" id="payment-select" onchange="updateStatus()">' +
          '<option value="non_payee" ' + (o.paymentStatus !== 'payee' ? 'selected' : '') + '>Non payée</option>' +
          '<option value="payee"     ' + (o.paymentStatus === 'payee'  ? 'selected' : '') + '>Payée ✅</option>' +
        '</select>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">' +
      '<a href="https://wa.me/' + (o.customerPhone || '').replace(/[^0-9]/g,'') + '?text=' + encodeURIComponent('Bonjour ' + (o.customerName||'') + ', votre commande Perla Accessories est en cours de traitement. 💍') + '" target="_blank" class="btn btn-outline btn-sm">💬 WhatsApp</a>' +
      '<button class="btn btn-danger btn-sm" onclick="confirmDelete(\'' + o.id + '\')">🗑 Supprimer</button>' +
    '</div>';

  document.getElementById('order-modal').style.display = 'flex';
}

async function updateStatus() {
  if (!currentOrderId) return;
  const deliveryStatus = document.getElementById('delivery-select')?.value;
  const paymentStatus  = document.getElementById('payment-select')?.value;

  // Update in allOrders array
  const idx = allOrders.findIndex(o => o.id === currentOrderId);
  if (idx !== -1) { allOrders[idx].deliveryStatus = deliveryStatus; allOrders[idx].paymentStatus = paymentStatus; }

  // Update Firebase
  if (firebaseReady && db) {
    try {
      await db.collection('orders').doc(currentOrderId).update({ deliveryStatus, paymentStatus });
    } catch(e) { console.warn('Erreur mise à jour:', e); }
  }
  // Update local
  const local = getLocalOrders();
  const li = local.findIndex(o => o.id === currentOrderId);
  if (li !== -1) { local[li].deliveryStatus = deliveryStatus; local[li].paymentStatus = paymentStatus; localStorage.setItem(ORDERS_KEY, JSON.stringify(local)); }

  // Refresh table
  const filter = document.getElementById('status-filter')?.value || '';
  renderOrdersTable(filter ? allOrders.filter(o => o.deliveryStatus === filter) : allOrders);

  // Update badge
  const pending = allOrders.filter(o => o.deliveryStatus === 'en_attente').length;
  const badge = document.getElementById('orders-badge');
  if (badge) { badge.textContent = pending > 0 ? pending : ''; badge.style.display = pending > 0 ? '' : 'none'; }
}

async function confirmDelete(id) {
  if (!confirm('Supprimer cette commande ?')) return;

  if (firebaseReady && db) {
    try { await db.collection('orders').doc(id).delete(); } catch(e) { console.warn(e); }
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(getLocalOrders().filter(o => o.id !== id)));
  allOrders = allOrders.filter(o => o.id !== id);
  document.getElementById('order-modal').style.display = 'none';
  renderOrdersTable(allOrders);
}

function closeModal(e) {
  if (e.target.id === 'order-modal') document.getElementById('order-modal').style.display = 'none';
}

// ===== PRODUCTS =====
const DEFAULT_PRODUCTS = [
  { id:'1', name:'Collier Perle Royale',    price:320, category:'Colliers',  tags:['new','recommended'],        inStock:true,  stock:8,  image:'/assets/product-1.jpg', description:'Un collier élégant orné de perles nacrées, parfait pour toute occasion.' },
  { id:'2', name:'Bracelet Dorée',          price:185, category:'Bracelets', tags:['bestseller'],               inStock:true,  stock:12, image:'/assets/product-2.jpg', description:'Bracelet délicat en plaqué or avec des détails floraux raffinés.' },
  { id:'3', name:'Boucles Baroque',         price:250, category:'Boucles',   tags:['bestseller','recommended'], inStock:true,  stock:5,  image:'/assets/product-3.jpg', description:'Boucles d\'oreilles baroques en plaqué or rosé avec des perles de culture.' },
  { id:'4', name:'Bague Fleur de Perle',    price:210, category:'Bagues',    tags:['new','bestseller'],         inStock:true,  stock:7,  image:'/assets/product-4.jpg', description:'Bague délicate en forme de fleur ornée d\'une perle centrale.' },
  { id:'5', name:'Parure Complète Perla',   price:680, category:'Parures',   tags:['new'],                      inStock:true,  stock:3,  image:'/assets/product-1.jpg', description:'Parure complète : collier, bracelet et boucles d\'oreilles assortis.' },
  { id:'6', name:'Broche Papillon',         price:150, category:'Broches',   tags:['recommended'],              inStock:false, stock:0,  image:'/assets/product-2.jpg', description:'Broche papillon en métal doré, ornée de cristaux et de perles nacrées.' },
];

function getProducts() {
  try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : DEFAULT_PRODUCTS; }
  catch { return DEFAULT_PRODUCTS; }
}
function saveProducts(products) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

function loadProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;
  const products = getProducts();
  container.innerHTML = '<div class="products-grid">' +
    products.map(p =>
      '<div class="product-admin-card">' +
        '<div class="product-admin-img"><img src="' + p.image + '" alt="' + p.name + '" onerror="this.style.display=\'none\'"></div>' +
        '<div class="product-admin-body">' +
          '<div class="product-admin-name">' + p.name + '</div>' +
          '<div class="product-admin-price">' + p.price + ' MAD</div>' +
          '<div style="font-size:0.72rem;color:' + (p.inStock ? '#155724' : '#721c24') + ';margin-bottom:10px">' + (p.inStock ? '✅ En stock (' + p.stock + ')' : '❌ Rupture') + '</div>' +
          '<div class="product-admin-actions">' +
            '<button class="btn btn-outline btn-sm" onclick="openEditProduct(\'' + p.id + '\')">Modifier</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteProduct(\'' + p.id + '\')">Supprimer</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).join('') +
  '</div>';
}

function openAddProduct() {
  document.getElementById('product-modal-content').innerHTML = productFormHTML(null);
  document.getElementById('product-modal').style.display = 'flex';
}

function openEditProduct(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  document.getElementById('product-modal-content').innerHTML = productFormHTML(p);
  document.getElementById('product-modal').style.display = 'flex';
}

function productFormHTML(p) {
  const isEdit = !!p;
  return '<h3 style="font-family:var(--font-head);font-size:1.5rem;font-weight:400;margin-bottom:24px">' + (isEdit ? 'Modifier le produit' : 'Ajouter un produit') + '</h3>' +
    '<div class="form-group"><label>Nom *</label><input type="text" id="pf-name" value="' + (p?.name || '') + '" placeholder="Nom du bijou"></div>' +
    '<div class="form-group"><label>Prix (MAD) *</label><input type="number" id="pf-price" value="' + (p?.price || '') + '" placeholder="Prix"></div>' +
    '<div class="form-group"><label>Catégorie *</label>' +
      '<select id="pf-cat">' +
        ['Colliers','Bracelets','Boucles','Bagues','Parures','Broches'].map(c =>
          '<option value="' + c + '" ' + ((p?.category === c) ? 'selected' : '') + '>' + c + '</option>'
        ).join('') +
      '</select>' +
    '</div>' +
    '<div class="form-group"><label>Description</label><textarea id="pf-desc" placeholder="Description du produit...">' + (p?.description || '') + '</textarea></div>' +
    '<div class="form-group"><label>URL Image</label><input type="text" id="pf-image" value="' + (p?.image || '/assets/product-1.jpg') + '" placeholder="/assets/product-1.jpg"></div>' +
    '<div class="form-group"><label>Stock</label><input type="number" id="pf-stock" value="' + (p?.stock ?? 0) + '" placeholder="Quantité en stock"></div>' +
    '<div class="form-group">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none;letter-spacing:0">' +
        '<input type="checkbox" id="pf-instock" ' + (p?.inStock !== false ? 'checked' : '') + ' style="width:auto"> En stock' +
      '</label>' +
    '</div>' +
    '<div class="form-group"><label>Tags (séparés par virgule)</label><input type="text" id="pf-tags" value="' + (p?.tags || []).join(',') + '" placeholder="new, bestseller, recommended"></div>' +
    '<div style="display:flex;gap:10px;margin-top:8px">' +
      '<button class="btn btn-primary" onclick="saveProduct(\'' + (p?.id || '') + '\')">' + (isEdit ? 'Enregistrer' : 'Ajouter') + '</button>' +
      '<button class="btn btn-outline" onclick="document.getElementById(\'product-modal\').style.display=\'none\'">Annuler</button>' +
    '</div>';
}

function saveProduct(existingId) {
  const name  = document.getElementById('pf-name')?.value.trim();
  const price = parseInt(document.getElementById('pf-price')?.value) || 0;
  if (!name || !price) { alert('Nom et prix obligatoires'); return; }

  const products = getProducts();
  const tagsRaw  = document.getElementById('pf-tags')?.value || '';
  const tags     = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const product = {
    id:          existingId || Date.now().toString(),
    name,
    price,
    category:    document.getElementById('pf-cat')?.value || 'Colliers',
    description: document.getElementById('pf-desc')?.value.trim() || '',
    image:       document.getElementById('pf-image')?.value.trim() || '/assets/product-1.jpg',
    stock:       parseInt(document.getElementById('pf-stock')?.value) || 0,
    inStock:     document.getElementById('pf-instock')?.checked || false,
    tags,
  };

  if (existingId) {
    const idx = products.findIndex(p => p.id === existingId);
    if (idx !== -1) products[idx] = product; else products.unshift(product);
  } else {
    products.unshift(product);
  }
  saveProducts(products);
  document.getElementById('product-modal').style.display = 'none';
  loadProducts();
}

function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  saveProducts(getProducts().filter(p => p.id !== id));
  loadProducts();
}

function closeProductModal(e) {
  if (e.target.id === 'product-modal') document.getElementById('product-modal').style.display = 'none';
}

// ===== STATS =====
function renderStats() {
  const container = document.getElementById('stats-container');
  if (!container) return;
  const orders    = allOrders;
  const total     = orders.reduce((s, o) => s + (o.total || 0), 0);
  const livrees   = orders.filter(o => o.deliveryStatus === 'livree').length;
  const attente   = orders.filter(o => o.deliveryStatus === 'en_attente').length;
  const payees    = orders.filter(o => o.paymentStatus  === 'payee').length;
  const revenuPayé = orders.filter(o => o.paymentStatus === 'payee').reduce((s,o) => s + (o.total||0), 0);

  container.innerHTML =
    '<div class="stats-grid">' +
      statCard(orders.length, 'Total commandes') +
      statCard(total + ' MAD', 'Valeur totale') +
      statCard(attente, 'En attente') +
      statCard(livrees, 'Livrées') +
      statCard(payees, 'Payées') +
      statCard(revenuPayé + ' MAD', 'Revenu encaissé') +
    '</div>' +

    '<div style="background:white;border-radius:10px;padding:24px;box-shadow:0 2px 16px rgba(44,34,24,0.08);margin-top:8px">' +
      '<h3 style="font-family:var(--font-head);font-size:1.3rem;font-weight:400;margin-bottom:20px">Répartition par statut</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        [
          ['En attente',    orders.filter(o=>o.deliveryStatus==='en_attente').length,   '#856404','#FEF3CD'],
          ['Confirmées',    orders.filter(o=>o.deliveryStatus==='confirmee').length,    '#155724','#D4F4DD'],
          ['En livraison',  orders.filter(o=>o.deliveryStatus==='en_livraison').length, '#0C5460','#D1ECF1'],
          ['Livrées',       orders.filter(o=>o.deliveryStatus==='livree').length,       '#155724','#D4EDDA'],
          ['Annulées',      orders.filter(o=>o.deliveryStatus==='annulee').length,      '#721C24','#F8D7DA'],
        ].map(([label, count, color, bg]) => {
          const pct = orders.length ? Math.round(count / orders.length * 100) : 0;
          return '<div>' +
            '<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px">' +
              '<span style="color:var(--text-mid)">' + label + '</span>' +
              '<span style="font-weight:600">' + count + ' (' + pct + '%)</span>' +
            '</div>' +
            '<div style="height:8px;background:#F5F0EA;border-radius:4px;overflow:hidden">' +
              '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:4px;transition:width 0.6s"></div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
}

function statCard(value, label) {
  return '<div class="stat-card"><div class="stat-value">' + value + '</div><div class="stat-label">' + label + '</div></div>';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await initFirebase();
  checkAuth();

  document.getElementById('admin-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
});
