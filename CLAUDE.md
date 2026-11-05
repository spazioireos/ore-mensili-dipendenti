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
  targhetta `.app-rev` della testata. **Attuale: ver94 · 05nov26.** `APP_VER` finisce anche nei
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
  - **Simulazione (da ver73, 03/11/2026)**: sotto le tre scelte c'è la tabellina del foglio Excel
    (`O5` → `O8`) con **due caselle scrivibili** — *Settimane del periodo* e *Settimane davvero
    lavorabili*. Scritte, prevalgono sul calcolo (`settPeriodoOv`/`settLavOv` in `calcCosto`,
    campi `dp.costo.settPeriodo` e `dp.costo.settLav`); vuote, l'app calcola come prima. Accanto
    a ciascuna si vede sempre il valore calcolato, e un pulsante **«↺ Rimetti i valori
    calcolati»** svuota entrambe. Serve a rispondere a «quanto costa questa persona per 6 mesi
    del 2027 se si lavorano davvero 18 settimane»: si sceglie il periodo, si scrivono i mesi e le
    settimane, e il costo orario si rifà da sé. **Finché non si preme 💾 non si salva nulla.**
  - **Rimborso km: il valore comune è 0** (da ver73, richiesta di Christian). Chi ha davvero il
    rimborso se lo scrive nella propria scheda.
  - ⚠️ **La «% di ore supplementari stimate» vale SOLO per le ore «Teoriche»** (chiarito in ver75,
    domanda di Christian del 03/11/2026: «se mettiamo le ore effettive prese dai TS, perché dare
    una percentuale convenzionale?»). Con le ore **dai Riepiloghi** o **a mano** (`G38>0`) le
    supplementari si ricavano dal dato vero — `E18 = max(0, (G38 − O8 + O11·H2))/H2`, cioè ore
    rese meno ore ordinarie attese (già al netto di ferie, permessi, festività e malattia
    presunta) — e `c.suppPct` **non entra in nessun conto**: `F38`, l'unico altro punto che la
    usa, viene scartato da `H38 = (G38>0)? G38 : F38`. Nessun doppio conteggio.
    In ver75 il campo lo **dice**: `suppAttiva` (in `CostoOrario`) è vero solo se almeno un
    dipendente ha `costo.fonteOre === "teoriche"`; quando è falso l'etichetta diventa grigia
    (`#64748b`) e compare la riga «non in uso: serve solo con le ore «Teoriche»». ⚠️ La casella
    **resta scrivibile e giallina**: è spenta nei conti, non bloccata — serve per impostarla
    prima di una simulazione. `campoNum` ha un **sesto parametro facoltativo `spento`**; le altre
    34 chiamate non lo passano e sono invariate. **Nessun calcolo è stato toccato.**
  - ⚠️ **Numeri all'italiana**: `cNum` capisce sia `1545.21` sia `1.545,21`; `cMostra` fa vedere
    il **grezzo** mentre scrivi (senza, digitando "20," la virgola sparirebbe) e il valore
    calcolato con i separatori italiani. Non sostituirle con `parseFloat` secco.
- 📐 **Costo orario più compatto e più leggibile** (ver76, 03/11/2026, richiesta di Christian:
  «riesci a compattare meglio la scheda costo orario e a ingrandire in pt le scritte?»). Due cose
  insieme, in direzioni opposte: **scritte più grandi** e **spazi più stretti**.
  - **Caratteri** (solo dentro `CostoOrario`): etichette 12→**13px**, aiutini sotto le caselle
    11,5→**12,5px**, tabelle del contratto e del dettaglio 13,5→**14,5px**, testi di spiegazione
    12,5→**13px**, titoli dei blocchi 15→**16px**, nome della persona 18→**19px**, caselle
    14→**15px**. Dentro la scheda **non resta niente sotto i 12,5px**. ⚠️ Restano a 11-12px
    **fuori** dalla scheda: targhetta della revisione, avviso «Modalità LOCALE» e barra «Zoom
    vista» — sono di altre parti dell'app, **non toccate**.
  - **Spazi**: imbottiture dei riquadri 9/11→**7/10px**, margini fra blocchi 8→**6px**, righe
    delle tabelle 2→**1px**, interlinea degli aiutini 1,5→**1,35**, griglia dei campi gap
    6→**5px**. ⚠️ **L'altezza delle caselle e dei pulsanti non è cambiata**: 10 comandi sotto i
    32px prima, 10 dopo.
  - **Due sotto-colonne sugli schermi larghi**: la colonna dei blocchi è diventata un contenitore
    `.co-wrap` con due `.co-sub` (*Il contratto* + *La retribuzione* | *Le ore da dichiarare*);
    il riquadro del risultato ha la classe `.co-det`. ⚠️ **Sotto i 1500px non cambia niente**:
    la regola CSS che le affianca sta in `@media (min-width:1500px)` e le `.co-sub` restano a
    tutta larghezza. Misurato: pagina da 1439 a **1299px** a 1680, da 1315 a **1279px** a 1920;
    a 1280 e 1440 resta com'era ma **con le scritte più grandi**.
  - **Telefono**: `.co-grid` (le due griglie dei campi) sotto i 900px passa a `minmax(150px)` →
    **due caselle per riga** invece di una, pagina da 3756 a **3368px**; e le etichette delle
    tabelle vanno a capo, così la tabellina delle settimane **non esce più di lato** (difetto
    **preesistente**: la ver75 a 390px scorreva in orizzontale).
  - ⚠️ **Nessuna dicitura cambiata, nessun calcolo toccato**: le prove di ver75 danno gli stessi
    numeri (20,65 / 20,46 / 20,73 €/h), zero errori in console.
