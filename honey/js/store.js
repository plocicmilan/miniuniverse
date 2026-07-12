/* Honey Toolbox — lokalna baza (IndexedDB) + settings (localStorage) */
"use strict";

var HStore = (function () {
  var DB_NAME = "honey-toolbox";
  var DB_VERSION = 6;
  var _db = null;

  var STORES = {
    hives:         { keyPath: "id", indexes: ["status", "apiary_id"] },
    inspections:   { keyPath: "id", indexes: ["hive_id", "date"] },
    extractions:   { keyPath: "id", indexes: ["date"] },
    inventory:     { keyPath: "id", indexes: ["honey_type"] },
    sales:         { keyPath: "id", indexes: ["date"] },
    stocks:        { keyPath: "id", indexes: ["honey_type", "date"] },
    apiaries:      { keyPath: "id", indexes: [] },
    produce:       { keyPath: "id", indexes: ["product_type", "date"] },
    treatments:    { keyPath: "id", indexes: ["hive_id", "start_date"] },
    swarms:        { keyPath: "id", indexes: ["hive_id", "date"] },
    feedings:      { keyPath: "id", indexes: ["date"] },
    varroa_checks: { keyPath: "id", indexes: ["hive_id", "date"] },
    nuclei:        { keyPath: "id", indexes: ["date"] },
    queen_rearing: { keyPath: "id", indexes: ["grafting_date"] },
    winterization: { keyPath: "id", indexes: ["year"] }
  };

  function open() {
    return new Promise(function (res, rej) {
      if (_db) { res(_db); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        Object.keys(STORES).forEach(function (name) {
          if (d.objectStoreNames.contains(name)) return;
          var s = d.createObjectStore(name, { keyPath: STORES[name].keyPath });
          STORES[name].indexes.forEach(function (idx) { s.createIndex(idx, idx); });
        });
      };
      req.onsuccess = function (e) { _db = e.target.result; res(_db); };
      req.onerror   = function (e) { rej(e.target.error); };
    });
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function all(store) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var req = d.transaction(store, "readonly").objectStore(store).getAll();
        req.onsuccess = function () { res(req.result); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  function get(store, id) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var req = d.transaction(store, "readonly").objectStore(store).get(id);
        req.onsuccess = function () { res(req.result); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  function save(store, obj) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        if (!obj.id) obj.id = uid();
        if (!obj.created_at) obj.created_at = new Date().toISOString();
        obj.updated_at = new Date().toISOString();
        var req = d.transaction(store, "readwrite").objectStore(store).put(obj);
        req.onsuccess = function () { res(obj); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  function del(store, id) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var req = d.transaction(store, "readwrite").objectStore(store).delete(id);
        req.onsuccess = function () { res(); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  function clear(store) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var req = d.transaction(store, "readwrite").objectStore(store).clear();
        req.onsuccess = function () { res(); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  function bulkSave(store, items) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var tx = d.transaction(store, "readwrite");
        var os = tx.objectStore(store);
        items.forEach(function (item) { os.put(item); });
        tx.oncomplete = function () { res(); };
        tx.onerror    = function () { rej(tx.error); };
      });
    });
  }

  function byIndex(store, idx, val) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var req = d.transaction(store, "readonly").objectStore(store).index(idx).getAll(val);
        req.onsuccess = function () { res(req.result); };
        req.onerror   = function () { rej(req.error); };
      });
    });
  }

  var settings = {
    get: function (k, def) {
      try { var v = JSON.parse(localStorage.getItem("ht_" + k)); return v !== null ? v : def; }
      catch (e) { return def; }
    },
    set: function (k, v) { localStorage.setItem("ht_" + k, JSON.stringify(v)); }
  };

  return { uid: uid, all: all, get: get, save: save, del: del, clear: clear, bulkSave: bulkSave, byIndex: byIndex, settings: settings };
})();
