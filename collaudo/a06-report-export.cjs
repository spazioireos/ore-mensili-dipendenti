/* A06 — Report PDF veri (jsPDF 2.5.1) e tutti gli export Excel: pagine, totali = motore, nomi dei file (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a06-report-export'); const T=R.T;
const XLSX=require(__dirname+'/.strumenti/node_modules/xlsx');
const ver=process.argv[2]||'dip';
const NOMEF=/^Spazio Ireos .+ - \d{2}[a-z]{3}\d{2} - ver\d+ - \d{2}\.\d{2}\.(pdf|xlsx)$/;
const fmtT=v=>{ const c=v.toFixed(2).replace('.',','); const h=Math.floor(v+1e-9), mm=Math.round((v-h)*60); return {c, h: h+','+String(mm).padStart(2,'0'), p: (h>0&&mm>0)?(h+' h e '+mm+' min'):(h>0?(h+' h'):(mm+' min'))}; };   /* ver194: anche a parole */
const n=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{ver}); await K.vai(pg,'Ott');
  const genera=async(btn,mese,anno)=>{ await pg.getByRole('button',{name:btn,exact:true}).click(); await pg.waitForTimeout(400); const s=pg.locator('.modal select'); await s.nth(0).selectOption(String(mese)); await s.nth(1).selectOption(String(anno||2026));
    return await K.scarica(pg,()=>pg.locator('.modal .modal-actions button').last().click(),30000); };
  const PM=require('./paghe-meta.cjs');
  const info=(f)=>{ const pag=+(/^Pages:\s+(\d+)/m.exec(K.sh('pdfinfo '+JSON.stringify(f)))||[0,0])[1], raw=K.sh('pdftotext -raw '+JSON.stringify(f)+' -');
    if(PM.ePaghe(f)){ const M=PM.testoPaghe(f); return {pag:M.pagine, fogli:M.fogli, txt:M.txt, raw}; }   /* ver208: due persone per foglio, si leggono le mezze pagine */
    return {pag, txt:K.sh('pdftotext -layout '+JSON.stringify(f)+' -'), raw}; };
  const eng=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const r=(st.dati['2026-10']||{})[dp.id]; o[dp.nome]=r?totOfRec(r,2026,10):0; }); return o; });
  /* storico */
  let d=await genera('🖨️ Report PDF A4',10); let I=d&&info(d.f);
  T('A06.01 «🖨️ Report PDF A4» ottobre: si genera, nome secondo convenzione', d && NOMEF.test(d.nome) && /Report Ore mensile/.test(d.nome), d&&d.nome);
  /* ver194: sotto ogni numero le ore a parole, le righe sono più alte e il report va su più pagine: il titolo si ripete con «(segue)» */
  T('A06.02 storico (ver194): una o più pagine, dalla seconda il titolo con «(segue)»', I && I.pag>=1 && (I.pag===1 || (I.txt.match(/\(segue\)/g)||[]).length===I.pag-1), I&&I.pag);
  const rawS=I.raw.replace(/\s+/g,' ');
  const vals=['ALFA PROVA','BETA PROVA','GAMMA PROVA'].map(nm=>{ const f=fmtT(eng[nm]); return new RegExp(f.c+' \\('+f.h+' = '+f.p+'\\)').test(rawS) ? f.c : null; });
  T('A06.03 storico: riga «TOT ORE RESE» = totOfRec del motore per le 3 persone, «centesimi (ore,minuti = h e min)» (ver194)', vals.every(Boolean), JSON.stringify(vals)+' vs '+JSON.stringify(eng));
  T('A06.03b storico (ver194): ogni ora,minuti ha sotto le sue parole giuste (es. «6,30» → «(6 h e 30 min)»)', (()=>{ const m=[...rawS.matchAll(/(\d+),(\d{2}) \(((\d+) h)?( e )?((\d+) min)?\)/g)]; return m.length>20 && m.every(x=>(+(x[4]||0))===+x[1] && (+(x[7]||0))===+x[2]); })(), (rawS.match(/\d+,\d{2} \([^)]*\)/g)||[]).slice(0,4).join(' · '));
  T('A06.04 storico: ore in «ore,minuti» (6,30 = 6 h 30 min) e nessuna legenda (ver95)', /6,30/.test(I.txt) && !/Legenda/i.test(I.txt));
  /* paghe */
  d=await genera('🖨️ Report PDF A4 per le paghe',10); I=d&&info(d.f);
  T('A06.05 «🖨️ Report PDF A4 per le paghe» ottobre: nome «Ore da riportare a cedolino - …» secondo convenzione', d && NOMEF.test(d.nome) && /Ore da riportare a cedolino/.test(d.nome), d&&d.nome);
  T('A06.06 paghe (ver208: due persone per foglio, si contano le mezze pagine): ALFA e BETA su due mezze pagine, GAMMA non mensilizzata assente', I.pag===2 && /ALFA PROVA/.test(I.txt) && /BETA PROVA/.test(I.txt) && !/GAMMA PROVA/.test(I.txt), I.pag);
  const pA=I.txt.split('\f').find(p=>/ALFA PROVA/.test(p)).replace(/\s+/g,' ');
  const box=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const r={}; st.dipendenti.filter(d=>d.id!=='c').forEach(dp=>{ const B=cedolinoBox(st,dp,2026,10); r[dp.nome]={ordC:B.ordC,supp:B.supp,ced:B.ced,ced2:cedOrePubblica(st)['2026-10'][dp.id]}; }); return r; });
  const oT=fmtT(box['ALFA PROVA'].ordC), sT=fmtT(box['ALFA PROVA'].supp);   /* ver191: TOTALE «centesimi (ore,minuti)»; le tre tabelle sono affiancate, quindi si cerca la coppia giusta nel testo della pagina */
  const mT=(new RegExp(oT.c+' \\('+oT.h+' = '+oT.p+'\\)').test(pA) && new RegExp(sT.c+' \\('+sT.h+' = '+sT.p+'\\)').test(pA)) ? [null,oT.c,sT.c] : null;   /* ver194: «146,00 (146,00 = 146 h)» */
  T('A06.07 paghe ALFA: TOTALE ordinarie e supplementari = box del Tabellone (146,00 · 4,00) = cedOre (150,00)', mT && Math.abs(n(mT[1])-box['ALFA PROVA'].ordC)<0.006 && Math.abs(n(mT[2])-box['ALFA PROVA'].supp)<0.006 && Math.abs(box['ALFA PROVA'].ced-box['ALFA PROVA'].ced2)<0.006, mT&&mT.slice(1).join('/')+' '+JSON.stringify(box['ALFA PROVA']));
  const pB=I.txt.split('\f').find(p=>/BETA PROVA/.test(p)).replace(/\s+/g,' ');
  T('A06.08 paghe BETA (ver208: la cella può andare a capo, si guarda la riga del 12 e quelle accanto): ASS.ING del 12 fra le non retribuite, con le ore in ore,minuti (ver189: il riquadro «DA TRATTENERE» non c\'è più)', (function(){ const pg=I.txt.split('\f').find(p=>/BETA PROVA/.test(p))||''; const l=pg.split('\n'); const i=l.findIndex(x=>/^\s*12 lun/.test(x)); return i>=0 && /ASS\.ING \d+,[0-5]\d/.test(l.slice(Math.max(0,i-1),i+2).join(' ')); })() && !/DA TRATTENERE/.test(pB), (I.txt.match(/ASS\.ING \d+,\d+/)||[''])[0]);
  d=await genera('🖨️ Report PDF A4 per le paghe',9); I=d&&info(d.f);
  T('A06.09 paghe settembre (prima della base mensile): dice che non c\'è nessun mensilizzato', d && /Nessun dipendente mensilizzato/.test(I.txt));
  /* intervallo: due mesi */
  await pg.getByRole('button',{name:'🖨️ Report PDF A4 per le paghe',exact:true}).click(); await pg.waitForTimeout(300);
  const s=pg.locator('.modal select'); await pg.locator('.modal input[type=radio]').nth(1).check(); await s.nth(2).selectOption('10'); await s.nth(3).selectOption('2026'); await s.nth(4).selectOption('11'); await s.nth(5).selectOption('2026');
  d=await K.scarica(pg,()=>pg.locator('.modal .modal-actions button').last().click(),30000); I=d&&info(d.f);
  T('A06.10 paghe ottobre→novembre: ALFA ha anche novembre (ver194: una persona per pagina, ottobre ALFA e BETA, novembre ALFA = 3 pagine)', d && I.pag===3, d&&I.pag);
  /* Excel del mese */
  d=await genera('📊 Excel',10); let wb=d&&XLSX.readFile(d.f);
  T('A06.11 📊 Excel del mese: .xlsx, nome «Report Ore mensile - … - '+K.APPV+'», autore Christian', d && NOMEF.test(d.nome) && /Report Ore mensile/.test(d.nome) && wb.Props && wb.Props.Author==='Christian', d&&d.nome+' '+JSON.stringify(wb&&wb.Props).slice(0,80));
  const flat=wb?wb.SheetNames.map(sn=>JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1}))).join(' '):'';
  T('A06.12 Excel del mese: nessun NaN, ci sono i 156 di ALFA', flat.indexOf('NaN')===-1 && /156/.test(flat));
  /* Riepiloghi */
  await K.vai(pg,'rep'); d=await K.scarica(pg,()=>pg.getByRole('button',{name:'📊 Esporta riepiloghi (Excel)'}).click()); wb=d&&XLSX.readFile(d.f);
  T('A06.13 Riepiloghi: nome «Riepiloghi - … - '+K.APPV+'» (ver181), autore', d && NOMEF.test(d.nome) && /Riepiloghi/.test(d.nome) && (wb.Props||{}).Author==='Christian', d&&d.nome);
  /* Anagrafica */
  await K.vai(pg,'ana'); d=await K.scarica(pg,()=>pg.locator('.toolbar').getByRole('button',{name:'📊 Esporta Excel'}).click()); wb=d&&XLSX.readFile(d.f);
  const ncol=wb?(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1})[0]||[]).length:0;
  T('A06.14 Anagrafica: nome «Anagrafica dipendenti - … - '+K.APPV+'» (ver181), autore, intestazioni', d && NOMEF.test(d.nome) && /Anagrafica dipendenti/.test(d.nome) && (wb.Props||{}).Author==='Christian' && ncol>40, d&&d.nome+' · colonne '+ncol);
  /* Query personale */
  await K.vai(pg,'query');
  await pg.getByRole('button',{name:'➕ Totale su intervallo'}).click(); await pg.waitForTimeout(300);
  T('A06.15 Query «Totale su intervallo» senza date: lo dice', /Inserisci le due date/.test(await pg.locator('.content').innerText()));
  const ins=pg.locator('.content input[placeholder="gg/mm/aaaa"]'); await ins.nth(0).fill('01/10/2026'); await ins.nth(1).fill('31/10/2026'); await pg.waitForTimeout(300);
  const qt=(await pg.locator('.content').innerText()).replace(/\s+/g,' ');
  T('A06.16 Totale ore 01/10→31/10/2026: ALFA 156 / GAMMA 81 come il motore', /ALFA PROVA[^A-Z]*156/.test(qt) && new RegExp('GAMMA PROVA[^A-Z]*'+String(eng['GAMMA PROVA']).replace('.',',')).test(qt), qt.slice(qt.indexOf('ALFA'),qt.indexOf('ALFA')+60));
  d=await K.scarica(pg,()=>pg.getByRole('button',{name:'⬇️ Esporta Excel'}).click());
  T('A06.17 export Query: nome con « al » e convenzione (ver181)', d && NOMEF.test(d.nome) && / al /.test(d.nome) && d.nome.indexOf('_')===-1, d&&d.nome);
  await ins.nth(0).fill('31/02/2026'); await pg.waitForTimeout(300);
  T('A06.18 data impossibile nella Query: segnata in rosso, niente export', /non valid|rovesciato/i.test(await pg.locator('.content').innerText()) && await pg.getByRole('button',{name:'⬇️ Esporta Excel'}).count()===0);
  await ins.nth(0).fill('31/10/2026'); await ins.nth(1).fill('01/10/2026'); await pg.waitForTimeout(300);
  T('A06.19 intervallo rovesciato: niente totali né export', await pg.getByRole('button',{name:'⬇️ Esporta Excel'}).count()===0);
  await pg.getByRole('button',{name:'⚡ Straordinario'}).click(); await pg.waitForTimeout(300);
  const qs=(await pg.locator('.content').innerText()); T('A06.20 Query «⚡ Straordinario»: si apre senza NaN/undefined', !/NaN|undefined/.test(qs));
  await pg.getByRole('button',{name:'🏖️ Ferie da smaltire'}).click(); await pg.waitForTimeout(300);
  T('A06.21 Query «🏖️ Ferie da smaltire»: si apre senza NaN/undefined', !/NaN|undefined/.test(await pg.locator('.content').innerText()));
  T('A06.22 zero errori di pagina', E.length===0, E.join('|'));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
