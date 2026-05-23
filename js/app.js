// ============================================================
// app.js — Afrae Décor  (version enrichie)
// Fonctionnalités : Slider, Favoris, Catégories, Newsletter,
//                  Langue, Footer enrichi
// ============================================================

// ===== STORAGE KEYS =====
const STORAGE_KEY      = 'afrae_cart';
const ORDERS_KEY       = 'afrae_orders';
const PRODUCTS_KEY     = 'afrae_products';
const FAVORITES_KEY    = 'afrae_favorites';
const NEWSLETTER_KEY   = 'afrae_newsletter';
const LANG_KEY         = 'afrae_lang';

// ===== I18N =====
let currentLang = localStorage.getItem(LANG_KEY) || 'fr';

function t(key) {
  const tr = TRANSLATIONS[currentLang] || TRANSLATIONS['fr'];
  return tr[key] || TRANSLATIONS['fr'][key] || key;
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
  render(window.location.pathname);
  renderNavbarTexts();
  renderFooter();
  closeLangMenu();
}

// ===== DEFAULT PRODUCTS =====
const DEFAULT_PRODUCTS = [
  { id:'1', name:'Vase Arabesque',     price:280, category:'Vases',      tags:['new','recommended'],         description:"Un vase artisanal sculpté à la main en gypse pur, orné de motifs arabesques traditionnels.", image:'/assets/product-1.jpg', inStock:true,  stock:5 },
  { id:'2', name:'Bougeoir Floral',    price:195, category:'Bougeoirs',  tags:['bestseller'],                description:"Bougeoir en gypse aux formes florales délicates. Idéal pour créer une atmosphère chaleureuse.", image:'/assets/product-2.jpg', inStock:true,  stock:8 },
  { id:'3', name:'Miroir Baroque',     price:450, category:'Miroirs',    tags:['bestseller','recommended'],  description:"Cadre de miroir baroque sculpté en gypse blanc. Un chef-d'œuvre artisanal. Dimensions : 60x80 cm.", image:'/assets/product-3.jpg', inStock:true,  stock:3 },
  { id:'4', name:'Plateau Géométrique',price:320, category:'Plateaux',   tags:['new','bestseller'],          description:"Plateau décoratif en gypse aux motifs géométriques inspirés de la tradition marocaine.", image:'/assets/product-4.jpg', inStock:true,  stock:6 },
  { id:'5', name:'Sculpture Murale',   price:580, category:'Sculptures', tags:['new'],                       description:"Sculpture murale en relief, travail artisanal minutieux. Pièce unique faite à la main.", image:'/assets/product-1.jpg', inStock:true,  stock:2 },
  { id:'6', name:'Coupe Décorative',   price:240, category:'Coupes',     tags:['recommended'],               description:"Coupe décorative en gypse blanc, aux lignes épurées et élégantes.", image:'/assets/product-2.jpg', inStock:false, stock:0 },
];

// ===== CATEGORIES =====
const CATEGORIES = [
  { key:'Vases',      icon:'🏺', color:'#d4a88a' },
  { key:'Bougeoirs',  icon:'🕯️', color:'#b8987a' },
  { key:'Miroirs',    icon:'🪞', color:'#c4a88c' },
  { key:'Plateaux',   icon:'🫙', color:'#b87c5a' },
  { key:'Sculptures', icon:'🗿', color:'#9a6445' },
  { key:'Coupes',     icon:'🍶', color:'#d4b89a' },
];

// ===== PRODUCTS =====
function getProducts() {
  try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : DEFAULT_PRODUCTS; }
  catch { return DEFAULT_PRODUCTS; }
}
function saveProducts(products) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

// ===== CART =====
function getCart() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function saveCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); updateCartUI(); }
function addToCart(product) {
  const cart = getCart();
  const ex = cart.find(i => i.id === product.id);
  if (ex) ex.quantity += 1;
  else cart.push({ id:product.id, name:product.name, price:product.price, image:product.image, quantity:1 });
  saveCart(cart);
  showToast(product.name + ' ajouté au panier', 'success');
}
function removeFromCart(id) { saveCart(getCart().filter(i => i.id !== id)); }
function updateQty(id, qty) {
  if (qty <= 0) return removeFromCart(id);
  const cart = getCart(); const item = cart.find(i => i.id === id);
  if (item) { item.quantity = qty; saveCart(cart); }
}
function clearCart() { saveCart([]); }
function getCartTotal() { return getCart().reduce((s,i) => s + i.price * i.quantity, 0); }
function getCartCount() { return getCart().reduce((s,i) => s + i.quantity, 0); }
function updateCartUI() {
  const count = getCartCount(); const el = document.getElementById('cart-count');
  if (!el) return; el.textContent = count; el.classList.toggle('visible', count > 0);
}

// ===== FAVORITES =====
function getFavorites() { try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; } }
function isFavorite(id) { return getFavorites().includes(id); }
function toggleFavorite(id, event) {
  if (event) event.stopPropagation();
  const favs = getFavorites(); const idx = favs.indexOf(id);
  if (idx === -1) { favs.push(id); showToast('Ajouté aux favoris ❤️','success'); }
  else            { favs.splice(idx,1); showToast('Retiré des favoris',''); }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  updateFavIcons(id); updateFavBadge();
}
function updateFavIcons(id) {
  document.querySelectorAll('.fav-btn[data-id="'+id+'"], .fav-btn-lg[data-id="'+id+'"]').forEach(btn => {
    const filled = isFavorite(id);
    btn.classList.toggle('active', filled);
    btn.setAttribute('aria-label', filled ? t('fav_remove') : t('fav_add'));
    btn.innerHTML = heartIcon(filled);
  });
  if (window.location.pathname === '/favoris') render('/favoris');
}
function updateFavBadge() {
  const count = getFavorites().length;
  document.querySelectorAll('.fav-nav-count').forEach(el => {
    el.textContent = count > 0 ? count : '';
    el.classList.toggle('visible', count > 0);
  });
}
function heartIcon(filled) {
  return filled
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>';
}

