/* Collaudo ver187 (dati INVENTATI): «📤 Pubblica i residui» segnala a Fogli ore chi è dipendente (`dip:true`
   in residui/<uid>) e il Tabellone mostra la chiusura del mese di Fogli ore (`meseChiuso`, `completamento`).
   Prima: bash ../rendicontazione-usoint/collaudo/comune/prepara-comune.sh 8344   (banco comune, finta Firebase)
          + la ver186 congelata in .banco/dip186/ (localizza.py sulla ver186, vedi LEGGIMI.md)
   Poi:   node collaudo/ver187.cjs [porta-comune] [cartella-png]                                                */
const K=require('./a00-comune.cjs'); const R=K.contatore('ver187'); const T=R.T; const fs=require('fs');
const PC=process.argv[2]||'8344'; const PNG=process.argv[3]||K.OUT;
const URL='http://127.0.0.1:'+PC+'/'; const FO='spazio-ireos-foglio-ore', ADMIN='spazioireos@gmail.com', PWD='prova123';
try{ fs.mkdirSync(PNG,{recursive:true}); }catch(e){}
const ts=(ms)=>({__ts:ms}); const QUANDO=Date.UTC(2026,10,3,9,0,0);
const tet=(anno,per)=>[{id:'t'+anno+per,ore:'400',periodo:per||'scolastico',anno:String(anno)}];
const dip=(id,nome,uid,x)=>Object.assign({id,nome,livello:'D1',oreSett:19,tipoContratto:'indeterminato',proroghe:[],trasformazioni:[],orariTemp:[],ana:{},
  colore:'#00B0F0',dataAssunzione:'01/01/2024',mensilizzato:true,mensilizzatoDal:'01/10/2026'},uid?{foUid:uid}:{},x||{});
const feriali=(val)=>{ const g={}; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0||wd===6) continue; g[d]=val; } return g; };
const ST={ version:4, anni:[2026], locked:{}, costoComune:{}, dipendenti:[
  dip('a','ALFA PROVA','W1',{tettiAnnui:tet(2026)}),                                   /* agganciato, massimale in periodo */
  dip('b','BETA PROVA','W2'),                                                          /* agganciato, nessun massimale */
  dip('c','GAMMA PROVA',null),                                                         /* NON agganciato (nome), nessun massimale */
  dip('d','DELTA PROVA','W4',{dataCessazione:'30/06/2026',cessManuale:true}),          /* agganciato CESSATO, nessun massimale */
  dip('e','EPSILON PROVA','W5',{tettiAnnui:tet(2027)}),                                /* agganciato, massimale solo dall'a.s. 2027/28: fuori periodo */
  dip('f','ZETA PROVA','W6',{tettiAnnui:tet(2026),dataCessazione:'31/08/2026',cessManuale:true}),   /* agganciato CESSATO, massimale in periodo */
  dip('g','ETA PROVA',null,{tettiAnnui:tet(2026)}),                                    /* NON agganciato (nome), massimale in periodo */
  dip('h','THETA PROVA','W8',{tettiAnnui:tet(2027),dataCessazione:'31/07/2026',cessManuale:true})],   /* agganciato CESSATO, massimale fuori periodo */
  dati:{ '2026-09':{ a:{giorni:feriali('3')} },
         '2026-10':{ a:{giorni:feriali('4')}, b:{giorni:feriali('4')}, c:{giorni:feriali('4')}, e:{giorni:feriali('4')}, g:{giorni:feriali('4')} } } };
