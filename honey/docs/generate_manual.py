"""
Honey Toolbox — uputstvo za Nikolu (PDF via Playwright)
Run: py D:\\BELORA\\miniuniverse\\honey\\docs\\generate_manual.py
"""

import tempfile
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path(r"D:\BELORA\miniuniverse\honey\docs\Honey_Toolbox_uputstvo_za_Nikolu.pdf")

HTML = """<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8">
<style>
  :root {
    --amber: #f59e0b;
    --amber-light: #fef3c7;
    --amber-dark: #92400e;
    --text: #1c1917;
    --muted: #78716c;
    --border: #e7e5e4;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: var(--text); background: #fff; }

  /* ── COVER ─────────────────────────────────────────────── */
  .cover {
    height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    background: linear-gradient(160deg, #fffbeb 0%, #fef3c7 60%, #fde68a 100%);
    padding: 3rem; page-break-after: always;
  }
  .cover-icon { font-size: 5rem; margin-bottom: 1.5rem; }
  .cover-title { font-size: 2.4rem; font-weight: 800; color: var(--amber-dark); line-height: 1.15; }
  .cover-sub { font-size: 1.1rem; color: var(--muted); margin-top: .6rem; }
  .cover-version { margin-top: 2.5rem; font-size: .9rem; color: var(--muted); }
  .cover-bar { width: 80px; height: 4px; background: var(--amber); border-radius: 2px; margin: 1.2rem auto; }
  .cover-name { font-size: 1rem; color: var(--amber-dark); font-weight: 600; }

  /* ── LAYOUT ─────────────────────────────────────────────── */
  .page { padding: 2.2rem 2.5rem; max-width: 100%; }
  h1 { font-size: 1.6rem; font-weight: 800; color: var(--amber-dark); margin-bottom: .8rem; padding-bottom: .4rem; border-bottom: 3px solid var(--amber); }
  h2 { font-size: 1.15rem; font-weight: 700; color: var(--amber-dark); margin: 1.4rem 0 .5rem; }
  h3 { font-size: 1rem; font-weight: 600; color: var(--text); margin: 1rem 0 .35rem; }
  p { line-height: 1.6; margin-bottom: .5rem; }
  .muted { color: var(--muted); font-size: .9rem; }

  /* ── CARDS ──────────────────────────────────────────────── */
  .card { background: #fff; border: 1px solid var(--border); border-radius: .6rem; padding: .85rem 1rem; margin-bottom: .75rem; }
  .card.amber { background: var(--amber-light); border-color: #fbbf24; }
  .card.green { background: #f0fdf4; border-color: #86efac; }

  /* ── STEPS ──────────────────────────────────────────────── */
  .steps { counter-reset: step; }
  .step { display: flex; gap: .8rem; margin-bottom: .6rem; align-items: flex-start; }
  .step-num { width: 1.8rem; height: 1.8rem; min-width: 1.8rem; background: var(--amber); color: #fff; font-weight: 700; font-size: .85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .step-body { line-height: 1.55; flex: 1; }
  .step-body b { display: block; font-weight: 600; }

  /* ── CHECKLIST ──────────────────────────────────────────── */
  .checklist { list-style: none; padding: 0; }
  .checklist li { display: flex; align-items: flex-start; gap: .55rem; padding: .3rem 0; border-bottom: 1px solid var(--border); line-height: 1.5; }
  .checklist li:last-child { border-bottom: none; }
  .check-box { width: 1.1rem; height: 1.1rem; min-width: 1.1rem; border: 2px solid var(--amber); border-radius: .2rem; margin-top: .15rem; }

  /* ── TABLE ──────────────────────────────────────────────── */
  table { width: 100%; border-collapse: collapse; margin: .5rem 0 .75rem; font-size: .9rem; }
  th { background: var(--amber-light); color: var(--amber-dark); font-weight: 700; padding: .45rem .6rem; text-align: left; border: 1px solid #fbbf24; }
  td { padding: .4rem .6rem; border: 1px solid var(--border); vertical-align: top; }
  tr:nth-child(even) td { background: #fafaf9; }

  /* ── BADGE ──────────────────────────────────────────────── */
  .badge { display: inline-block; padding: .15rem .5rem; border-radius: 999px; font-size: .75rem; font-weight: 700; }
  .badge-amber { background: var(--amber); color: #fff; }
  .badge-green { background: #22c55e; color: #fff; }
  .badge-red   { background: #ef4444; color: #fff; }

  /* ── TIP ────────────────────────────────────────────────── */
  .tip { background: var(--amber-light); border-left: 4px solid var(--amber); padding: .6rem .85rem; border-radius: 0 .4rem .4rem 0; margin: .5rem 0; font-size: .9rem; }
  .tip b { color: var(--amber-dark); }
  .warn { background: #fef2f2; border-left: 4px solid #ef4444; padding: .6rem .85rem; border-radius: 0 .4rem .4rem 0; margin: .5rem 0; font-size: .9rem; }

  /* ── ICON ROW ───────────────────────────────────────────── */
  .icon-row { display: flex; gap: .6rem; align-items: center; margin-bottom: .4rem; }
  .icon-big { font-size: 1.5rem; }

  .page-break { page-break-before: always; }

  /* ── FOOTER ─────────────────────────────────────────────── */
  .footer { margin-top: 2rem; padding-top: .75rem; border-top: 1px solid var(--border); font-size: .8rem; color: var(--muted); text-align: center; }
</style>
</head>
<body>

<!-- ════════════ NASLOVNA ════════════ -->
<div class="cover">
  <div class="cover-icon">🍯</div>
  <div class="cover-title">Honey Toolbox</div>
  <div class="cover-bar"></div>
  <div class="cover-name">Uputstvo za Nikolu</div>
  <div class="cover-sub">Pčelinjak u džepu — košnice, inspekcije, berba, tezga</div>
  <div class="cover-version">Verzija 0.9 · Juli 2026</div>
</div>

<!-- ════════════ 1. INSTALACIJA ════════════ -->
<div class="page">
<h1>1. Instalacija na Android telefon</h1>

<div class="card amber">
  <b>Link za instalaciju:</b><br>
  <span style="font-size:1.05rem;font-weight:700;color:#92400e">https://plocicmilan.github.io/miniuniverse/honey/</span><br>
  <span class="muted">Otvori ovaj link u Chrome browseru na telefonu.</span>
</div>

<div class="steps">
  <div class="step"><div class="step-num">1</div><div class="step-body"><b>Otvori Chrome</b>Upiši ili klikni link iznad. Sačekaj da se app učita (par sekundi).</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-body"><b>Instaliraj kao app</b>Chrome će automatski pokazati baner "Dodaj na početni ekran" na dnu ekrana — klikni ga.</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-body"><b>Potvrdi</b>Klikni "Dodaj" u dijalogu. Ako baner ne iskočio — klikni tri tačkice (⋮) u Chrome-u → "Dodaj na početni ekran".</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-body"><b>Otvori app</b>Ikonа "Honey Toolbox" pojaviće se na početnom ekranu. Klikni je — otvara se kao prava app, bez adresne trake.</div></div>
</div>

<div class="tip">
  <b>💡 Offline rad:</b> Nakon prve instalacije, app radi i bez interneta. Svi podaci se čuvaju lokalno na telefonu.
</div>

<div class="warn">
  <b>⚠ Backup:</b> Podaci su SAMO na tvom telefonu. Redovno pravi backup (Podešavanja → Backup JSON) i čuvaj fajl na Googlu Drive-u ili pošalji sebi na mail.
</div>
</div>

<!-- ════════════ 2. HOME ════════════ -->
<div class="page page-break">
<h1>2. Početni ekran (Home)</h1>

<p>Otvara se na startu. Prikazuje stanje pčelinjaka na prvi pogled.</p>

<table>
  <tr><th>Tile</th><th>Šta prikazuje</th></tr>
  <tr><td>🐝 Košnice</td><td>Broj aktivnih košnica</td></tr>
  <tr><td>📋 Zadnja inspekcija</td><td>Pre koliko dana je rađena poslednja inspekcija</td></tr>
  <tr><td>⚖️ Prinos sezone</td><td>Ukupni kg berbe za tekuću godinu</td></tr>
  <tr><td>🏪 Tezga</td><td>Prečica na ekran prodaje</td></tr>
</table>

<h2>🚨 Alertovi</h2>
<table>
  <tr><th>Boja</th><th>Značenje</th></tr>
  <tr><td><span class="badge badge-red">Hitno</span></td><td>Košnica čiji termin inspekcije je danas ili je prošao</td></tr>
  <tr><td>Narandžast</td><td>Inspekcija zakazana za ≤3 dana</td></tr>
  <tr><td>Siv</td><td>Košnica još nikad nije pregledana</td></tr>
</table>

<h2>Brza dugmad</h2>
<ul style="margin-left:1.2rem;line-height:2">
  <li><b>+ Nova inspekcija</b> — direktan unos inspekcije</li>
  <li><b>🍯 Nova berba</b> — unos ekstrakcije</li>
  <li><b>📊 Analitika</b> — grafikoni prinosa i prihoda po godini</li>
</ul>

<div class="tip">
  <b>💡 Ako imaš više pčelinjaka:</b> Na Home ekranu pojavljuju se mini kartice po pčelinjaku sa brojem košnica, kg sezone i brojem upozorenja.
</div>
</div>

<!-- ════════════ 3. KOŠNICE ════════════ -->
<div class="page page-break">
<h1>3. Košnice</h1>

<h2>Dodavanje košnice</h2>
<div class="steps">
  <div class="step"><div class="step-num">1</div><div class="step-body">Klikni <b>+</b> dugme (donji desni ugao)</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-body">Unesi <b>oznaku</b> (npr. K-01, Plava, Lipa-03)</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-body">Izaberi <b>pčelinjak</b> (ako imaš više lokacija)</div></div>
  <div class="step"><div class="step-num">4</div><div class="step-body">Unesi tip košnice, godinu matice, status</div></div>
  <div class="step"><div class="step-num">5</div><div class="step-body">Opciono: <b>fotografija</b> — kamera ili galerija. Auto-kompresija na ~80KB.</div></div>
</div>

<h2>Karton košnice</h2>
<p>Klikni na košnicu da otvoriš karticu. Vidis:</p>
<ul style="margin-left:1.2rem;line-height:1.9">
  <li>Fotografija + status + sledeća inspekcija</li>
  <li>Poslednji tretmani (aktivni tretman = narandžasti badge)</li>
  <li>Poslednja hranjenja</li>
  <li>Varroa merenja sa badge-om</li>
  <li>Istorija inspekcija</li>
  <li>Istorija berbi za ovu košnicu</li>
</ul>

<h2>Inspekcija</h2>
<p>Klikni <b>+ Inspekcija</b> na kartonu košnice ili sa Home ekrana.</p>

<table>
  <tr><th>Polje</th><th>Opcije</th></tr>
  <tr><td>Matica viđena</td><td>Da / Ne</td></tr>
  <tr><td>Leglo</td><td>OK · Loše · Nema</td></tr>
  <tr><td>Snaga</td><td>1–5 (tačkice)</td></tr>
  <tr><td>Zalihe hrane</td><td>Dovoljno · Malo · Nema</td></tr>
  <tr><td>Varroa (procena)</td><td>Slobodan tekst (za precizna merenja koristi Varroa tab)</td></tr>
  <tr><td>Sledeća inspekcija</td><td>Datum ILI "za N dana" — auto-sinhronizacija</td></tr>
</table>

<div class="tip">
  <b>💡 Sledeća inspekcija:</b> Unesi ili datum ili broj dana — jedno automatski popunjava drugo. Na Home ekranu se pojavljuje countdown badge.
</div>

<h2>Filtriranje po pčelinjaku</h2>
<p>Na vrhu liste košnica nalaze se tabovi po pčelinjaku. Klikni na tab da vidiš samo košnice sa te lokacije.</p>
</div>

<!-- ════════════ 4. EVIDENCIJA ════════════ -->
<div class="page page-break">
<h1>4. Evidencija (dnevnici)</h1>

<p>Centralni hub za sve operativne zapise. Tab <b>📋 Evidencija</b> u navigaciji.</p>

<table>
  <tr><th>Sekcija</th><th>Šta beleži</th></tr>
  <tr><td>🍯 Berba</td><td>Ekstrakcije meda po datumu, tipu, kg, ceni</td></tr>
  <tr><td>🥄 Hranjenje</td><td>Tip hrane, količina, koje košnice</td></tr>
  <tr><td>🔬 Varroa monitoring</td><td>Merenja grinja, metoda, rezultat/100 pčela</td></tr>
  <tr><td>💊 Tretmani</td><td>Preparat, datum, doza, status</td></tr>
  <tr><td>🐝 Rojevi</td><td>Datum, poreklo, ishod</td></tr>
  <tr><td>🏠 Nukleusi</td><td>Podjele, sadržaj, status</td></tr>
  <tr><td>👑 Uzgoj matica</td><td>Grafting ciklusi</td></tr>
  <tr><td>❄️ Zimovanje</td><td>Godišnji checklist po pčelinjaku</td></tr>
</table>

<h2>🥄 Hranjenje</h2>
<p><b>Tipovi hrane:</b> Šećerni sirup 1:1 (prolećni) · Šećerni sirup 2:1 (jesenji) · Pogačica · Fondant · Kandirana šećer · ApiInvert · Zamena za polena (protein) · Med (povratni) · Drugo</p>
<p><b>Scope (ko prima):</b> Sve košnice · Po pčelinjaku · Jedna košnica</p>
<p><b>Jedinice:</b> kg / l / kom</p>

<div class="tip">
  <b>💡 Batch hranjenje:</b> Za sistematsko hranjenje celog pčelinjaka, izaberi "Sve košnice" ili "Po pčelinjaku" — ne moraš unositi svaku košnicu posebno.
</div>

<h2>🔬 Varroa monitoring</h2>
<p><b>Metode:</b></p>
<ul style="margin-left:1.2rem;line-height:1.8">
  <li>Alkoholno pranje (uzorak 100 pčela)</li>
  <li>Šećerni obrizgavač (uzorak 300 pčela)</li>
  <li>Lepljiva ploča 24h / bez mreže 24h</li>
</ul>
<p>App automatski računa <b>grinja na 100 pčela</b>. Badge je zelen (&lt;3) ili crvен (≥3 — prag tretmana).</p>
<div class="warn">
  <b>⚠ Alert:</b> App prikazuje upozorenje za košnice bez merenja >30 dana.
</div>
</div>

<!-- ════════════ 4b. EVIDENCIJA nastavak ════════════ -->
<div class="page page-break">
<h1>4. Evidencija — nastavak</h1>

<h2>🏠 Nukleusi</h2>
<p>Dodaj nukleus pri svakoj podjeli. Polja:</p>
<table>
  <tr><th>Polje</th><th>Opis</th></tr>
  <tr><td>Oznaka</td><td>Npr. N-01-2026</td></tr>
  <tr><td>Datum podjele</td><td>—</td></tr>
  <tr><td>Roditeljska košnica</td><td>Iz koje košnice je napravljen</td></tr>
  <tr><td>Okviri / pčele</td><td>Slobodan tekst: npr. "5 okvira, 1kg pčela"</td></tr>
  <tr><td>Sadržaj</td><td>Matičnjak ☑ / Zrela matica ☑ / Zatvoreno leglo ☑</td></tr>
  <tr><td>Status</td><td>Aktivan · Postala košnica · Prodat · Ujedinjen · Izgubljen</td></tr>
  <tr><td>Destinacija</td><td>Link na košnicu (kad nukieus preraste)</td></tr>
</table>

<h2>👑 Uzgoj matica</h2>
<p>Praćenje celih ciklusa od grafinga do uvođenja matice:</p>
<table>
  <tr><th>Polje</th><th>Opis</th></tr>
  <tr><td>Naziv / serija</td><td>Npr. "Serija A-2026"</td></tr>
  <tr><td>Datum grafinga</td><td>Obavezan</td></tr>
  <tr><td>Roditeljska košnica</td><td>Izvor larvi</td></tr>
  <tr><td>Larve / prihvaćeni</td><td>Npr. 20 larvi → 15 prihvaćenih</td></tr>
  <tr><td>Zatvaranje matičnjaka</td><td>Datum</td></tr>
  <tr><td>Izlazak matica</td><td>Datum</td></tr>
  <tr><td>Uvođenje</td><td>Datum uvođenja u košnicu</td></tr>
  <tr><td>Status</td><td>U toku 🔄 · Gotovo ✅ · Nije uspelo ❌</td></tr>
</table>

<h2>❄️ Zimovanje</h2>
<p>Jedanput godišnje po pčelinjaku. Polja: datum zatvaranja, zimske pogačice (kg), procena populacije (1–5), checklist (ulaz sužen, mišolovka, ventilacija, izolacija).</p>

<h2>💊 Tretmani</h2>
<p><b>Preparati:</b> Apivar · Apiguard · ApiLifeVar · Thymovar · Oksalna kiselina (kapanje/sublimacija) · Amitraz · Mravlja kiselina · Drugo</p>
<p>Unesi datum početka i završetka. Aktivan tretman se prikazuje kao narandžasti badge na kartonu košnice i u Evidenciji.</p>
</div>

<!-- ════════════ 5. TEZGA ════════════ -->
<div class="page page-break">
<h1>5. Tezga</h1>

<p>Evidencija zaliha i prodaje. Četiri sekcije unutar Tezga taba:</p>

<h2>📦 Kante (bulk zalihe)</h2>
<p>Veće posude u kojima čuvaš med nakon berbe.</p>
<table>
  <tr><th>Polje</th><th>Opis</th></tr>
  <tr><td>Tip meda</td><td>Bagreni, Livadski, Lipa...</td></tr>
  <tr><td>Kg</td><td>Količina u kanti</td></tr>
  <tr><td>Datum</td><td>Datum punjenja</td></tr>
</table>
<p>Dugme <b>📥 Excel</b> — uvezi iz Excel fajla (kolone: Tip meda | Kg | Datum | Napomena).</p>

<h2>🫙 Tegle (inventar)</h2>
<p>Pretočeni i zapakovani med spreman za prodaju.</p>
<table>
  <tr><th>Polje</th><th>Opis</th></tr>
  <tr><td>Tip meda</td><td>—</td></tr>
  <tr><td>Veličina tegle</td><td>0.25 kg / 0.5 kg / 1 kg / itd.</td></tr>
  <tr><td>Broj tegli</td><td>Kom</td></tr>
  <tr><td>Kg</td><td>Auto-računanje iz veličine × broj</td></tr>
</table>
<p>Dugme <b>📥 Excel</b> — uvezi iz Excel fajla (kolone: Tip meda | Veličina tegle | Broj tegli | Kg | Napomena).</p>

<h2>💰 Prodaja</h2>
<p>Svaka prodaja se bilježi posebno. Polja: datum, tip meda, tegla, kom, iznos (RSD), kupac, napomena.</p>

<h2>🟡 Ostali pčelinji proizvodi</h2>
<p>Vosak · Perga · Propolis · Polen · Matični mleč · Drugo. Polja: vrsta, datum, količina + jedinica (kg/g/kom), cena po jedinici.</p>

<h2>Filter i export</h2>
<p>Na vrhu Tezge nalazi se filter traka: <b>tip meda</b> · <b>datum od/do</b> · <b>min kg</b>. Svi filter-i utiču i na CSV export.</p>
<p>Dugme <b>📊 Export (CSV)</b> u Podešavanjima → izvlači Prodaju i Berbu u CSV koji Excel direktno otvori.</p>
</div>

<!-- ════════════ 6. PODEŠAVANJA ════════════ -->
<div class="page page-break">
<h1>6. Podešavanja</h1>

<h2>Profil pčelinjaka</h2>
<p>Naziv pčelinjaka, vlasnik, telefon, lokacija. Prikazuje se na Home naslovu.</p>

<h2>🏘 Pčelinjaci (multi-lokacija)</h2>
<p>Dodaj svaku lokaciju posebno (voćnjak, šuma, livada...). Svaki pčelinjak dobija <b>boju</b> iz palete 8 boja — olakšava prepoznavanje.</p>
<div class="steps">
  <div class="step"><div class="step-num">1</div><div class="step-body">Podešavanja → Upravljaj pčelinjacima</div></div>
  <div class="step"><div class="step-num">2</div><div class="step-body">Klikni + → unesi naziv, lokaciju, izaberi boju</div></div>
  <div class="step"><div class="step-num">3</div><div class="step-body">Košnice → forma → izaberi pčelinjak za svaku košnicu</div></div>
</div>

<h2>💾 Backup i Restore</h2>
<div class="warn">
  <b>⚠ OBAVEZNO:</b> Podaci su samo na telefonu. Ako izgubis telefon, gubiš sve podatke bez backupa!
</div>
<p><b>Backup:</b> Podešavanja → 💾 Backup (JSON) → fajl <em>honey-backup-DATUM.json</em> preuzima se na telefon. Odmah ga pošalji na Google Drive ili email.</p>
<p><b>Restore:</b> Podešavanja → 📥 Restore → izaberi backup JSON fajl → potvrdi. Svi trenutni podaci se brišu i zamjenjuju backup-om.</p>

<div class="tip">
  <b>💡 Preporučeno:</b> Pravi backup jednom nedeljno ili posle svakog velikog unosa (npr. posle sezone berbe).
</div>
</div>

<!-- ════════════ 7. BERBA ════════════ -->
<div class="page page-break">
<h1>7. Berba (ekstrakcija)</h1>

<p>Evidencija → 🍯 Berba</p>

<table>
  <tr><th>Polje</th><th>Opis</th></tr>
  <tr><td>Datum berbe</td><td>—</td></tr>
  <tr><td>Tip meda</td><td>Bagreni, Livadski, Lipa, Šumski, Suncokret, Zlatošipka...</td></tr>
  <tr><td>Kg</td><td>Ukupna masa</td></tr>
  <tr><td>Cena/kg (RSD)</td><td>Opciono — za kalkulaciju vrednosti</td></tr>
  <tr><td>Košnice</td><td>Višestruki izbor — koje košnice su contribuirale</td></tr>
  <tr><td>Napomena</td><td>—</td></tr>
</table>

<p>Berba se prikazuje u:</p>
<ul style="margin-left:1.2rem;line-height:1.9">
  <li>Evidencija → Berba (lista svih)</li>
  <li>Karton košnice → sekcija "Berba" (berbe za tu košnicu)</li>
  <li>📊 Analitika → grafikoni po godini i tipu meda</li>
  <li>Home ekran → "Prinos GGGG." tile</li>
</ul>

<h2>📊 Analitika</h2>
<p>Home → Analitika dugme. Prikazuje:</p>
<ul style="margin-left:1.2rem;line-height:1.9">
  <li>Horizontalni grafikon: prinos (kg) + prihod po godini</li>
  <li>Tabela po tipu meda</li>
  <li>Rang lista košnica (🥇🥈🥉 po kg berbe)</li>
  <li>Inspekcije po godini</li>
  <li>Filter po pčelinjaku</li>
</ul>
</div>

<!-- ════════════ 8. CHECKLIST ════════════ -->
<div class="page page-break">
<h1>8. ✅ Checklist za prvu upotrebu</h1>

<div class="card green">
  <b>Uradi ovo redom pri prvom otvaranju app-e:</b>
</div>

<h2>Osnovna podešavanja</h2>
<ul class="checklist">
  <li><div class="check-box"></div>Otvori <b>Podešavanja</b> → unesi naziv pčelinjaka, svoje ime, telefon</li>
  <li><div class="check-box"></div>Idi na <b>Pčelinjaci</b> → dodaj svaku lokaciju (voćnjak, šuma, itd.) sa bojom</li>
</ul>

<h2>Unos košnica</h2>
<ul class="checklist">
  <li><div class="check-box"></div>Tab <b>Košnice</b> → klikni + za svaku košnicu</li>
  <li><div class="check-box"></div>Unesi oznaku, dodeli pčelinjak, tip, godinu matice</li>
  <li><div class="check-box"></div>Opciono: fotografiši svaku košnicu direktno u formi</li>
  <li><div class="check-box"></div>Postavi status: Aktivna / Slaba / Ugašena</li>
</ul>

<h2>Prva inspekcija</h2>
<ul class="checklist">
  <li><div class="check-box"></div>Klikni na košnicu → <b>+ Inspekcija</b></li>
  <li><div class="check-box"></div>Unesi matica, leglo, snagu, zalihe</li>
  <li><div class="check-box"></div>Postavi <b>sledeću inspekciju</b> — datum ili "za N dana"</li>
  <li><div class="check-box"></div>Ponovi za sve košnice</li>
</ul>

<h2>Evidencija aktuelnog stanja</h2>
<ul class="checklist">
  <li><div class="check-box"></div><b>Evidencija → Varroa</b> → unesi poslednja merenja (ako imaš)</li>
  <li><div class="check-box"></div><b>Evidencija → Tretmani</b> → unesi aktivne tretmane</li>
  <li><div class="check-box"></div><b>Evidencija → Nukleusi</b> → unesi aktivne nukleuse</li>
  <li><div class="check-box"></div><b>Tezga → Kante</b> → unesi trenutne zalihe meda (ili uvezi Excel)</li>
  <li><div class="check-box"></div><b>Tezga → Tegle</b> → unesi inventar tegli (ili uvezi Excel)</li>
</ul>

<h2>Sigurnost podataka</h2>
<ul class="checklist">
  <li><div class="check-box"></div><b>Podešavanja → 💾 Backup</b> → napravi prvi backup i sačuvaj na Google Drive</li>
  <li><div class="check-box"></div>Postavi podsjetnik u kalendaru za nedeljni backup</li>
</ul>

<h2>Svakodnevna upotreba</h2>
<ul class="checklist">
  <li><div class="check-box"></div>Pri svakoj inspekciji: otvori karticu košnice → + Inspekcija</li>
  <li><div class="check-box"></div>Pri svakom hranjenju: Evidencija → Hranjenje → + (možeš birati sve košnice odjednom)</li>
  <li><div class="check-box"></div>Pri svakom tretmanu: Evidencija → Tretmani → +</li>
  <li><div class="check-box"></div>Pri berbi: Evidencija → Berba → + (odaberi košnice)</li>
  <li><div class="check-box"></div>Varroa merenje: Evidencija → Varroa → + (app automatski izračuna grinje/100)</li>
</ul>

<div class="footer">
  Honey Toolbox v0.9 · Belora Ventures Studio · Juli 2026 · https://plocicmilan.github.io/miniuniverse/honey/
</div>
</div>

</body>
</html>"""


def main():
    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as f:
        f.write(HTML)
        tmp = f.name

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto("file:///" + tmp.replace("\\", "/"))
            page.wait_for_load_state("networkidle")
            page.pdf(
                path=str(OUT),
                format="A4",
                print_background=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"}
            )
            browser.close()
        print(f"OK: {OUT}")
    finally:
        os.unlink(tmp)


if __name__ == "__main__":
    main()