- 🎯 **GIORNATE EROSIVE e tetto annuo** (ver77, 03/11/2026). Regola stabilita da Christian: un'ora
  di assenza **consuma il massimale solo se quel giorno il servizio era aperto** («se stai a casa
  durante l'anno scolastico io ti pago e le ore incidono; se stai in ferie a Natale no»).
  - **Dove si segna**: il numerino sotto le celle di assenza (`.teor-abs`, già presente, mostrava
    solo la quota del giorno) è diventato **cliccabile**. In chiaro = **erosiva**; barrato e
    grigio (`.no-ero`) = **non erosiva**. Predefinito **erosiva**: nei dati finisce **solo
    l'eccezione**, `dati[mese][dipId].ero[giorno] = false`. Gestore **`onEro(dipId, day, erosiva)`**,
    che cancella la chiave quando si torna a erosiva (niente spazzatura nel documento).
  - **Chi la usa**: solo **`prodottoMese`**, cioè il **Tetto annuo** (`dp.tettiAnnui`, riquadro
    «🎯 Tetto annuo» nella vista del mese), che ora somma `totOfRec + oreEroseMese`.
    ⚠️ **`coverAbsHours` NON è stato toccato**: lo **straordinario** (`bancaMeseA`) continua a
    contare **tutte** le assenze, come da regola del 31/10/2026. Verificato: il riquadro del
    conguaglio non si muove, il tetto cala di 5,010 h per ogni giornata spenta.
  - **Decisione di Christian (03/11/2026)**: niente secondo tipo di massimale «per servizio».
    Si usa il **Tetto annuo che c'era già**, per anno scolastico; i servizi si mescolano e a lui
    va bene. Cade così la dipendenza da Fogli ore, la collection nuova e i mensilizzati.
  - Funzioni aggiunte sopra il Tetto annuo: `eroOn`, `isAbsCell`, `oreEroseMese` (+ `svcCapsList`,
    `svcCapLabel`, `svcCapMesi`, `svcCapAttivo`, **non ancora usate**: erano per l'ipotesi «per
    servizio», lasciate per il pezzo che il dipendente vedrà dentro Fogli ore).
- 💶 **COSTO ORARIO: SETTE CORREZIONI AI CRITERI** (ver79, 03/11/2026, tutte decise da Christian
  dopo aver visto un caso reale che dava **27,81 €/h** su un mese singolo invece di ~20).
  La causa di quel numero: **le festività erano due numeri fissi annui** (11 godute, 3 non godute)
  tolti **per intero** da qualunque periodo, anche da un mese solo. Su 1 mese restavano 1,76
  settimane lavorabili su 4,35, e quasi tutte le ore diventavano straordinario al +27%.
  1. **INPS 26,40 → 26,90%** (valore comune): i 26,40 non comprendevano lo 0,50%.
  2. **TFR meno lo 0,50%**: `J20 = imponibile II × 0,50%`, `J19 = base/13,5 − J20`. È una quota
     dei contributi dovuti all'INPS, quindi sulla **stessa base dei contributi**. Operazione
     **neutra sul totale**: quello che si aggiunge all'INPS si toglie dal TFR (provato: +6,38 e
     −6,38 sullo stesso caso). La **rivalutazione** si calcola sul TFR già al netto.
     A video due righe (*TFR maturato* lordo e *0,50% già nei contributi*), così le voci
     **continuano a sommare** al Costo totale: verificato, 29.456,05 contro 29.456,04.
  3. **Festività non godute FUORI dall'imponibile TFR**: `H19 = (L15 − J12) + …`.
  4. **Assistenza sanitaria proporzionata**: `(132/12) × mesi`, **solo indeterminati**.
     ⚠️ **Ribalta la decisione del 02/11/2026** («fissa a 132 indipendentemente dai mesi»):
     è stato Christian a cambiarla il 03/11. Su 12 mesi il risultato è identico (132).
  5. **Formazione: 250 € per ogni anno iniziato** (`250 × max(1, ceil(mesi/12))`, scelta **B**).
     Fino a 12 mesi è come la «secca»: 250. A 18 mesi diventa 500. Motivo di Christian: «sono
     250 annui, ma se uno lavora solo un mese lo devo formare lo stesso».
  6. **Festività contate dal calendario del periodo**, con **`contaFestivita(pairs)`**:
     **goduta** = cade in giorno lavorativo (lun-sab); **non goduta** = cade di **domenica**,
     **più il 4 novembre sempre** (`FEST_NON_GOD_FISSE`). I due valori comuni restano a video ma
     **non sono più usati**: etichetta grigia e nota «non in uso: ora si contano dal calendario»,
     con accanto quanti ne conta il periodo scelto. `campoNum` accetta ora come sesto parametro
     anche una **stringa**, che diventa il testo della nota.
     ⚠️ **Il 4 novembre NON sta in `festivitaSet`**: quel giorno si lavora, la cella resta
     compilabile e non è rossa.
  7. **Sant'Ambrogio (7 dicembre) aggiunto a `festivitaSet`**. ⚠️ Da ver77 i giorni rossi **non
     si compilano**: dal 7/12 in poi quella casella è bloccata e le ore già scritte sui 7
     dicembre passati non sono più correggibili. Con Sant'Ambrogio dentro, il 2026 conta
     **11 godute**, cioè esattamente il valore che Christian aveva messo a mano: era quello il
     pezzo mancante.
  - **Numeri verificati in esecuzione** (persona a 15 h/sett., 64 h dichiarate):
    | Periodo | Godute / non godute | Costo orario prima | dopo |
    |---|---|---|---|
    | nov 2026 (1 mese) | 0 / 2 | 27,81 €/h | **23,49 €/h** |
    | anno 2026 (12 mesi) | 11 / 4 | 19,65 €/h | **19,68 €/h** |
    | a.s. 2026/27 | 9 / 6 | — | 19,66 €/h |
    Sull'**anno intero il risultato non si muove** (3 centesimi): le correzioni si vedono sui
    periodi corti, che prima erano sbagliati.
  - ⚠️ **I costi orari calcolati finora su periodi più corti dell'anno erano sovrastimati.**
