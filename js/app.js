// ============================================================
// Perla Accessories — app.js
// Cloud sync via Firebase Firestore (orders cross-device)
// ============================================================

// ===== FIREBASE CONFIG =====
// ⚠️ IMPORTANT : Remplacez ces valeurs par votre propre config Firebase
// Allez sur https://console.firebase.google.com/ → votre projet → Paramètres → Config web
const firebaseConfig = {
  apiKey: "AIzaSyDUI_nyb_UiEKg-vYmgt-NhjloprrdhmGM",
  authDomain: "perla-accessories.firebaseapp.com",
  projectId: "perla-accessories",
  storageBucket: "perla-accessories.firebasestorage.app",
  messagingSenderId: "79521737952",
  appId: "1:79521737952:web:d1f499fbf797806a03f485"
};

// ===== FIREBASE INIT (SDK compat) =====
let db = null;
let firebaseReady = false;

function initFirebase() {
  return new Promise((resolve) => {
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
      script2.onload = () => {
        try {
          if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
          db = firebase.firestore();
          firebaseReady = true;
          console.log('✅ Firebase connecté — commandes synchronisées sur tous les appareils');
        } catch(e) {
          console.warn('Firebase non configuré, mode local activé:', e.message);
          firebaseReady = false;
        }
        resolve();
      };
      script2.onerror = () => { firebaseReady = false; resolve(); };
      document.head.appendChild(script2);
    };
    script1.onerror = () => { firebaseReady = false; resolve(); };
    document.head.appendChild(script1);
  });
}

// ===== STORAGE KEYS (local fallback) =====
const CART_KEY      = 'perla_cart';
const ORDERS_KEY    = 'perla_orders';
const PRODUCTS_KEY  = 'perla_products';
const FAVORITES_KEY = 'perla_favorites';
const LANG_KEY      = 'perla_lang';

// ===== PRODUCTS =====
const DEFAULT_PRODUCTS = [
  { id:'1', name:'Collier Perle Royale',    price:320, category:'Colliers',  tags:['new','recommended'],        description:'Un collier élégant orné de perles nacrées, parfait pour toute occasion. Chaîne en plaqué or 18 carats.', image:'/assets/product-1.jpg', inStock:true,  stock:8  },
  { id:'2', name:'Bracelet Dorée',          price:185, category:'Bracelets', tags:['bestseller'],               description:'Bracelet délicat en plaqué or avec des détails floraux raffinés. Longueur ajustable.', image:'/assets/product-2.jpg', inStock:true,  stock:12 },
  { id:'3', name:'Boucles Baroque',         price:250, category:'Boucles',   tags:['bestseller','recommended'], description:'Boucles d\'oreilles baroques en plaqué or rosé avec des perles de culture. Design unique et raffiné.', image:'/assets/product-3.jpg', inStock:true,  stock:5  },
  { id:'4', name:'Bague Fleur de Perle',    price:210, category:'Bagues',    tags:['new','bestseller'],         description:'Bague délicate en forme de fleur ornée d\'une perle centrale. Plaqué or 18 carats.', image:'/assets/product-4.jpg', inStock:true,  stock:7  },
  { id:'5', name:'Parure Complète Perla',   price:680, category:'Parures',   tags:['new'],                      description:'Parure complète : collier, bracelet et boucles d\'oreilles assortis. Le cadeau parfait.', image:'/assets/product-1.jpg', inStock:true,  stock:3  },
  { id:'6', name:'Broche Papillon',         price:150, category:'Broches',   tags:['recommended'],              description:'Broche papillon en métal doré, ornée de cristaux et de perles nacrées.', image:'/assets/product-2.jpg', inStock:false, stock:0  },
];

const CATEGORIES = [
  { key:'Colliers',  icon:'📿', label:'Colliers'  },
  { key:'Bracelets', icon:'💛', label:'Bracelets' },
  { key:'Boucles',   icon:'✨', label:'Boucles'   },
  { key:'Bagues',    icon:'💍', label:'Bagues'    },
  { key:'Parures',   icon:'👑', label:'Parures'   },
  { key:'Broches',   icon:'🌸', label:'Broches'   },
];

function getProducts() {
  try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : DEFAULT_PRODUCTS; }
  catch { return DEFAULT_PRODUCTS; }
}
function saveProducts(products) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

// ===== CART (localStorage) =====
function getCart()     { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
function addToCart(product) {
  const cart = getCart();
  const ex = cart.find(i => i.id === product.id);
  if (ex) ex.quantity += 1;
  else cart.push({ id:product.id, name:product.name, price:product.price, image:product.image, quantity:1 });
  saveCart(cart);
  showToast('✨ ' + product.name + ' ajouté au panier', 'success');
}
function removeFromCart(id) { saveCart(getCart().filter(i => i.id !== id)); }
function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const cart = getCart(); const item = cart.find(i => i.id === id);
  if (item) { item.quantity = qty; saveCart(cart); }
}
function clearCart()     { saveCart([]); }
function getCartTotal()  { return getCart().reduce((s,i) => s + i.price * i.quantity, 0); }
function getCartCount()  { return getCart().reduce((s,i) => s + i.quantity, 0); }
function updateCartUI() {
  const count = getCartCount();
  const el = document.getElementById('cart-count');
  if (!el) return;
  el.textContent = count;
  el.classList.toggle('visible', count > 0);
}

