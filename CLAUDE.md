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
  targhetta `.app-rev` della testata. **Attuale: ver71 · 03nov26.** `APP_VER` finisce anche nei
  nomi dei file esportati: incrementarla, non affiancarle un secondo numero.
- **Tutto il dipendente si gestisce dalla scheda ANAGRAFICA** (da ver62, 31/10/2026). La
  finestrella "Modifica dipendente" (`DipModal`) **è stata eliminata**: era un doppione per
  livello, ore settimanali, tipo di contratto e date, e l'unico posto per cinque cose che ora
  stanno in fondo alla scheda, nel componente **`SchedaContratto`**: *Trasformaz./proroghe*,
  *Monte ore (anche temporaneo)*, *Mensilizzazione*, *Massimali annui*, *Colore della scheda*.
  I dati restano **negli stessi campi di prima** (`dp.proroghe`, `dp.trasformazioni`,
  `dp.orariTemp`, `dp.mensilizzato`/`mensilizzatoDal`, `dp.tettiAnnui`/`tettoAnnuo`/
  `tettoPeriodo`, `dp.colore`): **nessun calcolo è stato toccato**.
  Scrivono tramite **`onDipPatch(dipId, campi)`**, che **unisce** i campi al dipendente invece di
  sostituirlo: il vecchio `saveDip` rimpiazzava l'intero oggetto, ed è il motivo per cui le
  modifiche fatte nella finestrella potevano non comparire nella scheda.
  La matita ✎ e "+ Dipendente" ora **aprono o creano la scheda in ANAGRAFICA** (`apriScheda`,
  `addDipDiretto`); `Anagrafica` accetta `selInit` e viene rimontata con `key`.
  Corretto anche un difetto **preesistente** che la nuova navigazione rendeva visibile: nella
  testata, in vista Anagrafica, compariva "📅 undefined 2026" (perché `mese` è `null` fuori dalle
  viste mensili); ora mostra "📇 Anagrafica".
- **Straordinario / "Ore in più / in meno"** — **regola definitiva, confermata con un numero da
  Christian il 31/10/2026**: `delta del mese = ore rese + ore di assenza retribuita − monte del
  mese`. Le assenze retribuite **contano come ore lavorate** e concorrono a raggiungere il monte
  ore contrattuale; lo straordinario si paga su quanto eccede il contrattualizzato e le ore non
  dovute si trattengono, **tutto dentro lo stesso mese**: Spazio Ireos **non usa la Banca ore**.
  Esempio deciso da Christian: contratto 165 h, lavora 165 h e ha 2 giorni di ferie (12,69 h) →
  **+12,69 di straordinario**.
  ⚠️ **Storia da non ripetere**: in ver64 questo conto era stato cambiato (le assenze coprivano
  solo le ore mancanti senza fare straordinario) ed è stato **rimesso com'era in ver65**, perché
  la regola era stata fraintesa. Non ricambiarlo senza che Christian lo chieda **con un numero
  davanti**, come in questo esempio.
- **"Ore dichiarate" e Conguaglio ore**: nel report mensile la casella *Ore dichiarate (uso
  interno)* si compila per **tutti** i dipendenti, **mensilizzati compresi** (da ver63,
  31/10/2026: prima era nascosta da `{!dp.mensilizzato ? … : null}`, e il meccanismo del
  conguaglio restava inutilizzabile proprio per loro, che sono quelli pagati "in via teorica"
  quando il lavoratore non consegna le ore in tempo). La differenza fra dichiarato e calcolato
  **si riporta da sola nei mesi successivi**: `saldoPrec()` somma `dichiarate − calcolate` dei
  mesi precedenti e riparte da zero dopo l'ultimo mese con `saldoAzzerato`. Il riquadro
  "Conguaglio ore" era già visibile a tutti: mancava solo il modo di scrivere il dato.
- **Compila veloce — scelta dei giorni** (da ver68, 01/11/2026). In `QuickFillModal` c'è un
  gruppo "Quali giorni del mese" con tre modi (`modo`): **`mese`** (tutto il mese, è il
  comportamento di sempre ed è il predefinito), **`intervallo`** (`dal`/`al`, numeri del giorno)
  e **`elenco`** (`elenco`, numeri separati da virgola o spazio). Nel modo *elenco* valgono
  **solo** i giorni scritti: i giorni della settimana e il salto dei festivi **non filtrano**,
  altrimenti scrivere "7" con la domenica deselezionata non riempirebbe nulla senza spiegazione;
  i numeri fuori dal mese vengono contati e segnalati, non applicati. Il resto della finestra
  (valore, giorni della settimana, salta festivi, sovrascrivi, conferma) è invariato.
