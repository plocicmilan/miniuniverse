# Open Questions — Work Order Snap
**Poslednji update:** 2026-06-27

Pitanja koja treba rešiti pre ili tokom izgradnje MVP-a.

---

## Q1 — PDF biblioteka: jsPDF vs pdf-lib vs html2canvas

**Problem:** Treba generisati PDF direktno u browseru, bez servera. Tri opcije.

| Opcija | Veličina | Prednost | Mana |
|---|---|---|---|
| **jsPDF** | ~200KB | Najveća zajednica, dobra dokumentacija, dodaje slike (JPEG/PNG) | API je malo verbose, tekst positioning ručno |
| **pdf-lib** | ~800KB | Čist API, može editovati postojeći PDF | Veći bundle, kompleksniji za slike |
| **html2canvas + jsPDF** | ~400KB | Renderuje HTML direktno kao PDF — najlakše pozicioniranje | Kvalitet može biti loš na mobilnom, sporost |

**Preporuka (treba potvrditi):** jsPDF za MVP — manji bundle, direktna kontrola, slike rade dobro.

**Akcija:** Testirati jsPDF na mobilnom pre nego što zavisnost uđe u kod.

---

## Q2 — OpenStreetMap Nominatim rate limit

**Problem:** Nominatim (besplatni reverse geocoding) ima rate limit: **1 request/sekundi** per IP. Ako 10 korisnika istovremeno otvori app i sve slika u isto vreme — problem?

**Procena za MVP:** Ne. MVP ima 0-100 korisnika. Rate limit nije problem.

**Dugoročno:** Ako app poraste (1.000+ DAU) — prebaciti na Mapbox Static Geocoding (50.000 besplatnih req/mes) ili Google Maps Geocoding API (200$ kredita/mes besplatno).

**Šta još treba proveriti:** Da li Nominatim zahteva `User-Agent` header u requestu (policy zahteva ime aplikacije).

---

## Q3 — iOS PWA kamera: `capture="environment"` na iOS 18+

**Problem:** iOS Safari ima specifična ograničenja za PWA. Kamera je rešiv problem, ali treba verifikovati.

**Poznato:**
- `<input type="file" accept="image/*" capture="environment">` — radi na iOS 14.3+ za otvaranje kamere
- `getUserMedia` za live preview — radi na iOS 16.4+ u PWA mode (instaliranoj)
- iOS 18 promenio neke PWA API-je (push notifications, posebno)

**Šta treba testirati:** Da li `capture="environment"` otvara direktno zadnju kameru (ne galerie) na iOS 18.x.

**Fallback plan:** Ako ne radi direktno kamera → `accept="image/*"` bez `capture` → korisnik bira između kamere i galerie (manje idealno ali funkcionalno).

---

## Q4 — IndexedDB kvota na iOS Safari

**Problem:** Safari na iOS ima konzervativniji storage policy od Chrome.

**Poznato:**
- Chrome: do 60% slobodnog prostora na disku (praktično neograničeno)
- Safari iOS: do 1GB per origin u normalnim uslovima; može tražiti dozvolu za više
- Safari briše IndexedDB posle 7 dana **ako korisnik nije otvorio app** (ITP policy)

**Implikacija:** Ako majstor ne otvori app 7+ dana, podaci mogu biti obrisani na iPhone-u bez cloud backup-a.

**Rešenje za MVP:** Upozorenje pri instalaciji: "Za bezbednost podataka, instalite app na početni ekran." Instalirana PWA ima drugačiji (bolji) storage tretman od browsera.

**Dugoročno:** Cloud sync (Firebase) u Fazi 2 rešava ovaj problem.

---

## Q5 — Image kompresija formula

**Problem:** Mobilne kamere snimaju 3-8MB slike. Čuvanje 50 slika = 150-400MB u IndexedDB.

**Cilj:** Svaka slika ≤300KB, vidljivo kvalitetna na 6" ekranu.

**Proveren pristup (canvas resize):**
```javascript
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}
```

**Šta treba proveriti:** Da li 1200px + 75% quality daje vizualno prihvatljiv rezultat za PDF (printing na A4).

---

## Q6 — Cloudflare Pages vs GitHub Pages

**Problem:** Treba besplatni HTTPS hosting.

| Opcija | Build | CDN | Limitacije |
|---|---|---|---|
| **Cloudflare Pages** | Auto iz GitHub | Globalni CDN | 500 buildova/mes (dovoljno) |
| GitHub Pages | Auto iz GitHub | GitHub CDN | 100GB bandwidth/mes |

**Odluka:** Cloudflare Pages — brži CDN globalno, relevantnije za US korisnika. Podešavanje: 5 minuta.

**Akcija:** Napraviti GitHub repo `tradesman-work-order-snap` → konektovati na Cloudflare Pages.

---

## Q7 — Service Worker update strategija

**Problem:** Kad se promeni kod, korisnici koji su instalirali PWA ne dobijaju automatski update.

**Opcije:**
- `skipWaiting()` — novi SW odmah preuzima, može slomiti otvorene tabove
- Wait for reload — user mora da zatvori i otvori app
- Prikazati "Update available" baner

**Preporuka za MVP:** `skipWaiting()` — app je jednostavna, nema višestrukih tabova, korisnici treba da imaju uvek novi kod.

---

## Q8 — Monetizacija tačka (otvoreno)

**Nije tehnički problem, ali treba odluka:**

| Model | Za | Protiv |
|---|---|---|
| Besplatno zauvek | Nema barijere, čist funnel | 0 direktnog prihoda |
| $9.99 one-time (Etsy/Gumroad) | Prihod od prvog dana | Barijera instalacije |
| Freemium (15 naloga besplatno) | Dokazuje vrednost, konvertuje | Kompleksnija implementacija |

**Preporuka:** Krenuti sa besplatnim, meriti konverziju ka kitovima 30 dana → odlučiti o monetizaciji.
