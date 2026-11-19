/* A01 — accesso col PIN, le cinque viste, navigazione mesi/anni, casi limite (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a01-accesso-viste'); const T=R.T;
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  /* 1. primo accesso: crea PIN; PIN troppo corto; PIN diversi */
  let {ctx,pg,E}=await K.apri(br,{pin:false});
  T('A01.01 schermata di primo accesso con «Nuovo PIN» e «Conferma PIN»', (await pg.locator('.login-box input[type=password]').count())===2);
  const pins=pg.locator('.login-box input[type=password]');
  await pins.nth(0).fill('12'); await pins.nth(1).fill('12'); await pg.locator('.login-box button').click(); await pg.waitForTimeout(300);
  T('A01.02 PIN di 2 cifre rifiutato', /almeno 4/.test(await pg.locator('.login-box').innerText()));
  await pins.nth(0).fill('1234'); await pins.nth(1).fill('9999'); await pg.locator('.login-box button').click(); await pg.waitForTimeout(300);
  T('A01.03 PIN diversi rifiutati', /non coincidono/.test(await pg.locator('.login-box').innerText()));
  await pins.nth(0).fill('12ab34'); T('A01.04 nel PIN entrano solo cifre', (await pins.nth(0).inputValue())==='1234');
  await pins.nth(1).fill('1234'); await pg.locator('.login-box button').click(); await pg.waitForTimeout(1500);
  T('A01.05 PIN creato: si entra nell\'app', await pg.locator('.app-header').count()===1);
  T('A01.06 targhetta '+K.APPV, (await pg.locator('.app-rev').innerText()).indexOf(K.APPV)!==-1, await pg.locator('.app-rev').innerText());
  T('A01.07 il PIN è salvato come impronta, non in chiaro', await pg.evaluate(()=>{ const ks=Object.keys(localStorage).filter(k=>/pin/i.test(k)); return ks.length>0 && ks.every(k=>localStorage.getItem(k)!=='1234'); }));
  /* ricarica: chiede il PIN; sbagliato / giusto */
  await pg.reload(); await pg.waitForSelector('.login-box');
  T('A01.08 al ricaricamento chiede il PIN (un solo campo)', (await pg.locator('.login-box input[type=password]').count())===1);
  await K.entraPin(pg,'0000'); T('A01.09 PIN sbagliato: «PIN errato.» e si resta fuori', /PIN errato/.test(await pg.locator('.login-box').innerText()) && !(await pg.locator('.app-header').count()));
  await pg.locator('.login-box input[type=password]').fill('1234'); await pg.locator('.login-box input[type=password]').press('Enter'); await pg.waitForTimeout(1500);
  T('A01.10 PIN giusto con Invio: si entra', await pg.locator('.app-header').count()===1);
  /* 2. viste */
  const strip=async()=> (await pg.locator('.monthstrip').innerText()).replace(/\s+/g,' ');
  await K.vai(pg,'Ott'); T('A01.11 Tabellone ottobre: fascia «📅 Tabellone Ottobre 2026» e badge «27 giorni (no domeniche)»', /Tabellone Ottobre 2026/.test(await strip()) && /27 giorni \(no domeniche\)/.test(await strip()), await strip());
  T('A01.12 tre schede nel Tabellone di ottobre', await pg.locator('.emp-card').count()===3);
  await K.vai(pg,'Nov'); T('A01.13 novembre: badge 25 giorni', /25 giorni/.test(await strip()));
  await K.vai(pg,'Feb'); T('A01.14 febbraio 2026: badge 24 giorni', /24 giorni/.test(await strip()));
  for(const [t,re] of [['rep',/Riepiloghi/],['ana',/Anagrafica/],['costo',/Costo orario/],['query',/Query personale/]]){
    await K.vai(pg,t); const s=await strip(); const txt=(await pg.locator('.content').innerText());
    T('A01.15 vista '+t+': fascia corretta e contenuto non vuoto, nessun «undefined»/«NaN»', re.test(s) && txt.length>200 && !/undefined|NaN/.test(txt), s+' / '+txt.length);
  }
  /* 3. navigazione anni */
  await K.vai(pg,'Ott'); await K.annoA(pg,2025); T('A01.16 ◀ porta al 2025', (await K.anno(pg))===2025);
  await K.vai(pg,'Dic'); T('A01.17 dicembre 2025: le schede con dati compaiono (ALFA e GAMMA)', await pg.locator('.emp-card').count()>=2);
  await pg.locator('.yearbar button').nth(1).click(); await pg.waitForTimeout(400); await pg.locator('.yearbar button').nth(1).click(); await pg.waitForTimeout(600);
  T('A01.18 ▶ oltre l\'ultimo anno lo aggiunge (2027)', (await K.anno(pg))===2027 && (await K.statoLS(pg)).anni.indexOf(2027)===-1);
  T('A01.19 aggiungere un anno accende il 💾 (solo in memoria)', await pg.locator('.btn-save.dirty').count()===1);
  await K.vai(pg,'Mar'); const t27=await pg.locator('.content').innerText();
  T('A01.20 anno senza dati (marzo 2027): niente NaN/undefined', !/NaN|undefined/.test(t27));
  await K.vai(pg,'rep'); T('A01.21 Riepiloghi di un anno senza dati: tutti zero, niente NaN', !/NaN|undefined/.test(await pg.locator('.content').innerText()));
  await K.vai(pg,'costo'); T('A01.22 Costo orario 2027: niente NaN', !/NaN/.test(await pg.locator('.content').innerText()));
  T('A01.23 zero errori di pagina (percorso principale)', E.length===0, E.join(' | ')); await ctx.close();
  /* 4. elenco dipendenti vuoto */
  ({ctx,pg,E}=await K.apri(br,{stato:{version:4,anni:[2026],dipendenti:[],dati:{},locked:{}}}));
  await K.vai(pg,'Ott'); T('A01.24 elenco vuoto: Tabellone dice «Nessun dipendente»', /Nessun dipendente/.test(await pg.locator('.content').innerText()));
  for(const t of ['rep','ana','costo','query']){ await K.vai(pg,t); }
  T('A01.25 elenco vuoto: le cinque viste si aprono senza errori', E.length===0, E.join(' | '));
  await K.vai(pg,'Ott'); await pg.getByRole('button',{name:'🖨️ Report PDF A4 per le paghe'}).click(); await pg.waitForTimeout(500);
  const dl=await K.scarica(pg,()=>pg.locator('.modal .modal-actions button').last().click());
  T('A01.26 elenco vuoto: il report per le paghe si genera comunque (pagina che lo dice)', !!dl && /Nessun/.test(K.sh('pdftotext '+JSON.stringify(dl.f)+' -')), dl&&dl.nome);
  T('A01.27 zero errori di pagina (elenco vuoto)', E.length===0, E.join(' | ')); await ctx.close();
  /* 5. stato assente (nuova installazione) */
  ({ctx,pg,E}=await K.apri(br,{stato:false}));
  T('A01.28 primo avvio senza dati: si entra, nessun errore', await pg.locator('.app-header').count()===1 && E.length===0, E.join('|'));
  T('A01.29 primo avvio: nessun dato personale precaricato (elenco vuoto)', ((await K.statoLS(pg))||{dipendenti:[]}).dipendenti.length===0 || (await pg.evaluate(()=>emptyState().dipendenti.length))===0);
  await ctx.close();
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