// ===== FAVORITES (localStorage) =====
function getFavorites()   { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; } }
function isFavorite(id)   { return getFavorites().includes(id); }
function toggleFavorite(id, event) {
  if (event) event.stopPropagation();
  const favs = getFavorites(); const idx = favs.indexOf(id);
  if (idx === -1) { favs.push(id); showToast('❤️ Ajouté aux favoris', 'success'); }
  else            { favs.splice(idx,1); showToast('Retiré des favoris', ''); }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  updateFavIcons(id);
  updateFavBadge();
}
function updateFavIcons(id) {
  document.querySelectorAll('[data-fav-id="' + id + '"]').forEach(btn => {
    btn.classList.toggle('active', isFavorite(id));
    btn.innerHTML = heartIcon(isFavorite(id));
  });
  if (window.location.pathname === '/favoris') render('/favoris');
}
function updateFavBadge() {
  const count = getFavorites().length;
  document.querySelectorAll('#fav-count').forEach(el => {
    el.textContent = count > 0 ? count : '';
    el.classList.toggle('visible', count > 0);
  });
}
function heartIcon(filled) {
  return filled
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
}

// ===== ORDERS — FIREBASE CLOUD + LOCAL FALLBACK =====
// Toutes les commandes sont sauvegardées sur Firebase Firestore
// → visibles sur TOUS les appareils dans le panneau admin
// En cas d'erreur Firebase, fallback vers localStorage

async function saveOrderCloud(orderData) {
  const order = {
    id: 'ORD-' + Date.now(),
    createdAt: new Date().toISOString(),
    deliveryStatus: 'en_attente',
    paymentStatus:  'non_payee',
    ...orderData
  };

  if (firebaseReady && db) {
    try {
      await db.collection('orders').doc(order.id).set(order);
      console.log('✅ Commande sauvegardée dans le cloud:', order.id);
    } catch(e) {
      console.warn('Erreur Firebase, sauvegarde locale:', e);
      saveOrderLocal(order);
    }
  } else {
    saveOrderLocal(order);
  }
  return order;
}

function saveOrderLocal(order) {
  const orders = getLocalOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getLocalOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
  catch { return []; }
}

async function getOrdersForAdmin() {
  if (firebaseReady && db) {
    try {
      const snapshot = await db.collection('orders').orderBy('createdAt','desc').limit(200).get();
      return snapshot.docs.map(doc => doc.data());
    } catch(e) {
      console.warn('Erreur lecture Firebase:', e);
      return getLocalOrders();
    }
  }
  return getLocalOrders();
}

async function updateOrderCloud(id, updates) {
  if (firebaseReady && db) {
    try {
      await db.collection('orders').doc(id).update(updates);
    } catch(e) {
      console.warn('Erreur mise à jour Firebase:', e);
    }
  }
  // Also update local
  const orders = getLocalOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) { orders[idx] = {...orders[idx], ...updates}; localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
}

async function deleteOrderCloud(id) {
  if (firebaseReady && db) {
    try {
      await db.collection('orders').doc(id).delete();
    } catch(e) {
      console.warn('Erreur suppression Firebase:', e);
    }
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(getLocalOrders().filter(o => o.id !== id)));
}

// ===== NEWSLETTER =====
function subscribeNewsletter(email) {
  const emails = JSON.parse(localStorage.getItem('perla_nl') || '[]');
  if (emails.includes(email)) return 'already';
  emails.push(email);
  localStorage.setItem('perla_nl', JSON.stringify(emails));
  if (firebaseReady && db) {
    db.collection('newsletter').add({ email, createdAt: new Date().toISOString() }).catch(() => {});
  }
  return 'ok';
}
function handleNewsletterSubmit(inputId, msgId) {
  const input = document.getElementById(inputId), msgEl = document.getElementById(msgId);
  if (!input || !msgEl) return;
  const email = input.value.trim();
  if (!email) { msgEl.textContent = 'Entrez votre email'; msgEl.className = 'nl-msg error'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msgEl.textContent = 'Email invalide'; msgEl.className = 'nl-msg error'; return; }
  const res = subscribeNewsletter(email);
  if (res === 'already') { msgEl.textContent = 'Déjà inscrit(e) !'; msgEl.className = 'nl-msg info'; }
  else { msgEl.textContent = '✨ Merci pour votre inscription !'; msgEl.className = 'nl-msg success'; input.value = ''; }
}