// ===== NEWSLETTER =====
function getNewsletterEmails() { try { return JSON.parse(localStorage.getItem(NEWSLETTER_KEY)||'[]'); } catch { return []; } }
function subscribeNewsletter(email) {
  const emails = getNewsletterEmails();
  if (emails.includes(email)) return 'already';
  emails.push(email); localStorage.setItem(NEWSLETTER_KEY, JSON.stringify(emails)); return 'ok';
}
function handleNewsletterSubmit(inputId, msgId) {
  const input = document.getElementById(inputId); const msgEl = document.getElementById(msgId);
  if (!input || !msgEl) return;
  const email = input.value.trim();
  if (!email)                                         { msgEl.textContent = t('newsletter_error_empty');   msgEl.className='nl-msg error'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))     { msgEl.textContent = t('newsletter_error_invalid'); msgEl.className='nl-msg error'; return; }
  const res = subscribeNewsletter(email);
  if (res === 'already') { msgEl.textContent = t('newsletter_already');  msgEl.className='nl-msg info'; }
  else                   { msgEl.textContent = t('newsletter_success');   msgEl.className='nl-msg success'; input.value=''; }
}

// ===== ORDERS =====
function getOrders() { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)||'[]'); } catch { return []; } }
function saveOrder(data) {
  const orders = getOrders();
  const order  = { id:'ORD-'+Date.now(), createdAt:new Date().toISOString(), deliveryStatus:'en_attente', paymentStatus:'non_payee', ...data };
  orders.unshift(order); localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); return order;
}
function updateOrder(id, updates) {
  const orders = getOrders(); const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) { orders[idx] = {...orders[idx],...updates}; localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
}
function deleteOrder(id) { localStorage.setItem(ORDERS_KEY, JSON.stringify(getOrders().filter(o => o.id !== id))); }

// ===== TOAST =====
function showToast(msg, type) {
  if (type === undefined) type = '';
  const c = document.getElementById('toast-container'); if (!c) return;
  const toast = document.createElement('div'); toast.className = 'toast ' + type;
  const ic = { success:'✓', error:'✕', '':'ℹ' };
  toast.innerHTML = '<span>' + (ic[type] || 'ℹ') + '</span> ' + msg;
  c.appendChild(toast);
  setTimeout(function(){ toast.classList.add('fade-out'); setTimeout(function(){ toast.remove(); },300); }, 3000);
}

// ===== ICONS =====
const icons = {
  shoppingBag:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
  arrowRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
  arrowLeft:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  trash:      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  check:      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  phone:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',
  mail:       '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  mapPin:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  globe:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  heart:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  pkg:        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  clock:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  shield:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  alert:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  menu:       '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  x:          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  instagram:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  facebook:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>',
  tiktok:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/></svg>',
  whatsapp:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
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
  window.scrollTo(0,0);
  updateActiveNav(path);
  closeMobileMenu();
}

function render(path) {
  if (!path) path = window.location.pathname;
  Object.values(sliderIntervals).forEach(clearInterval);
  sliderIntervals = {};
  const main = document.getElementById('main-content');
  if (!main) return;
  if (path.startsWith('/produit/')) { renderProductDetail(main, path.split('/produit/')[1]); return; }
  if (path.startsWith('/categorie/')) { renderShopFiltered(main, decodeURIComponent(path.split('/categorie/')[1])); return; }
  const renderer = routes[path] || renderNotFound;
  renderer(main);
}

function updateActiveNav(path) {
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function(a) {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

window.addEventListener('popstate', function() { render(); });

// ===== LANG SWITCHER =====
const LANG_OPTIONS = [
  { code:'fr', label:'Français', flag:'🇫🇷' },
  { code:'en', label:'English',  flag:'🇬🇧' },
  { code:'ar', label:'العربية',  flag:'🇲🇦' },
];

function renderLangBtn() {
  const current = LANG_OPTIONS.find(function(l){ return l.code === currentLang; }) || LANG_OPTIONS[0];
  return '<div class="lang-switcher" id="lang-switcher">' +
    '<button class="lang-btn" onclick="toggleLangMenu()" aria-label="Changer la langue" aria-haspopup="true" aria-expanded="false">' +
      icons.globe +
      '<span class="lang-label">' + current.flag + ' ' + current.code.toUpperCase() + '</span>' +
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
    '</button>' +
    '<div class="lang-dropdown" id="lang-dropdown" role="menu">' +
      LANG_OPTIONS.map(function(l){
        return '<button class="lang-option ' + (l.code===currentLang?'active':'') + '" onclick="setLang(\'' + l.code + '\')" role="menuitem"><span>' + l.flag + '</span> ' + l.label + '</button>';
      }).join('') +
    '</div></div>';
}

function toggleLangMenu() {
  const dd = document.getElementById('lang-dropdown');
  const btn = document.querySelector('.lang-btn');
  if (!dd) return;
  var isOpen = dd.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', isOpen);
}
function closeLangMenu() {
  var dd = document.getElementById('lang-dropdown');
  var btn = document.querySelector('.lang-btn');
  if (dd) dd.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded','false');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('#lang-switcher')) closeLangMenu();
});

// ===== NAVBAR TEXTS UPDATE =====
function renderNavbarTexts() {
  var navMap = {'/':'nav_home','/boutique':'nav_shop','/comment-commander':'nav_how','/livraison':'nav_delivery','/contact':'nav_contact','/faq':'nav_faq','/favoris':'nav_favorites'};
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    var key = navMap[a.getAttribute('href')];
    if (key && a.querySelector('svg') === null) a.textContent = t(key);
  });
  updateFavBadge();
  // Refresh lang btn
  var lw = document.getElementById('lang-wrapper');
  if (lw) lw.innerHTML = renderLangBtn();
}

