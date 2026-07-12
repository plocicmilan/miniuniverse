# Work Order Snap — Workflow izgradnje
**Poslednji update:** 2026-06-27

---

## Faza 1 — MVP (cilj: radni prototip za 1 nedelju)

### Korak 1 — PWA kostur (Dan 1)
- [ ] `index.html` sa meta tagovima za mobile (viewport, theme-color)
- [ ] `manifest.json` (name, icons, start_url, display: standalone, background_color)
- [ ] `sw.js` service worker — cache shell (index.html, css, js)
- [ ] HTTPS obavezan za GPS + kamera — deploy na Cloudflare Pages odmah

**Zašto odmah deploy:** GPS i kamera ne rade na HTTP localhost na mobilnom. Treba HTTPS od prvog dana testiranja.

### Korak 2 — IndexedDB baza (Dan 1-2)
`js/db.js` — sve CRUD operacije:
```javascript
// Struktura jednog naloga (work order record)
{
  id: auto-increment,
  job_number: "PLM-001",        // prefix po zanatu + auto broj
  trade: "plumber",              // plumber|hvac|electrician|roofer|handyman
  date: "2026-06-27",
  time: "14:32",
  customer_name: "",             // opciono
  address: "",                   // iz GPS reverse geocoding
  lat: 44.0128,                  // GPS koordinate (uvek čuvati)
  lng: 20.9190,
  description: "",               // šta je rađeno
  photos: [],                    // array of base64 strings (kompresovano)
  created_at: timestamp
}
```

**Storage limit:** IndexedDB nema tvrdi limit — zavisi od slobodnog prostora na telefonu. 100 naloga sa 2 slike po 200KB = ~40MB, nema problema.

### Korak 3 — Kamera (Dan 2)
`js/camera.js`:
```javascript
// MediaCapture API — direktno snima bez otvaranja galerie
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
// ILI jednostavnije (otvori nativnu kameru):
<input type="file" accept="image/*" capture="environment">
```

**Odluka:** `<input capture="environment">` je simpler i više kompatibilan (iOS posebno). Direktan `getUserMedia` je moćniji ali kompleksniji. **MVP: input capture.** Faza 2: live preview.

**Kompresija pre čuvanja:** Slike mobilnih kamera su 3-8MB. Treba kompresija na ≤300KB pre IndexedDB:
```javascript
canvas.toDataURL('image/jpeg', 0.7)  // 70% quality
// + resize na max 1200px width
```

### Korak 4 — GPS + Adresa (Dan 2-3)
`js/gps.js`:
```javascript
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  // → OpenStreetMap Nominatim reverse geocoding
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
    .then(r => r.json())
    .then(data => data.display_name)  // "123 Main St, Springfield, IL"
});
```

**Offline fallback:** Ako nema interneta → čuvati koordinate, geocoding kad se pojavi mreža.

### Korak 5 — UI (Dan 3-4)
`css/app.css` + `index.html` — 4 "ekrana" (bez router-a, samo show/hide):

```
EKRAN 1: Početna — [+ Novi nalog] [Lista naloga]
EKRAN 2: Novi nalog — forma (trade, broj, customer, opis, foto)
EKRAN 3: Lista — scroll lista svih naloga (datum, adresa, sličica)
EKRAN 4: Detalji naloga — sve info + galerija + [Export PDF] [Obriši]
```

**Dizajn principe:**
- Mobile-first, finger-friendly (min 44px tap targets)
- Boje: #2E5C8A (Tradesman's Playbook plava) za header/CTA
- Font: system-ui (nema Google Fonts zavisnosti, brže se učitava)
- Dark mode nije prioritet za MVP

### Korak 6 — PDF Export (Dan 4-5)
`js/pdf.js` — jsPDF biblioteka (CDN, ~200KB):

**Format PDF-a (isti kao naš work_order.docx):**
```
┌─────────────────────────────────────────────┐
│  TRADESMAN'S PLAYBOOK             [Logo/ime] │
│  WORK ORDER                                  │
├─────────────────────────────────────────────┤
│  Job #: PLM-001     Date: 2026-06-27        │
│  Trade: Plumbing    Time: 14:32             │
├─────────────────────────────────────────────┤
│  Customer: John Smith                        │
│  Address:  123 Main St, Springfield, IL      │
├─────────────────────────────────────────────┤
│  Description of Work:                        │
│  [tekst opisa]                               │
├─────────────────────────────────────────────┤
│  Photos: [sličica 1] [sličica 2]            │
├─────────────────────────────────────────────┤
│  Technician: ________________  Date: ____    │
│  Customer:   ________________  Date: ____    │
├─────────────────────────────────────────────┤
│  [footer] Work Order Snap by Tradesman's    │
│  Playbook · Invoice Templates from $6:      │
│  [etsy link]                                 │
└─────────────────────────────────────────────┘
```

