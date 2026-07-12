# Work Order Snap
**Status:** U izgradnji — MVP Faza 1
**Datum start:** 2026-06-27
**Lokacija:** `tradesman-playbook/work-order-snap/`
**Brand:** Tradesman's Playbook

---

## Šta je ovo

Besplatni mini alat za solo zanatlije. Majstor završi posao, otvori app, slika šta je radio, doda broj naloga i opis — app pamti sve (gde, šta, kada). Eksportuje PDF radni nalog koji ide uz fakturu.

**3 tapa — to je ceo flow:**
```
[+] Novi nalog → Slika → GPS auto → Broj + Opis → Sačuvaj
[Lista] → sve u istoriji (datum, lokacija, foto, opis)
[PDF] → profesionalni radni nalog → prilog uz invoice
```

---

## Zašto postoji

Nema besplatnog offline alata koji radi ovo. Konkurenti:
- CompanyCam: $19+/mes, samo slike, nema work order tekst
- Jobber: $39/mes, previše kompleksno
- Papir/WhatsApp: nema organizaciju, nema PDF

Naša prednost: besplatno, offline-first, PDF koji prati format naših kit templata.

**Funnel:** Svaki PDF koji majstor pošalje kupcu sadrži Tradesman's Playbook footer → link na Invoice Template ($6) ili Full Kit ($39).

---

## Tech stack

| Komponenta | Tehnologija | Zašto |
|---|---|---|
| App format | PWA (Progressive Web App) | Instalira se sa linka, radi na iOS + Android, bez App Store-a |
| Podatke čuva | IndexedDB | Lokalno na telefonu, preživljava restart, bez clouda |
| Kamera | MediaCapture API | Browser API, ne treba native app |
| GPS | Geolocation API + OpenStreetMap Nominatim | Koordinate → adresa, besplatno |
| PDF | jsPDF | Client-side PDF, nema servera |
| Hosting | Cloudflare Pages / GitHub Pages | Besplatno, HTTPS (obavezno za GPS + kamera) |
| Frontend | Vanilla HTML + CSS + JS | Nema build toolova, brzo, nema zavisnosti |

---

## Struktura fajlova

```
work-order-snap/
├── README.md                  ← OVAJ FAJL
├── WORKFLOW.md                ← Plan izgradnje + faze + šta istražiti
├── research/
│   ├── market_research.md     ← Link na izveštaj (vec postoji u reports/)
│   └── open_questions.md      ← Šta još treba istražiti
└── src/
    ├── index.html             ← Glavni HTML (single page app)
    ├── manifest.json          ← PWA manifest (ime, ikone, boje)
    ├── sw.js                  ← Service Worker (offline cache)
    ├── css/
    │   └── app.css            ← Stilovi (mobile-first)
    ├── js/
    │   ├── app.js             ← Glavni controller (routing, state)
    │   ├── db.js              ← IndexedDB wrapper (CRUD za naloge)
    │   ├── camera.js          ← MediaCapture (slika, kompresija)
    │   ├── gps.js             ← Geolocation + Nominatim geocoding
    │   └── pdf.js             ← jsPDF export (work order format)
    └── icons/
        ├── icon-192.png       ← PWA ikona (još nije napravljena)
        └── icon-512.png       ← PWA ikona (još nije napravljena)
```

---

## Faze

| Faza | Sadržaj | Status |
|---|---|---|
| **Faza 1 — MVP** | Novi nalog + foto + GPS + lista + PDF | 🔲 U izgradnji |
| **Faza 2 — Polish** | Pretraga, filter po zanatu, upsell footer u PDF | 🔲 Planirana |
| **Faza 3 — Cloud** | Firebase sync, backup, deljenje sa kupcem | 🔲 Opciona |

---

## Veza sa Tradesman's Playbook kitovima

Work Order Snap koristi ista polja kao naš `work_order.docx` template:
- Job Number, Date, Customer, Address, Description, Trade, Photos

PDF koji app generiše je **komplementaran** sa Invoice Template iz kita — zajedno čine kompletan proof-of-work + billing paket.

Upsell logika u PDF footer-u:
```
"Work Order generated with Work Order Snap by Tradesman's Playbook
 Get the complete Invoice + Contract Templates: [etsy link] — from $6"
```