- 🚗 **RIMBORSO KM: casella usabile e scelta secco/mensile** (ver80, 04/11/2026).
  - **Difetto corretto**: la casella *Rimborso km €/mese* mostrava uno **"0"** (il valore comune),
    così cliccando e scrivendo 50 dentro restava **"050"** — il conto era giusto ma sembrava
    rotto. Causa: `cMostra(raw, auto)` stampa l'`auto` anche quando vale 0. Ora le due caselle
    (comune e di persona) ricevono `c.kmMese || ""`: **vuoto = nessun rimborso**.
  - **Nuova tendina «Rimborso: come si conta»** nella scheda della persona: **al mese**
    (× i mesi del periodo, com'era) oppure **secco** (una volta sola). Campo `dp.costo.kmTipo`
    ("mese" | "secco"), usato in `J34`. Provato: 50 € → **600,00** al mese, **50,00** secco.
  - ⚠️ **Il rimborso non entra in nessun imponibile** (confermato da Christian il 04/11/2026:
    «è esente da imposte e contributi»): non tocca Imponibile I, Imponibile II, TFR, INPS,
    INAIL, FIS, IRAP. Finisce **solo** nel totale `J35`. Vale finché è un rimborso chilometrico
    per trasferte fuori dal Comune entro le tariffe ACI; se diventasse forfettario sarebbe
    imponibile e il calcolo andrebbe rivisto.
  - ⚠️ `kmMesiTolti` esiste nei dati ma **non ha una casella**: è sempre 0.
  - **Etichetta cambiata in «Rimborso km €»** (ver81, 04/11/2026): «€/mese» era falso quando la
    tendina sta su *secco*. ⚠️ Il cambio è stato **chiesto da Christian** («cambia pure la parola
    Rimborso»), non fatto di iniziativa: le diciture restano sue.
- 🎓 **IL LIVELLO SEGUE LE TRASFORMAZIONI** (ver82, 04/11/2026, difetto segnalato da Christian:
  «Boccalari fu assunta a livello D1, poi cambiò, ma nel costo orario lascia D1 come
  riferimento»). `datiCosto` ricavava il livello da **`dp.livello`**, cioè quello di
  **assunzione**: chi veniva promosso restava al livello vecchio, con il **minimo tabellare
  sbagliato**. Ora c'è **`livelloPeriodo(dp, pairs)`**, gemella di `oreSettPeriodo`: prende il
  livello dell'**ultimo mese in cui il contratto è in piedi** dentro il periodo, usando
  `livelloAt` → `valoriAt`, che legge le **trasformazioni** registrate nella scheda.
  Provato con una persona assunta D1 e promossa D2 dal 01/06/2026, periodo gen→dic 2026:
  | | Livello | Minimo | Costo orario |
  |---|---|---|---|
  | ver81 (prima) | D1 | 1.637,57 | 19,65 €/h |
  | **ver82** | **D2** | **1.727,83** | **20,71 €/h** |
  ⚠️ **Approssimazione dichiarata**: se il livello cambia **a metà periodo**, si applica il
  livello finale a **tutto** il periodo — esattamente come già faceva (e fa) `oreSettPeriodo`
  per le ore settimanali. Per un conto esatto si spezza il periodo in due tronconi.
  ⚠️ Se nella scheda del Costo orario il livello è stato **scritto a mano** (`dp.costo.livello`),
  quello continua a prevalere: il calcolo automatico non lo sovrascrive.
- 📈 **L'ADDIZIONALE TEMPO DETERMINATO SEGUE LE DATE DELLE PROROGHE** (ver83, 04/11/2026,
  stessa segnalazione del livello). `addizTDAuto` contava **tutte** le proroghe registrate,
  anche quelle che partivano **dopo** il periodo guardato: chi aveva già due proroghe scritte in
  scheda si vedeva 2,40% anche calcolando un periodo in cui ne era partita una sola.
  - **`prorogheAttiveA(dp, ymdFine)`**: una proroga decorre dal **giorno dopo la scadenza
    precedente**, quindi la catena è `[scadenza originale, proroga 1, proroga 2, …]` e si conta
    la proroga *i* solo se `chain[i-1] < fine del periodo`.
  - **`fineperiodoYmd(pairs)`** = ultimo giorno dell'ultimo mese del periodo.
  - L'**aiutino sotto la casella** mostra ora il numero davvero usato (`d.nProroghe`): prima
    scriveva `prorogheList(dp).length`, cioè mentiva.
  - Provato con scadenza 31/03/2026 e proroghe 30/06 e 31/12:
    | Periodo | ver82 (prima) | **ver83** |
    |---|---|---|
    | gen → dic 2026 | 2,40 % | **2,40 %** (giusto: entrambe partite) |
    | gen → mag 2026 | 2,40 % | **1,90 %** (la seconda parte il 1° luglio) |
  - ⚠️ Come per il livello: si guarda la situazione **alla fine del periodo**, non si fa la media
    pesata dentro il periodo — Christian l'ha **scartata** il 03/11/2026. Se una proroga cade a
    metà e si vuole il conto esatto, si spezza il periodo in due.
  - ⚠️ Una proroga la cui **scadenza precedente non è scritta o è illeggibile** non viene
    contata: il numero scende e si vede nell'aiutino. La casella resta scrivibile a mano.
- 🧩 **IL PERIODO SI TAGLIA DA SOLO IN BLOCCHI** (ver84, 04/11/2026, richiesta di Christian:
  «non puoi tu automaticamente dividere i periodi con trasformazioni in più blocchi se io ti do
  un blocco unico?»). Risolve alla radice le approssimazioni di ver82 e ver83, che applicavano a
  tutto il periodo il valore **di fine periodo**.
  - **`firmaMese(dp,y,m)`** = livello + ore settimanali + tipo + proroghe già partite in quel
    mese; **`blocchiPeriodo(dp,pairs)`** raggruppa i mesi contigui con la stessa firma.
  - Ogni blocco si calcola con i **suoi** parametri (minimo del suo livello, sue ore settimanali,
    suo addizionale, **sue festività** contate sui suoi mesi), poi si **sommano** le voci e
    **costo orario = Σcosti ÷ Σore**. Il `res` restituito è la **somma delle voci**, così il
    dettaglio a video continua a quadrare con il Costo totale.
  - ⚠️ **La formazione è una spesa dell'anno, non del blocco**: si toglie da ogni blocco e si
    rimette **una volta sola** sul periodo intero. Senza questo, due blocchi = 500 € invece di
    250. Paghe e assistenza sanitaria sono mensili, quindi si sommano da sé.
  - **Le ore**: *dai Riepiloghi* → ogni blocco prende i suoi mesi (esatto); *teoriche* → le
    calcola il blocco (esatto); *a mano* → il numero unico si **ripartisce in proporzione alle
    ore ordinarie teoriche** di ciascun blocco, ed è scritto a video che è una ripartizione.
  - 🚫 **Quando NON si taglia** (`o.noTaglio`): se l'utente ha scritto a mano un valore
    strutturale (**mesi, ore settimanali, livello, minimo, addizionale, settimane della
    simulazione**) oppure ci sono conteggi in mesi non ripartibili (**maternità, mesi tolti dal
    rimborso o dal premio**). In quei casi vale quello che ha scritto lui, su tutto il periodo,
    **come prima**, e compare un **avviso giallo** che dice in quanti pezzi si dividerebbe e
    perché non lo fa.
  - **A video**: riquadro «Come si divide il periodo» sotto il dettaglio, con una riga per
    blocco (periodo, livello, h/sett, addizionale, ore, costo).
  - **Verificato in esecuzione**, persona 30 h/sett. assunta D1, promossa D2 dal 01/06/2026,
    scadenza 31/03 con proroghe 30/06 e 31/12, periodo gen→dic 2026, ore *teoriche*:
    **4 blocchi** (gen-mar D1 1,40% · apr-mag D1 1,90% · giu D2 1,90% · lug-dic D2 2,40%),
    1.395,59 ore, **20,27 €/h** — contro i **20,76 €/h** della ver83 (tutto D2) e i 19,70 della
    ver81 (tutto D1).
  - ⚠️ **NON REGRESSIONE verificata**: su tre casi senza cambiamenti (indeterminato; determinato
    senza proroghe; ore scritte a mano) ver83 e ver84 danno numeri **identici al centesimo**
    (20,50 · 18,71 · 21,53 €/h).