- **Date di avvio automatiche** (da ver69, 02/11/2026). Nel modulo dell'anagrafica le caselle
  *Data di avvio proroga* e *Data di avvio trasformazione* erano **scritte, salvate e mai usate**:
  nessuna lettera le leggeva, nessun calcolo le guardava. Ora sono **di sola lettura e si
  calcolano da sole** (tipo `roauto:proroAvvio` / `roauto:trasfAvvio`, chiavi `__proroAvvio` /
  `__trasfAvvio`, funzioni `proroAvvioAuto` = giorno dopo la scadenza precedente, e
  `trasfAvvioAuto` = decorrenza dell'ultima trasformazione registrata). ⚠️ I vecchi valori
  `ana.proroAvvio` / `ana.trasfAvvio` **restano nel database e non vengono cancellati**:
  semplicemente non si leggono più. Nell'**export Excel** le due colonne **restano al loro posto**
  (43ª e 46ª su 50) con il valore automatico: cambia solo l'intestazione, da "(GG/MM/AAAA)" a
  "(AUTOMATICA)". Il contrario — dedurre il riquadro *Trasformaz./proroghe* dai dati della
  lettera — **non si fa**: quel riquadro muove i calcoli di tutti i mesi successivi e deve restare
  una scrittura voluta.
- **Mensilizza tutti dal mese…** (da ver69, 02/11/2026). In ANAGRAFICA, riga "Azioni su tutti":
  apre un pannello con mese + anno e l'elenco delle persone spuntate (si tolgono quelle che non
  devono esserlo), poi `onMensTutti(ids, mese, anno)` scrive `mensilizzato:true` e
  `mensilizzatoDal:"01/MM/AAAA"`. **Chiede conferma** elencando i nomi, **salta** chi è già
  mensilizzato da quella stessa data, avvisa se non è selezionato nessuno o se l'anno non è di 4
  cifre. Come tutto il resto, scrive solo in memoria: **serve 💾 per salvare**.
- **Spaziatura dell'anagrafica (ver69)**: la griglia dei campi ha classe **`.ana-grid`**; gap
  8→6px, margine delle sezioni 12→8px, margine sotto le etichette 4→2px (regola CSS in fondo al
  `<style>`). ⚠️ **L'altezza delle caselle non si tocca** (resta 38px): si stringono solo gli
  spazi, non i bersagli da toccare col dito. Misurato: modulo da 3298px a 3171px, stessi 53
  campi, zero caselle sotto i 32px.
- **I "+ Aggiungi …" aprono le caselle** (da ver70, 02/11/2026). Nei quattro riquadri in fondo
  alla scheda (proroghe, trasformazioni, monte ore temporaneo, massimali annui) le caselle non
  stanno più sempre a vista: si vede **solo il pulsante**, che le apre; poi **✔ Aggiungi** registra
  e **Annulla** richiude svuotando quello che era stato scritto. Stati `apPro`/`apTra`/`apOt`/
  `apTet`, funzioni di chiusura `chiudiPro`/`chiudiTra`/`chiudiOt`/`chiudiTet`.
  ⚠️ Gli `add…` ora **restituiscono `true`/`false`** (prima facevano `return` muto) e, quando non
  registrano, scrivono il motivo in `errPro`/`errTra`/`errOt`/`errTet`: senza quel messaggio il
  clic su ✔ non avrebbe spiegazione. **Le regole di validazione sono rimaste identiche**, è
  cambiato solo cosa succede dopo. Misurato: i riquadri in fondo passano da 976 a 922 px.
  *+ Aggiungi sostituzione* e *+ Aggiungi voce* (vista del mese) **non sono stati toccati**: lì il
  pulsante aggiunge subito una riga vuota, è un meccanismo diverso.
