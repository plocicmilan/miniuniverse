/* Honey Toolbox — glavna aplikacija */
"use strict";

var App = {
  _screen: "home",
  _params: {},
  _hives: [],
  _inspections: [],
  _extractions: [],
  _inventory: [],
  _sales: [],
  _cfg: null
};

/* ─── POMOĆNICI ─────────────────────────────────────────── */

function esc(s) {
  return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmtDate(iso) {
  if (!iso) return "—";
  var d = new Date(iso);
  return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + ".";
}

function fmtNum(n) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString("sr-RS");
}

function daysSince(isoDateStr) {
  if (!isoDateStr) return null;
  var then = new Date(isoDateStr).setHours(0, 0, 0, 0);
  var now  = new Date().setHours(0, 0, 0, 0);
  return Math.round((now - then) / 86400000);
}

function hiveLabel(id) {
  var h = App._hives.find(function (x) { return x.id === id; });
  return h ? esc(h.label) : "—";
}

function statusBadge(status) {
  var map = { active: ["Aktivna","badge-ok"], weak: ["Slaba","badge-warn"], dead: ["Ugašena","badge-danger"], sold: ["Prodata","badge-muted"] };
  var s = map[status] || [status, "badge-muted"];
  return '<span class="badge ' + s[1] + '">' + s[0] + '</span>';
}

function strengthDots(n) {
  var s = "";
  for (var i = 1; i <= 5; i++) s += '<span class="dot' + (i <= n ? " dot-on" : "") + '"></span>';
  return '<span class="dots">' + s + '</span>';
}

/* ─── SCREENS ────────────────────────────────────────────── */

var SCREENS = {};

SCREENS.home = function () {
  var hives      = App._hives.filter(function (h) { return h.status === "active"; });
  var allInsp    = App._inspections;
  var allExt     = App._extractions;
  var thisSeason = new Date().getFullYear();

  // Zadnja inspekcija ukupno
  var lastInsp = allInsp.slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; })[0];
  var lastInspDays = lastInsp ? daysSince(lastInsp.date) : null;

  // Prinos ove sezone
  var seasonKg = allExt
    .filter(function (e) { return new Date(e.date).getFullYear() === thisSeason; })
    .reduce(function (sum, e) { return sum + (Number(e.kg) || 0); }, 0);

  // Hives ne pregledane >7 dana
  var alertHives = hives.filter(function (h) {
    var last = allInsp.filter(function (i) { return i.hive_id === h.id; })
      .sort(function (a, b) { return b.date > a.date ? 1 : -1; })[0];
    return !last || daysSince(last.date) > 7;
  });

  var alertHtml = "";
  if (alertHives.length) {
    alertHtml = '<div class="alert-box"><b>⚠ Nije pregledano >7 dana (' + alertHives.length + ')</b><ul>' +
      alertHives.slice(0, 5).map(function (h) {
        var last = allInsp.filter(function (i) { return i.hive_id === h.id; })
          .sort(function (a, b) { return b.date > a.date ? 1 : -1; })[0];
        var info = last ? daysSince(last.date) + " dana" : "nikad";
        return '<li onclick="GT.go(\'hive_detail\',{id:\'' + h.id + '\'})" style="cursor:pointer">' +
          esc(h.label) + ' — ' + info + '</li>';
      }).join("") + '</ul></div>';
  }

  var cfg = App._cfg || {};
  var name = HStore.settings.get("apiary_name", cfg.name || "Honey Toolbox");

  return '<div class="screen-home">' +
    '<h1 class="home-title">🍯 ' + esc(name) + '</h1>' +
    '<div class="stat-grid">' +
      statTile("🐝", "Košnice", hives.length, "") +
      statTile("📋", "Zadnja inspekcija", lastInspDays !== null ? lastInspDays + " dana" : "—", "") +
      statTile("⚖️", "Prinos " + thisSeason + ".", seasonKg.toFixed(1) + " kg", "") +
      statTile("🏪", "Tezga", "→", "onclick=\"GT.nav('tezga')\"") +
    '</div>' +
    alertHtml +
    '<div class="home-actions">' +
      '<button class="btn btn-primary" onclick="GT.go(\'inspection_form\',{})">➕ Nova inspekcija</button>' +
      '<button class="btn btn-secondary" onclick="GT.go(\'extraction_form\',{})">🍯 Nova berba</button>' +
    '</div>' +
  '</div>';
};