// ===== FOOTER =====
function renderFooter() {
  var footer = document.querySelector('footer');
  if (!footer) return;
  footer.innerHTML =
    '<div class="newsletter-section">' +
      '<div class="container">' +
        '<div class="newsletter-inner">' +
          '<div class="newsletter-text">' +
            '<h3>' + t('newsletter_title') + '</h3>' +
            '<p>' + t('newsletter_sub') + '</p>' +
          '</div>' +
          '<div class="newsletter-form">' +
            '<div class="nl-input-group">' +
              '<input type="email" id="nl-email-footer" placeholder="' + t('newsletter_placeholder') + '" aria-label="' + t('newsletter_placeholder') + '" onkeydown="if(event.key===\'Enter\') handleNewsletterSubmit(\'nl-email-footer\',\'nl-msg-footer\')">' +
              '<button class="btn btn-primary" onclick="handleNewsletterSubmit(\'nl-email-footer\',\'nl-msg-footer\')">' + t('newsletter_btn') + '</button>' +
            '</div>' +
            '<p id="nl-msg-footer" class="nl-msg" aria-live="polite"></p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="footer-main">' +
      '<div class="container footer-inner">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<h3>Afrae Décor</h3>' +
            '<p>' + t('footer_brand_text') + '</p>' +
            '<div class="footer-social">' +
              '<a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="social-icon">' + icons.instagram + '</a>' +
              '<a href="https://facebook.com"  target="_blank" rel="noopener noreferrer" aria-label="Facebook"  class="social-icon">' + icons.facebook  + '</a>' +
              '<a href="https://tiktok.com"    target="_blank" rel="noopener noreferrer" aria-label="TikTok"    class="social-icon">' + icons.tiktok    + '</a>' +
              '<a href="https://wa.me/212600000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" class="social-icon">' + icons.whatsapp + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>' + t('footer_nav') + '</h4>' +
            '<a href="/boutique"          onclick="event.preventDefault();navigate(\'/boutique\')">' + t('nav_shop') + '</a>' +
            '<a href="/comment-commander" onclick="event.preventDefault();navigate(\'/comment-commander\')">' + t('nav_how') + '</a>' +
            '<a href="/livraison"         onclick="event.preventDefault();navigate(\'/livraison\')">' + t('nav_delivery') + '</a>' +
            '<a href="/faq"               onclick="event.preventDefault();navigate(\'/faq\')">' + t('nav_faq') + '</a>' +
            '<a href="/contact"           onclick="event.preventDefault();navigate(\'/contact\')">' + t('nav_contact') + '</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>' + t('footer_contact_title') + '</h4>' +
            '<div class="footer-contact-item">' + icons.mapPin + '<span>' + t('footer_address') + '</span></div>' +
            '<div class="footer-contact-item">' + icons.phone  + '<a href="tel:+212600000000">' + t('footer_phone') + '</a></div>' +
            '<div class="footer-contact-item">' + icons.mail   + '<a href="mailto:contact@afraedecor.ma">' + t('footer_email') + '</a></div>' +
            '<div class="footer-payment-badge">' + t('footer_payment_text') + '<br><small>' + t('footer_payment_text2') + '</small></div>' +
          '</div>' +
          '<div class="footer-col footer-map-col">' +
            '<h4>📍 Localisation</h4>' +
            '<div class="footer-map">' +
              '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-8.05%2C31.6%2C-7.95%2C31.7&layer=mapnik&marker=31.6295%2C-7.9811" width="100%" height="160" frameborder="0" style="border-radius:10px;" title="Localisation Afrae Décor" loading="lazy" aria-label="Carte Marrakech"></iframe>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' + t('footer_rights').replace('{year}', new Date().getFullYear()) + '</div>' +
      '</div>' +
    '</div>';
}

// ===== PRODUCT CARD =====
function productCardHTML(p) {
  var fav = isFavorite(p.id);
  return '<div class="product-card" onclick="navigate(\'/produit/' + p.id + '\')" role="article" tabindex="0" onkeydown="if(event.key===\'Enter\') navigate(\'/produit/' + p.id + '\')">' +
    '<div class="product-card-img">' +
      '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
      '<button class="fav-btn ' + (fav?'active':'') + '" data-id="' + p.id + '" onclick="toggleFavorite(\'' + p.id + '\',event)" aria-label="' + (fav?t('fav_remove'):t('fav_add')) + '">' + heartIcon(fav) + '</button>' +
    '</div>' +
    '<div class="product-card-body">' +
      '<div class="product-card-cat">' + p.category + '</div>' +
      '<div class="product-card-name">' + p.name + '</div>' +
      '<div class="product-card-price">' + p.price + ' MAD</div>' +
      (!p.inStock ? '<div class="out-of-stock-badge">' + t('out_of_stock') + '</div>' : '') +
    '</div>' +
  '</div>';
}