- **Mensilizzazione: normale dal 01/10/2026** (da ver70, decisione di Christian del 02/11/2026).
  Costante **`MENS_DAL_DEFAULT = "01/10/2026"`**. Un **dipendente nuovo** nasce con
  `mensilizzato:true` e `mensilizzatoDal:"01/10/2026"`; il pannello "Mensilizza tutti" e la casella
  *Dal mese/Anno* della scheda partono da quella data invece che dal mese corrente. ⚠️ **Nessun
  dipendente esistente è stato cambiato dal codice**: su quelli si usa il pulsante "Mensilizza
  tutti", che chiede conferma. La spunta resta un dato della persona (scelta **2a**): l'idea di
  considerare mensilizzati tutti per difetto, con una spunta "eccezione" al contrario (2b), è
  stata **scartata**, perché toglierebbe la traccia di chi è mensilizzato e da quando.
- 💶 **COSTO ORARIO** (nuova linguetta, da ver71, 03/11/2026). Ricostruisce il foglio
  *Criteri orari* del file Excel di Christian (*Costo orario dipendenti - 02nov26 - ver8*):
  costo totale del dipendente ÷ ore effettivamente rendicontate. **Verificata sui 5 casi del
  file**: 20,73 · 20,63 (TFR-supplementari NO) · 20,88 · 21,74 · 20,40 €/h, al centesimo.
  Funzioni: `calcCosto(o)` (il motore, specchio delle celle J5…J35/F38/H38 del foglio),
  `datiCosto(state,dp,pairs)` (mette insieme scheda + valori comuni + scostamenti),
  `mesiInPeriodo`, `oreRendPeriodo`, `addizTDAuto`, `oreSettPeriodo`, `indetAFine`,
  componente **`CostoOrario`**. Tabelle `MINIMI_CCNL` (Ott25/Ott24, livelli B1→E2) e
  `COSTO_COMUNE_DEF`.
  - **Dati**: `state.costoComune` (valori uguali per tutti) e `dp.costo` (scostamenti della
    singola persona). **Nessun calcolo preesistente è stato toccato**: il costo orario legge e
    basta (ore dei mesi con lo stesso `totOfRec` dei Riepiloghi, contratto dalla scheda).
  - **Ore rendicontabili**: tre scelte — *dai Riepiloghi* (predefinita: somma delle ore vere del
    periodo, le assenze valgono 0), *a mano*, *teoriche* (formula del foglio).
  - **Regole decise da Christian il 02/11/2026**: addizionale tempo determinato **1,40% al primo
    contratto, +0,5 a ogni proroga, 0 se diventa indeterminato** (calcolata da sé dalle proroghe
    registrate, modificabile a mano); **assistenza sanitaria 132 € fissi, solo indeterminati**,
    non proporzionata ai mesi — ⚠️ nel foglio Excel era legata all'addizionale
    (`F30 = SE(E26=0;100;0)`), qui è legata **al tipo di contratto**: è l'unica differenza voluta
    rispetto all'xlsx; **mesi contati INTERI** (prudenziale) anche se il contratto inizia o
    finisce a metà mese.
  - ⚠️ **Numeri all'italiana**: `cNum` capisce sia `1545.21` sia `1.545,21`; `cMostra` fa vedere
    il **grezzo** mentre scrivi (senza, digitando "20," la virgola sparirebbe) e il valore
    calcolato con i separatori italiani. Non sostituirle con `parseFloat` secco.
- **Funzione presente**: confronto non vincolante con l'app "Fogli ore" (SOLA LETTURA delle
  collection `users` e `timesheets` dello stesso progetto Firebase). Non scrivere MAI lì.
- **Leggibilità (ver66, 31/10/2026)**: blocco in fondo al `<style>`. Le scritte sotto i 12px
  scritte nell'attributo `style` salgono a 12,5px, i grigi chiari (#94a3b8, #cbd5e1, #9ca3af)
  diventano `#475569`, i pulsanti `.btn` sono alti almeno 40px e la casella in cui scrivi ha un
  bordo blu ben visibile. Solo aspetto.
