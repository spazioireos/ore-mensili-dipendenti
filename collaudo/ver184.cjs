/* Collaudo ver184 (dati INVENTATI): la regola dei minuti, il «TS» (tsMese) e le correzioni del collaudo.
   Prima: bash collaudo/prepara-banco.sh ver183   (banco proprio, porta 8300)
          bash ../rendicontazione-usoint/collaudo/comune/prepara-comune.sh 8344   (banco comune, finta Firebase: punto 5)
   Poi:   node collaudo/ver184.cjs [porta-comune]                                                                       */
const K=require('./a00-comune.cjs'); const R=K.contatore('ver184'); const T=R.T; const fs=require('fs');
const PC=process.argv[2]||'8344';
const n=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
const R2=(v,d)=>{ d=d==null?2:d; const p=Math.pow(10,d); return Math.round(Number((Math.abs(v)*p).toPrecision(12)))/p*(v<0?-1:1); };
const okPasso=v=>{ const a=Math.abs(v)*12, k=Math.round(a); return Math.abs(a-k)<0.07 && [0,2,3,4,6,8,9,10].indexOf(k%12)!==-1; };   /* su numeri a 2 decimali (,17 = 1/6) */
/* --- dati inventati --- */
function feriali(y,m,val,sab){ const g={}; const nd=new Date(y,m,0).getDate(); for(let d=1;d<=nd;d++){ const wd=new Date(y,m-1,d).getDay(); if(wd===0) continue; if(wd===6 && !sab) continue; g[d]=val; } return g; }
function ottCinque(){ const g=feriali(2026,10,'3,25'); g[5]='FERIE'; g[6]='FERIE'; g[7]='MAL'; g[8]='MAL'; g[9]='MAL'; g[12]='ASS.ING'; g[13]='3'; return g; }
function ottSei(){ const g={}; const lav=[]; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0) continue; if(wd===6){ g[d]='AN'; continue; } lav.push(d); }
  lav.forEach((d,i)=>{ g[d]= i<8 ? 'MAL' : (i%2 ? '5,25' : '4,75'); }); g[lav[lav.length-1]]='5'; return g; }
const ST={ version:4, anni:[2026], locked:{}, costoComune:{}, dipendenti:[
  {id:'q',nome:'PROVA QUINDICI',oreSett:15,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',colore:'#00B0F0',tettiAnnui:[{id:'t1',ore:'400',periodo:'scolastico',anno:'2026'}]},
  {id:'c',nome:'PROVA CINQUE',oreSett:19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',colore:'#FFC000',ana:{ggSettCosto:'5'}},
  {id:'s',nome:'PROVA SEI',oreSett:19,livello:'D2',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'15/09/2025',colore:'#9AD0C2'},
  {id:'o',nome:'PROVA ORARIO',oreSett:15,livello:'D1',tipoContratto:'indeterminato',mensilizzato:false,dataAssunzione:'01/01/2020',colore:'#FFDDFF'},
  {id:'x',nome:'PROVA CELLE',oreSett:20,livello:'C1',tipoContratto:'indeterminato',mensilizzato:false,dataAssunzione:'01/01/2020',colore:'#B7A4D6'}],
  dati:{
    '2026-09':{ q:{giorni:feriali(2026,9,'3')}, o:{giorni:feriali(2026,9,'3')} },
    '2026-10':{ q:{giorni:feriali(2026,10,'3')}, c:{giorni:ottCinque(), permessi:{13:{ore:1.25,tipo:'EXF'}}}, s:{giorni:ottSei()}, o:{giorni:feriali(2026,10,'3')},
                x:{giorni:{6:'7,66'}} },
    '2026-11':{ x:{giorni:feriali(2026,11,'0,17',true)} } } };
/* numeri del motore, nella pagina */
const motore=(pg)=>pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); ggComuneAggiorna(st); const o={};
  const ott=[{y:2026,m:10}], sett=[{y:2026,m:9}];
  st.dipendenti.forEach(dp=>{ const T=(typeof tsMese==='function')?tsMese(st,dp,2026,10):null; const B=cedolinoBox(st,dp,2026,10); const d=datiCosto(st,dp,ott), d9=datiCosto(st,dp,sett);
    const rec10=getRecFrom(st,2026,10,dp.id);
    o[dp.id]={ ts:T?{ordC:T.ordC,supp:T.supp,tratt:T.tratt,monte:T.monte,ass:T.assTot,ero:T.eroTot,ced:T.ced,ferie:T.ferie.ore,altre:T.altre.map(a=>[a.cod,a.ore]),perm:T.permTipi.map(a=>[a.cod,a.ore]),sotto:T.sotto}:null,
      box:B?{ced:B.ced,ordC:B.ordC,supp:B.supp,monte:B.monte,tratt:B.tratt}:null, ced:(cedOrePubblica(st)['2026-10']||{})[dp.id],
      costo:{H38:R2(d.res.H38,2),J35:R2(d.res.J35,2),eh:d.oreMancanti?'nc':R2(d.res.orario,2),supp:R2(oreSuppPeriodo(st,dp,ott,null,null,0).ore,3)},
      costo9:{H38:R2(d9.res.H38,2),J35:R2(d9.res.J35,2),eh:d9.oreMancanti?'nc':R2(d9.res.orario,2)},
      prod:prodottoMese(rec10,dp,2026,10,st), banca:bancaMeseA(st,dp,2026,10), banca9:bancaMeseA(st,dp,2026,9),
      tot10:totOfRec(rec10,2026,10), tot9:totOfRec(getRecFrom(st,2026,9,dp.id),2026,9), tot11:totOfRec(getRecFrom(st,2026,11,dp.id),2026,11),
      righe:oreSuppPeriodo(st,dp,[{y:2026,m:9},{y:2026,m:10}],null,null,0).righe.map(r=>[r.supp,r.ordCed,r.ced,r.tratt]) }; });
  return o; });
