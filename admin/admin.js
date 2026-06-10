// ============================================================
// admin.js — Afrae Décor Administration
// Lit les commandes via db.js (stockage partagé tous appareils)
// ============================================================

const ADMIN_PWD = 'afrae2024'; // ← Changez ce mot de passe !

var allOrders     = [];
var currentFilter = 'all';

// ===== LOGIN =====
function doLogin() {
  var val = document.getElementById('pwd-input').value;
  if (val === ADMIN_PWD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-app').style.display    = 'flex';
    loadAll();
    // Auto-refresh toutes les 30 secondes pour voir les nouvelles commandes
    setInterval(loadAll, 30000);
  } else {
    var errEl = document.getElementById('login-err');
    errEl.textContent = 'Mot de passe incorrect';
    var inp = document.getElementById('pwd-input');
    inp.classList.add('shake');
    inp.value = '';
    setTimeout(function(){ inp.classList.remove('shake'); }, 400);
  }
}

// ===== CHARGEMENT =====
async function loadAll() {
  var btn = document.getElementById('refresh-btn');
  btn.textContent = '↻ Chargement…'; btn.disabled = true;
  try {
    // dbGetOrders() dans db.js lit depuis le stockage partagé
    allOrders = await dbGetOrders();
    renderStats();
    renderOrders();
    await loadNewsletter();
    var now = new Date().toLocaleTimeString('fr-FR');
    document.getElementById('last-refresh').textContent = 'Mis à jour : ' + now;
  } catch(e) {
    showToast('Erreur de chargement : ' + e.message, 'error');
  }
  btn.textContent = '↻ Actualiser'; btn.disabled = false;
}

// ===== STATISTIQUES =====
function renderStats() {
  var total     = allOrders.length;
  var pending   = allOrders.filter(function(o){ return o.deliveryStatus === 'en_attente'; }).length;
  var confirmed = allOrders.filter(function(o){ return o.deliveryStatus === 'confirmee';  }).length;
  var delivered = allOrders.filter(function(o){ return o.deliveryStatus === 'livree';     }).length;
  var revenue   = allOrders.filter(function(o){ return o.deliveryStatus === 'livree';     }).reduce(function(s,o){ return s + (o.total||0); }, 0);

  document.getElementById('s-total').textContent     = total;
  document.getElementById('s-pending').textContent   = pending;
  document.getElementById('s-confirmed').textContent = confirmed;
  document.getElementById('s-delivered').textContent = delivered;
  document.getElementById('s-revenue').textContent   = revenue.toLocaleString('fr-FR');

  // Badge "en attente" dans le menu
  var pc = document.getElementById('pending-count');
  if (pending > 0) { pc.textContent = pending; pc.style.display = 'inline-flex'; }
  else             { pc.style.display = 'none'; }
}