// ===== SLIDER =====
function sliderHTML(id, title, products) {
  if (!products.length) return '';
  var slides = products.map(function(p, i) {
    var fav = isFavorite(p.id);
    return '<div class="slide ' + (i===0?'active':'') + '" role="group" aria-label="' + (i+1) + ' sur ' + products.length + '">' +
      '<div class="slide-img-wrap" onclick="navigate(\'/produit/' + p.id + '\')">' +
        '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
        '<button class="fav-btn ' + (fav?'active':'') + '" data-id="' + p.id + '" onclick="toggleFavorite(\'' + p.id + '\',event)" aria-label="' + (fav?t('fav_remove'):t('fav_add')) + '">' + heartIcon(fav) + '</button>' +
      '</div>' +
      '<div class="slide-body">' +
        '<div class="slide-cat">' + p.category + '</div>' +
        '<div class="slide-name" onclick="navigate(\'/produit/' + p.id + '\')">' + p.name + '</div>' +
        '<div class="slide-price">' + p.price + ' MAD</div>' +
        '<button class="btn btn-primary btn-sm" onclick="navigate(\'/produit/' + p.id + '\')">' + t('view_product') + ' ' + icons.arrowRight + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
  var dots = products.map(function(_, i) {
    return '<button class="slider-dot ' + (i===0?'active':'') + '" onclick="goToSlide(\'' + id + '\',' + i + ')" aria-label="Slide ' + (i+1) + '"></button>';
  }).join('');
  return '<div class="slider-block">' +
    '<h3 class="slider-title">' + title + '</h3>' +
    '<div class="slider" id="' + id + '" role="region" aria-roledescription="carrousel" aria-label="' + title + '" data-current="0">' +
      '<div class="slider-track" id="' + id + '-track">' + slides + '</div>' +
      '<button class="slider-arrow slider-prev" onclick="prevSlide(\'' + id + '\')" aria-label="Slide précédent">&#8249;</button>' +
      '<button class="slider-arrow slider-next" onclick="nextSlide(\'' + id + '\')" aria-label="Slide suivant">&#8250;</button>' +
      '<div class="slider-dots" role="tablist">' + dots + '</div>' +
    '</div>' +
  '</div>';
}

function goToSlide(sliderId, index) {
  var track  = document.getElementById(sliderId + '-track');
  var slider = document.getElementById(sliderId);
  if (!track || !slider) return;
  track.querySelectorAll('.slide').forEach(function(s,i){ s.classList.toggle('active', i===index); });
  slider.querySelectorAll('.slider-dot').forEach(function(d,i){ d.classList.toggle('active', i===index); });
  slider.dataset.current = index;
}
function nextSlide(sliderId) {
  var track  = document.getElementById(sliderId + '-track');
  var slider = document.getElementById(sliderId);
  if (!track) return;
  var count   = track.querySelectorAll('.slide').length;
  var current = parseInt(slider.dataset.current || '0', 10);
  goToSlide(sliderId, (current + 1) % count);
}
function prevSlide(sliderId) {
  var track  = document.getElementById(sliderId + '-track');
  var slider = document.getElementById(sliderId);
  if (!track) return;
  var count   = track.querySelectorAll('.slide').length;
  var current = parseInt(slider.dataset.current || '0', 10);
  goToSlide(sliderId, (current - 1 + count) % count);
}
function autoPlaySlider(sliderId, delay) {
  if (!delay) delay = 4500;
  if (sliderIntervals[sliderId]) clearInterval(sliderIntervals[sliderId]);
  sliderIntervals[sliderId] = setInterval(function(){ nextSlide(sliderId); }, delay);
}

// ===== CATEGORIES SECTION =====
function categoriesSectionHTML(currentFilter) {
  return '<section class="section section-bg categories-section" aria-label="Catégories">' +
    '<div class="container">' +
      '<div class="section-header">' +
        '<h2>' + t('categories_title') + '</h2>' +
        '<p>' + t('categories_sub') + '</p>' +
      '</div>' +
      '<div class="categories-grid">' +
        CATEGORIES.map(function(c) {
          var tkey = 'cat_' + c.key.toLowerCase();
          var label = t(tkey) || c.key;
          var isActive = currentFilter === c.key;
          return '<a href="/categorie/' + encodeURIComponent(c.key) + '" class="cat-card ' + (isActive?'active':'') + '" onclick="event.preventDefault();navigate(\'/categorie/' + encodeURIComponent(c.key) + '\')" aria-label="Catégorie ' + label + '">' +
            '<div class="cat-icon" style="background:' + c.color + '20;color:' + c.color + '"><span aria-hidden="true">' + c.icon + '</span></div>' +
            '<span class="cat-name">' + label + '</span>' +
          '</a>';
        }).join('') +
      '</div>' +
    '</div>' +
  '</section>';
}

// ===== NEWSLETTER SECTION =====
function newsletterSectionHTML() {
  return '<section class="newsletter-hero-section" aria-label="Newsletter">' +
    '<div class="container">' +
      '<div class="newsletter-hero-inner">' +
        '<span class="newsletter-icon" aria-hidden="true">✉️</span>' +
        '<h2>' + t('newsletter_title') + '</h2>' +
        '<p>' + t('newsletter_sub') + '</p>' +
        '<div class="nl-input-group nl-hero">' +
          '<input type="email" id="nl-email-home" placeholder="' + t('newsletter_placeholder') + '" aria-label="' + t('newsletter_placeholder') + '" onkeydown="if(event.key===\'Enter\') handleNewsletterSubmit(\'nl-email-home\',\'nl-msg-home\')">' +
          '<button class="btn btn-primary" onclick="handleNewsletterSubmit(\'nl-email-home\',\'nl-msg-home\')">' + t('newsletter_btn') + '</button>' +
        '</div>' +
        '<p id="nl-msg-home" class="nl-msg" aria-live="polite"></p>' +
      '</div>' +
    '</div>' +
  '</section>';
}

// ===== PAGE HOME =====
function renderHome(main) {
  var products = getProducts();
  var inStock  = products.filter(function(p){ return p.inStock; });
  var newItems = products.filter(function(p){ return p.tags && p.tags.includes('new'); });
  var best     = products.filter(function(p){ return p.tags && p.tags.includes('bestseller'); });
  var reco     = products.filter(function(p){ return p.tags && p.tags.includes('recommended'); });
  var featured = inStock.slice(0,4);

  main.innerHTML =
    '<section class="hero" aria-label="Bannière principale">' +
      '<img src="/assets/hero-bg.jpg" alt="Afrae Décor — Pièces artisanales en gypse" class="hero-bg">' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<h1>Afrae Décor</h1>' +
        '<p>' + t('hero_subtitle').replace('\n','<br>') + '</p>' +
        '<button class="btn btn-primary btn-lg" onclick="navigate(\'/boutique\')">' + t('hero_cta') + ' ' + icons.arrowRight + '</button>' +
      '</div>' +
    '</section>' +
    '<section class="section slider-section" aria-label="Sliders produits">' +
      '<div class="container">' +
        '<div class="sliders-wrapper">' +
          sliderHTML('slider-new',  t('slider_new'),         newItems.length ? newItems : inStock.slice(0,3)) +
          sliderHTML('slider-best', t('slider_bestsellers'), best.length     ? best     : inStock.slice(1,4)) +
          sliderHTML('slider-reco', t('slider_recommended'), reco.length     ? reco     : inStock.slice(0,3)) +
        '</div>' +
      '</div>' +
    '</section>' +
    categoriesSectionHTML() +
    '<section class="section" aria-label="Nos créations">' +
      '<div class="container">' +
        '<div class="section-header"><h2>' + t('home_creations_title') + '</h2><p>' + t('home_creations_sub') + '</p></div>' +
        '<div class="products-grid">' + featured.map(productCardHTML).join('') + '</div>' +
        '<div class="text-center" style="margin-top:44px"><button class="btn btn-outline btn-lg" onclick="navigate(\'/boutique\')">' + t('home_see_all') + '</button></div>' +
      '</div>' +
    '</section>' +
    '<section class="section section-bg" aria-label="Comment commander">' +
      '<div class="container">' +
        '<div class="section-header"><h2>' + t('home_how_title') + '</h2></div>' +
        '<div class="steps-grid">' +
          '<div class="step-item"><div class="step-num">1</div><h3>' + t('home_step1_title') + '</h3><p>' + t('home_step1_text') + '</p></div>' +
          '<div class="step-item"><div class="step-num">2</div><h3>' + t('home_step2_title') + '</h3><p>' + t('home_step2_text') + '</p></div>' +
          '<div class="step-item"><div class="step-num">3</div><h3>' + t('home_step3_title') + '</h3><p>' + t('home_step3_text') + '</p></div>' +
        '</div>' +
      '</div>' +
    '</section>' +
    newsletterSectionHTML();

  autoPlaySlider('slider-new',  4500);
  autoPlaySlider('slider-best', 5000);
  autoPlaySlider('slider-reco', 5500);
}

// ===== PAGE BOUTIQUE =====
function renderShop(main) {
  main.innerHTML =
    '<div class="container">' +
      '<div class="page-header"><h1>' + t('shop_title') + '</h1><p>' + t('shop_sub') + '</p></div>' +
      categoriesSectionHTML() +
      '<div class="products-grid" style="margin-top:40px">' + getProducts().map(productCardHTML).join('') + '</div>' +
      '<div style="height:60px"></div>' +
    '</div>';
}

// ===== PAGE BOUTIQUE FILTRÉE =====
function renderShopFiltered(main, category) {
  var products = getProducts().filter(function(p){ return p.category === category; });
  var catInfo  = CATEGORIES.find(function(c){ return c.key === category; });
  var catLabel = t('cat_' + category.toLowerCase()) || category;
  main.innerHTML =
    '<div class="container">' +
      '<div class="page-header">' +
        '<div style="font-size:3rem;margin-bottom:8px" aria-hidden="true">' + (catInfo ? catInfo.icon : '🏺') + '</div>' +
        '<h1>' + catLabel + '</h1>' +
        '<p>' + products.length + ' article' + (products.length>1?'s':'') + '</p>' +
      '</div>' +
      categoriesSectionHTML(category) +
      '<div class="products-grid" style="margin-top:40px">' +
        (products.length ? products.map(productCardHTML).join('') : '<p style="color:var(--muted);text-align:center;grid-column:1/-1">Aucun produit dans cette catégorie.</p>') +
      '</div>' +
      '<div style="height:60px"></div>' +
    '</div>';
}

// ===== PAGE FAVORIS =====
function renderFavorites(main) {
  var favIds   = getFavorites();
  var products = getProducts().filter(function(p){ return favIds.includes(p.id); });
  if (!products.length) {
    main.innerHTML = '<div class="empty-state"><div style="font-size:4rem;margin-bottom:16px" aria-hidden="true">🤍</div><h2>' + t('favorites_empty_title') + '</h2><p>' + t('favorites_empty_text') + '</p><button class="btn btn-primary" onclick="navigate(\'/boutique\')">' + t('favorites_discover') + '</button></div>';
    return;
  }
  main.innerHTML = '<div class="container"><div class="page-header"><h1>' + t('favorites_title') + '</h1><p>' + t('favorites_sub') + '</p></div><div class="products-grid">' + products.map(productCardHTML).join('') + '</div><div style="height:60px"></div></div>';
}

// ===== PAGE PRODUCT DETAIL =====
function renderProductDetail(main, id) {
  var p = getProducts().find(function(x){ return x.id === id; });
  if (!p) { renderNotFound(main); return; }
  var fav = isFavorite(p.id);
  main.innerHTML =
    '<div class="container" style="padding-top:32px;padding-bottom:60px">' +
      '<a href="#" class="back-link" onclick="event.preventDefault();navigate(\'/boutique\')">' + icons.arrowLeft + ' ' + t('back_shop') + '</a>' +
      '<div class="product-detail-grid">' +
        '<div class="product-detail-img"><img src="' + p.image + '" alt="' + p.name + '"></div>' +
        '<div class="product-detail-info">' +
          '<p class="product-cat">' + p.category + '</p>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<h1 class="product-title">' + p.name + '</h1>' +
            '<button class="fav-btn-lg ' + (fav?'active':'') + '" data-id="' + p.id + '" onclick="toggleFavorite(\'' + p.id + '\',event)" aria-label="' + (fav?t('fav_remove'):t('fav_add')) + '">' + heartIcon(fav) + '</button>' +
          '</div>' +
          '<div class="product-price">' + p.price + ' MAD</div>' +
          '<p class="product-desc">' + p.description + '</p>' +
          '<div style="display:flex;flex-direction:column;gap:12px">' +
            '<button class="btn btn-primary btn-lg" onclick="addToCart(' + JSON.stringify(p).replace(/"/g,'&quot;') + ')" ' + (!p.inStock?'disabled':'') + '>' + icons.shoppingBag + ' ' + (p.inStock?t('add_to_cart'):t('out_of_stock')) + '</button>' +
            '<p style="font-size:0.78rem;color:var(--muted);text-align:center">' + t('payment_info') + '</p>' +
          '</div>' +
          '<div class="product-info-box"><div>🏺 Matière : Gypse artisanal</div><div>✨ Pièce unique</div><div>📦 Emballage soigné (produit fragile)</div><div>↩️ Pas de retour sauf casse à la livraison</div></div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

// ===== PAGE CART =====
function renderCart(main) {
  var cart = getCart();
  if (!cart.length) {
    main.innerHTML = '<div class="empty-state">' + icons.shoppingBag.replace('width="20"','width="52"').replace('height="20"','height="52"') + '<h2>Votre panier est vide</h2><p>Découvrez nos créations artisanales</p><button class="btn btn-primary" onclick="navigate(\'/boutique\')">Voir la boutique</button></div>';
    return;
  }
  main.innerHTML =
    '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:820px">' +
      '<h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:300;margin-bottom:28px">Panier</h1>' +
      '<div class="cart-items" id="cart-items"></div>' +
      '<div class="cart-summary">' +
        '<div class="cart-total"><span class="cart-total-label">Total</span><span class="cart-total-amount" id="cart-total">' + getCartTotal() + ' MAD</span></div>' +
        '<button class="btn btn-primary btn-lg" style="width:100%" onclick="navigate(\'/commander\')">Passer la commande ' + icons.arrowRight + '</button>' +
        '<p style="font-size:0.78rem;color:var(--muted);text-align:center;margin-top:10px">' + t('payment_info') + '</p>' +
      '</div>' +
    '</div>';
  renderCartItems();
}
function renderCartItems() {
  var container = document.getElementById('cart-items'); if (!container) return;
  container.innerHTML = getCart().map(function(item) {
    return '<div class="cart-item"><div class="cart-item-img"><img src="' + item.image + '" alt="' + item.name + '"></div><div class="cart-item-info"><div class="cart-item-name">' + item.name + '</div><div class="cart-item-price">' + item.price + ' MAD</div></div><div class="qty-control"><button class="qty-btn" onclick="changeQty(\'' + item.id + '\',' + (item.quantity-1) + ')" aria-label="Diminuer">−</button><span class="qty-val">' + item.quantity + '</span><button class="qty-btn" onclick="changeQty(\'' + item.id + '\',' + (item.quantity+1) + ')" aria-label="Augmenter">+</button></div><button class="remove-btn" onclick="removeItem(\'' + item.id + '\')" aria-label="Supprimer">' + icons.trash + '</button></div>';
  }).join('');
  var tel = document.getElementById('cart-total'); if (tel) tel.textContent = getCartTotal() + ' MAD';
}
function changeQty(id, qty) { updateQty(id,qty); renderCartItems(); if (!getCart().length) renderCart(document.getElementById('main-content')); }
function removeItem(id)     { removeFromCart(id);  renderCartItems(); if (!getCart().length) renderCart(document.getElementById('main-content')); }

// ===== PAGE CHECKOUT =====
function renderCheckout(main) {
  if (!getCart().length) { main.innerHTML='<div class="empty-state"><h2>Panier vide</h2><button class="btn btn-primary" onclick="navigate(\'/boutique\')">Voir la boutique</button></div>'; return; }
  var cart = getCart();
  main.innerHTML =
    '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:900px">' +
      '<h1 style="font-family:var(--font-heading);font-size:2rem;font-weight:300;margin-bottom:36px">Passer la commande</h1>' +
      '<div class="checkout-grid">' +
        '<div>' +
          '<div class="form-group"><label for="co-name">Nom complet *</label><input type="text" id="co-name" placeholder="Votre nom complet" required></div>' +
          '<div class="form-group"><label for="co-phone">Téléphone *</label><input type="tel" id="co-phone" placeholder="06 XX XX XX XX" required></div>' +
          '<div class="form-group"><label for="co-address">Adresse complète *</label><textarea id="co-address" placeholder="Rue, immeuble, étage..." required></textarea></div>' +
          '<div class="form-group"><label for="co-city">Ville *</label><input type="text" id="co-city" placeholder="Votre ville" required></div>' +
          '<div class="form-group"><label for="co-notes">Notes (optionnel)</label><textarea id="co-notes" placeholder="Instructions spéciales..."></textarea></div>' +
          '<div class="payment-box"><strong>💰 Mode de paiement</strong><span style="color:var(--muted);font-size:0.875rem">' + t('payment_info') + '</span></div>' +
          '<button class="btn btn-primary btn-lg" style="width:100%" onclick="submitOrder()">Confirmer la commande</button>' +
        '</div>' +
        '<div><div class="order-summary-box"><h3>Résumé</h3>' + cart.map(function(item){ return '<div class="summary-item"><span>'+item.name+' × '+item.quantity+'</span><span>'+(item.price*item.quantity)+' MAD</span></div>'; }).join('') + '<div class="summary-total"><span>Total</span><span>' + getCartTotal() + ' MAD</span></div></div></div>' +
      '</div>' +
    '</div>';
}
function submitOrder() {
  var name=document.getElementById('co-name')?.value.trim(), phone=document.getElementById('co-phone')?.value.trim(), address=document.getElementById('co-address')?.value.trim(), city=document.getElementById('co-city')?.value.trim(), notes=document.getElementById('co-notes')?.value.trim();
  if (!name||!phone||!address||!city) { showToast('Veuillez remplir tous les champs obligatoires','error'); return; }
  saveOrder({customerName:name,customerPhone:phone,customerAddress:address,customerCity:city,notes:notes,items:getCart(),total:getCartTotal()});
  clearCart();
  document.getElementById('main-content').innerHTML = '<div class="success-page"><div class="success-icon">' + icons.check + '</div><h1 style="font-family:var(--font-heading);font-size:2.5rem;font-weight:300;margin-bottom:14px">Commande confirmée !</h1><p style="color:var(--muted);margin-bottom:8px">Merci pour votre commande. Nous vous contacterons bientôt.</p><p style="font-size:0.875rem;color:var(--muted);margin-bottom:36px">' + t('payment_info') + '</p><button class="btn btn-primary btn-lg" onclick="navigate(\'/\')">' + t('back_home') + '</button></div>';
}

// ===== PAGE HOW TO ORDER =====
function renderHowToOrder(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px"><div class="page-header"><h1>Comment commander</h1><p>Simple, rapide et sécurisé</p></div><div class="steps-v">' +
    [['1','Parcourez la boutique','Explorez notre collection et découvrez nos pièces artisanales en gypse.'],['2','Ajoutez au panier','Cliquez sur "Ajouter au panier" pour les articles qui vous plaisent.'],['3','Remplissez le formulaire','Indiquez votre nom, téléphone et adresse de livraison.'],['4','Confirmez la commande','Nous vous contacterons par téléphone pour confirmer les détails.'],['5','Payez à la livraison','Payez en espèces ou par carte à la réception.']].map(function(s){ return '<div class="step-v"><div class="step-v-num">'+s[0]+'</div><div><h3>'+s[1]+'</h3><p>'+s[2]+'</p></div></div>'; }).join('') +
  '</div></div>';
}

// ===== PAGE DELIVERY =====
function renderDelivery(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:720px"><div class="page-header"><h1>Livraison</h1><p>Livraison dans tout le Maroc</p></div><div>' +
    [[icons.pkg,'Emballage soigné','Nos produits en gypse sont fragiles. Chaque pièce est emballée avec le plus grand soin.'],[icons.clock,'Délais de livraison','Livraison sous 3 à 7 jours ouvrables. Nous vous contacterons pour confirmer la date.'],[icons.shield,'Paiement à la livraison','Payez uniquement à la réception. Espèces et carte bancaire acceptées.'],[icons.alert,'Politique de retour','Retours acceptés uniquement en cas de casse constatée à la livraison.']].map(function(c){ return '<div class="info-card"><div class="info-card-icon">'+c[0]+'</div><div><h3>'+c[1]+'</h3><p>'+c[2]+'</p></div></div>'; }).join('') +
  '</div></div>';
}

// ===== PAGE CONTACT =====
function renderContact(main) {
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px;max-width:860px"><div class="page-header"><h1>Contact</h1><p>Une question ? N\'hésitez pas à nous écrire</p></div><div class="contact-grid"><div><p style="color:var(--muted);margin-bottom:28px;font-size:0.95rem;line-height:1.75">Une question sur nos produits ou votre commande ? Contactez-nous, nous vous répondrons rapidement.</p>' +
    [[icons.phone,'Téléphone','+212 6XX XX XX XX'],[icons.mail,'Email','contact@afraedecor.ma'],[icons.mapPin,'Localisation','Marrakech, Maroc']].map(function(i){ return '<div class="contact-info-item"><div class="contact-icon">'+i[0]+'</div><div><div class="contact-info-label">'+i[1]+'</div><div class="contact-info-val">'+i[2]+'</div></div></div>'; }).join('') +
    '</div><div><div class="form-group"><label for="ct-name">Nom</label><input type="text" id="ct-name" placeholder="Votre nom"></div><div class="form-group"><label for="ct-email">Email</label><input type="email" id="ct-email" placeholder="votre@email.com"></div><div class="form-group"><label for="ct-msg">Message</label><textarea id="ct-msg" rows="5" placeholder="Votre message..."></textarea></div><button class="btn btn-primary" style="width:100%" onclick="sendContact()">Envoyer le message</button></div></div></div>';
}
function sendContact() {
  var name=document.getElementById('ct-name')?.value.trim(), email=document.getElementById('ct-email')?.value.trim(), msg=document.getElementById('ct-msg')?.value.trim();
  if (!name||!email||!msg) { showToast('Veuillez remplir tous les champs','error'); return; }
  showToast('Message envoyé ! Nous vous répondrons rapidement.','success');
  document.getElementById('ct-name').value=''; document.getElementById('ct-email').value=''; document.getElementById('ct-msg').value='';
}

// ===== PAGE FAQ =====
function renderFaq(main) {
  var faqs = [["Qu'est-ce que le gypse ?","Le gypse est un matériau naturel utilisé depuis l'antiquité pour créer des objets décoratifs uniques."],["Les produits sont-ils fragiles ?","Oui, le gypse est délicat. Chaque pièce est emballée avec soin."],["Comment puis-je payer ?","Paiement à la livraison uniquement, espèces ou carte."],["Quels sont les délais de livraison ?","3 à 7 jours ouvrables."],["Puis-je retourner un produit ?","Uniquement en cas de casse constatée à la livraison."],["Les pièces sont-elles uniques ?","Oui, chaque pièce est faite à la main."],["Livrez-vous dans tout le Maroc ?","Oui, dans toutes les villes."]];
  main.innerHTML = '<div class="container" style="padding-top:40px;padding-bottom:60px"><div class="page-header"><h1>Questions Fréquentes</h1><p>Tout ce que vous devez savoir</p></div><div class="faq-list">' +
    faqs.map(function(f,i){ return '<div class="faq-item"><button class="faq-question" onclick="toggleFaq('+i+')" aria-expanded="false" aria-controls="faq-'+i+'">'+f[0]+'<span class="faq-arrow" aria-hidden="true">▼</span></button><div class="faq-answer" id="faq-'+i+'" role="region">'+f[1]+'</div></div>'; }).join('') +
  '</div></div>';
}
function toggleFaq(i) {
  var answer=document.getElementById('faq-'+i), question=answer?.previousElementSibling, isOpen=answer?.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(function(a){ a.classList.remove('open'); });
  document.querySelectorAll('.faq-question').forEach(function(q){ q.classList.remove('open'); q.setAttribute('aria-expanded','false'); });
  if (!isOpen) { answer?.classList.add('open'); question?.classList.add('open'); question?.setAttribute('aria-expanded','true'); }
}

// ===== 404 =====
function renderNotFound(main) {
  main.innerHTML = '<div class="empty-state"><h1 style="font-size:5rem;font-family:var(--font-heading);color:var(--muted)">404</h1><h2>' + t('page_not_found') + '</h2><p>' + t('page_not_found_text') + '</p><button class="btn btn-primary" onclick="navigate(\'/\')">' + t('back_home') + '</button></div>';
}

// ===== NAVBAR MOBILE =====
var mobileOpen = false;
function toggleMobileMenu() {
  mobileOpen = !mobileOpen;
  document.getElementById('mobile-menu').classList.toggle('open', mobileOpen);
  var hb = document.getElementById('hamburger-btn');
  if (hb) { hb.innerHTML = mobileOpen ? icons.x : icons.menu; hb.setAttribute('aria-expanded', mobileOpen); }
}
function closeMobileMenu() {
  mobileOpen = false;
  var mm = document.getElementById('mobile-menu'); if (mm) mm.classList.remove('open');
  var hb = document.getElementById('hamburger-btn'); if (hb) { hb.innerHTML = icons.menu; hb.setAttribute('aria-expanded','false'); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  // Direction
  var dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', currentLang);

  // Injecter bouton langue dans nav
  var navRight = document.querySelector('.nav-right');
  if (navRight) {
    var lw = document.createElement('div');
    lw.id = 'lang-wrapper';
    lw.innerHTML = renderLangBtn();
    navRight.insertBefore(lw, navRight.firstChild);
  }

  // Ajouter Favoris dans nav-links
  var navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    var li = document.createElement('li');
    li.innerHTML = '<a href="/favoris" style="display:flex;align-items:center;gap:6px;position:relative" onclick="event.preventDefault();navigate(\'/favoris\')" aria-label="Mes favoris">' + icons.heart + '<span class="fav-nav-count" aria-hidden="true"></span></a>';
    navLinks.appendChild(li);
  }

  // Ajouter Favoris dans mobile-menu
  var mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    var a = document.createElement('a');
    a.href = '/favoris';
    a.innerHTML = '❤️ ' + t('nav_favorites') + ' <span class="fav-nav-count"></span>';
    a.addEventListener('click', function(e){ e.preventDefault(); navigate('/favoris'); });
    mobileMenu.appendChild(a);
  }

  updateCartUI();
  updateFavBadge();
  render(window.location.pathname);
  updateActiveNav(window.location.pathname);
  renderFooter();

  // Intercepter liens internes
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) { e.preventDefault(); navigate(href); }
  });
});