function statTile(icon, label, val, extra) {
  return '<div class="stat-tile" ' + extra + '>' +
    '<span class="tile-icon">' + icon + '</span>' +
    '<span class="tile-val">' + val + '</span>' +
    '<span class="tile-label">' + label + '</span>' +
  '</div>';
}

SCREENS.hives = function () {
  if (!App._hives.length) {
    return '<div class="empty-state"><p>Nema unetih košnica.</p>' +
      '<button class="btn btn-primary" onclick="GT.go(\'hive_form\',{})">+ Dodaj prvu košnicu</button></div>';
  }
  var sorted = App._hives.slice().sort(function (a, b) { return a.label > b.label ? 1 : -1; });
  return '<div>' +
    sorted.map(function (h) {
      var lastInsp = App._inspections.filter(function (i) { return i.hive_id === h.id; })
        .sort(function (a, b) { return b.date > a.date ? 1 : -1; })[0];
      var lastStr = lastInsp ? fmtDate(lastInsp.date) : "nikad";
      var days = lastInsp ? daysSince(lastInsp.date) : null;
      var daysBadge = days !== null && days > 7 ? '<span class="badge badge-warn">' + days + " d</span>" : "";
      return '<div class="card hive-card" onclick="GT.go(\'hive_detail\',{id:\'' + h.id + '\'})">' +
        '<div class="hive-header">' +
          '<span class="hive-label">' + esc(h.label) + '</span>' +
          statusBadge(h.status) +
        '</div>' +
        '<div class="muted">' + esc(h.location || "") + (h.hive_type ? ' · ' + esc(h.hive_type) : '') +
          (h.queen_year ? ' · matica ' + h.queen_year : '') + '</div>' +
        '<div class="hive-footer">Zadnja inspekcija: ' + lastStr + ' ' + daysBadge + '</div>' +
      '</div>';
    }).join("") +
    '<button class="fab" onclick="GT.go(\'hive_form\',{})">+</button>' +
  '</div>';
};