- 🏷️ **COME SI CHIAMANO LE DUE COSE** (deciso da Christian il 05/11/2026). La pagina del mese
  con le celle di tutti si chiama **TABELLONE**; il PDF A4 si chiama **REPORT**. Usare queste
  due parole in chat, nei commit e qui dentro.
  In **ver92** il pulsante in testata è stato rinominato da «🖨️ PDF A4» a **«🖨️ Report PDF A4»**,
  dicitura **scelta da Christian**. ⚠️ La finestra che si apre resta «Esporta PDF — scegli il
  periodo»: quella dicitura non è stata toccata. Il titolo stampato dentro il Report è sempre
  «Spazio Ireos — Report Ore · <mese> <anno>», invariato.
- 📅 **IL MESE SI VEDE SU OGNI PERSONA** (ver94, 05/11/2026, richiesta di Christian: «nel
  tabellone, a destra, scrivi bene grande come il nome dipendente il mese di riferimento
  cosicché io lo veda sempre»). Nella barra colorata di ogni scheda, **a destra subito prima dei
  pulsanti**, c'è ora «**Novembre 2026**» con la classe **`.mese-ref`**: stessa misura (19px),
  stesso peso (800), stessa spaziatura e stesso colore (`#08344a`) del nome della persona.
  - Serve perché scorrendo un Tabellone lungo la fascia blu in cima esce dallo schermo e non si
    sa più che mese si sta guardando.
  - ⚠️ Sta **dopo lo `.spacer`**, quindi galleggia a destra; su telefono la barra va a capo
    (`flex-wrap`) e il mese può finire sulla riga sotto: è il comportamento di sempre della barra,
    non un difetto.
  - **Provato in esecuzione** su tre schede a 1500px e a 390px: il mese c'è su tutte, misura e
    peso identici al nome, e a 1500px è sempre a destra del nome.

- ⏲️ **LE ORE DI PERMESSO CONTANO NEL RISULTATO DEL MESE** (ver93, 05/11/2026). Christian:
  «nel tabellone non mi conti tra le ore conteggiabili i permessi?». Era vero: fino alla ver92 un
  permesso orario **non muoveva nessun numero**, né il TOT né il Risultato del mese né i
  Riepiloghi né il Costo orario né il Tetto annuo. Era solo un'annotazione.
  - **Numero confermato da Christian** (come vuole la regola dello straordinario): persona a
    30 h/sett., base del mese **130,263 h**, 20 giorni da 6 h = **120,00 h** più **2 h di EXF** il
    giorno 10 → Risultato del mese **−8,263 h** (prima −10,263). Provato in esecuzione.
  - **Dove conta e dove no**: il permesso si comporta come un'**assenza retribuita**, solo a ore
    invece che a giornate. **Fuori dal TOT** (che resta le ore davvero rese, quelle che vanno in
    rendicontazione e nel Costo orario) e **dentro al Risultato del mese**.
    ⚠️ **NON toccati**: Riepiloghi, Costo orario, Tetto annuo e «Pubblica i residui» continuano a
    usare `totOfRec`, quindi i permessi lì non entrano. Christian ha confermato un numero solo per
    il Risultato del mese.
  - **`permOreMese(rec)`** (sopra `eroOn`) torna `{pagate, altre}`: `pagate` sono le ore dei tipi
    presenti nella tendina, `altre` quelle con un tipo **scritto a mano**. **Solo `pagate` entra
    nel conto**: di un «VISITA MEDICA» l'app non sa se è retribuito.
  - **La tendina ha ora solo i cinque tipi retribuiti per legge**, scelti da Christian:
    **EXF, LUTTO, ELEZ, ESAMI, SIND**. ⚠️ **Tolti FLEX, MATR e CONGP**: i permessi già registrati
    con quei tipi **non si perdono** — la finestrella li riapre in «Altro…» con il testo dentro
    (provato: un FLEX da 2 h si riapre con «FLEX» nella casella) — ma **non contano più** nel
    Risultato del mese, perché finiscono fra le «altre». Christian: «per il resto ci penseremo
    quando capirò cosa è retribuito e cosa no».
  - **A video**: nel riquadro una pastiglia nuova «**Permessi orari: 2,000 h**» e, se ce ne sono
    di tipo scritto a mano, «(+ 3,500 h di tipo scritto a mano, non contate)». Così non c'è
    niente di silenzioso. La pastiglia «Ferie/malattia/permessi» **non è stata toccata**.
  - **Provato in esecuzione** su cinque casi: solo EXF → −8,263 · nessun permesso → −10,263 ·
    solo tipo a mano → −10,263 (e 1,5 h segnalate come non contate) · misto → −8,263 ·
    FLEX → −10,263. Il **TOT resta 120,00** in tutti. Numeri del Costo orario **identici** a prima.
