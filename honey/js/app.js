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
  _stocks: [],
  _apiaries: [],
  _produce: [],
  _treatments: [],
  _swarms: [],
  _feedings: [],
  _varroa_checks: [],
  _nuclei: [],
  _queen_rearing: [],
  _winterization: [],
  _expenses: [],
  _activeApiary: "",   // "" = svi pčelinjaci
  _cfg: null,
  _filter: { honey_type: "", date_from: "", date_to: "", min_kg: "" }
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

// Returns { nextDate, daysUntil, status: "ok"|"soon"|"today"|"overdue"|"unknown" }
function inspectionSchedule(hiveId) {
  var insps = App._inspections
    .filter(function (i) { return i.hive_id === hiveId; })
    .sort(function (a, b) { return b.date > a.date ? 1 : -1; });
  var last = insps[0];
  if (!last) return { nextDate: null, daysUntil: null, status: "unknown" };

  if (last.next_inspection) {
    var daysUntil = -daysSince(last.next_inspection);
    var status = daysUntil > 3 ? "ok" : daysUntil > 0 ? "soon" : daysUntil === 0 ? "today" : "overdue";
    return { nextDate: last.next_inspection, daysUntil: daysUntil, status: status };
  }
  // Fallback: no next_inspection set — flag if >7 days since last
  var ago = daysSince(last.date);
  return { nextDate: null, daysUntil: null, status: ago > 7 ? "overdue" : "ok", ago: ago };
}