const uFO=(uid,c,n,role)=>({['users/'+uid]:{role:role||'worker',cognome:c,nome:n,name:c+' '+n,email:uid.toLowerCase()+'@prova.it'}});
const tsFO=(uid,si,days,x)=>({['timesheets/'+uid+'__2026_10_'+si]:Object.assign({workerUid:uid,year:2026,month:10,days:days,mansione:'EDUCATORE',sede:'SEDE',comune:'X'},x||{})});
const giorno=(h)=>({t1f:'08:00',t1t:String(8+h).padStart(2,'0')+':00'});
const docs=Object.assign({},
  uFO('ADMIN0001','AMMINISTRAZIONE','PROVA','admin'),
  uFO('W1','ALFA','PROVA'), uFO('W2','BETA','PROVA'), uFO('W3','GAMMA','PROVA'), uFO('W4','DELTA','PROVA'), uFO('W5','EPSILON','PROVA'),
  uFO('W6','ZETA','PROVA'), uFO('W7','ETA','PROVA'), uFO('W8','THETA','PROVA'),
  /* ALFA: due servizi chiusi, risposte discordi → «si» vince */
  tsFO('W1',0,{1:giorno(2),2:giorno(2)},{meseChiuso:true,meseChiusoAt:ts(QUANDO),completamento:'no'}),
  tsFO('W1',1,{5:giorno(2)},{meseChiuso:true,meseChiusoAt:ts(QUANDO+3600000),completamento:'si'}),
  /* BETA: ore, mese non chiuso */
  tsFO('W2',0,{1:giorno(4),2:giorno(4)}),
  /* GAMMA (abbinata per nome): chiuso senza risposta */
  tsFO('W3',0,{1:giorno(4)},{meseChiuso:true,meseChiusoAt:ts(QUANDO)}),
  /* EPSILON: chiuso, «no» */
  tsFO('W5',0,{1:giorno(4)},{meseChiuso:true,meseChiusoAt:ts(QUANDO),completamento:'no'}),
  /* ETA: documento vuoto (aperto e basta): nessuna pastiglia */
  tsFO('W7',0,{}),
  /* residui già pubblicati */
  {'residui/W2':{tetto:300,usate:10,restano:290,periodo:'scolastico',anno:2026,aggiornato:ts(QUANDO)},
   'residui/W3':{tetto:200,usate:5,restano:195,periodo:'scolastico',anno:2026},
   'residui/W4':{tetto:100,usate:1,restano:99,periodo:'scolastico',anno:2026,dip:true},
   'residui/W5':{tetto:250,usate:20,restano:230,periodo:'civile',anno:2025},
   'residui/W6':{tetto:400,usate:0,restano:400,periodo:'scolastico',anno:2026,dip:true},
   'residui/W8':{tetto:180,usate:9,restano:171,periodo:'civile',anno:2025,dip:true},
   'residui/ZZ9':{tetto:50,usate:0,restano:50,periodo:'civile',anno:2026}},
  {'report-ore-mensile/ADMIN0001':ST});
const seme=(id)=>({ id, [FO]:{ reset:true, users:[{email:ADMIN,password:PWD,uid:'ADMIN0001'}], docs:JSON.parse(JSON.stringify(docs)), session:{email:ADMIN,app:'[DEFAULT]'} } });

async function apriDip(br,cart,id,opz){ opz=opz||{};
  const ctx=await br.newContext({viewport:{width:opz.w||1500,height:1000},deviceScaleFactor:opz.dsf||1,acceptDownloads:true});
  await ctx.addInitScript(s=>{ window.__FAKEFB_SEED__=s; },seme(id));
  const pg=await ctx.newPage(); const E=[]; const D=[];
  pg.on('pageerror',e=>E.push(e.message.slice(0,160))); pg.on('dialog',d=>{ D.push(d.message()); d.accept(); });
  await pg.goto(URL+cart+'/'); await pg.waitForSelector('.app-header',{timeout:40000}).catch(()=>{});
  await pg.locator('.tabs .tab').nth(9).click(); await pg.waitForTimeout(1500);
  return {ctx,pg,E,D}; }
const pastiglie=(pg)=>pg.evaluate(()=>{ const o={}; document.querySelectorAll('.emp-card').forEach(c=>{ const n=c.querySelector('.emp-head .nome'); if(!n) return;
  const p=c.querySelector('.emp-head .chiu-pill'); o[n.textContent.trim()]=p?{t:p.textContent.trim(),cls:p.className,fs:getComputedStyle(p).fontSize,bg:getComputedStyle(p).backgroundColor,title:p.title}:null; }); return o; });