- 🔴 **DATI PERSONALI: mai dentro `index.html`** (regola imposta il 01/11/2026 dopo un caso
  reale). Il file è pubblicato su GitHub Pages e il repository è **pubblico**: chiunque lo apre e
  lo legge; l'accesso con password protegge l'app, non il file. Fino alla ver66 contenevano dati
  veri: `DIP_INIZIALI` (10 dipendenti con inquadramento e date), `INITIAL_DATI` (~21.500 caratteri
  di ore di gennaio 2026), **`ANAGRAFICA9`** (anagrafiche complete con **codice fiscale**, luogo e
  data di nascita, **email personale**, **indirizzo di residenza**), `NOTE_RECOVERY` (note vere,
  con riferimenti a **malattie** e rimborsi) e una migrazione che nominava due dipendenti per la
  mensilizzazione. **Tutto svuotato in ver67**, lasciando i contenitori vuoti con il motivo
  scritto accanto. I dati veri stanno su Firebase e l'app li carica all'accesso: **non
  reintrodurre mai elenchi, anagrafiche, note o ore di persone reali in questo file**, nemmeno
  "solo come esempio".
- 🔴 **STORIA AZZERATA il 02/11/2026**: rimuovere i dati dal file non bastava, perché restavano
  leggibili nei commit vecchi. Christian ha **cancellato il repository** (dopo aver scaricato il
  contenuto) e lo si è **ricreato con un unico commit**, la ver68. Quindi: `main` ha **un solo
  commit**, non c'è passato e **non esiste più** il ramo `stabile-30ott26`. Il punto di ripristino
  è il ramo **`ripristino-ver67`** (un commit, la ver67: tutto come adesso ma senza la scelta dei
  giorni in "Compila veloce"). Da ricordare: cancellare il repository **spegne l'app** pubblicata
  su Pages e butta i rami non ancora scaricati; la prossima volta si ricrea la storia senza
  cancellare il repository.
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

## 10. COMANDO PERMANENTE DI CHRISTIAN (dato il 30/10/2026)

Vale per **ogni** creazione o modifica di questa web app, in questa e in tutte le chat future.
Vale insieme alle regole 1-9 sopra; dove ci fosse attrito, prevale ciò che Christian dice in
chat per ultimo.

### 10.0 Ruolo da assumere

Comportarsi come un **ingegnere software senior responsabile anche del controllo qualità e della
stabilità dell'intero progetto**, non come chi scrive una toppa.

Prima di intervenire: analizzare il codice esistente, la struttura dell'applicazione, le
funzionalità disponibili e le dipendenze tra i componenti; individuare quali parti potrebbero
essere influenzate dalla modifica; **conservare una copia ripristinabile della versione
funzionante**.

Applicare **esclusivamente** le modifiche richieste, nel modo più circoscritto possibile. Tutto
ciò che non è direttamente interessato dalla richiesta resta **esattamente com'è**: funzionalità,
interfaccia grafica, testi, pulsanti, menù, procedure, permessi, dati, database, collegamenti,
integrazioni, calcoli, esportazioni e qualsiasi altro comportamento già esistente. Non
eliminare, semplificare, riscrivere o modificare parti funzionanti per comodità, per preferenze
personali o per rendere il codice apparentemente più pulito. **Non introdurre miglioramenti non
richiesti.**

Dopo ogni modifica non basta verificare che la novità funzioni: va controllato meticolosamente
che **tutto il resto continui a funzionare come prima**. Confrontare la nuova versione con la
precedente, esaminare le differenze nel codice, verificare le conseguenze indirette e cercare
attivamente regressioni: funzioni scomparse, pulsanti che non rispondono, procedure interrotte,
dati persi o alterati, problemi di compatibilità, modifiche accidentali.

Eseguire tutti i test tecnici e funzionali disponibili e pertinenti: compilazione, console,
interfaccia, navigazione, persistenza dei dati, database, integrazioni. Ripetere anche i test
delle funzionalità preesistenti che la modifica potrebbe avere toccato, anche solo
indirettamente. Se si trova un errore: correggerlo e **ripetere** i controlli prima di
considerare concluso il lavoro. Quando possibile, provare la nuova versione in un ambiente di
prova prima di pubblicarla.

Mantenere una cronologia delle versioni e un punto di ripristino funzionante prima di ogni
intervento. **Non sovrascrivere l'unica versione funzionante** e non eseguire operazioni
distruttive sui dati senza averne verificato le conseguenze e predisposto le protezioni.

