const STORAGE_KEY = 'ugo-service-orders-v1';
const MAX_PHOTO_SIZE = 1.5 * 1024 * 1024;

const form = document.querySelector('#serviceForm');
const tabs = document.querySelectorAll('.nav-tab');
const views = {
  request: document.querySelector('#requestView'),
  orders: document.querySelector('#ordersView')
};
const ordersList = document.querySelector('#ordersList');
const emptyState = document.querySelector('#emptyState');
const emptyTitle = document.querySelector('#emptyTitle');
const emptyText = document.querySelector('#emptyText');
const orderCount = document.querySelector('#orderCount');
const toast = document.querySelector('#toast');
const clearOrders = document.querySelector('#clearOrders');
const filters = document.querySelectorAll('.filter');
const searchInput = document.querySelector('#orderSearch');
const priorityFilter = document.querySelector('#priorityFilter');
const sortOrders = document.querySelector('#sortOrders');
const resultsInfo = document.querySelector('#resultsInfo');
const problemCount = document.querySelector('#problemCount');
const photoInput = document.querySelector('#faultPhoto');
const photoPreview = document.querySelector('#photoPreview');
const photoLabel = document.querySelector('#photoLabel');
const statTotal = document.querySelector('#statTotal');
const statNew = document.querySelector('#statNew');
const statWorking = document.querySelector('#statWorking');
const statUrgent = document.querySelector('#statUrgent');

let activeFilter = 'Sve';
let currentPhotoData = '';

function loadOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function showView(name) {
  Object.entries(views).forEach(([key, view]) => {
    view.classList.toggle('active', key === name);
  });
  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.view === name));
  if (name === 'orders') renderOrders();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatDate(iso) {
  if (!iso) return 'Nije odabran';
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(`${iso}T12:00:00`));
}

function formatCreatedAt(value) {
  if (!value) return 'Nepoznato';
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
}