const residui=(pg)=>pg.evaluate(p=>{ const d=__fakefb.dump(p); const o={}; Object.keys(d).filter(k=>/^residui\//.test(k)).forEach(k=>o[k.slice(8)]=d[k]); return o; },FO);
const scrittureFO=(pg)=>pg.evaluate(()=>__fakefb.log.filter(o=>/set|update|delete|add|batch|commit/i.test(o.op)).map(o=>o.op+' '+o.path));
const motore=(pg)=>pg.evaluate(()=>{ const st=JSON.parse(JSON.stringify(__fakefb.get('spazio-ireos-foglio-ore','report-ore-mensile/ADMIN0001'))); ggComuneAggiorna(st);
  const pairs=[]; for(let m=1;m<=10;m++) pairs.push({y:2026,m}); const o={};
  st.dipendenti.forEach(dp=>{ const d=datiCosto(st,dp,pairs); o[dp.nome]=JSON.stringify({res:d.res,ore:d.oreManuali,banca:bancaMeseA(st,dp,2026,10),box:cedolinoBox(st,dp,2026,10),tot:totOfRec(getRecFrom(st,2026,10,dp.id),2026,10)}); });
  return o; });
async function pubblica(pg,D){ const n0=D.length; await pg.locator('button.btn-yellow',{hasText:'Pubblica i residui'}).click();
  for(let i=0;i<40;i++){ await pg.waitForTimeout(250); if(D.length>=n0+2) break; } await pg.waitForTimeout(500); return D.slice(n0); }

(async()=>{
  const br=await K.chromium.launch();
  /* ===== ver187 ===== */
  const A=await apriDip(br,'dip','ver187-a');
  T('V00 targhetta ver187', /ver187/.test(await A.pg.locator('.app-rev').innerText().catch(()=>'')));
  await A.pg.waitForFunction(()=>document.querySelectorAll('.chiu-pill').length>=4,null,{timeout:15000}).catch(()=>{});
  const P=await pastiglie(A.pg);
  T('V01 ALFA (due servizi chiusi, risposte «no» e «si»): «📨 Chiede ferie/permessi a completamento», ambra, ≥12,5px', P['ALFA PROVA']&&P['ALFA PROVA'].t==='📨 Chiede ferie/permessi a completamento'&&/chiu-si/.test(P['ALFA PROVA'].cls)&&parseFloat(P['ALFA PROVA'].fs)>=12.5&&/251, 191, 36/.test(P['ALFA PROVA'].bg), JSON.stringify(P['ALFA PROVA']));
  T('V02 la data di chiusura sta nel suggerimento (03/11/2026)', P['ALFA PROVA']&&/03\/11\/2026/.test(P['ALFA PROVA'].title), P['ALFA PROVA']&&P['ALFA PROVA'].title);
  T('V03 EPSILON (chiuso, «no»): «Lascia così», sobria', P['EPSILON PROVA']&&P['EPSILON PROVA'].t==='Lascia così'&&/chiu-no/.test(P['EPSILON PROVA'].cls), JSON.stringify(P['EPSILON PROVA']));
  T('V04 BETA (ore in Fogli ore, mese non chiuso): «Mese non ancora chiuso in Fogli ore», grigia ≥12,5px', P['BETA PROVA']&&P['BETA PROVA'].t==='Mese non ancora chiuso in Fogli ore'&&/chiu-aperto/.test(P['BETA PROVA'].cls)&&parseFloat(P['BETA PROVA'].fs)>=12.5, JSON.stringify(P['BETA PROVA']));
  T('V05 GAMMA (non agganciata, abbinata per nome; chiuso senza risposta): «Mese chiuso in Fogli ore»', P['GAMMA PROVA']&&P['GAMMA PROVA'].t==='Mese chiuso in Fogli ore', JSON.stringify(P['GAMMA PROVA']));
  T('V06 ETA (documento vuoto in Fogli ore): nessuna pastiglia', P['ETA PROVA']===null, JSON.stringify(P['ETA PROVA']));
  const conf=(await A.pg.locator('.emp-card').filter({has:A.pg.locator('.emp-head .nome',{hasText:'ALFA PROVA'})}).innerText()).replace(/\s+/g,' ');
  T('V07 la riga del confronto con Fogli ore c\'è ancora, identica (ore sul foglio ore 6,000 h)', /Confronto con "Fogli ore" — ALFA PROVA · ore sul foglio ore: 6,000 h/.test(conf), conf.slice(conf.indexOf('Confronto'),conf.indexOf('Confronto')+120));
  /* pubblica */
  const conf187=await pubblica(A.pg,A.D);
  const c0=(conf187[0]||'');
  T('V08 la conferma dice a chi viene segnalato che è dipendente (ALFA, BETA, EPSILON)', /viene anche segnalato che sono DIPENDENTI/.test(c0)&&/ALFA PROVA, BETA PROVA, EPSILON PROVA/.test(c0), c0.slice(c0.indexOf('Ai '),c0.indexOf('Ai ')+260));
  T('V09 la conferma dice chi NON viene segnalato perché cessato prima del mese (DELTA, THETA, ZETA)', /NON viene segnalato \(rapporto finito prima di Ottobre 2026\): DELTA PROVA, THETA PROVA, ZETA PROVA/.test(c0), c0.slice(c0.indexOf('NON viene'),c0.indexOf('NON viene')+120));
  T('V10 la conferma dice che a BETA il residuo vecchio viene tolto («resta solo il segno di dipendente») e che a GAMMA e DELTA viene tolto come prima', /BETA PROVA \(resta solo il segno di dipendente\)/.test(c0)&&/• GAMMA PROVA/.test(c0)&&/• DELTA PROVA/.test(c0));
  const es=conf187[1]||''; T('V11 l\'esito dice quanti residui e quanti segnalati come dipendenti', /Pubblicati 3 residui/.test(es)&&/Segnalati a Fogli ore come dipendenti: 3\./.test(es), es.replace(/\n/g,' '));
  const R7=await residui(A.pg);
  T('V12 ALFA (agganciato, con massimale): numeri del tetto + dip:true', R7.W1&&R7.W1.tetto===400&&R7.W1.dip===true, JSON.stringify(R7.W1));
  T('V13 BETA (agganciato, SENZA massimale): il documento NON si cancella più, resta {dip:true, aggiornato} e basta (niente tetto: in Fogli ore il riquadro 🎯 resta nascosto)', R7.W2&&R7.W2.dip===true&&R7.W2.aggiornato&&Object.keys(R7.W2).sort().join(',')==='aggiornato,dip', JSON.stringify(R7.W2));
  T('V14 GAMMA (NON agganciata, senza massimale): documento cancellato come prima', !R7.W3, JSON.stringify(R7.W3||null));
  T('V15 DELTA (agganciato CESSATO, senza massimale): documento cancellato come prima', !R7.W4, JSON.stringify(R7.W4||null));
  T('V16 EPSILON (agganciato, massimale fuori periodo): si aggiunge dip:true e i numeri restano (non si tocca il residuo, ver149)', R7.W5&&R7.W5.dip===true&&R7.W5.tetto===250&&R7.W5.restano===230&&!R7.W5.aggiornato, JSON.stringify(R7.W5));
  T('V17 ZETA (agganciato CESSATO, massimale in periodo): residuo scritto, dip TOLTO', R7.W6&&R7.W6.tetto===400&&R7.W6.dip===undefined&&R7.W6.aggiornato, JSON.stringify(R7.W6));
  T('V18 ETA (NON agganciata, massimale in periodo): residuo scritto SENZA dip (come prima)', R7.W7&&R7.W7.tetto===400&&R7.W7.dip===undefined, JSON.stringify(R7.W7));
  T('V19 THETA (agganciato CESSATO, massimale fuori periodo, dip vecchio): dip TOLTO, numeri intatti', R7.W8&&R7.W8.dip===undefined&&R7.W8.tetto===180&&R7.W8.restano===171, JSON.stringify(R7.W8));
  T('V20 residuo che non corrisponde a nessun dipendente (ZZ9): non toccato', R7.ZZ9&&JSON.stringify(R7.ZZ9)===JSON.stringify({tetto:50,usate:0,restano:50,periodo:'civile',anno:2026}), JSON.stringify(R7.ZZ9));
  /* Fogli ore legge davvero: il riquadro 🎯 di BETA non compare, quello di ALFA sì */
  const fo=await A.ctx.newPage(); await fo.goto(URL+'fo/'); await fo.waitForTimeout(2500);
  const pan=await fo.evaluate(async()=>{ try{ return { a:(await buildResiduoAnnuoPanel('W1')).length, b:(await buildResiduoAnnuoPanel('W2')).length }; }catch(e){ return {err:e.message}; } });
  T('V21 Fogli ore (rev 18, buildResiduoAnnuoPanel): ALFA vede il riquadro 🎯, BETA (solo dip) no', pan.a>0&&pan.b===0, JSON.stringify(pan));
  await fo.close();
  const W=await scrittureFO(A.pg);
  const WU=W.filter(x=>/ (users|timesheets)\//.test(x));
  T('V22 ZERO scritture in users/timesheets di Fogli ore (spia della finta Firebase)', WU.length===0, WU.join('|')||('scritture: '+W.join(' · ')));
  T('V23 le sole scritture sono in residui/', W.length>0&&W.every(x=>/ residui\//.test(x)), W.join(' · '));
  /* seconda pubblicazione: idempotente */
  const conf2=await pubblica(A.pg,A.D); const R7b=await residui(A.pg);
  T('V24 ripubblicando: BETA resta {dip, aggiornato}, nessun nuovo «TOLTO» per BETA', R7b.W2&&R7b.W2.dip===true&&!/BETA PROVA \(resta solo/.test(conf2[0]||''), JSON.stringify(R7b.W2));
  const M7=await motore(A.pg);
  T('V25 zero errori di pagina (ver187)', A.E.length===0, A.E.join('|'));
  /* PNG della pastiglia (deviceScaleFactor 2) e grafica a 390/1280 */
  await A.ctx.close();
  const G=await apriDip(br,'dip','ver187-png',{w:1500,dsf:2}); await G.pg.waitForFunction(()=>document.querySelectorAll('.chiu-pill').length>=4,null,{timeout:15000}).catch(()=>{});
  for(const [nm,f] of [['ALFA PROVA','si'],['EPSILON PROVA','lascia'],['BETA PROVA','aperto'],['GAMMA PROVA','chiuso']]){
    const h=G.pg.locator('.emp-card').filter({has:G.pg.locator('.emp-head .nome',{hasText:nm})}).locator('.emp-head'); await h.screenshot({path:PNG+'/ver187-'+f+'.png'}); }
  await G.ctx.close();
  for(const w of [390,1280]){ const Q=await apriDip(br,'dip','ver187-w'+w,{w,dsf:2}); await Q.pg.waitForFunction(()=>document.querySelectorAll('.chiu-pill').length>=4,null,{timeout:15000}).catch(()=>{});
    const m=await K.misura(Q.pg); const pz=await Q.pg.evaluate(()=>[...document.querySelectorAll('.chiu-pill')].map(p=>{ const r=p.getBoundingClientRect(); return r.right<=document.documentElement.clientWidth+1 && r.left>=0; }));
    T('V26 '+w+'px: nessuno scorrimento laterale, pastiglie dentro lo schermo, nessuna scritta nuova sotto 12,5px', !m.lato && pz.length>=4 && pz.every(Boolean) && !m.esempi.some(x=>/Fogli ore|completamento|Lascia/.test(x)), m.W+'/'+m.SW+' '+JSON.stringify(pz)+' '+m.esempi.join(';'));
    await Q.pg.locator('.emp-card').filter({has:Q.pg.locator('.emp-head .nome',{hasText:'ALFA PROVA'})}).locator('.emp-head').screenshot({path:PNG+'/ver187-testata-'+w+'.png'}); await Q.ctx.close(); }
  /* ===== ver186 congelata: confronto ===== */
  const B=await apriDip(br,'dip186','ver186-a');
  const P6=await pastiglie(B.pg);
  T('V27 ver186: nessuna pastiglia di chiusura (non leggeva meseChiuso/completamento)', Object.values(P6).every(x=>x===null), JSON.stringify(P6));
  await pubblica(B.pg,B.D); const R6=await residui(B.pg);
  T('V28 ver186: BETA (agganciato senza massimale) veniva CANCELLATO e nessuno riceveva dip', !R6.W2 && Object.values(R6).every(x=>x.dip===undefined || x===R6.W4 || x===R6.W6 || x===R6.W8), JSON.stringify(R6.W2||null));
  const M6=await motore(B.pg);
  const diversi=Object.keys(M7).filter(k=>M7[k]!==M6[k]);
  T('V29 costo orario (gen→ott 2026), ore a cedolino, Risultato del mese, box e TOT: identici alla ver186 per tutte le 8 schede', Object.keys(M7).length===8 && diversi.length===0, diversi.join(',')||'8/8 identici');
  T('V30 zero errori di pagina (ver186)', B.E.length===0, B.E.join('|'));
  await B.ctx.close(); await br.close(); R.fine();
})();