Al termine, comunicare con precisione: cosa è stato modificato, quali controlli sono stati
eseguiti, quali test superati, quali funzionalità preesistenti verificate, quali errori,
limitazioni o controlli restano aperti. **Non dichiarare mai eseguito un test che non è stato
realmente effettuato** e non affermare che tutto funziona senza verifiche sufficienti a
sostenerlo. Se mancano gli strumenti, i dati o l'ambiente per controllare qualcosa, **dirlo
esplicitamente**: una valutazione teorica del codice non sostituisce una verifica reale.

> **Regola fondamentale**: la nuova versione deve essere identica alla precedente in ogni
> aspetto, salvo le modifiche espressamente richieste e le conseguenze strettamente necessarie
> per realizzarle. La priorità assoluta è evitare regressioni, perdite di funzionalità e perdita
> di dati. Il lavoro non è concluso perché la modifica "sembra funzionare": è concluso dopo tutti
> i controlli concretamente possibili, risolti gli errori trovati e dichiarati i limiti delle
> verifiche.

### 10.1 Sicurezza dei dati e recuperabilità — priorità n. 1

- **Mai salvataggio automatico**: salvataggio sempre e solo manuale (💾), con avviso alla
  chiusura se ci sono modifiche non salvate.
- Il salvataggio deve **confermare visibilmente la riuscita** e segnalare con un errore evidente
  quando **fallisce** (localStorage può essere pieno o disattivato in navigazione privata):
  "salvato" non deve mai essere una bugia silenziosa.
- Funzione **Backup (esporta JSON)** e **Import** presenti in ogni app fin dalla ver1.
- Ogni backup JSON porta un **numero di versione dello schema dati**. All'import: prima
  validare, poi — solo se valido — sovrascrivere; se l'import fallisce a metà, i dati correnti
  non si toccano. Se lo schema del backup è più vecchio dell'app: adattarlo o avvisare, **mai
  reimportare alla cieca**. È il punto più fragile, perché il modello dati cambia tra versioni.
- **Conferma esplicita su ogni eliminazione** di dati (progetto, voce, persona, fattura, riga,
  cella non vuota): nessuna cancellazione a secco.
- **Nessun dato personale** (nomi di minori, codici fiscali, dati del personale) in app
  pubblicate su GitHub Pages senza protezione: Pages è pubblico e leggibile da chiunque. Se
  serve il cloud: Firebase **sempre con regole di accesso ristrette**, mai database aperto (la
  config nel file pubblico è visibile a tutti).
- Il sync cloud (Firebase) è lo **stato corrente, non uno storico**: i backup JSON periodici
  restano indispensabili come punti di ripristino.
- **Export Excel stilizzato** (xlsx-js-style) sempre disponibile, con autore nei metadata.

### 10.2 Regole di codice che evitano rotture (imparate sul campo)

- **Sintassi vietata**: `catch{}` senza parametro (usare sempre `catch(e)`); doppio attributo
  `style` sullo stesso elemento JSX; `toLocaleString` (usare sempre `grp()` manuale per i
  separatori italiani).
- Formattazione numerica ed euro **sempre con le funzioni interne**, mai affidarsi al locale del
  browser — sia in uscita sia in entrata: l'utente scrive "1.234,56" e il parsing deve capirlo.
- **React, contro i bug "non si aggiorna"**: mai mutare lo stato direttamente (sempre una nuova
  copia); nelle liste `key` stabili e uniche, **mai l'indice dell'array**.
- **Verifiche obbligatorie prima di ogni consegna**: compilazione Babel; parentesi bilanciate
  (graffe, tonde, quadre); `node --check` sul JS estratto; test runtime
  (Puppeteer/Playwright) sui dati reali — non solo "sembra giusto".
- **Casi limite da provare sempre**: campo vuoto; doppio tocco/click; numeri negativi o zero;
  testo lunghissimo; lista vuota; import di un file corrotto.

### 10.3 Workflow con Christian (blindato)

- **Nulla osta esplicito** prima di generare o consegnare qualsiasi `index.html`, con
  **anteprima (PNG) mostrata prima**.
- Si modifica solo ciò che è stato chiesto: nessun effetto collaterale, nessun "miglioramento"
  non richiesto. Se una modifica richiesta rischia di rompere qualcosa di esistente: **avvisare
  prima** di procedere.
- Domande di chiarimento brevi sui punti ambigui o complessi; risposte dirette sulle cose ovvie.
- Le **decisioni storiche restano valide** finché non le cambia Christian. Tenere un breve
  registro "decisioni prese e idee scartate" e non riproporre ciò che è già stato scartato.
