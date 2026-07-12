# MiniUniverse — Master Dokument
**Poslednji update:** 2026-07-12
**Lokacija:** `D:\BELORA\miniuniverse\`
**GitHub:** `https://github.com/plocicmilan/miniuniverse`
**GitHub Pages:** `https://plocicmilan.github.io/miniuniverse/`

---

## Šta je MiniUniverse

Kolekcija standalone toolbox PWA aplikacija za ljude oko Milana.
Isti principi kao AutoUniverse — Vanilla JS + IndexedDB + Service Worker + offline-first.
Svaka app je za drugačiji zanat/delatnost. Lista se produžava po potrebi.

**Pravilo:** Svaka nova app ide u sopstveni subfolder (`honey/`, `baker/`, `carpenter/`...).

---

## Aplikacije

| App | Folder | Status | Tester | Live URL |
|---|---|---|---|---|
| Honey Toolbox | `honey/` | ✅ LIVE v0.9.1 | Nikola (pčelar) | `https://plocicmilan.github.io/miniuniverse/honey/` |
| Work Order Snap | `work-order-snap/` | 🔧 MVP Faza 1 | — | deploy pending |

---

## Testeri

| Ime | App | Uređaj | Feedback kanal |
|---|---|---|---|
| Nikola | Honey Toolbox + Driver Toolbox (AU) | Android / Chrome | Direktno Milanu → Milan upisuje u FEEDBACK.md |

**Feedback flow:**
1. Nikola pronađe problem / predlog → javlja Milanu
2. Milan otvori sesiju: "Nikola je javio [X]"
3. Ja implementiram, pushnem na GitHub
4. Service Worker na Nikolinom telefonu uhvati novu verziju pri sledećem otvaranju (uz internet)
5. Milan zapiše u `miniuniverse/sessions/YYYY-MM-DD.md`

---

## Deploy model

Sve aplikacije u MiniUniverse idu na **GitHub Pages** (statični hosting, besplatno).

```
Kod lokalno (D:\BELORA\miniuniverse\)
    ↓  git push
GitHub repo (plocicmilan/miniuniverse)
    ↓  auto-deploy
GitHub Pages (plocicmilan.github.io/miniuniverse/)
    ↓  Service Worker cache versioning
Testerov telefon (pri sledećem otvaranju uz internet)
```

**Ažuriranje:**
1. Izmeni kod
2. Podigni SW verziju u `[app]/sw.js` (npr. `v0.9.1` → `v0.9.2`)
3. `git add . && git commit -m "honey: opis izmene" && git push`
4. GitHub Pages deploy za ~1 min

---

## Shared komponente (copy-paste za novu app)

Sve komponente su već implementirane u `honey/`. Kad praviš novu app, kopiraj i prilagodi.

### 1. IndexedDB wrapper (`store.js`)
```
Lokacija: honey/js/store.js
Šta radi: otvara DB, kreira store-ove, CRUD operacije
Adaptacija: promeni DB_NAME, DB_VERSION, STORES listu
```

### 2. Service Worker (`sw.js`)
```
Lokacija: honey/sw.js
Šta radi: cache-first, offline-first, verzionisan
Adaptacija: promeni CACHE_NAME (npr. "baker-toolbox-v0.1.0"), obnovi file listu
```

### 3. PWA Manifest (`manifest.json`)
```
Lokacija: honey/manifest.json
Šta radi: ikona, naziv, boja, standalone mod
Adaptacija: name, short_name, theme_color, background_color, ikone
```

### 4. Bottom nav (5 tabova)
```
Lokacija: honey/js/app.js — funkcija renderNav()
Šta radi: fiksiran bottom nav, aktivni tab highlight, router
Adaptacija: promeni SCREENS listu i tab ikone/labele
```

### 5. Backup / Restore (JSON)
```
Lokacija: honey/js/app.js — funkcije backupData() i restoreData()
Šta radi: sve tabele → jedan JSON fajl; restore briše sve i uvozi
Adaptacija: obnovi tabele u backup/restore petljama
```

### 6. PWA ikone (Python generator)
```
Lokacija: honey/ (generisano Pythonom, PIL)
Šta radi: pravi icon-192.png i icon-512.png sa emoji/bojom
Adaptacija: promeni emoji, boju, naziv fajla
```

### 7. Excel import/export (SheetJS)
```
Lokacija: honey/js/xlsx.min.js + importXLSX() funkcija u app.js
Šta radi: .xlsx uvoz sa auto-detekcijom sheeta, CSV izvoz sa BOM
Adaptacija: definiši sheet naziv i mapiranje kolona za svoju app
```

### 8. localStorage settings namespace
```
Pattern: prefiks po app-u (honey = "ht_", garage = "gt_", driver = "dt_")
Zašto: sprečava koliziju kad su dve app na istom originu
```

---

## Arhitektura nove app (checklist)

Kad Milan kaže "pravimo novu app":

1. **Definiši entitete** — šta korisnik prati (npr. pekara: `products`, `orders`, `clients`)
2. **5 tabova** — Home (dashboard), [Lista], [Forma/Akcija], [Analitika], Podešavanja
3. **Napravi folder** — `miniuniverse/[naziv]/`
4. **Kopiraj iz honey:** `sw.js`, `manifest.json`, `js/store.js` skeleton, `js/xlsx.min.js`
5. **Teme boje** — izaberi `theme_color` koji odgovara branši
6. **SW namespace** — novi CACHE_NAME i localStorage prefiks
7. **DB store-ovi** — definiši u `store.js` i `app.js` openDB()
8. **Generiši ikone** — Python PIL sa odgovarajućim emojiem
9. **Deploy** — push na GitHub, GitHub Pages odmah servira

---

## Veza sa AutoUniverse

AutoUniverse (`D:\BELORA\autouniverse\`) je srodan projekat — iste tehnologije, ista filozofija, ali fokusiran na auto industriju (Garage Toolbox + Driver Toolbox).

| | AutoUniverse | MiniUniverse |
|---|---|---|
| GitHub | `plocicmilan/AUTOUNIVERSE` | `plocicmilan/miniuniverse` |
| Live URL | `plocicmilan.github.io/AUTOUNIVERSE/` | `plocicmilan.github.io/miniuniverse/` |
| Backend | AutoHub (Node.js, Cloudflare tunnel) | Nema (čisto klijentsko) |
| Feedback sistem | `autouniverse/FEEDBACK.md` | `miniuniverse/sessions/` + direktno Milanu |
| Testeri | Marko (Garage), Goran (Driver), Nikola (Driver) | Nikola (Honey) |

Nikola je jedini tester koji koristi **oba** sistema — Driver (AU) i Honey (MU).

---

## Honey Toolbox — Stanje (2026-07-12)

| Komponenta | Verzija | Status |
|---|---|---|
| `app.js` | ~135 KB, 2665+ linija | ✅ |
| `store.js` | DB v7, 16 store-ova | ✅ |
| `sw.js` | v0.9.1 | ✅ |
| GitHub Pages | master branch, commit 7e5d8c1 | ✅ Live |
| PDF uputstvo | 8 stranica | ✅ |

**Preostalo:**
- PDF godišnji izveštaj (za štampu/arhivu)
- Nikola importuje Excel sa podacima

---

## Session logovi
Svaka sesija rada na MiniUniverse: `miniuniverse/sessions/YYYY-MM-DD.md`
