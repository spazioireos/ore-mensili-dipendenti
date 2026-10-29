# Istruzioni per Claude — app "Report Ore mensile" (Dipendenti)

Report delle **ore mensili dei dipendenti**: griglia giorno per giorno, codici di assenza,
Banca ore, tetto annuo, contratti e export.

- **Unico file**: `index.html` (~477 KB), **React + Babel standalone** (JSX nel browser).
- **Dati**: Firebase progetto `spazio-ireos-foglio-ore`, documento `report-ore-mensile/{uid}`.
  Accesso mail+password, **solo l'admin** `spazioireos@gmail.com`.
- ⚠️ **TRAPPOLA GIÀ COSTATA UN ERRORE**: nel documento i campi (`dipendenti`, `dati`, …) stanno
  al **PRIMO LIVELLO**, NON dentro un campo `state`. Leggere `snap.data()`, non `snap.data().state`.
- **Struttura dati**: `dipendenti[]` = `{id, nome "COGNOME NOME", …}`;
  `dati["YYYY-MM"][dipId].giorni` = mappa giorno → NUMERO (ore) **oppure** STRINGA-codice
  (assenza, vale 0 ore; codici in `CODICI`/`CODE_SET`). Totale mese = `totOfRec(rec,y,m)`.
- **Numero di revisione**: costanti `APP_VER` e `APP_DATA` in cima al codice, mostrate nella
  targhetta `.app-rev` della testata. **Attuale: ver61 · 29ott26.** `APP_VER` finisce anche nei
  nomi dei file esportati: incrementarla, non affiancarle un secondo numero.
- **Funzione presente**: confronto non vincolante con l'app "Fogli ore" (SOLA LETTURA delle
  collection `users` e `timesheets` dello stesso progetto Firebase). Non scrivere MAI lì.
- **Verifica prima del commit**: compilare l'intero blocco `<script type="text/babel">` con
  Babel preset-react e fare `node --check` sull'output.
- **Non toccare senza richiesta esplicita**: Banca ore, tetto annuo, `monteFissoMese`,
  `quotaGiorno`, `coverAbsHours`, gli export Excel/PDF, la generazione dei contratti.

## Regole di lavoro (valgono sempre)

1. **Le modifiche a questa app le fa Claude**, lavorando direttamente su questo repository.
   Decisione di Christian del 29/10/2026. NON usare altre chat per generare un `index.html`
   da caricare a mano.
2. **MAI caricare con "Add files via upload" un file preso dal computer**: sostituisce il file
   e cancella le aggiunte fatte qui. Se proprio serve, scaricare PRIMA la versione aggiornata
   da GitHub ("Download raw file"), modificare quella, poi ricaricarla.
3. **Lavorare sempre sul ramo `claude/integrated-app-feasibility-8d1wg0`**, mai direttamente su
   `main`. Si porta su `main` SOLO quando Christian lo chiede esplicitamente ("porta su main").
4. **Prima di committare: verificare che il codice compili** (vedi sotto, cambia per app).
   Non fidarsi dei test: il 28/10 un errore sul percorso dei dati era passato ai test ed è stato
   trovato solo rileggendo il codice.
5. **A ogni revisione: incrementare il numero di revisione mostrato nell'app** (vedi sotto).
   Serve a Christian per capire se sta guardando la versione aggiornata e non una copia in cache.
6. **Claude non viene avvisato dei caricamenti di Christian**: all'inizio di ogni sessione,
   verificare se il ramo è rimasto indietro rispetto a `main` e, se sì, riallinearlo PRIMA di
   lavorare. Non unire mai un ramo che non contiene tutto `main`: cancellerebbe lavoro di Christian.
7. **La pagina integrata** (`integrata/index.html` nel repo `rendicontazione-usoint`) apre i LINK
   LIVE delle app: quando si modifica questa app NON va aggiornata, si aggiorna da sé.
8. Rispondere in italiano, senza narrare i passaggi; chiedere il nulla osta (Nu*) prima di costruire.


## 9. REGOLA ANTI-DOCUMENTI-VECCHI (importante)

Un documento invecchia nell'istante in cui si cambia il codice. Quindi **ogni modifica a questa
app deve includere, NELLO STESSO commit**:

1. **l'incremento del numero di revisione** mostrato nell'app (e della data);
2. **l'aggiornamento di questo file `CLAUDE.md`**, se la modifica cambia qualcosa di ciò che
   descrive (modello dati, funzioni presenti, cose da non toccare, numero di revisione attuale);
3. **l'aggiornamento di `master.md`** (sta nel repo `rendicontazione-usoint`), che è il riepilogo
   generale del sistema.

Non rimandare: una modifica committata senza aggiornare questi tre punti lascia la
documentazione che mente, ed è peggio di non averla. Se Christian chiede una modifica e questi
aggiornamenti non sono stati fatti, farli prima di dire che il lavoro è finito.