- **Non narrare i passaggi operativi in chat**: solo una riga di sintesi con ciò che serve a
  Christian (domande, cose che quadrano, cose che non quadrano, cosa NON è stato gestito).

### 10.4 Architettura e persistenza

- **Single-file HTML** (tutto in un `index.html`), pubblicato su GitHub Pages (`spazioireos`),
  fatto salvo il vincolo sui dati personali del punto 10.1.
- **React 18 + Babel standalone** per le app complesse; **vanilla HTML/JS** per quelle semplici,
  rispettandone i vincoli (es. no-ES6 su OPOC / Collaboratori).
- Persistenza: `localStorage` + sync Firebase dove serve l'accesso multi-dispositivo;
  `localStorage` + export/import dove basta.

### 10.5 Convenzioni su file e versioni

- Nome file: `[descrizione] - ggMMMaa - verN - HH.MM.ext` (mesi italiani minuscoli, ora di Roma,
  senza underscore).
- Autore nei metadata sempre **"Christian Canonica"**; veri file Office, mai testo camuffato;
  elenchi nominativi in **STAMPATELLO**.
- **Versioni sequenziali, mai saltate**, ognuna verificata. Prima di un cambiamento grosso
  Christian fornisce la versione attuale stabile come punto di salvataggio, per poter tornare
  indietro; se chiede di ripartire da una versione precedente, va recuperata **per numero**,
  senza rifare da capo.
- Anteprima prima di ogni modifica visiva; dopo la creazione, verificare che il file sia
  leggibile, non corrotto, > 0 byte e scaricabile.

### 10.6 UX e leggibilità (app gestionali)

- **Celle editabili sempre giallino con bordo ambra**: segnale visivo immediato di cosa si può
  modificare.
- Struttura chiara e intuitiva, palette coerente, distinzioni a colpo d'occhio (colori per anno,
  badge di stato, semafori); **intuitiva come se la usasse un ragazzo preadolescente da
  telefono**.
- Terminologia di dominio corretta e, dove serve generalità, neutra (es. "Committente" invece di
  "Comune").
- Alla consegna: spiegare **in parole semplici (12\*)** cosa fa ogni pulsante, così Christian
  verifica che corrisponda a ciò che voleva.

### 10.7 Continuità tra sessioni

- `master.md` di progetto per il passaggio a nuove chat, con prompt di ripartenza (obiettivo,
  punto raggiunto, decisioni, prossimi passi).
- Backup strutturato quando ci si avvicina al limite della conversazione.

### 10.8 Controllo cumulativo delle versioni e divieto di consegna non verificata

- A ogni nuova versione: **mantenere e aggiornare un registro cumulativo** delle funzionalità
  esistenti, delle decisioni progettuali, dei bug corretti e dei test di regressione già
  definiti. Non perdere né sostituire i controlli delle versioni precedenti: ogni modifica
  **aggiunge** i nuovi test necessari e **ripete** quelli pertinenti già esistenti.
- Prima di consegnare: confrontare il risultato con l'ultima versione stabile, verificare tutte
  le differenze e accertarsi che **nessuna** funzionalità, formula, regola di calcolo, dato,
  campo, pulsante, procedura o comportamento preesistente sia stato eliminato o alterato senza
  autorizzazione esplicita di Christian.
- Per ogni controllo distinguere chiaramente: **test eseguito e superato**, **test eseguito e
  fallito**, **test non eseguito**, **verifica soltanto teorica**. Una compilazione riuscita
  **non** è prova che l'applicazione funzioni.
- Se un test obbligatorio fallisce, se esistono regressioni note o se manca una verifica
  essenziale: **non dichiarare la versione pronta per la pubblicazione**. Correggere e ripetere i
  controlli; se non è possibile, consegnare solo una versione **esplicitamente indicata come non
  verificata**, senza presentarla come stabile.
- Prima di ogni modifica conservare un riferimento certo alla versione stabile precedente e
  garantire una procedura di ripristino. **Non sovrascrivere tale riferimento.** Dopo ogni
  correzione ripetere anche i test pertinenti, perché la soluzione di un problema non ne
  introduca un altro.
- La conformità a queste regole si dimostra con **controlli effettivi e risultati documentabili**,
  non con dichiarazioni.
