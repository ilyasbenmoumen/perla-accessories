// ============================================================
// db.js — Base de données centralisée Afrae Décor
// Les commandes sont stockées de façon PARTAGÉE :
//   window.storage (si disponible) = accessible depuis tous les appareils
//   localStorage = copie locale + fallback
// ============================================================

const DB_ORDERS_KEY = 'afrae_orders';
const DB_NL_KEY     = 'afrae_newsletter';

// Détecte si le stockage partagé est disponible
const useShared = (typeof window !== 'undefined' && typeof window.storage !== 'undefined');

// ===== COMMANDES =====

async function dbGetOrders() {
  if (useShared) {
    try {
      const r = await window.storage.get(DB_ORDERS_KEY, true);
      if (r && r.value) {
        const orders = JSON.parse(r.value);
        // Mettre à jour le cache local
        localStorage.setItem(DB_ORDERS_KEY, r.value);
        return orders;
      }
    } catch(e) { console.warn('shared storage read failed, using localStorage', e); }
  }
  try { return JSON.parse(localStorage.getItem(DB_ORDERS_KEY) || '[]'); }
  catch { return []; }
}

async function dbSaveOrder(orderData) {
  const orders = await dbGetOrders();
  const order = {
    id: 'ORD-' + Date.now(),
    createdAt: new Date().toISOString(),
    deliveryStatus: 'en_attente',
    paymentStatus: 'non_payee',
    ...orderData
  };
  orders.unshift(order);
  await _dbWriteOrders(orders);
  return order;
}

async function dbUpdateOrder(id, updates) {
  const orders = await dbGetOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    await _dbWriteOrders(orders);
  }
}

async function dbDeleteOrder(id) {
  const orders = (await dbGetOrders()).filter(o => o.id !== id);
  await _dbWriteOrders(orders);
}

async function _dbWriteOrders(orders) {
  const json = JSON.stringify(orders);
  // Toujours écrire en local
  localStorage.setItem(DB_ORDERS_KEY, json);
  // Écrire sur le stockage partagé si disponible
  if (useShared) {
    try { await window.storage.set(DB_ORDERS_KEY, json, true); }
    catch(e) { console.warn('shared storage write failed', e); }
  }
}

// ===== NEWSLETTER =====

async function dbGetNewsletterEmails() {
  if (useShared) {
    try {
      const r = await window.storage.get(DB_NL_KEY, true);
      if (r && r.value) {
        localStorage.setItem(DB_NL_KEY, r.value);
        return JSON.parse(r.value);
      }
    } catch(e) { console.warn('shared storage read failed', e); }
  }
  try { return JSON.parse(localStorage.getItem(DB_NL_KEY) || '[]'); }
  catch { return []; }
}

async function dbSubscribeNewsletter(email) {
  const emails = await dbGetNewsletterEmails();
  if (emails.includes(email)) return 'already';
  emails.push(email);
  const json = JSON.stringify(emails);
  localStorage.setItem(DB_NL_KEY, json);
  if (useShared) {
    try { await window.storage.set(DB_NL_KEY, json, true); }
    catch(e) { console.warn('shared storage newsletter write failed', e); }
  }
  return 'ok';
}
