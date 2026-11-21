# Collaudo di Dipendenti

Il contenitore in cui lavora Claude può essere ricreato in qualunque momento: resta solo quello che è su
GitHub. Per questo qui dentro ci sono gli script di prova e tutto ciò che serve a ricostruire il banco.

**Solo dati INVENTATI.** Il repository è pubblico: backup veri, cedolini e LUL stanno nella cartella privata di Google Drive
«Dati collaudo Spazio Ireos», mai qui.

## Come si usa

```
bash collaudo/prepara-banco.sh ver181     # installa le librerie, costruisce il banco, lo serve su :8300
node collaudo/ver182.cjs                  # collaudo della ver182 (44 controlli)
node collaudo/ver183.cjs                  # collaudo della ver183 (27 controlli; banco preparato con ver182)
```

- `prepara-banco.sh [versione]`: installa in `collaudo/.strumenti` le stesse librerie che l'app carica da
  internet (react 18, babel standalone, xlsx, jsPDF 2.5.1 e autotable 3.8.2), costruisce `collaudo/.banco/dip`
  (l'app di oggi in modalità locale con PIN, senza Firebase) e, se indicata, una versione vecchia presa dalla
  storia git (`collaudo/.banco/ver181`) per il confronto. Fa anche la verifica Babel + `node --check`.
- ⚠️ **Dopo ogni modifica a `index.html` rieseguire `python3 collaudo/rigenera.py`**, altrimenti si misura la
  versione di prima.
- `controlla-sintassi.js`: solo la verifica di compilazione.
- I PDF e le immagini prodotti dalle prove finiscono in `collaudo/out/` (non si salvano).

## Script presenti

| script | che cosa prova | esito sulla versione salvata |
|---|---|---|
| `ver182.cjs` | quota del giorno, trattenute solo ASS.ING/ASP 0h, box, riquadro, report «conto per le paghe», gli altri quattro report, confronto con la ver181, 390 e 1280 px | 44/0 (ver184: i quattro report tolti dalla ver183 si generano chiamando la funzione, e la versione nei nomi dei file si legge dal file dell'app) |
| `ver183.cjs` | «Report PDF A4 per le paghe»: due soli pulsanti, un foglio per mensilizzato, TOTALE = voci del cedolino, ORE MESE = somma, = `cedOre`, MAL/ASS.ING, settembre, Report PDF A4 ancora generato | 27/0 |
| `ver184.cjs` | regola dei minuti (celle, Compila veloce, permesso, lettura dei sesti), TS al passo con lo scarto delle ORE MESE sull'ultima riga, box = TS = `cedOre` = Costo orario = Tetto, Risultato vero, mesi non mensilizzati come la ver183, le cinque correzioni del collaudo (il punto 5 sul banco comune 8344: `node collaudo/ver184.cjs 8344`) | 65/0 |
| `ver185.cjs` | ore a tre decimali (celle, pillole, TOT, box, permessi, Riepiloghi, Costo orario, TS), regola dei minuti a tre cifre (,167 ,250 …), caratteri al 90% nelle caselle, «ORE CONTRATTUALI» e «ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI», nessun numero diverso dalla ver184 (banco preparato con ver184) | 30/0 |
| `ver186.cjs` | entrando in una cella delle ore (clic, Tab, tocco a 390px) il contenuto si seleziona tutto e il primo tasto lo sostituisce; secondo clic = cursore; entra/esci senza scrivere non cambia niente; «x» rifiutato senza svuotare; «F», 13 ore e minuti come prima; Ore dichiarate e ore del permesso; Compila veloce non toccata; confronto con la ver185 (banco preparato con ver185). Argomento facoltativo: cartella in cui salvare `cella-selezionata.png` | 20/0 |
| `ver187.cjs` | «📤 Pubblica i residui» scrive `dip:true` agli agganciati (con/senza/fuori massimale), non per i cessati prima del mese; non agganciati come prima; pastiglie della chiusura del mese di Fogli ore (`meseChiuso`/`completamento`) nel Tabellone; zero scritture in users/timesheets; numeri identici alla ver186. **Banco comune**: `bash ../rendicontazione-usoint/collaudo/comune/prepara-comune.sh 8344` + la ver186 congelata in `comune/.banco/dip186/` (`git show <commit ver186>:index.html > x.html; python3 localizza.py x.html .banco/dip186/index.html`). Uso: `node collaudo/ver187.cjs 8344 [cartella-png]` | 32/0 |
| `ver189.cjs` | «🖨️ Report PDF A4 per le paghe» della ver189: A4 orizzontale, tre per pagina, solo nominativo e mese, nessuna legenda né riquadro, righe in **ore,minuti** (minuti 00-59, somma = totale ± 1 min a riga), **TOTALE in centesimi** = voci del cedolino (`oreSuppPeriodo`) = `cedOre`; MAL 3,10; ASS.ING; settembre senza fogli; Report storico ancora in ore,minuti. Rifà sul formato nuovo i controlli numerici di `ver183.cjs` (P6-P12), `ver184.cjs` (M22-M30) e `ver185.cjs` (R26-R27), che leggono il formato vecchio (una persona per pagina, millesimi, riquadro) e da qui in avanti **falliscono di proposito**: superati, non regressioni | 34/0 |
| `ver194.cjs` | I due report A4 con le ore **anche a parole** («4,50 (4 h e 50 min)»): report per le paghe **una persona per pagina**, ogni ora,minuti seguita dalle sue parole giuste, TOTALE «centesimi (ore,minuti = h e min)» = voci del cedolino, MAL «3,10 (3 h e 10 min)», ASS.ING «3,00 (3 h)»; Report storico con le parole sotto i numeri (mai lette come decimali: «2,45 (2 h e 45 min)»), TOT ORE RESE «101,50 (101,30 = 101 h e 30 min)», più pagine con «(segue)», permesso «Aggiungere 1,30 ore (1 h e 30 min) di permesso (EXF)». Sostituisce `ver189.cjs`, che da qui **fallisce di proposito** sul formato vecchio | 37/0 |
| `ver195.cjs` | Report per le paghe: le ore ordinarie in più del cedolino **mai sui giorni AN** (prima sui giorni vuoti, poi in proporzione sui lavorati); confronto con la ver194 congelata (`python3 collaudo/rigenera.py ver194`); totali identici | 6/0 |
| `ver196.cjs` | ASS.ING e ASP 0h nei mesi mensilizzati: sempre la quota del giorno (18 h/sett. → 3 h), le ore in più degli altri giorni diventano supplementari (report, box, pastiglia del Tabellone); Risultato del mese, mesi senza ASS.ING e non mensilizzati identici alla ver195 congelata (`python3 collaudo/rigenera.py ver195`) | 17/0 |
| `ver197.cjs` | Capsula «Devi riempire ancora per» = ore che devono risultare − TOT teorico (segno, colori, assente nella ver196); linguette «E»/«NE» sotto assenze e festività con i numeri identici alla ver196; riga di spiegazione solo nei mesi che ne hanno bisogno; tabella del mese non più larga, 390px senza scorrimento (`python3 collaudo/rigenera.py ver196`) | 15/0 |

**20/11/2026, ver197** (capsula «Devi riempire ancora per», linguette E/NE): `ver197` 15/0 · `ver196` 17/0 · `a02` 50/0 · `a01` 32/0 · `a06` 23/0 · `ver182` 44/0 · `ver186` 20/0 · `ver185` 28/2 (R26/R27, come sempre) · `a07` 62/2 — normalizzazione estesa alle scritte nuove; i due falliti sono **voluti della ver196** su BETA (ASS.ING del 12 compensata: nel riquadro «+1,667 h da pagare in più» invece di «mancano 1,500», e €/h 105,56 → 105,58). La prima esecuzione aveva trovato le sigle E/NE della riga di spiegazione a 11px fuori dalla griglia: portate a 12,5px.

**20/11/2026, ver196** (ASS.ING/ASP 0h a quota piena): `ver196` 17/0 · `ver195` 6/0 · `ver194` 37/0 · `a06` 23/0 · `a02` 50/0 · `a05` 28/0 · `a01` 32/0 · `a03` 27/0 · `a04` 30/0 · `a08` 10/0. Nessuna cella ASS.ING/ASP 0h nei dati veri (backup del 19/11).

**20/11/2026, ver195** (mai ore su AN nel report paghe): `ver195` 6/0 · `ver194` 37/0 · `a06` 23/0 · `a02` 50/0.

**20/11/2026, ver194** (ore anche a parole nei report A4): `ver194` 37/0 · `a06` 23/0 (A06.02/03/06/07/10 aggiornati, A06.03b nuovo) · `a01` 32/0 · `a02` 50/0 · `a03` 27/0 · `a04` 30/0 · `a05` 28/0 · `a07` 64/0 · `a08` 10/0 · `ver182` 44/0 · `ver186` 20/0 · `ver185` 28/2 (R26/R27: il TS vecchio, già superati dalla ver189).

**20/11/2026, ver192** (l'operatore che entra in Fogli ore non viene più buttato fuori): `a01` 32/0 · `ver187` 32/0 · `ver189` 34/0 · `ver184` 52/13 (i 13 sono i controlli del report vecchio, sostituiti da `ver189`) · interconnessioni `ic-01-b8` 11/11 e `ic-02-b8b-sessione` 9/9 nel repo USOINT.

**20/11/2026, ver191** (totali «centesimi (ore,minuti)»): `ver189` 34/0 · `a02` 50/0 · `a04` 30/0 · `a06` 22/0 · `a07` 64/0.

**20/11/2026, ver190**: righe in calce del Report storico in ore,minuti (Q16 di `ver189.cjs`); `a01` 32/0 · `a02` 50/0 · `a06` 22/0 · `ver189` 28/0.

**20/11/2026, ver189** (report in ore,minuti, tetto 13 h sul permesso, conferme sulle ✕, autore «Christian»): `a01` 32/0 · `a02` **50/0** (A02.35 ora superato) · `a03` 27/0 · `a04` **30/0** (A04.27 ora superato) · `a05` 28/0 · `a06` 22/0 (A06.06/08/10 aggiornati al formato nuovo) · `a07` 64/0 · `a08` 10/0 · `ver186` 20/0 · `ver187` 32/0 (targhetta letta dal file) · `ver189` 27/0.

La batteria storica (circa 40 script fino alla ver181) è andata persa con il contenitore il 15-19/11/2026:
va ricostruita qui, un pezzo alla volta.
| `a00-comune.cjs` | funzioni comuni agli script a01…a08 (seme inventato, PIN, cattura dei file) | — |
| `a01-accesso-viste.cjs` … `a08-ritest-storici.cjs` | collaudo di Livello A del 19/11/2026: accesso e viste, Tabellone, dati/backup/import, Anagrafica, Costo orario, report ed export, grafica e non regressione, ritest ver176-183. Accettano `ver182` come argomento per il confronto | 32/32 · 47/50 · 26/27 · 26/30 · 27/28 · 22/22 · 64/64 · 10/10 (i falliti sono difetti preesistenti, identici sulla ver182) |