- 🖨️ **IL REPORT SI LEGGE SENZA OCCHIALI** (ver93, 05/11/2026, Christian: «i numeri sono molto
  piccoli nel report, a prova di aquila»).
  - **Misure**: le ore nelle celle da **7 a 9pt**, il corpo della tabella da **6 a 7,5pt**, il
    capo-tabella da **5,6 a 6,5pt**, la riga del totale da 7 a **9pt**. Margine basso della
    tabella da 40 (il valore di difetto di autotable) a **8mm**, per far stare le 33 righe in una
    pagina sola.
  - ⚠️ **Perché non più grandi**: A4 orizzontale è alto 210mm; tolti il bordo in alto (16) e
    quello in basso (8) restano **186mm** per 33 righe (31 giorni + totale + capo-tabella). A 9pt
    una riga è alta ~5,25mm → **173mm**, ci sta. A 10pt sarebbe 187mm e **la tabella si
    spezzerebbe su due pagine**. Se servono numeri ancora più grandi, l'unico modo è mandare le
    note in seconda pagina: da decidere con Christian.
  - 🐞 **Difetto preesistente CORRETTO**: i controlli di fine pagina in calce usavano **287**,
    cioè l'altezza del foglio **verticale**, mentre il Report è **orizzontale** (210mm). Tutto
    quello che finiva sotto i 210 veniva disegnato **fuori dalla pagina e spariva senza dirlo**.
    Ora c'è `PG_H = doc.internal.pageSize.getHeight()` e `FONDO = PG_H - 10`, usati nei **4**
    punti. Con i caratteri più grandi la tabella è più alta, quindi senza questa correzione le
    note sarebbero sparite.
  - **La cella col permesso** non porta più solo `***`: sotto il valore si legge
    **«+ aggiunta / come sotto ***»** in viola (dicitura scelta da Christian), su **due righe**
    perché la colonna è larga 16-22mm. La riga della tabella cresce con
    `styles.minCellHeight = 10.5`: senza, il disegno fatto a mano sarebbe finito sopra le righe
    vicine. ⚠️ Ogni permesso alza la sua riga di ~5mm: con **tre o più permessi nello stesso
    mese** la tabella potrebbe passare a due pagine.
  - ⚠️ **Non provato**: il disegno vero del PDF. jsPDF non è raggiungibile da qui, quindi le
    misure sopra sono **calcolate**, non viste. **Christian deve aprire un Report vero** e dire
    se sta in una pagina e se i numeri sono abbastanza grandi.

- 🟣 **IL PERMESSO ORARIO SI VEDE** (ver91, 05/11/2026, segnalazione di Christian: «la questione
  dei permessi è poco chiara»).
  - **Nel Tabellone**: fino a ver90 un permesso si vedeva **solo** come un pallino viola da 11px
    nell'angolo della cella (`.perm-flag`) e nel messaggio che compare passandoci sopra: di fatto
    invisibile. Ora **sotto la cella** compare una targhetta viola **`.perm-lbl`** con
    **«+2,00 h EXF»**. Si può cliccare, e apre la stessa finestra del pallino.
    ⚠️ La targhetta sta su **una riga sola** (`white-space:nowrap` + `text-overflow:ellipsis`,
    `max-width:66px`): un tipo lungo come «VISITA MEDICA» diventa «+1,50 h VI…», e il testo
    intero resta nel messaggio al passaggio del mouse. Senza questo la riga della tabella
    cresceva di tre volte e si allargava tutto il mese.
    Il **pallino viola resta dov'era**: non è stato tolto.
  - **Titolo del Tabellone**: la fascia blu in cima mostra ora **«📅 Tabellone Novembre 2026»**
    invece di «📅 Novembre 2026». ⚠️ Christian ha scritto «Tabellone ottobre 2026» in minuscolo:
    il mese resta con l'iniziale maiuscola come in tutto il resto dell'app (`MONTH_LABEL`).
  - **Nel Report (PDF A4)**: dove c'è un permesso la cella porta ora **tre asterischi grossi e
    viola** sotto il valore (prima era **un** asterisco piccolo attaccato al numero). Disegnati a
    mano in `didDrawCell` con il flag **`__perm3`**, come già si fa per il «,00» sbiadito: il
    valore in alto alla misura normale, i `***` sotto a **+3,5pt** in `#6d28d9`.
    ⚠️ Se una cella ha **sia** il permesso **sia** i minuti a zero, vince il disegno dei tre
    asterischi e il «,00» **non** viene sbiadito: sono due disegni a mano che non possono
    convivere nella stessa cella.
  - **In calce al Report**: `permMese` non è più un elenco di stringhe ma di oggetti
    `{nome, giorno, ore, tipo}`, e ogni riga dice
    **«NOME — giorno 10: Aggiungere 2,00 ore di permesso (EXF)»**, la frase scelta da Christian.
    L'intestazione del blocco dice ora «segnalati con ***» invece di «con *»: era diventata
    falsa.
  - ⚠️ **Le ore di permesso NON entrano nel TOT** e nessun calcolo è stato toccato: il permesso
    resta un dato a parte, come prima.
  - **Provato in esecuzione**: fascia «📅 Tabellone Novembre 2026»; tre targhette nel Tabellone
    (`+2,00 h EXF`, `+1,50 h VISITA MEDICA`, `+1,00 h ELEZ`) su una riga sola; nel Report tre
    celle con `***` e le tre righe in calce con «Aggiungere …». La tabella del mese resta larga
    **2.172px**, come prima. ⚠️ **Non provato**: il disegno vero del PDF (jsPDF non è
    raggiungibile da qui), quindi la posizione e la grandezza reali dei tre asterischi
    **vanno guardate su un Report vero**.

