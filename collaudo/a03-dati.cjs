/* A03 — salvataggio manuale, avviso alla chiusura, persistenza, timbro fra schede, backup JSON e import (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a03-dati'); const T=R.T; const fs=require('fs');
const ver=process.argv[2]||'dip';
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const ctx=await br.newContext({viewport:{width:1500,height:1000},acceptDownloads:true});
  const {pg,E}=await K.apri(br,{ctx,ver}); const toast=async()=> (await pg.locator('.toast').allInnerTexts()).join(' ');
  const dls=[]; pg.on('download',async d=>{ const f=K.OUT+'/a03-'+Date.now()+'-'+d.suggestedFilename(); await d.saveAs(f); dls.push({nome:d.suggestedFilename(),f}); });
  await K.vai(pg,'Ott'); const ls0=await K.statoLS(pg);
  T('A03.01 all\'apertura il 💾 è spento', await pg.locator('.btn-save').isDisabled());
  const c=K.cella(pg,'GAMMA PROVA',1); await c.click(); await c.press('Control+a'); await c.press('Delete'); await pg.keyboard.type('7,25'); await c.press('Tab'); await pg.waitForTimeout(300);
  T('A03.02 dopo una modifica il 💾 si accende (classe dirty)', !(await pg.locator('.btn-save').isDisabled()) && await pg.locator('.btn-save.dirty').count()===1);
  T('A03.03 niente salvataggio automatico: archivio ancora col valore vecchio', (await K.statoLS(pg)).dati['2026-10'].c.giorni[1]===ls0.dati['2026-10'].c.giorni[1]);
  /* avviso alla chiusura */
  const tipi=[]; pg.on('dialog',d=>tipi.push(d.type()));
  await pg.close({runBeforeUnload:true}).catch(()=>{}); await new Promise(r=>setTimeout(r,800));
  T('A03.04 chiudendo con modifiche non salvate compare l\'avviso del browser (beforeunload)', tipi.indexOf('beforeunload')!==-1, tipi.join(','));
  /* riapro (stesso contesto: sessionStorage nuovo, quindi niente riseme — localStorage resta) */
  let pg2=await ctx.newPage(); const E2=[]; pg2.on('pageerror',e=>E2.push(e.message)); pg2.on('dialog',d=>d.accept());
  pg2.on('download',async d=>{ const f=K.OUT+'/a03-'+Date.now()+'-'+d.suggestedFilename(); await d.saveAs(f); dls.push({nome:d.suggestedFilename(),f}); });
  await pg2.goto(K.BASE+'/'+ver+'/index.html'); await pg2.waitForSelector('.login-box,.app-header'); await K.entraPin(pg2,'1234'); await K.vai(pg2,'Ott');
  const v0=await K.cella(pg2,'GAMMA PROVA',1).inputValue();
  T('A03.05 la modifica non salvata, chiusa la pagina, è persa (come previsto) — resta il valore vecchio', v0==='3,00', v0);
  const c2=K.cella(pg2,'GAMMA PROVA',1); await c2.click(); await c2.press('Control+a'); await c2.press('Delete'); await pg2.keyboard.type('7,25'); await c2.press('Tab'); await pg2.waitForTimeout(200);
  await pg2.locator('.btn-save').dblclick(); await pg2.waitForTimeout(400);
  const ls1=await K.statoLS(pg2);
  T('A03.06 💾 (doppio clic): «Salvato in locale», 💾 si spegne, dato in archivio', /Salvato in locale/.test((await pg2.locator('.toast').allInnerTexts()).join(' ')) && await pg2.locator('.btn-save').isDisabled() && ls1.dati['2026-10'].c.giorni[1]==='7,25');
  const timbro1=await pg2.evaluate(()=>localStorage.getItem('spazioireos_reportore_v1__timbro'));
  T('A03.07 il 💾 scrive il timbro (ver144) in una chiave a parte', !!timbro1 && !JSON.stringify(ls1).includes('__timbro'));
  /* cedOre (ver176) = box */
  const box=await pg2.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const dp=st.dipendenti.find(d=>d.id==='a'); const B=cedolinoBox(st,dp,2026,10); return {ced:B.ced, pub:(st.cedOre||{})['2026-10']}; });
  T('A03.08 cedOre pubblicato al 💾: ottobre ALFA = box «ordinarie + supplementari» (150,00); GAMMA non mensilizzata assente', box.pub && Math.abs(box.pub.a-box.ced)<0.006 && Math.abs(box.ced-150)<0.006 && box.pub.c===undefined, JSON.stringify(box));
  T('A03.09 cedOre: settembre (prima della base mensile) non pubblicato', !(ls1.cedOre||{})['2026-09']);
  await pg2.reload(); await pg2.waitForSelector('.login-box'); await K.entraPin(pg2,'1234'); await K.vai(pg2,'Ott');
  T('A03.10 dopo il ricaricamento il valore salvato c\'è', (await K.cella(pg2,'GAMMA PROVA',1).inputValue())==='7,25');
  /* timbro fra due schede */
  const pA=pg2; const pB=await ctx.newPage(); pB.on('dialog',d=>d.accept()); await pB.goto(K.BASE+'/'+ver+'/index.html'); await pB.waitForSelector('.login-box'); await K.entraPin(pB,'1234'); await K.vai(pB,'Ott');
  const scr=async(p,val)=>{ const x=K.cella(p,'GAMMA PROVA',2); await x.click(); await x.press('Control+a'); await x.press('Delete'); await p.keyboard.type(val); await x.press('Tab'); await p.waitForTimeout(200); };
  await scr(pA,'11,25'); await pA.locator('.btn-save').click(); await pA.waitForTimeout(300);
  await scr(pB,'12,75'); await pB.locator('.btn-save').click(); await pB.waitForTimeout(300);
  const avv=await pB.locator('.modal').innerText().catch(()=>'');
  T('A03.11 timbro: la seconda scheda avvisa «Un\'altra scheda ha salvato dopo di te» e intanto 11,25 è in archivio', /Un'altra scheda ha salvato dopo di te/.test(avv) && (await K.statoLS(pA)).dati['2026-10'].c.giorni[2]==='11,25');
  await pB.locator('.modal .modal-actions button').first().click(); await pB.waitForTimeout(200);
  T('A03.12 annullando, la scheda B non scrive', (await K.statoLS(pA)).dati['2026-10'].c.giorni[2]==='11,25');
  await pB.locator('.btn-save').click(); await pB.waitForTimeout(300); await pB.locator('.modal .modal-actions button').last().click(); await pB.waitForTimeout(300);
  T('A03.13 «Salva lo stesso»: scrive B', (await K.statoLS(pA)).dati['2026-10'].c.giorni[2]==='12,75');
  await scr(pB,'12,5'); await pB.locator('.btn-save').click(); await pB.waitForTimeout(300);
  T('A03.14 il salvataggio successivo di B non chiede più', (await pB.locator('.modal').count())===0 && (await K.statoLS(pA)).dati['2026-10'].c.giorni[2]==='12,5');
  await pB.close();
  /* backup JSON */
  const p=pA; dls.length=0; await p.getByRole('button',{name:'⬇ Backup'}).click(); await p.waitForTimeout(1200);
  const bk=dls[0]; let bj=null; try{ bj=JSON.parse(fs.readFileSync(bk.f,'utf8')); }catch(e){}
  T('A03.15 ⬇ Backup scarica un JSON con «version: 4» e i 3 dipendenti', bj && bj.version===4 && bj.dipendenti.length===3, bk&&bk.nome);
  T('A03.16 nome del backup secondo la convenzione «… - ggmmmaa - '+K.APPV+' - HH.MM.json»', /^Spazio Ireos Report Ore backup - \d{2}[a-z]{3}\d{2} - ver\d+ - \d{2}\.\d{2}\.json$/.test(bk.nome), bk.nome);
  /* import */
  const imp=async(nome,contenuto)=>{ const f=K.OUT+'/'+nome; fs.writeFileSync(f,contenuto); await p.waitForTimeout(4000); dls.length=0; const visti=[]; const h=async()=>{ for(let i=0;i<12;i++){ visti.push(...await p.locator('.toast').allInnerTexts()); await p.waitForTimeout(150);} }; await p.locator('input.hidden-file').setInputFiles(f); await h(); return [...new Set(visti)].join(' · '); };
  const lsP=JSON.stringify(await K.statoLS(p));
  let t=await imp('corrotto.json','{{{ non è json');
  T('A03.17 import di un file corrotto: «Backup JSON non valido», archivio intatto', /non valido/.test(t) && JSON.stringify(await K.statoLS(p))===lsP, t);
  T('A03.18 prima di ogni import scarica da sé un backup di sicurezza', dls.some(d=>/prima import/.test(d.nome)), dls.map(d=>d.nome).join('|'));
  t=await imp('struttura.json',JSON.stringify({ciao:1}));
  T('A03.19 import di un JSON senza «dipendenti»: rifiutato, archivio intatto', /non valido/.test(t) && JSON.stringify(await K.statoLS(p))===lsP, t);
  /* contenuto rotto con la forma giusta */
  E2.length=0; t=await imp('rotto1.json',JSON.stringify({dipendenti:'12345',dati:{}}));
  const vivo1=await p.locator('.app-header').count(); const err1=E2.slice();
  T('A03.20 import di {"dipendenti":"12345"}: deve essere rifiutato senza rompere l\'app', /non valido/.test(t) && vivo1===1 && err1.length===0, 'avviso: '+t+' · app viva: '+vivo1+' · errori: '+err1.join('|'));
  if(!vivo1){ await p.reload(); await p.waitForSelector('.login-box,.app-header'); await K.entraPin(p,'1234'); }
  E2.length=0; t=await imp('rotto2.json',JSON.stringify({dipendenti:[1,2,3],dati:{}}));
  await K.vai(p,'Ott').catch(()=>{}); await K.vai(p,'ana').catch(()=>{}); await K.vai(p,'costo').catch(()=>{});
  const vivo2=await p.locator('.app-header').count();
  T('A03.21 import di {"dipendenti":[1,2,3]}: deve essere rifiutato senza rompere l\'app', /non valido/.test(t) && vivo2===1 && E2.length===0, 'avviso: '+t+' · app viva: '+vivo2+' · errori: '+E2.slice(0,2).join('|'));
  T('A03.22 dopo gli import rotti l\'archivio NON è stato toccato (serve 💾)', JSON.stringify(await K.statoLS(p))===lsP);
  if(!vivo2 || E2.length){ await p.reload(); await p.waitForSelector('.login-box,.app-header'); await K.entraPin(p,'1234'); }
  /* schema più nuovo */
  const fut=Object.assign({},bj,{version:99}); fut.dipendenti=bj.dipendenti.concat([{id:'z',nome:'ZETA FUTURO',oreSett:10}]);
  t=await imp('futuro.json',JSON.stringify(fut));
  T('A03.23 import di un backup di schema 99 (più nuovo): deve avvisare o rifiutare (§10.1)', /schema|versione|più nuov/i.test(t) || (await p.locator('.modal').count())>0, 'avviso: «'+t+'»');
  if(await p.locator('.btn').filter({hasText:'Annulla import'}).count()){ await p.locator('.btn').filter({hasText:'Annulla import'}).click(); await p.waitForTimeout(400); }
  await p.reload(); await p.waitForSelector('.login-box,.app-header'); await K.entraPin(p,'1234');
  /* import valido e annulla */
  const val=JSON.parse(JSON.stringify(bj)); val.dati['2026-10'].c.giorni[3]='9,75'; val.dipendenti.push({id:'d',nome:'DELTA IMPORT',oreSett:20,livello:'D1',tipoContratto:'indeterminato',dataAssunzione:'01/01/2024'});
  t=await imp('valido.json',JSON.stringify(val)); await K.vai(p,'Ott');
  T('A03.24 import valido: entra a video («Backup JSON importato») con DELTA IMPORT e 9,75', /importato/.test(t) && (await K.cella(p,'GAMMA PROVA',3).inputValue())==='9,75' && await K.carta(p,'DELTA IMPORT').count()===1, t);
  T('A03.25 import valido: in archivio solo dopo 💾', !(await K.statoLS(p)).dipendenti.some(d=>d.id==='d') && await p.locator('.btn-save.dirty').count()===1);
  await p.locator('.btn').filter({hasText:'Annulla import'}).click(); await p.waitForTimeout(500);
  T('A03.26 «↩︎ Annulla import» riporta tutto a prima', (await K.cella(p,'GAMMA PROVA',3).inputValue())==='3,00' && await K.carta(p,'DELTA IMPORT').count()===0);
  T('A03.27 zero errori di pagina (escluso il caso A03.20/21)', E.length===0, E.join('|'));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
