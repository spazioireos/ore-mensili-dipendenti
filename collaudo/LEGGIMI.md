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
| `ver182.cjs` | quota del giorno, trattenute solo ASS.ING/ASP 0h, box, riquadro, report «conto per le paghe», gli altri quattro report, confronto con la ver181, 390 e 1280 px | 44/0 (dalla ver183 falliscono i controlli dei quattro report tolti: voluto) |
| `ver183.cjs` | «Report PDF A4 per le paghe»: due soli pulsanti, un foglio per mensilizzato, TOTALE = voci del cedolino, ORE MESE = somma, = `cedOre`, MAL/ASS.ING, settembre, Report PDF A4 ancora generato | 27/0 |

La batteria storica (circa 40 script fino alla ver181) è andata persa con il contenitore il 15-19/11/2026:
va ricostruita qui, un pezzo alla volta.
