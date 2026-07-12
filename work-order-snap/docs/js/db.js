// db.js — IndexedDB wrapper za Work Order Snap
// Sve operacije nad lokalnom bazom naloga

const DB_NAME = 'WorkOrderSnapDB';
const DB_VERSION = 1;
const STORE = 'work_orders';

const TRADE_PREFIXES = {
  plumber:     'PLM',
  hvac:        'HVC',
  electrician: 'ELC',
  roofer:      'ROF',
  handyman:    'HMN'
};

let _db = null;

async function openDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('trade', 'trade', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = e => reject(e.target.error);
  });
}

// Generiše sledeći job number za dati zanat (PLM-001, PLM-002, ...)
async function nextJobNumber(trade) {
  const all = await getAll();
  const prefix = TRADE_PREFIXES[trade] || 'JOB';
  const count = all.filter(r => r.trade === trade).length + 1;
  return `${prefix}-${String(count).padStart(3, '0')}`;
}

async function save(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add({
      ...record,
      created_at: Date.now()
    });
    req.onsuccess = e => resolve(e.target.result); // vraca novi id
    req.onerror = e => reject(e.target.error);
  });
}

async function getAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = e => resolve(e.target.result.reverse()); // najnoviji prvi
    req.onerror = e => reject(e.target.error);
  });
}

async function getById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function deleteById(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });
}

async function count() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).count();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export { save, getAll, getById, deleteById, count, nextJobNumber, TRADE_PREFIXES };