// ===== TABLE COMMANDES =====
function renderOrders() {
  var tbody = document.getElementById('orders-tbody');
  var countEl = document.getElementById('orders-count');
  var list = currentFilter === 'all'
    ? allOrders
    : allOrders.filter(function(o){ return o.deliveryStatus === currentFilter; });

  countEl.textContent = list.length > 0 ? list.length : '';

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-cell">Aucune commande trouvée</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(function(o) {
    var date  = new Date(o.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    var items = (o.items||[]).map(function(i){ return i.name + ' ×' + i.quantity; }).join(', ');
    var statusClass = { en_attente:'status-pending', confirmee:'status-confirmed', livree:'status-delivered', annulee:'status-cancelled' }[o.deliveryStatus] || 'status-pending';
    return '<tr>' +
      '<td class="td-mono">' + o.id.slice(-8) + '</td>' +
      '<td class="td-bold">' + (o.customerName||'—') + '</td>' +
      '<td>' + (o.customerPhone||'—') + '</td>' +
      '<td>' + (o.customerCity||'—') + '</td>' +
      '<td class="td-items" title="' + items + '">' + (items.length > 45 ? items.slice(0,45)+'…' : items) + '</td>' +
      '<td class="td-bold">' + (o.total||0).toLocaleString('fr-FR') + ' MAD</td>' +
      '<td><select class="status-select ' + statusClass + '" onchange="changeStatus(\'' + o.id + '\',this.value)">' +
        '<option value="en_attente"' + (o.deliveryStatus==='en_attente'?' selected':'') + '>⏳ En attente</option>' +
        '<option value="confirmee"' +  (o.deliveryStatus==='confirmee' ?' selected':'') + '>✅ Confirmée</option>' +
        '<option value="livree"' +     (o.deliveryStatus==='livree'    ?' selected':'') + '>🚚 Livrée</option>' +
        '<option value="annulee"' +    (o.deliveryStatus==='annulee'   ?' selected':'') + '>❌ Annulée</option>' +
      '</select></td>' +
      '<td class="td-date">' + date + '</td>' +
      '<td class="td-actions">' +
        '<button class="btn-action" onclick="openDetail(\'' + o.id + '\')">👁 Voir</button>' +
        '<button class="btn-action btn-del" onclick="confirmDeleteOrder(\'' + o.id + '\')">🗑</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function filterOrders(status, btn) {
  currentFilter = status;
  document.querySelectorAll('.pill').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
  renderOrders();
}

async function changeStatus(id, newStatus) {
  await dbUpdateOrder(id, { deliveryStatus: newStatus });
  var idx = allOrders.findIndex(function(o){ return o.id === id; });
  if (idx !== -1) allOrders[idx].deliveryStatus = newStatus;
  renderStats();
  renderOrders();
  showToast('Statut mis à jour ✓', 'success');
}

function confirmDeleteOrder(id) {
  var o = allOrders.filter(function(x){ return x.id === id; })[0];
  var name = o ? o.customerName : id;
  if (!confirm('Supprimer la commande de ' + name + ' ?\nCette action est irréversible.')) return;
  deleteOrderById(id);
}

async function deleteOrderById(id) {
  await dbDeleteOrder(id);
  allOrders = allOrders.filter(function(o){ return o.id !== id; });
  renderStats(); renderOrders();
  closeModal();
  showToast('Commande supprimée', 'success');
}

// ===== MODAL DÉTAIL =====
function openDetail(id) {
  var o = allOrders.filter(function(x){ return x.id === id; })[0];
  if (!o) return;
  var date = new Date(o.createdAt).toLocaleString('fr-FR');

  document.getElementById('modal-title').textContent = 'Commande #' + o.id.slice(-8);
  document.getElementById('modal-body').innerHTML =
    '<div class="detail-grid">' +
      '<div class="detail-field"><label>Client</label><span>' + (o.customerName||'—') + '</span></div>' +
      '<div class="detail-field"><label>Téléphone</label><span>' + (o.customerPhone||'—') + '</span></div>' +
      '<div class="detail-field"><label>Ville</label><span>' + (o.customerCity||'—') + '</span></div>' +
      '<div class="detail-field"><label>Date</label><span>' + date + '</span></div>' +
      '<div class="detail-field full"><label>Adresse</label><span>' + (o.customerAddress||'—') + '</span></div>' +
      (o.notes ? '<div class="detail-field full"><label>Notes</label><span>' + o.notes + '</span></div>' : '') +
    '</div>' +
    '<table class="detail-table">' +
      '<thead><tr><th>Article</th><th>Qté</th><th>Prix</th><th>Sous-total</th></tr></thead>' +
      '<tbody>' + (o.items||[]).map(function(i){ return '<tr><td>'+i.name+'</td><td>'+i.quantity+'</td><td>'+i.price+' MAD</td><td>'+(i.price*i.quantity)+' MAD</td></tr>'; }).join('') + '</tbody>' +
      '<tfoot><tr><td colspan="3"><strong>Total</strong></td><td><strong>' + (o.total||0).toLocaleString('fr-FR') + ' MAD</strong></td></tr></tfoot>' +
    '</table>' +
    '<div class="detail-actions">' +
      '<div class="detail-status-row">' +
        '<label>Modifier le statut :</label>' +
        '<select class="status-select" onchange="changeStatus(\'' + o.id + '\',this.value)">' +
          '<option value="en_attente"' + (o.deliveryStatus==='en_attente'?' selected':'') + '>⏳ En attente</option>' +
          '<option value="confirmee"' +  (o.deliveryStatus==='confirmee' ?' selected':'') + '>✅ Confirmée</option>' +
          '<option value="livree"' +     (o.deliveryStatus==='livree'    ?' selected':'') + '>🚚 Livrée</option>' +
          '<option value="annulee"' +    (o.deliveryStatus==='annulee'   ?' selected':'') + '>❌ Annulée</option>' +
        '</select>' +
      '</div>' +
      '<button class="btn btn-danger" onclick="confirmDeleteOrder(\'' + o.id + '\')">🗑 Supprimer la commande</button>' +
    '</div>';

  document.getElementById('modal').classList.add('open');
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }

// Fermer modal avec Escape
document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

// ===== NEWSLETTER =====
async function loadNewsletter() {
  var emails = await dbGetNewsletterEmails();
  var el = document.getElementById('nl-content');
  if (!emails.length) {
    el.innerHTML = '<p class="empty-msg">Aucun abonné pour le moment.</p>';
    return;
  }
  el.innerHTML =
    '<div class="nl-header">' + emails.length + ' abonné' + (emails.length>1?'s':'') + '</div>' +
    '<ul class="nl-list">' + emails.map(function(e){ return '<li>' + e + '</li>'; }).join('') + '</ul>';
}

// ===== ONGLETS =====
function showTab(tab, link) {
  document.querySelectorAll('.tab-section').forEach(function(s){ s.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(a){ a.classList.remove('active'); });
  document.getElementById('tab-' + tab).classList.add('active');
  link.classList.add('active');
}

// ===== EXPORT =====
function exportCSV() {
  if (!allOrders.length) { showToast('Aucune commande à exporter', 'error'); return; }
  var header = ['ID','Date','Client','Téléphone','Ville','Adresse','Articles','Total','Statut'];
  var rows = allOrders.map(function(o){
    return [
      o.id,
      new Date(o.createdAt).toLocaleString('fr-FR'),
      o.customerName, o.customerPhone, o.customerCity,
      (o.customerAddress||'').replace(/[\n,]/g,' '),
      (o.items||[]).map(function(i){ return i.name+'×'+i.quantity; }).join(' | '),
      o.total, o.deliveryStatus
    ];
  });
  var csv = [header].concat(rows).map(function(r){ return r.map(function(c){ return '"'+(c||'')+'"'; }).join(','); }).join('\n');
  download('commandes_' + dateStamp() + '.csv', 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv));
  showToast('CSV exporté ✓', 'success');
}

function exportJSON() {
  if (!allOrders.length) { showToast('Aucune commande à exporter', 'error'); return; }
  download('commandes_' + dateStamp() + '.json', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allOrders, null, 2)));
  showToast('JSON exporté ✓', 'success');
}

async function exportNL() {
  var emails = await dbGetNewsletterEmails();
  if (!emails.length) { showToast('Aucun abonné à exporter', 'error'); return; }
  download('newsletter_' + dateStamp() + '.txt', 'data:text/plain;charset=utf-8,' + encodeURIComponent(emails.join('\n')));
  showToast('Emails exportés ✓', 'success');
}

async function confirmClearOrders() {
  if (!confirm('⚠️ Effacer TOUTES les commandes ?\n\nCette action est irréversible.\nConsidérez d\'abord exporter les données.')) return;
  allOrders = [];
  await dbSetOrders([]);
  renderStats(); renderOrders();
  showToast('Toutes les commandes ont été supprimées', 'success');
}

// ===== UTILITAIRES =====
function download(filename, dataUrl) {
  var a = document.createElement('a'); a.href = dataUrl; a.download = filename; a.click();
}
function dateStamp() {
  var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function showToast(msg, type) {
  var el = document.getElementById('toast-bar');
  el.textContent = msg; el.className = 'toast-bar show ' + (type||'');
  clearTimeout(el._t); el._t = setTimeout(function(){ el.classList.remove('show'); }, 3000);
}

// Focus sur le champ mot de passe au chargement
document.getElementById('pwd-input').focus();