function makeOrderId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UGO-${date}-${suffix}`;
}

function priorityWeight(priority) {
  return { Kritično: 3, Hitno: 2, Normalno: 1 }[priority] || 0;
}

function statusClass(status) {
  if (status === 'U obradi') return 'working';
  if (status === 'Završeno') return 'done';
  return '';
}

function updateStats(orders) {
  orderCount.textContent = orders.length;
  statTotal.textContent = orders.length;
  statNew.textContent = orders.filter(order => order.status === 'Novo').length;
  statWorking.textContent = orders.filter(order => order.status === 'U obradi').length;
  statUrgent.textContent = orders.filter(order => ['Hitno', 'Kritično'].includes(order.priority)).length;
}

function getVisibleOrders(orders) {
  const query = searchInput.value.trim().toLocaleLowerCase('hr-HR');
  const priority = priorityFilter.value;

  let result = orders.filter(order => {
    const matchesStatus = activeFilter === 'Sve' || order.status === activeFilter;
    const matchesPriority = priority === 'Sve' || order.priority === priority;
    const haystack = [
      order.id,
      order.customerName,
      order.company,
      order.phone,
      order.email,
      order.equipmentType,
      order.model,
      order.serialNumber,
      order.location,
      order.problem,
      order.serviceNote
    ].filter(Boolean).join(' ').toLocaleLowerCase('hr-HR');
    const matchesSearch = !query || haystack.includes(query);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (sortOrders.value === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortOrders.value === 'priority') {
    result.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority) || new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return result;
}

function detailBlock(label, value, isLink = false, linkType = '') {
  if (!value) value = 'Nije navedeno';
  let content = escapeHtml(value);
  if (isLink && value !== 'Nije navedeno') {
    const href = linkType === 'tel'
      ? `tel:${String(value).replace(/[^+\d]/g, '')}`
      : `mailto:${encodeURIComponent(String(value))}`;
    content = `<a href="${href}">${escapeHtml(value)}</a>`;
  }
  return `<div class="detail"><span>${escapeHtml(label)}</span><strong>${content}</strong></div>`;
}

function renderOrders() {
  const orders = loadOrders();
  updateStats(orders);
  const visibleOrders = getVisibleOrders(orders);

  ordersList.innerHTML = '';
  const filtersActive = activeFilter !== 'Sve' || priorityFilter.value !== 'Sve' || searchInput.value.trim();
  emptyState.hidden = visibleOrders.length > 0;
  resultsInfo.textContent = orders.length
    ? `Prikazano ${visibleOrders.length} od ${orders.length} naloga`
    : '';

  if (!visibleOrders.length) {
    if (orders.length && filtersActive) {
      emptyTitle.textContent = 'Nema rezultata';
      emptyText.textContent = 'Pokušajte promijeniti pretragu ili odabrane filtre.';
    } else {
      emptyTitle.textContent = 'Još nema servisnih prijava';
      emptyText.textContent = 'Kada korisnik pošalje prijavu kvara, pojavit će se ovdje.';
    }
  }

  visibleOrders.forEach(order => {
    const article = document.createElement('article');
    article.className = 'order-card';
    article.dataset.orderId = order.id;

    const statusBadgeClass = order.status === 'Završeno' ? 'završeno' : '';
    const photoMarkup = order.photoData
      ? `<img class="order-photo" src="${escapeHtml(order.photoData)}" alt="Fotografija uz servisni nalog ${escapeHtml(order.id)}" />`
      : '';

    article.innerHTML = `
      <div class="order-summary">
        <div class="order-top">
          <div>
            <div class="order-id"><span class="status-dot ${statusClass(order.status)}"></span>${escapeHtml(order.id)}</div>
            <h3>${escapeHtml(order.equipmentType || 'UGO oprema')}</h3>
            <div class="order-meta">
              ${escapeHtml(order.customerName || 'Nepoznat korisnik')}${order.company ? ` • ${escapeHtml(order.company)}` : ''} • ${escapeHtml(order.location || 'Lokacija nije navedena')}
            </div>
          </div>
          <select class="status-select" data-action="status" aria-label="Status naloga ${escapeHtml(order.id)}">
            <option ${order.status === 'Novo' ? 'selected' : ''}>Novo</option>
            <option ${order.status === 'U obradi' ? 'selected' : ''}>U obradi</option>
            <option ${order.status === 'Završeno' ? 'selected' : ''}>Završeno</option>
          </select>
        </div>

        <div class="order-problem">${escapeHtml(order.problem || 'Opis problema nije naveden.')}</div>

        <div class="badges">
          <span class="badge ${(order.priority || 'Normalno').toLocaleLowerCase('hr-HR')}">${escapeHtml(order.priority || 'Normalno')}</span>
          <span class="badge ${statusBadgeClass}">${escapeHtml(order.status || 'Novo')}</span>
          ${order.model ? `<span class="badge">${escapeHtml(order.model)}</span>` : ''}
          <span class="badge">Termin: ${formatDate(order.preferredDate)}</span>
          <span class="badge">Zaprimljeno: ${formatCreatedAt(order.createdAt)}</span>
          ${order.photoData ? '<span class="badge">📷 Fotografija</span>' : ''}
        </div>

        <div class="order-actions">
          <div class="action-group">
            <button class="small-action" data-action="toggle" type="button">Prikaži detalje</button>
            <button class="small-action" data-action="copy" type="button">Kopiraj broj naloga</button>
          </div>
          <button class="small-action delete" data-action="delete" type="button">Obriši nalog</button>
        </div>
      </div>

      <div class="order-details">
        <div class="details-grid">
          ${detailBlock('Korisnik', order.customerName)}
          ${detailBlock('Firma / objekt', order.company)}
          ${detailBlock('Telefon', order.phone, true, 'tel')}
          ${detailBlock('E-mail', order.email, true, 'email')}
          ${detailBlock('Proizvođač / model', order.model)}
          ${detailBlock('Serijski broj', order.serialNumber)}
          ${detailBlock('Lokacija', order.location)}
          ${detailBlock('Željeni termin', formatDate(order.preferredDate))}
          ${detailBlock('Zaprimljeno', formatCreatedAt(order.createdAt))}
        </div>
        ${photoMarkup}
        <div class="service-note-wrap">
          <label for="note-${escapeHtml(order.id)}">Interna servisna bilješka</label>
          <textarea id="note-${escapeHtml(order.id)}" data-note rows="3" placeholder="npr. Potrebno ponijeti termostat...">${escapeHtml(order.serviceNote || '')}</textarea>
          <div class="note-actions">
            <button class="small-action" data-action="save-note" type="button">Spremi bilješku</button>
          </div>
        </div>
      </div>
    `;
    ordersList.appendChild(article);
  });
}

function updateOrder(orderId, updater) {
  const orders = loadOrders();
  const order = orders.find(item => item.id === orderId);
  if (!order) return false;
  updater(order);
  return saveOrders(orders);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

function resetPhoto() {
  currentPhotoData = '';
  photoInput.value = '';
  photoPreview.src = '';
  photoPreview.hidden = true;
  photoLabel.textContent = 'JPG, PNG ili WEBP do 1,5 MB';
}

photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return resetPhoto();
  if (file.size > MAX_PHOTO_SIZE) {
    resetPhoto();
    showToast('Fotografija je prevelika. Maksimalna veličina je 1,5 MB.');
    return;
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    resetPhoto();
    showToast('Odaberite JPG, PNG ili WEBP fotografiju.');
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    currentPhotoData = String(event.target.result || '');
    photoPreview.src = currentPhotoData;
    photoPreview.hidden = false;
    photoLabel.textContent = file.name;
  };
  reader.onerror = () => showToast('Fotografiju nije bilo moguće učitati.');
  reader.readAsDataURL(file);
});

form.elements.problem.addEventListener('input', event => {
  problemCount.textContent = event.target.value.length;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  const orders = loadOrders();
  const order = {
    id: makeOrderId(),
    customerName: data.customerName.trim(),
    company: data.company.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    equipmentType: data.equipmentType,
    model: data.model.trim(),
    serialNumber: data.serialNumber.trim(),
    location: data.location.trim(),
    problem: data.problem.trim(),
    priority: data.priority,
    preferredDate: data.preferredDate,
    status: 'Novo',
    serviceNote: '',
    photoData: currentPhotoData,
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  let saved = saveOrders(orders);
  let photoSkipped = false;

  if (!saved && order.photoData) {
    order.photoData = '';
    photoSkipped = true;
    saved = saveOrders(orders);
  }

  if (!saved) {
    showToast('Nema dovoljno prostora za spremanje prijave u ovom pregledniku.');
    return;
  }

  form.reset();
  problemCount.textContent = '0';
  resetPhoto();
  updateStats(orders);
  showToast(photoSkipped
    ? `Prijava ${order.id} je spremljena bez fotografije zbog prostora.`
    : `Prijava ${order.id} je uspješno spremljena.`);
  showView('orders');
});

ordersList.addEventListener('change', event => {
  const card = event.target.closest('.order-card');
  if (!card || event.target.dataset.action !== 'status') return;
  const status = event.target.value;
  const saved = updateOrder(card.dataset.orderId, order => { order.status = status; });
  if (!saved) return showToast('Promjenu nije bilo moguće spremiti.');
  showToast(`Status naloga ${card.dataset.orderId} promijenjen je u „${status}”.`);
  renderOrders();
});

ordersList.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  const card = event.target.closest('.order-card');
  if (!button || !card || button.tagName === 'SELECT') return;

  const orderId = card.dataset.orderId;
  const action = button.dataset.action;

  if (action === 'toggle') {
    const expanded = card.classList.toggle('expanded');
    button.textContent = expanded ? 'Sakrij detalje' : 'Prikaži detalje';
    return;
  }

  if (action === 'copy') {
    const copied = await copyText(orderId);
    showToast(copied ? `Broj naloga ${orderId} je kopiran.` : 'Kopiranje nije uspjelo.');
    return;
  }

  if (action === 'save-note') {
    const note = card.querySelector('[data-note]').value.trim();
    const saved = updateOrder(orderId, order => { order.serviceNote = note; });
    showToast(saved ? 'Servisna bilješka je spremljena.' : 'Bilješku nije bilo moguće spremiti.');
    return;
  }

  if (action === 'delete') {
    const accepted = window.confirm(`Obrisati servisni nalog ${orderId}?`);
    if (!accepted) return;
    const orders = loadOrders().filter(order => order.id !== orderId);
    if (!saveOrders(orders)) return showToast('Nalog nije bilo moguće obrisati.');
    renderOrders();
    showToast(`Nalog ${orderId} je obrisan.`);
  }
});

tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

document.querySelectorAll('[data-go-request]').forEach(element => {
  element.addEventListener('click', event => {
    if (element.tagName === 'A') event.preventDefault();
    showView('request');
  });
});

document.querySelector('#newOrderButton').addEventListener('click', () => showView('request'));

filters.forEach(filter => {
  filter.addEventListener('click', () => {
    activeFilter = filter.dataset.filter;
    filters.forEach(item => item.classList.toggle('active', item === filter));
    renderOrders();
  });
});

searchInput.addEventListener('input', renderOrders);
priorityFilter.addEventListener('change', renderOrders);
sortOrders.addEventListener('change', renderOrders);

clearOrders.addEventListener('click', () => {
  if (!loadOrders().length) return showToast('Nema podataka za brisanje.');
  const accepted = window.confirm('Želite li obrisati sve lokalno spremljene servisne prijave?');
  if (!accepted) return;
  localStorage.removeItem(STORAGE_KEY);
  renderOrders();
  showToast('Demo servisne prijave su obrisane.');
});

const dateInput = form.elements.preferredDate;
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
dateInput.min = localToday;

renderOrders();
