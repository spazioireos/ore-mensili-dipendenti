/* Collaudo ver186 (dati INVENTATI): entrando in una cella delle ore il contenuto si seleziona tutto e il primo tasto
   lo sostituisce (Christian, 19/11/2026). Anche «Ore dichiarate (uso interno)» e la casella delle ore del permesso.
   Prima: bash collaudo/prepara-banco.sh ver185   (banco proprio, porta 8300, con la ver185 congelata per il confronto)
   Poi:   node collaudo/ver186.cjs  [cartella-png]                                                                     */
const K=require('./a00-comune.cjs'); const R=K.contatore('ver186'); const T=R.T; const fs=require('fs');
const PNG=process.argv[2]||K.OUT;
const ST=()=>{ const s=K.statoBase(); s.dati['2026-10'].a.permessi={9:{ore:2,tipo:'EXF'}}; return s; };
const sel=(c)=>c.evaluate(el=>({v:el.value,s:el.selectionStart,e:el.selectionEnd,att:document.activeElement===el}));
const tutta=(x)=>x.att && x.v!=='' && x.s===0 && x.e===x.v.length;
const cursore=(x)=>x.att && x.s===x.e;
const salvaAcceso=async(pg)=>!(await pg.locator('.btn-save').first().isDisabled());
async function prepara(br,ver,ctxOpz){ const ctx=ctxOpz?await br.newContext(ctxOpz):undefined;
  const o=await K.apri(br,{ver,stato:ST(),ctx}); await K.annoA(o.pg,2026); await K.vai(o.pg,'Ott'); return o; }
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  /* ===== confronto: nella ver185 la selezione NON c'era ===== */
  const V=await prepara(br,'ver185'); const c5=K.cella(V.pg,'ALFA PROVA',1); await c5.click(); await V.pg.waitForTimeout(200);
  const x5=await sel(c5); T('S00 ver185: cliccando una cella piena il contenuto NON si seleziona (è il difetto chiuso oggi)', x5.att && !tutta(x5), JSON.stringify(x5));
  await V.ctx.close();

  const {ctx,pg,E}=await prepara(br,'dip');
  T('S01 targhetta '+K.APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(K.APPV)!==-1);
  const C=(d)=>K.cella(pg,'ALFA PROVA',d);
  /* clic su cella piena */
  await C(1).click(); await pg.waitForTimeout(200); let x=await sel(C(1));
  T('S02 clic su una cella piena (6,500): tutto il contenuto selezionato (selectionStart 0, selectionEnd = lunghezza)', tutta(x), JSON.stringify(x));
  await pg.waitForTimeout(400); x=await sel(C(1));
  T('S03 la selezione resta anche dopo il rilascio del mouse (mezzo secondo dopo)', tutta(x), JSON.stringify(x));
  await pg.keyboard.type('4'); x=await sel(C(1));
  T('S04 il primo tasto «4» sostituisce tutto: la cella contiene «4»', x.v==='4', JSON.stringify(x));
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(250);
  T('S05 uscendo la cella mostra 4,000', (await C(1).inputValue())==='4,000', await C(1).inputValue());
  /* secondo clic: cursore */
  await C(2).click(); await pg.waitForTimeout(200); const x1=await sel(C(2));
  const bb=await C(2).boundingBox(); await pg.mouse.click(bb.x+6, bb.y+bb.height/2); await pg.waitForTimeout(200); const x2=await sel(C(2));
  T('S06 primo clic seleziona tutto, il secondo clic dentro la cella posiziona il cursore (nessuna selezione)', tutta(x1) && cursore(x2), JSON.stringify([x1,x2]));
  /* Tab da una cella all'altra */
  let arrivo=null; for(let i=0;i<5;i++){ await pg.keyboard.press('Tab'); await pg.waitForTimeout(150);
    const a=await pg.evaluate(()=>{ const el=document.activeElement; return el&&el.classList.contains('cell-in')?{v:el.value,s:el.selectionStart,e:el.selectionEnd,att:true}:null; }); if(a){ arrivo=a; break; } }
  T('S07 Tab porta alla cella dopo e ne seleziona tutto il contenuto', arrivo && tutta(arrivo), JSON.stringify(arrivo));
  await pg.keyboard.press('Escape');
  /* entrare e uscire senza scrivere */
  await pg.locator('.app-header').first().click({position:{x:5,y:5}}).catch(()=>{}); await pg.waitForTimeout(200);
  const prima=await salvaAcceso(pg);
  /* (le celle 1 è stata cambiata: si salva, poi si prova l'entra/esci) */
  if(prima){ await pg.locator('.btn-save').first().click(); await pg.waitForTimeout(600); }
  const dPrima=(await K.statoLS(pg)).dati['2026-10'].a.giorni[3];
  await C(3).click(); await pg.waitForTimeout(150); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  await C(6).click(); await pg.waitForTimeout(150); await pg.locator('.app-header').first().click({position:{x:5,y:5}}).catch(()=>{}); await pg.waitForTimeout(200);
  T('S08 entrare e uscire senza scrivere (6,5 e MAL) non cambia niente: 💾 resta spento, cella 3 = '+dPrima+', cella 6 = MAL', !(await salvaAcceso(pg)) && (await C(3).inputValue())==='6,500' && (await C(6).inputValue())==='MAL', JSON.stringify([dPrima,await C(3).inputValue(),await C(6).inputValue()]));
  /* carattere non ammesso */
  await C(10).click(); await pg.waitForTimeout(150); await pg.keyboard.type('x'); await pg.waitForTimeout(150); const vx=await C(10).inputValue();
  const tst=(await pg.locator('.toast').allInnerTexts()).join(' ');
  await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  T('S09 «x» battuto sulla selezione è rifiutato: la cella resta 6,5 (non si svuota), compare l\'avviso, all\'uscita 6,500', vx==='6,5' && /numero di ore oppure un codice/.test(tst) && (await C(10).inputValue())==='6,500' && !(await salvaAcceso(pg)), JSON.stringify([vx,tst.slice(0,80),await C(10).inputValue()]));
  /* codice */
  await C(8).click(); await pg.waitForTimeout(150); await pg.keyboard.type('F'); const vF=await C(8).inputValue(); await pg.keyboard.type('erie'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  T('S10 «F» sulla selezione entra (inizio di FERIE); «Ferie» all\'uscita diventa FERIE', vF==='F' && (await C(8).inputValue())==='FERIE', vF+' → '+await C(8).inputValue());
  /* tetto delle 13 ore e regola dei minuti, come prima */
  await C(12).click(); await pg.waitForTimeout(150); await pg.keyboard.type('14'); const v14=await C(12).inputValue(); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  await C(13).click(); await pg.waitForTimeout(150); await pg.keyboard.type('3,86'); const v386=await C(13).inputValue(); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  T('S11 sulla selezione restano il tetto delle 13 ore («14» si ferma a 1) e la regola dei minuti («3,86» si ferma a 3,8 e all\'uscita si rifiuta)', v14==='1' && v386==='3,8' && (await C(13).inputValue())==='', JSON.stringify([v14,v386,await C(13).inputValue()]));
  /* cella vuota: niente da selezionare, si scrive come prima */
  const V30=K.cella(pg,'BETA PROVA',3); await V30.click(); await pg.waitForTimeout(150); await pg.keyboard.type('5'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  T('S12 cella vuota (BETA, sabato 3): si scrive come prima (5 → 5,000)', (await V30.inputValue())==='5,000', await V30.inputValue());
  /* Ore dichiarate */
  const D=K.carta(pg,'ALFA PROVA').locator('input.dich-in'); await D.click(); await pg.keyboard.type('150'); await pg.keyboard.press('Tab'); await pg.waitForTimeout(200);
  await D.click(); await pg.waitForTimeout(200); const xd=await sel(D); await pg.keyboard.type('7'); const vd=await D.inputValue();
  T('S13 «Ore dichiarate (uso interno)»: rientrando 150 è tutto selezionato e «7» lo sostituisce', tutta(xd) && vd==='7', JSON.stringify([xd,vd]));
  await pg.keyboard.press('Tab');
  /* permesso orario */
  await K.carta(pg,'ALFA PROVA').locator('table.cal tr').nth(2).locator('td').nth(8).locator('.perm-flag').click({force:true}); await pg.waitForTimeout(300);
  const P=pg.locator('.modal .field input').first(); await P.click(); await pg.waitForTimeout(200); const xp=await sel(P); await pg.keyboard.type('3'); const vp=await P.inputValue();
  T('S14 permesso orario: la casella delle ore (2,000) entra tutta selezionata e «3» la sostituisce', tutta(xp) && xp.v==='2,000' && vp==='3', JSON.stringify([xp,vp]));
  await pg.locator('.modal .modal-actions button').filter({hasText:'Annulla'}).click().catch(()=>pg.keyboard.press('Escape')); await pg.waitForTimeout(200);
  /* Compila veloce: non toccata (si apre vuota) */
  await K.carta(pg,'ALFA PROVA').locator('.edit-mini.qf').click(); await pg.waitForTimeout(300); const Q=pg.locator('.modal input').first();
  T('S15 «Compila veloce»: casella non toccata, si apre vuota come prima', (await Q.inputValue())==='');
  await pg.locator('.modal .modal-actions button').filter({hasText:'Annulla'}).click(); await pg.waitForTimeout(200);
  T('S16 zero errori di pagina', E.length===0, E.join(' | '));
  await ctx.close();
  /* ===== telefono: tocco ===== */
  const M=await prepara(br,'dip',{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const cm=K.cella(M.pg,'ALFA PROVA',2); await cm.scrollIntoViewIfNeeded(); await cm.tap(); await M.pg.waitForTimeout(300); const xm=await sel(cm);
  T('S17 telefono (390px, tocco): toccando una cella piena il contenuto è tutto selezionato', tutta(xm), JSON.stringify(xm));
  T('S18 telefono: zero errori di pagina', M.E.length===0, M.E.join(' | '));
  await M.ctx.close();
  /* ===== immagine: cella appena entrata, contenuto selezionato ===== */
  const F=await prepara(br,'dip',{viewport:{width:1400,height:900},deviceScaleFactor:2});
  const cf=K.cella(F.pg,'ALFA PROVA',2); await cf.scrollIntoViewIfNeeded(); await cf.click(); await F.pg.waitForTimeout(300);
  const b=await cf.boundingBox(); try{ fs.mkdirSync(PNG,{recursive:true}); }catch(e){}
  await F.pg.screenshot({path:PNG+'/cella-selezionata.png',clip:{x:Math.max(0,b.x-150),y:Math.max(0,b.y-70),width:b.width+300,height:b.height+140}});
  const xf=await sel(cf); T('S19 immagine della cella selezionata salvata ('+PNG+'/cella-selezionata.png)', tutta(xf) && fs.existsSync(PNG+'/cella-selezionata.png'), JSON.stringify(xf));
  await F.ctx.close();
  await br.close(); R.fine(); })();