async function tsPdf(pg){ await K.vai(pg,'Ott'); await pg.getByRole('button',{name:'🖨️ Report PDF A4 per le paghe',exact:true}).click(); await pg.waitForTimeout(400);
  const s=pg.locator('.modal select'); await s.nth(0).selectOption('10'); await s.nth(1).selectOption('2026');
  const f=await K.scarica(pg,()=>pg.locator('.modal .modal-actions button').last().click(),60000); const txt=K.sh('pdftotext -layout "'+f.f+'" -'); return {f:f.f,nome:f.nome,pagine:txt.split('\f').filter(x=>x.trim())}; }
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{stato:ST}); const toast=async()=> (await pg.locator('.toast').allInnerTexts()).join(' ');
  T('M01 targhetta '+K.APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(K.APPV)!==-1);
  /* ===== a) lettura dei sesti ===== */
  const L=await pg.evaluate(()=>({ s31:R2(parseHour('0,17')*31,4), p:[parseHour('2,33'),parseHour('7,66'),parseHour('3,75'),parseHour('1,6666'),parseHour('7.83')] }));
  T('M02 «0,17» si legge 1/6 d\'ora: 31 × 0,17 = 5,1667 (non 5,27)', L.s31===5.1667, L.s31);
  T('M03 2,33 = 2 h 20 · 7,83 = 7 h 50 esatti; 7,66, 3,75 e 1,6666 restano come sono', Math.abs(L.p[0]-(2+1/3))<1e-12 && L.p[1]===7.66 && L.p[2]===3.75 && L.p[3]===1.6666 && Math.abs(L.p[4]-(7+5/6))<1e-12, JSON.stringify(L.p));
  const M=await motore(pg);
  T('M04 un mese di 25 celle «0,17»: TOT 4,17 (25 × 10 min = 4 h 10)', M.x.tot11===4.17, M.x.tot11);
  /* ===== b) celle del Tabellone ===== */
  await K.vai(pg,'Ott');
  const C=(d)=>K.cella(pg,'PROVA CELLE',d);
  const scrivi=async(d,txt)=>{ const c=C(d); await c.click(); await c.press('Control+a'); await c.press('Delete'); await pg.keyboard.type(txt,{delay:15}); await c.press('Tab'); await pg.waitForTimeout(250); return await c.inputValue(); };
  let v=await scrivi(1,'3,86'); let t=await toast();
  T('M05 «3,86» battuto: il 6 non entra, «3,8» all\'uscita si rifiuta, cella vuota con l\'avviso dei decimali ammessi', v==='' && /,000 ,167 ,250 ,333 ,500 ,667 ,750 ,833/.test(t), v+' / '+t);
  T('M06 «3,5» → 3,500', (await scrivi(2,'3,5'))==='3,500');   /* ver185: tre decimali */
  T('M07 «3,17» → 3,167 (10 minuti)', (await scrivi(3,'3,17'))==='3,167');
  v=await scrivi(5,'3,3'); T('M08 «3,3» (3 h 18) si rifiuta all\'uscita', v==='', v);
  { const a7=await scrivi(7,'3,75'), a8=await scrivi(8,'2,83'), a9=await scrivi(9,'4,0'); T('M09 «3,75» → 3,750; «2,83» → 2,833; «4,0» → 4,000', a7==='3,750' && a8==='2,833' && a9==='4,000', [a7,a8,a9].join(' ')); }
  v=await scrivi(10,'3,4'); T('M10 «3,4»: il 4 dopo la virgola non entra (resta 3,000)', v==='3,000', v);
  { const a12=await scrivi(12,'14'), a13=await scrivi(13,'-3'); T('M11 tetto 13 ore e niente negativi (come nella ver183): «14» → 1,000 · «-3» → cella vuota', a12==='1,000' && a13==='', a12+' / '+a13); }
  const st1=await K.statoLS(pg); /* niente è salvato senza 💾: si guarda lo stato a video */
  const c6=C(6); const cls6=await c6.getAttribute('class'); const box6=(await K.carta(pg,'PROVA CELLE').locator('.fuoripasso-box').innerText().catch(()=>'')).replace(/\s+/g,' ');
  T('M12 la cella già nei dati «7,66» è segnalata (ambra tratteggiata, diversa dal rosso) con il riquadro che elenca il giorno', /fuoripasso/.test(cls6) && !/ignota/.test(cls6) && /6 \(7,66\)/.test(box6) && /come sono scritte/.test(box6), cls6+' / '+box6.slice(0,120));
  await c6.click(); await pg.waitForTimeout(100); await c6.press('Tab'); await pg.waitForTimeout(200);
  T('M13 entrandoci e uscendo senza scrivere, «7,66» resta (non si cancella, non si converte)', (await c6.inputValue())==='7,660', await c6.inputValue());   /* ver185: si mostra a tre decimali, il dato resta «7,66» (M21) */
  const totX=n((await K.carta(pg,'PROVA CELLE').locator('.foot-tot b').innerText()));
  T('M14 TOT di PROVA CELLE conta 7,66 com\'è: 3,50+3,17+3,75+2,83+4,00+3,00+1,00+7,66 = 28,91', Math.abs(totX-28.91)<0.006, totX);
  /* ===== c) Compila veloce ===== */
  const G=K.carta(pg,'PROVA CELLE'); const qf=async(val)=>{ await G.locator('.edit-mini.qf').click(); await pg.waitForTimeout(300); const m=pg.locator('.modal'); await m.locator('input').first().fill(val); await pg.waitForTimeout(150);
    const b=m.locator('.modal-actions button').last(); return {m,b,dis:await b.isDisabled(),txt:(await m.innerText()).replace(/\s+/g,' ')}; };
  for(const val of ['3,86','3,4','2,1']){ const q=await qf(val); T('M15 Compila veloce «'+val+'»: pulsante spento con il motivo dei minuti', q.dis && /,000 ,167 ,250 ,333 ,500 ,667 ,750 ,833/.test(q.txt)); await q.m.locator('.modal-actions button').filter({hasText:'Annulla'}).click(); await pg.waitForTimeout(200); }
  let q=await qf('3,75'); T('M16 Compila veloce «3,75»: pulsante acceso', !q.dis);
  await q.m.locator('input[type=radio]').nth(2).check(); await q.m.locator('input[placeholder="es. 3, 7, 12"]').fill('4, 11, 14, 15'); await pg.waitForTimeout(150);
  const qtxt=(await q.m.innerText()).replace(/\s+/g,' ');
  T('M17 «Solo questi giorni: 4, 11, 14, 15» (4 e 11 domeniche): «saltati 2 giorni rossi», interessati 2', /Giorni interessati: 2/.test(qtxt) && /saltati 2 giorni rossi/.test(qtxt), qtxt.slice(qtxt.indexOf('Giorni interessati'),qtxt.indexOf('Giorni interessati')+120));
  await q.b.click(); await pg.waitForTimeout(300);
  T('M18 i giorni rossi restano vuoti (4 e 11) e il 14 e il 15 hanno 3,75', (await C(4).inputValue())==='' && (await C(11).inputValue())==='' && (await C(14).inputValue())==='3,750' && (await C(15).inputValue())==='3,750');
  /* ===== d) permesso orario ===== */
  const permApri=async(d)=>{ await G.locator('table.cal tr').nth(2).locator('td').nth(d-1).locator('.perm-flag').click(); await pg.waitForTimeout(300); return pg.locator('.modal'); };
  let pm=await permApri(16); const tipoInp=await pm.locator('.field input').first().getAttribute('type');
  await pm.locator('.field input').first().click(); await pg.keyboard.type('1,5'); await pm.locator('select').selectOption('EXF'); await pm.locator('.modal-actions button').last().click(); await pg.waitForTimeout(300);
  const lbl=(await G.locator('.perm-lbl').allInnerTexts()).join('|');
  T('M19 permesso: casella di testo, «1,5» = 1,5 h (non 15)', tipoInp==='text' && /\+1,500 h EXF/.test(lbl), tipoInp+' / '+lbl);
  pg._dialoghi=[]; pm=await permApri(17); await pm.locator('.field input').first().fill('1,3'); await pm.locator('select').selectOption('EXF'); await pm.locator('.modal-actions button').last().click(); await pg.waitForTimeout(300);
  T('M20 permesso «1,3» rifiutato con i decimali ammessi', (pg._dialoghi||[]).some(x=>/,000 ,167 ,250/.test(x)) && await pg.locator('.modal').count()===1, (pg._dialoghi||[]).join('|'));
  await pg.locator('.modal .field input').first().fill('1,17'); await pg.locator('.modal .modal-actions button').last().click(); await pg.waitForTimeout(300);
  const pst=await pg.evaluate(()=>{ return null; });
  /* salvo e leggo l'archivio */
  await pg.locator('.btn-save').click(); await pg.waitForTimeout(600); const stS=await K.statoLS(pg); const px=stS.dati['2026-10'].x.permessi||{};
  T('M21 permessi in archivio: 1,5 h e 1 h 10 esatta (1,1667); i nuovi valori delle celle salvati come scritti', px[16].ore===1.5 && Math.abs(px[17].ore-7/6)<1e-12 && stS.dati['2026-10'].x.giorni[3]==='3,17' && stS.dati['2026-10'].x.giorni[6]==='7,66', JSON.stringify(px)+' '+JSON.stringify(stS.dati['2026-10'].x.giorni).slice(0,160));
  /* ===== e) il TS e gli stessi numeri ovunque ===== */
  const A=await motore(pg);
  const PS=await tsPdf(pg);
  T('M22 TS di ottobre: un foglio per ogni mensilizzato (3)', PS.pagine.length===3, PS.pagine.length);
  for(const [id,nome] of [['q','PROVA QUINDICI'],['c','PROVA CINQUE'],['s','PROVA SEI']]){
    const pag=PS.pagine.find(p=>p.indexOf(nome)!==-1)||''; const righe=pag.split('\n').filter(l=>/^\s*\d{1,2} (lun|mar|mer|gio|ven|sab|dom)\b/.test(l));
    const celle=[]; let crocetta=0; righe.forEach(l=>{ const croce=/†/.test(l); if(croce) crocetta++; (l.match(/\d+,\d{3}/g)||[]).forEach((x,i)=>{ if(croce && i===0) return; celle.push(x); }); });
    const fuori=celle.filter(x=>!okPasso(n(x)));
    const tot=/TOTALE\s+([\d.,]+)(?: \*)?\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/.exec(pag); const S=A[id].ts;
    T('M23 '+nome+': '+celle.length+' celle del TS tutte ammesse (,00 ,17 ,25 ,33 ,50 ,67 ,75 ,83)', celle.length>20 && fuori.length===0, fuori.join(' '));
    T('M24 '+nome+': TOTALE = componenti del TS (ordinarie '+R2(S.ordC)+' · suppl. '+R2(S.supp)+' · retribuite '+R2(S.ass)+' · trattenute '+R2(S.tratt)+')', tot && Math.abs(n(tot[1])-S.ordC)<0.006 && Math.abs(n(tot[2])-S.supp)<0.006 && Math.abs(n(tot[3])-S.ass)<0.006 && Math.abs(n(tot[4])-S.tratt)<0.006, tot&&tot.slice(1).join(' / '));
    T('M25 '+nome+': supplementari, retribuite e trattenute del totale sono al passo', tot && okPasso(n(tot[2])) && okPasso(n(tot[3])) && okPasso(n(tot[4])));
    T('M26 '+nome+': box = TS = cedOre = denominatore del Costo orario (ott) = '+R2(S.ced), Math.abs(A[id].box.ced-R2(S.ced,2))<0.0051 && Math.abs(A[id].ced-R2(S.ced,2))<0.001 && Math.abs(A[id].costo.H38-R2(S.ced,2))<0.001, JSON.stringify([A[id].box.ced,A[id].ced,A[id].costo.H38]));
    T('M27 '+nome+': supplementari del Costo orario = TS; consumo del Tetto = ced + erosive del TS', Math.abs(A[id].costo.supp-S.supp)<0.0006 && Math.abs(A[id].prod-R2(S.ced+S.ero,3))<0.0006, A[id].costo.supp+' / '+A[id].prod);
    if(id==='q'){ T('M28 PROVA QUINDICI: ORE MESE 65,13 intatte (non 65,17), ordinarie 65,13 col «†» sull\'ultima riga e la nota dello scarto −0,04', /ORE CONTRATTUALI \(stipendio fisso\): 65,130 h/.test(pag) && crocetta===1 && /comprendono -0,037 h/.test(pag.replace(/\s+/g,' ')) && tot && n(tot[1])===65.13, 'croce '+crocetta+' · '+(tot&&tot[1]));
      const conOrd=righe.filter(l=>/^\s*\d{1,2} \w{3}(?:\s+(?:AN|R|FESTNG))?\s+\d+,\d{3}/.test(l)); const ult=conOrd[conOrd.length-1]||''; const vu=n((/\s(\d+,\d{3}) †/.exec(ult)||[])[1]);
      T('M29 PROVA QUINDICI: la riga con lo scarto («†») è l\'ultima con ordinarie e vale un passo ammesso meno 0,04 ('+(ult.trim().slice(0,30))+')', /†/.test(ult) && okPasso(R2(vu+0.0367,2)), ult.trim()); }
    if(id==='c'){ const flat=pag.replace(/\s+/g,' ');
      T('M30 PROVA CINQUE (5 gg a sett., quota 3,80 fuori griglia): FERIE 2 gg = 7,67 · MAL 3 gg = 11,33 · EXF 1,25 · ASS.ING 3,83', /FERIE 2 gg = 7,667 h/.test(flat) && /MAL 3 gg = 11,333 h/.test(flat) && /permessi EXF 1,250 h/.test(flat) && /DA TRATTENERE: 3,833 h/.test(flat), flat.slice(flat.indexOf('DA INSERIRE'),flat.indexOf('DA INSERIRE')+420)); }
    if(id==='s'){ const cg=(await K.carta(pg,nome).locator('.cong').first().innerText()).replace(/\s+/g,' '); const mm=/Risultato del mese: ([+\-]?[\d.,]+)/.exec(cg);
      T('M31 PROVA SEI: il Risultato del mese del Tabellone resta il VERO a 3 decimali ('+(mm&&mm[1])+'), il TS porta le supplementari al passo ('+R2(S.supp,2)+')', mm && /,\d{3}$/.test(mm[1]) && Math.abs(n(mm[1])-A.s.banca)<0.0006 && !okPasso(A.s.banca) && okPasso(R2(S.supp,2)) && Math.abs(A.s.banca-S.supp)<0.09, cg.slice(0,140)); }
  }
  /* box a video = TS */
  await K.vai(pg,'Ott'); const bx=(await K.carta(pg,'PROVA CINQUE').locator('.ced-box').innerText()).replace(/\s+/g,' ');
  T('M32 box a video di PROVA CINQUE: ferie 7,67 · altre 11,33 · permessi 1,25 · da trattenere 3,83 (gli stessi numeri del TS)', /di cui ferie 7,667 h/.test(bx) && /altre assenze retribuite 11,333 h/.test(bx) && /permessi retribuiti 1,250 h/.test(bx) && /da trattenere 3,833 h/.test(bx), bx.slice(0,300));
  /* ===== mesi non a cedolino mensilizzato: identici alla ver183 ===== */
  const V=await K.apri(br,{ver:'ver183',stato:ST}); const B=await motore(V.pg);
  const ugu=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  T('M33 PROVA ORARIO (non mensilizzato): TOT, Risultato del mese, Costo orario sett. e ott., righe del costo identici alla ver183', ugu([B.o.tot10,B.o.banca,B.o.costo,B.o.costo9,B.o.righe,B.o.box],[M.o.tot10,M.o.banca,M.o.costo,M.o.costo9,M.o.righe,M.o.box]), JSON.stringify(M.o.costo)+' vs '+JSON.stringify(B.o.costo));
  T('M34 settembre 2026 (prima della base mensile) di PROVA QUINDICI: identico alla ver183', ugu([B.q.tot9,B.q.banca9,B.q.costo9,B.q.righe[0]],[M.q.tot9,M.q.banca9,M.q.costo9,M.q.righe[0]]));
  T('M35 Risultato del mese (vero) di ottobre identico alla ver183 per i tre mensilizzati', ugu([B.q.banca,B.c.banca,B.s.banca],[M.q.banca,M.c.banca,M.s.banca]), [M.q.banca,M.c.banca,M.s.banca].join(' / '));
  T('M36 25 celle «0,17»: la ver183 dava 4,25 (lettura decimale), la ver184 4,17', B.x.tot11===4.25 && M.x.tot11===4.17, B.x.tot11+' → '+M.x.tot11);
  console.log('     ver183 → ver184 (ott): '+['q','c','s'].map(id=>id+': ordC '+(B[id].box&&B[id].box.ordC)+'→'+M[id].box.ordC+' supp '+(B[id].box&&B[id].box.supp)+'→'+M[id].box.supp+' tratt '+(B[id].box&&B[id].box.tratt)+'→'+M[id].box.tratt+' ced '+B[id].ced+'→'+M[id].ced).join(' | '));
  await V.ctx.close();
  /* ===== PARTE 2 ===== */
  /* 1) monte ore negativo */
  await K.vai(pg,'ana'); await pg.locator('.ana-wrap button').filter({hasText:'PROVA ORARIO'}).first().click(); await pg.waitForTimeout(400);
  await pg.getByRole('button',{name:'+ Aggiungi periodo'}).click(); await pg.waitForTimeout(150);
  const ot=pg.locator('input[placeholder="es. 20"]'); await ot.click(); await pg.keyboard.type('-20'); const otv=await ot.inputValue();
  await pg.getByRole('button',{name:'+ Aggiungi trasformazione'}).click().catch(()=>{}); await pg.waitForTimeout(150);
  const tr=pg.locator('input[placeholder="es. 24"]'); await tr.click(); await pg.keyboard.type('-20'); const trv=await tr.inputValue();
  T('M37 1) monte ore temporaneo e «Nuovo monte ore/sett»: il segno meno non entra («-20» → «20»)', otv==='20' && trv==='20', otv+' / '+trv);
  /* 2) valori comuni: svuotare dà vuoto */
  await K.vai(pg,'costo'); await pg.getByRole('button',{name:/Aliquote e costi fissi validi per tutti/}).click(); await pg.waitForTimeout(300);
  const comune=(lbl)=>pg.locator('label').filter({has:pg.locator('span',{hasText:new RegExp('^'+lbl.replace(/[%.()]/g,'\\$&')+'$')})}).locator('input').first();
  let res=[];
  for(const [lbl,val] of [['INPS %','26,90'],['Divisore TFR','13,5'],['FIS %','0,6']]){ const i=comune(lbl); await i.click(); await i.press('Control+a'); await i.press('Delete'); await pg.waitForTimeout(150);
    const vuota=await i.inputValue(), ph=await i.getAttribute('placeholder'); await pg.keyboard.type(val,{delay:10}); await pg.waitForTimeout(150); res.push([lbl,vuota,ph,await i.inputValue()]); }
  T('M38 2) valori comuni: svuotata la casella resta vuota (il predefinito come segnaposto) e riscrivendo «26,90» si legge 26,90 (era 26,9027)', res.every(r=>r[1]==='' && r[2]!=='' && r[3]===({ 'INPS %':'26,90','Divisore TFR':'13,5','FIS %':'0,6'})[r[0]]), JSON.stringify(res));
  /* 4) import: schema */
  const imp=async(nome,contenuto)=>{ const f=K.OUT+'/'+nome; fs.writeFileSync(f,contenuto); const visti=[]; await pg.locator('input.hidden-file').setInputFiles(f); for(let i=0;i<12;i++){ visti.push(...await pg.locator('.toast').allInnerTexts()); await pg.waitForTimeout(150);} return [...new Set(visti)].join(' · '); };
  const prima=JSON.stringify(await pg.evaluate(()=>1)); await pg.locator('.btn-save').click().catch(()=>{}); await pg.waitForTimeout(400);
  const lsP=JSON.stringify(await K.statoLS(pg)); const conta=async()=> await pg.locator('.emp-card').count();
  await K.vai(pg,'Ott'); const nCard=await conta();
  const fut=JSON.parse(lsP); fut.version=99; fut.dipendenti.push({id:'z',nome:'ZETA FUTURO',oreSett:10});
  t=await imp('futuro.json',JSON.stringify(fut));
  T('M39 4) backup di schema 99: rifiutato con il motivo, niente a video né in archivio', /schema dati \(99\)/.test(t) && JSON.stringify(await K.statoLS(pg))===lsP && await K.carta(pg,'ZETA FUTURO').count()===0, t);
  const str=JSON.parse(lsP); str.version='4'; str.dipendenti.push({id:'z',nome:'ZETA STRINGA',oreSett:10}); t=await imp('stringa.json',JSON.stringify(str));
  T('M40 4) schema non numerico («"4"»): rifiutato', /NON importato/.test(t) && await K.carta(pg,'ZETA STRINGA').count()===0, t);
  const sen=JSON.parse(lsP); delete sen.version; sen.dipendenti.push({id:'z',nome:'ZETA SENZA',oreSett:10}); pg._risposta=false; pg._dialoghi=[]; t=await imp('senza.json',JSON.stringify(sen));
  T('M41 4) backup senza schema: chiede conferma; rispondendo NO niente cambia', (pg._dialoghi||[]).some(x=>/numero di schema/.test(x)) && /Import annullato/.test(t) && await K.carta(pg,'ZETA SENZA').count()===0, t);
  pg._risposta=undefined; pg._dialoghi=[]; t=await imp('senza2.json',JSON.stringify(sen));
  T('M42 4) backup senza schema, rispondendo SÌ: entra a video (serve 💾)', /importato/.test(t) && await K.carta(pg,'ZETA SENZA').count()===1 && JSON.stringify(await K.statoLS(pg))===lsP, t);
  const okv=JSON.parse(lsP); okv.dipendenti.push({id:'w',nome:'ZETA BUONO',oreSett:10}); t=await imp('buono.json',JSON.stringify(okv));
  T('M43 4) backup normale (schema 4): entra come prima', /importato/.test(t) && await K.carta(pg,'ZETA BUONO').count()===1, t);
  /* grafica */
  for(const w of [390,1280]){ await pg.setViewportSize({width:w,height:900}); await K.vai(pg,'Ott'); await pg.waitForTimeout(300); const m=await K.misura(pg);
    const piccoleNuove=m.esempi.filter(x=>/fuori griglia|saltati|come sono scritte/.test(x));
    T('M44 '+w+'px: nessuno scorrimento laterale, riquadro dei minuti senza scritte sotto 12,5px', !m.lato && piccoleNuove.length===0, m.W+'/'+m.SW+' piccole '+m.piccole+' '+m.esempi.join(';'));
    await pg.screenshot({path:K.OUT+'/ver184-tab-'+w+'.png',fullPage:false}); }
  T('M45 zero errori di pagina (banco proprio)', E.length===0, E.join('|'));
  await ctx.close();
  /* ===== 5) uscita da un'altra scheda (banco comune, finta Firebase) ===== */
  const URL='http://127.0.0.1:'+PC+'/'; const FO='spazio-ireos-foglio-ore', ADMIN='spazioireos@gmail.com', PWD='prova123';
  const doc={ version:4, anni:[2026], locked:{}, costoComune:{}, dipendenti:[{id:'d1',nome:'ROSSI PROVA',livello:'D1',oreSett:19,tipoContratto:'indeterminato',proroghe:[],trasformazioni:[],orariTemp:[],ana:{},colore:'#00B0F0',dataAssunzione:'01/01/2024'}],
    dati:{'2026-10':{d1:{giorni:{'1':'4','2':'4,5'}}}} };
  const c2=await br.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
  await c2.addInitScript(s=>{ window.__FAKEFB_SEED__=s; },{ id:'ver184-esci', [FO]:{ reset:true, users:[{email:ADMIN,password:PWD,uid:'ADMIN0001'}],
    docs:{'report-ore-mensile/ADMIN0001':doc,'users/ADMIN0001':{email:ADMIN,name:'AMMINISTRAZIONE PROVA',cognome:'AMMINISTRAZIONE',nome:'PROVA',role:'admin'}}, session:{email:ADMIN,app:'[DEFAULT]'} } });
  const E2=[]; const pd=await c2.newPage(); pd.on('pageerror',e=>E2.push(e.message.slice(0,160))); pd.on('dialog',d=>d.accept());
  await pd.goto(URL+'dip/'); await pd.waitForSelector('.app-header',{timeout:40000}).catch(()=>{});
  await pd.locator('.tabs .tab').nth(9).click(); await pd.waitForTimeout(700);
  const cd=pd.locator('.emp-card').first().locator('table.cal tr').nth(2).locator('td').nth(4).locator('input.cell-in');   /* il 5 ottobre */
  await cd.click(); await pd.keyboard.type('6,25'); await cd.press('Tab'); await pd.waitForTimeout(300);
  const dirty1=await pd.locator('.btn-save.dirty').count();
  const pf=await c2.newPage(); pf.on('dialog',d=>d.accept()); await pf.goto(URL+'fo/'); await pf.waitForSelector('#app-main:not(.hide)',{timeout:20000}).catch(()=>{});
  const foDentro=await pf.isVisible('#app-main'); await pf.evaluate(()=>{ try{ esci(); }catch(e){ firebase.auth().signOut(); } }); await pf.waitForTimeout(1500);
  await pd.waitForSelector('.login-box',{timeout:10000}).catch(()=>{});
  const banner=(await pd.locator('.pendente-box').innerText().catch(()=>'')).replace(/\s+/g,' ');
  T('M46 5) «Esci» in Fogli ore (altra scheda) con modifiche non salvate in Dipendenti: schermata di accesso con l\'avviso «Sei stato disconnesso da un\'altra scheda… NON sono salvate»', dirty1===1 && foDentro && /disconnesso da un'altra scheda/.test(banner) && /NON sono salvate/.test(banner), 'dirty '+dirty1+' fo '+foDentro+' · '+banner.slice(0,140));
  await pd.screenshot({path:K.OUT+'/ver184-disconnesso.png'});
  const dlP=pd.waitForEvent('download',{timeout:10000}).catch(()=>null); await pd.getByRole('button',{name:'⬇ Backup delle modifiche'}).click(); const dl=await dlP; let bkOk=false;
  if(dl){ const f=K.OUT+'/'+dl.suggestedFilename(); await dl.saveAs(f); const j=JSON.parse(fs.readFileSync(f,'utf8')); bkOk=j.dati['2026-10'].d1.giorni['5']==='6,25'; }
  T('M47 5) «⬇ Backup delle modifiche» scarica un JSON che contiene la modifica non salvata', bkOk, dl&&dl.suggestedFilename());
  const cloud0=await pd.evaluate(()=>__fakefb.get('spazio-ireos-foglio-ore','report-ore-mensile/ADMIN0001'));
  T('M48 5) intanto nel cloud NON è stato scritto niente da solo', !(cloud0.dati['2026-10'].d1.giorni['5']));
  const inp=pd.locator('.login-box input'); await inp.nth(0).fill(ADMIN); await inp.nth(1).fill(PWD); await pd.locator('.login-box button').last().click();
  await pd.waitForSelector('.app-header',{timeout:20000}).catch(()=>{}); await pd.waitForTimeout(800);
  await pd.locator('.tabs .tab').nth(9).click(); await pd.waitForTimeout(500);
  const v5=await pd.locator('.emp-card').first().locator('table.cal tr').nth(2).locator('td').nth(4).locator('input.cell-in').inputValue();
  T('M49 5) rientrando con lo stesso account la modifica è ancora a video e il 💾 è acceso', v5==='6,250' && await pd.locator('.btn-save.dirty').count()===1, v5);
  await pd.locator('.btn-save').click(); await pd.waitForTimeout(1200);
  const cloud1=await pd.evaluate(()=>__fakefb.get('spazio-ireos-foglio-ore','report-ore-mensile/ADMIN0001'));
  T('M50 5) col 💾 la modifica arriva nel cloud', cloud1.dati['2026-10'].d1.giorni['5']==='6,25');
  /* uscita voluta da qui: nessun avviso */
  await pd.getByRole('button',{name:'Esci',exact:true}).click(); await pd.waitForSelector('.login-box',{timeout:10000}).catch(()=>{}); await pd.waitForTimeout(300);
  T('M51 5) «Esci» premuto in Dipendenti (senza modifiche): accesso normale, nessun avviso di disconnessione', await pd.locator('.login-box').count()===1 && await pd.locator('.pendente-box').count()===0);
  T('M52 zero errori di pagina (banco comune)', E2.length===0, E2.join('|'));
  await c2.close();
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