- 🎨 **IL COLORE DELLA PERSONA VALE OVUNQUE** (ver89, 04/11/2026, richiesta di Christian:
  «volevo le cornici dei box di ogni singolo utente più spesse, tra l'altro sarebbe bene che il
  colore scelto divenisse il colore ufficiale di quel dipendente ovunque»).
  - **Cornice della scheda del mese**: `.emp-card` da **3 a 8px** (misura scelta da Christian).
    Il colore era già `dp.colore`, era solo sottile.
  - **Il colore segue la persona** in tutte le viste, come **barretta a sinistra da 7px**:
    elenco delle persone in **Costo orario** e in **ANAGRAFICA**, le **cinque tabelle dei
    Riepiloghi** (cella `td.name`) e le **tre tabelle della Query personale** (*Totale su
    intervallo*, *Straordinario*, *Ferie da smaltire*). Nelle due schede, davanti al **nome in
    grande**, c'è un **quadratino** del colore.
  - Per la Query personale il colore è stato aggiunto alle righe (`col: dp.colore` in `rowsB`,
    `rowsS`, `rowsF`): è l'unica modifica al JavaScript, tutto il resto è stile.
  - ⚠️ **Perché una barretta e non lo sfondo pieno**: i dieci colori di `PALETTE` sono chiari
    (giallo `#FFC000`, rosa `#FFDDFF`, verde acqua `#9AD0C2`); come sfondo di riga renderebbero
    i numeri meno leggibili, come barretta si vedono benissimo. Non riempire le righe.
  - 🚫 **Export Excel e PDF: NO, deciso da Christian il 04/11/2026.** Gli era stato proposto di
    colorare la cella del nome nei fogli Excel e la colonna del nome nel PDF A4: ha risposto
    **no**. Il colore resta **solo a video**. **Idea scartata: non riproporla.**
  - **Provato in esecuzione**: cornice 8px del colore giusto; barretta da 7px con il colore
    esatto di ciascuno (`#00B0F0`, `#FFC000`, `#9AD0C2`) nelle 5 tabelle dei Riepiloghi e in
    tutte e 3 quelle della Query personale; numeri del Costo orario **identici** a prima su
    quattro casi. Zero errori di pagina.
  - 🐞 **Difetto preesistente, CORRETTO in ver90** (04/11/2026, su richiesta di Christian):
    nella vista *Query personale* la fascia in alto scriveva «📅 undefined 2026», perché `mese`
    è `null` fuori dalle viste mensili — lo stesso difetto corretto in ver62 per l'Anagrafica,
    qui rimasto. Ora la catena in `.monthstrip` ha anche `vista === "query"` e mostra
    «🔎 Query personale», **la stessa dicitura della linguetta**. Provate tutte e cinque le
    viste: Novembre 2026 · Riepiloghi · Anagrafica · Costo orario · Query personale.

- 🚦 **I COLORI DEL RISULTATO DEL MESE** (ver88, 04/11/2026, scelti da Christian: «risultato del
  mese verde se in pari, rosso se sopra e verde acqua se sotto»).
  | Esito | Colore |
  |---|---|
  | **sopra** la base (ore in più, straordinario) | **`#b91c1c`** rosso |
  | **sotto** la base (ore in meno) | **`#0d9488`** verde acqua |
  | **in pari** | **`#15803d`** verde |
  - Gli stessi tre colori valgono per il **badge del risultato** (`.cong-chip.strong`) e per il
    **cartellino accanto** (`.cong-status`): tenerli diversi avrebbe messo due colori per la
    stessa cosa nella stessa riga.
  - ⚠️ **Qui il rosso NON vuol dire «pericolo»**: altrove nelle app di Christian il rosso è
    riservato alle cancellazioni e agli allarmi (regola del 03/11/2026 scritta nel CLAUDE.md di
    Collaboratori), ma per lo straordinario l'ha chiesto lui esplicitamente. Non estendere questa
    eccezione ad altri punti.
  - Lo sfondo e il bordo del riquadro (`.cong.warn` arancione, `.cong.over` azzurro, `.cong.ok`
    verde chiaro) **non sono stati toccati**: cambia solo il badge.
  - **Provati in esecuzione tutti e tre gli stati** (+37,737 h rosso · −19,500 h verde acqua ·
    0,000 h verde), leggendo il colore calcolato dal browser.

- 🖨️ **PDF A4: le ore in ORE,MINUTI e il totale in centesimi** (ver87, 04/11/2026, richiesta di
  Christian: «il pdf a4 mi deve dare le ore come in precedenza, non con A o P, indicando 5,30 in
  caso di mezz'ora oppure 5,45 in caso di 5 ore e 45 minuti. il totale finale deve essere però in
  centesimi»).
  - **`pdfHM(v)`** non scrive più «5 h e 30 min» ma **«5,30»**. ⚠️ **Non è un numero decimale**:
    è *ora,minuti*. `5,45` vale 5 h 45 min, cioè 5,75 in centesimi. Provato: 5,5→5,30 ·
    5,75→5,45 · 4,25→4,15 · 7,1666→7,10 · 0,5→0,30 · −2,5→−2,30.
  - **Via la «P» dei mensilizzati**: la riga `dp.mensilizzato && isNumeric(sv) → "P"` è stata
    **tolta**, quindi anche per loro nel PDF si leggono le ore. ⚠️ Era il comportamento in stile
    LUL («P = presenza»): l'ha cambiato Christian, non è un'iniziativa. La **«R»** del riposo e i
    codici di assenza restano come prima.
  - **Il totale resta in centesimi**: la riga *TOT ORE RESE* usa **`fmt2`**, non `pdfHM`
    (provato: 28,00 e 12,75 — cioè 12,75 in centesimi, non 12,45).
  - Il trucco che **sbiadisce i minuti a zero** vale ora per `",00"` invece di `"00 min"`, e
    **non si applica più alla riga del totale** (`ri !== nd`), che è un numero decimale vero.
  - La **legenda** in fondo al PDF non nomina più la «P» (non esisterebbe più) e spiega il
    formato ora,minuti: è l'unica dicitura toccata, ed era diventata falsa per forza di cose.
  - **Provato in esecuzione** con un finto jsPDF che esegue davvero `didParseCell`/`didDrawCell`:
    un dipendente mensilizzato e uno no, con ore, FERIE e MAL. ⚠️ **Non provato**: il disegno
    vero del PDF (jsPDF e autotable non sono raggiungibili da qui), quindi impaginazione,
    colori e larghezze delle colonne restano da guardare sul PDF vero.

- 👁️ **SI VEDE MEGLIO QUELLO CHE CONTA** (ver86, 04/11/2026, due richieste di Christian:
  «ingrossiamo le cornici nelle schede in cui inserisco le ore, perché la vista mi si confonde»
  e «il risultato del mese evidenzialo bene»). Blocco CSS in fondo al `<style>` + una modifica
  alla riga del confronto con Fogli ore. **Nessuna dicitura cambiata, nessun calcolo toccato.**
  - **Griglia del mese**: `table.cal td` da `1px #e2e8f0` (quasi invisibile) a **2px `#94a3b8`**;
    `.cell-in` da 2 a **3px**; `.cell-in.blocked` resta tratteggiata ma a 2px. Scelta **B** fra le
    tre provate. ⚠️ La tabella passa da **2.140 a 2.172px** (+32), ma sta dentro `.grid-wrap` che
    ha già `overflow-x:auto`: **la larghezza della pagina non cambia** (misurato a 390 e 1500px).
    **Scartata** (per ora) la riga più spessa dopo ogni domenica: richiederebbe una classe nuova
    nel codice che disegna la riga, e Christian ha scelto solo «b».
  - **Risultato del mese**: `.cong-chip.strong` da pastiglia bianca a **badge pieno** (numero a
    26px bianco), con lo stesso colore del cartellino accanto — `#c2410c` ore in più, `#8A7080`
    ore in meno, `#059669` in pari. Il testo è ≥19px in neretto, quindi il contrasto basta anche
    sul viola (che da solo sarebbe 4,46 contro i 4,5 richiesti per il testo piccolo).
  - **TOT calcolato**: `.foot-line .foot-tot` da 12px a **16px**, il numero a **22px**.