SCREENS.hive_detail = function (p) {
  var h = App._hives.find(function (x) { return x.id === p.id; });
  if (!h) return '<div class="empty-state">Košnica nije pronađena.</div>';

  var insp = App._inspections.filter(function (i) { return i.hive_id === h.id; })
    .sort(function (a, b) { return b.date > a.date ? 1 : -1; });
  var extr = App._extractions.filter(function (e) { return (e.hive_ids || []).indexOf(h.id) >= 0; })
    .sort(function (a, b) { return b.date > a.date ? 1 : -1; });

  var broodMap = { ok: "✅ OK", poor: "⚠ Loše", none: "❌ Nema" };
  var storesMap = { good: "✅ Dovoljno", low: "⚠ Malo", empty: "❌ Nema" };

  var inspHtml = insp.length ? insp.map(function (i) {
    return '<div class="hist-row">' +
      '<div class="hist-date">' + fmtDate(i.date) + '</div>' +
      '<div class="hist-body">' +
        '<span>Matica: ' + (i.queen_seen ? "✅" : "❌") + '</span> ' +
        '<span>Leglo: ' + (broodMap[i.brood] || i.brood) + '</span> ' +
        '<span>Snaga: ' + strengthDots(i.strength) + '</span><br>' +
        (i.honey_stores ? 'Hrana: ' + (storesMap[i.honey_stores] || i.honey_stores) + '<br>' : '') +
        (i.treatment ? '<em>Tretman: ' + esc(i.treatment) + '</em><br>' : '') +
        (i.notes ? '<small class="muted">' + esc(i.notes) + '</small>' : '') +
      '</div>' +
    '</div>';
  }).join("") : '<p class="muted">Nema inspekcija.</p>';

  var extrHtml = extr.length ? extr.map(function (e) {
    return '<div class="hist-row">' +
      '<div class="hist-date">' + fmtDate(e.date) + '</div>' +
      '<div class="hist-body"><b>' + esc(e.honey_type || "Med") + '</b> — ' + e.kg + ' kg' +
        (e.price_per_kg ? ' · ' + fmtNum(e.price_per_kg) + ' ' + (e.currency || "RSD") + '/kg' : '') +
        (e.notes ? '<br><small class="muted">' + esc(e.notes) + '</small>' : '') +
      '</div>' +
    '</div>';
  }).join("") : '<p class="muted">Nema berbi za ovu košnicu.</p>';

  return '<div>' +
    '<div class="card">' +
      '<div class="hive-header">' +
        '<span class="hive-label" style="font-size:1.3rem">' + esc(h.label) + '</span>' +
        statusBadge(h.status) +
      '</div>' +
      (h.location ? '<div class="muted">📍 ' + esc(h.location) + '</div>' : '') +
      (h.hive_type ? '<div class="muted">Tip: ' + esc(h.hive_type) + '</div>' : '') +
      (h.queen_year ? '<div class="muted">Matica iz: ' + h.queen_year + '</div>' : '') +
      (h.notes ? '<div class="notes-text">' + esc(h.notes) + '</div>' : '') +
      '<div class="btn-row mt8">' +
        '<button class="btn btn-primary" onclick="GT.go(\'inspection_form\',{hive_id:\'' + h.id + '\'})">+ Inspekcija</button>' +
        '<button class="btn btn-secondary" onclick="GT.go(\'hive_form\',{id:\'' + h.id + '\'})">Izmeni</button>' +
      '</div>' +
    '</div>' +
    '<h2 class="section-title">Inspekcije</h2>' + inspHtml +
    '<h2 class="section-title">Berba</h2>' + extrHtml +
  '</div>';
};

