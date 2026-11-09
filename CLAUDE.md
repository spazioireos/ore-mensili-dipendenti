# Istruzioni per Claude — app "Report Ore mensile" (Dipendenti)

Report delle **ore mensili dei dipendenti**: griglia giorno per giorno, codici di assenza,
Banca ore, tetto annuo, contratti e export.

- **Unico file**: `index.html` (~477 KB), **React + Babel standalone** (JSX nel browser).
- **Dati**: Firebase progetto `spazio-ireos-foglio-ore`, documento `report-ore-mensile/{uid}`.
  Accesso mail+password, **solo l'admin** `spazioireos@gmail.com`.
- ⚠️ **TRAPPOLA GIÀ COSTATA UN ERRORE**: nel documento i campi (`dipendenti`, `dati`, …) stanno
  al **PRIMO LIVELLO**, NON dentro un campo `state`. Leggere `snap.data()`, non `snap.data().state`.
- **Struttura dati**: `dipendenti[]` = `{id, nome "COGNOME NOME", …}`;
  `dati["YYYY-MM"][dipId].giorni` = mappa giorno → ore **oppure** STRINGA-codice
  (assenza, vale 0 ore; codici in `CODICI`/`CODE_SET`). Totale mese = `totOfRec(rec,y,m)`.
  ⚠️ **Le ore non sono sempre un numero** (verificato sul backup del 04/11 col collaudo del
  07/11/2026): nei dati veri convivono **1.862 interi, 1.006 decimali e 3.152 stringhe**, e fra
  le stringhe ci sono sia i codici (`FEST`, `AN`…) sia **numeri scritti all'italiana con la
  virgola** (`"4,5"`). Le celle scritte dall'app finiscono come stringa (`"7,25"`). Chi legge
  quel campo deve passare da **`parseHour`**, che fa `parseFloat(s.replace(",","."))` e torna 0
  sui codici: `Number(v)` secco darebbe **NaN** su metà dei dati.
- **Numero di revisione**: costanti `APP_VER` e `APP_DATA` in cima al codice, mostrate nella
  targhetta `.app-rev` della testata. **Attuale: ver148 · 09nov26.** `APP_VER` finisce anche nei
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
  Christian il 31/10/2026 e ampliata il 06/11/2026**: `delta del mese = ore rese + ore di assenza
  retribuita + ore di PERMESSO retribuito (ver93) + ore delle FESTIVITÀ GODUTE (ver121) − monte
  del mese`. Le assenze retribuite **contano come ore lavorate** e concorrono a raggiungere il monte
  ore contrattuale; lo straordinario si paga su quanto eccede il contrattualizzato e le ore non
  dovute si trattengono, **tutto dentro lo stesso mese**: Spazio Ireos **non usa la Banca ore**.
  Esempio deciso da Christian: contratto 165 h, lavora 165 h e ha 2 giorni di ferie (12,69 h) →
  **+12,69 di straordinario**. Secondo esempio, del 06/11/2026: contratto 165 h, **172 rese** e
  **2 festività godute** → le ore da fare erano **152,333** e lo straordinario è **19,6666**.
  ⚠️ Le due quote giornaliere sono diverse di proposito: le **assenze** valgono `monte/26`
  (6,3462 a 38 h/sett., è il 12,69 del primo esempio), le **festività** `oreSett/ggSett`
  (6,3333, è il 152,333 del secondo). ⚠️ Le festività **non godute** (domeniche e 4 novembre)
  **non entrano**: «sono un'eccezione che non rientra nel calcolo».
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
  componente **`CostoOrario`**. Tabelle `MINIMI_CCNL` (dalla **ver128**: Feb24/Ott24/Ott25, **13
  livelli** A1→F2, scelte **per data**), `SCATTI_CCNL` e `COSTO_COMUNE_DEF`.
  ⚠️ **Dalla ver138 le tabelle si LEGGONO SEMPRE da `ccnlTranche(state)`**, non direttamente da
  `MINIMI_CCNL`: le tre dell'app restano il punto di partenza, ma Christian può aggiungerne altre
  dal pulsante **⚙ AGGIORNA TABELLE CCNL** e finiscono in `state.ccnlTab`. Usare `minimiDi` e
  `scattoDi`, mai gli oggetti nudi.
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
    rispetto all'xlsx; i **mesi** erano contati **INTERI** anche con un giorno solo di contratto
    (scelta «prudenziale» del 02/11) — ⚠️ **cambiato in ver103**: vedi la scheda sotto.
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
     ⚠️ **Dalla ver124 la domenica di Pasqua NON sta più in `festivitaSet`** (vedi la scheda 🐣):
     ci sta solo il **Lunedì dell'Angelo**. Non rimetterla.
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
    ⚠️ **Le «non godute» di questa tabella sono quelle della ver79**: dalla **ver124** la domenica
    di Pasqua non è più nell'elenco, quindi il 2026 ne conta **3** e non 4 (vedi la scheda 🐣).
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
  «una dipendente fu assunta a livello D1, poi cambiò, ma nel costo orario lascia D1 come
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
- ⚖️ **IL COSTO ORARIO SUI PERIODI CORTI: COME STANNO LE COSE** (indagine del 05/11/2026, partita
  da una domanda di Christian su un caso vero: «perché ha ore aggiuntive?»).
  - **Il caso**: persona a 15 h/sett., **1 mese**, 65,00 h dichiarate dai Riepiloghi. L'app
    mostrava **11,07 ore aggiuntive = 139,56 €** e un costo orario di **22,40 €/h**.
  - **Da dove venivano**: `O8` (ore ordinarie attese) = settimane del mese **meno** la fetta
    presunta di ferie (30 annui ÷ 12 = 2,5 gg) e di malattia (2 gg/mese) → 3,60 settimane × 15 =
    **53,93 h**. Le 65 dichiarate superano le 53,93, e la differenza diventa **supplementare al
    +27%** (`E18` → `J18` → imponibile II → costo totale).
  - ⚠️ **Nella stessa app convivono due idee di «ore del mese»**, e non coincidono:
    | | come si calcola | esempio |
    |---|---|--:|
    | Tabellone, *ORE MESE* | `monteFissoMese` = 165 × oreSett ÷ 38, uguale ogni mese | 65,13 h |
    | Costo orario, *ore lavorabili* | settimane lavorabili × oreSett, al netto delle assenze presunte | 53,93 h |
    Sullo stesso mese il Tabellone dice «in pari» e il Costo orario dice «11 ore di supplementare».
  - **Misurato in esecuzione**, stessa persona e stesso contratto:
    | Periodo | Ore rese | Costo | €/h | Ore aggiuntive |
    |---|--:|--:|--:|--:|
    | **Anno intero** (si prende le ferie) | 620,00 | 12.601,06 | **20,32** | **0,03** |
    | Mese lavorato pieno | 65,00 | 1.456,32 | 22,40 | 11,07 |
    | Mese lavorato pieno, senza le aggiuntive | 65,00 | 1.268,07 | 19,51 | 0 |
    | **Mese con metà ferie** | 32,00 | 1.268,07 | **39,63** | 0 |
    **Sull'anno il modello funziona da solo** (le aggiuntive vengono zero). **Sui periodi corti no.**
  - ⚠️ **La compensazione va al CONTRARIO di come sembra**: nel mese di ferie lo stipendio si paga
    uguale ma le ore rese crollano, quindi il costo orario **sale** (39,63 €/h), non scende.
    L'anno intero è una **media pesata** fra mesi pieni e mesi con ferie: costo totale ÷ ore
    totali. **Non** è la media dei costi orari mensili.
  - 🚫 **DECISIONE DI CHRISTIAN (05/11/2026): si lascia com'è.** Gli erano state proposte due
    correzioni — (1) contare ferie/permessi/malattia **veri** dal Tabellone invece dei numeri
    presunti, (2) un avviso quando il periodo è più corto di 12 mesi — e ha risposto «il resto
    lascia come è». **Non riproporle.**
  - ⚠️ **Limite noto e accettato**: su **un mese solo** il costo orario **sovrastima di circa il
    10%** rispetto al valore annuo. **Per il numero vero si calcola sull'anno intero o su tutto
    il contratto.** Un periodo corto non può comprendere le ferie maturate e non ancora godute.
- 🐞 **«NON CALCOLABILE» QUANDO NON CI SONO ORE** (ver96, 05/11/2026, unico dei tre punti che
  Christian ha accettato). Se si sceglie **«dai Riepiloghi»** (o **«a mano»**) e in quel periodo
  **non c'è nessuna ora**, `H38 = (G38>0)? G38 : F38` ricadeva **in silenzio sulle ore TEORICHE**
  e mostrava un costo orario calcolato su ore che non esistono (nel caso provato: 22,81 €/h su
  60,44 ore inventate).
  - Nuova bandierina **`o.oreMancanti`** in `datiCosto`: vera quando la fonte **non** è
    «teoriche» e le ore sono 0.
  - **A video**: al posto delle ore un «—», e al posto del numero grande **«non calcolabile»** in
    arancione con sotto il motivo («in questo periodo non ci sono ore nei Riepiloghi» / «scritte
    a mano»). Il **Costo totale resta**, perché quello è vero.
  - **Nell'Excel del Costo orario**: *ORE RENDICONTATE* = 0 e *COSTO ORARIO €/h* = «non
    calcolabile». ⚠️ Prima scriveva le ore teoriche e un numero: era una bugia nel foglio.
  - Scegliendo **«Teoriche»** il numero torna: quella è una scelta voluta, non un vuoto.
  - **Provato in esecuzione**: persona con ore → 20,12 €/h come prima; persona senza ore →
    «— ore» e «non calcolabile»; la stessa persona su «Teoriche» → 18,67 €/h; e il **foglio Excel
    catturato davvero** scrive `GAMMA PROVA … 0 … "non calcolabile"` mentre le altre due righe
    restano coi loro numeri.

- 🚫 **«COMPILA VELOCE» NON ACCETTA PIÙ I NEGATIVI** (ver148, 09/11/2026, difetto **trovato dal
  SECONDO collaudo** e corretto applicando la regola che Christian aveva già dato ad **A4**:
  «vieta sempre i negativi nelle celle compilabili da me»).
  - 🔴 **Misurato prima di correggere**: battendo **`-3`** nella finestra «Compila veloce» la nota
    diceva «ore: -3», il pulsante restava **ACCESO** e premendolo scriveva **22 celle a −3**, con
    **TOT calcolato −66,00** e TOT teorico −66,000. Anche `-12` e `-0,5` passavano.
  - **Perché era rimasto aperto**: nella cella del Tabellone il meno non si può scrivere (ver102,
    il modello `^\d{0,2}([.,]\d{0,2})?$`), ma **«Compila veloce» NON passa da `CellInput`** — è
    la stessa ragione per cui servirono la **ver143** (il tetto delle 13 ore) e la **ver144** (il
    testo libero). Sul **segno** il buco era rimasto: `-3` è un numero valido e sta sotto le 13.
  - **La correzione**: bandierina **`valNegativo`** accanto a `valOltreIlTetto` e `valNonValido`;
    il pulsante **«Compila N giorni» si spegne** e la nota diventa rossa con
    «**Le ore non possono essere negative.**» ⚠️ **Dicitura nuova, scritta da Claude**, come
    quelle della ver142/143/144.
  - ⚠️ **I codici non sono toccati** (FERIE, MAL, EXF… passano come prima) e lo **zero** resta
    ammesso: serve per azzerare un mese.
  - **Provato in esecuzione** (`sc-dip-C.cjs`): `-3` · `-12` · `-0,5` e il solo `-` spengono il
    pulsante e la nota dice il motivo; `7` · `13` · `0` · `12,5` · `FERIE` passano; **forzando il
    clic nessuna cella viene scritta**; con `7` il mese si riempie ancora.

- 🧪 **IL RIQUADRO «SIMULAZIONE»: LE GIALLINE CHE RESTANO, TUTTE IN UN POSTO** (ver147,
  09/11/2026, Christian: «**Simulazione a1 provvedi**», cioè il pezzo che mancava di **A1** —
  sua frase: «Solo i dati per le simulazioni puoi tenerli nella scheda costo orario,
  eventualmente creando un box apposito con celle gialline per inserire i dati»).
  - **Dove sta**: un quarto riquadro in fondo alla scheda del Costo orario, dopo *Le ore da
    dichiarare*, con il filetto **ocra** invece di azzurro, titolo **«🧪 Simulazione»**.
  - **Che cosa ci è finito dentro**, spostato **senza toccare niente**: **Mesi di contratto** (con
    l'avviso giallo della ver108), **Settimane del periodo** e **Settimane davvero lavorabili**
    (con l'avviso della ver133) e il pulsante **«↺ Rimetti i valori calcolati»**, che ora svuota
    **tutte e tre** in una sola copia dello stato (ver107).
  - 🚦 **In cima il riquadro dice se stai simulando**: in verde «✅ **Non stai simulando niente**»
    oppure in giallo «⚠️ **Stai simulando.** L'app sta usando quello che hai scritto a mano per:
    …», che nomina **anche** gli **scatti**, il **superminimo** e le **ore scritte a mano** —
    quelli restano dove sono (accanto a ciò che forzano) e il riquadro dice dove svuotarli.
    Serviva perché una forzatura rimasta scritta cambia i numeri e prima bisognava andarla a
    cercare in giro per la scheda. ⚠️ **Diciture nuove, scritte da Claude.**
  - **Fuori dal riquadro**: «Mesi di contratto» resta visibile in *Il contratto* ma **grigia e di
    sola lettura**, e le due righe delle settimane nella tabellina delle teoriche diventano **di
    sola lettura**, con la nota «⚠️ scritte a mano in 🧪 Simulazione» quando lo sono.
  - 🐞 **DIFETTO PREESISTENTE TROVATO E CHIUSO QUI**: la casella «Mesi di contratto» era
    l'**ultima** con il difetto della **ver80** (il rimborso km): da vuota mostrava il valore
    calcolato (**12**), quindi battendo una cifra in fondo diventava **«125»** e il costo passava
    da **18.197,43 € a 164.566,02 €**. **Misurato in esecuzione, identico nella ver146.** Ora è
    vuota con il calcolato come **segnaposto**, come le due righe delle settimane.
    ⚠️ **Nessun calcolo è cambiato: cambia solo cosa si vede da vuota.**
  - ✅ **NON REGRESSIONE, misurata due volte**: **ver146 e ver147** danno costo e €/h **identici**
    per tutti e **16 i dipendenti veri** (gen→ott 2026, **0 differenze**); e — prova più forte —
    **ver140 e ver147**, cioè *prima e dopo tutta la catena ver141→ver147*, danno anch'esse
    **0 differenze sui 16**.
  - **Provato in esecuzione** (`ver147.cjs` **25/27** + `sc-dip-B.cjs`): il riquadro c'è col
    filetto ocra; le tre caselle partono **vuote** col segnaposto; senza niente scritto dice che
    non stai simulando e **non** mostra il ↺; scrivendo le settimane il costo cambia, l'elenco
    nomina la leva e la tabellina delle teoriche dice «scritte a mano»; scrivendo i mesi l'avviso
    della ver108 compare **dentro** il riquadro e **non più** in «Il contratto»; il ↺ svuota tutte
    e tre e **il costo torna esattamente quello di prima**.
    ⚠️ **I due «falliti» su 27 erano attese sbagliate del mio script** (leggevo il valore di una
    casella da `innerText`, che non lo contiene, e mi aspettavo vuota la casella dei mesi prima
    della correzione del difetto della ver80).

- 🏛️ **I DATI DEL COSTO SI SCRIVONO IN ANAGRAFICA, E POSSONO AVERE UN PERIODO** (ver146,
  09/11/2026, punto **A1** della ricognizione, risposta di Christian: «tutto ciò che può stare in
  anagrafica ci stia, **anche magari temporizzando**: ad esempio, se ti do un rimborso, può
  essere che non sia perpetuo, ma abbia un tempo proprio (ad esempio mensile da gen26 a giu26).
  Solo i dati per le simulazioni puoi tenerli nella scheda costo orario»).
  - **Sezione nuova in ANAGRAFICA: «Costo del lavoro»**, con le nove voci che prima si
    scrivevano nella scheda del Costo orario: *Premi (tempo pieno) €*, *Premio €/mese*,
    *Rimborso km €* + *come si conta*, *Ore/mese sotto soglia perse*, *TFR accantonato al 31/12 €*
    + *anno*, *Giornate di ferie residue*, *Mesi di maternità*, *Giorni settimanali*.
  - 🕐 **Il periodo**: le tre voci **ricorrenti** (premi, premio al mese, rimborso km) hanno un
    **dal** e un **al** facoltativi, scritti come `mm/aaaa`. Vuoti valgono sempre; scritti,
    **fuori da quei mesi la voce vale ZERO**. `firmaMese` li guarda, quindi **il periodo si
    taglia da solo** al mese in cui la voce parte o finisce, e ogni pezzo porta il suo.
  - **Funzioni nuove** (accanto a `superminimoAt`): `mmAnno`, **`anaVoceNum`**, `anaVoceTesto`,
    `anaDentroIlPeriodo`, **`voceAnaAt(dp,campo,y,m)`** e **`voceAnaPeriodo(dp,campo,pairs)`**.
  - 🔑 **REGOLA DI SICUREZZA, ed è la ragione per cui non si rompe niente**: se in Anagrafica la
    casella è **vuota**, la funzione torna **`null`** e il motore continua a leggere il **vecchio
    valore** della scheda del Costo orario, esattamente come prima — lo stesso meccanismo degli
    «scatti riconosciuti» della ver135. ⚠️ **Nessun dato già scritto smette di funzionare.**
  - **Nel Costo orario** quelle nove caselle sono ora **grigie e di sola lettura**, e la nota
    sotto dice da dove arriva il numero: «si scrive in ANAGRAFICA → Costo del lavoro» oppure
    «da scrivere in ANAGRAFICA → Costo del lavoro (qui c'è ancora il vecchio valore della
    scheda)». ⚠️ **Diciture nuove, scritte da Claude.**
  - 🔴 **L'esempio di Christian, misurato in esecuzione**: su una persona vera, periodo gennaio →
    dicembre 2026, un rimborso di **100 €/mese**:
    | | costo |
    |---|--:|
    | senza rimborso | 18.197,43 € |
    | 100 €/mese **sempre** | 19.397,43 € (**+1.200,00**) |
    | 100 €/mese **solo da gennaio a giugno** | 18.797,43 € (**+600,00**) |
    **Esattamente la metà**: la temporizzazione funziona mese per mese.
  - ✅ **NON REGRESSIONE, misurata**: con l'Anagrafica vuota **ver145 e ver146 danno costo e €/h
    identici per tutti e 16 i dipendenti veri** (gen→ott 2026, **0 differenze**).
  - **Provato in esecuzione** (`ver146.cjs`, **27 controlli su 28**, zero errori di pagina): la
    sezione c'è con tutte e nove le voci e le caselle del periodo; il rimborso entra nel costo e
    con il periodo costa la metà; le nove caselle del Costo orario sono **grigie e disabilitate**
    e mostrano il valore scritto in Anagrafica.
    ⚠️ **L'unico «fallito» era un'attesa sbagliata del mio script**: controllavo che il numero
    dei pezzi aumentasse, ma quel periodo era **già diviso in 13 pezzi** (uno per mese), quindi
    il taglio in più non si poteva vedere dal conteggio. Che la temporizzazione agisca è provato
    dal numero: +600,00 invece di +1.200,00.
  - ✅ **Il resto di A1 è stato fatto nella ver147**: vedi la scheda 🧪 qui sopra.

- 🧹 **VIA LA TENDINA MORTA, E LA FRASE CHE MENTIVA** (ver145, 09/11/2026, due risposte di
  Christian alla ricognizione delle questioni aperte: «a7: togli» e «a8: correggi»).
  - **A7 — tolta la tendina «Tabella CCNL» dai valori comuni.** Stava lì dalla ver128, ma dalla
    **ver137 non veniva più letta** (`tabScritta = ""`): il collaudo del 09/11/2026 ha
    **misurato** che forzandola il costo non cambiava di un centesimo. A video sembrava un
    comando vivo. ⚠️ **Il valore eventualmente salvato in `costoComune.tabella` NON è stato
    cancellato**: semplicemente non si legge e non si scrive più, come `ana.proroAvvio` dalla
    ver69 — **verificato** che un «Ott24» già nei dati resta innocuo. La tabella si sceglie
    sempre dalla data e si aggiorna da **⚙ AGGIORNA TABELLE CCNL**, che resta.
  - **A8 — corretta la frase in cima a *La retribuzione***. Diceva «**Scegli il livello e il
    minimo si compila da sé**», ma dalla ver137 il livello **non si sceglie più da lì**. Ora dice
    «**Il livello arriva da ANAGRAFICA → Contratto e il minimo dalla tabella CCNL in vigore.**»
    ⚠️ **Dicitura nuova, scritta da Claude su autorizzazione esplicita di Christian**: era stata
    segnalata e lasciata ferma dal 09/11 proprio per il §10.6.
  - **Provato in esecuzione** (`ver145.cjs`, **7 controlli su 7**, zero errori di pagina).

- 🔐 **DUE SCHEDE APERTE NON SI CANCELLANO PIÙ A VICENDA** (ver144, 09/11/2026, difetto trovato
  dal collaudo generale e corretto su richiesta di Christian: «1 fallito: correggi»).
  - 🔴 **Il difetto, misurato**: con **due schede aperte sullo stesso browser**, la scheda A
    scriveva 11,25 e salvava; poi la scheda B — aperta **prima** — scriveva 12,75 e salvava, e
    **l'11,25 spariva**, **senza nessun avviso**. Causa: `doSave` riscrive **l'intero stato**
    dalla memoria della propria scheda, quindi vince l'ultimo che preme 💾.
  - **La difesa è un TIMBRO**: a ogni salvataggio riuscito `saveLocal` scrive una chiave a parte
    **`LS_TIMBRO`** (`<LS_KEY>__timbro`) con un numero sempre diverso, e **torna quel timbro**
    invece di `true` (una stringa non vuota resta "vera", quindi i controlli esistenti non
    cambiano). Ogni scheda ricorda in **`timbroMio`** il timbro trovato all'avvio o scritto da
    lei. `doSave` confronta: se il timbro nella memoria è **diverso**, qualcun altro ha salvato
    nel frattempo e l'app **chiede** prima di sovrascrivere.
  - **La domanda** usa il `ConfirmModal` che c'era già: «**Un'altra scheda ha salvato dopo di
    te**» · «Se salvi adesso, QUELLE modifiche vengono sostituite… Per tenerle: annulla, fai un
    ⬇ Backup di sicurezza, poi ricarica la pagina (F5)» · pulsante «**Salva lo stesso**».
    ⚠️ **Dicitura nuova, scritta da Claude.**
  - ⚠️ **Il formato dei dati NON cambia**: il timbro sta in una chiave **sua**, fuori dallo
    stato, quindi il **backup JSON e il documento restano identici**.
  - ⚠️ **Vale per le schede dello STESSO browser.** Due computer diversi collegati al cloud non
    si vedono per questa strada: lì l'ultimo che salva vince, **come prima**. Non è stato
    toccato il percorso Firebase.
  - **Provato in esecuzione** (`ver144.cjs`, **14 controlli su 14**): A salva senza domande; B
    **avvisa** invece di sovrascrivere e intanto l'11,25 **è ancora lì**; **annullando** A resta
    e B non scrive; con «Salva lo stesso» B scrive davvero; e il **salvataggio successivo di B
    non richiede più conferma**. Zero errori di pagina.
- 🚫 **«COMPILA VELOCE» NON ACCETTA PIÙ TESTO LIBERO** (ver144, stessa richiesta: «2 fallito: ok
  fallo»). Scrivendo **`PIPPO`** la nota diceva «ore: PIPPO» e il pulsante riempiva **22 celle**
  (che la ver101 segnalava poi in rosso). Ora la bandierina **`valNonValido`** spegne il pulsante
  e la nota dice «**Qui va un numero di ore oppure un codice dell'elenco (FERIE, MAL, EXF…).**»
  ⚠️ **Dicitura nuova, scritta da Claude.** **Provato**: `PIPPO` e `ciao` spengono il pulsante,
  `7` · `12,5` · `FERIE` passano, `14` resta fermato dal tetto, e forzando il clic **nessuna
  cella viene scritta**.
  🟠 **NON corretto, per scelta di Christian** («3 fallito minore: pazienza»): un testo di **200
  caratteri** in un campo dell'anagrafica fa scorrere la pagina di lato (1.700 → 2.659 px; a 120
  caratteri ancora no).

- ⚡ **IL TETTO DELLE 13 ORE VALE ANCHE IN «COMPILA VELOCE»** (ver143, 09/11/2026, richiesta di
  Christian: «Estendi compila veloce»).
  - **Perché serviva**: `QuickFillModal` **non passa da `CellInput`** (è così dalla ver102),
    quindi il tetto della ver142 non lo toccava: di là un valore oltre le 13 ore sarebbe entrato
    lo stesso, e per di più **su decine di giorni in un colpo solo**.
  - **Come**: bandierina `valOltreIlTetto` (numero, non codice, oltre `ORE_MAX_GIORNO`); il
    pulsante **«Compila N giorni» si spegne** e la nota a lato diventa rossa con la stessa frase
    della ver142. ⚠️ **I codici non sono toccati**: FERIE, MAL, EXF… passano come prima.
  - **Provato in esecuzione** (`qf143.cjs`, **11 controlli su 11**): 7 · 13 · 12,5 passano;
    **14 · 20 · 99 · 13,5 spengono il pulsante** e mostrano il motivo; FERIE passa; premendo con
    7 il mese si riempie davvero (22 celle a 7,00). **Zero errori di pagina.**
  - 🔴 **BUCO ANCORA APERTO, TROVATO QUI E NON CHIUSO (serve il permesso di Christian)**:
    «Compila veloce» accetta anche **testo libero**. Scrivendo **`PIPPO`** la nota dice
    «ore: PIPPO», il pulsante resta acceso e **vengono scritte 22 celle**. L'app poi le segnala
    (tutte e 22 diventano **rosse** per la ver101 e compare la fascia di avviso), quindi il danno
    si vede e si può disfare, ma non dovrebbe essere possibile. **La correzione sarebbe la stessa
    riga**: rifiutare un valore che non è né un codice né un numero. **Chiesto a Christian il
    09/11/2026, in attesa.**

- ⏱️ **IN UN GIORNO NON SI SCRIVONO PIÙ DI 13 ORE** (ver142, 09/11/2026, scelta di Christian
  «ok 13» dopo che il collaudo generale aveva misurato che si potevano scrivere **99 ore in un
  giorno**).
  - **Com'era**: la ver102 limitava solo il **numero di cifre** (due), quindi `999` veniva
    rifiutato al terzo carattere ma restava `99`. Novantanove ore in un giorno entravano
    nel TOT, nel tetto annuo e nello straordinario **senza che niente lo segnalasse**.
  - **Ora**: costante **`ORE_MAX_GIORNO = 13`** e funzione **`oreEntroIlMassimo(t)`**, usate
    **sia** mentre si scrive (`cellaScritturaAmmessa`) **sia** all'uscita dalla cella
    (`cellaValoreFinale`). Il carattere che farebbe sforare **non entra**, esattamente come per
    gli altri rifiuti della ver102.
  - **L'avviso dice il motivo vero**: «**In un giorno non si possono scrivere più di 13 ore.**»
    (e, all'uscita, «… : la cella è stata lasciata vuota»), invece del messaggio generico «non è
    un codice né un numero», che sarebbe stato falso perché 14 **è** un numero.
    ⚠️ **Diciture nuove, scritte da Claude.**
  - ✅ **Verificato sui dati VERI prima di metterlo**: **nessuna cella supera le 13 ore** (il
    massimo mai scritto è **8,5**), quindi **nessun dato già presente diventa irraggiungibile**.
  - ⚠️ **NON toccato: «Compila veloce»**, che non passa da `CellInput` (è così dalla ver102):
    di là un valore oltre il tetto entrerebbe ancora. Da decidere con Christian se estenderlo.
  - ⚠️ **I codici non c'entrano**: FERIE, MAL, EXF… continuano a entrare come prima.
  - **Provato in esecuzione** (`ore142.cjs`): `13` → 13,00 e `12,5` → 12,50 **entrano**; `14`
    si ferma a `1`, `99` si ferma a `9`, `13,5` si ferma a `13`; incollare `20` non scrive
    nulla; l'avviso nomina il tetto. **Zero errori di pagina.**
  - 🔴 **UNA MODIFICA FATTA E SUBITO TOLTA, da non rifare**: nella **Query → Totale su
    intervallo** avevo creduto che con le date vuote comparisse la scritta **rossa** «Date non
    valide o intervallo rovesciato», e Christian aveva autorizzato a correggerla. **Era un mio
    errore di lettura**: l'app mostra già, in **grigio**, «**Inserisci le due date per calcolare
    il totale.**» (guardia `{(!bFrom||!bTo) ? … }`), e il rosso compare **solo** quando una data
    c'è davvero ed è sbagliata. La modifica è stata **rimossa**: il file è tornato identico.
    **Non riproporla.**

- 🎓 **L'E.A.R. DEGLI EDUCATORI D1 SI CALCOLA DA SOLO** (ver141, 09/11/2026, dato di Christian:
  «Vi sono stati due etar, ossia maggiorazioni per educatori con livello d1: dal 1° gennaio 2025
  € 41,00 mensili per il tempo pieno (= 0,248 euro orari); dal 1° settembre 2025 incremento a
  € 82,00 mensili (= 0,4969 euro orari); dal 1° gennaio 2026 transito al livello D2, con
  cessazione dell'E.A.R.» → sue scelte **1a** (tabella automatica) e **2** (finisce il
  31/12/2025 per tutti, qualunque livello)).
  - 🔑 **Perché non bastava scriverlo a mano**: l'unico posto dove un importo mensile con una
    decorrenza poteva stare era il **superminimo delle trasformazioni** (ver131). Sarebbero state
    **9 righe** da scrivere (3 persone × 3 gradini, l'ultimo con lo **0** per spegnerlo), e
    l'app lo avrebbe registrato come «superminimo»: la **lettera** di trasformazione avrebbe
    scritto «riconoscimento di un superminimo mensile di 41,00 euro», parola sbagliata.
  - **Modello dati**: costante **`EAR_TRANCHE`** = `[{dal:"01/01/2025",eur:41},
    {dal:"01/09/2025",eur:82},{dal:"01/01/2026",eur:0}]` e **`EAR_LIV = "D1"`**. Gli importi
    storici **non si sovrascrivono**: ogni mese usa la tranche in vigore allora.
  - **DUE condizioni, entrambe necessarie**: (a) la persona è segnata **educatore** in
    ANAGRAFICA → Contratto; (b) **in quel mese** il suo livello è **D1**. Così il passaggio a D2
    lo spegne **da sé**, senza nessuna data da scrivere, e la terza tranche a **0** lo spegne
    comunque dal 01/01/2026 anche a chi resta D1 — che è la risposta di Christian alla domanda
    sulla cessazione. ⚠️ **Non togliere nessuna delle due**: la (b) serve a non darlo ai D2, la
    terza tranche serve alla sua regola della data.
  - **Funzioni nuove** (accanto a `superminimoAt`): `earAl(y,m)`, **`eduOn(dp)`**,
    **`earMese(dp,y,m,liv)`** e **`earPeriodo(dp,pairs)`** (gemella di `superminimoPeriodo`).
  - **Dove entra**: in `calcCosto` il totale delle componenti diventa `K+L+M+N+EA`, quindi
    l'E.A.R. segue **importo orario, mensile fisso, 13ª, 14ª, festività, imponibili, contributi
    e TFR**, esattamente come il superminimo. ⚠️ **Scelta dichiarata**: piena incidenza su tutti
    gli istituti. Se la busta paga dicesse altro, va corretto.
  - **`firmaMese` lo guarda**, quindi **il periodo si taglia da solo** al 01/09/2025 e quando il
    livello non è più D1; ogni pezzo porta il suo (`ear: earMese(dp, pr0.y, pr0.m, vv.livello)`).
  - **A video**: in ANAGRAFICA → Contratto una tendina nuova **«Educatore (E.A.R.)»**
    (vuoto / SÌ / NO), **giallina** perché è un dato che scrive lui (tipo di campo nuovo
    `"sino"`); nel **Costo orario** la casella **«E.A.R. (educatore D1) €» è GRIGIA e di sola
    lettura**, come vuole il §10.6 e la direttiva «la scheda anagrafica è il motore»; e nella
    tabella «Come si divide il periodo» una **colonna E.A.R.**, che compare **solo** se in almeno
    un pezzo c'è davvero (`earCol`), per non allargare la tabella agli altri.
    ⚠️ **Diciture nuove, scritte da Claude**: «Educatore (E.A.R.)» e «E.A.R. (educatore D1) €».
  - 🔴 **Quanto mancava, misurato in esecuzione** su una persona vera (D1 19 h/sett., passata a D2
    dal 01/01/2026), periodo gennaio 2025 → dicembre 2026: costo **27.748,55 € → 28.211,54 €**,
    cioè **+462,99 €**, e €/h da 24,28 a **24,69**. Il periodo passa da **3 a 4 pezzi**:
    | periodo | liv | E.A.R. | costo |
    |---|---|--:|--:|
    | Gennaio → Agosto 2025 | D1 | **41,00 €** | 8.292,64 € |
    | Settembre 2025 | D1 | **82,00 €** | 1.316,87 € |
    | Ottobre → Dicembre 2025 | D1 | 82,00 € | 4.295,93 € |
    | Gennaio → Dicembre 2026 | **D2** | **—** | 13.806,09 € |
    ⚠️ Settembre sta da solo perché a **ottobre cambia anche la tabella CCNL**: i due tagli sono
    indipendenti e si vedono tutti e due.
  - ✅ **I dati gli danno ragione da soli**: il campo **«Ruolo / qualifica»** dell'Anagrafica dice
    già chi è chi — due persone sono «ANIMATORE / ASSISTENTE EDUCATIVO» **e D1** (sono due delle
    tre che ha nominato), due sono «EDUCATORE» ma **D2**, una è «ANIMATORE / ASSISTENTE
    EDUCATIVO» ma **D2**, e le altre D1 sono **«IMPIEGATO»**. Combacia esattamente con «gli altri
    erano già d2 oppure d1, ma non erano educatori». ⚠️ **La spunta NON viene dedotta da quel
    campo**: è testo libero, un refuso cambierebbe un costo in silenzio. Resta una scelta
    esplicita.
  - ⚠️ **Una persona ha la scheda vuota** (né livello né data di assunzione) e per lei l'E.A.R.
    **non è calcolabile** finché non li scrive. Un'altra è assunta a luglio 2025, quindi i 41 €
    le spettano solo da allora — **verificato**: il suo primo pezzo con E.A.R. parte da luglio.
  - ✅ **NON REGRESSIONE, misurata**: **ver140 e ver141 danno costo e €/h identici** per tutti e
    **16 i dipendenti veri** (gen→ott 2026, **0 differenze**), perché nessuno è segnato educatore.
    **Larghezza di pagina identica** a 390 · 768 · 1280 · 1680px, **scritte sotto i 12,5px
    identiche (7)** e **comandi sotto i 32px identici (10)**.
  - **Provato in esecuzione** (`ear141.cjs`, **23 controlli su 23**, zero errori di pagina): la
    tendina c'è ed è giallina con cornice ocra; scegliendo SÌ il dato finisce nella persona (dopo
    il 💾); la casella del Costo orario è grigia, disabilitata e mostra 82,00; i quattro pezzi con
    41 / 82 / 82 / —; la colonna E.A.R. c'è solo quando serve; **un D2 segnato educatore non lo
    prende** (costo identico al centesimo); **un D1 educatore lo prende nel 2025 e NON nel 2026**;
    e la non regressione sui 16.

