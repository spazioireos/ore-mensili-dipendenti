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

La batteria storica (circa 40 script fino alla ver181) è andata persa con il contenitore il 15-19/11/2026:
va ricostruita qui, un pezzo alla volta.
| `a00-comune.cjs` | funzioni comuni agli script a01…a08 (seme inventato, PIN, cattura dei file) | — |
| `a01-accesso-viste.cjs` … `a08-ritest-storici.cjs` | collaudo di Livello A del 19/11/2026: accesso e viste, Tabellone, dati/backup/import, Anagrafica, Costo orario, report ed export, grafica e non regressione, ritest ver176-183. Accettano `ver182` come argomento per il confronto | 32/32 · 47/50 · 26/27 · 26/30 · 27/28 · 22/22 · 64/64 · 10/10 (i falliti sono difetti preesistenti, identici sulla ver182) |
