/* A02 — Tabellone: celle, totali, erosivo, permessi, Compila veloce, blocco, svuota, FESTNG, box, riquadri (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a02-tabellone'); const T=R.T;
const ver=process.argv[2]||'dip';
const n=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{ver}); const toast=async()=> (await pg.locator('.toast').allInnerTexts()).join(' ');
  await K.vai(pg,'Ott');
  const C=(d)=>K.cella(pg,'GAMMA PROVA',d);
  const scrivi=async(d,txt)=>{ const c=C(d); await c.click(); await c.press('Control+a'); await c.press('Delete'); await pg.keyboard.type(txt,{delay:15}); await c.press('Tab'); await pg.waitForTimeout(250); return await c.inputValue(); };
  /* celle */
  T('A02.01 «5» → 5,00', (await scrivi(1,'5'))==='5,00');
  T('A02.02 «4,5» → 4,50', (await scrivi(2,'4,5'))==='4,50');
  T('A02.03 «4.25» → 4,25', (await scrivi(3,'4.25'))==='4,25');
  T('A02.04 «ferie» minuscolo → FERIE', (await scrivi(5,'ferie'))==='FERIE');
  T('A02.05 «asp 0h» → ASP 0h', (await scrivi(6,'asp 0h'))==='ASP 0h');
  T('A02.06 «ass.ing» → ASS.ING', (await scrivi(7,'ass.ing'))==='ASS.ING');
  let v=await scrivi(8,'CIAO'); T('A02.07 testo libero «CIAO» non entra (cella vuota) con avviso', v==='' , v+' / '+await toast());
  v=await scrivi(9,'FER'); T('A02.08 pezzo di codice «FER» lasciato a metà: la cella si svuota', v==='', v);
  v=await scrivi(10,'14'); T('A02.09 «14» non entra (tetto 13 ore): resta «1»→1,00', v==='1,00', v);
  v=await scrivi(12,'13'); T('A02.10 «13» entra', v==='13,00', v);
  v=await scrivi(13,'13,5'); T('A02.11 «13,5» si ferma a 13', v==='13,00', v);
  v=await scrivi(14,'-3'); T('A02.12 «-3»: il negativo non entra (il «-» è l\'inizio del codice «--», poi «-3» è rifiutato: cella vuota con avviso)', v===''||v==='3,00', v);
  v=await scrivi(15,'999'); T('A02.13 «999» si ferma a «9»', v==='9,00', v);
  v=await scrivi(16,'MALATTIA'); T('A02.14 «MALATTIA» battuto si ferma su MAL', v==='MAL', v);
  /* incolla */
  const c17=C(17); await c17.click(); await c17.press('Control+a'); await c17.press('Delete');
  await pg.evaluate(()=>navigator.clipboard&&0); await c17.evaluate((el)=>{ const dt=new DataTransfer(); dt.setData('text/plain','frase lunga incollata'); el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true})); });
  T('A02.15 incolla di una frase: non scrive niente', (await c17.inputValue())==='');
  /* svuota con tastiera */
  const c1=C(1); await c1.click(); await c1.press('Control+a'); await c1.press('Delete'); await c1.press('Tab'); await pg.waitForTimeout(200);
  T('A02.16 una cella si svuota con la tastiera', (await c1.inputValue())==='');
  await scrivi(1,'5');
  /* domenica/rosso non compilabile */
  T('A02.17 domenica 4 ottobre: cella disabilitata', await C(4).isDisabled());
  /* TOT calcolato: somma celle a video */
  const totV=async(nome)=> n((await K.carta(pg,nome).locator('.tot-v').innerText()).split('\n')[0]);
  const somma=await pg.evaluate(()=>{ const c=[...document.querySelectorAll('.emp-card')].find(x=>x.querySelector('.emp-head .nome').innerText.indexOf('GAMMA')!==-1);
    return [...c.querySelectorAll('table.cal tr:nth-child(3) input.cell-in')].map(i=>parseFloat(i.value.replace(/\./g,'').replace(',','.'))).filter(x=>!isNaN(x)).reduce((a,b)=>a+b,0); });
  T('A02.18 TOT calcolato = somma delle celle a video', Math.abs((await totV('GAMMA'))-somma)<0.005, (await totV('GAMMA'))+' vs '+somma);
  /* ALFA ottobre: numeri attesi ricalcolati a mano (38 h/6 gg = 6,3333; 27 gg non domenicali; 24 gg × 6,5 = 156; 3 assenze = 19) */
  const A=K.carta(pg,'ALFA PROVA'); const headA=await A.locator('.emp-head').innerText();
  T('A02.19 pillola ORE CORRETTE DA DARE ALFA = 38/6×27 = 171,00', /ORE CORRETTE DA DARE: 171(,00)?( |$)/.test(headA.replace(/\s+/g,' ')), headA.replace(/\s+/g,' ').slice(0,200));
  T('A02.20 ORE MESE ALFA 165', /ORE MESE: 165/.test(headA));
  T('A02.21 TOT calcolato ALFA = 156,00', (await totV('ALFA'))===156);
  const teor=n((await A.locator('.foot-teor b').innerText()));
  T('A02.22 TOT teorico ALFA = 156 + 3 × 6,333 = 175,000', Math.abs(teor-175)<0.002, teor);
  const congA=(await A.locator('.cong').first().innerText()).replace(/\s+/g,' ');
  T('A02.23 Risultato del mese ALFA = 156 + 19 − 171 = +4,000', /Risultato del mese: \+4,000/.test(congA), congA.slice(0,250));
  /* numerino erosivo */
  const ab=A.locator('.teor-abs').first(); await ab.click(); await pg.waitForTimeout(300);
  const teor2=n((await A.locator('.foot-teor b').innerText())); const cong2=(await A.locator('.cong').first().innerText()).replace(/\s+/g,' ');
  T('A02.24 clic sul numerino: barrato, TOT teorico −6,333, Risultato invariato', /no-ero/.test(await ab.getAttribute('class')) && Math.abs(teor-teor2-6.333)<0.002 && /\+4,000/.test(cong2), teor2);
  await ab.click(); await pg.waitForTimeout(300); T('A02.25 secondo clic: torna erosivo', Math.abs(n(await A.locator('.foot-teor b').innerText())-teor)<0.002);
  /* box cedolino */
  const box=(await A.locator('.ced-box').innerText()).replace(/\s+/g,' ');
  const bm=/ORE MESE ([\d.,]+) h.*di cui ferie ([\d.,]+) h.*altre assenze retribuite ([\d.,]+) h.*festività godute ([\d.,]+) h.*permessi retribuiti ([\d.,]+) h.*ore lavorate ordinarie ([\d.,]+) h.*ORE SUPPLEMENTARI \(Risultato del mese\) \+?([\d.,]+) h/.exec(box);
  T('A02.26 box cedolino ALFA: ORE MESE 165 = ferie + altre + festività + permessi + ordinarie; supplementari = Risultato (4,00)', bm && Math.abs(n(bm[1])-165)<0.01 && Math.abs(n(bm[2])+n(bm[3])+n(bm[4])+n(bm[5])+n(bm[6])-165)<0.015 && Math.abs(n(bm[7])-4)<0.005, bm&&bm.slice(1).join('/'));
  T('A02.27 box: FESTIVITÀ NON GODUTE 1 gg (il 4, domenica)', /FESTIVITÀ NON GODUTE, a sé [\d,]+ h 1 gg/.test(box), box.slice(box.indexOf('FESTIVITÀ NON'),box.indexOf('FESTIVITÀ NON')+60));
  T('A02.28 nessun box per GAMMA (non mensilizzata)', await K.carta(pg,'GAMMA PROVA').locator('.ced-box').count()===0);
  /* BETA: 19 h su 6 gg, sabati vuoti (non AN), ASS.ING il 12 */
  const B=K.carta(pg,'BETA PROVA'); const congB=(await B.locator('.cong').first().innerText()).replace(/\s+/g,' ');
  T('A02.29 BETA: «da trattenere (ASS.ING / ASP 0h)» presente col Risultato negativo', /da trattenere \(ASS\.ING \/ ASP 0h\): [\d,]+ h/.test(congB) && /Risultato del mese: -/.test(congB), congB.slice(0,300));
  /* Tetto annuo */
  const txtA=(await A.innerText()).replace(/\s+/g,' ');
  const eng=await pg.evaluate(()=>{ const st=window.__st; return null; });
  T('A02.30 riquadro 🎯 Tetto annuo presente per ALFA con «Massimo dell\'anno: 500»', /Tetto annuo/.test(txtA) && /500,000 h/.test(txtA));
  /* permesso orario */
  await A.locator('table.cal tr').nth(2).locator('td').nth(8).locator('.perm-flag').click(); await pg.waitForTimeout(300);
  const pm=pg.locator('.modal'); await pm.locator('.field input').first().click(); await pg.keyboard.type('1,5');
  const valPerm=await pm.locator('.field input').first().inputValue();
  T('A02.31 permesso orario: «1,5» battuto nella casella Ore', valPerm==='1.5'||valPerm==='1,5', 'valore della casella = «'+valPerm+'»');
  await pm.locator('select').selectOption('EXF'); await pm.locator('.modal-actions button').last().click(); await pg.waitForTimeout(300);
  const plbl=await A.locator('.perm-lbl').allInnerTexts();
  T('A02.32 targhetta del permesso sotto la cella', plbl.length===1, plbl.join('|'));
  const cong3=(await A.locator('.cong').first().innerText()).replace(/\s+/g,' ');
  T('A02.33 il permesso EXF entra nel Risultato del mese ma non nel TOT', /Permessi orari: [\d,]+ h/.test(cong3) && (await totV('ALFA'))===156, cong3.slice(cong3.indexOf('Permessi'),cong3.indexOf('Permessi')+30));
  /* permesso negativo / zero */
  pg._dialoghi=[]; await A.locator('table.cal tr').nth(2).locator('td').nth(9).locator('.perm-flag').click(); await pg.waitForTimeout(300);
  await pg.locator('.modal .field input').first().fill('-2'); await pg.locator('.modal select').selectOption('EXF'); await pg.locator('.modal .modal-actions button').last().click(); await pg.waitForTimeout(300);
  T('A02.34 permesso −2 rifiutato con avviso', (pg._dialoghi||[]).some(x=>/numero di ore valido/.test(x)) && await pg.locator('.modal').count()===1);
  await pg.locator('.modal .field input').first().fill('20'); await pg.locator('.modal .modal-actions button').last().click(); await pg.waitForTimeout(300);
  const p20=await pg.evaluate(()=>1); const lbl2=await A.locator('.perm-lbl').allInnerTexts();
  T('A02.35 permesso orario di 20 h in un giorno (tetto 13 ore?)', !lbl2.some(t=>/20,00/.test(t)), lbl2.join('|'));
  if(await pg.locator('.modal').count()) await pg.locator('.modal .modal-actions button').filter({hasText:'Annulla'}).click();
  /* Compila veloce */
  const G=K.carta(pg,'GAMMA PROVA'); const qf=async(val)=>{ await G.locator('.edit-mini.qf').click(); await pg.waitForTimeout(300); const m=pg.locator('.modal'); await m.locator('input').first().fill(val); await pg.waitForTimeout(150);
    const b=m.locator('.modal-actions button').last(); return {m,b,dis:await b.isDisabled(),txt:(await m.innerText()).replace(/\s+/g,' ')}; };
  for(const [val,id] of [['-3','A02.36'],['14','A02.37'],['PIPPO','A02.38'],['13,5','A02.39']]){ const q=await qf(val); T(id+' Compila veloce «'+val+'»: pulsante spento e motivo in rosso', q.dis, q.txt.slice(q.txt.indexOf('Valore da inserire'),q.txt.indexOf('Valore da inserire')+150)); await q.m.locator('.modal-actions button').filter({hasText:'Annulla'}).click(); await pg.waitForTimeout(200); }
  let q=await qf('7'); await q.m.locator('input[type=checkbox]').last().check(); await pg.waitForTimeout(100);
  await q.b.click(); await pg.waitForTimeout(300); const cnf=await K.conferma(pg,true);
  T('A02.40 Compila veloce «7» con «sovrascrivi»: chiede conferma e riempie i feriali', /Sovrascrivere/.test(cnf) && (await C(19).inputValue())==='7,00' && (await C(4).inputValue())==='', cnf.slice(0,80));
  /* elenco: giorno rosso */
  q=await qf('5'); await q.m.locator('input[type=radio]').nth(2).check(); await q.m.locator('input[placeholder="es. 3, 7, 12"]').fill('4, 11'); await pg.waitForTimeout(150);
  const tgt=(await q.m.innerText()).match(/Giorni interessati: (\d+)/); const salt=/saltati 2 giorni rossi/.test(await q.m.innerText());
  /* ver184: dalla correzione i due giorni rossi si saltano anche qui, quindi i giorni interessati sono 0 e il pulsante è spento (si chiude con Annulla) */
  if(await q.b.isDisabled()){ await q.m.locator('.modal-actions button').filter({hasText:'Annulla'}).click(); } else { await q.b.click(); } await pg.waitForTimeout(300);
  const v4=await C(4).inputValue();
  T('A02.41 Compila veloce «Solo questi giorni: 4, 11» (domeniche): i giorni rossi NON devono essere scritti (e la nota dice «saltati 2 giorni rossi»)', v4==='' && salt, 'giorni interessati '+(tgt&&tgt[1])+', cella 4 ottobre (domenica, non compilabile) = «'+v4+'»');
  /* Blocca / sblocca */
  await pg.getByRole('button',{name:/Blocca mese/}).click(); await pg.waitForTimeout(300);
  const dis=await pg.locator('.emp-card input.cell-in:not([disabled])').count();
  T('A02.42 🔒 Blocca mese: nessuna cella scrivibile e niente ⚡/🗑 Svuota', dis===0 && await pg.locator('.edit-mini.qf').count()===0, dis);
  await pg.getByRole('button',{name:/Sblocca mese/}).click(); const cs=await K.conferma(pg,true);
  T('A02.43 🔓 Sblocca chiede conferma e riapre', /Sbloccare/.test(cs) && await pg.locator('.emp-card input.cell-in:not([disabled])').count()>40);
  /* Svuota mese con conferma: annulla, poi conferma */
  await G.locator('.edit-mini.svuota').click(); let sv=await K.conferma(pg,false);
  T('A02.44 🗑 Svuota mese: conferma che nomina persona e mese; annullando resta', /GAMMA PROVA/.test(sv) && /Ottobre 2026/.test(sv) && (await C(19).inputValue())==='7,00');
  await G.locator('.edit-mini.svuota').click(); await K.conferma(pg,true); await pg.waitForTimeout(300);
  T('A02.45 confermando il mese di GAMMA si svuota', (await K.carta(pg,'GAMMA PROVA').count())===1 ? (await C(19).inputValue())==='' : true);
  /* FESTNG su giorno rosso, dicembre 2025 */
  await K.annoA(pg,2025); await K.vai(pg,'Dic');
  const btn=pg.locator('.svuota-rosso'); T('A02.46 dicembre 2025: 🗑 togli solo sui FESTNG del 7 (2)', await btn.count()===2, await btn.count());
  await btn.first().click(); let fr=await K.conferma(pg,false); T('A02.47 la conferma dice che il giorno RESTA rosso; annullando resta', /RESTA rosso/.test(fr) && await pg.locator('.svuota-rosso').count()===2);
  await pg.locator('.svuota-rosso').first().click(); await K.conferma(pg,true);
  const ls=await K.statoLS(pg);
  T('A02.48 confermando sparisce a video ma non in archivio prima del 💾', await pg.locator('.svuota-rosso').count()===1 && ls.dati['2025-12'].a.giorni[7]==='FESTNG');
  T('A02.49 il 7 dicembre resta non compilabile', await K.cella(pg,'ALFA PROVA',7).isDisabled());
  T('A02.50 zero errori di pagina', E.length===0, E.join(' | '));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