- 🎨 **I TRE COLORI DELLE CELLE, FINITI** (ver140, 09/11/2026, richiesta di Christian: «per potere
  inserirti bene tutti i dati di tutti, predisponi celle giallline chiare ed incorniciate ocra.
  Le celle che sono frutto di formule siano azzurrine o grigioline (se frutto di copiature ed
  intoccabili)» → sue scelte **1b**, **2a**, **3 ok**, e **Nu\***).
  - 🔑 **La regola che ha dato era GIÀ quella in uso**: prima di toccare qualunque cosa sono state
    misurate in esecuzione **tutte e 90 le caselle** delle due schede, e il risultato è stato
    questo:
    | | Anagrafica | Costo orario |
    |---|--:|--:|
    | 🟡 giallline con cornice ocra (`#fffde7` / `#f59e0b` 2px) | 49 ✅ | 14 ✅ |
    | ⬜ grigioline di sola lettura (`#f1f5f9` / `#cbd5e1`) | 7 ✅ | 6 ✅ |
    | 🟦 azzurrine, frutto di formula (`#eef5fc` / `#b9d5f1`) | 1 ✅ | **0** 🔴 |
    | 🔴 **grigie del sistema operativo, mai vestite** (`#efefef`, bordo 1px) | **2** | **5** |
    | ⚠️ incoerente: fondo grigiolino **con cornice ocra** | — | **1** |
    Mancavano quindi **otto tendine** e **l'azzurrino nel Costo orario**.
  - 🔴 **Le otto caselle mai vestite erano tutte `<select>`**: il foglio di stile copre
    `.field input, .field select` (riga 196), ma quelle stanno **fuori** da `.field` — nella
    **barra del periodo** del Costo orario e nella **`SchedaContratto`** in fondo all'Anagrafica.
  - **Che cosa è stato fatto**, con tre stili condivisi (`gialloSel`, `azzurro`, `neutro`):
    - **tendine che sono un DATO → giallline con cornice ocra**: *Rimborso: come si conta* e
      *TFR supplementari* nel Costo orario; nella `SchedaContratto` il **mese della
      trasformazione**, i **due mesi del monte ore temporaneo**, il **mese della
      mensilizzazione** e il **periodo del massimale**;
    - **selettori del PERIODO → neutri** (bianco con cornice grigiolina 2px), **scelta 1b di
      Christian**: *Dal mese · Anno · Al mese* non sono un dato che si salva, sono «il periodo che
      stai guardando», e il giallino significa «qui dentro c'è un dato». ⚠️ Non riportarli a
      giallino senza che lo chieda lui.
    - **🟦 tre celle AZZURRINE nel blocco *La retribuzione*, scelta 2a**: *Totale delle
      componenti*, *Importo orario* (÷ 165) e *Mensile fisso di questa persona* — sono gli unici
      tre numeri **calcolati da una formula** che si leggono lì. Misurati in esecuzione:
      `rgb(238,245,252)` con cornice `rgb(185,213,241)`, tutte e tre.
    - **punto 3, l'incoerenza chiusa**: la casella delle ore *Scritte a mano*, quando il pallino
      è su un'altra fonte, aveva fondo grigiolino **ma cornice OCRA** — sembrava scrivibile e non
      lo era. Ora la cornice segue lo stato: ocra quando è attiva, grigiolina quando è spenta.
  - **Misurato dopo, in esecuzione**: Anagrafica da **49 a 51** giallline e **zero** grigie di
    sistema; Costo orario da **14 a 15** giallline, da **6 a 7** grigioline (la casella spenta ora
    è coerente) e **zero** grigie di sistema; i quattro selettori del periodo bianchi con cornice
    `rgb(203,213,225)`.
  - ⚠️ **NON toccati**: i **radio** delle tre fonti delle ore (non sono caselle), la tendina dei
    **mesi in testata** (è navigazione, fuori dalle due schede), e le celle delle ore del
    **TABELLONE**, già giallline e protette dal §10.6. ⚠️ La tendina **«Tabella CCNL»** dei valori
    comuni è stata **lasciata col grigio di sistema** di proposito: dalla ver137 non viene più
    letta, e vestirla di giallino l'avrebbe fatta sembrare un dato vivo. **Resta da decidere con
    Christian se togliere quella tendina.**
  - ✅ **NON REGRESSIONE, misurata**: **ver139 e ver140 danno costo e €/h identici** per tutti e
    **16 i dipendenti veri** (gen→ott 2026, **0 differenze**); **larghezza di pagina identica**
    (1700px); **comandi sotto i 32px: 10 prima, 10 dopo** — nessuno nuovo, come vuole il §10.6.
    ⚠️ Due tendine passano da **32 a 34px** (bordo 1px → 2px): **crescono**, non si abbassano,
    quindi la regola è rispettata.
  - **Provato in esecuzione** (`colori.cjs` per l'inventario prima e dopo, `azz140.cjs` **4/4**,
    `nr140.cjs` **5/5**): zero errori di pagina, e **tre anteprime PNG mostrate a Christian prima
    di committare** (§10.3).
- 🎖️ **LA DECORRENZA DELLO SCATTO SI LEGGE IN ANAGRAFICA** (ver139, 09/11/2026, **punto 13C**
  della direttiva di Christian: «La decorrenza dello scatto deve essere riportata automaticamente
  nella scheda anagrafica e recepita nel foglio di calcolo del costo orario»).
  - Nel Costo orario era **già recepita** dalla ver128 (il periodo si taglia al mese dello
    scatto); mancava il **farla vedere**. In **ANAGRAFICA → Contratto**, sotto *Scatti
    riconosciuti all'assunzione*, due righe nuove **grigie e di sola lettura**:
    **«Scatti maturati a oggi (automatico)»** e **«Prossimo scatto — decorrenza (automatica)»**,
    che mostra per esempio `01/02/2027  (il 2°)`.
  - **Funzione nuova `scattiStoria(state, dp, prec, ass0)`** (sopra `firmaMese`): ricostruisce le
    date **con la stessa regola di `scattiAl`**, cioè quella confermata da Christian il 09/11/2026
    scegliendo la **1a** — il «giorno 25» del suo punto 13B era **un refuso**. Mesi utili
    dall'assunzione (dal mese **successivo** se assunto dopo il giorno 1), un mese **tutto «AN»**
    non è utile e fa slittare, massimo 5. Torna `{righe, prossimo, nOggi, base, senzaAssunzione}`.
  - ⚠️ **Nessun calcolo è stato toccato**: si ricostruiscono date che il motore già usava.
    Verificato: **ver138 e ver139 danno costo identico sui 16 dipendenti veri** (0 differenze).
  - ⚠️ **Senza la data di assunzione le due caselle restano VUOTE**, di proposito: il conto
    partirebbe dal primo mese dei dati e darebbe una data inventata.
  - ⚠️ **Le due righe NON entrano nell'export Excel**: il filtro dell'export include solo i due
    campi `roauto:` storici (`proroAvvio`, `trasfAvvio`), quindi le 50 colonne restano quelle.
  - 🐞 **UN MIO ERRORE, trovato dalla prova in esecuzione e non da Babel**: avevo usato **`nTxt`**
    dentro il disegno dell'Anagrafica, ma `nTxt` è una funzione **locale di `CostoOrario`** →
    `ReferenceError` a tempo di esecuzione, che **rompeva tutta la vista Anagrafica**. Babel
    compilava senza una parola. Corretto con `String(...)`. ⚠️ **È la ragione per cui il §10.2
    chiede le prove in esecuzione**: «una compilazione riuscita non è prova che l'applicazione
    funzioni».
  - **COLLAUDO DEL PUNTO 13D — i cinque casi chiesti da Christian, attesi RICALCOLATI A MANO
    prima di scrivere lo script** (`scatti139.cjs`, oggi 09/11/2026, primo mese dei dati 2025-01):
    | caso | assunzione | maturati a oggi | prossimo |
    |---|---|--:|---|
    | assunto il **giorno 1** | 01/02/2023 | **1** | **01/02/2027** (il 2°) |
    | assunto **non** il giorno 1 | 07/01/2025 | **0** | **01/02/2027** (il 1°) |
    | **più bienni** | 01/01/2021 | **2** | **01/01/2027** (il 3°) |
    | con **2 mesi tutti «AN»** | 01/01/2024 | **1** | **01/03/2028** (il 2°) |
    | **senza** data di assunzione | — | *(vuoto)* | *(vuoto)* |
    Tutti e cinque **coincidono** col conto fatto a mano. ⚠️ Nel quarto caso i due mesi tutti AN
    (luglio e agosto 2025) fanno slittare il primo scatto **di due mesi**, da gennaio a **marzo
    2026**: è la regola di Christian, e si vede.
    **E il Costo orario dice lo stesso numero**: 1 scatto → 20,66 €, 2 → 41,32 €.
  - **COLLAUDO DEL PUNTO 9 — il caso completo** (`caso9.cjs`, **3 controlli su 3**): persona D1 a
    38 h/sett. assunta 01/01/2023, **promossa D2 dal 01/07/2026**, con **due tranche CCNL
    caricate** (Apr26 e Ott26), periodo gennaio→dicembre 2026. Il periodo si divide **da solo in
    quattro pezzi**, ognuno col suo:
    | periodo | liv | tabella | scatto | costo |
    |---|---|---|--:|--:|
    | Gennaio → Marzo 2026 | D1 | Ott25 | 1 = 20,66 € | 8.428,25 € |
    | Aprile → Giugno 2026 | D1 | **Apr26** | 1 = 20,66 € | 8.540,81 € |
    | Luglio → Settembre 2026 | **D2** | Apr26 | 1 = **23,24 €** | 9.005,25 € |
    | Ottobre → Dicembre 2026 | D2 | **Ott26** | 1 = 23,24 € | 9.472,38 € |
    Somma dei pezzi **35.446,69 €**, costo totale **35.696,69 €**: la differenza è **250,00 €
    esatti**, cioè la **formazione**, che per la ver84 si conta una volta sola sul periodo e non
    per pezzo. ✅ **Ogni variazione si applica dalla propria decorrenza, gli importi precedenti
    restano, ogni pezzo ha il suo costo, e il €/h del periodo è la media pesata.**
  - **Provato in esecuzione**: `scatti139.cjs` **28/29** + `caso9.cjs` **3/3** = **31 controlli**,
    zero errori di pagina. ⚠️ L'unico «fallito» era **un'attesa sbagliata del mio script** (la
    riga del pezzo finisce con « €» e la mia lettura voleva il numero in fondo), rifatta e
    superata.
- 📊 **⚙ AGGIORNA TABELLE CCNL: LO STORICO DEGLI IMPORTI, SENZA TOCCARE IL CODICE** (ver138,
  09/11/2026, **punto 6** della direttiva di Christian: «voglio poter caricare le nuove tabelle
  retributive in occasione di ogni rinnovo … conservare integralmente le tabelle precedenti e le
  rispettive decorrenze … aggiornare una sola volta e fare in modo che tutti i calcoli
  recepiscano automaticamente le nuove condizioni». Dicitura del pulsante **scelta da lui**).
  - ✅ **Verificato prima di costruire che non esistesse già** (lo chiedeva il suo punto 6): le
    tabelle stavano **solo** dentro `index.html` come costanti, e non c'era **nessun** modo di
    aggiungerne una senza che Claude modificasse il file. Non si duplica niente.
  - **Dove sta**: nella barra del **Costo orario**, accanto a *⚙ Aliquote e costi fissi validi per
    tutti*. Il pannello mostra **l'elenco delle tranche in vigore** (nome · vale dal · quanti
    livelli · il D1 · lo scatto D1 · se viene «nell'app» o «caricata da te») e sotto il modulo per
    caricarne una nuova.
  - **Modello dati nuovo: `state.ccnlTab`**, un elenco di `{dal:"01/07/2026", nome, minimi:{…},
    scatti:{…}}`. Vive nei **dati**, quindi finisce da sé nel **backup JSON** e nel sync. Come
    tutto il resto: **serve 💾** per salvare.
  - **Come si carica**: data di decorrenza, nome facoltativo, e i minimi **incollati** nel formato
    che Christian aveva chiesto — **una riga per livello, «D1 1.637,57»**. `ccLeggi` accetta
    `D1 1.690,00`, `D1  1690.00` e `D1 = 1.690,00`, salta le righe vuote e **conta quelle che non
    capisce**. Un'**anteprima** dice quanti livelli ha letto, quali mancano, e il D1 risultante,
    **prima** di premere il pulsante. Poi una **conferma** elenca tutto (nome, data, livelli
    letti, scatti letti, livelli senza importo, se prende il posto di un'altra) e ripete che *«Le
    tabelle precedenti NON vengono toccate»*.
  - **Funzioni nuove** (sopra `tabellaAl`): `ccnlDalN`, **`ccnlTranche(state)`** (le tre dell'app
    più le sue, ordinate per data), **`ccnlAl(state,y,m)`** (quella in vigore in quel mese),
    **`minimiDi(state,nome)`** e **`scattoDi(state,nome,liv)`**. In `App`: `onCCNLAdd` e
    `onCCNLDel`.
  - 🔑 **Gli importi storici non si sovrascrivono MAI** (suo punto 4): ogni tranche porta la sua
    decorrenza e ogni mese usa quella che era in vigore allora. **Misurato in esecuzione**:
    caricando una tranche dal **01/07/2026**, il **2026** passa da **18.197,43 € a 18.476,82 €**
    (minimo 1.727,83 → 1.778,00) e il periodo **si taglia a luglio**, mentre il **2025 resta
    8.288,89 €, identico al centesimo**.
  - **Le tre tabelle dell'app non si possono cancellare**: sono il punto di partenza e **non hanno
    la ✕** (verificato: zero pulsanti rossi finché non se ne carica una propria). Quelle caricate
    da lui si togliono con la **✕**, con conferma, e i calcoli tornano alla tabella di prima.
  - **Una sua tranche con la STESSA decorrenza di una dell'app prende il suo posto**: serve a
    correggere un importo. **Misurato**: con una tranche dal 01/10/2025 e D2 = 1.730,00, il
    minimo del periodo diventa **1.730,00** invece di 1.727,83, l'elenco mostra la sua al posto
    della «Ott25», e **Feb24 e Ott24 restano**. ⚠️ La riga originale resta **nel codice** e
    ricompare se lui cancella la sua.
  - **Gli SCATTI**: Christian ha detto che sono «**fissi**, nel senso che il loro importo non è
    mai stato alzato con i rinnovi» (09/11/2026), ma il suo punto 6.2 chiede di poterli
    aggiornare con la decorrenza. Perciò una tranche **può** portare anche i suoi scatti, e se non
    li porta **si eredita quello della tranche precedente** (in fondo, la tabella dell'app).
    Funziona sia se non cambiano mai, sia se un giorno cambiano. **Misurato**: senza scatti
    scritti la riga nuova mostra **20,66**; scrivendo 30 mostra **30,00**.
  - ⚠️ **Il terzo parametro di `tabellaAl(y, m, state)` è FACOLTATIVO**: senza `state` la funzione
    si comporta esattamente come prima (solo le tre tranche dell'app). Serve a non rompere
    nessuna chiamata.
  - ⚠️ **La tendina «Tabella CCNL» dei valori comuni è rimasta dov'era** ma, dalla **ver137**, non
    viene più letta (`tabScritta = ""`): la tabella è sempre quella della data. **Non è stata
    tolta** perché è una dicitura di Christian. **Da decidere con lui.**
  - **Provato in esecuzione** (`ccnl138.cjs` **27/28** + `ccnlE.cjs` **6/6** = **33 controlli**,
    zero errori di pagina): il pulsante c'è; l'elenco mostra le tre tranche dell'app col D1
    1.637,57 e lo scatto 20,66; nessuna ✕ sulle tabelle dell'app; il modulo legge 13 livelli su
    13 e lo dice; la conferma elenca tutto; la tranche nuova compare come «caricata da te» e le
    tre dell'app restano; il 2026 usa la tabella nuova, il minimo e il costo salgono, il periodo
    si taglia a luglio; **il 2025 non cambia di un centesimo**; gli scatti ereditati e quelli
    scritti; la sostituzione a pari decorrenza; e la **NON REGRESSIONE**: senza nessuna tabella
    caricata, **ver137 e ver138 danno costo e €/h identici per tutti e 16 i dipendenti**
    (gen→ott 2026, **0 differenze**).
    ⚠️ **L'unico «fallito» dei 28 era un'attesa sbagliata del mio script**, non un difetto
    dell'app: il nome di prova «Ott25 corretta» contiene uno spazio e la mia espressione di
    lettura ne prendeva solo il primo pezzo. Rifatto con un nome senza spazi: **6 su 6**.
- 🩶 **LA SCHEDA ANAGRAFICA COMANDA: CINQUE CASELLE DEL COSTO ORARIO SONO GRIGIE E DI SOLA
  LETTURA** (ver137, 09/11/2026, direttiva di Christian «**LA SCHEDA ANAGRAFICA È IL MOTORE DEL
  SISTEMA**» + sua scelta **«a»**: «la casella del Costo orario diventa grigia e di sola lettura,
  il dato si scrive solo in Anagrafica»; e **«6a»** sul part-time).
  - **Che cosa è diventato grigio** (`#f1f5f9`, bordo `#cbd5e1`, `disabled` — lo stesso grigio dei
    campi `roauto:` dell'Anagrafica e degli scatti riconosciuti della ver135), con sotto ciascuna
    la riga che dice **da dove arriva il dato**:
    | casella | fonte |
    |---|---|
    | **Livello** | ANAGRAFICA → Contratto + le trasformazioni registrate |
    | **Minimo tabellare €** | tabella CCNL in vigore × livello |
    | **Tabella** | la data (sempre «automatica (per data)») |
    | **Ore settimanali** | ANAGRAFICA → Orario + i periodi con orario diverso |
    | **Addizionale tempo determ. %** | 1,40 + 0,5 × proroghe già partite |
    | **Part-time %** (NUOVA) | ore settimanali ÷ 38 |
  - **Funzione nuova `campoRO(lbl, valore, nota, titolo)`**, gemella di `campoNum`: stessa
    struttura, ma grigia e non scrivibile. `campoNum` **non è stata toccata** e la usano ancora
    tutte le altre caselle.
  - 🔑 **Perché NON bastava renderle grigie**: una casella che non si può più né scrivere né
    **svuotare** terrebbe per sempre uno scavalcamento rimasto nei dati vecchi. Quindi
    `datiCosto` **non li legge più**: `minimo`, `oreSett` e `addizTD` prendono il valore
    automatico, `liv = livAuto`, `tabScritta = ""`. Di conseguenza `scrittoAMano` perde cinque
    dei sette casi e `fissoSplit.tab` è sempre falso: **il periodo torna a tagliarsi** al
    rinnovo, al passaggio di livello e al cambio di orario.
    ⚠️ **I valori restano nel database** (`dp.costo.livello`, `.minimo`, `.oreSett`, `.addizTD`,
    `.tabella`): non vengono cancellati, semplicemente non si leggono più — come
    `ana.proroAvvio` dalla ver69.
  - 🔴 **QUANTO ERA PERICOLOSO, misurato in esecuzione**: mettendo a mano livello **F2** e minimo
    **9999** su una persona vera (periodo gen→ott 2026), la **ver136 dava 158.381,47 €** e il
    periodo **non si tagliava**; la **ver137 dà 14.427,24 €** (il numero giusto) e **si taglia in
    pezzi**. Era una porta aperta su un costo dieci volte più alto, senza nessun avviso.
  - ✅ **E sui dati veri non si muove un centesimo**: prima di toccare qualunque cosa è stato
    contato quante persone avessero scritto una di quelle cinque caselle — **ZERO su 16** —
    e verificato in esecuzione che **ver136 e ver137 danno costo e €/h identici per tutti e 16 i
    dipendenti, su due periodi** (gen→ott e gen→dic 2026): **0 differenze**.
  - ⚠️ **Che cosa RESTA giallino e scrivibile, di proposito**: *Giorni settimanali* (non lo ricava
    né l'Anagrafica né il CCNL: è una scelta vera, 5 o 6 giorni), *Mesi di contratto* (ver108),
    le *Settimane* della simulazione (ver133), *Scatti di anzianità €* (ver135), *Superminimo €*
    (ver131). Quelle sono **forzature volute**, e continuano a prevalere con il loro avviso
    giallo. **Non trasformarle in grigie** senza che Christian lo chieda.
  - ⚠️ **Il part-time % NON entra in nessun calcolo**: il motore lavora sulle **ore settimanali**.
    È un numero che si legge, e per questo è grigio. La casella *Part / Full time* dell'ANAGRAFICA
    **non è stata toccata**: serve alla lettera di contratto.
  - 🔴 **UNA DICITURA ORA RIMANDA A QUALCOSA CHE NON SI PUÒ PIÙ FARE, e NON è stata corretta**
    (§10.6: segnalarla e aspettare). In cima al blocco *La retribuzione* c'è «**Scegli il livello
    e il minimo si compila da sé**»: il livello non si scegle più da lì, si scrive in Anagrafica.
    **Da decidere con Christian.**
  - ⚠️ **Le caselle dell'Anagrafica che Christian ha compilato NON sono state toccate**
    (sua istruzione del 09/11/2026: «lasciamo stare le cose che ho inserito io»). *Importo orario
    base*, *Superminimo*, *Scatti*, *Altro importo orario*, *Importo orario totale* restano dove
    sono e continuano a servire **solo** alla lettera .docx e all'export Excel. In particolare
    **l'ETAR** (scritto come *Altro importo orario*, 0,25 e 0,50 €/h su due persone = 41,25 e
    82,50 €/mese a tempo pieno) **continua a non entrare nel costo**: per entrarci va scritto nel
    *Superminimo* del Costo orario, che resta giallino.
  - **Provato in esecuzione** (`ro137.cjs`, **23 controlli su 23**, zero errori di pagina): le sei
    caselle grigie col loro sfondo misurato `rgb(241,245,249)` e `disabled=true`; le quattro che
    restano giallline `rgb(255,253,231)` e scrivibili; Part-time 18 h → **47,37 %**; lo
    scavalcamento vecchio che non prevale più e il periodo che torna a tagliarsi; la non
    regressione sui 16 dipendenti su due periodi.
- 🐞 **TRE DIFETTI PREESISTENTI CHIUSI, tutti e tre misurati** (ver136, 09/11/2026, trovati con la
  verifica del motore `calcCosto` chiesta da Christian nella direttiva «RICOGNIZIONE GENERALE»).
  Nessuno dei tre era stato introdotto da una versione recente.
  - 🚗 **a) Il rimborso km «secco» si moltiplicava per il numero di pezzi.** `J34` sta nell'elenco
    dei campi sommati fra i blocchi (ver84) e, con la tendina su *secco*, **ogni blocco tornava
    l'importo intero**. È lo stesso caso della **formazione**, che era già gestito una riga sopra:
    una spesa «una volta sola» non si somma fra i pezzi.
    **Misurato in esecuzione** su una persona vera con una trasformazione (periodo gen→dic 2026,
    **2 pezzi**, rimborso 50 € secco): costo **18.297,43 € → 18.247,43 €**, cioè **esattamente
    50,00 € in meno**. Controprova aritmetica: *al mese* dà 18.797,43 € (= 12 × 50), e
    18.797,43 − 550 = **18.247,43**, il numero del *secco*. ⚠️ Con la tendina su **«al mese» non
    cambia niente** (verificato: differenza 0,00 €), perché lì ogni blocco deve davvero portare
    i suoi mesi.
  - 🔴 **b) Un divisore scritto a ZERO rompeva il calcolo, e il risultato si vedeva come «0,00».**
    Due caselle dei valori comuni sono divisori: **Giorni settimanali** (`Q2`, in `O6calc`) e
    **Divisore TFR** (`c.tfrDiv`, in `J19`). `costoComune` le legge con `cNum(raw, def)`, e
    **`cNum` accetta lo zero come numero valido**, quindi lo zero arrivava davvero nel conto →
    `Infinity`/`NaN` → **`R2` riduce a 0** ogni valore non finito e **`fmt2` manda NaN a 0**: a
    video compariva `0,00 €` come se fosse un numero vero. Era una **bugia silenziosa**, vietata
    dal §10.1.
    Ora `Q2s` e `tfrDivS` usano il valore di riserva (`COSTO_COMUNE_DEF`), il risultato torna
    quello giusto, e `r.divNonValidi` fa comparire una **fascia rossa** che nomina la casella da
    rimettere a posto. ⚠️ **Dicitura nuova, scritta da Claude**: prima non c'era nessun avviso.
    - 🔴 **DUE TRAPPOLE NELLA MIA PRIMA STESURA, trovate in esecuzione e chiuse:**
      1. **`divNonValidi` si perdeva quando il periodo si taglia in pezzi.** La somma dei blocchi
         ricostruisce `res` dall'elenco `campi`, che contiene solo importi: la bandierina non c'era
         e **l'avviso non compariva mai** proprio nei casi più frequenti. Ora si porta avanti come
         `J32`.
      2. **La nota a lato scriveva «÷ 0»**, cioè un conto impossibile, mentre l'importo era già
         calcolato col valore di riserva. Ora la nota dice il divisore **davvero usato**.
  - 🧾 **c) Un superminimo scritto «1.500,00» veniva buttato in silenzio.** `addTrasf` leggeva il
    numero con `String(x).replace(",",".")`, che **non capisce il punto delle migliaia**:
    `"1.500,00"` → `"1.500.00"` → **NaN** → `rec.superminimo` non veniva messo, **ma la
    trasformazione si salvava comunque** se c'era almeno il livello. Nessun messaggio.
    Ora si usa **`cNum`**, la stessa funzione delle 35 caselle del Costo orario, e un numero
    illeggibile **ferma** il salvataggio dicendolo. Lo stesso vale per il monte ore.
    ⚠️ **Due diciture nuove, scritte da Claude** (prima non esistevano): «Il monte ore non è un
    numero…» e «Il superminimo non è un numero…», più il controllo sul negativo.
    **Misurato**: scrivendo 1.500,00 nel modulo, la ver135 arrivava al Costo orario con
    **niente**, la ver136 con **«dalle trasformazioni: 1.500,00 €»**.
  - **Provato in esecuzione** (`dif136.cjs` e `dif136b.cjs`, **28 controlli su 28**, zero errori
    di pagina): le tre prove sopra, l'avviso che compare solo col valore a zero e non col valore
    sano, il costo che resta quello del valore di riserva, la nota senza «÷ 0», e la
    **NON REGRESSIONE sui 16 dipendenti veri** (gen→ott 2026: costo e €/h **identici** fra ver135
    e ver136, 16 su 16, zero differenze).
    ⚠️ **La prima stesura della prova aveva 4 «falliti» che erano errori MIEI, non dell'app**: il
    lettore prendeva la riga sbagliata per il rimborso km (pescava l'aiutino del TFR) e i
    selettori del modulo cercavano un `<label>` dove l'etichetta è un `<div>` **fratello**
    dell'`input` — la stessa trappola già incontrata nella ver135 sull'Anagrafica. Corretti negli
    script; la prova del km è stata rifatta **in aritmetica sul costo totale**, che non dipende da
    nessun selettore.
- 🎖️ **GLI SCATTI ALL'ASSUNZIONE SI SCRIVONO IN ANAGRAFICA, E L'AVVISO CHE MANCAVA** (ver135,
  09/11/2026, due richieste di Christian: «è bene che compaia anche in anagrafica e qui si
  compili automaticamente e resti sfondo grigiolino, come per tutte le cose copiate in maniera
  automatica perchè scritte altrove» e, sul nome, «in questo punto fai ricomparire il nome della
  persona dipendente» → sua scelta **«a e b»** e **«sezione del contratto, ma se lo metto
  impediscimi di scriverlo altrove»**). **Nessun calcolo è stato toccato**, verificato in
  esecuzione: stesso costo al centesimo della ver134.
  - **a) La casella «Scatti riconosciuti all'assunzione» è passata in ANAGRAFICA → Contratto**
    (campo `ana.scattiAss`). Nella scheda del **Costo orario** la stessa casella è ora
    **grigia e di sola lettura** (`#f1f5f9`, bordo `#cbd5e1`) e dice «si scrive in **ANAGRAFICA
    → Contratto**»: è il «grigiolino» che Christian ha chiesto per tutto ciò che arriva da
    un'altra scheda. ⚠️ **Nessun dato va perso**: `datiCosto` legge **prima** l'Anagrafica e,
    **solo se è vuota**, continua a usare il vecchio `dp.costo.scattiAss` — e in quel caso la
    nota sotto la casella dice «questo è il vecchio valore della scheda: riscrivilo in
    Anagrafica». Dati nuovi: `d.scattiAssVal` e `d.scattiAssDaAna`.
  - **b) Il nome della persona si ripete dentro la scheda.** Scorrendo il Costo orario il nome in
    cima usciva dallo schermo e non si sapeva più di chi fossero i numeri. Ora compare in cima a
    **ciascuno dei tre blocchi** (*Il contratto*, *La retribuzione*, *Le ore da dichiarare*), in
    piccolo (14px), e in cima al **riquadro del risultato**, grande come l'originale (19px), con
    il quadratino del colore della persona. Funzione `nomeQui(grande)`, dichiarata accanto a
    `cella` e riempita nel render. ⚠️ **Il nome in cima alla scheda NON è stato toccato.**
  - 🟨 **L'avviso che mancava sugli scatti**: un importo scritto a mano nella casella
    *Scatti di anzianità €* **vince sul calcolo e ferma l'aggiornamento automatico** — a febbraio
    2027 non diventerà 103,30, resterà quello scritto — e **spegne il taglio del periodo**
    (`fissoSplit.scatti`). Prima l'aiutino mostrava il conteggio automatico **senza dire che non
    era quello in uso**: una bugia silenziosa. Ora, quando `d.scattiAMano` è vero, compare un
    riquadro giallo che nomina **entrambi** i numeri (quello in uso e quello automatico), dice che
    il valore non cambierà mai da solo e che per riaccendere l'automatico basta **svuotare la
    casella**. Stessa forma dell'avviso del superminimo (ver131). ⚠️ **Dicitura nuova, scritta da
    Claude.** ⚠️ La casella **resta scrivibile e giallina**: è l'avviso, non un blocco.
  - **Provato in esecuzione** (`ver135.cjs`, `ver135d.cjs`, `nome-co.cjs`): la casella in
    Anagrafica c'è ed è scrivibile; quella del Costo orario è grigia e disabilitata; scrivendo
    **4** in Anagrafica il Costo orario mostra 4 e l'aiutino dice «di cui 4 riconosciuti
    all'assunzione»; con l'Anagrafica vuota il vecchio valore della scheda continua a valere e la
    nota lo dice; il nome compare **4 volte** nella scheda; l'avviso giallo compare solo con gli
    scatti scritti a mano e nomina i due numeri. **Zero errori di pagina.**
  - ⚠️ **Resta aperto, e NON è stato toccato**: le altre caselle dell'Anagrafica che riguardano la
    paga — *Importo orario base €*, ***Superminimo €***, ***Scatti di anzianità €***, *Altro
    importo orario €*, *Importo orario totale €*, *Part / Full time*, *Giorni di lavoro nella
    settimana*, *Ruolo / qualifica* — **non sono lette da nessun calcolo**: finiscono in
    `dp.ana.*` e servono solo ai segnaposto della lettera .docx e all'export Excel. È la causa
    del «su del mastro ho messo 0,500 orarie di scatti, ma non ho capito se poi si aggiorna»:
    quel numero non alimenta niente. **Verificato contando le letture nel file: zero.**
    Christian lo ha chiesto come correzione strutturale il 09/11/2026 (direttiva «LA SCHEDA
    ANAGRAFICA È IL MOTORE DEL SISTEMA»): **da fare, con le sue risposte alle domande aperte.**
