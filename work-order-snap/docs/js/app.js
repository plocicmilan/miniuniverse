// app.js — Glavni controller (routing, state, event binding)
// TODO: Implementirati screen logiku kad se krene sa UI fazom

import { save, getAll, getById, deleteById, nextJobNumber } from './db.js';
import { processFiles } from './camera.js';
import { getLocation } from './gps.js';
import { exportWorkOrderPDF } from './pdf.js';

// ── State ────────────────────────────────────────────────
const state = {
  screen: 'home',       // home | new | list | detail
  currentRecord: null,
  pendingPhotos: [],    // base64 array za trenutni nalog u izradi
  locationData: null    // { lat, lng, address }
};

// ── Screen routing ───────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${name}`)?.classList.remove('hidden');
  state.screen = name;
}

// ── Novi nalog — init ────────────────────────────────────
async function initNewOrder() {
  showScreen('new');

  // Pocni GPS fetch odmah (async, ne blokira UI)
  state.locationData = null;
  const tradeEl = document.getElementById('f-trade');
  const jobNumEl = document.getElementById('f-job-number');

  if (tradeEl && jobNumEl) {
    tradeEl.addEventListener('change', async () => {
      jobNumEl.value = await nextJobNumber(tradeEl.value);
    });
    // Default trade init
    jobNumEl.value = await nextJobNumber(tradeEl.value);
  }

  // Fetch lokacija u pozadini
  getLocation().then(loc => {
    state.locationData = loc;
    const addrEl = document.getElementById('f-address');
    if (addrEl && loc) addrEl.value = loc.address;
  });

  // Datum i vreme
  const now = new Date();
  const dateEl = document.getElementById('f-date');
  const timeEl = document.getElementById('f-time');
  if (dateEl) dateEl.value = now.toISOString().slice(0, 10);
  if (timeEl) timeEl.value = now.toTimeString().slice(0, 5);

  state.pendingPhotos = [];
  renderPhotoPreview([]);
}

// ── Foto preview ─────────────────────────────────────────
function renderPhotoPreview(photos) {
  const container = document.getElementById('photo-preview');
  if (!container) return;
  container.innerHTML = photos.map((p, i) =>
    `<img src="${p}" alt="photo ${i+1}" class="thumb" data-idx="${i}">`
  ).join('');
}

// ── Sacuvaj nalog ────────────────────────────────────────
async function saveOrder() {
  const trade    = document.getElementById('f-trade')?.value;
  const jobNum   = document.getElementById('f-job-number')?.value;
  const date     = document.getElementById('f-date')?.value;
  const time     = document.getElementById('f-time')?.value;
  const customer = document.getElementById('f-customer')?.value?.trim();
  const address  = document.getElementById('f-address')?.value?.trim();
  const desc     = document.getElementById('f-description')?.value?.trim();

  if (!desc) { alert('Please add a description of work done.'); return; }

  const record = {
    trade,
    job_number: jobNum,
    date,
    time,
    customer_name: customer,
    address: address || (state.locationData ? state.locationData.address : ''),
    lat:  state.locationData?.lat || null,
    lng:  state.locationData?.lng || null,
    description: desc,
    photos: state.pendingPhotos
  };

  await save(record);
  showScreen('list');
  await renderList();
}

// ── Lista naloga ─────────────────────────────────────────
async function renderList() {
  showScreen('list');
  const records = await getAll();
  const container = document.getElementById('list-container');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = '<p class="empty">No work orders yet. Tap + to add one.</p>';
    return;
  }

  container.innerHTML = records.map(r => `
    <div class="list-item" data-id="${r.id}">
      <div class="list-thumb">
        ${r.photos[0] ? `<img src="${r.photos[0]}" alt="">` : '<div class="no-photo"></div>'}
      </div>
      <div class="list-info">
        <strong>${r.job_number}</strong>
        <span>${r.date} ${r.time}</span>
        <span class="address">${r.address || 'No location'}</span>
      </div>
      <span class="trade-badge trade-${r.trade}">${r.trade.slice(0,3).toUpperCase()}</span>
    </div>
  `).join('');

  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', () => showDetail(Number(el.dataset.id)));
  });
}

// ── Detalji naloga ───────────────────────────────────────
async function showDetail(id) {
  const r = await getById(id);
  if (!r) return;
  state.currentRecord = r;
  showScreen('detail');

  document.getElementById('detail-job-number').textContent = r.job_number;
  document.getElementById('detail-trade').textContent      = r.trade;
  document.getElementById('detail-date').textContent       = `${r.date}  ${r.time}`;
  document.getElementById('detail-customer').textContent   = r.customer_name || '—';
  document.getElementById('detail-address').textContent    = r.address || '—';
  document.getElementById('detail-desc').textContent       = r.description;

  const gallery = document.getElementById('detail-gallery');
  if (gallery) {
    gallery.innerHTML = r.photos.map(p =>
      `<img src="${p}" class="gallery-img" alt="work photo">`
    ).join('');
  }
}

// ── Event listeners (postavljaju se jednom pri loadu) ────
function bindEvents() {
  // Dugme: novi nalog
  document.getElementById('btn-new-order')?.addEventListener('click', initNewOrder);

  // Dugme: lista
  document.getElementById('btn-list')?.addEventListener('click', async () => {
    await renderList();
  });

  // Dugme: sacuvaj nalog
  document.getElementById('btn-save-order')?.addEventListener('click', saveOrder);

  // Dugme: odustani
  document.querySelectorAll('.btn-back').forEach(btn =>
    btn.addEventListener('click', () => showScreen('home'))
  );

  // Foto input
  document.getElementById('photo-input')?.addEventListener('change', async (e) => {
    const compressed = await processFiles(e.target.files);
    state.pendingPhotos.push(...compressed);
    renderPhotoPreview(state.pendingPhotos);
    e.target.value = ''; // reset input da dozvoli ponovni upload iste slike
  });

  // Export PDF
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    if (state.currentRecord) exportWorkOrderPDF(state.currentRecord);
  });

  // Obrisi nalog
  document.getElementById('btn-delete')?.addEventListener('click', async () => {
    if (!state.currentRecord) return;
    if (confirm('Delete this work order?')) {
      await deleteById(state.currentRecord.id);
      showScreen('home');
    }
  });
}

// ── Init ─────────────────────────────────────────────────
async function init() {
  // Registruj service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  bindEvents();
  showScreen('home');
}

document.addEventListener('DOMContentLoaded', init);
