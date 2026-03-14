function makeRow(section, row = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'row';

  const item = document.createElement('input');
  item.name = `${section}_item`;
  item.placeholder = 'item';
  item.value = row.item || '';

  const qty = document.createElement('input');
  qty.name = `${section}_qty`;
  qty.placeholder = 'qty';
  qty.value = row.qty || '';

  const expires = document.createElement('input');
  expires.name = `${section}_expires`;
  expires.type = 'number';
  expires.placeholder = 'exp days';
  expires.min = '0';
  expires.step = '1';
  expires.value = Number.isInteger(row.expires_in_days) ? String(row.expires_in_days) : '';

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost';
  remove.textContent = '✕';
  remove.addEventListener('click', () => wrapper.remove());

  wrapper.append(item, qty, expires, remove);
  return wrapper;
}

function seedSection(sectionName, rows) {
  const container = document.getElementById(`${sectionName}-rows`);
  if (!container) return;

  const source = Array.isArray(rows) ? rows : [];
  if (source.length === 0) {
    container.appendChild(makeRow(sectionName));
    return;
  }

  source.forEach((row) => container.appendChild(makeRow(sectionName, row)));
}

function addRow(sectionName) {
  const container = document.getElementById(`${sectionName}-rows`);
  if (!container) return;
  container.appendChild(makeRow(sectionName));
}

(function init() {
  const intake = window.__INTAKE__ || {};
  const inventory = intake.inventory || {};

  seedSection('fridge', inventory.fridge);
  seedSection('pantry', inventory.pantry);
  seedSection('freezer', inventory.freezer);

  document.querySelectorAll('[data-add-row]').forEach((btn) => {
    btn.addEventListener('click', () => addRow(btn.dataset.addRow));
  });
})();