- 📐 **COMPATTAZIONE: PIU' ROBA A SCHERMO, STESSI COLORI E STESSE ALTEZZE** (ver134, 08/11/2026,
  richiesta di Christian: «REVISIONE GRAFICA COMPLESSIVA DEL GESTIONALE — l'interfaccia attuale
  presenta spaziature eccessive»). Intervento **di solo CSS**: un blocco nuovo in fondo al
  `<style>`, **nessuna riga di JavaScript, nessun attributo HTML, nessuna classe nuova**.
  - 🔑 **TRE SCELTE DI CHRISTIAN, prese con una domanda PRIMA di costruire**, perché la sua
    richiesta conteneva due contraddizioni interne:
    1. **niente verde**: la codifica a colori per provenienza del dato (giallo manuale / verde
       parametro / azzurro formula / bianco incerto) **non è ottenibile dal solo CSS**, perché
       «parametro preassegnato» e «compilazione manuale» nel DOM sono **la stessa casella**.
       Servirebbe un contrassegno nel JavaScript, che il suo stesso vincolo vietava. **Rimandata**
       (sua risposta: «Parte 2 hai fatto bene a non fare»);
    2. **i colori già scelti da lui vincono sempre**: qui **nessun colore è stato toccato**;
    3. **le altezze NON si riducono**: la sua richiesta chiedeva di abbassare anche caselle,
       tendine e pulsanti, ma il §10.6 dice il contrario; **vale il §10.6**, si stringono solo
       gli SPAZI.
  - ⚠️ **Perché il verde non si può fare senza toccare il codice**: non riproporlo come se bastasse
    il CSS. Se un giorno si vorrà davvero, serve il suo permesso per **un solo contrassegno** sulle
    caselle precompilate da un parametro.
  - **Che cosa si stringe**: imbottiture e distanze dei CONTENITORI — testata, linguette, barra
    dello zoom, `.content`, `.toolbar`, `.emp-card`, `.emp-head`, il padding esterno di
    `.grid-wrap`, i riquadri del conguaglio/sostituzioni/note, `.legend`/`.rep-box`, le celle di
    `table.rep`, le finestre — più le spaziature **scritte in riga da React**, agganciate con
    `[style*="..."]` e `!important` (React serializza **con** lo spazio dopo i due punti).
  - **Misurato in esecuzione** a 390 · 768 · 1280 · 1680px, confrontando la ver133 e la ver134
    sullo stesso backup vero:
    | vista | guadagno in altezza |
    |---|--:|
    | **Riepiloghi** | **da −13,2% a −20,4%** |
    | **Tabellone** | **da −7% a −12,1%** |
    | Anagrafica | da −4,3% a −6,8% |
    | Costo orario | da −2,1% a −4,2% |
  - ✅ **Che cosa NON è cambiato, in tutti e 20 i casi misurati**: la **larghezza della pagina**
    (identica, nessuno scorrimento laterale nuovo); la **tabella del mese** (**2282px → 2282px**);
    il numero di **scritte sotto i 12,5px** (identico: 334 nel Tabellone — sono dentro la griglia,
    eccezione dichiarata — e 7 altrove); i **pulsanti ≥40px** (9 su 9); l'**altezza della cella
    delle ore** (34px). **Zero errori di pagina.**
  - 🚫 **Esclusioni**: ogni regola porta `:not(table.cal *):not(.grid-wrap *):not(.co-scroll *)`.
    Dentro la griglia del mese e dentro «Come si divide il periodo» **non si tocca niente**.

- ⚠️ **LE «SETTIMANE DAVVERO LAVORABILI» DICONO CHE NON SERVONO** (ver133, 08/11/2026, domanda
  di Christian: «la questione settimane davvero lavorabili in realtà ci serve? Non calcoliamo
  tutto dalle ore reali da tabellone?» → **Nu\***). **Avviso e nulla più: NESSUN calcolo è stato
  toccato**, verificato in esecuzione (stesso costo al centesimo della ver132).
  - **Ha ragione lui, e il difetto era che l'app non lo diceva.** Le due caselle *Settimane del
    periodo* e *Settimane davvero lavorabili* (ver73) servono alle ore **«Teoriche»** e alle
    simulazioni. Con le ore **dai Riepiloghi** o **a mano** le ore del periodo arrivano da lì, non
    da quella tabellina: le settimane **non contano le ore**. Ma scriverle **spegne due cose**,
    perché sono «valori strutturali scritti a mano»: le **ore in più** tornano a contarsi sul
    **totale del periodo** invece che **mese per mese** (ver117) e il **periodo non si divide più
    in pezzi** (ver84). Quindi non sono innocue, e prima **non c'era nessun avviso**.
  - **A video**: sotto la tabellina delle settimane, **sopra** il pulsante ↺, un riquadro giallo
    che dice che quelle settimane qui non servono, che spengono il conto mese per mese e il
    taglio in pezzi, e che per tornare all'automatico basta premere **↺ Rimetti i valori
    calcolati**. Compare **solo** se almeno una delle due caselle è scritta **e** la fonte delle
    ore **non** è «Teoriche». ⚠️ **Dicitura nuova, scritta da Claude.**
  - ⚠️ **Le caselle restano scrivibili e giallline**, come la «% di ore supplementari» dalla
    ver75 e la «Anni per rivalutazione TFR» dalla ver115: sono **spente nei conti**, non bloccate.
    Non bloccarle senza che Christian lo chieda.
  - 🔴 **QUANTO PESA, misurato sui dati VERI** (backup del 04/11, una persona che ha
    `settLav` scritto a mano, periodo gen→ott 2026): con le settimane scritte il costo è
    **12.456,45 €** e il periodo si divide in **0 pezzi**; premendo ↺ diventa **13.108,55 €** e
    **12 pezzi**. **652,10 € di differenza** su dieci mesi, su una persona sola, per due caselle
    che l'utente credeva innocue. **È la cosa che l'avviso serve a far vedere.**
  - **Provato in esecuzione** (`avv133.cjs`, **18 controlli su 18**, zero errori di pagina):
    la ver132 non mostra l'avviso e la ver133 sì; **costo totale, ore e €/h identici** fra le due
    versioni nello stesso stato; premendo ↺ l'avviso sparisce, il pulsante sparisce, il periodo
    torna a 12 pezzi e **ver132 e ver133 danno lo stesso numero** (13.108,55 €); con le ore
    «Teoriche» l'avviso **non compare** anche se le caselle sono scritte; su una persona senza
    settimane scritte non c'è né avviso né pulsante.
  - **Registro cumulativo rieseguito sulla ver133**: vm-A 21 · vm-B 14 · vm-C 15 · vm-D 7 ·
    formule 9/9 · par 21/21 · ccnl 14 · liq 14 · ferie 11 · ferie-b 10 · tfr 12 · istat 7 ·
    anni 10 · retr 7 · pasqua 8 · dopp 5 · supp-b 24 · avviso 6 · periodo · super 20 ·
    lettera 14 · scatti 11+5 — **25 script, nessuna regressione**.
    ⚠️ **Due «falliti», entrambi attese sbagliate dei MIEI script, non difetti dell'app**, e
    corrette negli script: `ferie133` si aspettava la targhetta «ver131»; `scatti133` si
    aspettava un costo identico alla ver131 su un periodo che **contiene** il mese di
    maturazione — lì la differenza (**14,03 €**) **è** la correzione della ver132 (b).
  - **`scatti133c` ha riconfermato i numeri di Christian** sulla persona con 4 scatti
    riconosciuti: **Gennaio 2026 → Gennaio 2027 con 4 = 82,64 €** e **Febbraio 2027 →
    Dicembre 2027 con 5 = 103,30 €**.

- 🎖️ **GLI SCATTI RICONOSCIUTI ALL'ASSUNZIONE, E IL MESE IN CUI MATURANO** (ver132, 08/11/2026,
  da un caso vero di Christian: «ha **4 scatti** al livello D1 **regalati all'assunzione** e il
  **quinto scatta a febbraio 27**», poi «**Ok 1 e 2**»). Due aggiunte, entrambe sul conteggio
  degli scatti della ver128.
  - **a) Casella nuova «Scatti riconosciuti all'assunzione»** (`dp.costo.scattiAss`, un numero).
    Diventa il **punto di partenza** di `scattiAl`, che da lì continua ad aggiungerne **uno ogni
    24 mesi utili** come già faceva (massimo 5, e un mese tutto «AN» fa slittare la maturazione).
    Gli scatti «regalati» l'app non può indovinarli: glieli si dice una volta e poi va da sola.
    ⚠️ **Compare SOLO a chi è assunto dopo l'inizio dei dati**, cioè esattamente dove **non**
    compare la casella «Scatti già maturati al …» della ver128: delle due se ne vede **sempre una
    sola**, così non si sommano per sbaglio. (Dicitura nuova, scritta da Claude.)
  - **b) Chi è assunto DOPO il giorno 1 comincia a contare dal mese SUCCESSIVO.** Prima il mese
    di assunzione contava intero: per lei (assunta il **07/01/2025**) i 24 mesi si chiudevano a
    fine dicembre 2026 e il quinto scatto partiva da **gennaio** 2027. Ora i 24 mesi si chiudono
    all'**anniversario** (07/01/2027) e lo scatto parte dal mese dopo, **febbraio 2027**: è il
    numero che ha dato Christian.
  - **L'aiutino sotto «Scatti di anzianità €»** aggiunge, quando ce ne sono, «— di cui **4**
    riconosciuti all'assunzione».
  - ⚠️ **L'importo scritto a mano continua a vincere** su tutto, come prima, e continua a
    **spegnere il taglio del periodo** (`fissoSplit.scatti`). La **casella nuova invece NON lo
    spegne**: è un punto di partenza, non un valore fisso, quindi il periodo si taglia ancora al
    mese in cui lo scatto cambia. **Verificato**: con 4 riconosciuti, gennaio 2026 → dicembre
    2027 si divide in **Gennaio 2026→Gennaio 2027 (4 = 82,64 €)** e **Febbraio 2027→Dicembre
    2027 (5 = 103,30 €)**.
  - 🔴 **CONSEGUENZA DA SAPERE della b)**: per chi è assunto **dopo il giorno 1** ogni scatto
    matura **un mese più tardi** di come lo contava la ver131, quindi i costi dei periodi che
    **contengono** quel mese scendono di un mese di scatto. **Misurato sui dati veri**: una
    persona assunta il **16/10/2023**, periodo gen→dic 2025, passa da **13.708,83 €** a
    **13.692,46 €** (**−16,37 €**), perché il suo primo scatto si sposta da ottobre a novembre
    2025. ⚠️ Sui periodi che **non** contengono il mese di maturazione **non cambia un centesimo**.
  - **Provato in esecuzione** (`scatti132.cjs` **11/12**, `scatti132b.cjs` **5/5**,
    `scatti132c.cjs`, zero errori di pagina):
    - **non regressione sui 16 dipendenti veri**, periodo gen→ott 2026: **costi identici** fra
      ver131 e ver132, 16 su 16;
    - la casella nuova compare e quella del pregresso **no**;
    - con **4** scritti: «4 scatti × 20,66 € = **82,64 €** … — di cui 4 riconosciuti
      all'assunzione»; a **gennaio 2027 ancora 4**; a **febbraio 2027 → 5 = 103,30 €**;
    - con la casella **vuota** ver131 e ver132 contano lo **stesso numero** di scatti;
    - chi è assunto il **giorno 1** (01/02/2023) e chi è già al **massimo** (5): **differenza
      0,00 €**;
    - ⚠️ l'unico controllo «fallito» dei 12 era una **mia attesa sbagliata** nello script (mi
      aspettavo costo identico anche su un periodo che contiene il mese di maturazione: lì la
      differenza **è** la correzione chiesta, −14,03 € su quel caso).
  - 📚 **La tabella degli scatti è stata ricontrollata contro il CCNL**, su domanda di Christian
    («torna con le tabelle degli scatti ccnl coop sociali?»): **D1 = 20,66 €/mese**, **massimo 5
    scatti**, **uno ogni biennio**, tabella in vigore dal **01/10/2025** — confermati dall'art. 80
    del CCNL Cooperative sociali e dalla tabella CNEL T151, che riporta anche **D1 minimo
    1.637,57 €** (lo stesso di `MINIMI_CCNL.Ott25`). Confermati pure **A1 11,62 · A2 13,43 ·
    B1 16,27 · D2 23,24 · F2 46,48**. Di C1, C2, C3, D3, E1, E2 e F1 la pagina con la tabella
    completa **non era raggiungibile** dalla rete di questa sessione (host non fra quelli
    consentiti).
  - ✅ **TABELLA CHIUSA: Christian l'ha mandata per intero l'08/11/2026** («questi sono i valori
    degli scatti che devi memorizzare per livello») e **tutti e 13 i valori coincidono** con
    `SCATTI_CCNL` già nel codice, **verificato uno per uno**:
    **A1 11,62 · A2 13,43 · B1 16,27 · C1 18,59 · C2 19,63 · C3 20,66 · D1 20,66 · D2 23,24 ·
    D3 26,86 · E1 26,86 · E2 31,50 · F1 39,51 · F2 46,48**. Confermato anche che **C3 e D1 hanno
    lo stesso scatto** e **D3 ed E1** pure, come già scritto per i tabellari. **Nessun valore è
    stato cambiato**: la tabella era già giusta.
    ⚠️ Resta da verificare sul testo ufficiale la fonte secondaria che parla di **61,98 €** per
    il D1 col rinnovo 2025-2028 (= 3 × 20,66): **non toccare niente** prima di averlo visto.