SCREENS.hive_form = function (p) {
  var h = p.id ? App._hives.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var htypes = (cfg.hive_types || ["LR","DB","Drugi"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.hive_type === t ? " selected" : "") + '>' + esc(t) + '</option>';
  }).join("");
  var statuses = [["active","Aktivna"],["weak","Slaba"],["dead","Ugašena"],["sold","Prodata"]];
  var statusOpts = statuses.map(function (s) {
    return '<option value="' + s[0] + '"' + ((h.status || "active") === s[0] ? " selected" : "") + '>' + s[1] + '</option>';
  }).join("");

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? "Izmeni košnicu" : "Nova košnica") + '</h2>' +
    (h.id ? '<input type="hidden" id="hf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Oznaka*</label>' +
    '<input id="hf_label" type="text" placeholder="npr. K-01" value="' + esc(h.label || "") + '">' +
    '<label>Lokacija</label>' +
    '<input id="hf_location" type="text" placeholder="npr. Pčelinjak, bašta..." value="' + esc(h.location || "") + '">' +
    '<label>Tip košnice</label>' +
    '<select id="hf_type"><option value="">— izaberi —</option>' + htypes + '</select>' +
    '<label>Godina matice</label>' +
    '<input id="hf_queen" type="number" min="2000" max="2099" placeholder="npr. 2024" value="' + esc(h.queen_year || "") + '">' +
    '<label>Status</label>' +
    '<select id="hf_status">' + statusOpts + '</select>' +
    '<label>Napomena</label>' +
    '<textarea id="hf_notes" rows="3">' + esc(h.notes || "") + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveHive()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteHive(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.inspection_form = function (p) {
  var hiveOpts = App._hives.filter(function (h) { return h.status === "active"; }).map(function (h) {
    return '<option value="' + h.id + '"' + (p.hive_id === h.id ? " selected" : "") + '>' + esc(h.label) + '</option>';
  }).join("");

  return '<div class="form-screen">' +
    '<h2>Nova inspekcija</h2>' +
    '<label>Košnica*</label>' +
    '<select id="if_hive"><option value="">— izaberi —</option>' + hiveOpts + '</select>' +
    '<label>Datum*</label>' +
    '<input id="if_date" type="date" value="' + new Date().toISOString().slice(0, 10) + '">' +
    '<label>Matica viđena?</label>' +
    '<div class="toggle-row">' +
      '<button class="toggle-btn active" id="if_queen_y" onclick="GT.toggleQueen(true)">✅ Da</button>' +
      '<button class="toggle-btn" id="if_queen_n" onclick="GT.toggleQueen(false)">❌ Nije viđena</button>' +
    '</div>' +
    '<input type="hidden" id="if_queen_val" value="true">' +
    '<label>Stanje legla</label>' +
    '<select id="if_brood">' +
      '<option value="ok">✅ OK</option>' +
      '<option value="poor">⚠ Loše</option>' +
      '<option value="none">❌ Nema</option>' +
    '</select>' +
    '<label>Snaga pčela (1–5)</label>' +
    '<div class="strength-row" id="if_strength_btns">' +
      [1,2,3,4,5].map(function (n) {
        return '<button class="strength-btn' + (n === 3 ? " sel" : "") + '" onclick="GT.setStrength(' + n + ')" data-val="' + n + '">' + n + '</button>';
      }).join("") +
    '</div>' +
    '<input type="hidden" id="if_strength" value="3">' +
    '<label>Zalihe hrane</label>' +
    '<select id="if_stores">' +
      '<option value="good">✅ Dovoljno</option>' +
      '<option value="low">⚠ Malo</option>' +
      '<option value="empty">❌ Nema</option>' +
    '</select>' +
    '<label>Varoa (broj na 100 pčela, opciono)</label>' +
    '<input id="if_varroa" type="number" min="0" max="100" placeholder="npr. 2">' +
    '<label>Tretman (opciono)</label>' +
    '<input id="if_treatment" type="text" placeholder="npr. Apivar, Oxalic acid...">' +
    '<label>Napomena</label>' +
    '<textarea id="if_notes" rows="3" placeholder="Slobodne napomene..."></textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveInspection()">Sačuvaj</button>' +
    '</div>' +
  '</div>';
};

SCREENS.extractions = function () {
  var extr = App._extractions.slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
  var thisSeason = new Date().getFullYear();
  var seasonKg = extr.filter(function (e) { return new Date(e.date).getFullYear() === thisSeason; })
    .reduce(function (sum, e) { return sum + (Number(e.kg) || 0); }, 0);
  var totalKg = extr.reduce(function (sum, e) { return sum + (Number(e.kg) || 0); }, 0);

  return '<div>' +
    '<div class="card stat-summary">' +
      '<span>' + thisSeason + '. — <b>' + seasonKg.toFixed(1) + ' kg</b></span>' +
      '<span class="muted">Ukupno — ' + totalKg.toFixed(1) + ' kg</span>' +
    '</div>' +
    (extr.length ? extr.map(function (e) {
      var hiveLabels = (e.hive_ids || []).map(hiveLabel).join(", ");
      return '<div class="card">' +
        '<div class="row-between">' +
          '<b>' + esc(e.honey_type || "Med") + '</b>' +
          '<span class="badge badge-ok">' + e.kg + ' kg</span>' +
        '</div>' +
        '<div class="muted">' + fmtDate(e.date) + (hiveLabels ? ' · ' + hiveLabels : '') + '</div>' +
        (e.price_per_kg ? '<div class="muted">Cena: ' + fmtNum(e.price_per_kg) + ' ' + (e.currency || "RSD") + '/kg = ' +
          fmtNum(Math.round(e.kg * e.price_per_kg)) + ' ' + (e.currency || "RSD") + '</div>' : '') +
        (e.notes ? '<div class="notes-text muted">' + esc(e.notes) + '</div>' : '') +
      '</div>';
    }).join("") : '<p class="muted">Nema unetih berbi.</p>') +
    '<button class="fab" onclick="GT.go(\'extraction_form\',{})">+</button>' +
  '</div>';
};

SCREENS.extraction_form = function (p) {
  var cfg = App._cfg || {};
  var htypes = (cfg.honey_types || ["Livadski","Bagreni","Suncokretov","Mešani","Drugi"]).map(function (t) {
    return '<option value="' + esc(t) + '">' + esc(t) + '</option>';
  }).join("");
  var hiveChecks = App._hives.filter(function (h) { return h.status === "active"; }).map(function (h) {
    return '<label class="check-label"><input type="checkbox" class="ef_hive" value="' + h.id + '"> ' + esc(h.label) + '</label>';
  }).join("");

  return '<div class="form-screen">' +
    '<h2>Nova berba</h2>' +
    '<label>Datum*</label>' +
    '<input id="ef_date" type="date" value="' + new Date().toISOString().slice(0, 10) + '">' +
    '<label>Tip meda*</label>' +
    '<select id="ef_type"><option value="">— izaberi —</option>' + htypes + '</select>' +
    '<label>Kilogrami*</label>' +
    '<input id="ef_kg" type="number" step="0.1" min="0" placeholder="npr. 45.5">' +
    '<label>Cena po kg (opciono)</label>' +
    '<div class="input-row">' +
      '<input id="ef_price" type="number" step="10" min="0" placeholder="npr. 1200" style="flex:1">' +
      '<span class="input-suffix">RSD/kg</span>' +
    '</div>' +
    (hiveChecks ? '<label>Košnice (opciono)</label><div class="check-group">' + hiveChecks + '</div>' : '') +
    '<label>Napomena</label>' +
    '<textarea id="ef_notes" rows="2" placeholder="Slobodne napomene..."></textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveExtraction()">Sačuvaj</button>' +
    '</div>' +
  '</div>';
};

SCREENS.tezga = function () {
  return '<div>' +
    '<h2>Tezga</h2>' +
    '<div class="card">' +
      '<p class="muted">Inventar i prodaja — biće prošireno kada Nikola pošalje Excel fajl sa strukturom zaliha.</p>' +
      '<p class="muted">Za sada: svaka berba se evidentira u BERBA kartici.</p>' +
    '</div>' +
  '</div>';
};

SCREENS.settings = function () {
  var prof = HStore.settings.get("profile", {});
  return '<div class="form-screen">' +
    '<h2>Podešavanja</h2>' +
    '<div class="card">' +
      '<h3>Pčelinjak</h3>' +
      '<label>Naziv</label>' +
      '<input id="s_apiary" type="text" placeholder="npr. Moj pčelinjak" value="' + esc(prof.apiary || "") + '">' +
      '<label>Vlasnik</label>' +
      '<input id="s_name" type="text" placeholder="Ime i prezime" value="' + esc(prof.name || "") + '">' +
      '<label>Telefon</label>' +
      '<input id="s_phone" type="tel" placeholder="+381..." value="' + esc(prof.phone || "") + '">' +
      '<label>Lokacija</label>' +
      '<input id="s_loc" type="text" placeholder="Grad, adresa..." value="' + esc(prof.location || "") + '">' +
      '<button class="btn btn-primary mt8" onclick="GT.saveSettings()">Sačuvaj</button>' +
    '</div>' +
    '<div class="card mt8">' +
      '<h3>Export</h3>' +
      '<button class="btn btn-secondary" disabled title="Uskoro — čeka Excel strukturu">📊 Export u Excel (uskoro)</button>' +
    '</div>' +
  '</div>';
};

/* ─── ACTIONS (GT) ──────────────────────────────────────── */

var GT = {};

GT.nav = function (screenId) {
  GT.go(screenId, {});
};

GT.go = function (screenId, params) {
  App._screen = screenId;
  App._params = params || {};
  // Reload data then render
  loadData().then(function () { renderScreen(); });
};

GT.back = function () {
  var backMap = {
    hive_detail: "hives", hive_form: "hives",
    inspection_form: "hives", extraction_form: "extractions"
  };
  GT.nav(backMap[App._screen] || "home");
};

GT.toggleQueen = function (val) {
  var el = document.getElementById("if_queen_val");
  if (el) el.value = String(val);
  var y = document.getElementById("if_queen_y");
  var n = document.getElementById("if_queen_n");
  if (y) y.className = "toggle-btn" + (val ? " active" : "");
  if (n) n.className = "toggle-btn" + (!val ? " active" : "");
};

GT.setStrength = function (val) {
  var el = document.getElementById("if_strength");
  if (el) el.value = val;
  var btns = document.querySelectorAll(".strength-btn");
  btns.forEach(function (b) {
    b.className = "strength-btn" + (parseInt(b.getAttribute("data-val")) <= val ? " sel" : "");
  });
};

GT.saveHive = function () {
  var label = (document.getElementById("hf_label") || {}).value || "";
  if (!label.trim()) { alert("Oznaka je obavezna."); return; }
  var idEl = document.getElementById("hf_id");
  var obj = {
    id:         idEl ? idEl.value : undefined,
    label:      label.trim(),
    location:   (document.getElementById("hf_location") || {}).value || "",
    hive_type:  (document.getElementById("hf_type") || {}).value || "",
    queen_year: parseInt((document.getElementById("hf_queen") || {}).value) || null,
    status:     (document.getElementById("hf_status") || {}).value || "active",
    notes:      (document.getElementById("hf_notes") || {}).value || ""
  };
  HStore.save("hives", obj).then(function () { GT.nav("hives"); });
};

GT.deleteHive = function (id) {
  if (!confirm("Obrisati košnicu? Inspekcije ostaju u bazi.")) return;
  HStore.del("hives", id).then(function () { GT.nav("hives"); });
};

GT.saveInspection = function () {
  var hive_id = (document.getElementById("if_hive") || {}).value || "";
  var date    = (document.getElementById("if_date") || {}).value || "";
  if (!hive_id) { alert("Izaberi košnicu."); return; }
  if (!date)    { alert("Unesi datum."); return; }
  var obj = {
    hive_id:      hive_id,
    date:         date,
    queen_seen:   (document.getElementById("if_queen_val") || {}).value !== "false",
    brood:        (document.getElementById("if_brood") || {}).value || "ok",
    strength:     parseInt((document.getElementById("if_strength") || {}).value) || 3,
    honey_stores: (document.getElementById("if_stores") || {}).value || "good",
    varroa:       parseFloat((document.getElementById("if_varroa") || {}).value) || null,
    treatment:    (document.getElementById("if_treatment") || {}).value || "",
    notes:        (document.getElementById("if_notes") || {}).value || ""
  };
  HStore.save("inspections", obj).then(function () {
    GT.go("hive_detail", { id: hive_id });
  });
};

GT.saveExtraction = function () {
  var date = (document.getElementById("ef_date") || {}).value || "";
  var type = (document.getElementById("ef_type") || {}).value || "";
  var kg   = parseFloat((document.getElementById("ef_kg") || {}).value) || 0;
  if (!date) { alert("Unesi datum."); return; }
  if (!type) { alert("Izaberi tip meda."); return; }
  if (!kg)   { alert("Unesi kilograme."); return; }
  var hiveIds = Array.from(document.querySelectorAll(".ef_hive:checked")).map(function (c) { return c.value; });
  var obj = {
    date:         date,
    honey_type:   type,
    kg:           kg,
    price_per_kg: parseFloat((document.getElementById("ef_price") || {}).value) || null,
    hive_ids:     hiveIds,
    currency:     "RSD",
    notes:        (document.getElementById("ef_notes") || {}).value || ""
  };
  HStore.save("extractions", obj).then(function () { GT.nav("extractions"); });
};

GT.saveSettings = function () {
  var prof = {
    apiary:   (document.getElementById("s_apiary") || {}).value || "",
    name:     (document.getElementById("s_name") || {}).value || "",
    phone:    (document.getElementById("s_phone") || {}).value || "",
    location: (document.getElementById("s_loc") || {}).value || ""
  };
  HStore.settings.set("profile", prof);
  HStore.settings.set("apiary_name", prof.apiary || "Honey Toolbox");
  alert("Sačuvano.");
};

/* ─── RENDER ─────────────────────────────────────────────── */

var NAV_TABS = [
  { id: "home",       icon: "🏠", label: "Home"    },
  { id: "hives",      icon: "🐝", label: "Košnice" },
  { id: "extractions",icon: "🍯", label: "Berba"   },
  { id: "tezga",      icon: "🏪", label: "Tezga"   },
  { id: "settings",   icon: "⚙️", label: "Podešav." }
];

var TOP_SCREEN = { home: true, hives: true, extractions: true, tezga: true, settings: true };

function renderNav() {
  var cur = App._screen;
  var mainTab = cur.split("_")[0];
  return NAV_TABS.map(function (t) {
    var active = (t.id === cur || t.id === mainTab) ? " active" : "";
    return '<button class="nav-btn' + active + '" onclick="GT.nav(\'' + t.id + '\')">' +
      '<span class="nav-icon">' + t.icon + '</span>' +
      '<span class="nav-label">' + t.label + '</span>' +
    '</button>';
  }).join("");
}

function renderHeader() {
  var titles = {
    home: null, hives: "Košnice", extractions: "Berba",
    tezga: "Tezga", settings: "Podešavanja",
    hive_detail: "Karton košnice", hive_form: "Košnica",
    inspection_form: "Inspekcija", extraction_form: "Berba"
  };
  var title = titles[App._screen];
  if (!title) return "";
  var back = !TOP_SCREEN[App._screen]
    ? '<button class="back-btn" onclick="GT.back()">←</button>'
    : '';
  return '<header class="app-header"><div>' + back + '<span class="header-title">' + title + '</span></div></header>';
}

function renderScreen() {
  var fn = SCREENS[App._screen];
  var html = fn ? fn(App._params) : '<div class="empty-state">Ekran nije pronađen.</div>';
  document.getElementById("screen").innerHTML = html;
  document.getElementById("app-header").innerHTML = renderHeader();
  document.getElementById("bottom-nav").innerHTML = renderNav();
  window.scrollTo(0, 0);
}

/* ─── DATA LOADING ───────────────────────────────────────── */

function loadData() {
  return Promise.all([
    HStore.all("hives"),
    HStore.all("inspections"),
    HStore.all("extractions"),
    HStore.all("inventory"),
    HStore.all("sales")
  ]).then(function (results) {
    App._hives       = results[0];
    App._inspections = results[1];
    App._extractions = results[2];
    App._inventory   = results[3];
    App._sales       = results[4];
  });
}

/* ─── INIT ───────────────────────────────────────────────── */

function init() {
  fetch("config/honey_v1.json").then(function (r) { return r.json(); }).then(function (cfg) {
    App._cfg = cfg;
  }).catch(function () {
    App._cfg = {};
  }).finally(function () {
    loadData().then(function () { renderScreen(); });
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function (e) { console.warn("SW:", e); });
  }
}

document.addEventListener("DOMContentLoaded", init);