- 📋 **LA RIGA DEL CONFRONTO CON FOGLI ORE DICE ANCHE LE ASSENZE** (ver86, richiesta di Christian:
  «oltre alle ore tratte dai fogli ore indicami anche se hanno segnato ferie, malattie ed altre
  assenze in gg»).
  - `foAggregaMese` restituisce ora anche **`assConta`**: quante giornate per ogni codice di
    assenza di Fogli ore. ⚠️ L'assenza in Fogli ore è scritta su **tutti i servizi** dello stesso
    giorno: `ass[giorno]` la tiene già una volta sola, quindi il conteggio **non si moltiplica**
    (provato con due documenti `timesheets` dello stesso mese).
  - `foConfronta` **non torna più `null`** quando tutto combacia: torna un esito con
    **`soloInfo:true`**. Così la riga esce **sempre** (scelta di Christian del 04/11/2026),
    altrimenti le assenze non si vedrebbero mai. Quando non c'è niente da segnalare il riquadro
    è **grigio sobrio** (`#f1f5f9`), quando c'è una differenza resta **arancione** come prima.
  - La riga mostra ora, in quest'ordine: nome · **ore sul foglio ore** · **assenze segnate**
    («FERIE 3 gg · MALATTIA 2 gg», oppure «nessuna») · il totale discordante e i giorni
    discordanti **solo se ci sono**. La frase finale («è solo un avviso informativo e
    ignorabile») è rimasta identica.
  - ⚠️ La riga compare **solo per chi ha un account in Fogli ore** con lo stesso "COGNOME NOME":
    `foDiff` resta `null` per gli altri. `users` e `timesheets` restano in **sola lettura**.
  - **Provato in esecuzione** con due documenti `timesheets` e i formati orari storici
    (`900`, `9`, `14.30`, `16h30`): ore 19,00 e assenze FERIE 2 gg · MALATTIA 2 gg ·
    ALTRO AUTORIZ. 1 gg, corrette. Provata a video sia la riga grigia (tutto combacia) sia
    quella arancione (totale diverso). Zero errori di pagina.

- ⏱️ **SI VEDE QUANTE ORE SONO LE «ORE AGGIUNTIVE»** (ver85, 04/11/2026, richiesta di Christian:
  «vorrei vedere in costo orario quante ore metti nelle aggiuntive»). Il numero c'era già nei
  conti (`E18`, ore aggiuntive **al mese**) e una riga lo mostrava, ma **senza unità di misura e
  senza il totale**: si vedeva solo l'importo in euro (`J18`). **Nessun calcolo è stato toccato**,
  si fa vedere un numero che esisteva già.
  - Nella tabellina in fondo al dettaglio: la riga *Ore aggiuntive al mese* ora porta la **h**, e
    sotto c'è la riga nuova **«Ore aggiuntive sul periodo»** = `E18 × mesi`.
  - Sotto la tabellina una **nota** che dice da dove vengono: con le ore *dai Riepiloghi* o *a
    mano* «dal dato vero: ore dichiarate meno le ore ordinarie lavorabili» (e, **solo se è
    impostata**, «più le ore perse sotto soglia»), con le ore *Teoriche* «stimate: ore del mese
    teoriche × la %». In coda la **maggiorazione** applicata: 15% sul minimo a 38 h/sett.,
    altrimenti 27%.
  - Nella tabella «Come si divide il periodo» una **colonna nuova «Aggiunt.»** con le ore
    aggiuntive di ciascun blocco (campo `agg` in `o.blocchi` = `E18 del blocco × mesi del
    blocco`). La somma delle colonne torna al totale del periodo (156,32 h su 4 blocchi, provato).
  - ⚠️ **Una conseguenza necessaria**: la colonna in più allargava la tabella, quindi alla cella
    del periodo è stato tolto il `whiteSpace:"nowrap"` (va a capo quando non ci sta). Misurato: a
    **1280px la pagina non scorre più di lato** (ver84: 1282px, ver85: 1280), a 390px la larghezza
    scende da 490 a **429px**. L'altezza cresce (1.508→1.569px a 1680, 3.704→3.909 a 390): è il
    prezzo della riga e della nota in più.
  - **Non regressione provata in esecuzione** su quattro casi (indeterminato; determinato senza
    proroghe; ore a mano; promozione + due proroghe che si taglia in 4 blocchi): ore, costo
    totale, €/h ed `E18` **identici al centesimo** fra ver84 e ver85; l'unica differenza è il
    campo `agg`. Zero errori di pagina.
- 🏷️ **«Valori comuni» si chiama «Aliquote e costi fissi validi per tutti»** (ver80, dicitura
  **scelta da Christian** il 04/11/2026, dopo che aveva chiesto di renderla comprensibile).
  Cambiata nel **pulsante** (chiuso: «⚙ Aliquote e costi fissi validi per tutti»; aperto:
  «▲ Chiudi»), nel **titolo del riquadro** e nella **frase d'aiuto** in cima alla scheda, così
  combaciano. Dentro ci sono 25 numeri: aliquote (INPS, INAIL, FIS, IRAP, previdenza),
  parametri del TFR, assenze presunte, spese fisse per persona, tabella CCNL. Quello che si
  scrive nella scheda della singola persona **prevale** su quello comune.