- 💠 **IL SUPERMINIMO SEGUE LE TRASFORMAZIONI, E I COLORI SONO 24** (ver131, 07/11/2026, due
  richieste di Christian: «le trasformazioni potrebbero riguardare anche — per i dipendenti —
  aggiunta di superminimo, quindi va considerata e calcolata anche questa cosa» e «i colori
  scheda sono pochi, va messa palette … ok 24, no verde brillante»).
  - 🔴 **Il difetto, misurato**: una trasformazione portava **livello**, **ore settimanali** e la
    spunta «a tempo indeterminato». Il **superminimo no**: era un numero solo nella scheda del
    Costo orario, **senza data**, applicato a **tutti** i mesi del periodo. Sui dati veri, periodo
    gen→ott 2026: un superminimo di **100 €/mese** pesa **806,05 €** (costo 14.427,24 →
    15.233,29 €, €/h 20,41 → 21,55). Se fosse partito il **01/06**, i mesi veri sarebbero 5 su
    10: l'app ne addebitava **806,05 € invece di ~403 €**, cioè **403 € di troppo** — e a catena
    su 13ª, 14ª, festività, ferie liquidate, TFR e contributi.
  - **Come è fatto**, con lo stesso meccanismo già collaudato per il livello (ver82/ver84):
    - `valoriAt` tiene ora anche **`superm`**: parte da **ZERO** e lo cambiano le trasformazioni
      che lo nominano. ⚠️ Parte da zero di proposito, così **chi ha un superminimo scritto nella
      casella del Costo orario non cambia di un centesimo** (la casella vince, come prima);
    - **`superminimoAt(dp,y,m)`** e **`superminimoPeriodo(dp,pairs)`** (gemella di
      `livelloPeriodo`: il valore dell'ultimo mese in cui il contratto è in piedi) → è il valore
      **automatico** della casella;
    - **`firmaMese`** lo guarda, quindi **il periodo si taglia da solo** alla data in cui il
      superminimo cambia; ogni pezzo usa il suo (`superminimo: supermAMano ? o.superminimo : vv.superm`);
    - `fissoSplit.superm` = vero quando la casella è scritta a mano: allora **non fa tagliare**,
      perché quel valore vale uguale dappertutto.
  - **Nel modulo «+ Aggiungi trasformazione»** c'è la casella nuova **«Nuovo superminimo €»**
    (dicitura nuova, scritta da Claude). ⚠️ **Lo ZERO è un valore valido**: serve a **togliere**
    un superminimo che c'era prima, quindi si guarda se la casella è *scritta*, non se il numero
    è maggiore di zero. L'aiutino dice che è **al mese, a tempo pieno**, come il minimo tabellare.
  - 🟨 **PUNTO 4 chiesto da Christian** («andrebbe messa un'indicazione sulla scheda che mi faccia
    sempre capire che l'indicazione mia a mano vince sul resto, allertandomi»): sotto la casella
    *Superminimo €* del Costo orario compare un **avviso giallo** che dice «**Il superminimo è
    scritto a mano: vince su tutto il resto**», quale numero sta usando l'app, quale risulterebbe
    dalle trasformazioni, che **il periodo non si taglia più** alla data del cambio, e che per
    tornare all'automatico basta **svuotare la casella**.
    ⚠️ A differenza dell'avviso dei mesi (ver108) **compare SEMPRE che la casella è scritta**,
    anche quando il numero coincide con quello automatico: è il «sempre» che ha chiesto lui.
  - 🏷️ **La LETTERA di trasformazione nomina il superminimo** — dicitura **autorizzata da
    Christian** («1-2-3-5 ok», e il 5 era proprio questo). `autoContenuto` scrive
    «riconoscimento di un superminimo mensile di 100,00 euro», «variazione del superminimo
    mensile da 100,00 a 250,00 euro» oppure «cessazione del superminimo mensile di 100,00 euro»,
    e si unisce alle frasi che c'erano già («passaggio dal livello D1 al livello D2 **e**
    riconoscimento di un superminimo…»). ⚠️ Le frasi di livello, ore e tempo indeterminato
    **sono rimaste identiche**.
  - 🎨 **PALETTE da 10 a 24 colori.** Erano **dieci** e il colore si assegna con
    `PALETTE[numero % 10]`: con 16 dipendenti **dall'undicesimo si ricominciava da capo**.
    Misurato sul backup del 04/11: **13 colori distinti su 16 persone**, tre colori usati da
    **due persone ciascuno**, e **sei tinte che Christian si era messo da sé** e che non stavano
    nella palette (quindi per quelle persone **nessun quadratino risultava selezionato**).
    - i **primi dieci restano al loro posto, nello stesso ordine**: **nessuno cambia colore**;
    - poi i **sei suoi** (`#5deeb7 #d494ff #88adf7 #a4cb3a #dbd51a #4ddbb5`): ora si vedono come
      scelti;
    - poi **otto nuovi**, chiari e spenti, **nessun verde brillante** (sua richiesta):
      `#FFB38A #FF9AA2 #D7A86E #A3C4F3 #7FD1D1 #BFD8B8 #E6C3E8 #C9CBA3`.
    - ⚠️ Il **`#CCFF66`** in seconda posizione **è** il verde brillante, ma c'era già ed **è in
      uso da due persone**: lasciato per non cambiare il loro colore. Se Christian lo vuole
      togliere va deciso con lui, perché cambia il colore di quelle due.
    - **Provato**: con **20 persone senza colore, 20 colori distinti** su 20 schede.
  - ⚠️ **NESSUN altro calcolo è stato toccato.** Verificato sui dati veri: **ver130 e ver131
    danno gli stessi numeri** (componenti 1.727,83 · costo 14.427,24 € · 20,41 €/h · 2 pezzi).
  - **Provato in esecuzione** (`super131.cjs` **20/20**, `lettera131.cjs` **14/14**, zero errori
    di pagina e di console):
    - 24 quadratini, i primi dieci nell'ordine di prima, i sei suoi presenti, gli otto nuovi
      quelli previsti, 20 colori distinti su 20 persone;
    - superminimo **100 € dal 01/06/2026**, periodo gen→ott: il periodo passa da **2 a 3 pezzi**
      (Gennaio→Maggio senza · **Giugno** con · Luglio→Ottobre con) e il costo è **14.113,92 €**,
      cioè **in mezzo** fra i 13.699,70 € di «niente» e i 14.505,75 € di «100 su tutto», e
      vicinissimo alla metà teorica (14.102,73 €);
    - l'aiutino sotto la casella dice «dalle trasformazioni: 100,00 €»;
    - scrivendo **250** a mano: vince il 250 (componenti 1.887,57), l'avviso nomina **sia il 250
      sia il 100**, dice che il periodo non si taglia più, e i pezzi tornano quelli della sola
      proroga;
    - una seconda trasformazione con **0** toglie il superminimo (**4 pezzi**) e il costo scende;
    - la lettera: sette frasi provate, comprese quelle vecchie rimaste identiche;
    - `valoriAt` mese per mese: 0 a gennaio e febbraio, **100 da marzo a luglio**, **0 da agosto**.
  - ⚠️ **`lettera131.cjs` non riscrive le funzioni**: le **estrae testualmente** da `index.html`
    (`trasfOrder`, `valoriAt`, `autoContenuto`) e le esegue in node. `autoContenuto` serve solo a
    riempire il segnaposto del .docx, quindi dalla pagina non è raggiungibile.
  - ⚠️ **Il .docx vero della lettera NON è stato generato**: serve il modello Word di Christian.
    La **frase** è verificata, il **documento** no.

- 🔎 **COLLAUDO INTEGRALE E LEGGIBILITÀ: NIENTE SOTTO I 12,5px FUORI DALLE GRIGLIE**
  (ver130, 07/11/2026, dal collaudo completo chiesto da Christian: «AUDIT COMPLETO, VERIFICA E
  COLLAUDO DELLA WEBAPP … ogni problema individuato deve essere corretto»).
  - **Il difetto, PREESISTENTE e misurato**: la regola permanente del §10.6 dice che nessuna
    scritta scende sotto i **12,5px** fuori dalle griglie dense. Misurando a **390 · 768 · 1024 ·
    1280 · 1680px** su tutte e cinque le viste risultavano **209** scritte a 11-12px nel
    **Tabellone**, **79** nell'**Anagrafica** (53 sono etichette a 12px), **18** nei
    **Riepiloghi** (fra cui **intestazioni a 10px**) e 7-9 nelle altre due. ⚠️ **Identiche nella
    ver128 e nella ver126 pubblicata**: non le ha introdotte la ver129.
  - **La correzione**: un blocco CSS in fondo al `<style>` che porta a 12,5px `.pill`,
    `.legend-code`, `.cong-chip`, `.foot-teor`, `.sost-head`, `.tot-teor`, `.edit-mini`,
    `.btn-mini`, `.lock-badge`, `.lock-info`, `.badge`, `.azzera-btn`, `.sub`, le etichette
    dell'anagrafica e le intestazioni dei Riepiloghi.
  - ⚠️ **ESCLUSE di proposito**: tutto ciò che sta **dentro la griglia del mese** (`table.cal`,
    `.grid-wrap`), dentro «Come si divide il periodo» (`.co-scroll`) e dentro le tabelle dense —
    alzare le misure lì allarga la tabella, ed è **vietato** (provato il 31/10 su Fogli ore).
    Restano a 11-12px anche la **targhetta della revisione**, l'avviso **«Modalità LOCALE»** e la
    barra **«Zoom vista»**: eccezioni già dichiarate alla ver76.
  - ⚠️ **Cambia solo la MISURA**: nessuna dicitura, nessun colore, nessun calcolo, nessun dato.
  - 🚨 **È una modifica VISIVA sul Tabellone, la schermata che Christian usa più di tutte, e
    NON gli era stata chiesta con un Nu\***: sta solo sul ramo di lavoro, `main` non la porta.
    Se non gli piace si toglie cancellando quel blocco CSS.

- 🧪 **COLLAUDO INTEGRALE DEL 07/11/2026 — che cosa è stato davvero provato.**
  Richiesta di Christian: provare in esecuzione ogni funzione, i dati, gli errori, la grafica,
  le regressioni e i flussi completi, correggendo quello che si trova. Script nella cartella di
  lavoro della sessione: `audit-R.cjs`, `audit-D.cjs`/`audit-D2.cjs`/`audit-D3.cjs`,
  `audit-E.cjs`/`audit-E2.cjs`, `audit-F.cjs`/`audit-F2.cjs`, `audit-G.cjs`, `audit-R130.cjs`.
  - **Grafica e responsive (76/76)**: 5 larghezze × 5 viste. **La pagina non scorre mai di lato**
    e la larghezza è **identica alla ver128** in tutti i 25 casi. Le tabelle dei **Riepiloghi**
    a 390px stanno in `.rep-scroll` (visibile 326px su 1073): **scorrono, non sono tagliate** —
    verificato arrivando in fondo con `scrollLeft`.
  - **Dati (21/24 + 4/5, i falliti erano difetti del test)**: niente salvataggio automatico (il
    dato NON è in memoria prima del 💾); 💾 conferma «Salvato in locale» e scrive davvero; dopo
    la **ricarica** il dato è ancora lì; il **Backup JSON** si scarica con `version` e 16
    dipendenti; l'import **corrotto** è rifiutato con avviso e **non tocca i dati**; l'import di
    un json **senza `dipendenti`** è rifiutato («struttura non valida» → stesso avviso);
    l'import valido entra, si vede, e **«Annulla import» riporta tutto a prima**; prima di ogni
    import l'app **scarica da sé un backup di sicurezza** (verificato: 2 file).
  - **Cancellazioni**: `🗑 Svuota mese` e `🗑` del dipendente aprono una **conferma che spiega
    cosa viene cancellato** (quella del dipendente avverte di usare la cessazione); annullando
    **non si perde niente** (11 → 11 schede).
  - **Casi limite (12/12)**: `999` e i **negativi** non entrano; `CIAO` e un **incolla** di una
    frase non scrivono nulla; `ferie` → **FERIE**; `FER` a metà viene tolto; `MALATTIA` battuto
    si ferma su **MAL**; una cella si **svuota** con la tastiera; **doppio clic** su 💾 innocuo;
    mese vuoto, **anno senza dati** (tutti zeri, non numeri inventati), lettere nell'anno,
    **elenco dipendenti vuoto** (tutte le viste si aprono).
  - **Flusso completo sui dati veri (14/16)**: il **TOT calcolato di tutte le 11 schede è la
    somma esatta** delle celle; il TOT teorico è sempre ≥ del calcolato; scrivendo 4 ore il TOT
    cresce di 4,00; il **numerino erosivo** abbassa TOT teorico (131,058 → 127,885) **e** il
    Tetto annuo (215,616 → 212,443) e ricliccando torna; nel Costo orario **€/h = costo ÷ ore**
    ricalcolato a mano (14.427,24 ÷ 710,75 = 20,2986 → **20,30**); l'export Excel scarica un
    **vero .xlsx** (firma `504b`, 25 KB); nella Query *Totale su intervallo* senza date **lo
    dice** invece di mostrare una tabella muta, con le date dà 16 righe e il totale, e segnala
    l'**intervallo rovesciato**; il Report PDF apre la finestra e il codice gira.
  - 🔴 **Non regressione numerica (4/4), la prova più forte**: sul backup vero, **ver128 e
    ver129 danno costo, ore, €/h e mesi IDENTICI** per **tutte e 16 le persone** su **tre
    periodi** (gen→ott, gen→giu, set→ott 2026). Il Costo orario non è stato toccato.
  - **Registro completo rieseguito sulla ver129**: vm-A 21 · vm-B 14 · vm-C 15 · vm-D 7 ·
    par 60 · liq 14 · ccnl 14 · pasqua 8 · retr 7 · supp 24 · dopp 5 · avviso 6 · istat 7 ·
    anni 10 · tfr 12 · periodo · formule · ferie 11 · ferie-b 10 — **tutti superati**.
  - ✅ **Comportamenti che SEMBRAVANO difetti e invece sono voluti** (verificati nel codice):
    il riquadro «Ore in più / in meno» **non compare su un mese non compilato**
    (`if (!recHasData(rec)) return null`); una cella **non si svuota** se si entra e si esce
    senza toccarla (guardia `iniz` della ver102, contro le cancellazioni accidentali); i moduli
    *Totale su intervallo* e *Chi era in forza* partono vuoti ma **lo spiegano**.
  - ⚠️ **NON verificabile da qui, e lo dico**: il **disegno vero del Report PDF** (jsPDF non è
    raggiungibile dal contenitore: le prove girano con un finto jsPDF che però **esegue
    davvero** `didParseCell`/`didDrawCell`) e il **collegamento a Firebase** (le prove girano in
    modalità locale con PIN, `FB_READY=false`). Restano da guardare su un Report vero e
    sull'app pubblicata.

- 🏖️ **UN SOLO MOTORE DELLE FERIE: 26 + 4 = 30 GIORNATE** (ver129, 06/11/2026, difetto
  **trovato da Christian**: «non torna il calcolo che fai per attribuzione ferie, sto guardando
  il 2026»). Aveva ragione: nell'app c'erano **due motori diversi**, e sul 2026 non potevano
  dare lo stesso numero.
  | | **A — «Ferie da smaltire»** (fascia rossa di aprile + Query personale) | **B — Costo orario** (`ferieBilancio`, ver120/125/127) |
  |---|---|---|
  | maturate | **26** gg/anno = 2,1666/mese | **30** gg/anno = 2,50/mese |
  | mesi | mesi in forza (prova al giorno 15), **12 d'ufficio senza data di assunzione**, mesi tutti «AN» **contati** | mesi di **rateo** (≥15 gg) **meno** i mesi tutti «AN» |
  | godute | **solo celle FERIE** | **FERIE + EXF** + permessi orari EXF |
  - 🔑 **La regola, data da Christian il 06/11/2026**: «**exf e permessi ex festività sono la
    stessa cosa e possono essere presi in ore o giorni: sono 4 gg annui e si sommano a 26 gg di
    ferie annui**» → **30 giornate l'anno = 2,50 al mese**, ed è la stessa cosa che già diceva
    il 06/11 sui ROL («tutto insieme a 30 gg annui»).
  - **Cosa è cambiato**, nel solo motore A (`ferieGodute`, `ferieMaturato`, `ferieResiduo`):
    - **le giornate non sono più scritte nel codice**: `ferieGGAnno(state)` le prende dai
      **valori comuni** (`ferie` + `altriPermessi` = 26 + 4), così se si cambia quel numero si
      muove tutta l'app. `FERIE_GG_ANNO_DEF = 30` è solo il valore di riserva;
    - **godute = celle FERIE + celle EXF + permessi ORARI di tipo EXF**, questi ultimi
      convertiti in giornate con `quotaGiorno` del mese. ⚠️ Serve perché le ex festività **si
      possono prendere a ore** (precisato da Christian nello stesso scambio);
    - **`mesiFerieAnno`**: contano i mesi **che hanno dati**, con **almeno 15 giorni** di
      contratto (`meseConta`, la stessa funzione del Costo orario) e **non tutti «AN»**
      (`meseTuttoAN`: un mese non pagato non matura ratei).
  - ⚠️ **I mesi si contano su quelli CON DATI** perché qui **si può scegliere solo l'anno**, non
    un intervallo di mesi (osservazione di Christian): su un anno ancora in corso i 12 mesi
    d'ufficio gonfiavano il debito di 2,50 giornate per ogni mese non ancora compilato.
  - 🔴 **Quanto sbagliava**, sui dati veri (backup del 04/11, celle fino a ottobre 2026) —
    maturate − godute = residuo:
    | | ver128 | **ver129** |
    |---|--:|--:|
    | 2026, chi ha 9 mesi compilati | 26,00 − 14 = **12,00** | 22,50 − 14 = **8,50** |
    | 2026, chi non ha **nessun** mese compilato (4 persone senza data di assunzione) | 26,00 − 0 = **26,00** di debito **inventato** | **0,00** |
    | 2025 (anno chiuso), chi ha lavorato 12 mesi | 26,00 − 13 = 13,00 | **30,00** − 13 = **17,00** |
    | 2026, chi ha 30 celle EXF | 26,00 − **16** = 10,00 | 22,50 − **46** = 0,00 (in credito) |
    ⚠️ Sull'**anno chiuso il residuo SALE** per quasi tutti, perché le maturate passano da 26 a
    30. ⚠️ Sull'**anno in corso SCENDE**, perché i mesi non compilati non maturano più.
  - 🧾 **Un caso vero che si è chiuso da sé**: una persona aveva **30 celle EXF** nel 2026
    (2 a maggio, 7 a luglio, **21 ad agosto**), cioè ferie estive battute col codice EXF. Con il
    motore unico **il totale non cambia** (FERIE ed EXF si sommano): 46 giornate godute, contro
    21,00 di residuo 2025 + 22,50 maturate nel 2026 = 43,50. **Sta smaltendo l'arretrato, è
    quasi in pari**: il «−23,50» era solo l'effetto di guardare un anno per volta.
  - 🏷️ **Due diciture cambiate, ENTRAMBE autorizzate da Christian** («sul 2 ti dico che è
    giusto, divengono 30 annui (= 2,5 mese) se sommiamo le ex festività»): la riga di
    spiegazione sopra la tabella e il sottotitolo dell'**Excel** dicevano «26 GG annui = 2,1666
    GG/mese», che sarebbe diventato falso. Ora dicono «30 GG annui (26 ferie + 4 ex festività) =
    2,50 GG/mese riproporzionati sui mesi in forza che hanno dati», e nominano EXF e le ore.
    ⚠️ **Nessun altro testo è stato toccato**: la fascia rossa di aprile e le intestazioni delle
    colonne sono quelle di prima.
  - **Una colonna formattata**: nella tabella e nell'Excel le **godute** passano da numero intero
    a `fmt2`/`R2(…,3)`, perché con le ex festività prese **a ore** possono avere i decimali.
  - ⚠️ **Il Costo orario NON è stato toccato**: `ferieBilancio`, l'avviso giallo della ver120 e
    la liquidazione della ver125/127 sono **identici**. È il motore vecchio che è stato portato
    sul nuovo, non il contrario.
  - ⚠️ **A e B possono ancora dare maturate diverse, ed è voluto**: A guarda **l'anno civile** e
    conta i mesi **registrati**, B guarda **il periodo che scegli** e conta i mesi di **rateo**
    (anche quelli non ancora compilati). Su un anno chiuso e completo coincidono. Le **godute**
    invece sono ora **sempre le stesse** — verificato in esecuzione: 22,00 e 22,00.
  - **Provato in esecuzione** (`ferie129.cjs` **11/11**, `ferie129b.cjs` **10/10**, zero errori
    di pagina): la targhetta dice ver129; le 16 righe della tabella ci sono in entrambe le
    versioni; 2025 maturate 26,00 → 30,00 e residuo 13,00 → 17,00; una cella EXF che prima non
    contava ora conta (godute 18 → 19); chi non ha la data di assunzione passa da 26,00 maturate
    d'ufficio a 7,50 sui 3 mesi con dati; chi non ha nessun mese compilato passa da 26,00 di
    debito a 0,00; le maturate del 2026 scendono a 22,50 sui 9 mesi compilati; le 30 celle EXF
    portano le godute da 16 a 46; la nota a video dice 30 e 2,50 e nomina le ore; la **fascia di
    aprile** passa da «maturate 13,00 − godute 4,00» a «maturate 15,00 − godute 5,00»; un
    **permesso orario EXF da 4,01 h** diventa **2,00 giornate** godute (nella ver128 era
    ignorato) e il residuo scende esattamente della stessa quantità; e il **Costo orario dà le
    stesse godute**.
  - 🟠 **Due incoerenze nei DATI, segnalate a Christian e NON corrette dal codice**: una persona
    ha ore scritte in un mese in cui, secondo le date della scheda, il contratto non è in piedi
    (quel mese non matura e non si vede); un'altra ha dati su 10 mesi del 2025 ma risulta assunta
    da 4. Si sistemano a mano nelle date della scheda — **lui ha detto che lo fa lui**.

- 📊 **IL CCNL HA TRE TRANCHE E GLI SCATTI SI CONTANO DA SOLI** (ver128, 06/11/2026).
  Christian: «su periodi lunghi potrebbe essere cambiato l'importo da corrispondere, per esempio
  per ccnl rinnovato» → poi ha mandato la tabella ufficiale **AUMENTI RETRIBUTIVI** e quella
  degli **scatti**, con «produci lavoro con tabellari e scatti», «**scatti sono fissi**» e
  «nessun arretrato / una tantum per i mesi fra la decorrenza e la firma».
  - **`MINIMI_CCNL` ha ora TRE tabelle** — **Feb24 · Ott24 · Ott25** — e **tutti i 13 livelli**
    (A1, A2, B1, C1, C2, C3, D1, D2, D3, E1, E2, F1, F2). Prima erano **due** tabelle e **sei**
    livelli. ⚠️ **Due valori erano sbagliati di un centesimo** e sono stati corretti sulla
    tabella ufficiale: **B1 Ott25** 1.436,78 → **1.436,79** · **E1 Ott25** 1.839,16 →
    **1.839,15**. Gli altri dieci coincidevano.
    ⚠️ **C3 e D1 hanno lo stesso tabellare**, e così **D3 ed E1**: è scritto così nel CCNL.
  - **`MINIMI_DAL`** (feb 2024 · ott 2024 · ott 2025) e **`tabellaAl(y, m)`**: il minimo si prende
    **mese per mese**. ⚠️ Prima del 02/2024 l'app non ha la tabella vecchia e usa la Feb24: oggi
    non capita, i dati partono dal 2025.
  - **`SCATTI_CCNL`** (valori mensili a **tempo pieno**, per livello), **`SCATTI_MAX` = 5** e
    **`SCATTI_MESI` = 24**. **`scattiAl(state, dp, y, m, prec)`** conta i **mesi utili
    dall'assunzione** fino al mese precedente: un **mese tutto «AN» non è utile** e fa slittare la
    maturazione (regola di Christian), riconosciuto con **`meseTuttoAN`**, la funzione della
    ver112. `n = min(5, floor(utili / 24))`.
  - 🧩 **`firmaMese` guarda anche la tabella e il numero di scatti**, quindi il periodo **si
    taglia da solo** al rinnovo e a ogni scatto, col meccanismo della ver84. `firmaMese` e
    `blocchiPeriodo` prendono ora **`state`** come primo parametro e un oggetto **`fisso`**
    (`{tab, scatti, prec}`): le dimensioni **scritte a mano non fanno più tagliare**, perché lì il
    valore è uguale dappertutto. Nel riquadro «Come si divide il periodo» ci sono due colonne
    nuove, **Tab.** e **Scatti**.
  - **Le tendine hanno «automatica (per data)» in cima**, ed è il **predefinito**
    (`COSTO_COMUNE_DEF.tabella` da `"Ott25"` a **`"auto"`**). Forzandone una, vale su tutto il
    periodo e l'aiutino lo dice. ⚠️ **Se nei valori comuni c'è già un `tabella` salvato prevale
    quello**: va rimesso su «automatica» a mano — stesso meccanismo dell'ISTAT in ver116.
  - **La casella «Scatti di anzianità €» si compila da sola** e l'aiutino dice il conto per
    esteso: «5 scatti × 20,66 € = 103,30 € (uno ogni 24 mesi utili, massimo 5)». Scrivendo un
    importo a mano vince quello, come prima.
  - **Casella nuova «Scatti già maturati al 31/12/2024»** (`dp.costo.scattiPrec`), chiesta da
    Christian: «metti una casella come hai fatto per le ferie». Compare **solo** per chi è stato
    assunto **prima** dell'inizio dei dati, e la data la scrive l'app. Da lì in poi conta i mesi
    utili veri e aggiunge uno scatto ogni 24. ⚠️ **Limite dichiarato**: a quella data non si sa a
    che punto fosse il biennio in corso, quindi il prossimo scatto può arrivare fino a 23 mesi
    più tardi del vero; lasciando la casella **vuota** l'app stima da sé contando tutti i mesi
    dall'assunzione (nessun mese AN prima dei dati) e quel problema non c'è.
  - 🔴 **VERIFICA SUI DATI VERI, ed è la cosa più forte**: Christian aveva detto quali quattro
    persone hanno gli scatti. Contando da sola sul backup del 04/11, l'app ne trova **tre delle
    quattro** (5 scatti su 132 mesi · 1 su 46 · 1 su 38) e **nessuno in più**. ⚠️ **La quarta non
    torna**: assunta il 07/01/2025, a dicembre 2026 ha **23 mesi** e il primo scatto le
    maturerebbe a **gennaio 2027**. **Da chiarire con Christian** (anzianità riconosciuta da
    prima? data sbagliata?).
  - **Misurato in esecuzione** (D1 30 h/sett., assunta 01/03/2025, periodo **marzo 2025 →
    novembre 2026**, a cavallo del rinnovo):
    | | costo totale | €/h |
    |---|--:|--:|
    | ver127 (tabella unica Ott25) | 51.872,07 € | 16,25 |
    | **ver128** (Ott24 fino a settembre 2025, poi Ott25) | **51.546,57 €** | **16,15** |
    **−325,50 €**, cioè esattamente la stima fatta prima di costruire. Il periodo si divide in
    **Marzo→Settembre 2025 (Ott24)** e **Ottobre 2025→Novembre 2026 (Ott25)**.
    ⚠️ **Sui periodi dentro un solo CCNL non cambia un centesimo.**
  - ⚠️ **Gli scatti fanno SALIRE il costo di chi ha anzianità**: 5 scatti valgono **103,30 €/mese**
    a tempo pieno su un D1, cioè **978,63 €/anno** su un part-time a 30 h/sett. Sui dati veri
    **15 dipendenti su 16 avevano gli scatti a zero**: non era un valore giusto, era un valore
    **mancante**.
  - **Provato in esecuzione** (`ccnl128.cjs`), **14 controlli su 14**, zero errori di pagina: la
    tendina dice «automatica»; il periodo si taglia al rinnovo e i due pezzi usano Ott24 e Ott25;
    2 scatti a 69 mesi e 5 (il massimo) con molta anzianità; nessuna casella pregressa per chi è
    assunto dopo l'inizio dei dati; 12 mesi tutti AN fanno scendere lo scatto da 1 a 0; la
    casella pregressa cambia il conto; forzando Ott24 il mensile diventa 1.267,89 €.
  - 🏷️ **L'etichetta delle ferie dice ora la data** (richiesta di Christian: «devi dirmi entro
    che data, così capisco»): non più «Giornate di ferie residue da anni precedenti» ma
    **«Giornate di ferie residue al 31/12/2024»**, con la data calcolata dall'app.
  - 🔴 **REGOLA 10.1 APPLICATA ANCHE A QUESTO FILE** (06/11/2026): scrivendo questa scheda il
    controllo automatico ha **bloccato** un testo che conteneva **cognomi di dipendenti**. Ha
    fatto bene: `CLAUDE.md` sta in un **repository pubblico**, esattamente come `index.html`.
    Erano già presenti **tre cognomi** (schede ver82, ver111 e ver124), ora sostituiti con «una
    dipendente». ⚠️ **Da qui in avanti: nessun nome di persona reale in CLAUDE.md, in master.md
    e in qualunque file del repository.** I casi veri si descrivono senza nome.
    ⚠️ **Toglierli ora non li toglie dai commit vecchi**: restano leggibili nella storia.

