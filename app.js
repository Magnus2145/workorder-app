const STORAGE_KEY = 'ugo-service-orders-v1';

const form = document.querySelector('#serviceForm');
const tabs = document.querySelectorAll('.nav-tab');
const views = {
  request: document.querySelector('#requestView'),
  orders: document.querySelector('#ordersView')
};
const ordersList = document.querySelector('#ordersList');
const emptyState = document.querySelector('#emptyState');
const orderCount = document.querySelector('#orderCount');
const toast = document.querySelector('#toast');
const clearOrders = document.querySelector('#clearOrders');
const filters = document.querySelectorAll('.filter');
let activeFilter = 'Sve';

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
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
  window.setTimeout(() => toast.classList.remove('show'), 2600);
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
  return new Intl.DateTimeFormat('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
}

function makeOrderId() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(100 + Math.random() * 900);
  return `UGO-${date}-${rand}`;
}

function renderOrders() {
  const orders = loadOrders();
  orderCount.textContent = orders.length;

  const visibleOrders = activeFilter === 'Sve'
    ? orders
    : orders.filter(order => order.status === activeFilter);

  ordersList.innerHTML = '';
  emptyState.hidden = visibleOrders.length > 0;

  visibleOrders.forEach(order => {
    const article = document.createElement('article');
    article.className = 'order-card';
    article.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-id">${escapeHtml(order.id)}</div>
          <h3>${escapeHtml(order.equipmentType)}</h3>
          <div class="order-meta">
            ${escapeHtml(order.customerName)}${order.company ? ` • ${escapeHtml(order.company)}` : ''} • ${escapeHtml(order.location)}
          </div>
        </div>
        <select class="status-select" data-status-id="${escapeHtml(order.id)}" aria-label="Status naloga ${escapeHtml(order.id)}">
          <option ${order.status === 'Novo' ? 'selected' : ''}>Novo</option>
          <option ${order.status === 'U obradi' ? 'selected' : ''}>U obradi</option>
          <option ${order.status === 'Završeno' ? 'selected' : ''}>Završeno</option>
        </select>
      </div>
      <div class="order-problem">${escapeHtml(order.problem)}</div>
      <div class="badges">
        <span class="badge ${order.priority.toLowerCase()}">${escapeHtml(order.priority)}</span>
        ${order.model ? `<span class="badge">${escapeHtml(order.model)}</span>` : ''}
        ${order.serialNumber ? `<span class="badge">S/N: ${escapeHtml(order.serialNumber)}</span>` : ''}
        <span class="badge">Termin: ${formatDate(order.preferredDate)}</span>
        <span class="badge">${escapeHtml(order.phone)}</span>
        <span class="badge">Zaprimljeno: ${formatCreatedAt(order.createdAt)}</span>
      </div>
    `;
    ordersList.appendChild(article);
  });

  document.querySelectorAll('[data-status-id]').forEach(select => {
    select.addEventListener('change', event => {
      const orders = loadOrders();
      const order = orders.find(item => item.id === event.target.dataset.statusId);
      if (!order) return;
      order.status = event.target.value;
      saveOrders(orders);
      showToast(`Status naloga ${order.id} promijenjen je u „${order.status}”.`);
      renderOrders();
    });
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
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
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  saveOrders(orders);
  form.reset();
  orderCount.textContent = orders.length;
  showToast(`Prijava ${order.id} je uspješno spremljena.`);
  showView('orders');
});

tabs.forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));

document.querySelectorAll('[data-go-request]').forEach(button => {
  button.addEventListener('click', () => showView('request'));
});

filters.forEach(filter => {
  filter.addEventListener('click', () => {
    activeFilter = filter.dataset.filter;
    filters.forEach(item => item.classList.toggle('active', item === filter));
    renderOrders();
  });
});

clearOrders.addEventListener('click', () => {
  if (!loadOrders().length) return showToast('Nema podataka za brisanje.');
  const accepted = window.confirm('Želite li obrisati sve lokalno spremljene servisne prijave?');
  if (!accepted) return;
  localStorage.removeItem(STORAGE_KEY);
  renderOrders();
  showToast('Demo servisne prijave su obrisane.');
});

const dateInput = form.elements.preferredDate;
dateInput.min = new Date().toISOString().split('T')[0];

renderOrders();