- 📤 **PUBBLICA I RESIDUI AI DIPENDENTI** (ver78, 03/11/2026). Pulsante nella barra della vista
  del mese. Calcola, per ogni dipendente con un **tetto annuo** in vigore nel periodo che
  contiene il mese guardato, `tetto / usate / restano`, abbina il nome all'operatore di Fogli ore
  (stesso "COGNOME NOME", via `foLeggiUtenti`) e scrive **un documento per persona** nella
  collection **`residui`** del progetto condiviso: doc-id = uid dell'operatore, dentro **solo
  numeri**.
  - ⚠️ **È l'unica scrittura che questa app fa fuori dal proprio documento.** `users` e
    `timesheets` restano in **sola lettura**, come sempre.
  - **Mai automatica**: pulsante + **conferma** che elenca nome per nome quanto verrà pubblicato,
    e che segnala a parte chi **non ha un account** in Fogli ore con lo stesso nome.
  - **L'esito non mente**: alla fine dice quanti sono riusciti e **chi no, con il motivo**; se
    l'errore parla di permessi, avvisa che **le regole di sicurezza nuove non sono ancora
    pubblicate** in console.
  - ⚠️ **Serve che Christian pubblichi** `regole-firestore/regole-residui-03nov26.rules` (sta nel
    repo di Fogli ore). Finché non lo fa, il pulsante fallisce e lo dice.
- 🔴 **I FESTIVI NON SI COMPILANO** (ver77, richiesta di Christian, opzione **A** = blocco totale).
  Sui giorni rossi (festività e domeniche) non si scrive più **niente**, né ore né codici:
  `nonScriv = blocked || rosso` disattiva la casella e il pulsante del permesso orario.
  ⚠️ **Conseguenze accettate da Christian**, dopo averle avute scritte: non si può più registrare
  chi lavora davvero a Natale o di domenica, e **le ore già scritte sui festivi negli anni
  passati restano visibili ma non più correggibili**. Il colore rosso e il messaggio «Giorno
  festivo/domenica — non si compila» restano, `blocked` continua a significare «fuori dal periodo
  di rapporto / mese bloccato» (colore e messaggio diversi).
  In **Compila veloce** la spunta *«Salta i giorni festivi e le domeniche»* è ora **forzata e
  disattivata**: senza, il riempimento avrebbe scritto in celle non più correggibili. La dicitura
  non è stata toccata. `onFestConfirm` (la conferma «vuoi davvero inserire ore in un festivo?»)
  resta nel file ma **non può più scattare**.
- 🎨 **COLORI: il rosa non esiste più** (da ver72, 03/11/2026, richiesta di Christian: «in luogo
  del rosa usa 5a9ce2 e gradazioni successive»). Il vecchio `#DE4C8A` era in **43 punti**: tutti
  sostituiti con una scala ricavata dal blu dato da Christian.
  | Ruolo | Colore |
  |---|---|
  | sfondi con **scritte bianche** sopra (testata, linguette attive, `table.rep th`, pulsanti selezionati) | **`#2f6fae`** |
  | **testo** blu su bianco (nomi, titoli, totali) | **`#1f4e82`** |
  | **bordi e accenti** (cornice della scheda, barretta dei blocchi) | **`#5a9ce2`** |
  | velature chiare (ex `#fdf0f6`, `#f7c6dd`, `#f3bcd6`) | **`#eef5fc`**, **`#b9d5f1`** |
  ⚠️ **Non mettere `#5a9ce2` sotto a scritte bianche**: il contrasto è 2,7 e non si legge. Con
  `#2f6fae` è 4,4 (va per testo grande e grassetto), con `#1f4e82` è 6,9. Le altre tre app NON
  sono state toccate: il rosa era solo qui.
- **Costo orario, disposizione (ver72)**: la scheda è divisa in **tre blocchi con un titolo** —
  *Il contratto* (con una tabellina dei dati del rapporto), *La retribuzione*, *Le ore da
  dichiarare* — e il risultato è **una frazione sola** (costo sopra, ore sotto, €/ora in grande)
  invece di due cartelli gemelli. Importi con **cifre tabulari** allineati a destra; gli
  imponibili separati da una riga. Tolte le scritte TUTTE MAIUSCOLE e le catene di «·».
- 🔢 **ARROTONDAMENTO: usare SEMPRE `R2`, mai `Math.round(x*100)/100`** (da ver74, 03/11/2026).
  Stesso difetto trovato da Christian in USOINT: il computer non tiene i decimali in modo esatto,
  `67,5 × 22,99` vale `1551,8249999999998` e il vecchio modo lo buttava **giù** a 1551,82 invece
  di 1551,83. Succede quando il terzo decimale è esattamente 5. **`R2(v,dec)`** (sopra `fmt2`)
  ripulisce con `toPrecision(12)`; messa in **32 punti** (tutti i `Math.round(...*100)/100` e
  `...*1000)/1000`, questi ultimi come `R2(x,3)`) e dentro **`fmt2`** e **`fmt3`**, che
  formattavano il numero sporco. ⚠️ Sui **negativi** l'arrotondamento è ora **simmetrico**
  (−1551,825 → −1551,83), cioè commerciale. I 5 casi del foglio di Christian sul costo orario
  **tornano ancora al centesimo** dopo la correzione.
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
- **Spaziature compatte, sempre** (regola permanente di Christian, 03/11/2026): imbottiture e
  distanze strette — riquadri ~9px, blocchi ~8px, griglie ~6px — così sullo schermo ci sta più
  roba e si scorre meno. ⚠️ Si stringono **gli spazi**, non i comandi: l'altezza di caselle e
  pulsanti NON si riduce (restano comodi da centrare col dito) e nessuna scritta scende sotto i
  12,5px fuori dalle griglie dense.
- Struttura chiara e intuitiva, palette coerente, distinzioni a colpo d'occhio (colori per anno,
  badge di stato, semafori); **intuitiva come se la usasse un ragazzo preadolescente da
  telefono**.
- Terminologia di dominio corretta e, dove serve generalità, neutra (es. "Committente" invece di
  "Comune").
- 🔴 **LE DICITURE NON SI TOCCANO** (regola permanente di Christian, 03/11/2026: «non devi toccare
  le diciture, furono da me scelte»). Titoli, etichette, nomi dei pulsanti, voci dei menù, testi
  delle schermate: **le parole restano quelle**, maiuscole comprese. Una passata grafica cambia
  **colori, misure, spazi e disposizione**, non il testo. Se una dicitura sembra sbagliata o
  rimanda a qualcosa che non esiste più: **segnalarla a Christian e aspettare**, non correggerla
  di propria iniziativa.
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