function inspBadge(sched) {
  if (sched.status === "ok")      return '<span class="badge badge-ok">za ' + sched.daysUntil + ' d</span>';
  if (sched.status === "soon")    return '<span class="badge badge-warn">za ' + sched.daysUntil + ' d</span>';
  if (sched.status === "today")   return '<span class="badge badge-warn">danas</span>';
  if (sched.status === "overdue" && sched.nextDate)
    return '<span class="badge badge-danger">kasni ' + (-sched.daysUntil) + ' d</span>';
  if (sched.status === "overdue") return '<span class="badge badge-danger">' + (sched.ago || "?") + ' d bez pregleda</span>';
  return '<span class="badge badge-muted">nije zakazano</span>';
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

var PRODUCE_TYPES = [
  { key: "vosak",   label: "Vosak",        icon: "🟡", units: ["kg","g"] },
  { key: "perga",   label: "Perga",         icon: "🟣", units: ["kg","g"] },
  { key: "propolis",label: "Propolis",      icon: "🟤", units: ["g","kg"] },
  { key: "polen",   label: "Polen",         icon: "🌼", units: ["kg","g"] },
  { key: "mleč",    label: "Matični mleč",  icon: "👑", units: ["g","kg"] },
  { key: "drugo",   label: "Drugo",         icon: "➕", units: ["g","kg","kom"] }
];

function produceLabel(key) {
  var t = PRODUCE_TYPES.find(function (x) { return x.key === key; });
  return t ? t.icon + " " + t.label : key;
}

var TREATMENT_PRODUCTS = [
  "Apivar (Amitraz traka)", "Apiguard (Timol gel)", "ApiLifeVar (Timol pločica)",
  "Thymovar (Timol)", "Oksalna kiselina (kapanje)", "Oksalna kiselina (sublimacija)",
  "Amitraz (sprej)", "Mravlja kiselina", "Drugo"
];

var SWARM_OUTCOMES = [
  { key: "caught",    label: "Uhvaćen ✅" },
  { key: "new_hive",  label: "Nova košnica 🏠" },
  { key: "sold",      label: "Prodat 💰" },
  { key: "lost",      label: "Izgubljen ❌" }
];

var ALL_STORES = ["hives","inspections","extractions","inventory","sales","stocks","apiaries","produce","treatments","swarms","feedings","varroa_checks","nuclei","queen_rearing","winterization","expenses"];

var FEED_TYPES = [
  "Šećerni sirup 1:1 (prolećni)",
  "Šećerni sirup 2:1 (jesenji)",
  "Pogačica",
  "Fondant",
  "Kandirana šećer",
  "ApiInvert",
  "Zamena za polena (protein)",
  "Med (povratni)",
  "Drugo"
];

var VARROA_METHODS = [
  "Alkoholno pranje (100 pčela)",
  "Šećerni obrizgavač (300 pčela)",
  "Lepljiva ploča (24h)",
  "Lepljiva ploča bez mreže (24h)"
];

var NUCLEUS_STATUSES = [
  { key: "active",  label: "Aktivan ✅" },
  { key: "hive",    label: "Postala košnica 🏠" },
  { key: "sold",    label: "Prodat 💰" },
  { key: "merged",  label: "Ujedinjen 🔗" },
  { key: "lost",    label: "Izgubljen ❌" }
];

function compressImage(file, cb) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var MAX = 900;
      var w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", 0.78));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

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

  // Raspored inspekcija po košnicama
  var schedules = hives.map(function (h) {
    return { hive: h, sched: inspectionSchedule(h.id) };
  });

  var overdueList = schedules.filter(function (x) { return x.sched.status === "overdue"; });
  var todayList   = schedules.filter(function (x) { return x.sched.status === "today"; });
  var soonList    = schedules.filter(function (x) { return x.sched.status === "soon"; });
  var unknownList = schedules.filter(function (x) { return x.sched.status === "unknown"; });

  var alertHtml = "";
  if (overdueList.length || todayList.length) {
    var items = overdueList.concat(todayList).map(function (x) {
      return '<li onclick="GT.go(\'hive_detail\',{id:\'' + x.hive.id + '\'})" style="cursor:pointer">' +
        esc(x.hive.label) + ' ' + inspBadge(x.sched) + '</li>';
    }).join('');
    alertHtml += '<div class="alert-box alert-danger"><b>🚨 Hitno (' + (overdueList.length + todayList.length) + ')</b><ul>' + items + '</ul></div>';
  }
  if (soonList.length) {
    var soonItems = soonList.map(function (x) {
      return '<li onclick="GT.go(\'hive_detail\',{id:\'' + x.hive.id + '\'})" style="cursor:pointer">' +
        esc(x.hive.label) + ' ' + inspBadge(x.sched) + '</li>';
    }).join('');
    alertHtml += '<div class="alert-box"><b>📋 Uskoro (' + soonList.length + ')</b><ul>' + soonItems + '</ul></div>';
  }
  if (unknownList.length) {
    var unkItems = unknownList.map(function (x) {
      return '<li onclick="GT.go(\'hive_detail\',{id:\'' + x.hive.id + '\'})" style="cursor:pointer">' +
        esc(x.hive.label) + ' — nikad pregledano</li>';
    }).join('');
    alertHtml += '<div class="alert-box"><b>❓ Bez inspekcije (' + unknownList.length + ')</b><ul>' + unkItems + '</ul></div>';
  }

  var cfg = App._cfg || {};
  var name = HStore.settings.get("apiary_name", cfg.name || "Honey Toolbox");

  // Per-apiary mini cards (samo ako ima >1 pčelinjak)
  var apiaryCardsHtml = "";
  if (App._apiaries.length > 1) {
    apiaryCardsHtml = '<div class="apiary-home-grid">' +
      App._apiaries.map(function (a) {
        var aHives = App._hives.filter(function (h) { return h.apiary_id === a.id && h.status === "active"; });
        var aKg = allExt.filter(function (e) { return new Date(e.date).getFullYear() === thisSeason; })
          .reduce(function (sum, e) {
            var cnt = (e.hive_ids || []).filter(function (hid) {
              return aHives.some(function (h) { return h.id === hid; });
            }).length;
            return sum + (cnt > 0 ? (Number(e.kg) || 0) : 0);
          }, 0);
        var aAlerts = schedules.filter(function (x) {
          return x.hive.apiary_id === a.id && (x.sched.status === "overdue" || x.sched.status === "today");
        }).length;
        return '<div class="apiary-home-card" onclick="GT.setActiveApiary(\'' + a.id + '\');GT.nav(\'hives\')">' +
          '<span class="apiary-dot" style="background:' + esc(a.color || '#f59e0b') + '"></span>' +
          '<span class="apiary-home-name">' + esc(a.name) + '</span>' +
          '<span class="apiary-home-stats">' + aHives.length + ' košnica' +
            (aKg ? ' · ' + aKg.toFixed(0) + ' kg' : '') +
            (aAlerts ? ' · <span style="color:#ef4444">⚠ ' + aAlerts + '</span>' : '') +
          '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  return '<div class="screen-home">' +
    '<h1 class="home-title">🍯 ' + esc(name) + '</h1>' +
    '<div class="stat-grid">' +
      statTile("🐝", "Košnice", hives.length, "") +
      statTile("📋", "Zadnja inspekcija", lastInspDays !== null ? lastInspDays + " dana" : "—", "") +
      statTile("⚖️", "Prinos " + thisSeason + ".", seasonKg.toFixed(1) + " kg", "") +
      statTile("🏪", "Tezga", "→", "onclick=\"GT.nav('tezga')\"") +
    '</div>' +
    apiaryCardsHtml +
    alertHtml +
    '<div class="home-actions">' +
      '<button class="btn btn-primary" onclick="GT.go(\'inspection_form\',{})">➕ Nova inspekcija</button>' +
      '<button class="btn btn-secondary" onclick="GT.go(\'extraction_form\',{})">🍯 Nova berba</button>' +
      '<button class="btn btn-secondary" onclick="GT.nav(\'analytics\')">📊 Analitika</button>' +
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

SCREENS.produce_list = function () {
  var cfg = App._cfg || {};
  var cur = cfg.currency || "RSD";
  var prod = App._produce.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
  var rows = prod.length ? prod.map(function (p) {
    var val = p.quantity && p.price_per_unit ? fmtNum(Math.round(p.quantity * p.price_per_unit)) + ' ' + cur : '';
    return '<div class="card" onclick="GT.go(\'produce_form\',{id:\'' + p.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + produceLabel(p.product_type) + '</b>' +
        '<span>' + (Number(p.quantity)||0).toFixed(2) + ' ' + esc(p.unit||'') + '</span>' +
      '</div>' +
      '<div class="muted">' + fmtDate(p.date) + (val ? ' · ' + val : '') + '</div>' +
      (p.notes ? '<div class="notes-text">' + esc(p.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema unetih proizvoda.</p></div>';
  return '<div>' + rows + '<button class="fab" onclick="GT.go(\'produce_form\',{})">+</button></div>';
};

SCREENS.treatments = function (p) {
  var hiveId = p && p.hive_id;
  var list = App._treatments
    .filter(function (t) { return !hiveId || t.hive_id === hiveId; })
    .sort(function (a,b) { return (b.start_date||'') > (a.start_date||'') ? 1 : -1; });

  var today = new Date().toISOString().slice(0,10);
  var rows = list.length ? list.map(function (t) {
    var active = t.start_date <= today && (!t.end_date || t.end_date >= today);
    var hiveName = t.hive_id ? hiveLabel(t.hive_id) : '—';
    return '<div class="card" onclick="GT.go(\'treatment_form\',{id:\'' + t.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + esc(t.product) + '</b>' +
        (active ? '<span class="badge badge-warn">Aktivan</span>' : '<span class="badge badge-muted">Završen</span>') +
      '</div>' +
      (!hiveId ? '<div class="muted">Košnica: ' + esc(hiveName) + '</div>' : '') +
      '<div class="muted">' + fmtDate(t.start_date) + (t.end_date ? ' → ' + fmtDate(t.end_date) : ' → ?') + '</div>' +
      (t.dose ? '<div class="muted">Doza: ' + esc(t.dose) + '</div>' : '') +
      (t.notes ? '<div class="notes-text">' + esc(t.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema zabeleženih tretmana.</p></div>';

  return '<div>' + rows + '<button class="fab" onclick="GT.go(\'treatment_form\',{hive_id:\'' + (hiveId||'') + '\'})">+</button></div>';
};

SCREENS.treatment_form = function (p) {
  var h = p.id ? App._treatments.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var preHive = p.hive_id || h.hive_id || '';
  var hiveOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + ((preHive === x.id) ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var prodOpts = TREATMENT_PRODUCTS.map(function (pr) {
    return '<option value="' + esc(pr) + '"' + (h.product === pr ? ' selected' : '') + '>' + esc(pr) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni tretman' : 'Novi tretman') + '</h2>' +
    (h.id ? '<input type="hidden" id="tf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Košnica*</label>' +
    '<select id="tf_hive"><option value="">— izaberi —</option>' + hiveOpts + '</select>' +
    '<label>Preparat*</label>' +
    '<select id="tf_product"><option value="">— izaberi —</option>' + prodOpts + '</select>' +
    '<label>Datum početka*</label>' +
    '<input id="tf_start" type="date" value="' + (h.start_date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Datum završetka (opciono)</label>' +
    '<input id="tf_end" type="date" value="' + (h.end_date || '') + '">' +
    '<label>Doza / napomena o pripremi</label>' +
    '<input id="tf_dose" type="text" placeholder="npr. 2 trake, 50ml..." value="' + esc(h.dose || '') + '">' +
    '<label>Napomena</label>' +
    '<textarea id="tf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveTreatment()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteTreatment(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.swarms = function () {
  var list = App._swarms.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
  var outcomeMap = {};
  SWARM_OUTCOMES.forEach(function (o) { outcomeMap[o.key] = o.label; });

  var rows = list.length ? list.map(function (s) {
    return '<div class="card" onclick="GT.go(\'swarm_form\',{id:\'' + s.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>Roj — ' + fmtDate(s.date) + '</b>' +
        '<span class="badge badge-muted">' + (outcomeMap[s.outcome] || s.outcome || '?') + '</span>' +
      '</div>' +
      '<div class="muted">Iz košnice: ' + (s.hive_id ? hiveLabel(s.hive_id) : 'nepoznato') + '</div>' +
      (s.new_hive_id ? '<div class="muted">Nova košnica: ' + hiveLabel(s.new_hive_id) + '</div>' : '') +
      (s.notes ? '<div class="notes-text">' + esc(s.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema zabeleženih rojeva.</p>' +
    '<p class="muted" style="margin-top:.4rem;font-size:.82rem">Rojevi se najčešće javljaju maj–jun.</p></div>';

  return '<div>' + rows + '<button class="fab" onclick="GT.go(\'swarm_form\',{})">+</button></div>';
};

SCREENS.swarm_form = function (p) {
  var h = p.id ? App._swarms.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var hiveOpts = App._hives.map(function (x) {
    return '<option value="' + x.id + '"' + (h.hive_id === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var newHiveOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + (h.new_hive_id === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var outcomeOpts = SWARM_OUTCOMES.map(function (o) {
    return '<option value="' + o.key + '"' + (h.outcome === o.key ? ' selected' : '') + '>' + o.label + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni roj' : 'Novi roj') + '</h2>' +
    (h.id ? '<input type="hidden" id="swf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Datum*</label>' +
    '<input id="swf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Košnica porekla</label>' +
    '<select id="swf_hive"><option value="">— nepoznato —</option>' + hiveOpts + '</select>' +
    '<label>Ishod*</label>' +
    '<select id="swf_outcome">' + outcomeOpts + '</select>' +
    '<label>Nova košnica (ako je uhvaćen)</label>' +
    '<select id="swf_new_hive"><option value="">— nije primenljivo —</option>' + newHiveOpts + '</select>' +
    '<label>Napomena</label>' +
    '<textarea id="swf_notes" rows="3">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveSwarm()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteSwarm(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

/* ─── EVIDENCIJA (tab landing) ──────────────────────────── */

SCREENS.evidencija = function () {
  var today = new Date().toISOString().slice(0,10);
  var activeTreat = App._treatments.filter(function (t) {
    return t.start_date <= today && (!t.end_date || t.end_date >= today);
  }).length;
  var activeNuclei = App._nuclei.filter(function (n) { return n.status === 'active'; }).length;
  var inProgressQR = App._queen_rearing.filter(function (q) { return q.status === 'in_progress' || !q.status; }).length;

  var lastCheckByHive = {};
  App._varroa_checks.forEach(function (c) {
    if (!lastCheckByHive[c.hive_id] || c.date > lastCheckByHive[c.hive_id]) lastCheckByHive[c.hive_id] = c.date;
  });
  var thirtyAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
  var varroaOverdue = App._hives.filter(function (h) {
    return h.status === 'active' && (!lastCheckByHive[h.id] || lastCheckByHive[h.id] < thirtyAgo);
  }).length;

  function evItem(icon, label, sub, screen, badge, badgeClass) {
    return '<div class="card ev-item" onclick="GT.nav(\'' + screen + '\')" style="cursor:pointer;margin-bottom:.5rem">' +
      '<div style="display:flex;align-items:center;gap:.65rem">' +
        '<span style="font-size:1.5rem;min-width:2rem;text-align:center">' + icon + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-weight:600;font-size:.97rem">' + label + '</div>' +
          (sub ? '<div class="muted" style="font-size:.78rem">' + sub + '</div>' : '') +
        '</div>' +
        (badge !== undefined ? '<span class="badge ' + (badgeClass||'badge-muted') + '">' + badge + '</span>' : '') +
        '<span style="color:#d1d5db;font-size:1.1rem">›</span>' +
      '</div>' +
    '</div>';
  }

  return '<div style="padding-bottom:1rem">' +
    evItem('🍯','Berba','Ekstrakcije meda','extractions', App._extractions.length) +
    evItem('🥄','Hranjenje','Sirup, pogačice, fondant','feedings', App._feedings.length) +
    evItem('🔬','Varroa monitoring','Merenja grinja',
      'varroa', varroaOverdue ? varroaOverdue + ' bez merenja' : App._varroa_checks.length,
      varroaOverdue ? 'badge-danger' : 'badge-muted') +
    evItem('💊','Tretmani', activeTreat ? activeTreat + ' aktivnih' : 'Evidencija tretmana',
      'treatments', App._treatments.length, activeTreat ? 'badge-warn' : 'badge-muted') +
    evItem('🐝','Rojevi','Log uhvaćenih rojeva','swarms', App._swarms.length) +
    evItem('🏠','Nukleusi','Podjele i nukleusi',
      'nuclei', activeNuclei ? activeNuclei + ' aktivnih' : App._nuclei.length,
      activeNuclei ? 'badge-ok' : 'badge-muted') +
    evItem('👑','Uzgoj matica','Grafting, selekcija',
      'queen_rearing', inProgressQR ? inProgressQR + ' u toku' : App._queen_rearing.length,
      inProgressQR ? 'badge-warn' : 'badge-muted') +
    evItem('❄️','Zimovanje','Godišnji checklist','winterization', App._winterization.length) +
  '</div>';
};

/* ─── HRANJENJE ─────────────────────────────────────────── */

SCREENS.feedings = function () {
  var list = App._feedings.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
  var rows = list.length ? list.map(function (f) {
    var scope = f.hive_ids && f.hive_ids.length
      ? (f.hive_ids.length === 1 ? hiveLabel(f.hive_ids[0]) : f.hive_ids.length + ' košnica')
      : (f.apiary_id ? apiaryName(f.apiary_id) + ' (sve)' : 'Sve košnice');
    return '<div class="card" onclick="GT.go(\'feeding_form\',{id:\'' + f.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + esc(f.feed_type || '?') + '</b>' +
        '<span class="badge badge-muted">' + (Number(f.amount)||0) + ' ' + esc(f.unit||'kg') + '</span>' +
      '</div>' +
      '<div class="muted">' + fmtDate(f.date) + ' · ' + esc(scope) + '</div>' +
      (f.notes ? '<div class="notes-text">' + esc(f.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema unetih hranjenja.</p></div>';
  return '<div>' + rows + '<button class="fab" onclick="GT.go(\'feeding_form\',{})">+</button></div>';
};

SCREENS.feeding_form = function (p) {
  var h = p.id ? App._feedings.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var scopeType = h.id
    ? (h.hive_ids && h.hive_ids.length ? 'hive' : h.apiary_id ? 'apiary' : 'all')
    : (p.hive_id ? 'hive' : 'all');

  var feedOpts = FEED_TYPES.map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.feed_type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');
  var apiaryOpts = App._apiaries.map(function (a) {
    return '<option value="' + a.id + '"' + (h.apiary_id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
  }).join('');
  var preHive = p.hive_id || (h.hive_ids && h.hive_ids[0]) || '';
  var hiveOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + (preHive === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni hranjenje' : 'Novo hranjenje') + '</h2>' +
    (h.id ? '<input type="hidden" id="ff_id" value="' + esc(h.id) + '">' : '') +
    '<label>Tip hrane*</label>' +
    '<select id="ff_type"><option value="">— izaberi —</option>' + feedOpts + '</select>' +
    '<label>Količina*</label>' +
    '<div class="input-row">' +
      '<input id="ff_amount" type="number" step="0.1" min="0" style="flex:1" value="' + esc(h.amount||'') + '" placeholder="npr. 5">' +
      '<select id="ff_unit" style="width:70px">' +
        '<option value="kg"' + ((h.unit==='kg'||!h.unit)?' selected':'') + '>kg</option>' +
        '<option value="l"' + (h.unit==='l'?' selected':'') + '>l</option>' +
        '<option value="kom"' + (h.unit==='kom'?' selected':'') + '>kom</option>' +
      '</select>' +
    '</div>' +
    '<label>Datum*</label>' +
    '<input id="ff_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Ko prima hranu</label>' +
    '<div class="scope-radio">' +
      '<label class="radio-opt"><input type="radio" name="ff_scope" value="all" onchange="GT.showFeedScope(this.value)"' + (scopeType==='all'?' checked':'') + '> Sve košnice</label>' +
      (App._apiaries.length ? '<label class="radio-opt"><input type="radio" name="ff_scope" value="apiary" onchange="GT.showFeedScope(this.value)"' + (scopeType==='apiary'?' checked':'') + '> Po pčelinjaku</label>' : '') +
      '<label class="radio-opt"><input type="radio" name="ff_scope" value="hive" onchange="GT.showFeedScope(this.value)"' + (scopeType==='hive'?' checked':'') + '> Jedna košnica</label>' +
    '</div>' +
    '<div id="ff_apiary_wrap" style="display:' + (scopeType==='apiary'?'block':'none') + '">' +
      '<label>Pčelinjak</label>' +
      '<select id="ff_apiary"><option value="">— svi —</option>' + apiaryOpts + '</select>' +
    '</div>' +
    '<div id="ff_hive_wrap" style="display:' + (scopeType==='hive'?'block':'none') + '">' +
      '<label>Košnica</label>' +
      '<select id="ff_hive"><option value="">— izaberi —</option>' + hiveOpts + '</select>' +
    '</div>' +
    '<label>Napomena</label>' +
    '<textarea id="ff_notes" rows="2">' + esc(h.notes||'') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveFeeding()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteFeeding(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

/* ─── VARROA MONITORING ─────────────────────────────────── */

SCREENS.varroa = function () {
  var list = App._varroa_checks.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
  var thirtyAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
  var lastCheckByHive = {};
  App._varroa_checks.forEach(function (c) {
    if (!lastCheckByHive[c.hive_id] || c.date > lastCheckByHive[c.hive_id]) lastCheckByHive[c.hive_id] = c.date;
  });
  var overdueHives = App._hives.filter(function (h) {
    return h.status === 'active' && (!lastCheckByHive[h.id] || lastCheckByHive[h.id] < thirtyAgo);
  });

  var alertHtml = overdueHives.length ?
    '<div class="alert-box"><b>⚠ Bez merenja >30 dana: ' + overdueHives.length + ' košnica</b></div>' : '';

  var rows = list.length ? list.map(function (c) {
    var sample = c.sample_size || 100;
    var per100 = (c.mites_found !== undefined && c.mites_found !== '')
      ? Math.round(c.mites_found / sample * 100) : null;
    var danger = per100 !== null && per100 >= 3;
    return '<div class="card" onclick="GT.go(\'varroa_form\',{id:\'' + c.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + hiveLabel(c.hive_id) + '</b>' +
        (per100 !== null
          ? '<span class="badge ' + (danger ? 'badge-danger' : 'badge-ok') + '">' + per100 + '/100</span>'
          : '') +
      '</div>' +
      '<div class="muted">' + fmtDate(c.date) + ' · ' + esc(c.method || '?') + '</div>' +
      (c.notes ? '<div class="notes-text">' + esc(c.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema merenja varroa.</p>' +
    '<p class="muted" style="margin-top:.4rem;font-size:.82rem">Prag tretmana: ≥3 grinje na 100 pčela.</p></div>';

  return '<div>' + alertHtml + rows + '<button class="fab" onclick="GT.go(\'varroa_form\',{})">+</button></div>';
};

SCREENS.varroa_form = function (p) {
  var h = p.id ? App._varroa_checks.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var preHive = p.hive_id || h.hive_id || '';
  var hiveOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + (preHive === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var methodOpts = VARROA_METHODS.map(function (m) {
    return '<option value="' + esc(m) + '"' + (h.method === m ? ' selected' : '') + '>' + esc(m) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni merenje' : 'Novo merenje varroa') + '</h2>' +
    (h.id ? '<input type="hidden" id="vf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Košnica*</label>' +
    '<select id="vf_hive"><option value="">— izaberi —</option>' + hiveOpts + '</select>' +
    '<label>Metoda*</label>' +
    '<select id="vf_method"><option value="">— izaberi —</option>' + methodOpts + '</select>' +
    '<label>Datum*</label>' +
    '<input id="vf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Pronađeno grinja</label>' +
    '<input id="vf_mites" type="number" min="0" step="1" value="' + (h.mites_found !== undefined ? h.mites_found : '') + '" placeholder="broj grinja">' +
    '<label>Uzorak (broj pčela, default 100)</label>' +
    '<input id="vf_sample" type="number" min="1" step="1" value="' + (h.sample_size || 100) + '">' +
    '<p class="muted" style="font-size:.78rem;margin:.2rem 0 .6rem">Prag tretmana: ≥3 grinje / 100 pčela</p>' +
    '<label>Napomena</label>' +
    '<textarea id="vf_notes" rows="2">' + esc(h.notes||'') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveVarroa()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteVarroa(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

/* ─── NUKLEUSI ──────────────────────────────────────────── */

SCREENS.nuclei = function () {
  var statusMap = {};
  NUCLEUS_STATUSES.forEach(function (s) { statusMap[s.key] = s.label; });
  var list = App._nuclei.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
  var activeCount = App._nuclei.filter(function (n) { return n.status === 'active' || !n.status; }).length;

  var rows = list.length ? list.map(function (n) {
    var st = n.status || 'active';
    var isActive = st === 'active';
    return '<div class="card" onclick="GT.go(\'nucleus_form\',{id:\'' + n.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + fmtDate(n.date) + (n.name ? ' — ' + esc(n.name) : '') + '</b>' +
        '<span class="badge ' + (isActive ? 'badge-ok' : 'badge-muted') + '">' + (statusMap[st] || st) + '</span>' +
      '</div>' +
      '<div class="muted">Iz: ' + (n.source_hive_id ? hiveLabel(n.source_hive_id) : '—') + '</div>' +
      (n.dest_hive_id ? '<div class="muted">→ ' + hiveLabel(n.dest_hive_id) + '</div>' : '') +
      (n.frames ? '<div class="muted">' + esc(n.frames) + '</div>' : '') +
      (n.notes ? '<div class="notes-text">' + esc(n.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema zabeleženih nukleusa.</p></div>';

  return '<div>' +
    (activeCount ? '<div class="alert-box" style="background:#f0fdf4;border-color:#86efac"><b>Aktivnih nukleusa: ' + activeCount + '</b></div>' : '') +
    rows +
    '<button class="fab" onclick="GT.go(\'nucleus_form\',{})">+</button>' +
  '</div>';
};

SCREENS.nucleus_form = function (p) {
  var h = p.id ? App._nuclei.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var hiveOpts = App._hives.map(function (x) {
    return '<option value="' + x.id + '"' + (h.source_hive_id === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var destOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + (h.dest_hive_id === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');
  var statusOpts = NUCLEUS_STATUSES.map(function (s) {
    return '<option value="' + s.key + '"' + ((h.status || 'active') === s.key ? ' selected' : '') + '>' + s.label + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni nukleus' : 'Novi nukleus') + '</h2>' +
    (h.id ? '<input type="hidden" id="nf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Oznaka / naziv (opciono)</label>' +
    '<input id="nf_name" type="text" placeholder="npr. N-01-2026" value="' + esc(h.name||'') + '">' +
    '<label>Datum podjele*</label>' +
    '<input id="nf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Roditeljska košnica</label>' +
    '<select id="nf_source"><option value="">— nepoznato —</option>' + hiveOpts + '</select>' +
    '<label>Okviri / pčele</label>' +
    '<input id="nf_frames" type="text" placeholder="npr. 5 okvira, 1kg pčela" value="' + esc(h.frames||'') + '">' +
    '<label>Sadržaj (šta je dato nukleusu)</label>' +
    '<div class="check-group">' +
      '<label class="check-opt"><input type="checkbox" id="nf_has_qcell"' + (h.has_queen_cell?' checked':'') + '> Matičnjak</label>' +
      '<label class="check-opt"><input type="checkbox" id="nf_has_queen"' + (h.has_queen?' checked':'') + '> Zrela matica</label>' +
      '<label class="check-opt"><input type="checkbox" id="nf_has_brood"' + (h.has_brood?' checked':'') + '> Zatvoreno leglo</label>' +
    '</div>' +
    '<label>Status</label>' +
    '<select id="nf_status">' + statusOpts + '</select>' +
    '<label>Destinacija (kad postane košnica)</label>' +
    '<select id="nf_dest"><option value="">— još nije —</option>' + destOpts + '</select>' +
    '<label>Napomena</label>' +
    '<textarea id="nf_notes" rows="2">' + esc(h.notes||'') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveNucleus()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteNucleus(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

/* ─── UZGOJ MATICA ──────────────────────────────────────── */

SCREENS.queen_rearing = function () {
  var list = App._queen_rearing.slice().sort(function (a,b) {
    return (b.grafting_date||'') > (a.grafting_date||'') ? 1 : -1;
  });
  var rows = list.length ? list.map(function (q) {
    var accepted = (q.cells_accepted !== undefined && q.cells_accepted !== '')
      ? q.cells_accepted + '/' + (q.larvae_grafted||'?') : '—';
    var st = q.status || 'in_progress';
    var stLabel = { in_progress: 'U toku 🔄', done: 'Gotovo ✅', failed: 'Nije uspelo ❌' }[st] || st;
    var stClass = st === 'done' ? 'badge-ok' : st === 'failed' ? 'badge-danger' : 'badge-warn';
    return '<div class="card" onclick="GT.go(\'queen_form\',{id:\'' + q.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + fmtDate(q.grafting_date) + (q.name ? ' — ' + esc(q.name) : '') + '</b>' +
        '<span class="badge ' + stClass + '">' + stLabel + '</span>' +
      '</div>' +
      '<div class="muted">Iz: ' + (q.source_hive_id ? hiveLabel(q.source_hive_id) : '—') +
        ' · Prihvaćeno: ' + accepted + '</div>' +
      (q.intro_date ? '<div class="muted">Uvođenje: ' + fmtDate(q.intro_date) + '</div>' : '') +
      (q.notes ? '<div class="notes-text">' + esc(q.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema zabeleženih uzgoja matica.</p></div>';
  return '<div>' + rows + '<button class="fab" onclick="GT.go(\'queen_form\',{})">+</button></div>';
};

SCREENS.queen_form = function (p) {
  var h = p.id ? App._queen_rearing.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var hiveOpts = App._hives.filter(function (x) { return x.status === 'active'; }).map(function (x) {
    return '<option value="' + x.id + '"' + (h.source_hive_id === x.id ? ' selected' : '') + '>' + esc(x.label) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni uzgoj' : 'Novi uzgoj matica') + '</h2>' +
    (h.id ? '<input type="hidden" id="qf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Naziv / serija (opciono)</label>' +
    '<input id="qf_name" type="text" placeholder="npr. Serija A-2026" value="' + esc(h.name||'') + '">' +
    '<label>Datum grafinga*</label>' +
    '<input id="qf_grafting" type="date" value="' + (h.grafting_date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Roditeljska košnica (izvor)</label>' +
    '<select id="qf_source"><option value="">— izaberi —</option>' + hiveOpts + '</select>' +
    '<label>Broj prenetih larvi</label>' +
    '<input id="qf_larvae" type="number" min="0" step="1" value="' + (h.larvae_grafted||'') + '" placeholder="npr. 20">' +
    '<label>Broj prihvaćenih matičnjaka</label>' +
    '<input id="qf_accepted" type="number" min="0" step="1" value="' + (h.cells_accepted||'') + '" placeholder="npr. 15">' +
    '<label>Datum zatvaranja matičnjaka</label>' +
    '<input id="qf_capping" type="date" value="' + (h.capping_date||'') + '">' +
    '<label>Datum izlaska matica</label>' +
    '<input id="qf_emergence" type="date" value="' + (h.emergence_date||'') + '">' +
    '<label>Datum uvođenja</label>' +
    '<input id="qf_intro" type="date" value="' + (h.intro_date||'') + '">' +
    '<label>Status</label>' +
    '<select id="qf_status">' +
      '<option value="in_progress"' + ((!h.status||h.status==='in_progress')?' selected':'') + '>U toku 🔄</option>' +
      '<option value="done"' + (h.status==='done'?' selected':'') + '>Gotovo ✅</option>' +
      '<option value="failed"' + (h.status==='failed'?' selected':'') + '>Nije uspelo ❌</option>' +
    '</select>' +
    '<label>Napomena</label>' +
    '<textarea id="qf_notes" rows="3">' + esc(h.notes||'') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveQueenRearing()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteQueenRearing(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

/* ─── ZIMOVANJE ─────────────────────────────────────────── */

SCREENS.winterization = function () {
  var list = App._winterization.slice().sort(function (a,b) {
    return (b.year||'') > (a.year||'') ? 1 : -1;
  });
  var rows = list.length ? list.map(function (w) {
    var aName = w.apiary_id ? apiaryName(w.apiary_id) : 'Sve';
    var done = w.entrance_reduced && w.mouse_guard;
    return '<div class="card" onclick="GT.go(\'winterization_form\',{id:\'' + w.id + '\'})" style="cursor:pointer">' +
      '<div class="row-between">' +
        '<b>' + esc(String(w.year||'')) + ' — ' + esc(aName) + '</b>' +
        '<span class="badge ' + (done ? 'badge-ok' : 'badge-warn') + '">' + (done ? 'Kompletno ✅' : 'U toku 🔄') + '</span>' +
      '</div>' +
      (w.date ? '<div class="muted">Zatvoreno: ' + fmtDate(w.date) + '</div>' : '') +
      (w.winter_feed_kg ? '<div class="muted">Hrana: ' + w.winter_feed_kg + ' kg</div>' : '') +
      (w.notes ? '<div class="notes-text">' + esc(w.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema zabeleženih zimovanja.</p>' +
    '<p class="muted" style="margin-top:.4rem;font-size:.82rem">Dodaj zapis za tekuću sezonu.</p></div>';

  return '<div>' + rows +
    '<button class="fab" onclick="GT.go(\'winterization_form\',{year:' + new Date().getFullYear() + '})">+</button>' +
  '</div>';
};

SCREENS.winterization_form = function (p) {
  var h = p.id ? App._winterization.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var year = p.year || h.year || new Date().getFullYear();
  var apiaryOpts = App._apiaries.map(function (a) {
    return '<option value="' + a.id + '"' + (h.apiary_id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
  }).join('');
  var popOpts = [1,2,3,4,5].map(function (n) {
    return '<option value="' + n + '"' + (h.population_check === n ? ' selected' : '') + '>' + n + ' — ' +
      ['Kritično','Slaba','Srednja','Dobra','Odlična'][n-1] + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni zimovanje' : 'Novo zimovanje') + '</h2>' +
    (h.id ? '<input type="hidden" id="wf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Godina*</label>' +
    '<input id="wf_year" type="number" min="2020" max="2035" value="' + esc(year) + '">' +
    (App._apiaries.length ? '<label>Pčelinjak</label><select id="wf_apiary"><option value="">— svi —</option>' + apiaryOpts + '</select>' : '') +
    '<label>Datum zatvaranja</label>' +
    '<input id="wf_date" type="date" value="' + (h.date||'') + '">' +
    '<label>Unetih zimskih pogačica (kg)</label>' +
    '<input id="wf_feed" type="number" step="0.5" min="0" value="' + (h.winter_feed_kg||'') + '" placeholder="kg">' +
    '<label>Procena populacije</label>' +
    '<select id="wf_pop"><option value="">— izaberi —</option>' + popOpts + '</select>' +
    '<label>Checklist</label>' +
    '<div class="check-group">' +
      '<label class="check-opt"><input type="checkbox" id="wf_entrance"' + (h.entrance_reduced?' checked':'') + '> Ulaz sužen</label>' +
      '<label class="check-opt"><input type="checkbox" id="wf_mouse"' + (h.mouse_guard?' checked':'') + '> Mišolovka postavljena</label>' +
      '<label class="check-opt"><input type="checkbox" id="wf_ventilation"' + (h.ventilation_ok?' checked':'') + '> Ventilacija proverena</label>' +
      '<label class="check-opt"><input type="checkbox" id="wf_insulation"' + (h.insulation_ok?' checked':'') + '> Izolacija OK</label>' +
    '</div>' +
    '<label>Napomena</label>' +
    '<textarea id="wf_notes" rows="3">' + esc(h.notes||'') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveWinterization()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteWinterization(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.produce_form = function (p) {
  var h = p.id ? App._produce.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var cur = cfg.currency || "RSD";

  var typeOpts = PRODUCE_TYPES.map(function (t) {
    return '<option value="' + t.key + '"' + (h.product_type === t.key ? ' selected' : '') + '>' +
      t.icon + ' ' + t.label + '</option>';
  }).join('');

  var selType = PRODUCE_TYPES.find(function (t) { return t.key === (h.product_type || 'vosak'); }) || PRODUCE_TYPES[0];
  var unitOpts = selType.units.map(function (u) {
    return '<option value="' + u + '"' + (h.unit === u ? ' selected' : '') + '>' + u + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni unos' : 'Novi proizvod') + '</h2>' +
    (h.id ? '<input type="hidden" id="pf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Vrsta*</label>' +
    '<select id="pf_type" onchange="GT.updateProduceUnits()">' + typeOpts + '</select>' +
    '<label>Datum</label>' +
    '<input id="pf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Količina*</label>' +
    '<div class="input-row">' +
      '<input id="pf_qty" type="number" step="0.01" min="0" placeholder="npr. 2.5" style="flex:1" value="' + esc(h.quantity || '') + '">' +
      '<select id="pf_unit" style="width:70px">' + unitOpts + '</select>' +
    '</div>' +
    '<label>Cena/' + (h.unit || selType.units[0]) + ' (' + cur + ', opciono)</label>' +
    '<div class="input-row">' +
      '<input id="pf_price" type="number" step="10" min="0" placeholder="opciono" style="flex:1" value="' + esc(h.price_per_unit || '') + '">' +
      '<span class="input-suffix">' + cur + '</span>' +
    '</div>' +
    '<label>Napomena</label>' +
    '<textarea id="pf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveProduce()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteProduce(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

var APIARY_COLORS = ["#f59e0b","#22c55e","#3b82f6","#a855f7","#ef4444","#14b8a6","#f97316","#ec4899"];

function apiaryName(id) {
  if (!id) return "Nedodeljen";
  var a = App._apiaries.find(function (x) { return x.id === id; });
  return a ? a.name : "Nedodeljen";
}

function apiaryColor(id) {
  if (!id) return "#9ca3af";
  var a = App._apiaries.find(function (x) { return x.id === id; });
  return a ? (a.color || "#f59e0b") : "#9ca3af";
}

SCREENS.apiaries = function () {
  var apiaries = App._apiaries.slice().sort(function (a, b) { return a.name > b.name ? 1 : -1; });

  var listHtml = apiaries.length ? apiaries.map(function (a) {
    var hiveCount = App._hives.filter(function (h) { return h.apiary_id === a.id; }).length;
    return '<div class="card apiary-card" onclick="GT.go(\'apiary_form\',{id:\'' + a.id + '\'})">' +
      '<div class="apiary-header">' +
        '<span class="apiary-dot" style="background:' + esc(a.color || "#f59e0b") + '"></span>' +
        '<span class="apiary-name">' + esc(a.name) + '</span>' +
        '<span class="badge badge-muted">' + hiveCount + ' košnica</span>' +
      '</div>' +
      (a.location ? '<div class="muted">📍 ' + esc(a.location) + '</div>' : '') +
      (a.notes ? '<div class="notes-text">' + esc(a.notes) + '</div>' : '') +
    '</div>';
  }).join('') : '<div class="empty-state"><p>Nema pčelinjaka. Dodaj prvi.</p></div>';

  return '<div>' + listHtml +
    '<button class="fab" onclick="GT.go(\'apiary_form\',{})">+</button>' +
  '</div>';
};

SCREENS.apiary_form = function (p) {
  var h = p.id ? App._apiaries.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var colorOpts = APIARY_COLORS.map(function (c, i) {
    return '<button type="button" class="color-btn' + ((h.color || APIARY_COLORS[0]) === c ? ' color-btn-sel' : '') +
      '" style="background:' + c + '" onclick="GT.pickColor(\'' + c + '\')" data-color="' + c + '"></button>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni pčelinjak' : 'Novi pčelinjak') + '</h2>' +
    (h.id ? '<input type="hidden" id="af_id" value="' + esc(h.id) + '">' : '') +
    '<input type="hidden" id="af_color" value="' + esc(h.color || APIARY_COLORS[0]) + '">' +
    '<label>Naziv*</label>' +
    '<input id="af_name" type="text" placeholder="npr. Voćnjak, Šuma, Kod kuće..." value="' + esc(h.name || '') + '">' +
    '<label>Lokacija</label>' +
    '<input id="af_location" type="text" placeholder="Adresa ili opis" value="' + esc(h.location || '') + '">' +
    '<label>Boja</label>' +
    '<div class="color-row">' + colorOpts + '</div>' +
    '<label>Napomena</label>' +
    '<textarea id="af_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveApiary()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteApiary(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.analytics = function () {
  var cfg    = App._cfg || {};
  var cur    = cfg.currency || "RSD";

  // ── Apiary filter ──────────────────────────────────────────
  var anApiary = App._analyticsApiary || "";
  var apiaryBar = "";
  if (App._apiaries.length > 1) {
    var tabs = '<button class="apiary-tab' + (!anApiary ? ' active' : '') + '" onclick="GT.setAnApiary(\'\')">Svi</button>';
    tabs += App._apiaries.map(function (a) {
      var sel = anApiary === a.id;
      return '<button class="apiary-tab' + (sel ? ' active' : '') + '" ' +
        (sel ? 'style="border-color:' + esc(a.color||'#f59e0b') + ';color:' + esc(a.color||'#f59e0b') + '"' : '') +
        ' onclick="GT.setAnApiary(\'' + a.id + '\')">' +
        '<span class="apiary-dot" style="background:' + esc(a.color||'#f59e0b') + '"></span>' + esc(a.name) +
      '</button>';
    }).join('');
    apiaryBar = '<div class="apiary-tabs" style="margin-bottom:.75rem">' + tabs + '</div>';
  }

  // Filter hive IDs by apiary
  var filteredHiveIds = anApiary
    ? App._hives.filter(function (h) { return h.apiary_id === anApiary; }).map(function (h) { return h.id; })
    : null; // null = sve

  var extr  = anApiary
    ? App._extractions.filter(function (e) { return (e.hive_ids||[]).some(function(hid){ return filteredHiveIds.indexOf(hid)>=0; }); })
    : App._extractions;
  var sales = App._sales; // prodaja nije po pčelinjaku direktno
  var insps = anApiary
    ? App._inspections.filter(function (i) { return filteredHiveIds.indexOf(i.hive_id) >= 0; })
    : App._inspections;
  var hives = anApiary
    ? App._hives.filter(function (h) { return h.apiary_id === anApiary; })
    : App._hives;

  // ── Po godini ──────────────────────────────────────────────
  var byYear = {};
  extr.forEach(function (e) {
    var y = e.date ? e.date.slice(0,4) : "?";
    if (!byYear[y]) byYear[y] = { kg: 0, rev: 0, berbi: 0 };
    byYear[y].kg    += Number(e.kg) || 0;
    byYear[y].berbi += 1;
    if (e.price_per_kg) byYear[y].rev += (Number(e.kg) || 0) * Number(e.price_per_kg);
  });
  sales.forEach(function (s) {
    var y = s.date ? s.date.slice(0,4) : "?";
    if (!byYear[y]) byYear[y] = { kg: 0, rev: 0, berbi: 0 };
    byYear[y].rev += Number(s.total) || 0;
  });

  var years = Object.keys(byYear).sort().reverse();
  var maxKg  = Math.max.apply(null, years.map(function(y){ return byYear[y].kg; }).concat([1]));
  var maxRev = Math.max.apply(null, years.map(function(y){ return byYear[y].rev; }).concat([1]));

  var yearRows = years.length ? years.map(function (y) {
    var d = byYear[y];
    var barKg  = Math.round(d.kg  / maxKg  * 100);
    var barRev = Math.round(d.rev / maxRev * 100);
    return '<div class="an-year-row">' +
      '<div class="an-year-label">' + y + '</div>' +
      '<div class="an-bars">' +
        '<div class="an-bar-wrap" title="' + d.kg.toFixed(1) + ' kg">' +
          '<div class="an-bar an-bar-kg" style="width:' + barKg + '%"></div>' +
          '<span class="an-bar-val">' + d.kg.toFixed(1) + ' kg</span>' +
        '</div>' +
        (d.rev ? '<div class="an-bar-wrap" title="' + fmtNum(Math.round(d.rev)) + ' ' + cur + '">' +
          '<div class="an-bar an-bar-rev" style="width:' + barRev + '%"></div>' +
          '<span class="an-bar-val">' + fmtNum(Math.round(d.rev)) + ' ' + cur + '</span>' +
        '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('') : '<p class="muted">Nema podataka.</p>';

  // ── Po tipu meda ───────────────────────────────────────────
  var byType = {};
  extr.forEach(function (e) {
    var t = e.honey_type || "Nepoznat";
    if (!byType[t]) byType[t] = { kg: 0, rev: 0 };
    byType[t].kg  += Number(e.kg) || 0;
    if (e.price_per_kg) byType[t].rev += (Number(e.kg)||0) * Number(e.price_per_kg);
  });
  sales.forEach(function (s) {
    var t = s.honey_type || "Nepoznat";
    if (!byType[t]) byType[t] = { kg: 0, rev: 0 };
    byType[t].rev += Number(s.total) || 0;
  });
  var types = Object.keys(byType).sort(function (a,b) { return byType[b].kg - byType[a].kg; });

  var typeRows = types.length ? '<table class="an-table"><thead><tr><th>Tip</th><th>kg</th><th>' + cur + '</th></tr></thead><tbody>' +
    types.map(function (t) {
      var d = byType[t];
      return '<tr><td>' + esc(t) + '</td><td>' + d.kg.toFixed(1) + '</td><td>' + (d.rev ? fmtNum(Math.round(d.rev)) : '—') + '</td></tr>';
    }).join('') + '</tbody></table>'
    : '<p class="muted">Nema podataka.</p>';

  // ── Rang lista košnica (po ukupnom kg berbe) ───────────────
  var hiveKg = {};
  var hiveInspCount = {};
  extr.forEach(function (e) {
    (e.hive_ids || []).forEach(function (hid) {
      hiveKg[hid] = (hiveKg[hid] || 0) + (Number(e.kg) || 0);
    });
  });
  insps.forEach(function (i) {
    hiveInspCount[i.hive_id] = (hiveInspCount[i.hive_id] || 0) + 1;
  });

  var rankedHives = hives.filter(function (h) { return hiveKg[h.id]; })
    .sort(function (a,b) { return (hiveKg[b.id]||0) - (hiveKg[a.id]||0); });

  var hiveRows = rankedHives.length ? '<table class="an-table"><thead><tr><th>Košnica</th><th>kg</th><th>Pregledi</th></tr></thead><tbody>' +
    rankedHives.map(function (h, i) {
      return '<tr onclick="GT.go(\'hive_detail\',{id:\'' + h.id + '\'})" style="cursor:pointer">' +
        '<td>' + (i===0?'🥇':i===1?'🥈':i===2?'🥉':'') + ' ' + esc(h.label) + '</td>' +
        '<td>' + (hiveKg[h.id]||0).toFixed(1) + '</td>' +
        '<td>' + (hiveInspCount[h.id]||0) + '</td>' +
      '</tr>';
    }).join('') + '</tbody></table>'
    : '<p class="muted">Povezi berbe sa košnicama da vidiš rang.</p>';

  // ── Inspekcije ukupno po godini ────────────────────────────
  var inspByYear = {};
  insps.forEach(function (i) {
    var y = i.date ? i.date.slice(0,4) : "?";
    inspByYear[y] = (inspByYear[y] || 0) + 1;
  });
  var inspSummary = Object.keys(inspByYear).sort().reverse().map(function (y) {
    return '<span class="type-chip">' + y + ': ' + inspByYear[y] + ' pregleda</span>';
  }).join('');

  return '<div>' +
    apiaryBar +
    '<div class="section-card">' +
      '<h3 class="an-title">Prinos &amp; prihod po godini</h3>' +
      '<div class="an-legend"><span class="an-dot an-dot-kg"></span>kg <span class="an-dot an-dot-rev" style="margin-left:.5rem"></span>' + cur + '</div>' +
      yearRows +
    '</div>' +
    '<div class="section-card" style="margin-top:.65rem">' +
      '<h3 class="an-title">Po tipu meda</h3>' +
      typeRows +
    '</div>' +
    '<div class="section-card" style="margin-top:.65rem">' +
      '<h3 class="an-title">Rang lista košnica</h3>' +
      hiveRows +
    '</div>' +
    (inspSummary ? '<div class="section-card" style="margin-top:.65rem">' +
      '<h3 class="an-title">Inspekcije</h3>' +
      '<div class="type-chips">' + inspSummary + '</div>' +
    '</div>' : '') +
  '</div>';
};

SCREENS.hives = function () {
  if (!App._hives.length) {
    return '<div class="empty-state"><p>Nema unetih košnica.</p>' +
      '<button class="btn btn-primary" onclick="GT.go(\'hive_form\',{})">+ Dodaj prvu košnicu</button></div>';
  }

  // Apiary filter bar (samo ako ima pčelinjaka)
  var filterBar = "";
  if (App._apiaries.length) {
    var tabs = '<button class="apiary-tab' + (!App._activeApiary ? ' active' : '') + '" onclick="GT.setActiveApiary(\'\')">Svi</button>';
    tabs += App._apiaries.map(function (a) {
      var sel = App._activeApiary === a.id;
      return '<button class="apiary-tab' + (sel ? ' active' : '') + '" ' +
        'style="' + (sel ? 'border-color:' + esc(a.color || '#f59e0b') + ';color:' + esc(a.color || '#f59e0b') : '') + '" ' +
        'onclick="GT.setActiveApiary(\'' + a.id + '\')">' +
        '<span class="apiary-dot" style="background:' + esc(a.color || '#f59e0b') + '"></span>' +
        esc(a.name) + '</button>';
    }).join('');
    filterBar = '<div class="apiary-tabs">' + tabs + '</div>';
  }

  // Filter hives by active apiary
  var filtered = App._hives.slice().sort(function (a, b) { return a.label > b.label ? 1 : -1; });
  if (App._activeApiary) {
    filtered = filtered.filter(function (h) { return h.apiary_id === App._activeApiary; });
  }

  // Group by apiary
  var groups = {};
  var groupOrder = [];
  filtered.forEach(function (h) {
    var key = h.apiary_id || "__none__";
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(h);
  });

  function renderHiveCard(h) {
    var lastInsp = App._inspections.filter(function (i) { return i.hive_id === h.id; })
      .sort(function (a, b) { return b.date > a.date ? 1 : -1; })[0];
    var lastStr = lastInsp ? fmtDate(lastInsp.date) : "nikad";
    var sched = inspectionSchedule(h.id);
    var nextLine = sched.nextDate
      ? 'Sledeća: ' + fmtDate(sched.nextDate) + ' ' + inspBadge(sched)
      : 'Zadnja: ' + lastStr + ' ' + inspBadge(sched);
    var aColor = h.apiary_id ? apiaryColor(h.apiary_id) : "var(--c-primary)";
    var photoHtml = h.photo
      ? '<div class="hive-card-photo" style="background-image:url(\'' + h.photo + '\')"></div>'
      : '<div class="hive-card-photo hive-card-photo-empty" style="background:' + aColor + '22;border-bottom:2px solid ' + aColor + '">' +
          '<span style="font-size:2rem">🐝</span>' +
        '</div>';
    return '<div class="card hive-card hive-card-photo-card" onclick="GT.go(\'hive_detail\',{id:\'' + h.id + '\'})">' +
      photoHtml +
      '<div class="hive-card-body">' +
        '<div class="hive-header">' +
          '<span class="hive-label">' + esc(h.label) + '</span>' +
          statusBadge(h.status) +
        '</div>' +
        '<div class="muted">' + esc(h.location || "") + (h.hive_type ? ' · ' + esc(h.hive_type) : '') +
          (h.queen_year ? ' · matica ' + h.queen_year : '') + '</div>' +
        '<div class="hive-footer">' + nextLine + '</div>' +
      '</div>' +
    '</div>';
  }

  var grouped = !App._activeApiary && App._apiaries.length > 1;
  var listHtml = grouped
    ? groupOrder.map(function (key) {
        var a = App._apiaries.find(function (x) { return x.id === key; });
        var color = a ? (a.color || "#f59e0b") : "#9ca3af";
        var label = a ? a.name : "Nedodeljene košnice";
        return '<div class="apiary-group-header" style="border-left-color:' + color + '">' +
          '<span class="apiary-dot" style="background:' + color + '"></span>' + esc(label) +
          ' <span class="muted">(' + groups[key].length + ')</span></div>' +
          groups[key].map(renderHiveCard).join('');
      }).join('')
    : filtered.map(renderHiveCard).join('');

  return '<div>' + filterBar + listHtml +
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
        (i.next_inspection ? '<div class="muted" style="font-size:.78rem;margin-top:.2rem">📅 Sledeća: ' + fmtDate(i.next_inspection) + '</div>' : '') +
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
    '<div class="card" style="padding:0;overflow:hidden">' +
      (h.photo
        ? '<img src="' + h.photo + '" class="hive-detail-photo" alt="' + esc(h.label) + '">'
        : '') +
      '<div style="padding:.85rem">' +
      '<div class="hive-header">' +
        '<span class="hive-label" style="font-size:1.3rem">' + esc(h.label) + '</span>' +
        statusBadge(h.status) +
      '</div>' +
      (h.location ? '<div class="muted">📍 ' + esc(h.location) + '</div>' : '') +
      (h.hive_type ? '<div class="muted">Tip: ' + esc(h.hive_type) + '</div>' : '') +
      (h.queen_year ? '<div class="muted">Matica iz: ' + h.queen_year + '</div>' : '') +
      (h.notes ? '<div class="notes-text">' + esc(h.notes) + '</div>' : '') +
      (function() {
        var s = inspectionSchedule(h.id);
        var line = s.nextDate
          ? '<div class="muted" style="margin-top:.3rem">📅 Sledeća inspekcija: ' + fmtDate(s.nextDate) + ' ' + inspBadge(s) + '</div>'
          : '';
        return line;
      })() +
      '<div class="btn-row mt8">' +
        '<button class="btn btn-primary" onclick="GT.go(\'inspection_form\',{hive_id:\'' + h.id + '\'})">+ Inspekcija</button>' +
        '<button class="btn btn-secondary" onclick="GT.go(\'hive_form\',{id:\'' + h.id + '\'})">Izmeni</button>' +
      '</div>' +
    '</div>' +  // close padding div
    '</div>' +  // close card
    (function () {
      var today = new Date().toISOString().slice(0,10);
      var hTreat = App._treatments.filter(function (t) { return t.hive_id === h.id; })
        .sort(function (a,b) { return (b.start_date||'') > (a.start_date||'') ? 1 : -1; });
      var active = hTreat.filter(function (t) { return t.start_date <= today && (!t.end_date || t.end_date >= today); });
      if (!hTreat.length) return '';
      return '<h2 class="section-title">Tretmani ' +
        (active.length ? '<span class="badge badge-warn" style="text-transform:none">'+active.length+' aktivan</span>' : '') +
        '</h2>' +
        hTreat.slice(0,3).map(function (t) {
          var act = t.start_date <= today && (!t.end_date || t.end_date >= today);
          return '<div class="hist-row" onclick="GT.go(\'treatment_form\',{id:\'' + t.id + '\'})" style="cursor:pointer">' +
            '<div class="hist-date">' + fmtDate(t.start_date) + '</div>' +
            '<div class="hist-body"><b>' + esc(t.product) + '</b>' +
              (act ? ' <span class="badge badge-warn">Aktivan</span>' : '') +
              (t.end_date ? '<br><small class="muted">do ' + fmtDate(t.end_date) + '</small>' : '') +
              (t.dose ? '<br><small class="muted">' + esc(t.dose) + '</small>' : '') +
            '</div>' +
          '</div>';
        }).join('') +
        (hTreat.length > 3 ? '<p class="muted" style="font-size:.8rem;text-align:right;cursor:pointer" onclick="GT.go(\'treatments\',{hive_id:\'' + h.id + '\'})">Prikaži sve →</p>' : '') +
        '<div style="margin:.4rem 0"><button class="btn btn-secondary btn-sm" onclick="GT.go(\'treatment_form\',{hive_id:\'' + h.id + '\'})">+ Tretman</button></div>';
    })() +
    (function () {
      var hFeedings = App._feedings.filter(function (f) {
        return (f.hive_ids && f.hive_ids.indexOf(h.id) >= 0) ||
          (f.apiary_id && h.apiary_id && f.apiary_id === h.apiary_id) ||
          (!f.hive_ids.length && !f.apiary_id);
      }).sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
      if (!hFeedings.length) return '';
      return '<h2 class="section-title">Hranjenje</h2>' +
        hFeedings.slice(0,3).map(function (f) {
          return '<div class="hist-row">' +
            '<div class="hist-date">' + fmtDate(f.date) + '</div>' +
            '<div class="hist-body"><b>' + esc(f.feed_type||'?') + '</b> — ' + f.amount + ' ' + esc(f.unit||'kg') + '</div>' +
          '</div>';
        }).join('') +
        '<div style="margin:.4rem 0"><button class="btn btn-secondary btn-sm" onclick="GT.go(\'feeding_form\',{hive_id:\'' + h.id + '\'})">+ Hranjenje</button></div>';
    })() +
    (function () {
      var hVarroa = App._varroa_checks.filter(function (c) { return c.hive_id === h.id; })
        .sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
      if (!hVarroa.length) return '<div style="margin:.4rem 0"><button class="btn btn-secondary btn-sm" onclick="GT.go(\'varroa_form\',{hive_id:\'' + h.id + '\'})">+ Varroa merenje</button></div>';
      var last = hVarroa[0];
      var per100 = (last.mites_found !== undefined && last.mites_found !== '')
        ? Math.round(last.mites_found / (last.sample_size||100) * 100) : null;
      var danger = per100 !== null && per100 >= 3;
      return '<h2 class="section-title">Varroa ' +
        (per100 !== null ? '<span class="badge ' + (danger?'badge-danger':'badge-ok') + '">' + per100 + '/100</span>' : '') +
        '</h2>' +
        hVarroa.slice(0,3).map(function (c) {
          var p100 = (c.mites_found !== undefined && c.mites_found !== '') ? Math.round(c.mites_found/(c.sample_size||100)*100) : null;
          return '<div class="hist-row" onclick="GT.go(\'varroa_form\',{id:\'' + c.id + '\'})" style="cursor:pointer">' +
            '<div class="hist-date">' + fmtDate(c.date) + '</div>' +
            '<div class="hist-body">' + esc(c.method||'?') +
              (p100 !== null ? ' — <b>' + p100 + '/100</b>' : '') +
            '</div>' +
          '</div>';
        }).join('') +
        '<div style="margin:.4rem 0"><button class="btn btn-secondary btn-sm" onclick="GT.go(\'varroa_form\',{hive_id:\'' + h.id + '\'})">+ Varroa merenje</button></div>';
    })() +
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
  var apiaryOpts = App._apiaries.map(function (a) {
    return '<option value="' + esc(a.id) + '"' + (h.apiary_id === a.id ? " selected" : "") + '>' + esc(a.name) + '</option>';
  }).join("");

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? "Izmeni košnicu" : "Nova košnica") + '</h2>' +
    (h.id ? '<input type="hidden" id="hf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Oznaka*</label>' +
    '<input id="hf_label" type="text" placeholder="npr. K-01" value="' + esc(h.label || "") + '">' +
    (App._apiaries.length ? '<label>Pčelinjak</label>' +
      '<select id="hf_apiary"><option value="">— nije dodeljen —</option>' + apiaryOpts + '</select>' : '') +
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
    '<label>Fotografija košnice</label>' +
    '<div class="photo-section">' +
      (h.photo ? '<img id="hf_photo_preview" class="hive-photo-preview" src="' + h.photo + '" alt="Košnica">' :
        '<div id="hf_photo_preview" class="photo-placeholder">📷 Nema slike</div>') +
      '<input type="hidden" id="hf_photo_data" value="' + (h.photo ? "HAS_PHOTO" : "") + '">' +
      '<div class="btn-row" style="margin-top:.4rem">' +
        '<button type="button" class="btn btn-secondary btn-sm" onclick="GT.pickPhoto()">📷 Fotografiši / izaberi</button>' +
        (h.photo ? '<button type="button" class="btn btn-secondary btn-sm" onclick="GT.removePhoto()">🗑 Ukloni</button>' : '') +
      '</div>' +
    '</div>' +
    '<input type="file" id="hf_photo_input" accept="image/*" style="display:none" onchange="GT.handlePhoto(this)">' +
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
    '<label>Sledeća inspekcija</label>' +
    '<div class="next-insp-row">' +
      '<input id="if_next_days" type="number" min="1" max="365" placeholder="za N dana" oninput="GT.syncNextDays()">' +
      '<span class="input-suffix">dana</span>' +
      '<span class="insp-or">ili</span>' +
      '<input id="if_next_date" type="date" oninput="GT.syncNextDate()">' +
    '</div>' +
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
  var cfg = App._cfg || {};
  var cur = cfg.currency || "RSD";
  var f   = App._filter;

  // ── Filter UI ──────────────────────────────────────────────
  var allTypes = [];
  App._stocks.concat(App._inventory).forEach(function (x) {
    if (x.honey_type && allTypes.indexOf(x.honey_type) < 0) allTypes.push(x.honey_type);
  });
  var typeOpts = '<option value="">Svi tipovi</option>' + allTypes.map(function (t) {
    return '<option value="' + esc(t) + '"' + (f.honey_type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');

  var filterHtml =
    '<div class="filter-bar">' +
      '<select class="filter-select" onchange="GT.setFilter(\'honey_type\',this.value)">' + typeOpts + '</select>' +
      '<input class="filter-input" type="date" title="Od datuma" value="' + esc(f.date_from) + '" onchange="GT.setFilter(\'date_from\',this.value)">' +
      '<input class="filter-input" type="date" title="Do datuma" value="' + esc(f.date_to) + '" onchange="GT.setFilter(\'date_to\',this.value)">' +
      '<input class="filter-input" type="number" placeholder="Min kg" style="width:70px" value="' + esc(f.min_kg) + '" onchange="GT.setFilter(\'min_kg\',this.value)">' +
      (f.honey_type || f.date_from || f.date_to || f.min_kg
        ? '<button class="btn btn-secondary btn-sm" onclick="GT.clearFilter()">✕</button>' : '') +
    '</div>';

  // ── Apply filter ───────────────────────────────────────────
  function applyFilter(rows, dateField) {
    return rows.filter(function (r) {
      if (f.honey_type && r.honey_type !== f.honey_type) return false;
      if (f.date_from && r[dateField] && r[dateField] < f.date_from) return false;
      if (f.date_to   && r[dateField] && r[dateField] > f.date_to)   return false;
      if (f.min_kg    && (Number(r.kg) || 0) < Number(f.min_kg))     return false;
      return true;
    });
  }

  // ── Kante ──────────────────────────────────────────────────
  var stocks = applyFilter(App._stocks, "date").slice().sort(function (a, b) {
    return (b.date || '') > (a.date || '') ? 1 : -1;
  });

  var stockByType = {};
  stocks.forEach(function (s) {
    var t = s.honey_type || "—";
    stockByType[t] = (stockByType[t] || 0) + (Number(s.kg) || 0);
  });
  var totalKg = Object.values(stockByType).reduce(function (a, b) { return a + b; }, 0);

  var stockRows = stocks.map(function (s) {
    return '<div class="inv-row" onclick="GT.go(\'stock_form\',{id:\'' + s.id + '\'})" style="cursor:pointer">' +
      '<div>' +
        (s.kanta_id ? '<span class="badge badge-muted" style="font-size:.7rem;margin-right:.3rem">' + esc(s.kanta_id) + '</span>' : '') +
        '<span class="inv-type">' + esc(s.honey_type || '—') + '</span>' +
        (s.date ? '<span class="muted" style="font-size:.78rem;margin-left:.4rem">' + fmtDate(s.date) + '</span>' : '') +
        (s.notes ? '<div class="muted" style="font-size:.78rem">' + esc(s.notes) + '</div>' : '') +
      '</div>' +
      '<span class="inv-detail"><b>' + (Number(s.kg) || 0).toFixed(1) + ' kg</b></span>' +
    '</div>';
  }).join('');

  var kanteSummary = Object.keys(stockByType).map(function (t) {
    return '<span class="type-chip">' + esc(t) + ' ' + stockByType[t].toFixed(1) + ' kg</span>';
  }).join('');

  var kanteHtml = stocks.length
    ? '<div class="type-chips">' + kanteSummary + '</div>' + stockRows
    : '<p class="muted" style="margin:.4rem 0">Nema kanti.</p>';

  // ── Tegle ──────────────────────────────────────────────────
  var inv = applyFilter(App._inventory, "created_at").slice().sort(function (a, b) {
    return (b.created_at || '') > (a.created_at || '') ? 1 : -1;
  });
  var invByType = {};
  inv.forEach(function (i) {
    var t = i.honey_type || "—";
    if (!invByType[t]) invByType[t] = { kg: 0, jars: {} };
    invByType[t].kg += Number(i.kg) || 0;
    var jk = i.jar_size || "—";
    invByType[t].jars[jk] = (invByType[t].jars[jk] || 0) + (Number(i.jar_count) || 0);
  });

  var tegleHtml = Object.keys(invByType).length
    ? Object.keys(invByType).map(function (t) {
        var e = invByType[t];
        var jl = Object.keys(e.jars).map(function (sz) { return e.jars[sz] + '×' + sz; }).join(', ');
        return '<div class="inv-row">' +
          '<span class="inv-type">' + esc(t) + '</span>' +
          '<span class="inv-detail">' + jl + ' · <b>' + e.kg.toFixed(1) + ' kg</b></span>' +
        '</div>';
      }).join('')
    : '<p class="muted" style="margin:.4rem 0">Nema tegli.</p>';

  // ── Prodaja ────────────────────────────────────────────────
  var sales = applyFilter(App._sales, "date").slice().sort(function (a, b) {
    return (b.date || '') > (a.date || '') ? 1 : -1;
  });
  var totalRev = sales.reduce(function (s, x) { return s + (Number(x.total) || 0); }, 0);
  var todayStr = new Date().toISOString().slice(0,10);
  var todayRev = sales.filter(function (x) { return x.date === todayStr; })
    .reduce(function (s, x) { return s + (Number(x.total) || 0); }, 0);

  var salesHtml = sales.slice(0, 10).map(function (s) {
    return '<div class="hist-row" onclick="GT.go(\'sale_form\',{id:\'' + s.id + '\'})" style="cursor:pointer">' +
      '<div class="hist-date">' + fmtDate(s.date) + '</div>' +
      '<div class="hist-body">' +
        esc(s.honey_type || '—') +
        (s.jar_size ? ' · ' + esc(s.jar_size) : '') +
        (s.qty ? ' · ' + s.qty + ' kom' : '') +
        '<br><b>' + fmtNum(s.total) + ' ' + esc(s.currency || cur) + '</b>' +
        (s.buyer ? ' · <span class="muted">' + esc(s.buyer) + '</span>' : '') +
        (s.notes ? '<br><small class="muted">' + esc(s.notes) + '</small>' : '') +
      '</div>' +
    '</div>';
  }).join('') || '<p class="muted">Nema prodaja.</p>';

  return '<div>' +
    filterHtml +
    '<div class="stat-grid">' +
      statTile('🪣', 'U kantama', totalKg.toFixed(1) + ' kg', '') +
      statTile('💰', 'Danas', fmtNum(todayRev) + ' ' + cur, '') +
      statTile('📊', 'Prihod (filter)', fmtNum(totalRev) + ' ' + cur, 'style="grid-column:span 2"') +
    '</div>' +
    '<div class="section-card">' +
      '<div class="section-header">' +
        '<span class="section-title" style="margin:0">🪣 Kante</span>' +
        '<div style="display:flex;gap:.4rem">' +
          '<button class="btn btn-secondary btn-sm" onclick="GT.importXLSX(\'stocks\')">📥 Excel</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="GT.go(\'stock_form\',{})">+ Unos</button>' +
        '</div>' +
      '</div>' +
      kanteHtml +
    '</div>' +
    '<div class="section-card" style="margin-top:.65rem">' +
      '<div class="section-header">' +
        '<span class="section-title" style="margin:0">🫙 Tegle</span>' +
        '<div style="display:flex;gap:.4rem">' +
          '<button class="btn btn-secondary btn-sm" onclick="GT.importXLSX(\'inventory\')">📥 Excel</button>' +
          '<button class="btn btn-secondary btn-sm" onclick="GT.go(\'inventory_form\',{})">+ Unos</button>' +
        '</div>' +
      '</div>' +
      tegleHtml +
    '</div>' +
    '<div class="section-card" style="margin-top:.65rem">' +
      '<div class="section-header">' +
        '<span class="section-title" style="margin:0">💰 Prodaja</span>' +
        '<button class="btn btn-primary btn-sm" onclick="GT.go(\'sale_form\',{})">+ Prodaja</button>' +
      '</div>' +
      salesHtml +
    '</div>' +
    (function () {
      var cfg = App._cfg || {};
      var cur = cfg.currency || "RSD";
      var prod = App._produce.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
      var byType = {};
      prod.forEach(function (p) {
        var t = p.product_type || 'drugo';
        if (!byType[t]) byType[t] = { qty: 0, unit: p.unit || '' };
        byType[t].qty += Number(p.quantity) || 0;
      });
      var summaryChips = Object.keys(byType).map(function (t) {
        var info = byType[t];
        var lbl = PRODUCE_TYPES.find(function (x) { return x.key === t; });
        return '<span class="type-chip">' + (lbl ? lbl.icon + ' ' + lbl.label : t) +
          ' ' + info.qty.toFixed(info.qty < 10 ? 2 : 0) + ' ' + info.unit + '</span>';
      }).join('');
      var rows = prod.slice(0,6).map(function (p) {
        var val = p.quantity && p.price_per_unit ? fmtNum(Math.round(p.quantity * p.price_per_unit)) + ' ' + cur : '';
        return '<div class="hist-row" onclick="GT.go(\'produce_form\',{id:\'' + p.id + '\'})" style="cursor:pointer">' +
          '<div class="hist-date">' + fmtDate(p.date) + '</div>' +
          '<div class="hist-body">' + produceLabel(p.product_type) +
            ' · <b>' + (Number(p.quantity)||0).toFixed(2) + ' ' + esc(p.unit||'') + '</b>' +
            (val ? ' · ' + val : '') +
            (p.notes ? '<br><small class="muted">' + esc(p.notes) + '</small>' : '') +
          '</div>' +
        '</div>';
      }).join('') || '<p class="muted">Nema unetih proizvoda.</p>';
      return '<div class="section-card" style="margin-top:.65rem">' +
        '<div class="section-header">' +
          '<span class="section-title" style="margin:0">🌿 Ostali proizvodi</span>' +
          '<button class="btn btn-secondary btn-sm" onclick="GT.go(\'produce_form\',{})">+ Unos</button>' +
        '</div>' +
        (summaryChips ? '<div class="type-chips" style="margin-bottom:.4rem">' + summaryChips + '</div>' : '') +
        rows +
        (prod.length > 6 ? '<p class="muted" style="font-size:.8rem;text-align:right;margin-top:.3rem;cursor:pointer" onclick="GT.nav(\'produce_list\')">Prikaži sve (' + prod.length + ') →</p>' : '') +
      '</div>';
    })() +
    (function () {
      var cfg = App._cfg || {};
      var cur = cfg.currency || "RSD";
      var exps = App._expenses.slice().sort(function (a,b) { return (b.date||'') > (a.date||'') ? 1 : -1; });
      var totalExp = exps.reduce(function (s, x) { return s + (Number(x.total) || 0); }, 0);
      var rows = exps.slice(0,8).map(function (e) {
        return '<div class="hist-row" onclick="GT.go(\'expense_form\',{id:\'' + e.id + '\'})" style="cursor:pointer">' +
          '<div class="hist-date">' + fmtDate(e.date) + '</div>' +
          '<div class="hist-body">' + esc(e.name || '—') +
            (e.quantity && e.price ? ' · ' + e.quantity + ' × ' + fmtNum(e.price) + ' ' + cur : '') +
            '<br><b>' + fmtNum(e.total || 0) + ' ' + cur + '</b>' +
            (e.notes ? '<br><small class="muted">' + esc(e.notes) + '</small>' : '') +
          '</div>' +
        '</div>';
      }).join('') || '<p class="muted">Nema unetih troškova.</p>';
      return '<div class="section-card" style="margin-top:.65rem">' +
        '<div class="section-header">' +
          '<span class="section-title" style="margin:0">📋 Troškovi</span>' +
          '<div style="display:flex;gap:.4rem">' +
            '<button class="btn btn-secondary btn-sm" onclick="GT.importXLSX(\'expenses\')">📥 Excel</button>' +
            '<button class="btn btn-secondary btn-sm" onclick="GT.go(\'expense_form\',{})">+ Unos</button>' +
          '</div>' +
        '</div>' +
        (exps.length ? '<div class="type-chips"><span class="type-chip">Ukupno ' + fmtNum(Math.round(totalExp)) + ' ' + cur + '</span></div>' : '') +
        rows +
        (exps.length > 8 ? '<p class="muted" style="font-size:.8rem;text-align:right;margin-top:.3rem">... još ' + (exps.length - 8) + ' stavki</p>' : '') +
      '</div>';
    })() +
  '</div>';
};

SCREENS.stock_form = function (p) {
  var h = p.id ? App._stocks.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var htypes = (cfg.honey_types || ["Livadski","Bagreni","Suncokretov","Mešani","Drugi"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.honey_type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni kantu' : 'Nova kanta') + '</h2>' +
    (h.id ? '<input type="hidden" id="stf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Broj / oznaka kante</label>' +
    '<input id="stf_kanta_id" type="text" placeholder="npr. K-1, 6, xx" value="' + esc(h.kanta_id || '') + '">' +
    '<label>Tip meda*</label>' +
    '<select id="stf_type"><option value="">— izaberi —</option>' + htypes + '</select>' +
    '<label>Kilogrami*</label>' +
    '<input id="stf_kg" type="number" step="0.5" min="0" placeholder="npr. 80" value="' + esc(h.kg || '') + '">' +
    '<label>Datum unosa</label>' +
    '<input id="stf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Napomena</label>' +
    '<textarea id="stf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveStock()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteStock(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.expense_form = function (p) {
  var h = p.id ? App._expenses.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var cur = cfg.currency || "RSD";
  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni trošak' : 'Novi trošak') + '</h2>' +
    (h.id ? '<input type="hidden" id="exf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Datum*</label>' +
    '<input id="exf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Naziv*</label>' +
    '<input id="exf_name" type="text" placeholder="npr. Šećer, Tegle 0.5kg..." value="' + esc(h.name || '') + '">' +
    '<label>Količina</label>' +
    '<input id="exf_qty" type="number" step="0.01" min="0" placeholder="npr. 100" value="' + esc(h.quantity || '') + '">' +
    '<label>Cena / jed. (' + cur + ')</label>' +
    '<input id="exf_price" type="number" step="1" min="0" placeholder="npr. 95" value="' + esc(h.price || '') + '" oninput="GT.calcExpTotal()">' +
    '<label>Ukupno (' + cur + ')*</label>' +
    '<input id="exf_total" type="number" step="1" min="0" placeholder="npr. 9500" value="' + esc(h.total || '') + '">' +
    '<label>Napomena</label>' +
    '<textarea id="exf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveExpense()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteExpense(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.inventory_form = function (p) {
  var h = p.id ? App._inventory.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var htypes = (cfg.honey_types || ["Livadski","Bagreni","Suncokretov","Mešani","Drugi"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.honey_type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');
  var jsizes = (cfg.jar_sizes || ["0.25 kg","0.5 kg","0.7 kg","1 kg","Drugo"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.jar_size === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni unos' : 'Unos u inventar') + '</h2>' +
    (h.id ? '<input type="hidden" id="ivf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Tip meda*</label>' +
    '<select id="ivf_type"><option value="">— izaberi —</option>' + htypes + '</select>' +
    '<label>Veličina tegle*</label>' +
    '<select id="ivf_jar"><option value="">— izaberi —</option>' + jsizes + '</select>' +
    '<label>Broj tegli*</label>' +
    '<input id="ivf_count" type="number" min="1" placeholder="npr. 20" value="' + esc(h.jar_count || '') + '">' +
    '<label>Ukupno kg (auto ako ostaviš prazno)</label>' +
    '<input id="ivf_kg" type="number" step="0.1" min="0" placeholder="opciono" value="' + esc(h.kg || '') + '">' +
    '<label>Napomena</label>' +
    '<textarea id="ivf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveInventory()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteInventory(\'' + h.id + '\')">Obriši</button>' : '') +
    '</div>' +
  '</div>';
};

SCREENS.sale_form = function (p) {
  var h = p.id ? App._sales.find(function (x) { return x.id === p.id; }) : {};
  h = h || {};
  var cfg = App._cfg || {};
  var cur = cfg.currency || 'RSD';
  var htypes = (cfg.honey_types || ["Livadski","Bagreni","Suncokretov","Mešani","Drugi"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.honey_type === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');
  var jsizes = (cfg.jar_sizes || ["0.25 kg","0.5 kg","0.7 kg","1 kg","Drugo"]).map(function (t) {
    return '<option value="' + esc(t) + '"' + (h.jar_size === t ? ' selected' : '') + '>' + esc(t) + '</option>';
  }).join('');

  return '<div class="form-screen">' +
    '<h2>' + (h.id ? 'Izmeni prodaju' : 'Nova prodaja') + '</h2>' +
    (h.id ? '<input type="hidden" id="sf_id" value="' + esc(h.id) + '">' : '') +
    '<label>Datum*</label>' +
    '<input id="sf_date" type="date" value="' + (h.date || new Date().toISOString().slice(0,10)) + '">' +
    '<label>Tip meda*</label>' +
    '<select id="sf_type"><option value="">— izaberi —</option>' + htypes + '</select>' +
    '<label>Veličina tegle</label>' +
    '<select id="sf_jar"><option value="">— izaberi —</option>' + jsizes + '</select>' +
    '<label>Količina (kom)*</label>' +
    '<input id="sf_qty" type="number" min="1" placeholder="npr. 3" value="' + esc(h.qty || '') + '">' +
    '<label>Ukupan iznos (' + cur + ')*</label>' +
    '<div class="input-row">' +
      '<input id="sf_total" type="number" step="50" min="0" placeholder="npr. 3600" style="flex:1" value="' + esc(h.total || '') + '">' +
      '<span class="input-suffix">' + cur + '</span>' +
    '</div>' +
    '<label>Kupac (opciono)</label>' +
    '<input id="sf_buyer" type="text" placeholder="npr. Marko P." value="' + esc(h.buyer || '') + '">' +
    '<label>Napomena</label>' +
    '<textarea id="sf_notes" rows="2">' + esc(h.notes || '') + '</textarea>' +
    '<div class="btn-row mt8">' +
      '<button class="btn btn-primary" onclick="GT.saveSale()">Sačuvaj</button>' +
      (h.id ? '<button class="btn btn-danger" onclick="GT.deleteSale(\'' + h.id + '\')">Obriši</button>' : '') +
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
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<h3>Pčelinjaci</h3>' +
        '<span class="badge badge-muted">' + App._apiaries.length + '</span>' +
      '</div>' +
      '<p class="muted" style="margin:.3rem 0 .5rem;font-size:.82rem">Upravljaj lokacijama i dodeljivanjem košnica.</p>' +
      '<button class="btn btn-secondary" onclick="GT.nav(\'apiaries\')">Upravljaj pčelinjacima →</button>' +
    '</div>' +
    '<div class="card mt8">' +
      '<h3>Evidencija (dnevnici)</h3>' +
      '<p class="muted" style="margin:.3rem 0 .5rem;font-size:.82rem">Hranjenje, varroa, tretmani, nukleusi, uzgoj matica, zimovanje.</p>' +
      '<button class="btn btn-secondary" onclick="GT.nav(\'evidencija\')">📋 Otvori Evidenciju →</button>' +
    '</div>' +
    '<div class="card mt8">' +
      '<h3>Backup &amp; Restore</h3>' +
      '<p class="muted" style="margin:.3rem 0 .5rem;font-size:.82rem">Sačuvaj sve podatke u JSON fajl ili ih povrati iz prethodnog backupa.</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn-primary" onclick="GT.backup()">💾 Backup (JSON)</button>' +
        '<button class="btn btn-secondary" onclick="GT.restorePick()">📥 Restore</button>' +
      '</div>' +
    '</div>' +
    '<div class="card mt8">' +
      '<h3>Export (CSV)</h3>' +
      '<p class="muted" style="margin-bottom:.5rem;font-size:.8rem">Preuzima CSV koji Excel/Sheets otvara direktno. Poštuje aktivni filter u Tezgi.</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn-secondary" onclick="GT.exportCSV(\'prodaja\')">📊 Prodaja</button>' +
        '<button class="btn btn-secondary" onclick="GT.exportCSV(\'berba\')">📊 Berba</button>' +
      '</div>' +
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
    inspection_form: "hives", extraction_form: "extractions",
    inventory_form: "tezga", sale_form: "tezga", stock_form: "tezga", expense_form: "tezga",
    produce_list: "tezga", produce_form: "tezga",
    extractions: "evidencija", extraction_form: "extractions",
    treatments: "evidencija", treatment_form: "treatments",
    swarms: "evidencija", swarm_form: "swarms",
    feedings: "evidencija", feeding_form: "feedings",
    varroa: "evidencija", varroa_form: "varroa",
    nuclei: "evidencija", nucleus_form: "nuclei",
    queen_rearing: "evidencija", queen_form: "queen_rearing",
    winterization: "evidencija", winterization_form: "winterization",
    analytics: "home", apiaries: "settings", apiary_form: "apiaries"
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
  // Preserve existing photo if not changed
  var photoData = (document.getElementById("hf_photo_data") || {}).value || "";
  var existingHive = idEl ? App._hives.find(function (x) { return x.id === idEl.value; }) : null;
  var photo = photoData === "HAS_PHOTO"
    ? (existingHive ? existingHive.photo || "" : "")
    : (photoData.startsWith("data:") ? photoData : "");

  var obj = {
    id:         idEl ? idEl.value : undefined,
    label:      label.trim(),
    apiary_id:  (document.getElementById("hf_apiary") || {}).value || "",
    location:   (document.getElementById("hf_location") || {}).value || "",
    hive_type:  (document.getElementById("hf_type") || {}).value || "",
    queen_year: parseInt((document.getElementById("hf_queen") || {}).value) || null,
    status:     (document.getElementById("hf_status") || {}).value || "active",
    notes:      (document.getElementById("hf_notes") || {}).value || "",
    photo:      photo
  };
  HStore.save("hives", obj).then(function () { GT.nav("hives"); });
};

GT.deleteHive = function (id) {
  if (!confirm("Obrisati košnicu? Inspekcije ostaju u bazi.")) return;
  HStore.del("hives", id).then(function () { GT.nav("hives"); });
};

GT.pickPhoto = function () {
  var el = document.getElementById("hf_photo_input");
  if (el) el.click();
};

GT.handlePhoto = function (input) {
  if (!input.files || !input.files[0]) return;
  compressImage(input.files[0], function (dataUrl) {
    var preview = document.getElementById("hf_photo_preview");
    var dataEl  = document.getElementById("hf_photo_data");
    if (preview) {
      preview.outerHTML = '<img id="hf_photo_preview" class="hive-photo-preview" src="' + dataUrl + '" alt="Košnica">';
    }
    if (dataEl) dataEl.value = dataUrl;
  });
};

GT.removePhoto = function () {
  var preview = document.getElementById("hf_photo_preview");
  var dataEl  = document.getElementById("hf_photo_data");
  if (preview) preview.outerHTML = '<div id="hf_photo_preview" class="photo-placeholder">📷 Nema slike</div>';
  if (dataEl)  dataEl.value = "";
};

GT.syncNextDays = function () {
  var days = parseInt((document.getElementById("if_next_days") || {}).value) || 0;
  var dateEl = document.getElementById("if_next_date");
  if (!dateEl) return;
  if (!days) { dateEl.value = ""; return; }
  var base = (document.getElementById("if_date") || {}).value || new Date().toISOString().slice(0, 10);
  var d = new Date(base);
  d.setDate(d.getDate() + days);
  dateEl.value = d.toISOString().slice(0, 10);
};

GT.syncNextDate = function () {
  var dateVal = ((document.getElementById("if_next_date") || {}).value) || "";
  var daysEl  = document.getElementById("if_next_days");
  if (!daysEl) return;
  if (!dateVal) { daysEl.value = ""; return; }
  var base = (document.getElementById("if_date") || {}).value || new Date().toISOString().slice(0, 10);
  var diff = Math.round((new Date(dateVal) - new Date(base)) / 86400000);
  daysEl.value = diff > 0 ? diff : "";
};

GT.saveInspection = function () {
  var hive_id = (document.getElementById("if_hive") || {}).value || "";
  var date    = (document.getElementById("if_date") || {}).value || "";
  if (!hive_id) { alert("Izaberi košnicu."); return; }
  if (!date)    { alert("Unesi datum."); return; }
  var obj = {
    hive_id:          hive_id,
    date:             date,
    queen_seen:       (document.getElementById("if_queen_val") || {}).value !== "false",
    brood:            (document.getElementById("if_brood") || {}).value || "ok",
    strength:         parseInt((document.getElementById("if_strength") || {}).value) || 3,
    honey_stores:     (document.getElementById("if_stores") || {}).value || "good",
    varroa:           parseFloat((document.getElementById("if_varroa") || {}).value) || null,
    treatment:        (document.getElementById("if_treatment") || {}).value || "",
    notes:            (document.getElementById("if_notes") || {}).value || "",
    next_inspection:  (document.getElementById("if_next_date") || {}).value || ""
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

GT.pickColor = function (color) {
  var el = document.getElementById("af_color");
  if (el) el.value = color;
  document.querySelectorAll(".color-btn").forEach(function (b) {
    b.className = "color-btn" + (b.getAttribute("data-color") === color ? " color-btn-sel" : "");
  });
};

GT.saveApiary = function () {
  var name = ((document.getElementById("af_name") || {}).value || "").trim();
  if (!name) { alert("Naziv je obavezan."); return; }
  var idEl = document.getElementById("af_id");
  var obj = {
    id:       idEl ? idEl.value : undefined,
    name:     name,
    location: ((document.getElementById("af_location") || {}).value || "").trim(),
    color:    (document.getElementById("af_color") || {}).value || APIARY_COLORS[0],
    notes:    ((document.getElementById("af_notes") || {}).value || "").trim()
  };
  HStore.save("apiaries", obj).then(function () { GT.nav("apiaries"); });
};

GT.deleteApiary = function (id) {
  var count = App._hives.filter(function (h) { return h.apiary_id === id; }).length;
  var msg = count
    ? "Ovaj pčelinjak ima " + count + " košnica. Košnice ostaju, samo gube dodelu. Obrisati?"
    : "Obrisati pčelinjak?";
  if (!confirm(msg)) return;
  HStore.del("apiaries", id).then(function () { GT.nav("apiaries"); });
};

GT.setActiveApiary = function (id) {
  App._activeApiary = id;
  renderScreen();
};

GT.setAnApiary = function (id) {
  App._analyticsApiary = id;
  renderScreen();
};

/* ─── BACKUP / RESTORE ──────────────────────────────────── */

GT.backup = function () {
  Promise.all(ALL_STORES.map(function (s) { return HStore.all(s); })).then(function (results) {
    var data = {};
    ALL_STORES.forEach(function (s, i) { data[s] = results[i]; });
    var json = JSON.stringify({ app: "honey-toolbox", version: "0.8.0", exported: new Date().toISOString(), data: data }, null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href  = url;
    a.download = "honey-backup-" + new Date().toISOString().slice(0,10) + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};

GT.restorePick = function () {
  var input = document.createElement("input");
  input.type = "file"; input.accept = ".json";
  input.onchange = function () {
    var file = input.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var backup = JSON.parse(e.target.result);
        if (!backup.data || !backup.app) { alert("Neispravan backup fajl."); return; }
        if (!confirm("Ovo će OBRISATI sve postojeće podatke i zameniti ih backupom.\n\nNastaviti?")) return;
        var clears = ALL_STORES.map(function (s) { return HStore.clear(s); });
        Promise.all(clears).then(function () {
          var saves = ALL_STORES.map(function (s) {
            var items = backup.data[s] || [];
            return items.length ? HStore.bulkSave(s, items) : Promise.resolve();
          });
          return Promise.all(saves);
        }).then(function () {
          alert("Restore završen. App se restartuje.");
          window.location.reload();
        });
      } catch (err) { alert("Greška: " + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
};

/* ─── TREATMENTS ────────────────────────────────────────── */

GT.saveTreatment = function () {
  var hive_id = (document.getElementById("tf_hive") || {}).value || "";
  var product = (document.getElementById("tf_product") || {}).value || "";
  var start   = (document.getElementById("tf_start") || {}).value || "";
  if (!hive_id) { alert("Izaberi košnicu."); return; }
  if (!product) { alert("Izaberi preparat."); return; }
  if (!start)   { alert("Unesi datum početka."); return; }
  var idEl = document.getElementById("tf_id");
  var obj  = {
    id:         idEl ? idEl.value : undefined,
    hive_id:    hive_id,
    product:    product,
    start_date: start,
    end_date:   (document.getElementById("tf_end") || {}).value || "",
    dose:       (document.getElementById("tf_dose") || {}).value || "",
    notes:      (document.getElementById("tf_notes") || {}).value || ""
  };
  var backTo = (document.getElementById("tf_hive") || {}).value;
  HStore.save("treatments", obj).then(function () {
    backTo ? GT.go("hive_detail", { id: backTo }) : GT.nav("treatments");
  });
};

GT.deleteTreatment = function (id) {
  if (!confirm("Obrisati tretman?")) return;
  var t = App._treatments.find(function (x) { return x.id === id; });
  HStore.del("treatments", id).then(function () {
    t && t.hive_id ? GT.go("hive_detail", { id: t.hive_id }) : GT.nav("treatments");
  });
};

/* ─── SWARMS ────────────────────────────────────────────── */

GT.saveSwarm = function () {
  var date    = (document.getElementById("swf_date") || {}).value || "";
  var outcome = (document.getElementById("swf_outcome") || {}).value || "";
  if (!date)    { alert("Unesi datum."); return; }
  if (!outcome) { alert("Izaberi ishod."); return; }
  var idEl = document.getElementById("swf_id");
  var obj  = {
    id:          idEl ? idEl.value : undefined,
    date:        date,
    hive_id:     (document.getElementById("swf_hive") || {}).value || "",
    outcome:     outcome,
    new_hive_id: (document.getElementById("swf_new_hive") || {}).value || "",
    notes:       (document.getElementById("swf_notes") || {}).value || ""
  };
  HStore.save("swarms", obj).then(function () { GT.nav("swarms"); });
};

GT.deleteSwarm = function (id) {
  if (!confirm("Obrisati zapis o roju?")) return;
  HStore.del("swarms", id).then(function () { GT.nav("swarms"); });
};

/* ─── HRANJENJE ACTIONS ─────────────────────────────────── */

GT.showFeedScope = function (val) {
  var aWrap = document.getElementById("ff_apiary_wrap");
  var hWrap = document.getElementById("ff_hive_wrap");
  if (aWrap) aWrap.style.display = val === 'apiary' ? 'block' : 'none';
  if (hWrap) hWrap.style.display = val === 'hive' ? 'block' : 'none';
};

GT.saveFeeding = function () {
  var feedType = (document.getElementById("ff_type") || {}).value || "";
  var amount   = parseFloat((document.getElementById("ff_amount") || {}).value) || 0;
  var date     = (document.getElementById("ff_date") || {}).value || "";
  if (!feedType) { alert("Izaberi tip hrane."); return; }
  if (!amount)   { alert("Unesi količinu."); return; }
  if (!date)     { alert("Unesi datum."); return; }

  var scopeEl = document.querySelector('input[name="ff_scope"]:checked');
  var scope   = scopeEl ? scopeEl.value : 'all';
  var hive_ids  = [];
  var apiary_id = '';
  if (scope === 'hive') {
    var hid = (document.getElementById("ff_hive") || {}).value || "";
    if (hid) hive_ids = [hid];
  } else if (scope === 'apiary') {
    apiary_id = (document.getElementById("ff_apiary") || {}).value || "";
  }

  var idEl = document.getElementById("ff_id");
  var obj = {
    id:        idEl ? idEl.value : undefined,
    feed_type: feedType,
    amount:    amount,
    unit:      (document.getElementById("ff_unit") || {}).value || "kg",
    date:      date,
    hive_ids:  hive_ids,
    apiary_id: apiary_id,
    notes:     (document.getElementById("ff_notes") || {}).value || ""
  };
  HStore.save("feedings", obj).then(function () { GT.nav("feedings"); });
};

GT.deleteFeeding = function (id) {
  if (!confirm("Obrisati hranjenje?")) return;
  HStore.del("feedings", id).then(function () { GT.nav("feedings"); });
};

/* ─── VARROA ACTIONS ────────────────────────────────────── */

GT.saveVarroa = function () {
  var hive_id = (document.getElementById("vf_hive") || {}).value || "";
  var method  = (document.getElementById("vf_method") || {}).value || "";
  var date    = (document.getElementById("vf_date") || {}).value || "";
  if (!hive_id) { alert("Izaberi košnicu."); return; }
  if (!method)  { alert("Izaberi metodu."); return; }
  if (!date)    { alert("Unesi datum."); return; }

  var mites  = (document.getElementById("vf_mites") || {}).value;
  var sample = parseInt((document.getElementById("vf_sample") || {}).value) || 100;
  var idEl   = document.getElementById("vf_id");
  var obj = {
    id:          idEl ? idEl.value : undefined,
    hive_id:     hive_id,
    method:      method,
    date:        date,
    mites_found: mites !== '' ? parseFloat(mites) : undefined,
    sample_size: sample,
    notes:       (document.getElementById("vf_notes") || {}).value || ""
  };
  HStore.save("varroa_checks", obj).then(function () { GT.nav("varroa"); });
};

GT.deleteVarroa = function (id) {
  if (!confirm("Obrisati merenje?")) return;
  HStore.del("varroa_checks", id).then(function () { GT.nav("varroa"); });
};

/* ─── NUKLEUSI ACTIONS ──────────────────────────────────── */

GT.saveNucleus = function () {
  var date = (document.getElementById("nf_date") || {}).value || "";
  if (!date) { alert("Unesi datum podjele."); return; }
  var idEl = document.getElementById("nf_id");
  var obj = {
    id:             idEl ? idEl.value : undefined,
    name:           (document.getElementById("nf_name") || {}).value || "",
    date:           date,
    source_hive_id: (document.getElementById("nf_source") || {}).value || "",
    frames:         (document.getElementById("nf_frames") || {}).value || "",
    has_queen_cell: !!(document.getElementById("nf_has_qcell") || {}).checked,
    has_queen:      !!(document.getElementById("nf_has_queen") || {}).checked,
    has_brood:      !!(document.getElementById("nf_has_brood") || {}).checked,
    status:         (document.getElementById("nf_status") || {}).value || "active",
    dest_hive_id:   (document.getElementById("nf_dest") || {}).value || "",
    notes:          (document.getElementById("nf_notes") || {}).value || ""
  };
  HStore.save("nuclei", obj).then(function () { GT.nav("nuclei"); });
};

GT.deleteNucleus = function (id) {
  if (!confirm("Obrisati nukleus?")) return;
  HStore.del("nuclei", id).then(function () { GT.nav("nuclei"); });
};

/* ─── UZGOJ MATICA ACTIONS ──────────────────────────────── */

GT.saveQueenRearing = function () {
  var grafting = (document.getElementById("qf_grafting") || {}).value || "";
  if (!grafting) { alert("Unesi datum grafinga."); return; }
  var idEl = document.getElementById("qf_id");
  var obj = {
    id:             idEl ? idEl.value : undefined,
    name:           (document.getElementById("qf_name") || {}).value || "",
    grafting_date:  grafting,
    source_hive_id: (document.getElementById("qf_source") || {}).value || "",
    larvae_grafted: parseInt((document.getElementById("qf_larvae") || {}).value) || undefined,
    cells_accepted: parseInt((document.getElementById("qf_accepted") || {}).value) || undefined,
    capping_date:   (document.getElementById("qf_capping") || {}).value || "",
    emergence_date: (document.getElementById("qf_emergence") || {}).value || "",
    intro_date:     (document.getElementById("qf_intro") || {}).value || "",
    status:         (document.getElementById("qf_status") || {}).value || "in_progress",
    notes:          (document.getElementById("qf_notes") || {}).value || ""
  };
  HStore.save("queen_rearing", obj).then(function () { GT.nav("queen_rearing"); });
};

GT.deleteQueenRearing = function (id) {
  if (!confirm("Obrisati uzgoj?")) return;
  HStore.del("queen_rearing", id).then(function () { GT.nav("queen_rearing"); });
};

/* ─── ZIMOVANJE ACTIONS ─────────────────────────────────── */

GT.saveWinterization = function () {
  var year = parseInt((document.getElementById("wf_year") || {}).value) || new Date().getFullYear();
  var idEl = document.getElementById("wf_id");
  var popEl = document.getElementById("wf_pop");
  var obj = {
    id:               idEl ? idEl.value : undefined,
    year:             year,
    apiary_id:        ((document.getElementById("wf_apiary") || {}).value) || "",
    date:             (document.getElementById("wf_date") || {}).value || "",
    winter_feed_kg:   parseFloat((document.getElementById("wf_feed") || {}).value) || 0,
    population_check: popEl ? parseInt(popEl.value) || undefined : undefined,
    entrance_reduced: !!(document.getElementById("wf_entrance") || {}).checked,
    mouse_guard:      !!(document.getElementById("wf_mouse") || {}).checked,
    ventilation_ok:   !!(document.getElementById("wf_ventilation") || {}).checked,
    insulation_ok:    !!(document.getElementById("wf_insulation") || {}).checked,
    notes:            (document.getElementById("wf_notes") || {}).value || ""
  };
  HStore.save("winterization", obj).then(function () { GT.nav("winterization"); });
};

GT.deleteWinterization = function (id) {
  if (!confirm("Obrisati zapis o zimovanju?")) return;
  HStore.del("winterization", id).then(function () { GT.nav("winterization"); });
};

GT.updateProduceUnits = function () {
  var sel  = (document.getElementById("pf_type") || {}).value || "vosak";
  var type = PRODUCE_TYPES.find(function (t) { return t.key === sel; }) || PRODUCE_TYPES[0];
  var unitEl = document.getElementById("pf_unit");
  if (!unitEl) return;
  unitEl.innerHTML = type.units.map(function (u) {
    return '<option value="' + u + '">' + u + '</option>';
  }).join('');
};

GT.saveProduce = function () {
  var type = (document.getElementById("pf_type") || {}).value || "";
  var qty  = parseFloat((document.getElementById("pf_qty") || {}).value) || 0;
  if (!type) { alert("Izaberi vrstu."); return; }
  if (!qty)  { alert("Unesi količinu."); return; }
  var idEl = document.getElementById("pf_id");
  var cfg  = App._cfg || {};
  var obj  = {
    id:            idEl ? idEl.value : undefined,
    product_type:  type,
    quantity:      qty,
    unit:          (document.getElementById("pf_unit") || {}).value || "kg",
    date:          (document.getElementById("pf_date") || {}).value || "",
    price_per_unit:parseFloat((document.getElementById("pf_price") || {}).value) || null,
    currency:      cfg.currency || "RSD",
    notes:         (document.getElementById("pf_notes") || {}).value || ""
  };
  HStore.save("produce", obj).then(function () { GT.nav("tezga"); });
};

GT.deleteProduce = function (id) {
  if (!confirm("Obrisati unos?")) return;
  HStore.del("produce", id).then(function () { GT.nav("tezga"); });
};

GT.saveStock = function () {
  var type = (document.getElementById("stf_type") || {}).value || "";
  var kg   = parseFloat((document.getElementById("stf_kg") || {}).value) || 0;
  var date = (document.getElementById("stf_date") || {}).value || "";
  if (!type) { alert("Izaberi tip meda."); return; }
  if (!kg)   { alert("Unesi kilograme."); return; }
  var idEl = document.getElementById("stf_id");
  var obj = {
    id:         idEl ? idEl.value : undefined,
    kanta_id:   (document.getElementById("stf_kanta_id") || {}).value || "",
    honey_type: type,
    kg:         kg,
    date:       date,
    notes:      (document.getElementById("stf_notes") || {}).value || ""
  };
  HStore.save("stocks", obj).then(function () { GT.nav("tezga"); });
};

GT.deleteStock = function (id) {
  if (!confirm("Obrisati unos kante?")) return;
  HStore.del("stocks", id).then(function () { GT.nav("tezga"); });
};

GT.calcExpTotal = function () {
  var qty   = parseFloat((document.getElementById("exf_qty") || {}).value) || 0;
  var price = parseFloat((document.getElementById("exf_price") || {}).value) || 0;
  if (qty && price) {
    var totEl = document.getElementById("exf_total");
    if (totEl) totEl.value = Math.round(qty * price);
  }
};

GT.saveExpense = function () {
  var name  = (document.getElementById("exf_name") || {}).value || "";
  var total = parseFloat((document.getElementById("exf_total") || {}).value) || 0;
  var date  = (document.getElementById("exf_date") || {}).value || "";
  if (!name)  { alert("Unesi naziv troška."); return; }
  if (!total) { alert("Unesi ukupan iznos."); return; }
  var idEl = document.getElementById("exf_id");
  var obj = {
    id:       idEl ? idEl.value : undefined,
    date:     date,
    name:     name,
    quantity: parseFloat((document.getElementById("exf_qty") || {}).value) || 0,
    price:    parseFloat((document.getElementById("exf_price") || {}).value) || 0,
    total:    total,
    notes:    (document.getElementById("exf_notes") || {}).value || ""
  };
  HStore.save("expenses", obj).then(function () { GT.nav("tezga"); });
};

GT.deleteExpense = function (id) {
  if (!confirm("Obrisati trošak?")) return;
  HStore.del("expenses", id).then(function () { GT.nav("tezga"); });
};

GT.setFilter = function (key, val) {
  App._filter[key] = val;
  renderScreen();
};

GT.clearFilter = function () {
  App._filter = { honey_type: "", date_from: "", date_to: "", min_kg: "" };
  renderScreen();
};

GT.importXLSX = function (storeType) {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls";
  input.onchange = function () {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
        // For expenses: try "troskovi" sheet first
        var sheetName = wb.SheetNames[0];
        if (storeType === "expenses") {
          var troskSheet = wb.SheetNames.find(function (n) { return n.toLowerCase().indexOf("tro") === 0; });
          if (troskSheet) sheetName = troskSheet;
        }
        // For stocks: try "medara" sheet first
        if (storeType === "stocks") {
          var medaraSheet = wb.SheetNames.find(function (n) { return n.toLowerCase() === "medara"; });
          if (medaraSheet) sheetName = medaraSheet;
        }
        var ws = wb.Sheets[sheetName];
        var rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) { alert("Fajl je prazan."); return; }

        var saves = [];
        var skipped = 0;

        function parseSrbDate(val) {
          if (!val) return "";
          if (val instanceof Date) return val.toISOString().slice(0,10);
          var s = String(val).trim();
          // DD.MM.YYYY. or DD.MM.YYYY
          var m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
          if (m) return m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0');
          var d = new Date(val);
          return isNaN(d) ? "" : d.toISOString().slice(0,10);
        }

        if (storeType === "stocks") {
          // Auto-detect Nikola's medara format by checking headers
          var firstRowKeys = Object.keys(rows[0] || {}).map(function (k) { return k.toLowerCase(); });
          var isMedaraFmt = firstRowKeys.indexOf("vrsta meda") >= 0 || firstRowKeys.indexOf("broj kante") >= 0;

          if (isMedaraFmt) {
            // Nikola's medara sheet: broj kante | datum zadnje promene | vrsta meda | datum vrcanja | opis | kolicina
            rows.forEach(function (r) {
              var type = String(r["vrsta meda"] || r["Vrsta meda"] || "").trim().toLowerCase();
              var kg   = parseFloat(r["kolicina"] || r["Kolicina"] || r["količina"] || r["Količina"] || 0);
              if (!type || type === "prazno" || !kg) { skipped++; return; }
              var kantaId = String(r["broj kante"] || r["Broj kante"] || "").trim();
              var dateStr = parseSrbDate(r["datum zadnje promene"] || r["Datum zadnje promene"] || "");
              var godVrc  = String(r["datum vrcanja"] || r["Datum vrcanja"] || "").trim();
              var opis    = String(r["opis"] || r["Opis"] || "").trim();
              var notes   = (godVrc ? "Vrčanje: " + godVrc + ". " : "") + opis;
              // Capitalize honey type
              var honeyType = type.charAt(0).toUpperCase() + type.slice(1);
              saves.push(HStore.save("stocks", {
                kanta_id: kantaId, honey_type: honeyType, kg: kg, date: dateStr, notes: notes.trim()
              }));
            });
          } else {
            // Standard format: Tip meda | Kg | Datum | Napomena
            rows.forEach(function (r) {
              var type = String(r["Tip meda"] || r["tip meda"] || r["honey_type"] || "").trim();
              var kg   = parseFloat(r["Kg"] || r["kg"] || r["KG"] || 0);
              if (!type || !kg) { skipped++; return; }
              saves.push(HStore.save("stocks", {
                honey_type: type, kg: kg,
                date: parseSrbDate(r["Datum"] || r["datum"] || r["date"] || ""),
                notes: String(r["Napomena"] || r["napomena"] || r["notes"] || "").trim()
              }));
            });
          }
        } else if (storeType === "expenses") {
          // Nikola's troskovi sheet: datum | naziv | kolicina | cena | ukupno | opis
          rows.forEach(function (r) {
            var name  = String(r["naziv"] || r["Naziv"] || "").trim();
            var total = parseFloat(r["ukupno"] || r["Ukupno"] || 0);
            if (!name && !total) { skipped++; return; }
            var qty   = parseFloat(r["kolicina"] || r["Kolicina"] || r["količina"] || r["Količina"] || 0);
            var price = parseFloat(r["cena"] || r["Cena"] || r["cijena"] || 0);
            if (!total && qty && price) total = Math.round(qty * price);
            saves.push(HStore.save("expenses", {
              date:     parseSrbDate(r["datum"] || r["Datum"] || ""),
              name:     name,
              quantity: qty,
              price:    price,
              total:    total,
              notes:    String(r["opis"] || r["Opis"] || "").trim()
            }));
          });
        } else {
          // Expected columns: Tip meda | Veličina tegle | Broj tegli | Kg | Napomena
          rows.forEach(function (r) {
            var type  = String(r["Tip meda"] || r["tip meda"] || r["honey_type"] || "").trim();
            var jar   = String(r["Veličina tegle"] || r["velicina tegle"] || r["jar_size"] || "").trim();
            var count = parseInt(r["Broj tegli"] || r["broj tegli"] || r["jar_count"] || 0);
            if (!type || !count) { skipped++; return; }
            var kgVal = parseFloat(r["Kg"] || r["kg"] || 0) || 0;
            if (!kgVal && jar) {
              var m = jar.match(/[\d.]+/);
              kgVal = m ? parseFloat(m[0]) * count : 0;
            }
            saves.push(HStore.save("inventory", {
              honey_type: type, jar_size: jar, jar_count: count, kg: kgVal,
              notes: String(r["Napomena"] || r["napomena"] || r["notes"] || "").trim()
            }));
          });
        }

        Promise.all(saves).then(function () {
          alert('Uvezeno: ' + saves.length + ' redova' + (skipped ? ', preskočeno: ' + skipped : '') + '.');
          GT.nav("tezga");
        });
      } catch (err) {
        alert("Greška pri čitanju fajla: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  input.click();
};

GT.saveInventory = function () {
  var type  = (document.getElementById("ivf_type") || {}).value || "";
  var jar   = (document.getElementById("ivf_jar") || {}).value || "";
  var count = parseInt((document.getElementById("ivf_count") || {}).value) || 0;
  if (!type)  { alert("Izaberi tip meda."); return; }
  if (!jar)   { alert("Izaberi veličinu tegle."); return; }
  if (!count) { alert("Unesi broj tegli."); return; }

  // Auto-calculate kg from jar size if not provided
  var kgEl = parseFloat((document.getElementById("ivf_kg") || {}).value) || 0;
  if (!kgEl) {
    var match = jar.match(/[\d.]+/);
    kgEl = match ? parseFloat(match[0]) * count : 0;
  }

  var idEl = document.getElementById("ivf_id");
  var obj = {
    id:         idEl ? idEl.value : undefined,
    honey_type: type,
    jar_size:   jar,
    jar_count:  count,
    kg:         kgEl,
    notes:      (document.getElementById("ivf_notes") || {}).value || ""
  };
  HStore.save("inventory", obj).then(function () { GT.nav("tezga"); });
};

GT.deleteInventory = function (id) {
  if (!confirm("Obrisati unos?")) return;
  HStore.del("inventory", id).then(function () { GT.nav("tezga"); });
};

GT.saveSale = function () {
  var date  = (document.getElementById("sf_date") || {}).value || "";
  var type  = (document.getElementById("sf_type") || {}).value || "";
  var qty   = parseInt((document.getElementById("sf_qty") || {}).value) || 0;
  var total = parseFloat((document.getElementById("sf_total") || {}).value) || 0;
  if (!date)  { alert("Unesi datum."); return; }
  if (!type)  { alert("Izaberi tip meda."); return; }
  if (!qty)   { alert("Unesi količinu."); return; }
  if (!total) { alert("Unesi iznos."); return; }

  var idEl = document.getElementById("sf_id");
  var cfg  = App._cfg || {};
  var obj = {
    id:         idEl ? idEl.value : undefined,
    date:       date,
    honey_type: type,
    jar_size:   (document.getElementById("sf_jar") || {}).value || "",
    qty:        qty,
    total:      total,
    currency:   cfg.currency || "RSD",
    buyer:      (document.getElementById("sf_buyer") || {}).value || "",
    notes:      (document.getElementById("sf_notes") || {}).value || ""
  };
  HStore.save("sales", obj).then(function () { GT.nav("tezga"); });
};

GT.deleteSale = function (id) {
  if (!confirm("Obrisati prodaju?")) return;
  HStore.del("sales", id).then(function () { GT.nav("tezga"); });
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

GT.exportCSV = function (type) {
  var rows, headers, filename;
  var cfg = App._cfg || {};
  var cur = cfg.currency || "RSD";
  var f   = App._filter;

  function filterRows(arr, dateField, kgField) {
    return arr.filter(function (r) {
      if (f.honey_type && r.honey_type !== f.honey_type) return false;
      if (f.date_from && r[dateField] && r[dateField] < f.date_from) return false;
      if (f.date_to   && r[dateField] && r[dateField] > f.date_to)   return false;
      if (f.min_kg && kgField && (Number(r[kgField]) || 0) < Number(f.min_kg)) return false;
      return true;
    });
  }

  var filterLabel = "";
  if (f.honey_type || f.date_from || f.date_to || f.min_kg) {
    var parts = [];
    if (f.honey_type) parts.push(f.honey_type);
    if (f.date_from)  parts.push("od " + f.date_from);
    if (f.date_to)    parts.push("do " + f.date_to);
    if (f.min_kg)     parts.push("min " + f.min_kg + "kg");
    filterLabel = "-" + parts.join("_").replace(/\s/g, "");
  }

  if (type === "prodaja") {
    headers = ["Datum","Tip meda","Tegla","Kom","Ukupno (" + cur + ")","Kupac","Napomena"];
    rows = filterRows(App._sales, "date", null).slice()
      .sort(function (a, b) { return a.date > b.date ? 1 : -1; })
      .map(function (s) {
        return [s.date, s.honey_type||"", s.jar_size||"", s.qty||"", s.total||"", s.buyer||"", s.notes||""];
      });
    filename = "honey-prodaja" + filterLabel + "-" + new Date().toISOString().slice(0,10) + ".csv";
  } else {
    headers = ["Datum berbe","Tip meda","Kg","Cena/kg (" + cur + ")","Vrednost","Košnice","Napomena"];
    rows = filterRows(App._extractions, "date", "kg").slice()
      .sort(function (a, b) { return a.date > b.date ? 1 : -1; })
      .map(function (e) {
        var val = e.kg && e.price_per_kg ? Math.round(e.kg * e.price_per_kg) : "";
        var hNames = (e.hive_ids || []).map(hiveLabel).join(" / ");
        return [e.date, e.honey_type||"", e.kg||"", e.price_per_kg||"", val, hNames, e.notes||""];
      });
    filename = "honey-berba" + filterLabel + "-" + new Date().toISOString().slice(0,10) + ".csv";
  }

  var BOM = "﻿";
  var csv = BOM + [headers].concat(rows).map(function (r) {
    return r.map(function (c) {
      var s = String(c).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? '"' + s + '"' : s;
    }).join(";");
  }).join("\r\n");

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement("a");
  a.href  = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ─── RENDER ─────────────────────────────────────────────── */

var NAV_TABS = [
  { id: "home",       icon: "🏠", label: "Home"      },
  { id: "hives",      icon: "🐝", label: "Košnice"   },
  { id: "evidencija", icon: "📋", label: "Evidencija" },
  { id: "tezga",      icon: "🏪", label: "Tezga"     },
  { id: "settings",   icon: "⚙️", label: "Podešav."  }
];

var TOP_SCREEN = {
  home: true, hives: true, evidencija: true, tezga: true, settings: true,
  extractions: false, extraction_form: false,
  analytics: false, apiaries: false, apiary_form: false,
  produce_list: false, produce_form: false,
  treatments: false, treatment_form: false,
  swarms: false, swarm_form: false,
  feedings: false, feeding_form: false,
  varroa: false, varroa_form: false,
  nuclei: false, nucleus_form: false,
  queen_rearing: false, queen_form: false,
  winterization: false, winterization_form: false,
  inventory_form: false, sale_form: false, stock_form: false,
  expense_form: false
};

var EVIDENCIJA_SCREENS = {
  extractions: 1, extraction_form: 1,
  feedings: 1, feeding_form: 1,
  varroa: 1, varroa_form: 1,
  treatments: 1, treatment_form: 1,
  swarms: 1, swarm_form: 1,
  nuclei: 1, nucleus_form: 1,
  queen_rearing: 1, queen_form: 1,
  winterization: 1, winterization_form: 1
};

function renderNav() {
  var cur = App._screen;
  var activeTab = EVIDENCIJA_SCREENS[cur] ? "evidencija" : cur.split("_")[0];
  return NAV_TABS.map(function (t) {
    var active = (t.id === activeTab) ? " active" : "";
    return '<button class="nav-btn' + active + '" onclick="GT.nav(\'' + t.id + '\')">' +
      '<span class="nav-icon">' + t.icon + '</span>' +
      '<span class="nav-label">' + t.label + '</span>' +
    '</button>';
  }).join("");
}

function renderHeader() {
  var titles = {
    home: null, hives: "Košnice", evidencija: "Evidencija",
    extractions: "Berba", tezga: "Tezga", settings: "Podešavanja",
    hive_detail: "Karton košnice", hive_form: "Košnica",
    inspection_form: "Inspekcija", extraction_form: "Berba",
    inventory_form: "Tegle — unos", sale_form: "Prodaja", stock_form: "Kanta — unos", expense_form: "Trošak",
    analytics: "Analitika", apiaries: "Pčelinjaci", apiary_form: "Pčelinjak",
    produce_list: "Ostali proizvodi", produce_form: "Proizvod",
    treatments: "Tretmani", treatment_form: "Tretman",
    swarms: "Rojevi", swarm_form: "Roj",
    feedings: "Hranjenje", feeding_form: "Hranjenje",
    varroa: "Varroa monitoring", varroa_form: "Varroa — merenje",
    nuclei: "Nukleusi", nucleus_form: "Nukleus",
    queen_rearing: "Uzgoj matica", queen_form: "Uzgoj matica",
    winterization: "Zimovanje", winterization_form: "Zimovanje"
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
    HStore.all("sales"),
    HStore.all("stocks"),
    HStore.all("apiaries"),
    HStore.all("produce"),
    HStore.all("treatments"),
    HStore.all("swarms"),
    HStore.all("feedings"),
    HStore.all("varroa_checks"),
    HStore.all("nuclei"),
    HStore.all("queen_rearing"),
    HStore.all("winterization"),
    HStore.all("expenses")
  ]).then(function (results) {
    App._hives          = results[0];
    App._inspections    = results[1];
    App._extractions    = results[2];
    App._inventory      = results[3];
    App._sales          = results[4];
    App._stocks         = results[5];
    App._apiaries       = results[6];
    App._produce        = results[7];
    App._treatments     = results[8];
    App._swarms         = results[9];
    App._feedings       = results[10];
    App._varroa_checks  = results[11];
    App._nuclei         = results[12];
    App._queen_rearing  = results[13];
    App._winterization  = results[14];
    App._expenses       = results[15];
  });
}

/* ─── INIT ───────────────────────────────────────────────── */

function init() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){});
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