### Korak 7 — Service Worker (Dan 5)
`sw.js` — cache shell za offline rad:
- Cache: `index.html`, `app.css`, `app.js`, `db.js`, `camera.js`, `gps.js`, `pdf.js`, jsPDF CDN
- Strategy: Cache-first za shell, Network-first za Nominatim geocoding

### Korak 8 — Deploy + Test (Dan 6-7)
- Cloudflare Pages: push na GitHub → auto deploy → HTTPS url
- Test na Android (Chrome) + iPhone (Safari)
- Test offline: airplane mode → kreirati nalog → iza toga online → geocoding

---

## Šta još treba istražiti (Open Questions)

Videti `research/open_questions.md` za detalje. Kratki pregled:

| Pitanje | Prioritet | Status |
|---|---|---|
| jsPDF vs pdf-lib vs html2canvas — koji za nas? | Visoki | 🔲 Otvoreno |
| Nominatim rate limit (1 req/sec) — problem za MVP? | Srednji | 🔲 Otvoreno |
| iOS 18+ PWA kamera — radi li `capture="environment"`? | Visoki | 🔲 Otvoreno |
| IndexedDB quota per origin na iOS (Safari) | Srednji | 🔲 Otvoreno |
| Image compression — canvas resize formula | Visoki | 🔲 Otvoreno |
| Cloudflare Pages vs GitHub Pages — ograničenja? | Nizak | 🔲 Otvoreno |
| Service Worker update strategy (skipWaiting?) | Nizak | 🔲 Otvoreno |

---

## Faza 2 — Polish (posle MVP validacije)

- [ ] Pretraga naloga (po datumu, zanatu, kupcu)
- [ ] Filter po zanatu
- [ ] Više slika po nalogu (do 5)
- [ ] Edit nalog posle čuvanja
- [ ] Upsell footer u PDF sa tracking linkom (UTM parametar)
- [ ] PWA install prompt ("Dodaj na početni ekran" — guided)
- [ ] Izvoz svih naloga (zip sa PDF-ovima)

---

## Faza 3 — Cloud sync (opciona, samo ako ima traction)

- [ ] Firebase Firestore (besplatni tier: 1GB, 50K reads/dan)
- [ ] Anonimna autentifikacija (bez registracije — jedinstven ID per telefon)
- [ ] Background sync (Service Worker Background Sync API)
- [ ] Deljenje PDF-a direktno na email/WhatsApp

---

## Alati i zavisnosti

### Runtime (bez instalacije — CDN)
| Library | Verzija | Veličina | Svrha |
|---|---|---|---|
| jsPDF | 2.x | ~200KB | PDF generacija u browseru |
| — | — | — | Sve ostalo su browser API-ji |

### Dev alati (lokalno)
| Alat | Svrha |
|---|---|
| VS Code | Editor |
| Chrome DevTools | Debug, emulacija mobilnog ekrana, Application tab (IndexedDB pregled) |
| Lighthouse | PWA audit (score treba biti 90+) |
| ngrok (opciono) | HTTPS tunel za lokalni dev na pravom telefonu |

### Hosting
| Opcija | Cena | Prednost |
|---|---|---|
| **Cloudflare Pages** | $0 | HTTPS, CDN, auto deploy iz GitHub, bez limita |
| GitHub Pages | $0 | Jednostavno, ali sporije CDN |

### Nema:
- Node.js / npm (ne treba build step za vanilla JS)
- React / Vue / Svelte (overhead za tako mali app)
- Backend server
- Baza na serveru
- API ključ za geocoding (Nominatim je besplatan, open-source)

---

## Pokretanje (kad bude gotovo)

```
# Lokalno (bez GPS/kamera na HTTP):
py -m http.server 8080 --directory src/
→ http://localhost:8080

# Sa HTTPS (za pravo testiranje na telefonu):
→ Deploy na Cloudflare Pages, otvori URL na telefonu
```

---

## Veza sa Mini Universe sistemom

```
Work Order Snap (besplatno)
       ↓ upsell u PDF footer-u
Etsy: Invoice Template P-01 ($6)
       ↓ ili direktno
Gumroad: Plumber's Business Starter Kit ($39)
```

Work Order Snap → Etsy listing PDF → Gumroad full kit = value ladder koji ide sa naše strane.