- 📒 **IL SALDO FERIE SI CONTA DALL'ASSUNZIONE, NON DAL PERIODO SCELTO** (ver127, 06/11/2026).
  Christian, guardando la casella della ver125: «quindi perché farmi inserire per tutti le ferie
  residue? **lo sai da te**». Aveva ragione.
  - **Il difetto**: `ferieBilancio` contava maturate e godute **solo dentro il periodo
    selezionato**. Chiedendo il costo su gen→nov 2026, tutto il saldo del 2025 spariva, e per
    rimetterlo dentro bisognava scriverlo a mano — anche per le persone di cui l'app ha la
    storia completa. **Il saldo ferie non è una cosa del periodo: è un conto che corre
    dall'assunzione.**
  - **Funzioni nuove** (accanto a `cessaNelPeriodo`): **`primoMeseDati(state)`** (il mese più
    vecchio presente in `state.dati`) e **`pairsSaldoFerie(state, dp, cessYmd)`**, che torna i
    mesi **dall'assunzione — o dal primo mese che l'app ha, se l'assunzione è precedente — fino
    alla cessazione**, più la bandierina `dalPrimoDato`.
  - **La casella compare SOLO dove serve**: se l'assunzione è precedente al primo mese dei dati
    (o manca). Per tutti gli altri **non si vede proprio**, e la nota a lato della voce lo dice:
    «niente da aggiungere: l'app ha tutta la storia dall'assunzione».
  - **L'aiutino dice da sé la data**: «il residuo al **31/12/2024**: prima di lì l'app non ha
    dati. Lo trovi nel riquadro RATEI di un cedolino SENZA liquidazione». ⚠️ Con il saldo
    ancorato all'assunzione quella data è **fissa**, quindi **non serve una casella dell'anno**
    come per il fondo TFR: la domanda si è sciolta da sé.
  - 🟠 **Se manca la data di assunzione**, riquadro **arancione**: dice da quale mese ha contato
    e che le giornate liquidate possono risultare **meno del vero**. ⚠️ Sui dati veri di
    Christian sono **4 persone su 16**, e **tutte e quattro hanno una cessazione scritta**.
  - **Misurato sui dati veri** (backup del 04/11, `dati` da **2025-01**): dei 16 dipendenti,
    **9** sono assunti dopo l'inizio dei dati (casella non necessaria), **3** prima (serve il
    residuo al 31/12/2024), **4** senza data di assunzione.
  - 🔴 **Quanto sbagliava la ver126** — stessa persona, assunta 01/03/2025, cessata 30/11/2026,
    chiedendo il costo su **gen→nov 2026**:
    | | giornate liquidate | voce | €/h |
    |---|--:|--:|--:|
    | ver126 (solo il periodo) | 27,50 | 1.367,40 € | 17,26 |
    | **ver127** (dall'assunzione) | **52,50** | **2.610,50 €** | **18,27** |
    Mancava **la metà** del saldo. ⚠️ La ver126 **non è mai stata pubblicata con questo difetto
    visibile**: è stata su `main` poche ore.
  - ✅ **Il periodo non cambia più il saldo**: provato, gen26→nov26 e gen25→nov26 danno le
    **stesse** giornate (2.610,50 € in entrambi).
  - ⚠️ **Dove finisce la liquidazione, e perché NON va usata su un mese solo** (domanda di
    Christian: «se ti chiedo il costo di un mese specifico mi tiri dentro tutte le ferie non
    godute prima?»). La voce scatta **solo se la cessazione cade nel periodo scelto**. Misurato,
    stessa persona:
    | periodo chiesto | costo | €/h | liquidazione |
    |---|--:|--:|---|
    | **solo novembre 2026** (mese della cessazione) | 6.227,82 € | **41,52** | 2.610,50 € |
    | **solo marzo 2026** (mese qualsiasi) | 2.680,41 € | **17,18** | **nessuna** |
    | gennaio → novembre 2026 | 30.578,48 € | 18,27 | 2.610,50 € |
    | **tutto il rapporto** (mar 2025 → nov 2026) | 55.393,65 € | **17,35** | 2.610,50 € |
    Sono **gli stessi 2.610,50 €**: spalmati su tutto il rapporto pesano **17 centesimi
    all'ora**, schiacciati su un mese ne pesano **24,34**. **Il €/h del mese di cessazione non
    si usa per rendicontare**: il numero vero è su tutto il rapporto.
  - **Provato in esecuzione** (`liq127.cjs`), **14 controlli su 14**, zero errori di pagina:
    casella assente per chi è assunto dopo l'inizio dei dati e saldo che parte dal mese di
    assunzione; casella presente con la data giusta per chi è entrato prima; avviso arancione
    senza data di assunzione; stesse giornate con due periodi diversi; nessuna voce e nessuna
    casella senza cessazione.

- 🧮 **LE FERIE NON GODUTE LIQUIDATE STANNO NELLA BASE TFR** (ver126, 06/11/2026). Christian
  aveva mandato i cedolini **proprio per questo**: «ti ho fatto vedere il cedolino perché non
  capivo se ferie e permessi non goduti fossero imponibili per il TFR».
  - **In ver125 erano FUORI**, messe lì per coerenza con la gemella *Festività non godute*
    (`J12`). ⚠️ **Era una scelta, non una prova**: dai primi due cedolini la quota TFR non si
    ricostruiva sotto nessuna ipotesi, ed era stato detto.
  - 🔑 **Il terzo cedolino l'ha chiusa**: un mese **normale** della **stessa persona**, subito
    prima della cessazione. Il confronto fra due mesi di fila toglie di mezzo tutto quello che
    non si vede (fondo pensione, trattamento della 14ª, arrotondamenti):
    | | maggio 2025 | giugno 2025 | Δ |
    |---|--:|--:|--:|
    | competenze imponibili | 960,93 € | 1.310,86 € | **+349,93 €** |
    | di cui **ferie e permessi NON goduti** | 0 | **315,00 €** | +315,00 |
    | **quota TFR del mese** | **64,15 €** | **85,36 €** | **+21,21 €** |
    - se le 315,00 fossero **FUORI** dalla base, la quota sarebbe salita di **~2,4 €**;
    - se sono **DENTRO**, di **~24,2 €**;
    - è salita di **21,21 €**. ✅ **Sono dentro**, senza ragionevole dubbio.
    - Controprova coi rapporti: quota ÷ competenze vale **6,68%** a maggio e **6,51%** a giugno,
      praticamente uguale. Se le 315,00 fossero escluse, a giugno sarebbe stato **5,09%**.
  - **La modifica è UNA RIGA**: `H19 = (L15 − J12 − J13) + …` torna `H19 = (L15 − J12) + …`.
    ⚠️ **`J12` resta fuori** (decisione ver79): le festività **non godute** sono le domeniche e
    il 4 novembre, un'altra cosa, e nei cedolini non compaiono come voce a sé.
  - ⚠️ **Conseguenza**: nel periodo di cessazione il **TFR maturato**, e quindi il **costo
    totale**, salgono di circa `importo liquidato ÷ 13,5`. Sui cedolini veri sarebbero
    **+23,33 €** e **+9,21 €**. **I costi orari della ver125 sui periodi con cessazione erano
    sottostimati.**
  - ⚠️ **Perché i primi due cedolini non bastavano**: su quello di ottobre sembrava che fossero
    fuori (quota TFR del mese 6,33 € contro i 7,35 € che darebbero le sole ferie). **Lettura
    sbagliata**: in quel cedolino c'è anche una **trattenuta per fondo pensione** che divide il
    TFR, e il conto non si chiude. **Il metodo buono è il confronto fra due mesi della stessa
    persona**, uno con e uno senza liquidazione.
  - **Provato in esecuzione** (`liq126.cjs`): senza cessazione i numeri restano **identici alla
    ver125**; con la cessazione il **TFR maturato cresce** di circa `importo ÷ 13,5`.

- 🧾 **LE FERIE NON GODUTE SI LIQUIDANO ALLA CESSAZIONE** (ver125, 06/11/2026, segnalazione e
  richiesta di Christian: «in caso di licenziamento si liquidano ferie e quant'altro non goduto.
  Come lo calcoli nel costo orario del mese?» → poi **«fallo»**).
  - **Il buco**: fino alla ver124 **non esisteva nessuna voce**. Alla cessazione si liquidano le
    ferie non godute, ma il Costo orario non le contava: il costo dell'ultimo periodo era
    **sottostimato**. C'era solo l'avviso giallo della ver120, che Christian aveva scelto
    («1, solo un avviso») quando il problema era un altro.
  - **La voce nuova `J13`** fa lo stesso conto della gemella `J12` (festività non godute):
    `mensile fisso ÷ 26 × giornate`, dentro l'**imponibile I**, quindi i contributi la seguono.
    ⚠️ **In ver125 era FUORI dalla base TFR; dalla ver126 è DENTRO** — vedi la scheda 🧮 qui
    sopra, dimostrato sui cedolini veri. `J12` invece resta fuori (è un'altra cosa).
  - 🚦 **Scatta SOLO se nel periodo cade la fine del rapporto** (scelta di Christian: «altrimenti
    il debito può ancora essere goduto dopo»). Funzione nuova **`cessaNelPeriodo(dp, pairs)`**,
    che usa `effEndInt`, quindi vale anche per la **scadenza naturale di un tempo determinato**.
    Fuori da quel caso `o.ferieLiqGG` è **0** e il calcolo è **identico alla ver124**.
  - 🔢 **Le giornate** sono due pezzi sommati: il **debito del periodo** (maturate − godute, da
    `ferieBilancio`, la stessa funzione dell'avviso ver120) **più** il **residuo degli anni
    precedenti**, che l'app non può sapere e che si scrive nella casella nuova
    **«Giornate di ferie residue da anni precedenti»** (`dp.costo.ferieResidue`), nel blocco
    *La retribuzione*. ⚠️ Scritta **senza** una cessazione nel periodo **non produce nulla**, e
    l'aiutino sotto la casella lo dice.
    ⚠️ `ferieBilancio` qui si chiama **a parte**, non riusando `o.ferie`: quello esiste solo con
    le ore «dai Riepiloghi» e senza valori scritti a mano, mentre la liquidazione è dovuta
    comunque. **`o.ferie` non è stato toccato.**
  - 🧩 **Con i blocchi** (ver84) la liquidazione sta tutta nell'**ULTIMO pezzo**, quello che
    contiene la cessazione (`ferieLiqGG: (bi === bl.length-1) ? … : 0`): così porta i contributi
    del suo pezzo e la somma dei pezzi torna al periodo intero **senza casi speciali** — al
    contrario della formazione, che va rimessa a parte. Conseguenza voluta e **giusta anche per
    legge**: si usa il **mensile fisso finale**, quindi dopo una promozione la liquidazione è più
    alta.
  - 🟨 **L'avviso giallo della ver120 SPARISCE quando la liquidazione è contata**: diceva «il
    costo orario qui è più basso del vero», e con la voce dentro **non è più vero**. Resta
    identico in tutti gli altri casi.
  - **Misurato in esecuzione** (X a 30 h/sett. D1, **cessazione 30/11/2026**, periodo gen→nov,
    1.674 h rese, mai in ferie: 27,50 giornate maturate e 0 godute):
    | | ver124 | **ver125** |
    |---|--:|--:|
    | *Ferie non godute liquidate* | — | **1.367,40 €** (27,50 gg × 49,72 €) |
    | imponibile I | 16.147,80 € | **17.515,20 €** (+1.367,40, esatto) |
    | contributi INPS | 5.279,92 € | **5.647,75 €** |
    | TFR maturato | 1.388,07 € | **1.388,07 €** (ver125; dalla **ver126** cresce: la voce è nella base) |
    | costo totale | 27.056,89 € | **28.797,96 €** |
    | **€/h** | **16,16** | **17,20** |
    🔑 **La stessa persona che si fosse goduta le ferie costa 17,31 €/h**: con la liquidazione
    dentro i due casi tornano a dire **la stessa cosa** (17,20 contro 17,31), ed è la prova che
    era questo il pezzo mancante. ⚠️ Scrivendo **10** giornate pregresse la voce passa a
    **1.864,64 €** (37,50 gg).
  - ⚠️ **La liquidazione finisce in UN mese solo** (l'ultimo cedolino): chiedendo il costo orario
    **di quel mese** il €/h schizza. **Christian lo sa e va bene così** («ovvio e va bene»): per
    il numero vero si guarda tutto il contratto.
  - ✅ **I ROL NON sono un caso a parte** (Christian, 06/11/2026): «i rol sono i permessi ex
    festività, che seguono le ferie. Noi abbiamo considerato tutto insieme a 30 gg annui,
    corrispondenti a 2,5 giorni mese». Quindi la voce unica è **giusta**: nel cedolino vero sono
    due righe (*Ferie non godute* e *Permessi Ex-Fs non goduti*) ma con la **stessa quota
    giornaliera**, perciò il totale coincide. **Non separarle.**
  - ⚠️ **NON è gestita** (non richiesta): l'**indennità di mancato preavviso**. Il **TFR** invece
    è già contato mese per mese, quindi erogarlo alla fine **non è un costo in più**.
  - 🧾 **VERIFICATA SU DUE CEDOLINI VERI DI LIQUIDAZIONE** (Christian, 06/11/2026). Due soci
    dipendenti, livello D1, part-time 47,36%, cessati nel 2025. ⚠️ **I dati restano in chat: mai
    nel repository** (regola 10.1). Tutto torna:
    | | cedolino | l'app |
    |---|---|---|
    | **quota giornaliera** | 31,32261 € e 30,00053 € | `mensile fisso ÷ 26` → **identica alla quinta cifra** |
    | **giornate × quota** | 99,19 + 25,12 = 124,31 € · 275,00 + 40,00 = 315,00 € | stessa formula |
    | **imponibile contributivo** | 202,00 € e 1.311,00 € = **comprende** le ferie non godute | ✅ la voce sta in **imponibile I** |
    | **ratei maturati** | 22,50 gg su 9 mesi · 15,00 gg su 6 mesi | `30/12 × mesi` → **esatti** |
    | **mese di cessazione con 3 giorni** | **nessun rateo** | ✅ regola dei 15 giorni (ver104) |
    | **minimo tabellare** | 9,92467 €/h × 165 = **1.637,57** · 9,73327 × 165 = **1.605,99** | `MINIMI_CCNL` **Ott25** e **Ott24**, identici |
    - ⚠️ **Nei cedolini c'è un elemento in più che l'app non conosce**: la colonna **«etar»**
      accanto al minimo, che vale **82,00 €** e **41,00 €** al mese a tempo pieno. Va scritto nel
      **superminimo** della scheda, altrimenti il mensile fisso — e quindi la liquidazione — è
      più basso del vero.
    - ⚠️ **Nel prospetto RATEI del cedolino la colonna «Goduto» comprende anche le giornate
      liquidate** (maturato = goduto, residuo zero): **non** si può leggere da lì quante ferie
      sono state davvero prese.
    - ✅ **Base TFR: CHIUSA nella ver126** — vedi la scheda 🧮 più sopra. **Ci stanno dentro**,
      dimostrato col cedolino del mese prima.
  - **Provato in esecuzione** (`liq125.cjs`): nessuna cessazione → numeri **identici alla
    ver124** e nessuna voce; con la cessazione l'importo, la nota, l'imponibile I, i contributi,
    il TFR invariato, il €/h che sale e l'avviso che sparisce; la casella pregressa; nessuna voce
    quando non c'è debito; nessuna voce senza cessazione; con i blocchi una volta sola e col
    mensile finale. **Zero errori di pagina.**

- 🐣 **LA DOMENICA DI PASQUA NON È UNA FESTIVITÀ: TOLTA DALL'ELENCO** (ver124, 06/11/2026,
  difetto **trovato da Christian** guardando un caso vero: «per [una dipendente] intendo dire che nel
  periodo gen26-ott26 mi hai messo due festivi non goduti» → poi «1, togli pasqua - 2, e' festivo
  e va tenuto»).
  - **Il difetto**: `festivitaSet` metteva nell'elenco **sia la domenica di Pasqua sia il Lunedì
    dell'Angelo** (`const pa = pasqua(anno); s[pa.m+"-"+pa.d] = true;`). Ma la Pasqua **è una
    domenica per definizione**: non è una festività infrasettimanale, e la festività da pagare è
    il **Lunedì dell'Angelo**, che era già nell'elenco e già contato come **goduta**. Cadendo di
    domenica, la Pasqua risultava **ogni anno** fra le «festività NON godute» (`J12`) e faceva
    pagare **un 1/26 del mensile fisso non dovuto**, a ogni persona.
  - **La correzione**: una riga sola. `pasqua(anno)` si calcola ancora, ma **serve solo** a
    ricavare il Lunedì dell'Angelo. ⚠️ **Il 4 ottobre (San Francesco) RESTA**, decisione di
    Christian del 06/11/2026: «e' festivo e va tenuto». Nel 2026 cade di domenica, quindi resta
    fra le non godute, ed è giusto così.
  - ⚠️ **Il TABELLONE non cambia di un millesimo**: il 5 aprile 2026 è domenica, quindi era ed è
    **rosso e non compilabile** (regola della ver77) e non entra in nessun conteggio di giornate
    godute. Cambia **solo** la voce di costo *Festività non godute* del Costo orario.
  - **Misurato in esecuzione** (persona 38 h/sett., 150 h al mese, anno 2026):
    | | giorni non goduti | voce | €/h |
    |---|--:|--:|--:|
    | ver123 | **4** | 251,93 € | 17,21 |
    | **ver124** | **3** | **188,95 €** | **17,17** |
    Le festività **godute restano 11**, identiche. Sul periodo gen→ott i non goduti passano da
    **2 a 1**.
  - 🔴 **Sui dati VERI di Christian** (una dipendente, gen→ott 2026, dal backup del 04/11):
    *Festività non godute* **62,96 € → 31,48 €**, costo totale **14.467,76 € → 14.427,24 €**,
    **20,47 → 20,41 €/h**. ⚠️ Il costo scende di **40,52 €**, più dei 31,48 della voce: le
    festività non godute entrano nell'**imponibile I** (`L15`), quindi si portano dietro anche i
    contributi.
  - ⚠️ **I costi orari calcolati finora erano sovrastimati di un 1/26 all'anno per persona.**
  - **Provato in esecuzione** (`pasqua124.cjs`), **8 controlli su 8**: ver123 conta 4 giorni e
    ver124 ne conta 3; l'importo scende; gen→ott passa da «2 giorni» a «1 giorno»; le **godute
    non cambiano** (11,00 in entrambe); nel **Tabellone di aprile** il TOT calcolato è
    **identico** e il 5 e il 6 aprile sono **rossi e non compilabili** in tutte e due le versioni.
    **Zero errori di pagina.**

- 💶 **L'IMPORTO ORARIO E LE ASSENZE SPACCHETTATE** (ver123, 06/11/2026, due richieste di
  Christian nello stesso momento). **Nessun calcolo è stato toccato: si fanno vedere numeri che
  l'app calcolava già.**
  - **«Nel box della retribuzione mettimi anche l'importo orario derivante dalle varie
    componenti inserite»** → in fondo al blocco *La retribuzione*, tre righe di sola lettura:
    **Totale delle componenti** (minimo + scatti + premi a tempo pieno + superminimo),
    **Importo orario** = quel totale ÷ **165** (a **4 decimali**, `J2`) e **Mensile fisso di
    questa persona** (`H5` = totale ÷ 38 × ore settimanali). Sotto, una riga spiega la formula e
    dice a quanto si pagano le **ore aggiuntive** (importo orario maggiorato del 27%, o del 15%
    sul minimo a 38 h/sett.).
    ⚠️ **Le componenti sono a tempo pieno**: l'importo orario **non cambia** col part-time,
    cambia il mensile fisso. Provato in esecuzione su dati veri: 1.637,57 € ÷ 165 =
    **9,9247 €/h**, mensile fisso 1.637,57 € (38 h/sett.) e 818,45 € (18 h/sett.).
  - **«In "le ore in più mese per mese" spacchettami bene le assenze indicandone le voci che le
    compongono»** → sotto il numero della colonna **Assenze** compare ora l'elenco delle voci
    («**FERIE 15 gg · FEST 1 gg**», «**MAL 2 gg**», «**permessi 2,00 h**»), e c'è una **colonna
    nuova «Festività»** con le festività godute contate dal calendario (ore e giornate).
    Così si legge a colpo d'occhio: **Lavorabili = monte del mese − Assenze − Festività**.
  - 🔑 **Perché servivano DUE colonne** (ed è la stessa ragione della ver122): una festività può
    stare in **due posti diversi**. Se nel Tabellone quel giorno porta un codice (`FEST`,
    `FERIE`…) finisce fra le **Assenze**; se la cella è vuota la conta il **calendario** e
    finisce fra le **Festività**. Metterle in una colonna sola avrebbe nascosto proprio la cosa
    che la ver122 è servita a correggere.
  - **Dati nuovi** nelle righe di `oreSuppPeriodo`: `perm`, `fest`, `festGG`, `det`
    (`[{cod, gg, ore}]`, ordinato per ore). `coverAbsHours` **non è stata toccata**: il dettaglio
    riconta le celle **solo per scriverlo**, con lo stesso criterio (fuori `--` e `AN`).
  - **Provato in esecuzione**: `retr123.cjs` **7 controlli su 7** (le tre righe ci sono, i 4
    decimali, totale ÷ 165 = importo orario, mensile fisso = totale ÷ 38 × ore settimanali, e la
    ver122 non le mostra); il riquadro mese per mese letto su un caso con ferie, malattia e
    festività **scritte in cella**: gennaio `165 − 6,35 (FEST 1 gg) − 6,33 (1 gg dal calendario)
    = 152,32`, dicembre `165 − 12,69 (FEST 2 gg) − 12,67 (2 gg) = 139,64`. **Zero errori di
    pagina.**
- 🛡️ **UNA FESTIVITÀ GIÀ SCRITTA IN CELLA NON SI CONTA DUE VOLTE** (ver122, 06/11/2026).
  Difetto **introdotto dalla ver121** e trovato controllando perché il Tabellone non le contasse.
  - **Il caso**: fino alla ver77 i giorni rossi **si potevano compilare**, e nell'elenco dei
    codici c'è anche **`FEST` («Festività goduta»)**. Se nei dati vecchi un 1° gennaio porta
    `FEST` (o `FERIE`), `coverAbsHours` lo conta già come assenza: la ver121 ci aggiungeva anche
    la festività del calendario, e **quel giorno valeva due volte**.
  - **Misurato in esecuzione**: gennaio 2027, 172 h rese, 2 festività godute, con `FEST` scritto
    sul 1° gennaio → **ver121: +26,013 h**, **ver122: +19,679 h** (giusto). Senza niente scritto
    tutte e due danno **+19,667 h**.
  - **Funzione nuova `festGoduteMese(state,dp,y,m,escludi)`** → `{gg, ore}`: salta i giorni che
    portano già un codice di assenza. **La usano tutti e due**: il Tabellone (`festOreMese`, la
    pastiglia) e il Costo orario (`oreLavorabiliMese`), così non possono più scostarsi.
  - ⚠️ `oreLavorabiliMese` e `oreSuppPeriodo` hanno perso il parametro `ggSett`: la quota la
    calcola `festGoduteMese` con `ggSettDi`, che legge gli stessi campi.
  - 🔴 **NON è un caso di scuola: succede sui dati VERI di Christian.** Guardando una persona
    reale (gennaio → ottobre 2026) il **1 e il 6 gennaio, il 6 e il 25 aprile, il 1 maggio, il
    2 giugno e il 15 agosto** portano tutti il codice **`FEST`** scritto in cella. Senza la
    ver122 quelle sette giornate sarebbero state contate **due volte**. ⚠️ Dalla ver77 non si
    possono più scrivere, ma quelle già nei dati restano.
- 🎌 **ANCHE IL TABELLONE CONTA LE FESTIVITÀ GODUTE** (ver121, 06/11/2026). Christian: «Perché
  il tabellone non conteggia le festività godute?? Sono **assenze retribuite a tutti gli
  effetti**, come ferie, malattia eccetera. Solo le **non godute** sono un'eccezione che non
  rientra nel calcolo».
  - **Perché mancavano**: dalla ver77 i giorni rossi **non si compilano**, quindi non hanno
    nessun codice e `coverAbsHours` non li vedeva. Ora si contano **dal calendario**, come fa
    già il Costo orario, e solo nei giorni in cui il contratto è in piedi.
  - **Funzioni nuove** (sopra `bancaMeseA`): **`ggSettDi(state,dp)`** e
    **`festOreMese(state,dp,y,m)`** = festività **godute** × `oreSettAt / ggSett`.
  - **Dove cambia**: `bancaMeseA` (quindi anche `bancaPrecA` e lo **Straordinario** della Query
    personale) e il riquadro **«Ore in più / in meno — base mensile»** del Tabellone, che ora ha
    la pastiglia nuova **«Festività godute: 2 gg = 12,667 h»**. La frase dice ora «Ferie,
    malattia, permessi **e festività godute** contano come fatte».
  - 🔗 **Tabellone e Costo orario ora danno lo STESSO numero.** Provato in esecuzione su
    dicembre 2026 (4 festività godute, 172 h rese): **+32,333 h** da una parte e **32,33 h**
    dall'altra; prima erano +7,000 e 32,33.
  - ✅ **Il numero di Christian torna nel Tabellone**: gennaio 2027 (1 e 6 gennaio godute),
    38 h/sett., 172 h rese → **Risultato del mese +19,667 h**, cioè i suoi «19,6666 ore
    straordinarie». La ver120 diceva +7,000. **3 controlli su 3** (`caso121.cjs`).
  - ⚠️ **`coverAbsHours` NON è stata toccata**, di proposito: se le festività finissero lì
    dentro il **Costo orario le conterebbe due volte**, perché le somma già per conto suo.
  - ⚠️ **Le festività NON godute restano fuori** (domeniche e il 4 novembre): «sono un'eccezione
    che non rientra nel calcolo». Restano una voce di costo a parte nel Costo orario (`J12`).
  - 🚫 **IL TETTO ANNUO RESTA COM'È — deciso da Christian il 06/11/2026 («Lascia com'è»),
    dopo che gli era stato chiesto con i numeri. NON RIPROPORLO.** `prodottoMese` continua a
    contare ore rese + assenze **erosive** + permessi erosi: le **festività godute non erodono
    il massimale**. È la sua stessa regola del 03/11/2026 («se stai a casa durante l'anno
    scolastico io ti pago e le ore incidono; **se stai in ferie a Natale no**»): in una
    festività il servizio è chiuso e al progetto non arriva nessuna ora.
    **Sono due domande diverse**, ed è giusto che rispondano in modo diverso:
    | | che domanda fa | festività godute |
    |---|---|---|
    | **Risultato del mese** (straordinario) | «mi ha dato le ore che mi doveva?» | **contano** (ver121) |
    | **🎯 Tetto annuo** | «quante ore ho scaricato su questo progetto?» | **non contano** |
    Se si fossero fatte erodere: **11 festività × 6,3333 = 69,67 h all'anno** di massimale
    consumate senza che nessuno abbia lavorato (il **17%** di un tetto da 408 h), e lo stesso
    numero sarebbe sceso nel residuo che gli operatori vedono in **Fogli ore** dopo
    *📤 Pubblica i residui*.
  - ⚠️ **Conseguenza da sapere**: lo straordinario cresce in **6 mesi su 12** del 2026 (gennaio,
    aprile, maggio, giugno, agosto, dicembre). Dalla ver121 in poi i numeri dei mesi con
    festività **non sono confrontabili** con quelli visti prima.
- 🟨 **AVVISO: LE FERIE NON GODUTE SONO UN DEBITO** (ver120, 06/11/2026). Fra le tre strade
  proposte per il limite che aveva visto lui stesso (vedi la scheda ⚠️🔴 della ver118) Christian
  ha scelto la **1: solo un avviso, nessun numero toccato**.
  - **Funzione nuova `ferieBilancio(state, dp, pairs, c, escludi, mesiRatei)`** (sotto
    `oreSuppPeriodo`): conta le giornate **maturate** nel periodo — il valore comune «ferie e
    permessi annui» (30) diviso 12, sui **mesi che maturano i ratei** — e quelle **godute
    davvero** nel Tabellone: codici **`FERIE`** e **`EXF`**, più le ore di **permesso orario di
    tipo EXF**. La differenza è il debito, in giornate e in ore.
  - **Dove si vede**: riquadro giallo **subito sotto il numero €/h**, solo quando il debito
    supera la mezza giornata e ci sono ore. Dice le giornate godute, quelle maturate, il debito
    in giornate e in ore, e **di quanto il costo orario è più basso del vero**
    (`debito ÷ ore rendicontate`).
  - ⚠️ **Non cambia NESSUN numero**: verificato in esecuzione, il €/h della ver119 e quello della
    ver120 sono **identici** (16,28 su chi non fa ferie). È solo una scritta.
  - **Provato in esecuzione** (`ferie120.cjs`), **8 controlli su 8**: chi si prende tutte le 30
    giornate **non vede l'avviso**; chi non ne fa nessuna lo vede con «0,00 su 30,00 maturate ·
    190,38 h · circa **9,90%**» — cioè esattamente lo scarto misurato fra le due persone; chi ne
    fa 15 vede «15,00 su 30,00 · 95,19 h · 5,20%»; il riquadro è giallo con bordo ambra
    (`rgb(255,248,225)` / `rgb(234,200,122)`); la ver119 non lo mostra. **Zero errori di pagina.**
  - ⚠️ **Le giornate maturate vengono dal valore comune** «ferie e permessi annui» (30 gg =
    26 ferie + 4 ex festività), diviso 12 e moltiplicato per i mesi del periodo.
  - ✅ **Il residuo ferie degli anni prima NON serve**, e l'avvertenza che avevo scritto era
    sbagliata: **corretta da Christian il 06/11/2026** («cosa ti cambia sapere quante ferie ha in
    tasca pregresse indipendente se tu calcoli il costo basandoti su ogni singolo mese?»). Il
    conto è **per periodo**: si confronta quanto è maturato **in quel periodo** con quanto se n'è
    goduto **in quel periodo**, e un saldo degli anni prima non cambia né l'uno né l'altro.
    **Non riproporre un monte ferie per persona.**
  - ⚠️ **Il caso opposto non viene segnalato**: chi gode **più** giorni di quanti ne maturi nel
    periodo (perché smaltisce un arretrato) rende meno ore a parità di stipendio, quindi il costo
    orario risulta **più alto** del vero. L'avviso non scatta (il debito è zero). Non richiesto.
- 📅 **LA QUOTA DI UNA FESTIVITÀ È `ore settimanali ÷ giorni a settimana`** (ver119, 06/11/2026,
  **numero dato da Christian**): «Ore mensili contrattuali 165, rese effettivamente 172 e due
  festività godute nel mese: le ore da lavorare dovevano essere **152,333**, quindi lui ha fatto
  **19,6666 ore straordinarie**». 165 − 2 × (38/6) = 152,3333 · 172 − 152,3333 = 19,6667.
  - **Com'era**: la ver118 usava `quotaGiorno` = **monte/26** (6,3462 a 38 h/sett.) anche per le
    festività → 152,31 e 19,69. Ora usa **`oreSettAt / ggSett`** (6,3333). **Provato in
    esecuzione**: gennaio 2026 (2 festività godute), 172 h rese → **lavorabili 152,33 · ore in
    più 19,67**, cioè i numeri di Christian.
  - ⚠️ **Restano DUE quote giornaliere, ed è voluto**: le **assenze** valgono `monte/26` (6,3462),
    ed è il numero che Christian aveva confermato il **31/10/2026** («2 giorni di ferie =
    12,69 h»); le **festività** valgono `oreSett/ggSett` (6,3333). Differenza: **1,3 centesimi di
    ora al giorno**. `ggSett` è il campo della scheda (6 di difetto), quindi chi lavora su 5
    giorni ha la sua quota giusta.
  - ✅ **Chiusa la prima domanda aperta della ver118**: «Le festività non possono che essere
    dedotte in base al mese, non vedo alternative». **Si deducono, e si contano mese per mese.**
  - ✅ **CHIUSA nella ver121**: nella frase di Christian quelle 19,6666 h sono **«ore
    straordinarie»**, cioè il linguaggio del **Risultato del mese**, e fino alla ver120 il
    Tabellone **non toglieva le festività** (`bancaMeseA` faceva `rese + assenze − monte`).
    Gliel'ho chiesto e ha risposto che sono assenze retribuite a tutti gli effetti. **Misurato
    prima della correzione**, dicembre 2026 (4 festività godute, 172 h rese, nessuna assenza):
    | | dice |
    |---|--:|
    | **Tabellone**, Risultato del mese | **+7,000 h** (172 − 165) |
    | **Costo orario** (ver119) | **+32,33 h** (172 − 139,667) |
    ✅ **Fatto nella ver121**: ora tutti e due dicono **+32,333 h**.
- 🧾 **LE ASSENZE SONO QUELLE VERE DEL TABELLONE, NON PIÙ QUELLE PRESUNTE** (ver118, 06/11/2026).
  Christian, alla domanda se lasciare il Costo orario sulle assenze presunte: **«a meno che non
  ti risulti più comodo usare la realtà»**. Risulta più comodo, e questo è il motivo:
  - **Dalla ver117 non c'è più compensazione fra i mesi**, quindi l'errore dei numeri presunti
    non si annulla più sull'anno: **si somma**. Un mese in cui la persona non si è assentata si
    vedeva togliere **4,5 giorni che non aveva preso** (ore in più sottostimate); un mese con due
    settimane di ferie se ne vedeva togliere **solo 4,5** (ore in più inventate).
  - **Ora**: `oreLavorabiliMese` legge il Tabellone — `coverAbsHours` (ferie, malattia e gli altri
    codici, a quota giornaliera) più `permOreMese().pagate` (i cinque permessi retribuiti). Le
    **festività godute** restano tolte (decisione del 06/11, vedi sopra).
  - 🔗 **«Ore in più del mese» è ora la STESSA formula del Risultato del mese del Tabellone**
    (`rese + assenze + permessi − monte`, la regola dello straordinario del 31/10/2026 confermata
    con un numero), **più** la deduzione delle festività godute. **Verificato in esecuzione**:
    novembre 2026 (nessuna festività goduta) → Tabellone **+14,767 h**, Costo orario **14,77 h**:
    lo stesso numero.
  - ⚠️🔴 **DOMANDA APERTA PER CHRISTIAN, con i numeri**: nei mesi **con festività** i due restano
    diversi, **esattamente delle festività**. Dicembre 2026, stessa persona (30 h/sett., 95 h
    rese, 5 giorni di ferie, 4 festività godute: 7, 8, 25, 26):
    | | dice |
    |---|--:|
    | **Tabellone**, Risultato del mese | **−10,213 h** (ore in meno) |
    | **Costo orario**, ore in più | **+9,830 h** |
    | differenza | **20,043 h** = 4 festività × 5,0101 h |
    Dipendeva da una cosa sola: **le festività contano come ore già coperte** (come un'assenza
    retribuita) oppure no? ✅ **DECISO da Christian il 06/11/2026, con un numero** (vedi la
    scheda 📅 della ver119): **sì, si deducono, mese per mese.** Quindi ha ragione il Costo
    orario, e resta aperta solo la domanda se allineare anche il **Tabellone**.
  - ⚠️ **`c.ferie`, `c.altriPermessi` e `c.malattiaMese` NON sono stati tolti né cambiati**:
    restano in uso in `O6calc`/`E13`, cioè nella **tabellina delle settimane** e nelle ore
    **«Teoriche»**. L'avviso sotto quella tabellina lo dice.
  - ⚠️ **`coverAbsHours`, `permOreMese`, `monteFissoMese`, `quotaGiorno` NON sono stati toccati**:
    si leggono e basta. `oreLavorabiliMese` prende ora `state` come primo parametro.
  - **A video**: nel riquadro «Le ore in più, mese per mese» c'è una **colonna «Assenze»** con le
    ore vere di quel mese, e sotto la riga «sono le ore … davvero segnate nel Tabellone: non sono
    più i numeri presunti». Il riquadro scorre di lato dentro il suo spazio (5 colonne).
  - **Misurato in esecuzione** (ver117 → **ver118**):
    | Caso | ore in più | costo totale | €/h |
    |---|--:|--:|--:|
    | 38 h/sett., 140 h al mese, **nessuna assenza segnata** | 112,50 → **0,39 h** | 32.557,70 → **30.831,47 €** | 19,38 → **18,35** |
    | lo stesso, ma **15 gg di ferie a luglio e 10 ad agosto** | 99,04 → **0,39 h** | 32.350,43 → **30.831,47 €** | 21,28 → **20,28** |
    | 30 h/sett., ore altalenanti, 3 gg MAL + 5 gg ferie | 156,05 → **39,10 h** | 27.101,18 → **25.136,41 €** | 20,07 → **18,62** |
    ⚠️ **Il costo scende**, e parecchio: le ore in più che sparivano erano **inventate dai numeri
    presunti**. Chi lavora 140 h al mese su un contratto da 165 non fa straordinario, e adesso
    l'app lo dice. ⚠️ **Nel secondo caso i due numeri sono identici al primo**: è il segno che il
    conto ora guarda davvero il mese, non una media.
  - **Provato in esecuzione** (`supp118.cjs`): 3 casi + **2 controlli su 2** del confronto col
    Tabellone. **Zero errori di pagina.**
  - **Non regressione**: `supp118b` (24/24: con le ore a mano, le Teoriche e i valori scritti a
    mano i numeri sono **identici alla ver117**), vm-A (21), vm-B (14), vm-C (15), vm-D (7), i
    **60 controlli delle aliquote**, il fondo TFR (12), la casella «Anni» (10), l'ISTAT (7),
    l'avviso giallo (6), il registro delle formule (9) e la finestra del periodo — **tutti
    superati, zero errori di pagina**. ⚠️ Negli script di TFR/ISTAT/«Anni» gli attesi della
    **rivalutazione stimata** sono stati aggiornati (17,32 → **15,27 €**): la stima si calcola
    sulla base TFR, che comprende le ore in più, e quelle ora sono di meno. Non è una
    regressione, è la conseguenza voluta.
  - ⚠️🔴 **IL LIMITE CHE HA VISTO CHRISTIAN SUBITO, MISURATO** («ho timore a utilizzare le vere ore
    del tabellone: se uno non fa mai ferie in un anno magari mi tradisce il costo orario»).
    **Ha ragione, ed è il 10%.** Due persone **identiche** (38 h/sett., stesso stipendio, stesso
    ritmo), una si prende le 30 giornate di ferie e l'altra nessuna, anno 2026:
    | | chi FA le ferie | chi NON le fa | scarto |
    |---|--:|--:|--:|
    | **ver117** (assenze presunte) | 19,30 €/h | 18,89 €/h | **−2,1%** |
    | **ver118** (assenze vere) | **18,08 €/h** | **16,29 €/h** | **−9,9%** |
    - **Perché**: il costo è lo stesso (lo stipendio non cambia), ma chi non va in ferie
      **rende 190,4 ore in più** (30 gg × 6,346 h) e il costo si divide per quelle. Quelle ore
      però sono un **debito**: o le godrà dopo (e allora in quel periodo renderà di meno), o
      andranno pagate. Nella ver117 il difetto c'era lo stesso, ma era **in parte nascosto**
      dalle ore in più inventate dai numeri presunti: due errori che si compensavano a metà.
    - 🧮 **Verifica del perché** (conto a mano, **non ancora nell'app**): dividendo il costo di
      chi non fa ferie per le ore **al netto delle 190,4 non godute** si ottiene **18,09 €/h**,
      cioè lo stesso numero dell'altro. È la conferma che la causa sono le ferie non godute.
    - **Tre strade proposte. ✅ Christian ha scelto la 1** (fatta nella ver120):
      1. ✅ **solo un avviso**, quando le ferie godute nel periodo sono molto meno di quelle
         maturate: «ne risultano godute X su Y maturate; il costo orario qui è più basso del vero
         di circa N%». Non tocca nessun numero;
      2. 🚫 **togliere dalle ore** le ferie maturate e non godute del periodo: il €/h torna uguale
         per tutti, ma cambia il numero che si usa in rendicontazione. **Scartata.**
      3. 🚫 **tornare alle assenze presunte**: misurato, nasconde il problema solo a metà (−2,1%) e
         in cambio inventa ore in più a chi le ferie se le prende (fino a 112 h in un anno).
         **Scartata.**
    - ⚠️ **Nulla è pubblicato**: `main` porta ancora la **ver116**. Le ver117 e ver118 stanno solo
      sul ramo di lavoro.
- 🧮 **LE ORE IN PIÙ SI CONTANO MESE PER MESE, E SUL MONTE CONTRATTUALE** (ver117, 06/11/2026).
  Chiude insieme i due punti rimasti del 05/11 sera, confermati da Christian il 06/11 («1 e 2
  confermo») con **la sua definizione delle ore lavorabili**: «le ore lavorabili sono quelle
  **contrattuali** (chi ha 38 ore settimanali deve fare 165 ore mensili; nel mese pago 165 ore
  considerando però che ci stanno **2,166 gg di ferie**, **0,333 di permesso ex festività** e
  presuntivamente **2 gg di malattia**)».
  - **Niente più compensazione fra i mesi.** Prima `E18` confrontava il **totale** delle ore rese
    del periodo con il **totale** delle ore lavorabili: un mese sotto copriva un mese sopra. Ora,
    per ogni mese, `max(0, ore rese − ore lavorabili del mese)`, e poi si somma.
  - **Le due app ora si parlano.** La base non è più «settimane × ore settimanali» (`O5`/`O6`/`O8`
    del foglio Excel) ma **`monteFissoMese`, lo stesso numero che il Tabellone mostra come ORE
    MESE** (165 h a 38 h/sett., in proporzione per gli altri). Le assenze presunte si tolgono in
    **giorni × `quotaGiorno`** (= monte ÷ 26), e sono esattamente quelle dei valori comuni:
    `(ferie 30 + altri permessi) / 12` = **2,50 gg** (cioè i suoi 2,166 + 0,333) più
    `malattiaMese` = **2 gg**.
  - ✅ **Le FESTIVITÀ GODUTE del mese restano tolte**, contate dal calendario come dalla ver79.
    Christian non le aveva nominate; gli è stato chiesto, e il **06/11/2026** ha risposto:
    **«il mio era un esempio per farti capire»** — cioè l'elenco «2,166 + 0,333 + 2» era il
    **principio**, non la lista completa. Vale quindi la stessa regola del 06/11 sulle aliquote
    («tu applica il giusto»): si toglie **tutto ciò che è pagato e non lavorato**, festività
    comprese (11 giorni l'anno ≈ 70 h). **Deciso: non si cambia.**
  - **Funzioni nuove** (sopra `blocchiPeriodo`): **`oreLavorabiliMese(dp,c,y,m,escludi)`** e
    **`oreSuppPeriodo(state,dp,pairs,c,escludi,sottoSoglia)`** (torna `{ore, righe}`).
    In `calcCosto` `E18` legge **`o.suppMensileOre`** quando c'è, altrimenti fa **esattamente**
    quello di prima. `scrittoAMano` è stato **spostato più in su** in `datiCosto` (stessa
    espressione) perché ora serve prima di `calcCosto`.
  - 🚫 **Quando NON si applica**, e lì i numeri sono **identici alla ver116**: ore scritte **a
    mano** (c'è un numero unico, non si sa com'era distribuito), ore **Teoriche** (la stima resta
    la percentuale) e ogni volta che l'utente ha scritto a mano **mesi, ore settimanali, livello,
    minimo, addizionale o le settimane della simulazione**. Verificato su **8 casi**: 24 controlli
    su 24.
  - **A video**: riquadro nuovo **«Le ore in più, mese per mese»** (mese · lavorabili · rese · in
    più, con il totale), la frase sotto la tabellina del dettaglio riscritta, e un avviso sotto la
    tabellina delle settimane che dice che **quelle settimane non entrano più in questo conto**
    (servono alle ore «Teoriche» e alla simulazione). ⚠️ Diciture nuove, scritte da Claude.
  - **Misurato in esecuzione, tre casi** (ver116 → **ver117**):
    | Caso | ore in più | costo totale | €/h |
    |---|--:|--:|--:|
    | 38 h/sett., 12 mesi altalenanti (180·120·175·130…) | 230,26 → **280,48 h** | 34.370,72 → **35.144,04 €** | 19,09 → **19,52** |
    | 15 h/sett., 72 h in 10 mesi, luglio e agosto tutti AN | 205,72 → **206,46 h** | 14.002,91 → **14.015,34 €** | 19,45 → **19,47** |
    | 30 h/sett. promossa D2 dal 01/06 (periodo a **blocchi**) | 260,73 → **262,50 h** | 29.752,35 → **29.783,07 €** | 19,83 → **19,86** |
    ⚠️ **Il costo sale solo dove i mesi sono disuguali**: è lì che la compensazione nascondeva le
    ore in più. Dove ogni mese è sopra allo stesso modo (secondo caso) non cambia quasi nulla.
  - **Conti rifatti a mano** sul primo caso: gennaio 2026 ha 2 festività godute (1 e 6 gennaio),
    quindi `165 − (4,5 + 2) × 6,34615 = 123,75` h; febbraio, senza festività, `165 − 4,5 ×
    6,34615 = 136,44`; dicembre, con 4 festività godute, `111,06`. Totale dell'anno **1.567,50 h**
    contro le **1.569,60** del conto vecchio: sull'anno intero la base è **la stessa**, cambia il
    **mese per mese**.
  - ⚠️ **Con i blocchi** ogni blocco conta le ore in più dei **suoi** mesi (`suppMensileOre` nel
    pacchetto `ob`): verificato che la somma delle righe torna al totale del periodo.
  - ⚠️ **SUPERATO dalla ver118**: in ver117 il Costo orario usava ancora le assenze **presunte**
    mentre il Tabellone usa quelle **vere**, e i due numeri non coincidevano. Dalla ver118 il
    Costo orario legge le assenze vere e le due schermate danno lo **stesso** numero, salvo le
    festività (vedi la scheda 🧾 sopra).
  - **Provato in esecuzione**: `supp117.cjs` (8 controlli su 8, tre casi) e `supp117b.cjs`
    (**24 su 24**, non regressione su 8 fonti/scritture a mano). **Zero errori di pagina.**
  - **Non regressione**: vm-A (21), vm-B (14), vm-C (15), vm-D (7), i **60 controlli delle
    aliquote**, i 12 del fondo TFR, i 10 della casella «Anni», i 7 dell'ISTAT, i 6 dell'avviso
    giallo, il registro delle formule (9) e `R2` (9) — **tutti superati**. ⚠️ Negli script del
    TFR/ISTAT i confronti **fra versioni** sul **costo totale** sono stati corretti: adesso il
    costo cambia di proposito, quindi si confronta solo la **rivalutazione** (identica).
- 📱 **I DUE SBORDAMENTI A 390px SONO CHIUSI** (ver117, 06/11/2026, Christian: «3, sistema»).
  Erano difetti **preesistenti**, misurati il 05/11 con la verifica meticolosa e **non** causati
  dalle versioni di quei giorni.
  - **Anagrafica, da 724 a 390px.** L'elenco delle persone e la scheda stavano su una riga flex
    che non andava a capo, e la scheda (`flex:1`, `min-width:auto`) non si restringeva sotto la
    larghezza minima del suo contenuto: la riga **«Genera documento: 📄 Contratto 📄 Proroga 📄
    Trasformazione»**. Sotto i 900px ora l'elenco va a capo e i tre pulsanti si impilano
    (`.ana-wrap`, `.ana-sheet`, `.ana-gen` nella media query che c'era già). Aggiunti **tre soli
    attributi `class`** nel JavaScript: nessuna logica, nessun campo, nessuna dicitura toccati.
  - **Costo orario, da 429 a 390px.** Colpa della tabella **«Come si divide il periodo»**, che ha
    **sette colonne**. Ora scorre lei dentro il suo riquadro (`.co-scroll`, `overflow-x:auto`),
    come fa da sempre la griglia del mese.
  - **Misurato**: a 390px tutte e cinque le viste stanno in **390px**; a **1280 e 1680px la
    larghezza è identica** alla ver116.
- 📉 **ISTAT: IL VALORE DI PARTENZA PASSA DA 2 A 1,011** (ver116, 06/11/2026). Christian: «istat
  dicembre 2025 risulta 1,011» → alla domanda se fosse una percentuale o il rapporto fra gli
  indici: «**è una percentuale**» → **Nu\*** per portarlo anche nel codice.
  - **`COSTO_COMUNE_DEF.istat` da 2 a 1,011.** Il tasso di rivalutazione del TFR diventa
    **1,50% + 75% × 1,011% = 2,25825%** (era 3,000%).
  - 🐞 **Trappola trovata e chiusa nella stessa versione**: `cMostra` formatta il valore di
    partenza con **`fmt2`**, quindi la casella avrebbe mostrato **«1,01»** mentre il conto usava
    **1,011** — una bugia a video, e peggio: cliccando e salvando si sarebbe scritto 1,01 nei
    dati. Ora il valore di partenza passa a `cMostra` **già scritto** con **`numTxt`**, che tiene
    i decimali veri quando ce ne sono più di due. `pctTxt` è diventato `numTxt(v) + "%"`: una
    sola formattazione per i due usi, **le altre 34 caselle non sono state toccate**.
  - **Misurato in esecuzione** (15 h/sett., gen→dic 2026, niente salvato nei valori comuni):
    | | rivalutazione | costo totale | €/h |
    |---|--:|--:|--:|
    | **col fondo 8.000 €** — ver115 | 240,00 € | 16.908,86 € | 19,57 |
    | **col fondo 8.000 €** — ver116 | **180,66 €** | **16.849,52 €** | **19,50** |
    | **senza fondo** (stima, Anni = 1) — ver115 | 23,00 € | 16.691,85 € | 19,32 |
    | **senza fondo** — ver116 | **17,31 €** | **16.686,17 €** | **19,31** |
    La nota a lato della voce scrive per intero: «1,50% + 75% dell'ISTAT **1,011%** = **2,25825%**».
  - ⚠️ **Vale solo se la casella non è mai stata salvata**: con un `costoComune.istat` già scritto
    (es. 2) **prevale quello** — verificato in esecuzione, resta 2,00% e 240,00 €. Va cambiato a
    mano nella casella e salvato con 💾.
  - ⚠️ **È il dato di dicembre 2025**, cioè quello che rivaluta il fondo al 31/12/2025: serve per
    i costi del **2026**. **Da riscrivere ogni gennaio** col dato di dicembre dell'anno prima.
  - **Provato in esecuzione** (`istat116.cjs`), **7 controlli su 7**: la casella mostra «1,011»
    per intero; col fondo 180,66 €; senza fondo 17,31 €; il tasso scritto è 2,25825%; con un
    valore già salvato prevale quello; e scrivendo 1,011 a mano sulla **ver115** si ottengono gli
    stessi numeri della ver116. **Zero errori di pagina.**
  - **Non regressione**: vm-A (21), vm-B (14), vm-C (13), vm-D (7), i 60 controlli delle aliquote,
    i 12 del fondo TFR, i 10 della casella «Anni» e il registro delle formule (9) — **tutti
    superati**.
- 🎚️ **«ANNI PER RIVALUTAZIONE TFR»: PARTE DA 1 E DICE A CHI SERVE** (ver115, 06/11/2026,
  Christian: «forse ANNI PER RIVALUTAZIONE TFR non va tra i valori comuni e forse va
  disabilitata?» → poi «va bene, procedi pure. Il valore comune però non sia 2, ma 1»).
  - **Il punto sollevato è giusto**: non è un'aliquota, è l'**anzianità**, cioè un dato della
    singola persona, e sta fra i valori comuni solo perché nasceva come manopola unica. Dalla
    ver114 serve **soltanto** a chi non ha scritto il «TFR accantonato al 31/12».
  - 🚫 **NON è stata spostata nella scheda della persona**: il valore salvato resterebbe orfano e
    si sposterebbe la *strada vecchia* proprio mentre quella nuova la rende inutile. Scartata,
    dopo averlo scritto a Christian.
  - 🚫 **NON è stata bloccata**: spegnerla davvero metterebbe a **zero, in silenzio**, la
    rivalutazione di chi il fondo non ce l'ha. Resta **scrivibile e giallina**, come la «% di ore
    supplementari» dalla ver75: cambia solo quello che **dice**.
  - **Cosa dice ora** (stesso meccanismo di `suppAttiva`): `senzaFondo` conta i dipendenti senza
    `costo.tfrFondo > 0`.
    - almeno uno → nota piccola grigia sotto la casella: «serve solo a chi non ha il fondo TFR
      scritto: **1 persona su 3**»;
    - nessuno → **etichetta grigia** (`#64748b`) e nota «**non in uso**: tutti hanno il fondo TFR
      scritto nella scheda».
  - 🔢 **`COSTO_COMUNE_DEF.anniTfr` da 2 a 1**, scelta di Christian. ⚠️ È solo il valore **di
    partenza**: se nei valori comuni c'è già un numero salvato, **quello resta** — va cambiato a
    mano nella casella e salvato con 💾.
  - **Misurato in esecuzione** (persona senza fondo, 15 h/sett., gen→dic 2026):
    | | casella «Anni» | rivalutazione | costo totale | €/h |
    |---|--:|--:|--:|--:|
    | ver114 | 2 | 45,99 € | 16.714,85 € | 19,35 |
    | **ver115** | **1** | **23,00 €** | **16.691,85 €** | **19,32** |
    ⚠️ Per **chi ha il fondo scritto non cambia niente** (verificato: 240,00 € · 16.908,86 € ·
    19,57 €/h, identici alla ver114).
  - **Provato in esecuzione** (`anni115.cjs`), **10 controlli su 10**: la casella parte da 1; la
    rivalutazione stimata si dimezza; la nota conta giusto (1 su 1 · 1 su 3); con **tutti** i
    fondi scritti l'etichetta diventa grigia e la nota dice «non in uso»; la casella resta
    scrivibile; col fondo la rivalutazione resta 240,00 €; ver114 e ver115 **identiche** su chi ha
    il fondo. **Zero errori di pagina.**
  - ✅ **ISTAT chiuso in ver116**: Christian ha confermato che **1,011 è una percentuale**.
- 💰 **LA RIVALUTAZIONE DEL TFR SI CALCOLA SUL FONDO VERO** (ver114, 06/11/2026). Christian ha
  chiesto «come si calcola la rivalutazione TFR? Noi l'abbiamo messa giusta?», poi «il più
  veritiero?» fra tre strade proposte, e ha dato **Nu\*** alla **numero 2**.
  - **La legge** (art. 2120 c.c.): si rivaluta il **FONDO TFR già accantonato al 31 dicembre
    dell'anno prima** — non la quota che matura adesso — al tasso **1,50% fisso + 75%
    dell'aumento ISTAT FOI** (dicembre su dicembre). Nell'anno in cui il rapporto finisce l'1,50%
    si conta a dodicesimi. L'**imposta sostitutiva del 17%** si toglie dal fondo del lavoratore,
    quindi **non** è un costo in più per l'azienda: giustamente l'app non la conta.
  - **Com'era (e resta, per chi non scrive il fondo)**: `J21 = quota TFR del periodo × «Anni per
    rivalutazione TFR» × (1,50% + 75% ISTAT)`. La **percentuale era giusta**, la **base no**: su
    una persona con 8.000 € di fondo la rivalutazione vera è ~240 €/anno, l'app ne metteva ~46.
    La casella «Anni» era in pratica una **manopola** da azzeccare a occhio.
  - **Ora**: nella scheda della persona, blocco *La retribuzione*, due caselle nuove —
    **«TFR accantonato al 31/12 €»** (`dp.costo.tfrFondo`) e **«TFR accantonato — anno»**
    (`dp.costo.tfrFondoAnno`). Se il fondo è scritto:
    `J21 = fondo × (1,50% + 75% × ISTAT) × mesi di rapporto ÷ 12`.
    ⚠️ **Se la casella è vuota non cambia assolutamente nulla**: resta la stima di prima
    (verificato su tre casi, numeri identici al centesimo).
  - 🧮 **`H6` = mesi in cui il RAPPORTO è in piedi**, non i mesi pagati (`o.mesiRapporto`, da
    `mesiInPeriodo(dp, pairs)` **senza** `senzaRapp`): il fondo si rivaluta **anche nei mesi
    tutti «AN»** del part-time verticale ciclico, perché il debito verso il lavoratore resta.
    Verificato: con luglio e agosto non pagati la rivalutazione resta su **12/12**, non 10/12.
    Se i mesi sono **scritti a mano**, anche questo conteggio segue quel numero.
  - 🚨 **Il fondo è un numero che invecchia, e l'app lo dice**: se manca l'anno, o se l'anno
    scritto non è quello **prima** del periodo guardato, compare un **avviso giallo** sotto le
    due caselle che nomina l'anno che servirebbe e dice se la rivalutazione risulta più bassa o
    più alta del vero. ⚠️ È **solo un avviso**: il conto si fa lo stesso col numero scritto.
  - **A lato della voce** la nota cambia di conseguenza: col fondo «fondo TFR al 31/12/2025
    8.000,00 € × (1,50% + 75% dell'ISTAT 2,00% = 3,00%) × 12,00/12 mesi di rapporto»; senza,
    «stima: quota TFR del periodo × 2 anni × (1,50% + 75% dell'ISTAT 2,00%)».
  - **Misurato in esecuzione** (15 h/sett., assunta 2018, gen→dic 2026, fondo 8.000 €):
    | | rivalutazione | costo totale | €/h |
    |---|--:|--:|--:|
    | casella vuota (come ver113) | 45,99 € | 16.714,85 € | 19,35 |
    | **fondo 8.000 €** | **240,00 €** | **16.908,86 €** | **19,57** |
    | lo stesso, periodo gen→giu | **120,00 €** (si dimezza) | — | — |
    ⚠️ **Per chi ha anzianità il costo orario sale**: non è un peggioramento, è che prima quel
    costo era **sottostimato**.
  - ⚠️ **Resta approssimato, ed è dichiarato**: per legge la quota che matura **quest'anno** si
    rivaluta solo dall'anno prossimo, e la rivalutazione si **capitalizza** anno su anno; qui si
    applica il tasso dell'anno in modo lineare. Sul singolo anno sono centesimi.
  - ⚠️ **L'ISTAT resta un numero che scrive Christian** («ISTAT anno prec. %», oggi 2,00%):
    l'app non lo legge da nessuna parte e non si aggiorna da sé. **Da controllare ogni anno.**
    Gli è stato chiesto due volte quale mettere e non ha ancora risposto.
  - 🚫 **Strade scartate**: la **1** (lasciare la manopola «Anni») e la **3** (dedurre
    l'anzianità dalla data di assunzione e stimare il fondo) — quest'ultima sembra automatica ma
    è una stima di una stima, e sbaglierebbe su passaggi di livello, part-time cambiati e
    anticipazioni già erogate. **Non riproporle.**
  - **Provato in esecuzione** (`tfr114.cjs`), **12 controlli su 12**: casella vuota → numeri
    identici alla ver113 su tre casi (normale · a pezzi · con mesi AN); fondo 8.000 € → 240,00 €
    con la nota giusta; avviso quando manca l'anno; avviso quando l'anno è sbagliato; nessun
    avviso con l'anno giusto; il costo orario sale; il **TFR maturato non cambia**; periodo
    dimezzato → rivalutazione dimezzata; mesi AN → 12/12; a pezzi la somma torna a 240,00 €.
    **Zero errori di pagina.**
  - **Non regressione**: rieseguiti vm-A (21), vm-B (14), vm-C (13), vm-D (7), i **60 controlli
    delle aliquote** della ver113, l'avviso giallo dei mesi (6), il registro delle formule e
    `R2` — **tutti superati**. Larghezza di pagina identica a 390, 1280 e 1680px.
    ⚠️ `par113.cjs` → `par114.cjs`: il controllo della rivalutazione ora riconosce **due**
    formule (col fondo e senza).
- 🧾 **OGNI VOCE DEL COSTO ORARIO DICE LA SUA ALIQUOTA** (ver113, 06/11/2026, richiesta di
  Christian: «nel riepilogo costo orario indica aliquote e parametri di riferimento che
  consentono il calcolo a lato di ogni voce: es inps 26,90 - fis 0,55, tredicesima 4 mesi, ore
  aggiuntive 56 ore etc»).
  - **Come si vede**: sotto il nome di ogni voce del dettaglio c'è una riga piccola grigia
    (**12,5px `#475569`**, il minimo consentito dal blocco leggibilità) con il parametro usato:
    «26,90% × 100,00% su imponibile II», «mensile fisso × 12/12 mesi di ratei», «244,36 h sul
    periodo × 12,6045 €/h (maggiorazione 27%)», «25,00 € × 12 cedolini»…
  - **Come è fatto**: oggetto **`par`** costruito in `CostoOrario` subito dopo `const r = d.res`,
    più `voce(lbl, val, forte, nota)` con un **quarto parametro facoltativo**. Senza `nota` la
    voce si disegna **esattamente come prima**. Helper nuovi: `pctTxt`, `nTxt`, `mesiTxt`, `dec4`.
  - ⚠️ **Nessun calcolo è stato toccato**: le scritte leggono `c` (aliquote comuni), `d` (dati
    della persona) e `r` (risultato), gli stessi numeri che `calcCosto` usa davvero. Verificato:
    gli importi della ver112 sono identici al centesimo (24.678,26 € · 38,08 €/h · 14.930,65 € ·
    23,04 €/h).
  - 🔢 **La paga oraria delle ore aggiuntive si scrive con QUATTRO decimali**, di proposito: con
    due (12,60 invece di 12,6045) il prodotto «ore × €/h» tornava **1,10 € più basso** della
    voce, e chi rifà il conto con la calcolatrice troverebbe un numero diverso. ⚠️ Anche le
    **percentuali** si scrivono per intero quando ne hanno più di due decimali: il FIS vale
    **0,53333%**, scrivere «0,53%» sarebbe un'aliquota diversa da quella usata.
  - ⚠️ **Resta qualche centesimo**, ed è scritto a video in fondo al dettaglio: i parametri sono
    arrotondati (il mensile fisso vero è 646,40916 €, scritto 646,41), quindi «646,41 × 12» dà
    7.756,92 contro i 7.756,91 della voce. **Gli importi sono quelli giusti**, è la scritta a
    essere arrotondata.
  - ⚠️ **Quando il periodo si taglia a PEZZI** (ver84) compare un **riquadro giallo** in fondo al
    dettaglio: le aliquote comuni valgono per tutti i pezzi, ma **livello, minimo, ore
    settimanali e addizionale** cambiano da pezzo a pezzo. Perciò: l'**addizionale** non mostra
    una percentuale ma «diversa in ogni pezzo: vedi «Come si divide il periodo»»; il mensile
    fisso si presenta come «**mensile fisso medio dei pezzi**»; e le voci che ne derivano possono
    scostarsi di poco (misurato: retribuzione **0,03 €**, festività non godute **0,92 €**).
  - **Due voci spiegano perché sono a zero**: previdenza complementare «1,50% su base TFR ×
    **quota a carico 0,00%**» e IRAP «3,90% × **quota a carico 0,00%**» — sono i valori comuni
    scelti da Christian il 06/11/2026 («non ho nessuno, cambieremo se necessario»). Allo stesso
    modo l'addizionale dice «non dovuta: contratto a tempo indeterminato» e l'assistenza
    sanitaria «non dovuta: contratto a tempo determinato».
  - 🚫 **L'export Excel del Costo orario NON è stato toccato** (Christian: «lascia pure»). Le
    aliquote si vedono solo a video.
  - 🚫 **DECISIONE DI CHRISTIAN (06/11/2026): la maggiorazione resta com'è.** Aveva fatto notare
    che «fino al 30 settembre 26 le ore aggiuntive erano pagate tra le ordinarie»; gli era stato
    proposto di togliere la maggiorazione per i mesi fino al 30/09/2026 tagliando il periodo in
    due. Ha risposto che prima **esisteva il criterio orario** (si pagavano in misura uguale le
    ore rese, più ferie e festività a parte) e di **«lasciar correre»**. Quindi l'app continua ad
    applicare **sempre** +27% (o 15% sul minimo a 38 h/sett.). **Non riproporlo.**
  - **Provato in esecuzione** (`par113.cjs`), **60 controlli su 60**, su tre casi
    (indeterminato · determinato con rimborso «secco» · determinato con promozione che si taglia
    in pezzi): per **ogni** voce l'importo è stato **ricalcolato dai numeri scritti nella nota**
    e confrontato con quello a video — retribuzione, 13ª, 14ª, festività, imponibile I, ore
    aggiuntive, imponibile II, TFR, 0,50%, rivalutazione, previdenza, INPS, FIS, INAIL, IRAP,
    assistenza, paghe, formazione, rimborso e la somma finale. **Zero errori di pagina.**
  - **Misurato**: larghezza di pagina **identica** alla ver112 a 390, 1280 e 1680px; il riquadro
    del dettaglio cresce in altezza (da 924 a 1.321px a 1280), perché sono 23 righe in più;
    **nessuna scritta sotto i 12,5px**.
  - **Non regressione**: rieseguiti i 21 controlli della parte A, i 14 della B, i 13 della C, i 7
    della D, i 6 dell'avviso giallo e tutto il registro delle formule — **tutti superati**.
    ⚠️ `vm-B.cjs` è stato **corretto**: leggeva l'importo come «la riga subito dopo il nome della
    voce», che ora è la riga del parametro; adesso cerca la prima riga che è un importo in euro.
- 🧊 **IL MESE TUTTO «AN» NON SI PAGA, MA IL RAPPORTO VA AVANTI** (ver112, 05/11/2026 —
  **regola definitiva, supera ver110 e ver111 dello stesso giorno**). La storia, da non rifare a
  rovescio:
  | | Christian | cosa faceva l'app |
  |---|---|---|
  | **ver109** | — | il mese tutto AN contava come un mese normale |
  | **ver110** | «se è tutto AN non c'è rapporto» | escluso da tutto |
  | **ver111** | «una dipendente, ma anche altri, ha magari AN su un mese ma il rapporto va avanti, mica si ferma» | solo segnalato, contato normalmente |
  | **ver112** | «il rapporto va avanti nel senso che riprenderanno a lavorare, in quanto indeterminate» + alla domanda se in quei mesi prendono lo stipendio: **«NO, non sono pagati»** | **non pagato**, ma il rapporto resta in piedi |
  È il **part-time verticale ciclico**: la persona è assunta a tempo indeterminato e riprenderà a
  lavorare, ma nei mesi fermi non esce la busta paga.
  - **Quando scatta**: `meseTuttoAN(state,dp,y,m)` è vero se **tutti** i giorni compilabili del
    mese (quindi **non** domeniche e festivi, che dalla ver77 non si compilano) portano il codice
    **`AN`**. ⚠️ Basta **una cella vuota, un'ora o un altro codice** e il mese torna a contare
    normalmente — provato: scrivendo 4 ore in un giorno di luglio i numeri tornano identici alla
    ver111 (12,00 mesi · 15.570,72 € · 19,56 €/h).
  - **Cosa NON si paga**: quel mese non dà **stipendio**, non matura **ratei** (ferie, 13ª, 14ª),
    non fa **cedolino** e le sue **festività non si contano**. `mesiInPeriodo`,
    `mesiRateiPeriodo`, `mesiCedolinoPeriodo` e `contaFestivita` ricevono di nuovo il parametro
    **facoltativo** `escludi` (`mesiSenzaRapporto` lo costruisce in `datiCosto`): **4 punti** in
    `datiCosto` più **4 nei blocchi**. Senza il parametro contano come prima.
  - ⚠️ **Il RAPPORTO invece resta intatto**: tipo di contratto, livello, ore settimanali,
    proroghe, addizionale TD e cessazione si leggono come prima — `indetAFine`, `oreSettPeriodo`,
    `livelloPeriodo` e `addizTDAuto` **non** ricevono `senzaRapp`. Le **date della scheda non si
    toccano**: servono solo se il rapporto davvero si interrompe.
  - **A video**, nella tabellina del contratto: riga **«Mesi non pagati»** — «Luglio 2026,
    Agosto 2026 — sono tutti «AN»: non sono pagati (nessuna busta paga), quindi sono fuori da
    stipendio, ratei, cedolini e festività. Il rapporto però resta in piedi: contratto, livello e
    ore settimanali non cambiano». (Dicitura nuova, scritta da Claude, non una dicitura storica.)
  - **Misurato in esecuzione** (15 h/sett., 72 h al mese nei 10 mesi lavorati, luglio e agosto
    tutti AN, periodo gen → dic):
    | | ver111 | **ver112** |
    |---|--:|--:|
    | mesi · ratei · cedolini | 12,00 · 12 · 12 | **10,00 · 10 · 10** |
    | retribuzione | 7.756,91 € | **6.464,09 €** |
    | 13ª · 14ª | 646,41 · 323,20 € | **538,67 · 269,34 €** |
    | paghe · assistenza sanitaria | 300,00 · 132,00 € | **250,00 · 110,00 €** |
    | formazione | 250,00 € | **250,00 €** (invariata: 250 per ogni anno iniziato) |
    | ore rese | 720,00 h | **720,00 h** |
    | costo totale | 14.291,98 € | **14.026,86 €** |
    | €/h | 19,85 | **19,48** |
  - ⚠️ **CONSEGUENZA DA SAPERE, ed è la cosa su cui Christian aveva chiesto un esempio** («se ci
    sono mesi con AN perché dovrebbero crescere le ore straordinarie?»). Con 10 mesi pagati
    invece di 12 scendono anche le **ore ordinarie lavorabili** (da 619,64 a 514,28 h), mentre le
    **ore rese restano 720**: la differenza che diventa **supplementare al +27%** passa da
    **100,36 h (1.265,02 €)** a **205,72 h (2.592,96 €)**. Il costo totale scende comunque
    (−265 €), perché lo stipendio scende di più (−1.293 €).
    È **aritmeticamente coerente**: 720 h in 10 mesi sono 72 h al mese contro ~51 lavorabili, e
    anche contando mese per mese il risultato sarebbe lo stesso. Il caso di prova è però estremo
    (72 h al mese su un contratto da 15 h/settimana): su ore realistiche la differenza è piccola.
    ⚠️ **Il conto mese per mese delle supplementari resta da fare** (vedi «🔜 DA FARE»): non
    risolve questo caso, ma toglie la compensazione fra mesi.
  - ⚠️ **Non tocca il Tabellone**: `AN` resta quello che era (0 ore, non è un'assenza, non
    consuma il Tetto annuo, il TOT teorico e il Tetto non si muovono — verificato). Cambia solo
    il **Costo orario**.
  - **Non regressione verificata in esecuzione**, ver111 contro ver112: con **nessun mese AN**
    i numeri sono **identici** (indeterminato 16.714,85 € · 19,35 €/h; determinato con
    promozione, periodo tagliato in 2 blocchi, 17.348,84 € · 20,08 €/h). Con i **blocchi** e due
    mesi AN la somma dei blocchi torna al periodo intero (102,86 + 102,86 = 205,72 h).
    Rieseguiti anche i 21 controlli della parte A, i 14 della parte B, i 13 della C, i 7 della D,
    i 6 dell'avviso giallo e tutto il registro delle formule: **tutti superati, zero errori di
    pagina**.
- 📈 **L'ADDIZIONALE SI FERMA ALLA FINE DEL RAPPORTO** (ver110, stessa richiesta: «ti do il via»).
  `addizTDAuto` e il conteggio delle proroghe usavano `fineperiodoYmd(pairs)`, cioè la **fine del
  periodo guardato**. Ora usano **`fineRapportoYmd(dp,pairs)`**, che si ferma alla **cessazione**
  se è prima. Anche i blocchi (`fineB`).
  - **Misurato** (contratto cessato il 30/06 con due proroghe registrate): la casella mostrava
    **2,40 %** guardando gen → dic e **1,90 %** guardando gen → giu; ora mostra **1,90 %** in
    tutti e due i casi. ⚠️ I **soldi non cambiano** in questo esempio (98,29 € e 8.504,10 € prima
    e dopo), perché il periodo si taglia in blocchi e ogni blocco usava già il suo addizionale:
    era la **percentuale a video** a mentire. Ma con il taglio in blocchi **disattivato** (valori
    scritti a mano) la differenza sarebbe diventata anche denaro.
- 🎌 **LE FESTIVITÀ SI CONTANO SOLO QUANDO IL CONTRATTO È IN PIEDI** (ver109, 05/11/2026,
  Christian: «non ti sembra che vada fatta una considerazione analoga a quella fatta per chi
  cessa prima della fine del mese o inizia durante il mese?»).
  - **Com'era**: `contaFestivita(pairs)` contava **tutte** le festività del periodo scelto. Una
    festività che cade quando la persona **non è assunta** entrava lo stesso nel conto, abbassava
    le ore ordinarie lavorabili e faceva crescere le ore aggiuntive (pagate al +27%).
  - **Ora**: `contaFestivita(pairs, dp)` salta i giorni in cui `inForceAt` è falso. Il secondo
    parametro è **facoltativo**: senza `dp` la funzione conta come prima. Lo passano i due punti
    che la usano (`datiCosto` e `blocchiPeriodo`). Anche il **4 novembre** (`FEST_NON_GOD_FISSE`)
    è soggetto alla stessa regola.
  - **È la stessa logica dei mesi parziali** (ver104): si conta solo ciò che cade dentro il
    rapporto di lavoro.
  - **Misurato in esecuzione**:
    | Caso | ver108 | **ver109** |
    |---|--:|--:|
    | contratto fino al **30/06**, periodo gen → dic | 8.777,08 € · 20,32 €/h | **8.471,81 € · 19,61 €/h** |
    | lo stesso, periodo gen → giu | 8.471,81 € · 19,61 €/h | **identico** |
    | assunta il **16/01**, periodo gen → dic | 12.491,55 € · 20,51 €/h | **12.407,42 € · 20,37 €/h** |
    | assunta il **20/01**, periodo gen → dic | 12.132,66 € · 20,22 €/h | **12.048,53 € · 20,08 €/h** |
    | in forza **tutto l'anno** | 13.080,54 € · 20,19 €/h | **identico** |
    ⚠️ **Il periodo scelto non cambia più il risultato** per i mesi fuori contratto: era il
    difetto segnalato poche ore prima.
  - ⚠️ **Per chi è in forza tutto il periodo non cambia nulla** (verificato).
  - **Non regressione**: rieseguiti i 21 controlli della parte A, i 14 della parte B, i 6
    dell'avviso giallo e il registro delle formule — **tutti superati, zero errori di pagina**.
- 🟡 **AVVISO QUANDO I MESI SONO SCRITTI A MANO** (ver108, 05/11/2026, chiesto da Christian —
  «avviso giallo ok» — dopo che la verifica aveva mostrato che un numero scritto a mano resta
  fermo mentre il periodo cambia).
  - **Dove**: nel Costo orario, **subito sotto la casella «Mesi di contratto»**, dentro la
    griglia (`gridColumn:"1 / -1"`, quindi occupa tutta la riga).
  - **Quando**: solo se la casella **è compilata** e il numero scritto **differisce** da quello
    calcolato sul periodo scelto (tolleranza 0,005). Se coincide, o se la casella è vuota,
    **non compare niente**.
  - **Cosa dice**: quale numero sta usando l'app, quale risulterebbe dal periodo (con il periodo
    scritto per esteso, es. «Gennaio 2026 → Dicembre 2026»), che **anche ferie, 13ª, 14ª e
    assistenza sanitaria** seguono il numero scritto (arrotondato) e che **i cedolini** sono
    l'arrotondamento per eccesso, e come tornare indietro: **svuotare la casella**.
  - **Dato nuovo**: `o.periodoLabel` in `datiCosto` (solo per scriverlo nell'avviso).
  - ⚠️ **Non cambia nessun calcolo**: il numero scritto a mano continua a prevalere, come prima.
    L'avviso serve solo a non farlo passare inosservato.
  - **Provato in esecuzione** (6 casi): senza niente scritto non compare; scrivendo 6 compare
    con lo sfondo `rgb(255,248,225)` e il bordo ambra; cambiando periodo **si aggiorna**
    (11,52 → 4,00); scrivendo il numero che coincide col calcolato **sparisce**; svuotando la
    casella **sparisce**. Rieseguiti anche i 21 controlli della parte A, i 14 della parte B e il
    registro delle formule: **tutti superati, zero errori di pagina**.
- 🐞 **«↺ RIMETTI I VALORI CALCOLATI» NON RIMETTEVA NIENTE** (ver107, 05/11/2026, difetto
  **preesistente dalla ver73**, trovato con la verifica meticolosa chiesta da Christian).
  - **Il difetto**: il pulsante faceva `setPar("settPeriodo","")` e poi `setPar("settLav","")`.
    Ogni chiamata parte dalla **stessa copia di `state`**, quindi la seconda **cancellava il
    lavoro della prima**: restava svuotato solo `settLav`, e la simulazione delle settimane non
    si spegneva più. È **la stessa trappola** già incontrata in ver99 con il permesso.
  - **La correzione**: **`onCostoPatchMulti(dipId, campi)`** scrive più campi in **una sola
    copia** dello stato; dentro `CostoOrario` c'è `setParMulti`. `onCostoPatch` e `setPar`
    **restano invariati** e li usano ancora tutte le altre caselle.
  - **Provato in esecuzione**: scrivendo 20 nelle «Settimane del periodo» il costo passa da
    **39,40 a 50,76 €/h**; premendo ↺ **prima** restava 50,76 con la casella ancora a 20, **ora**
    torna **39,40** e le due caselle si svuotano.
  - ⚠️ **Regola da ricordare**: in questa app **due scritture di fila nello stato non funzionano**.
    Se una cosa cambia due campi, serve un gestore che li scriva insieme.

- 🔎 **VERIFICA METICOLOSA DI TUTTA L'APP (Vm\*) — ver107, 05/11/2026.** Chiesta da Christian
  («Vm\* che tutto si aggiorni e funzioni»). **55 controlli in esecuzione** con Playwright,
  divisi in quattro script (`vm-A.cjs`, `vm-B.cjs`, `vm-C.cjs`, `vm-D.cjs`), **tutti superati**,
  **zero errori di pagina**:
  - **A (21)** — le cinque viste si aprono; scrivere ore aggiorna TOT, TOT teorico e Risultato
    del mese; il numerino erosivo si spegne e si riaccende; il permesso apre la finestra, la
    spunta «servizio chiuso» abbassa il TOT teorico e toglierla lo rialza; il Tetto annuo mostra
    i numeri; Note del mese (categoria + testo); Compila veloce riempie il mese; Blocca/Sblocca
    mese disabilita e riabilita 90 celle.
  - **B (14)** — Costo orario: si apre coi numeri; cambiare periodo cambia mesi/costo/€/h e
    **tornando indietro i numeri tornano identici**; cambio persona; le tre fonti delle ore
    (Riepiloghi · a mano → «non calcolabile» · teoriche); il riquadro «Come si divide il
    periodo»; le aliquote comuni (43 caselle); la simulazione delle settimane e il ↺; export
    Excel.
  - **C (13)** — Anagrafica: 52 campi; massimale **servizio per servizio** che somma mentre
    scrivi e si salva; proroga aggiunta; colore; 💾 segnala e salva davvero; Backup JSON;
    Riepiloghi (5 tabelle con numeri); Query personale senza «undefined».
  - **D (7)** — Report PDF A4 con il **finto jsPDF**: la finestra si apre e il codice gira
    **senza errori**; backup → import: i dati tornano come prima (57,00 → 48,00); cambio mese e
    ritorno.
  - **Registro delle formule rieseguito**: 9 formule, `R2` su 9 casi, somma delle voci su 7 casi,
    finestra del periodo 120,000 — **stessi numeri**.
  - ℹ️ **Due difetti PREESISTENTI misurati e NON corretti** (identici nella ver102 pubblicata, non
    causati da queste versioni): a **390px** la vista **Anagrafica** scorre di lato (**724px**,
    colpa della riga dei pulsanti «Genera documento: 📄 Contratto…») e il **Costo orario** arriva
    a **429px** (già noto dalla ver85). **Da decidere con Christian** se sistemarli.
  - ⚠️ **Non verificabile da qui**: il disegno vero del Report PDF e il collegamento a Firebase
    (le prove girano in modalità locale con PIN).
- 🧾 **IL CEDOLINO ESCE COMUNQUE** (ver106, 05/11/2026, Christian: «paghe è fisso, se fai 3
  giorni o 30 il cedolino esce lo stesso e il costo c'è. La formazione segue l'indicazione già
  data: va fatta comunque»).
  - **Terzo conteggio dei mesi**: **`mesiCedolinoPeriodo`** = i mesi con **almeno un giorno** di
    contratto. Dentro `calcCosto` è **`H4`**, e lo usa **solo** `J31` (*Paghe e dichiarazioni*).
    Se i mesi sono scritti a mano si arrotonda **per eccesso** (un mese iniziato è un cedolino).
  - **La formazione non è stata toccata**: resta `250 × max(1, ceil(mesi/12))`, cioè 250 € per
    ogni anno iniziato e **almeno uno** anche per un contratto di pochi giorni. Provato: 250,00 €
    in tutti i casi, compreso quello da 0,387 mesi.
  - **Misurato in esecuzione** (25 €/mese di paghe):
    | | mesi prop. | ratei | **cedolini** | paghe ver105 | **paghe ver106** |
    |---|--:|--:|--:|--:|--:|
    | tutto l'anno | 12,00 | 12 | 12 | 300,00 € | **300,00 €** |
    | dal **16/01** | 11,52 | 12 | **12** | 287,90 € | **300,00 €** |
    | dal **20/01** | 11,39 | 11 | **12** | 284,68 € | **300,00 €** |
    Costo totale: 12.479,45 → **12.491,55 €** (dal 16/01) e 12.117,33 → **12.132,66 €**
    (dal 20/01). Per chi c'è tutto l'anno **non cambia nulla**.
  - **A video** la riga del contratto dice ora: «in forza per **11,52 mesi** · ratei (ferie, 13ª,
    14ª) su **12 mesi** · **12 cedolini**».
  - **I tre conteggi ora ci sono tutti e si vedono**: giorni veri · ratei · cedolini.
- 🏥 **L'ASSISTENZA SANITARIA STA COI RATEI** (ver105, 05/11/2026, Christian: «assistenza
  sanitaria come ferie, permessi e ratei vari»). In ver104 era finita fra le voci
  **proporzionate ai giorni veri**; è stata rimessa sui **mesi che maturano i ratei** (almeno 15
  giorni), insieme a ferie, permessi, tredicesima e quattordicesima. Una riga sola: `J30` usa
  **`H3`** invece di `H2`.
  - **Misurato in esecuzione** (132 €/anno, indeterminati):
    | | mesi proporzionati | ratei | ver104 | **ver105** |
    |---|--:|--:|--:|--:|
    | tutto l'anno | 12,00 | 12 | 132,00 € | **132,00 €** |
    | dal **16/01** | 11,52 | **12** | 126,68 € | **132,00 €** |
    | dal **20/01** | 11,39 | **11** | 125,26 € | **121,00 €** |
    Costo totale: 12.474,12 → **12.479,45 €** (dal 16/01) e 12.121,59 → **12.117,33 €**
    (dal 20/01). Per chi c'è tutto l'anno **non cambia nulla**.
  - ⚠️ **Paghe e dichiarazioni** (`J31`) e gli **anni di formazione** (`J32`) restano sui **mesi
    proporzionati**: Christian ha nominato solo l'assistenza sanitaria.
- ⚖️ **DUE CONTEGGI DEI MESI: I GIORNI VERI E I RATEI** (ver104, 05/11/2026, Christian: «la
  retribuzione è tarata sui gg veri, tutto il resto è proporzionato, ma ferie, 13ma e 14ma
  maturano solo se ci sono almeno 15gg»). È la regola **definitiva**; supera la ver103.
  - **`mesiInPeriodo`** ora torna i **mesi PROPORZIONATI ai giorni veri**: per ogni mese,
    `giorni in forza ÷ giorni del mese` (`meseFrazione`). Esempio: assunta il 16/01 → gennaio
    vale 16/31 = 0,516 → **11,52 mesi** sull'anno.
  - **`mesiRateiPeriodo`** (nuova) torna i **mesi interi che maturano i ratei**: contati solo se
    il contratto copre **almeno 15 giorni** (`meseConta`, invariata dalla ver103).
  - **Chi usa quale**, dentro `calcCosto`:
    | | conteggio |
    |---|---|
    | retribuzione mensilizzata, malattia presunta, settimane del periodo, premi, ore aggiuntive, TFR, contributi (INPS, FIS, INAIL, IRAP, addizionale), rimborso km «al mese», anni di formazione | **H2 = mesi proporzionati ai giorni veri** |
    | **ferie e permessi** (dentro `O6calc`), **tredicesima** (`J6`), **quattordicesima** (`J8`), **assistenza sanitaria** (`J30`, da ver105) | **H3 = mesi con almeno 15 giorni** |
    | **paghe e dichiarazioni** (`J31`, da ver106) | **H4 = mesi con almeno un giorno** |
  - ⚠️ **`H3` non è più `Math.round(H2)`**: è un numero suo (`o.mesiRatei`). Se i mesi sono
    **scritti a mano**, i ratei seguono quel numero arrotondato, altrimenti i due si
    contraddirebbero.
  - **Anche `blocchiPeriodo`** passa a ogni blocco i **due** conteggi, così la somma dei pezzi
    torna al periodo intero.
  - **A video**: nella tabellina del contratto si legge «in forza per **11,52 mesi** · ratei
    (ferie, 13ª, 14ª) su **12 mesi**», e l'aiutino sotto *Mesi di contratto* dice
    «proposti: 11,52 (giorni veri) · ferie, 13ª e 14ª su 12».
  - **Misurato in esecuzione** (15 h/sett., gen→dic 2026, ore vere di ciascuno):
    | | ver102 (un giorno = mese pieno) | ver103 (tutto o niente) | **ver104** |
    |---|--:|--:|--:|
    | in forza **tutto l'anno** | 13.080,54 € · 20,19 €/h | identica | **identica** |
    | dal **16/01** (16 gg a gennaio) | 12.603,30 € · 20,70 €/h | 12.603,30 · 20,70 | **12.474,12 € · 20,48 €/h** |
    | dal **20/01** (12 gg a gennaio) | 12.603,30 € · 20,70 €/h | 12.161,39 · 20,27 | **12.121,59 € · 20,20 €/h** |
    Nel caso «dal 16/01» la **13ª e la 14ª restano piene** (646,41 e 323,20) perché gennaio ha
    16 giorni; nel caso «dal 20/01» scendono a 592,54 e 296,27 (11 mesi di ratei). La
    retribuzione invece scende in **tutti e due** i casi, perché segue i giorni veri.
  - **Caso limite**: assunta il 20/12 con periodo annuale → 0,387 mesi → retribuzione 250,16 €
    (nella ver103 era 0,00), **nessun NaN**.
  - ⚠️ **Per chi lavora mesi interi non cambia assolutamente nulla** (verificato).
  - **Non regressione**: registro delle formule del Tabellone **rieseguito sulla ver104**,
    stessi numeri.
- 📆 **IL MESE PARZIALE NON VALE PIÙ UN MESE INTERO** (ver103, 05/11/2026, Christian: «se uno
  cessa prima della fine del mese o inizia durante un mese, la retribuzione non è quella
  completa mensile»).
  - **Com'era**: `mesiInPeriodo` contava il mese se il contratto era in piedi **il primo oppure
    l'ultimo giorno**. Bastava **un giorno**: chi veniva assunto il 25 si portava dietro un mese
    pieno di stipendio, tredicesima, quattordicesima, TFR, contributi, malattia presunta e
    settimane lavorabili.
  - **Prima regola (ver103)**: il mese valeva 1 solo con almeno 15 giorni, altrimenti 0.
    ⚠️ **SUPERATA LO STESSO GIORNO dalla ver104** (vedi sotto), che divide le due cose: la
    retribuzione segue i **giorni veri**, il «almeno 15 giorni» resta **solo** per ferie, 13ª e
    14ª. La ver103 **non è mai arrivata su `main`**.
  - **Funzioni nuove**: `giorniInForzaMese(dp,y,m)` (conta i giorni con `inForceAt`) e
    **`meseConta(dp,y,m)`** (1 o 0). `mesiInPeriodo` le usa; **anche `blocchiPeriodo`** usa
    `meseConta`, altrimenti la somma dei blocchi non tornerebbe al periodo intero.
  - 🛡️ **Guardia nuova**: con **0 mesi contati** `E18` non divide più per zero
    (`(H2>0)? … : 0`). Provato: persona assunta il 20/12 con periodo annuale → retribuzione
    0,00 €, costo 376,60 € (solo le spese fisse), **nessun NaN**.
  - ⚠️ **Conseguenza da sapere**: le **ore** di quel mese continuano a contare (vengono dai
    Riepiloghi), ma la **retribuzione no**. Quindi un mese sotto i 15 giorni **abbassa** il €/h.
    È la conseguenza inevitabile della regola «tutto o niente» scelta; con i ventiseiesimi non
    succederebbe. **Christian lo sa: gliel'ho scritto.**
  - **Misurato in esecuzione** (3 persone identiche, 15 h/sett., gennaio→dicembre 2026, stesse
    ore nei Riepiloghi, cambia solo la data di assunzione):
    | | ver102 | **ver103** |
    |---|--:|--:|
    | assunta **01/01/2024** (tutti i mesi) | 13.080,54 € · 20,19 €/h | **identica** |
    | assunta **16/01/2026** (16 gg a gennaio) | 13.080,54 € · 20,19 €/h | **identica** (il mese conta) |
    | assunta **20/01/2026** (12 gg a gennaio) | 13.080,54 € · 20,19 €/h | **12.969,02 € · 20,01 €/h** |
    Cessazioni: **10/12** → il mese **non** conta (retribuzione 7.110,50 invece di 7.756,91);
    **20/12** → il mese conta, numeri invariati.
  - ⚠️ **I costi orari calcolati finora su persone assunte o cessate a metà mese erano
    sovrastimati.** Per chi lavora mesi interi **non cambia niente** (verificato).
  - **Non regressione**: registro delle formule del Tabellone **rieseguito sulla ver103**,
    stessi numeri.
- ⛔ **LE SCRITTE NON AMMESSE NON ENTRANO PIÙ** (ver102, 05/11/2026, Christian: «volevo dire
  *inibiamo*»). La ver101 le **segnalava**; la ver102 le **impedisce**. Il rosso della ver101
  **resta**, perché serve ancora per le scritte **già nei dati** di prima.
  - **Due tabelle nuove**, costruite da `CODICI` subito dopo `CODE_SET`: **`CODE_UP`** (la
    scritta in maiuscolo → il codice vero) e **`CODE_PREFIX`** (tutti i pezzi iniziali dei
    codici). ⚠️ `CODE_UP` serve per due motivi: chi scrive «ferie» intende FERIE, e il codice
    **`ASP 0h` ha la h minuscola**, quindi non basta fare `toUpperCase()`.
  - **`cellaScritturaAmmessa(t)`** — va bene **come pezzo** mentre si scrive: vuoto, un numero
    anche a metà (`^\d{0,2}([.,]\d{0,2})?$`) o **l'inizio di un codice**. ⚠️ Senza i prefissi
    non si potrebbe battere «FERIE», perché si passa per F, FE, FER, FERI.
  - **`cellaValoreFinale(t)`** — all'uscita dalla cella: torna il **codice vero** (con le
    maiuscole giuste), il **numero**, oppure **`null`** se non è ammesso.
  - **Cosa succede in `CellInput`**: mentre si scrive, un carattere non ammesso **non entra**
    (la casella trema, bordo rosso `.cell-in.rifiutata`) e compare l'avviso in basso; all'uscita
    «ferie» diventa **FERIE**, «asp 0h» diventa **ASP 0h**, e un pezzo rimasto a metà («FER»)
    viene **tolto** dicendolo (««FER» non è un codice né un numero: la cella è stata lasciata
    vuota»).
  - 🛡️ **Un dato vecchio NON viene cancellato** solo perché ci si entra e si esce: `iniz`
    (`useRef`) ricorda com'era la cella all'ingresso, e se non è stata toccata resta lì,
    segnalata in rosso dalla ver101. Serviva a non violare la regola «niente cancellazioni a
    secco» del §10.1.
  - **L'avviso arriva a video**: `onAvviso` passa da `App` (`showToast`) a `EmployeeCard` e da
    lì a `CellInput`. Un rifiuto silenzioso sarebbe stato peggio del difetto.
  - ⚠️ **Conseguenze volute**: non si possono più scrivere **più di due cifre** prima della
    virgola (999 rifiutato: in un giorno non si fanno 999 ore) né **numeri negativi**; incollare
    «MALATTIA» o una frase **non scrive nulla**; battendo «MALATTIA» ci si ferma a **MAL**, che
    è il codice giusto. **Compila veloce non passa da qui** e funziona come prima (provato).
  - **Provato in esecuzione**: CIAO → resta «CA» e all'uscita la cella si svuota con l'avviso ·
    FERIE → FERIE · ferie → **FERIE** · 6,5 → 6,50 · asp 0h → **ASP 0h** · FER → svuotata con
    l'avviso · MALATTIA battuto → **MAL** · incollati «MALATTIA», una frase lunga, «-3» e «999»
    → **non entrano** · «12,75» entra · il «MALATTIA» **già nei dati**, aperto e lasciato, resta
    e resta rosso. Zero errori di pagina.
  - **Non regressione**: registro delle formule **rieseguito sulla ver102**, stessi numeri.
- 🚨 **LE SCRITTE NON RICONOSCIUTE SI VEDONO** (ver101, 05/11/2026, Christian: «iniziamo nel
  tabellone testi che non siano i codici permessi», dopo che il controllo sulle formule aveva
  trovato il difetto).
  - **Il problema**: in una cella si poteva scrivere **qualunque cosa** («MALATTIA» per esteso
    invece di `MAL`, «pippo», un appunto). `CellInput` ha la tendina dei codici ma **non
    validava**: quel giorno valeva **0 ore** e **non contava come assenza** — non copriva il
    monte ore, non consumava il tetto — e **nessuno lo diceva**.
  - **Funzioni nuove** (sopra `eroOn`): **`isCellaIgnota(v)`** (vero se la cella non è vuota, non
    è un codice di `CODE_SET` e non è un numero) e **`celleIgnoteMese(rec,y,m)`** (l'elenco dei
    giorni).
  - **A video, due segnali**: la casella diventa **rossa piena con bordo spesso**
    (`.cell-in.ignota`) e il messaggio al passaggio del mouse spiega tutto; sopra la griglia
    compare una **fascia rossa** (`.ignote-box`) che elenca i giorni e ciò che c'è scritto
    («9 (MALATTIA) · 10 (pippo)») e ripete la conseguenza.
  - ⚠️ **La scrittura NON viene rifiutata**, di proposito: battendo «FERIE» si passa per «F»,
    «FE», «FER»… e rifiutare cancellerebbe quello che si sta scrivendo. Il rosso compare **solo
    quando si esce dalla cella** (`!foc`). Se Christian vuole il blocco vero si fa, ma va deciso.
  - ⚠️ **Nessun calcolo è stato toccato**: una scritta ignota continua a valere 0 ore come prima.
    È solo che adesso si vede. `--` e `AN` restano codici validi e non vengono segnalati.
  - **Provato in esecuzione**: con `FERIE`, `MAL`, `--`, `MALATTIA` e `pippo` nello stesso mese
    vengono segnalate **solo le ultime due**; il messaggio e la fascia dicono i giorni giusti;
    scrivendo «FER» a metà parola **non** diventa rossa; finendo di scrivere «FERIE» resta
    pulita; scrivendo «CIAO» diventa rossa e la fascia passa a 3. Zero errori di pagina.
  - **Non regressione**: l'intero registro dei controlli sulle formule è stato **rieseguito sulla
    ver101** e dà gli **stessi numeri** (9 formule, R2 su 9 casi, somma delle voci su 7 casi,
    finestra del periodo 120,000).
- 🧱 **IL MASSIMALE SI PUÒ SCRIVERE SERVIZIO PER SERVIZIO** (ver100, 05/11/2026, richiesta di
  Christian: «sarebbe bello che esso derivasse dalla somma di servizi da me inseriti
  singolarmente … più celle, una per servizio, con il loro massimale proprio, che danno poi un
  massimale complessivo». **Nu\* dato.**)
  - **Dati**: una voce di `tettiAnnui` può portare con sé `voci: [{nome, ore}]`. Il campo `ore`
    del massimale **resta quello di sempre, già sommato**, quindi `tettiList` e `tettoForPeriod`
    **non cambiano** e **nessun calcolo è stato toccato**. `patchTetti` ricalcola `ore` dalla
    somma delle voci ogni volta che salva.
  - **Funzioni nuove** (sopra `tettoStartYear`): `tettoVoci(t)`, `tettoVociSomma(voci)`,
    `tettoEntryForPeriod(dp,y,m)` (gemella di `tettoForPeriod`, ma torna la voce intera).
  - **A video**: nel modulo «+ Aggiungi massimale» c'è il riquadro «Oppure scrivilo servizio per
    servizio» con «+ Aggiungi servizio»; appena c'è una riga, la casella *Ore massime nell'anno*
    diventa **di sola lettura** e mostra la somma. Nell'elenco, sotto il massimale, si legge
    «CAG 200,00 h · CASA DI QUARTIERE 208,50 h»; lo stesso dettaglio compare nel riquadro
    **🎯 Tetto annuo** della vista del mese, sotto la barra («Come è diviso: …»).
  - ⚠️ **Il dettaglio vale solo per l'ASSEGNAZIONE.** Quante ore ha consumato ciascun servizio
    l'app **non lo sa**: nel Tabellone il giorno è **un numero solo** e non porta il servizio.
    Christian lo sa (gli è stato scritto prima di costruire) e il riquadro lo dice a video.
    Per il consumo per servizio servirebbe cambiare il modello dei dati (una riga per servizio
    per ogni giorno): **non fatto, da decidere**.
  - **Validazione**: una riga vale solo se ha **nome e ore > 0**; le righe del tutto vuote si
    buttano in silenzio, quelle a metà **fermano** il salvataggio con il messaggio «In ogni riga
    per servizio servono sia il nome sia le ore (maggiori di zero)».
  - **La strada vecchia resta**: senza righe, si scrive il totale e basta — provato.
  - **Provato in esecuzione**: 200 + 208,5 → totale **408,50** mostrato mentre si scrive e
    salvato; elenco con il dettaglio; nel mese «Massimo dell'anno: 408,500 h» e «Come è diviso:
    CAG 200,00 h · CASA DI QUARTIERE 208,50 h»; un massimale **vecchio** (solo numero, 300 h) si
    comporta **esattamente come prima**; la ✕ cancella il massimale giusto e **le voci degli
    altri restano**. Zero errori di pagina.
- 🧭 **COME SI DIVIDONO I MASSIMALI FRA LE DUE APP** (decisione di Christian, 05/11/2026):
  **Fogli ore** → massimali **solo per i collaboratori esterni** (per servizio, con *METTI UN
  TETTO*), perché loro non hanno ferie né altro di retribuito ed erosivo. **Dipendenti** →
  **massimale complessivo** per persona, scritto anche servizio per servizio (ver100). Quando si
  preme 📤 Pubblica i residui, **il dipendente vede solo il residuo complessivo**: va bene così.
- 🎄 **ANCHE IL PERMESSO PUÒ ESSERE NON EROSIVO** (ver99, 05/11/2026, Christian: «potrebbe essere
  di un giorno durante le vacanze natalizie in luogo del giorno di ferie, quindi è erosivo o non
  erosivo anche esso»).
  - **Il contrassegno è del GIORNO, non della scrittura**: si usa lo stesso `rec.ero[d]` delle
    assenze. Dice «quel giorno il servizio era aperto/chiuso» e vale per **tutto** ciò che sta su
    quel giorno. Se lo stesso giorno ha un'assenza **e** un permesso, il barrato vale per
    entrambi — ed è giusto così, perché il servizio o era aperto o non lo era.
  - **Dove si spegne**: nella finestra del permesso, spunta **«Quel giorno il servizio era
    chiuso»** (dicitura nuova, di Claude: non è una dicitura storica di Christian). La targhetta
    viola nel Tabellone diventa **barrata e grigia** (`.perm-lbl.no-ero`), come il numerino delle
    assenze.
  - **Funzione nuova `permOreEroseMese(rec)`** (sotto `isAbsCell`): ore di permesso retribuito
    delle **sole** giornate erosive. La usano `prodottoMese` (Tetto annuo) e il totale teorico
    del Tabellone. ⚠️ **`permOreMese` NON è stata toccata**: il Risultato del mese continua a
    contare **tutti** i permessi retribuiti, come lo straordinario conta tutte le assenze.
  - ⚠️ **Trappola evitata**: il permesso e il contrassegno si salvano con **una sola copia dello
    stato** (`onPermSaveEro`). Chiamare `onPermSave` e poi `onEro` **non funziona**: partono
    tutte e due dalla stessa copia di `state` e la seconda cancella il lavoro della prima.
  - **Provato in esecuzione** (stesso caso della ver98, 2 h di EXF il giorno 10):
    | | prima | spunta messa | spunta tolta |
    |---|--:|--:|--:|
    | TOT teorico | 114,020 | **112,020** | 114,020 |
    | Tetto annuo «Già usate» | 474,020 | **472,020** | 474,020 |
    | Risultato del mese | −11,233 | **−11,233** | −11,233 |
    Riaprendo la finestra il permesso è ancora lì (2 h, EXF) con la spunta accesa; la targhetta
    risulta barrata. Zero errori di pagina.
- ⏲️ **IL PERMESSO RETRIBUITO CONSUMA IL TETTO ANNUO** (ver98, 05/11/2026, decisione di
  Christian: «il permesso potrebbe essere anche per tutto il giorno, funzionando quindi come il
  giorno di ferie; e a mio avviso consuma certamente anche se è di un'ora»).
  - **`prodottoMese`** (l'unica funzione che alimenta il Tetto annuo) ora fa:
    `totOfRec + oreEroseMese + permOreMese(rec).pagate`. Il **totale teorico** del Tabellone
    (ver97) somma gli stessi tre pezzi: i due numeri devono restare uguali, è il loro senso.
  - ⚠️ **Contano solo i cinque tipi della tendina** (EXF, LUTTO, ELEZ, ESAMI, SIND). Quelli con
    il **tipo scritto a mano** no: non si sa se sono retribuiti — stessa regola del Risultato del
    mese (ver93). Provato: 1,5 h di «VISITA MEDICA» **non** entrano.
  - ⚠️ In ver98 il permesso **non** aveva il barrato erosiva/non erosiva; **dalla ver99 ce l'ha**
    (vedi sotto): Christian ha fatto notare che un permesso può essere preso **durante le
    vacanze** al posto di un giorno di ferie.
  - ⚠️ **`coverAbsHours` e `bancaMeseA` (lo straordinario) NON sono stati toccati**, e il
    **Risultato del mese non cambia**: provato, −11,233 h prima e dopo.
  - ⚠️ **I residui già pubblicati sono ora vecchi**: chi ha permessi registrati consuma di più.
    Va premuto di nuovo **📤 Pubblica i residui**.
  - **Due scritte aggiornate** perché sarebbero diventate false: la riga in fondo al Tabellone
    («TOT teorico (assenze erosive + permessi retribuiti)») e la riga esplicativa del riquadro
    🎯 Tetto annuo («Si consuma con le ore fatte (dal foglio), con ferie e malattia e con i
    permessi retribuiti»). Sono due scritte **nate ieri e oggi**, non diciture storiche di
    Christian.
  - ⚠️ **NON toccata la frase corrispondente in Fogli ore** («Comprende le ore fatte e le assenze
    retribuite dei giorni in cui il servizio era aperto»): è l'app degli esterni, e la frase non
    è falsa, solo incompleta. **Da decidere con Christian.**
  - **Misurato in esecuzione** (tetto 400 h, a.s. 2026/27; novembre: 102 h rese, 3 FERIE di cui
    una spenta, 2 h di EXF, 1,5 h di permesso scritto a mano):
    | | ver97 | **ver98** |
    |---|--:|--:|
    | TOT teorico del mese | 112,020 | **114,020** |
    | Tetto annuo «Già usate» | 472,020 | **474,020** |
    | Risultato del mese | −11,233 | **−11,233** |
    | TOT calcolato (ore rese) | 102,00 | **102,00** |
- 🧮 **IL TOTALE TEORICO NEL TABELLONE** (ver97, 05/11/2026, richiesta di Christian: «sotto il
  totale delle effettive mettimi anche il totale teorico comprendente le assenze retribuite
  erosive»). Numero nuovo **a video in due posti** (scelta di Christian: «in entrambi i posti»):
  - **nella cella TOT** della griglia, sotto il numero grande: «teor. 112,02» (classe `.tot-teor`);
  - **nella riga in fondo**, accanto a «TOT calcolato»: «TOT teorico (con assenze retribuite
    erosive): 112,020» (classe `.foot-teor`).
  - **Come si calcola**: `totTeor = R2(tot + oreEroseMese(rec,dp,y,m), 3)`, cioè ore effettive
    **più** le ore delle sole giornate di assenza **EROSIVE** (quelle non barrate col clic). È
    **esattamente** il numero che consuma il Tetto annuo (`prodottoMese`), così i due si leggono
    insieme. `oreErose` è in un `useMemo`, `totTeor` e il testo del suggerimento (`TEOR_TITLE`)
    stanno accanto a `tot` in `EmployeeCard`.
  - ⚠️ In ver97 i permessi orari **non** ci entravano; **dalla ver98 sì** (vedi sotto). Il
    Risultato del mese resta comunque **identico**: provato, le cinque pastiglie non si muovono
    di un millesimo.
  - ⚠️ **Nessun calcolo preesistente toccato**: si somma e si mostra. `totOfRec`, `oreEroseMese`,
    `prodottoMese`, `coverAbsHours` **invariati**.
  - **Misurato in esecuzione** (persona a 30 h/sett., novembre 2026: 17 giorni da 6 h = 102,00 h,
    3 giornate di FERIE di cui **una spenta** col clic): cella «102,00 | teor. 112,02», riga in
    fondo «112,020» = 102 + 2 × 5,010. Confronto ver96 → ver97: **riga della tabella identica**
    (54px), tabella da 2.183 a **2.191px** (dentro `.grid-wrap` che già scorre), **larghezza di
    pagina identica** (1500px), altezza 2.604 → 2.607px. Zero errori di pagina.
- 🟡 **IL PULSANTE «📤 Pubblica i residui» SI VEDE** (ver97, 05/11/2026, Christian: «non vedo bene
  il pulsante pubblica residui … mettimelo in sfondo giallo e scritta in blu elettrico»). Era
  `.btn-gray` (grigio #e5e7eb su #374151) in mezzo ad altri pulsanti grigi. Ora **`.btn-yellow`**:
  sfondo **#fde047**, scritta **#0033ff** (blu elettrico), più un filetto interno dello stesso blu.
  Contrasto **5,45:1**, sopra il minimo di 4,5. Misurato in esecuzione: `rgb(253,224,71)` /
  `rgb(0,51,255)`. **Dicitura invariata.**
  - 🚫 **NON è stato reso automatico**, pur avendolo lui ipotizzato («potrebbe anche sempre essere
    attivo senza doverlo schiacciare»): la pubblicazione scrive nella collection `residui` del
    progetto **condiviso con gli esterni**, ed è l'unica scrittura che questa app fa fuori dal
    proprio documento. Automatizzarla violerebbe il §10.1 («mai salvataggio automatico») e
    toglierebbe la **conferma nome per nome**. **In attesa di decisione di Christian.**
  - ⚠️ **Limite segnalato da Christian il 05/11/2026 e NON ancora risolto**: un dipendente può
    avere **alcuni servizi con un tetto e altri senza**, e il Tetto annuo **mescola i servizi**;
    quello che l'operatore vede in Fogli ore è quindi **un tetto complessivo**, non diviso per
    servizio, e per chi ha lavori fuori dal tetto può risultare **non veritiero**. Oggi il
    pulsante pubblica **tutti** quelli che hanno un tetto, senza poter scegliere chi. **Da
    decidere con Christian** prima di toccare qualcosa.
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
  - La **legenda** in fondo al PDF non nominava più la «P» e spiegava il formato ora,minuti.
    🚫 **In ver95 (05/11/2026) la riga di legenda è stata TOLTA del tutto**, su richiesta di
    Christian («sopprimi la legenda nel pdf»). Restano il titolo, il blocco RECUPERO / ORE NUOVE,
    le NOTE DEL MESE, i permessi orari e l'avviso sugli orfani. **Non rimetterla.**
    ⚠️ I tre `setFontSize`/`setTextColor`/`setFont` che la precedevano **sono rimasti**: li usano
    i blocchi che seguono, che non li reimpostano tutti.
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
  - ✅ **Le regole SONO state pubblicate** (verificato il 07/11/2026: Christian ha incollato il
    testo in vigore nella console e risulta identico a
    `regole-firestore/regole-residui-03nov26.rules`, rieseguito l'emulatore ufficiale su quel
    testo: **51/51**). Da qui in avanti il pulsante può scrivere davvero. ⚠️ **Va premuto**: i
    residui pubblicati prima della ver98 sono vecchi, perché ora il tetto lo consumano anche i
    permessi retribuiti.
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

## Chi non lavora alcuni mesi dell'anno (misurato il 05/11/2026 sulla ver108)

Domanda di Christian su un caso vero («non lavora luglio e agosto. Come calcoli il suo costo?»).
Dipende **da cosa c'è scritto nella scheda**, e i numeri sono questi (15 h/sett., 72 h al mese
nei mesi lavorati, livello D1):

| Situazione | Periodo scelto | Mesi contati | Ore | Costo | €/h |
|---|---|--:|--:|--:|--:|
| contratto **in piedi tutto l'anno**, niente ore a luglio e agosto | gen → dic | **12,00** | 720,00 | 14.291,98 € | **19,85** |
| la stessa persona | gen → giu | 6,00 | 432,00 | 8.471,81 € | 19,61 |
| contratto **che finisce il 30/06** | gen → dic | **6,00** (l'app esclude da sé i mesi scoperti) | 432,00 | 8.777,08 € | **20,32** |
| la stessa | gen → giu | 6,00 | 432,00 | 8.471,81 € | 19,61 |

- Se il contratto **resta in piedi** e la persona è **pagata** anche a luglio e agosto, l'app
  conta **12 mesi di stipendio** e le **ore dei 10 mesi**: è giusto così, quei due mesi si pagano
  davvero.
- ⚠️ **Dalla ver112**, se quei mesi sono scritti **tutti «AN»**, l'app li considera **mesi non
  pagati** (nessuna busta paga) e li toglie da stipendio, ratei, cedolini e festività, lasciando
  **intatto il rapporto**: con luglio e agosto tutti AN la prima riga della tabella diventa
  **10,00 mesi · 14.026,86 € · 19,48 €/h**. Per farli tornare a contare basta scrivere un'ora o
  un altro codice in un giorno di quei mesi.
- Se invece il rapporto **si interrompe**, va scritto nelle **date della scheda** (cessazione, e
  riassunzione quando riparte): l'app esclude da sé i mesi non coperti, anche se il periodo
  scelto è più largo.
- ✅ **LIMITE TROVATO E CORRETTO LO STESSO GIORNO (ver109)**: le festività si contavano sul
  **periodo scelto** invece che sui giorni in cui il contratto è in piedi, e un periodo più largo
  del contratto gonfiava il costo. **Ora la terza riga della tabella dà 8.471,81 € e 19,61 €/h**,
  cioè lo stesso numero del periodo gen → giu: **quale periodo chiedi non cambia più il
  risultato** per i mesi fuori contratto.

## ✅ FATTO nella ver117 (06/11/2026) — era il «DA FARE» del 05/11 sera

Due richieste precise, affrontate **insieme** perché toccano lo stesso punto. **Chiuse entrambe**
nella ver117: vedi la scheda 🧮 più sopra.
✅ **Già chiuso nella stessa serata**: la terza questione di quel messaggio — i mesi tutti «AN» —
è stata risolta con la **ver112** (non sono pagati, ma il rapporto va avanti). Le due qui sotto
restano.
✅ **Pubblicato su `main` il 06/11/2026** («main» di Christian, **due volte** nella stessa
giornata): `main` porta ora la **ver116**, con tutte le ver103 → ver116 arrivate con due
avanzamenti del ramo `claude/integrated-app-feasibility-8d1wg0`. ⚠️ Le ver103, ver110 e ver111
sono **passaggi superati lo stesso giorno** (rispettivamente da ver104, ver111 e ver112): stanno
nella storia dei commit, ma **non sono mai state la versione pubblicata**.

1. ✅ **Le ore supplementari si contano MESE PER MESE, senza compensazione.** Parole di Christian:
   «gennaio 95 ore fatte in luogo di 90 e febbraio 85 ore in luogo di 90 **non dà
   compensazione**». Oggi `E18` confronta il **totale** delle ore rese con il **totale** delle
   ore lavorabili del periodo (`(G38 − O8 + O11·H2)/H2`), quindi un mese sotto **compensa** un
   mese sopra. Va cambiato in: per ogni mese `max(0, ore del mese − ore lavorabili del mese)`,
   poi somma.
2. ✅ **«Tabellone e costo orario si parlino».** Nella stessa app convivevano due idee di «ore del
   mese» che non coincidono (vedi la scheda ⚖️ più sopra): `monteFissoMese` nel Tabellone e le
   «settimane lavorabili meno assenze presunte» nel Costo orario. Le ore lavorabili del mese
   vanno prese **dal Tabellone** (ferie, permessi e malattia **veri**) invece che dai numeri
   presunti.
   ⚠️ Attenzione: il 05/11/2026 **mattina** Christian aveva detto «il resto lascia come è» su
   questa stessa cosa; la **sera** ha cambiato idea. Vale l'ultima.

⚠️ **Conseguenza misurata prima di consegnare**, come la regola chiedeva: con il conto mese per
mese le supplementari **crescono** e il costo totale sale, ma **solo dove i mesi sono disuguali**.
Confronto su tre casi veri nella scheda 🧮 (da +0,7 h a +50,2 h di ore in più).
⚠️ **La definizione delle ore lavorabili l'ha data Christian il 06/11** e **non** è quella che
avevo proposto io: non sono «ferie, permessi e malattia **veri** presi dal Tabellone», ma il
**monte contrattuale meno le assenze PRESUNTE**. Vale la sua.

## Registro dei controlli sulle formule (da ripetere a ogni versione)

**Controllo chiesto da Christian il 05/11/2026 («se nel costo orario chiedo costo da x a y
verifica che si aggiorni la casella che indica il totale mesi considerati»). ESEGUITO E
SUPERATO sulla ver106**, cambiando davvero le tendine del periodo nel browser (script
`periodoUI.cjs` e `periodoUI2.cjs`). Persona assunta il **16/01/2026**, 15 h/sett.:

| Periodo scelto | Casella «Mesi di contratto» | Riga del contratto | Retribuzione |
|---|--:|---|--:|
| Gennaio → Dicembre 2026 | **11,52** | 11,52 mesi · ratei su 12 · 12 cedolini | 7.444,05 € |
| **Marzo → Giugno 2026** | **4** | 4,00 mesi · ratei su 4 · 4 cedolini | 2.585,64 € |
| **Gennaio → Febbraio 2026** | **1,52** | 1,52 mesi · ratei su 2 · 2 cedolini | 979,96 € |

Si aggiornano **tutti e tre i conteggi**, l'aiutino sotto la casella e tutti gli importi.
⚠️ **Un solo caso in cui la casella NON segue il periodo, ed è voluto**: se il numero dei mesi
è stato **scritto a mano**, quello prevale (provato: scritto 6, cambiato periodo in marzo→giugno,
la casella resta 6 e la retribuzione resta 3.878,46 €). La riga «in forza per…» però **cambia lo
stesso**, quindi la differenza si vede. **Svuotando la casella** il valore automatico torna
subito (4,00 → 2.585,64 €). Se servisse un avviso quando il numero scritto a mano non coincide
con quello calcolato, **va chiesto**: oggi non c'è.


Controllo fatto il **05/11/2026 sulla ver100** e **rieseguito identico sulle ver101 → ver106**, su richiesta di Christian («controlla ottimamente
ogni formula»). Gli attesi sono **ricalcolati da zero** in uno script separato e confrontati con
quello che l'app mostra **davvero a video** (Playwright). Gli script stanno nella cartella di
lavoro della sessione: `formule100.cjs`, `arrot100.cjs`, `periodo100.cjs`.

**Caso di prova**: 30 h/sett. · novembre 2026 · 22 giorni da 6,5 h · 2 FERIE (una spenta col clic)
· 1 MAL · permessi: EXF 2 h, LUTTO 1,5 h **sul giorno spento**, VISITA MEDICA 1 h (tipo a mano).

| Formula | Atteso (ricalcolato) | Letto a video | Esito |
|---|--:|--:|---|
| `monteFissoMese` = 165 × oreSett ÷ 38 | 130,263 | 130,26 | ✔ |
| `totOfRec` (TOT calcolato) | 143,00 | 143,00 | ✔ |
| `quotaGiorno` × gg di assenza | 15,030 (3 gg) | 15,030 (3 gg) | ✔ |
| `permOreMese().pagate` | 3,500 | 3,500 | ✔ |
| `permOreMese().altre` (tipo a mano) | 1,000 | 1,000 | ✔ |
| Risultato del mese = rese + assenze + permessi − monte | +31,267 | +31,267 | ✔ |
| **TOT teorico** = rese + assenze erosive + permessi erosi | 155,020 | 155,020 | ✔ |
| `prodottoMese` → Tetto «Già usate» | 155,020 | 155,020 | ✔ |
| Tetto «Restano» (su 500) | 344,980 | 344,980 | ✔ |

**`R2` (arrotondamento), 9 casi in isolamento sul codice vero**: 67,5×22,99 → 1.551,83;
162,5×22,99 → 3.735,88; 0,615 → 0,62; 2,675 → 2,68; i due negativi → −1.551,83 e −2,68
(simmetrico); 1,0005 a 3 decimali → 1,001; 0 → 0; 5,005 → 5,01. **Tutti superati.** Il vecchio
`Math.round(x*100)/100` sullo stesso primo caso dà ancora 1.551,82: è il difetto corretto in ver74.

**Somma delle voci del massimale** (`tettoVoci` + `tettoVociSomma`), 7 casi: 200+208,5 = 408,5;
0,1+0,2 = 0,3; 33,33+33,33+33,34 = 100; riga **senza nome** scartata; ore **negative** scartate;
ore **non numeriche** scartate; elenco vuoto = 0. **Tutti superati.**

**Finestra del periodo** (`consumoTetto` + `tettoWindow`), a.s. 2026/27 guardando novembre 2026,
con mesi seminati apposta dentro e fuori: ago-26 50 h **fuori**, ott-26 50 h, nov-26 40 h,
gen-27 30 h, set-27 70 h **fuori** → atteso **120,000**, letto **120,000**. ✔ La finestra
set→ago **scavalca l'anno civile** correttamente.

⚠️ **Due avvertenze per chi ripete queste prove** (sbagliate due volte il 05/11/2026):
1. il codice della malattia è **`MAL`**, non «MALATTIA» (elenco in `CODICI`);
2. l'app apre sull'**ultimo anno** di `state.anni`: se nel seme ci sono 2026 e 2027, le linguette
   dei mesi mostrano il **2027** finché non si torna indietro con la barra dell'anno.

🐞 **Difetto preesistente trovato durante il controllo — CORRETTO in ver101** (Christian:
«iniziamo nel tabellone testi che non siano i codici permessi»): vedi la scheda della ver101.

**Non verificabile da qui**: il disegno vero del **Report PDF** (jsPDF non è raggiungibile dal
contenitore) e i numeri del **Costo orario** contro il foglio Excel originale, che dopo le sette
correzioni volute della ver79 **non è più il riferimento**.

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