// ===== TOAST =====
function showToast(msg, type='') {
  const c = document.getElementById('toast-container'); if (!c) return;
  const toast = document.createElement('div'); toast.className = 'toast ' + type;
  const ic = { success:'✓', error:'✕', '':'ℹ' };
  toast.innerHTML = '<span>' + (ic[type] || 'ℹ') + '</span> ' + msg;
  c.appendChild(toast);
  setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== SVG ICONS =====
const icons = {
  arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  arrowLeft:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  bag:        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
  trash:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  check:      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  phone:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  mail:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  pin:        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  pkg:        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  clock:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  shield:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  alert:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  instagram:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  facebook:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  whatsapp:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
  tiktok:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>',
  cloud:      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
  menu:       '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  xIcon:      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

// ===== SLIDER STATE =====
var sliderIntervals = {};

// ===== ROUTER =====
const routes = {
  '/':                  renderHome,
  '/boutique':          renderShop,
  '/panier':            renderCart,
  '/commander':         renderCheckout,
  '/comment-commander': renderHowToOrder,
  '/livraison':         renderDelivery,
  '/contact':           renderContact,
  '/faq':               renderFaq,
  '/favoris':           renderFavorites,
};

let currentProductId = null;

function navigate(path, data) {
  if (data) currentProductId = data;
  window.history.pushState({}, '', path);
  render(path);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateActiveNav(path);
  closeMobileMenu();
}

function render(path) {
  if (!path) path = window.location.pathname;
  Object.values(sliderIntervals).forEach(clearInterval);
  sliderIntervals = {};
  const main = document.getElementById('main-content');
  if (!main) return;
  if (path.startsWith('/produit/'))   { renderProductDetail(main, path.split('/produit/')[1]); return; }
  if (path.startsWith('/categorie/')) { renderShopFiltered(main, decodeURIComponent(path.split('/categorie/')[1])); return; }
  const renderer = routes[path] || renderNotFound;
  renderer(main);
}

function updateActiveNav(path) {
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

window.addEventListener('popstate', () => render());

// ===== PRODUCT CARD =====
function productCardHTML(p) {
  const fav = isFavorite(p.id);
  const tags = (p.tags || []).map(t => {
    if (t === 'new') return '<span class="tag-badge tag-new">Nouveau</span>';
    if (t === 'bestseller') return '<span class="tag-badge tag-bestseller">Best seller</span>';
    return '';
  }).join('');
  return '<div class="product-card" onclick="navigate(\'/produit/' + p.id + '\')" role="article" tabindex="0">' +
    '<div class="product-card-img">' +
      '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
      '<button class="fav-btn ' + (fav ? 'active' : '') + '" data-fav-id="' + p.id + '" onclick="toggleFavorite(\'' + p.id + '\',event)" aria-label="Favoris">' + heartIcon(fav) + '</button>' +
    '</div>' +
    '<div class="product-card-body">' +
      '<div class="product-card-cat">' + p.category + '</div>' +
      '<div class="product-card-name">' + p.name + '</div>' +
      '<div class="product-card-price">' + p.price + ' MAD</div>' +
      tags +
      (!p.inStock ? '<div class="out-of-stock-badge">Rupture de stock</div>' : '') +
    '</div>' +
  '</div>';
}

// ===== SLIDER =====
function sliderHTML(id, title, products) {
  if (!products.length) return '';
  const slides = products.map((p, i) => {
    return '<div class="slide ' + (i === 0 ? 'active' : '') + '">' +
      '<div class="slide-img-wrap" onclick="navigate(\'/produit/' + p.id + '\')">' +
        '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
      '</div>' +
      '<div class="slide-body">' +
        '<div class="slide-cat">' + p.category + '</div>' +
        '<div class="slide-name" onclick="navigate(\'/produit/' + p.id + '\')">' + p.name + '</div>' +
        '<div class="slide-price">' + p.price + ' MAD</div>' +
        '<button class="btn btn-primary btn-sm" onclick="navigate(\'/produit/' + p.id + '\')">Voir ' + icons.arrowRight + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
  const dots = products.map((_, i) =>
    '<button class="slider-dot ' + (i === 0 ? 'active' : '') + '" onclick="goToSlide(\'' + id + '\',' + i + ')"></button>'
  ).join('');
  return '<div class="slider-block">' +
    '<h3 class="slider-title">' + title + '</h3>' +
    '<div class="slider" id="' + id + '" data-current="0">' +
      '<div class="slider-track" id="' + id + '-track">' + slides + '</div>' +
      '<button class="slider-arrow slider-prev" onclick="prevSlide(\'' + id + '\')">&#8249;</button>' +
      '<button class="slider-arrow slider-next" onclick="nextSlide(\'' + id + '\')">&#8250;</button>' +
      '<div class="slider-dots">' + dots + '</div>' +
    '</div>' +
  '</div>';
}

function goToSlide(id, index) {
  const track = document.getElementById(id + '-track');
  const slider = document.getElementById(id);
  if (!track || !slider) return;
  track.querySelectorAll('.slide').forEach((s, i) => s.classList.toggle('active', i === index));
  slider.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === index));
  slider.dataset.current = index;
}
function nextSlide(id) {
  const track = document.getElementById(id + '-track');
  const slider = document.getElementById(id);
  if (!track) return;
  const count = track.querySelectorAll('.slide').length;
  const current = parseInt(slider.dataset.current || '0', 10);
  goToSlide(id, (current + 1) % count);
}
function prevSlide(id) {
  const track = document.getElementById(id + '-track');
  const slider = document.getElementById(id);
  if (!track) return;
  const count = track.querySelectorAll('.slide').length;
  const current = parseInt(slider.dataset.current || '0', 10);
  goToSlide(id, (current - 1 + count) % count);
}
function autoPlaySlider(id, delay = 4500) {
  if (sliderIntervals[id]) clearInterval(sliderIntervals[id]);
  sliderIntervals[id] = setInterval(() => nextSlide(id), delay);
}

// ===== CATEGORIES SECTION =====
function categoriesSectionHTML(active) {
  return '<section class="section section-bg" style="padding:48px 0">' +
    '<div class="container">' +
      '<div class="section-header"><span class="eyebrow">Collections</span><h2>Nos <em>Catégories</em></h2><div class="gold-divider"></div></div>' +
      '<div class="categories-grid">' +
        CATEGORIES.map(c =>
          '<a href="/categorie/' + encodeURIComponent(c.key) + '" class="cat-card ' + (active === c.key ? 'active' : '') + '" onclick="event.preventDefault();navigate(\'/categorie/' + encodeURIComponent(c.key) + '\')">' +
            '<div class="cat-icon"><span>' + c.icon + '</span></div>' +
            '<span class="cat-name">' + c.label + '</span>' +
          '</a>'
        ).join('') +
      '</div>' +
    '</div>' +
  '</section>';
}

// ===== HOME =====
function renderHome(main) {
  const products = getProducts();
  const inStock  = products.filter(p => p.inStock);
  const newP     = products.filter(p => (p.tags || []).includes('new'));
  const best     = products.filter(p => (p.tags || []).includes('bestseller'));
  const reco     = products.filter(p => (p.tags || []).includes('recommended'));
  const featured = inStock.slice(0, 4);

  main.innerHTML =
    // HERO
    '<section class="hero">' +
      '<img src="/assets/hero-bg.jpg" alt="Perla Accessories" class="hero-bg">' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<p class="hero-eyebrow">لمسة أناقة</p>' +
        '<h1>Perla <em>Accessories</em></h1>' +
        '<div class="hero-divider"><span class="hero-divider-line"></span><span class="hero-divider-gem">♦</span><span class="hero-divider-line"></span></div>' +
        '<p>Des bijoux d\'exception pour sublimer chaque instant.<br>Colliers, bracelets, bagues et parures dorés.</p>' +
        '<button class="btn btn-primary btn-lg" onclick="navigate(\'/boutique\')">Découvrir la collection ' + icons.arrowRight + '</button>' +
        '<div class="hero-badges"><span class="hero-badge">✨ Plaqué or 18k</span><span class="hero-badge">💎 Perles nacrées</span><span class="hero-badge">📦 Livraison Maroc</span></div>' +
      '</div>' +
    '</section>' +

    // TRUST BAR
    '<div class="trust-bar">' +
      '<div class="container trust-bar-inner">' +
        '<div class="trust-item"><span class="trust-icon">💎</span><div class="trust-text"><strong>Qualité Premium</strong><span>Plaqué or 18 carats</span></div></div>' +
        '<div class="trust-item"><span class="trust-icon">📦</span><div class="trust-text"><strong>Livraison Maroc</strong><span>3 à 5 jours ouvrables</span></div></div>' +
        '<div class="trust-item"><span class="trust-icon">💰</span><div class="trust-text"><strong>Paiement livraison</strong><span>Espèces ou carte</span></div></div>' +
        '<div class="trust-item"><span class="trust-icon">✨</span><div class="trust-text"><strong>100% Authentique</strong><span>Certifié Perla</span></div></div>' +
      '</div>' +
    '</div>' +

    // SLIDERS
    '<section class="section"><div class="container">' +
      '<div class="section-header"><span class="eyebrow">Sélections</span><h2>Nos <em>Coups de Cœur</em></h2><div class="gold-divider"></div></div>' +
      '<div class="sliders-wrapper">' +
        sliderHTML('slider-new',  '✨ Nouveautés',   newP.length ? newP : inStock.slice(0,3)) +
        sliderHTML('slider-best', '🏆 Best Sellers', best.length ? best : inStock.slice(1,4)) +
        sliderHTML('slider-reco', '💛 Recommandés',  reco.length ? reco : inStock.slice(0,3)) +
      '</div>' +
    '</div></section>' +

    // CATEGORIES
    categoriesSectionHTML() +

    // FEATURED PRODUCTS
    '<section class="section"><div class="container">' +
      '<div class="section-header"><span class="eyebrow">Nos Bijoux</span><h2>La <em>Collection</em></h2><div class="gold-divider"></div></div>' +
      '<div class="products-grid">' + featured.map(productCardHTML).join('') + '</div>' +
      '<div class="text-center" style="margin-top:44px"><button class="btn btn-outline btn-lg" onclick="navigate(\'/boutique\')">Voir toute la collection ' + icons.arrowRight + '</button></div>' +
    '</div></section>' +

    // HOW TO ORDER
    '<section class="section section-rose"><div class="container">' +
      '<div class="section-header"><span class="eyebrow">Simple & rapide</span><h2>Comment <em>Commander</em></h2><div class="gold-divider"></div></div>' +
      '<div class="steps-grid">' +
        '<div class="step-item"><div class="step-num">1</div><h3>Choisissez</h3><p>Parcourez notre collection et sélectionnez vos bijoux préférés.</p></div>' +
        '<div class="step-item"><div class="step-num">2</div><h3>Commandez</h3><p>Remplissez le formulaire avec vos coordonnées de livraison.</p></div>' +
        '<div class="step-item"><div class="step-num">3</div><h3>Recevez</h3><p>Livraison à domicile dans tout le Maroc. Payez à la réception.</p></div>' +
      '</div>' +
    '</div></section>' +

    // NEWSLETTER
    '<div class="newsletter-section"><div class="container">' +
      '<div class="newsletter-inner">' +
        '<div class="newsletter-text"><h3>Restez informée 💌</h3><p>Recevez nos nouvelles collections et offres exclusives</p></div>' +
        '<div class="newsletter-form"><div class="nl-input-group"><input type="email" id="nl-email" placeholder="Votre email..."><button class="btn btn-primary" onclick="handleNewsletterSubmit(\'nl-email\',\'nl-msg\')">S\'inscrire</button></div><p id="nl-msg" class="nl-msg"></p></div>' +
      '</div>' +
    '</div></div>';

  setTimeout(() => {
    autoPlaySlider('slider-new',  4500);
    autoPlaySlider('slider-best', 5000);
    autoPlaySlider('slider-reco', 5500);
  }, 100);
}

// ===== SHOP =====
function renderShop(main) {
  main.innerHTML =
    '<div class="container">' +
      '<div class="page-header"><h1>Notre <em style="font-style:italic;color:var(--gold-dark)">Boutique</em></h1><p>Tous nos bijoux et accessoires</p></div>' +
      categoriesSectionHTML() +
      '<div class="products-grid" style="margin-top:40px">' + getProducts().map(productCardHTML).join('') + '</div>' +
      '<div style="height:60px"></div>' +
    '</div>';
}

function renderShopFiltered(main, category) {
  const products = getProducts().filter(p => p.category === category);
  const catInfo  = CATEGORIES.find(c => c.key === category);
  main.innerHTML =
    '<div class="container">' +
      '<div class="page-header">' +
        '<div style="font-size:3rem;margin-bottom:8px">' + (catInfo ? catInfo.icon : '💍') + '</div>' +
        '<h1>' + category + '</h1>' +
        '<p>' + products.length + ' article' + (products.length !== 1 ? 's' : '') + '</p>' +
      '</div>' +
      categoriesSectionHTML(category) +
      '<div class="products-grid" style="margin-top:40px">' +
        (products.length ? products.map(productCardHTML).join('') : '<p style="color:var(--muted);text-align:center;grid-column:1/-1">Aucun produit dans cette catégorie.</p>') +
      '</div>' +
      '<div style="height:60px"></div>' +
    '</div>';
}

// ===== FAVORITES =====
function renderFavorites(main) {
  const favIds   = getFavorites();
  const products = getProducts().filter(p => favIds.includes(p.id));
  if (!products.length) {
    main.innerHTML = '<div class="empty-state"><div style="font-size:4rem">🤍</div><h2>Aucun favori</h2><p>Ajoutez des bijoux à vos favoris en cliquant sur le cœur ❤️</p><button class="btn btn-primary" onclick="navigate(\'/boutique\')">Découvrir la boutique</button></div>';
    return;
  }
  main.innerHTML = '<div class="container"><div class="page-header"><h1>Mes <em style="font-style:italic;color:var(--gold-dark)">Favoris</em></h1><p>' + products.length + ' bijou' + (products.length > 1 ? 'x' : '') + ' sauvegardé' + (products.length > 1 ? 's' : '') + '</p></div><div class="products-grid">' + products.map(productCardHTML).join('') + '</div><div style="height:60px"></div></div>';
}

// ===== PRODUCT DETAIL =====
function renderProductDetail(main, id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) { renderNotFound(main); return; }
  const fav = isFavorite(p.id);
  main.innerHTML =
    '<div class="container" style="padding-top:32px;padding-bottom:60px">' +
      '<a href="#" class="back-link" onclick="event.preventDefault();navigate(\'/boutique\')">' + icons.arrowLeft + ' Retour à la boutique</a>' +
      '<div class="product-detail-grid">' +
        '<div class="product-detail-img"><img src="' + p.image + '" alt="' + p.name + '"></div>' +
        '<div class="product-detail-info">' +
          '<p class="product-cat">' + p.category + '</p>' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">' +
            '<h1 class="product-title">' + p.name + '</h1>' +
            '<button class="fav-btn-lg ' + (fav ? 'active' : '') + '" data-fav-id="' + p.id + '" onclick="toggleFavorite(\'' + p.id + '\',event)">' + heartIcon(fav) + '</button>' +
          '</div>' +
          '<div class="product-price">' + p.price + ' MAD</div>' +
          '<p class="product-desc">' + p.description + '</p>' +
          '<div style="display:flex;flex-direction:column;gap:12px">' +
            '<button class="btn btn-primary btn-lg" onclick="addToCart(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')" ' + (!p.inStock ? 'disabled' : '') + '>' + icons.bag + ' ' + (p.inStock ? 'Ajouter au panier' : 'Rupture de stock') + '</button>' +
            '<p style="font-size:0.78rem;color:var(--muted);text-align:center">💰 Paiement à la livraison — Espèces ou carte</p>' +
          '</div>' +
          '<div class="product-info-box">' +
            '<div>💎 Matière : Plaqué or 18 carats</div>' +
            '<div>✨ Perles nacrées authentiques</div>' +
            '<div>📦 Emballage cadeau inclus</div>' +
            '<div>🚚 Livraison dans tout le Maroc</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ===== CART =====
function renderCart(main) {
  const cart = getCart();
  if (!cart.length) {
    main.innerHTML = '<div class="empty-state"><div style="font-size:4rem">🛍️</div><h2>Votre panier est vide</h2><p>Découvrez nos bijoux et accessoires</p><button class="btn btn-primary" onclick="navigate(\'/boutique\')">Voir la boutique</button></div>';
    return;
  }
  main.innerHTML =
    '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:820px">' +
      '<h1 style="font-family:var(--font-head);font-size:2.2rem;font-weight:400;margin-bottom:28px">Mon Panier</h1>' +
      '<div id="cart-items"></div>' +
      '<div class="cart-summary">' +
        '<div class="cart-total"><span class="cart-total-label">Total</span><span class="cart-total-amount" id="cart-total">' + getCartTotal() + ' MAD</span></div>' +
        '<button class="btn btn-primary btn-lg" style="width:100%" onclick="navigate(\'/commander\')">Passer la commande ' + icons.arrowRight + '</button>' +
        '<p style="font-size:0.78rem;color:var(--muted);text-align:center;margin-top:10px">💰 Paiement à la livraison — Espèces ou carte</p>' +
      '</div>' +
    '</div>';
  renderCartItems();
}
function renderCartItems() {
  const container = document.getElementById('cart-items'); if (!container) return;
  container.innerHTML = getCart().map(item =>
    '<div class="cart-item">' +
      '<div class="cart-item-img"><img src="' + item.image + '" alt="' + item.name + '"></div>' +
      '<div class="cart-item-info"><div class="cart-item-name">' + item.name + '</div><div class="cart-item-price">' + item.price + ' MAD</div></div>' +
      '<div class="qty-control">' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',' + (item.quantity - 1) + ')">−</button>' +
        '<span class="qty-val">' + item.quantity + '</span>' +
        '<button class="qty-btn" onclick="changeQty(\'' + item.id + '\',' + (item.quantity + 1) + ')">+</button>' +
      '</div>' +
      '<button class="remove-btn" onclick="removeItem(\'' + item.id + '\')">' + icons.trash + '</button>' +
    '</div>'
  ).join('');
  const tel = document.getElementById('cart-total'); if (tel) tel.textContent = getCartTotal() + ' MAD';
}
function changeQty(id, qty) { updateQty(id, qty); renderCartItems(); if (!getCart().length) renderCart(document.getElementById('main-content')); }
function removeItem(id)     { removeFromCart(id); renderCartItems(); if (!getCart().length) renderCart(document.getElementById('main-content')); }

// ===== CHECKOUT =====
function renderCheckout(main) {
  if (!getCart().length) {
    main.innerHTML = '<div class="empty-state"><h2>Panier vide</h2><button class="btn btn-primary" onclick="navigate(\'/boutique\')">Voir la boutique</button></div>';
    return;
  }
  const cart = getCart();
  main.innerHTML =
    '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:960px">' +
      '<h1 style="font-family:var(--font-head);font-size:2.2rem;font-weight:400;margin-bottom:36px">Passer la commande</h1>' +
      (firebaseReady ? '<div class="sync-badge">' + icons.cloud + ' Commande synchronisée sur tous vos appareils</div><br>' : '') +
      '<div class="checkout-grid">' +
        '<div>' +
          '<div class="form-group"><label>Nom complet *</label><input type="text" id="co-name" placeholder="Votre nom complet"></div>' +
          '<div class="form-group"><label>Téléphone *</label><input type="tel" id="co-phone" placeholder="06 XX XX XX XX"></div>' +
          '<div class="form-group"><label>Adresse complète *</label><textarea id="co-address" placeholder="Rue, quartier, immeuble..."></textarea></div>' +
          '<div class="form-group"><label>Ville *</label><input type="text" id="co-city" placeholder="Votre ville"></div>' +
          '<div class="form-group"><label>Notes (optionnel)</label><textarea id="co-notes" placeholder="Instructions spéciales..."></textarea></div>' +
          '<div class="payment-box"><strong>💰 Paiement à la livraison</strong><span style="font-size:0.85rem;color:var(--text-mid)">Vous payez à la réception de votre commande. Espèces ou carte bancaire acceptées.</span></div>' +
          '<button class="btn btn-primary btn-lg" style="width:100%" onclick="submitOrder()" id="order-btn">Confirmer la commande ' + icons.arrowRight + '</button>' +
        '</div>' +
        '<div><div class="order-summary-box"><h3>Résumé</h3>' +
          cart.map(item => '<div class="summary-item"><span>' + item.name + ' × ' + item.quantity + '</span><span>' + (item.price * item.quantity) + ' MAD</span></div>').join('') +
          '<div class="summary-total"><span>Total</span><span>' + getCartTotal() + ' MAD</span></div></div></div>' +
      '</div>' +
    '</div>';
}

async function submitOrder() {
  const name    = document.getElementById('co-name')?.value.trim();
  const phone   = document.getElementById('co-phone')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  const city    = document.getElementById('co-city')?.value.trim();
  const notes   = document.getElementById('co-notes')?.value.trim();

  if (!name || !phone || !address || !city) {
    showToast('Veuillez remplir tous les champs obligatoires', 'error');
    return;
  }

  const btn = document.getElementById('order-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours...'; }

  await saveOrderCloud({
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    customerCity: city,
    notes: notes,
    items: getCart(),
    total: getCartTotal()
  });

  clearCart();

  document.getElementById('main-content').innerHTML =
    '<div class="success-page">' +
      '<div class="success-icon">' + icons.check + '</div>' +
      '<h1 style="font-family:var(--font-head);font-size:2.5rem;font-weight:300;margin-bottom:14px">Commande confirmée ! ✨</h1>' +
      '<p style="color:var(--muted);margin-bottom:8px">Merci pour votre commande. Nous vous contacterons très prochainement.</p>' +
      '<p style="font-size:0.875rem;color:var(--muted);margin-bottom:36px">💰 Paiement à la livraison — Espèces ou carte</p>' +
      '<button class="btn btn-primary btn-lg" onclick="navigate(\'/\')">Retour à l\'accueil</button>' +
    '</div>';
}

// ===== HOW TO ORDER =====
function renderHowToOrder(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px">' +
    '<div class="page-header"><h1>Comment commander</h1><p>Simple, rapide et sécurisé</p></div>' +
    '<div class="steps-v">' +
    [
      ['1','Parcourez la boutique','Explorez notre collection de bijoux et trouvez vos coups de cœur.'],
      ['2','Ajoutez au panier','Cliquez sur le produit puis sur « Ajouter au panier ».'],
      ['3','Remplissez le formulaire','Indiquez votre nom, téléphone et adresse de livraison.'],
      ['4','Confirmez la commande','Nous vous contacterons par téléphone pour confirmer.'],
      ['5','Payez à la livraison','Payez en espèces ou par carte à la réception de votre colis.'],
    ].map(s => '<div class="step-v"><div class="step-v-num">' + s[0] + '</div><div><h3>' + s[1] + '</h3><p>' + s[2] + '</p></div></div>').join('') +
    '</div></div>';
}

// ===== DELIVERY =====
function renderDelivery(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px">' +
    '<div class="page-header"><h1>Livraison</h1><p>Livraison dans tout le Maroc</p></div>' +
    '<div>' +
    [
      [icons.pkg,    'Emballage soigné',        'Chaque bijou est emballé dans un coffret cadeau élégant avec protection maximale.'],
      [icons.clock,  'Délais de livraison',     'Livraison sous 3 à 5 jours ouvrables partout au Maroc.'],
      [icons.shield, 'Paiement à la livraison', 'Payez uniquement à la réception. Espèces et carte bancaire acceptées.'],
      [icons.alert,  'Politique de retour',     'Retours acceptés dans les 48h si le produit est défectueux ou endommagé.'],
    ].map(c => '<div class="info-card"><div class="info-card-icon">' + c[0] + '</div><div><h3>' + c[1] + '</h3><p>' + c[2] + '</p></div></div>').join('') +
    '</div></div>';
}

// ===== CONTACT =====
function renderContact(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:860px">' +
    '<div class="page-header"><h1>Contact</h1><p>Nous sommes là pour vous</p></div>' +
    '<div class="contact-grid">' +
      '<div><p style="color:var(--muted);margin-bottom:28px;font-size:0.95rem;line-height:1.75">Une question sur nos bijoux ou votre commande ? Contactez-nous, nous répondrons rapidement.</p>' +
      [
        [icons.phone, 'Téléphone',     '+212 6XX XX XX XX'],
        [icons.mail,  'Email',         'contact@perlaaccessories.ma'],
        [icons.pin,   'Localisation',  'Meknes, Maroc'],
      ].map(i => '<div class="contact-info-item"><div class="contact-icon">' + i[0] + '</div><div><div class="contact-info-label">' + i[1] + '</div><div class="contact-info-val">' + i[2] + '</div></div></div>').join('') +
      '</div>' +
      '<div>' +
        '<div class="form-group"><label>Nom</label><input type="text" id="ct-name" placeholder="Votre nom"></div>' +
        '<div class="form-group"><label>Email</label><input type="email" id="ct-email" placeholder="votre@email.com"></div>' +
        '<div class="form-group"><label>Message</label><textarea id="ct-msg" rows="5" placeholder="Votre message..."></textarea></div>' +
        '<button class="btn btn-primary" style="width:100%" onclick="sendContact()">Envoyer ' + icons.arrowRight + '</button>' +
      '</div>' +
    '</div></div>';
}
function sendContact() {
  const name  = document.getElementById('ct-name')?.value.trim();
  const email = document.getElementById('ct-email')?.value.trim();
  const msg   = document.getElementById('ct-msg')?.value.trim();
  if (!name || !email || !msg) { showToast('Veuillez remplir tous les champs', 'error'); return; }
  showToast('✅ Message envoyé ! Merci, nous vous répondrons rapidement.', 'success');
  document.getElementById('ct-name').value  = '';
  document.getElementById('ct-email').value = '';
  document.getElementById('ct-msg').value   = '';
}

// ===== FAQ =====
function renderFaq(main) {
  const faqs = [
    ['Vos bijoux sont-ils en vrai or ?',             'Nos bijoux sont en plaqué or 18 carats de haute qualité, offrant l\'éclat de l\'or à un prix accessible.'],
    ['Comment entretenir mes bijoux ?',              'Évitez le contact avec l\'eau, les parfums et la sueur. Rangez-les dans leur écrin. Nettoyez avec un chiffon doux.'],
    ['Comment puis-je payer ?',                      'Paiement à la livraison uniquement — espèces ou carte bancaire.'],
    ['Quels sont les délais de livraison ?',         '3 à 5 jours ouvrables dans tout le Maroc.'],
    ['Puis-je retourner un produit ?',               'Oui, dans les 48h si le produit est défectueux ou endommagé à la réception.'],
    ['Livrez-vous dans tout le Maroc ?',             'Oui, nous livrons dans toutes les villes et régions du Maroc.'],
    ['Les bijoux conviennent-ils aux allergiques ?', 'Nos bijoux sont hypoallergéniques. Consultez-nous si vous avez des sensibilités particulières.'],
  ];
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px"><div class="page-header"><h1>Questions Fréquentes</h1><p>Tout ce que vous devez savoir sur Perla Accessories</p></div><div class="faq-list">' +
    faqs.map((f, i) =>
      '<div class="faq-item"><button class="faq-question" onclick="toggleFaq(' + i + ')" aria-expanded="false" aria-controls="faq-' + i + '">' + f[0] + '<span class="faq-arrow">▼</span></button><div class="faq-answer" id="faq-' + i + '">' + f[1] + '</div></div>'
    ).join('') +
  '</div></div>';
}
function toggleFaq(i) {
  const answer   = document.getElementById('faq-' + i);
  const question = answer?.previousElementSibling;
  const isOpen   = answer?.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question').forEach(q => { q.classList.remove('open'); q.setAttribute('aria-expanded','false'); });
  if (!isOpen) { answer?.classList.add('open'); question?.classList.add('open'); question?.setAttribute('aria-expanded','true'); }
}

// ===== 404 =====
function renderNotFound(main) {
  main.innerHTML = '<div class="empty-state"><h1 style="font-size:5rem;font-family:var(--font-head);color:var(--muted)">404</h1><h2>Page introuvable</h2><p>La page que vous cherchez n\'existe pas.</p><button class="btn btn-primary" onclick="navigate(\'/\')">Retour à l\'accueil</button></div>';
}

// ===== FOOTER =====
function renderFooter() {
  const footer = document.getElementById('main-footer');
  if (!footer) return;
  footer.innerHTML =
    '<div class="newsletter-section"><div class="container"><div class="newsletter-inner">' +
      '<div class="newsletter-text"><h3>Newsletter 💌</h3><p>Recevez nos nouveautés et offres exclusives</p></div>' +
      '<div class="newsletter-form"><div class="nl-input-group"><input type="email" id="nl-footer" placeholder="Votre email..."><button class="btn btn-primary" onclick="handleNewsletterSubmit(\'nl-footer\',\'nl-footer-msg\')">S\'inscrire</button></div><p id="nl-footer-msg" class="nl-msg"></p></div>' +
    '</div></div></div>' +
    '<div class="footer-main"><div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' +
        '<h3>Perla Accessories</h3>' +
        '<p class="arabic-sub">لمسة أناقة</p>' +
        '<p>Des bijoux d\'exception pour sublimer votre élégance. Plaqué or 18k, perles nacrées et cristaux.</p>' +
        '<div class="footer-social">' +
          '<a href="https://instagram.com" target="_blank" class="social-icon" aria-label="Instagram">' + icons.instagram + '</a>' +
          '<a href="https://facebook.com"  target="_blank" class="social-icon" aria-label="Facebook">'  + icons.facebook  + '</a>' +
          '<a href="https://tiktok.com"    target="_blank" class="social-icon" aria-label="TikTok">'    + icons.tiktok    + '</a>' +
          '<a href="https://wa.me/212600000000" target="_blank" class="social-icon" aria-label="WhatsApp">' + icons.whatsapp + '</a>' +
        '</div>' +
      '</div>' +
      '<div class="footer-col">' +
        '<h4>Navigation</h4>' +
        '<a href="/boutique"          onclick="event.preventDefault();navigate(\'/boutique\')">Boutique</a>' +
        '<a href="/comment-commander" onclick="event.preventDefault();navigate(\'/comment-commander\')">Comment commander</a>' +
        '<a href="/livraison"         onclick="event.preventDefault();navigate(\'/livraison\')">Livraison</a>' +
        '<a href="/faq"               onclick="event.preventDefault();navigate(\'/faq\')">FAQ</a>' +
        '<a href="/contact"           onclick="event.preventDefault();navigate(\'/contact\')">Contact</a>' +
      '</div>' +
      '<div class="footer-col">' +
        '<h4>Contact</h4>' +
        '<div class="footer-contact-item">' + icons.pin   + '<span>Meknes, Maroc</span></div>' +
        '<div class="footer-contact-item">' + icons.phone + '<a href="tel:+212600000000" style="color:inherit">+212 6XX XX XX XX</a></div>' +
        '<div class="footer-contact-item">' + icons.mail  + '<a href="mailto:contact@perlaaccessories.ma" style="color:inherit">contact@perlaaccessories.ma</a></div>' +
        '<div class="footer-payment-badge">💰 Paiement à la livraison<br><small>Espèces ou carte bancaire</small></div>' +
      '</div>' +
    '</div>' +
    '<div class="footer-bottom">© ' + new Date().getFullYear() + ' Perla Accessories — لمسة أناقة. Tous droits réservés.</div>' +
    '</div></div>';
}

// ===== MOBILE MENU =====
var mobileOpen = false;
function toggleMobileMenu() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobile-menu').classList.toggle('open', mobileOpen);
  const hb = document.getElementById('hamburger-btn');
  if (hb) { hb.innerHTML = mobileOpen ? icons.xIcon : icons.menu; hb.setAttribute('aria-expanded', mobileOpen); }
}
function closeMobileMenu() {
  mobileOpen = false;
  const mm = document.getElementById('mobile-menu'); if (mm) mm.classList.remove('open');
  const hb = document.getElementById('hamburger-btn'); if (hb) { hb.innerHTML = icons.menu; hb.setAttribute('aria-expanded','false'); }
}

// ===== NAVBAR SCROLL =====
function handleNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Init Firebase (async, non-bloquant)
  await initFirebase();

  updateCartUI();
  updateFavBadge();
  render(window.location.pathname);
  updateActiveNav(window.location.pathname);
  renderFooter();

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) { e.preventDefault(); navigate(href); }
  });
});
