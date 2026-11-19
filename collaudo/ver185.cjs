/* Collaudo ver185 (dati INVENTATI): ore sempre a TRE decimali, regola dei minuti a tre cifre, caratteri al 90%
   nelle caselle, «ORE CONTRATTUALI» e «ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI».
   Prima: bash collaudo/prepara-banco.sh ver184   (banco proprio, porta 8300, con la ver184 congelata per il confronto)
   Poi:   node collaudo/ver185.cjs                                                                                     */
const K=require('./a00-comune.cjs'); const R=K.contatore('ver185'); const T=R.T; const fs=require('fs');
const n=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
const LUNGA='ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI';
function feriali(y,m,val,sab){ const g={}; const nd=new Date(y,m,0).getDate(); for(let d=1;d<=nd;d++){ const wd=new Date(y,m-1,d).getDay(); if(wd===0) continue; if(wd===6 && !sab) continue; g[d]=val; } return g; }
function ottSesti(){ const g=feriali(2026,10,'3,17'); g[5]='FERIE'; g[6]='7,66'; g[7]='1,6666'; g[8]='12,83'; g[9]='MAL'; return g; }
const ST={ version:4, anni:[2026], locked:{}, costoComune:{}, dipendenti:[
  {id:'q',nome:'PROVA QUINDICI',oreSett:15,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',colore:'#00B0F0',tettiAnnui:[{id:'t1',ore:'400',periodo:'scolastico',anno:'2026'}]},
  {id:'s',nome:'PROVA SESTI',oreSett:19,livello:'D2',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'15/09/2025',colore:'#9AD0C2'},
  {id:'x',nome:'PROVA CELLE',oreSett:20,livello:'C1',tipoContratto:'indeterminato',mensilizzato:false,dataAssunzione:'01/01/2020',colore:'#B7A4D6'}],
  dati:{
    '2026-09':{ q:{giorni:feriali(2026,9,'3')} },
    '2026-10':{ q:{giorni:feriali(2026,10,'3')}, s:{giorni:ottSesti(), permessi:{13:{ore:1.25,tipo:'EXF'}}}, x:{giorni:{}} } } };
const motore=(pg)=>pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); ggComuneAggiorna(st); const o={}; const ott=[{y:2026,m:10}];
  st.dipendenti.forEach(dp=>{ const d=datiCosto(st,dp,ott); const rec=getRecFrom(st,2026,10,dp.id);
    o[dp.id]=[totOfRec(rec,2026,10), R2(bancaMeseA(st,dp,2026,10),3), R2(d.res.J35,2), R2(d.res.H38,2), d.oreMancanti?'nc':R2(d.res.orario,2),
      (cedOrePubblica(st)['2026-10']||{})[dp.id]||null, R2(prodottoMese(rec,dp,2026,10,st),3), oreRetribuibili(dp,2026,10,rec), monteFissoMese(dp,2026,10)]; });
  return o; });
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  /* ===== nessun numero cambia: ver184 contro ver185, stesso seme ===== */
  const V=await K.apri(br,{ver:'ver184',stato:ST}); const M4=await motore(V.pg); await V.ctx.close();
  const {ctx,pg,E}=await K.apri(br,{stato:ST}); const M5=await motore(pg);
  T('R01 targhetta '+K.APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(K.APPV)!==-1);
  T('R02 nessun numero cambia (TOT, Risultato, costo, ore, €/h, cedOre, Tetto, ore da far risultare, ORE CONTRATTUALI): identici alla ver184', JSON.stringify(M4)===JSON.stringify(M5), JSON.stringify(M5).slice(0,200));
  /* ===== lettura a tre cifre ===== */
  const L=await pg.evaluate(()=>[parseHour('3,167'),parseHour('3,333'),parseHour('2,250'),parseHour('0,833'),parseHour('7.667'),parseHour('3,16'),parseHour('1,6666'),R2(parseHour('0,167')*31,4)]);
  T('R03 «3,167» «3,333» «0,833» «7.667» si leggono come sesti esatti, come «3,17»; 2,250 = 2,25; 3,16 e 1,6666 restano come sono; 31 × 0,167 = 5,1667',
    Math.abs(L[0]-(3+1/6))<1e-12 && Math.abs(L[1]-(3+1/3))<1e-12 && L[2]===2.25 && Math.abs(L[3]-5/6)<1e-12 && Math.abs(L[4]-(7+2/3))<1e-12 && L[5]===3.16 && L[6]===1.6666 && L[7]===5.1667, JSON.stringify(L));
  /* ===== Tabellone ===== */
  await K.annoA(pg,2026); await K.vai(pg,'Ott');
  const C=(d)=>K.cella(pg,'PROVA CELLE',d); const toast=async()=> (await pg.locator('.toast').allInnerTexts()).join(' ');
  const scrivi=async(d,txt)=>{ const c=C(d); await c.click(); await c.press('Control+a'); await c.press('Delete'); await pg.keyboard.type(txt,{delay:15}); const durante=await c.inputValue(); await c.press('Tab'); await pg.waitForTimeout(250); return {durante,fine:await c.inputValue()}; };
  let r=await scrivi(1,'3,167'); T('R04 «3,167» battuto a tre cifre entra e si mostra 3,167', r.durante==='3,167' && r.fine==='3,167', JSON.stringify(r));
  r=await scrivi(2,'3,17'); T('R05 «3,17» a due cifre resta buono e si mostra 3,167', r.fine==='3,167', JSON.stringify(r));
  r=await scrivi(3,'3,5'); T('R06 «3,5» → 3,500', r.fine==='3,500', JSON.stringify(r));
  r=await scrivi(5,'2,250'); T('R07 «2,250» → 2,250', r.fine==='2,250', JSON.stringify(r));
  r=await scrivi(6,'3,1666'); T('R08 «3,1666»: la quarta cifra non entra (resta 3,166), che all\'uscita si rifiuta', r.durante==='3,16' && r.fine==='', JSON.stringify(r));
  const av=await toast();
  T('R09 l\'avviso dice i decimali a tre cifre (,000 ,167 ,250 ,333 ,500 ,667 ,750 ,833) e che vanno bene anche a due o a una', /,000 ,167 ,250 ,333 ,500 ,667 ,750 ,833/.test(av) && /anche a due cifre/.test(av), av.slice(0,200));
  r=await scrivi(7,'3,168'); T('R10 «3,168»: l\'8 non entra (resta 3,16), rifiutato all\'uscita', r.durante==='3,16' && r.fine==='', JSON.stringify(r));
  r=await scrivi(8,'4,75'); T('R11 «4,75» → 4,750', r.fine==='4,750', JSON.stringify(r));
  const st=await pg.evaluate(()=>JSON.parse(localStorage.getItem('spazioireos_reportore_v1'))); /* niente salvato */
  /* celle fuori griglia già nei dati */
  const S=(d)=>K.cella(pg,'PROVA SESTI',d);
  const fp=[await S(6).inputValue(), await S(7).inputValue(), await S(8).inputValue(), await S(1).inputValue()]; const cls=[await S(6).getAttribute('class'), await S(7).getAttribute('class')];
  T('R12 celle già nei dati: 7,66 → 7,660 e 1,6666 → 1,667, ancora segnalate (fuoripasso); 12,83 → 12,833; 3,17 → 3,167', fp.join('|')==='7,660|1,667|12,833|3,167' && cls.every(c=>/fuoripasso/.test(c)), fp.join('|'));
  const head=(await K.carta(pg,'PROVA SESTI').locator('.emp-head').innerText()).replace(/\s+/g,' ');
  T('R13 pillole a tre decimali: ORE SETT 19,000 · ORE CONTRATTUALI 82,500 · '+LUNGA+' 85,500', /ORE SETT: 19,000/.test(head) && /ORE CONTRATTUALI: 82,500/.test(head) && new RegExp(LUNGA+': 85,500').test(head), head.slice(0,240));
  const totS=(await K.carta(pg,'PROVA SESTI').locator('.foot-tot b').innerText());
  T('R14 TOT calcolato a tre decimali', /^\d[\d.]*,\d{3}$/.test(totS.trim()), totS);
  const bx=(await K.carta(pg,'PROVA SESTI').locator('.ced-box').innerText()).replace(/\s+/g,' ');
  T('R15 box: «ORE CONTRATTUALI 82,500 h», MAL 1 gg = 3,167 h (non 3,170), ferie 3,167', /ORE CONTRATTUALI 82,500 h/.test(bx) && /di cui ferie 3,167 h/.test(bx) && /3,167 h MAL 1 gg/.test(bx) && !/ORE MESE/.test(bx), bx.slice(0,260));
  const tutto=async()=> (await pg.locator('body').innerText());
  let tx=await tutto(); T('R16 Tabellone: nessun «ORE MESE» e nessun «ORE CORRETTE DA DARE» a video', !/ORE MESE|ore mese|CORRETTE DA DARE|corrette da dare/i.test(tx));
  /* grafica */
  for(const w of [390,1280]){ await pg.setViewportSize({width:w,height:900}); await pg.waitForTimeout(300);
    const g=await pg.evaluate((LUNGA)=>{ const ins=[...document.querySelectorAll('table.cal input.cell-in.is-num')]; const fuori=ins.filter(i=>i.value&&i.scrollWidth>i.clientWidth+1).map(i=>i.value);
      const pill=[...document.querySelectorAll('.emp-head .pill')].find(p=>p.innerText.indexOf(LUNGA)!==-1); const pr=pill.getBoundingClientRect();
      return { fs:getComputedStyle(ins[0]).fontSize, tot:getComputedStyle(document.querySelector('td.tot-v')).fontSize, fuori, tab:Math.round(document.querySelector('table.cal').getBoundingClientRect().width),
        SW:document.documentElement.scrollWidth, W:document.documentElement.clientWidth, pfs:parseFloat(getComputedStyle(pill).fontSize), pW:pr.width, pR:pr.right, tagliata:pill.scrollWidth>pill.clientWidth+1 }; },LUNGA);
    T('R17 '+w+'px: ore nelle caselle al 90% (18px) e TOT 17,1px, nessuna ora tagliata nella casella, nessuno scorrimento laterale', g.fs==='18px' && g.tot==='17.1px' && g.fuori.length===0 && g.SW<=g.W, JSON.stringify(g));
    T('R18 '+w+'px: la pillola lunga si legge (≥12,5px), non è tagliata e non esce dallo schermo', g.pfs>=12.5 && !g.tagliata && g.pR<=g.W+1, JSON.stringify({pfs:g.pfs,pW:g.pW,pR:g.pR,W:g.W}));
    await pg.screenshot({path:K.OUT+'/ver185-tab-'+w+'.png'}); }
  await pg.setViewportSize({width:1500,height:1000});
  /* larghezza della tabella del mese: come la ver184 */
  const V2=await K.apri(br,{ver:'ver184',stato:ST,w:1500}); await K.annoA(V2.pg,2026); await K.vai(V2.pg,'Ott');
  const lar=async(p)=>p.evaluate(()=>[...document.querySelectorAll('table.cal')].map(t=>Math.round(t.getBoundingClientRect().width)));
  const l4=await lar(V2.pg), l5=await lar(pg); await V2.ctx.close();
  T('R19 la tabella del mese non si allarga rispetto alla ver184', l5.every((v,i)=>v<=l4[i]+1), l4.join(',')+' → '+l5.join(','));
  /* Compila veloce */
  const G=K.carta(pg,'PROVA CELLE'); const qf=async(val)=>{ await G.locator('.edit-mini.qf').click(); await pg.waitForTimeout(300); const m=pg.locator('.modal'); await m.locator('input').first().fill(val); await pg.waitForTimeout(150);
    const b=m.locator('.modal-actions button').last(); const o={dis:await b.isDisabled(),txt:(await m.innerText()).replace(/\s+/g,' ')}; await m.locator('.modal-actions button').filter({hasText:'Annulla'}).click(); await pg.waitForTimeout(200); return o; };
  const q1=await qf('3,167'), q2=await qf('3,16'), q3=await qf('3,333');
  T('R20 Compila veloce: «3,167» e «3,333» accesi, «3,16» spento con i decimali a tre cifre', !q1.dis && !q3.dis && q2.dis && /,000 ,167/.test(q2.txt));
  /* permesso */
  await G.locator('table.cal tr').nth(2).locator('td').nth(15).locator('.perm-flag').click(); await pg.waitForTimeout(300);
  await pg.locator('.modal .field input').first().fill('1,167'); await pg.locator('.modal select').selectOption('EXF'); await pg.locator('.modal .modal-actions button').last().click(); await pg.waitForTimeout(300);
  const lbl=(await G.locator('.perm-lbl').allInnerTexts()).join('|');
  await pg.locator('.btn-save').click(); await pg.waitForTimeout(600); const stS=await K.statoLS(pg); const px=(stS.dati['2026-10'].x.permessi||{})[16];
  T('R21 permesso «1,167» (1 h 10) accettato, salvato esatto (7/6) e mostrato «+1,167 h EXF»', px && Math.abs(px.ore-7/6)<1e-12 && /\+1,167 h EXF/.test(lbl), lbl+' '+JSON.stringify(px));
  T('R22 le celle si salvano come scritte («3,167», «3,17», «3,5»)', stS.dati['2026-10'].x.giorni[1]==='3,167' && stS.dati['2026-10'].x.giorni[2]==='3,17' && stS.dati['2026-10'].x.giorni[3]==='3,5', JSON.stringify(stS.dati['2026-10'].x.giorni));
  /* Riepiloghi, Costo orario, Query */
  await K.vai(pg,'rep'); tx=await tutto();
  T('R23 Riepiloghi: ore a tre decimali (per mese e lavorate/teoriche)', /\d,\d{3}/.test(await pg.locator('.rep-box').first().innerText()) && !/(^|\s)\d+,\d\d(\s|$)/.test(await pg.locator('.rep-box').first().innerText()));
  await K.vai(pg,'costo'); await pg.waitForTimeout(500); tx=await tutto();
  T('R24 Costo orario: ore dai Riepiloghi e ore a cedolino a tre decimali; euro a due', /ore inserite nei mesi del periodo: [\d.]+,\d{3} h/.test(tx) && /euro all'ora/.test(tx) && /\d,\d\d €/.test(tx), (tx.match(/ore inserite nei mesi del periodo: [^\n]{0,30}/)||[''])[0]);
  T('R25 nessun «ORE MESE»/«ORE CORRETTE DA DARE» in Riepiloghi e Costo orario', !/ORE MESE|CORRETTE DA DARE|corrette da dare/i.test(tx));
  /* TS */
  await K.vai(pg,'Ott'); await pg.getByRole('button',{name:'🖨️ Report PDF A4 per le paghe',exact:true}).click(); await pg.waitForTimeout(400);
  const ss=pg.locator('.modal select'); await ss.nth(0).selectOption('10'); await ss.nth(1).selectOption('2026');
  const f=await K.scarica(pg,()=>pg.locator('.modal .modal-actions button').last().click(),60000);
  const txt=K.sh('pdftotext -layout "'+f.f+'" -'); const pages=+(/Pages:\s+(\d+)/.exec(K.sh('pdfinfo "'+f.f+'"'))||[])[1];
  const righe=txt.split('\n').filter(l=>/^\s*\d{1,2} (lun|mar|mer|gio|ven|sab|dom)\b/.test(l)); const due=righe.filter(l=>/\d,\d\d(\s|$|†)/.test(l.replace(/\d,\d{3}/g,'')));
  T('R26 TS: un foglio per mensilizzato (2), ore a tre decimali, nessuna a due', pages===2 && righe.length>40 && due.length===0, pages+' pagine · '+due.slice(0,2).join(' | '));
  const flat=txt.replace(/\s+/g,' ');
  T('R27 TS: «ORE CONTRATTUALI (stipendio fisso)», legenda dei minuti a tre cifre, nessun «ORE MESE»', /ORE CONTRATTUALI \(stipendio fisso\): \d+,\d{3} h/.test(flat) && /,167 = 10 · ,250 = 15 · ,333 = 20/.test(flat) && !/ORE MESE/.test(flat));
  K.sh('pdftoppm -r 70 -png -f 1 -l 1 "'+f.f+'" "'+K.OUT+'/ver185-ts"');
  T('R28 zero errori di pagina', E.length===0, E.join(' | '));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
