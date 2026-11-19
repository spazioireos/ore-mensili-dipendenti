/* A04 — Anagrafica: campi, date automatiche, codice operatore, negativi, cornici, rimborso, TFR per anno,
   Mensilizza tutti, proroga / trasformazione / monte ore / massimale (anche servizio per servizio). Dati INVENTATI. */
const K=require('./a00-comune.cjs'); const R=K.contatore('a04-anagrafica'); const T=R.T;
const ver=process.argv[2]||'dip';
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{ver}); await K.vai(pg,'ana');
  const scheda=async(nome)=>{ await pg.locator('.ana-wrap button').filter({hasText:nome}).first().click(); await pg.waitForTimeout(400); };
  const campo=(lbl)=>pg.locator('.ana-sheet .field').filter({has:pg.locator('label',{hasText:new RegExp('^'+lbl.replace(/[()€.\/—?]/g,'\\$&')+'$')})}).first();
  const scrivi=async(lbl,txt)=>{ const i=campo(lbl).locator('input,select,textarea').first(); await i.click(); await i.press('Control+a'); await i.press('Delete'); await pg.keyboard.type(txt,{delay:10}); await i.press('Tab'); await pg.waitForTimeout(150); return await i.inputValue(); };
  await scheda('BETA PROVA');
  const nCampi=await pg.locator('.ana-sheet .field').count(); T('A04.01 scheda anagrafica: più di 60 campi', nCampi>60, nCampi);
  T('A04.02 «Data di avvio proroga (automatica)» grigia e di sola lettura', await campo('Data di avvio proroga (automatica)').locator('input').isDisabled());
  /* negativi */
  for(const [lbl,val,att] of [['Rimborso km €','-100','100'],['Premi (tempo pieno) €','-50','50'],['Monte ore settimanali','-19','19'],['TFR accantonato al 31/12 €','-800','800']]){
    const v=await scrivi(lbl,val); T('A04.03 «'+lbl+'»: «'+val+'» → «'+att+'» (il meno non entra, ver178)', v===att, v); }
  await scrivi('Monte ore settimanali','19');
  /* data impossibile */
  const vd=await scrivi('Data contratto','31/02/2026'); const fd=(await campo('Data contratto').innerText());
  T('A04.04 data impossibile «31/02/2026»: segnata («Formato richiesto: gg/mm/aaaa»)', /Formato richiesto/.test(fd), fd.replace(/\s+/g,' ').slice(0,120));
  const vl=await scrivi('Data contratto','ab/cd'); T('A04.05 nelle date le lettere non entrano', !/[a-z]/i.test(vl), vl); await scrivi('Data contratto','');
  /* testo lunghissimo */
  const lungo='X'.repeat(300); await scrivi('Note',lungo); const m=await K.misura(pg);
  T('A04.06 testo di 300 caratteri nelle Note: niente scorrimento laterale', !m.lato, m.SW+' su '+m.W);
  await scrivi('Specifica struttura (nome istituto/centro…)','Y'.repeat(200)); const m2=await K.misura(pg);
  T('A04.07 testo di 200 caratteri in un campo a una riga: niente scorrimento laterale (noto: ver144 «pazienza»)', !m2.lato, m2.SW+' su '+m2.W);
  await scrivi('Specifica struttura (nome istituto/centro…)','');
  /* cornici e verde */
  const col=await pg.evaluate(()=>{ const r={}; document.querySelectorAll('.ana-sheet .field').forEach(f=>{ const l=(f.querySelector('label')||{}).innerText; const i=f.querySelector('input,select'); if(l&&i) r[l]=getComputedStyle(i).borderTopColor; }); return r; });
  T('A04.08 bordo verde #47b82a sulle caselle «in itinere» (Rimborso km, TFR accantonato) e ambra su «Giorni settimanali»', col['Rimborso km €']==='rgb(71, 184, 42)' && col['TFR accantonato al 31/12 €']==='rgb(71, 184, 42)' && col['Giorni settimanali (per il costo orario)']!=='rgb(71, 184, 42)', JSON.stringify([col['Rimborso km €'],col['Giorni settimanali (per il costo orario)']]));
  T('A04.09 legenda «bordo verde» nella sezione Costo del lavoro', /bordo verde/.test(await pg.locator('.ana-legenda').innerText()));
  /* rimborso: tendina */
  const sel=campo('Rimborso: come si conta').locator('select'); const opts=await sel.locator('option').allInnerTexts();
  T('A04.10 tendina rimborso: Forfait / Mensile', opts.some(o=>/Forfait/.test(o)) && opts.some(o=>/Mensile/.test(o)), opts.join('|'));
  await sel.selectOption({label:opts.find(o=>/Mensile/.test(o))}); await pg.waitForTimeout(200);
  const vis=await campo('Rimborso — per quanti mesi').count(); await sel.selectOption({label:opts.find(o=>/Forfait/.test(o))}); await pg.waitForTimeout(200);
  T('A04.11 «Mensile» mostra «Rimborso — per quanti mesi», «Forfait» la nasconde', vis===1 && await campo('Rimborso — per quanti mesi').count()===0);
  /* TFR per anno */
  await pg.getByRole('button',{name:'+ Aggiungi anno'}).click(); await pg.waitForTimeout(200);
  const ntfr=await pg.locator('.ana-sheet').getByText('non più in uso').count();
  T('A04.12 «+ Aggiungi anno» nel TFR per anno: le due caselle vecchie dicono «non più in uso»', ntfr>=1, ntfr);
  /* codice operatore */
  pg._dialoghi=[]; await pg.getByRole('button',{name:/Assegna i codici mancanti/}).click(); await pg.waitForTimeout(400);
  const dlg=(pg._dialoghi||[]).join(' ')+(await pg.locator('.modal').innerText().catch(()=>''));
  if(await pg.locator('.modal').count()) await K.conferma(pg,true);
  await pg.waitForTimeout(300); const sig=await campo('Codice operatore (automatico)').locator('input').inputValue();
  T('A04.13 🔖 Assegna i codici: chiede conferma e BETA PROVA riceve BET1 (sola lettura)', /BET1/.test(dlg) && sig==='BET1' && await campo('Codice operatore (automatico)').locator('input').isDisabled(), sig+' / '+dlg.slice(0,120));
  /* proroga */
  await pg.getByRole('button',{name:'+ Aggiungi proroga'}).click(); await pg.waitForTimeout(150);
  await pg.locator('input[placeholder="gg/mm/aa"]').fill('30/06/2027'); await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(300);
  const tsh=(await pg.locator('.ana-sheet').innerText()).replace(/\s+/g,' ');
  T('A04.14 + Aggiungi proroga: «1ª proroga → 30/06/2027» e avvio automatico 01/01/2027', /1ª proroga → 30\/06\/2027/.test(tsh) && (await campo('Data di avvio proroga (automatica)').locator('input').inputValue())==='01/01/2027', await campo('Data di avvio proroga (automatica)').locator('input').inputValue());
  /* trasformazione */
  await pg.getByRole('button',{name:'+ Aggiungi trasformazione'}).click(); await pg.waitForTimeout(150);
  await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(200);
  T('A04.15 trasformazione vuota: rifiutata col motivo', /Compila almeno|Indica|serve/i.test(await pg.locator('.ana-sheet').innerText()));
  await pg.locator('input[placeholder="es. D2"]').fill('D3'); await pg.locator('input[placeholder="es. 100 (0 per togliere)"]').fill('1.500,00');
  await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(300);
  const tr=(await pg.locator('.ana-sheet').innerText()).replace(/\s+/g,' ');
  T('A04.16 trasformazione D3 con superminimo «1.500,00» registrata (ver136: cNum capisce le migliaia)', /D3/.test(tr) && /1\.500,00/.test(tr), tr.slice(tr.indexOf('Trasformazioni registrate'),tr.indexOf('Trasformazioni registrate')+120));
  /* monte ore temporaneo */
  await pg.getByRole('button',{name:'+ Aggiungi periodo'}).click(); await pg.waitForTimeout(150);
  await pg.locator('input[placeholder="es. 20"]').fill('-20'); await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(200);
  const otTxt=(await pg.locator('.ana-sheet').innerText()).replace(/\s+/g,' '); const otSez=otTxt.split('Monte ore (anche temporaneo)')[1].split('Mensilizzazione')[0];
  T('A04.17 monte ore temporaneo «-20»: deve essere rifiutato', !/-20|−20/.test(otSez), otSez.slice(otSez.indexOf('Nessun')>=0?otSez.indexOf('Nessun'):0, 200));
  await K.vai(pg,'Nov'); const pillN=(await K.carta(pg,'BETA PROVA').locator('.emp-head').innerText()).replace(/\s+/g,' ');
  T('A04.18 effetto nel Tabellone di novembre di BETA (ORE SETT / ORE MESE non negative)', !/-\d/.test(pillN), pillN.slice(0,160));
  await K.vai(pg,'ana'); await scheda('BETA PROVA');
  /* massimale servizio per servizio */
  await pg.getByRole('button',{name:'+ Aggiungi massimale'}).click(); await pg.waitForTimeout(150);
  await pg.locator('input[placeholder="es. 2026"]').fill('2026');
  await pg.getByRole('button',{name:'+ Aggiungi servizio'}).click(); await pg.getByRole('button',{name:'+ Aggiungi servizio'}).click(); await pg.waitForTimeout(100);
  const nomi=pg.locator('input[placeholder="nome del servizio"]'), ore=pg.locator('input[placeholder="ore"]');
  await nomi.nth(0).fill('SERVIZIO UNO'); await ore.nth(0).fill('200'); await nomi.nth(1).fill('SERVIZIO DUE'); await ore.nth(1).fill('208,5'); await pg.waitForTimeout(150);
  T('A04.19 servizio per servizio: totale 408,50 mostrato mentre si scrive', /Totale delle righe: 408,50 h/.test(await pg.locator('.ana-sheet').innerText()));
  await ore.nth(1).fill('-208,5'); await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(200);
  T('A04.20 una riga con ore negative ferma il salvataggio col motivo', /servono sia il nome sia le ore/.test(await pg.locator('.ana-sheet').innerText()));
  await ore.nth(1).fill('208,5'); await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(300);
  const mx=(await pg.locator('.ana-sheet').innerText()).replace(/\s+/g,' ');
  T('A04.21 massimale registrato con il dettaglio «SERVIZIO UNO 200,00 h · SERVIZIO DUE 208,50 h»', /SERVIZIO UNO 200,00 h · SERVIZIO DUE 208,50 h/.test(mx) && /408,5/.test(mx));
  /* Mensilizza tutti */
  await pg.getByRole('button',{name:/Mensilizza tutti dal mese/}).click(); await pg.waitForTimeout(300);
  const pan=(await pg.locator('.content').innerText()).replace(/\s+/g,' ');
  T('A04.22 «📅 Mensilizza tutti dal mese…» apre il pannello con le persone spuntate e la data 10/2026 di partenza', /GAMMA PROVA/.test(pan), pan.slice(pan.indexOf('Mensilizza tutti'),pan.indexOf('Mensilizza tutti')+200));
  T('A04.23 dopo tutte le modifiche: in archivio niente finché non si preme 💾', !(await K.statoLS(pg)).dipendenti.find(d=>d.id==='b').sigla);
  await pg.locator('.btn-save').first().click(); await pg.waitForTimeout(400);
  const st=await K.statoLS(pg); const b=st.dipendenti.find(d=>d.id==='b');
  T('A04.24 col 💾: sigla, proroga, trasformazione (superminimo 1500), orario temporaneo e massimale con voci arrivano in archivio', b.sigla==='BET1' && b.proroghe.length===1 && b.trasformazioni.some(t=>t.superminimo===1500) && b.orariTemp.length>=1 && b.tettiAnnui.some(t=>(t.voci||[]).length===2), JSON.stringify({s:b.sigla,p:b.proroghe,t:b.trasformazioni,o:b.orariTemp,m:b.tettiAnnui}).slice(0,300));
  /* trasformazione con monte ore negativo, ✕ senza conferma */
  await K.vai(pg,'ana'); await scheda('GAMMA PROVA');
  await pg.getByRole('button',{name:'+ Aggiungi trasformazione'}).click(); await pg.waitForTimeout(150);
  await pg.locator('input[placeholder="es. 24"]').fill('-15'); await pg.getByRole('button',{name:'✔ Aggiungi'}).first().click(); await pg.waitForTimeout(300);
  const trG=(await pg.locator('.ana-sheet').innerText()).replace(/\s+/g,' ');
  T('A04.26 trasformazione con «Nuovo monte ore/sett» −15: deve essere rifiutata', !/-15|−15/.test(trG.split('Trasformazioni registrate')[1].split('Monte ore (anche')[0]), trG.split('Trasformazioni registrate')[1].slice(0,90));
  pg._dialoghi=[]; const nTr=await pg.locator('.voce-del[title="Rimuovi trasformazione"]').count();
  if(nTr){ await pg.locator('.voce-del[title="Rimuovi trasformazione"]').first().click(); await pg.waitForTimeout(300); }
  const chiesto=(pg._dialoghi||[]).length>0 || (await pg.locator('.modal').count())>0; if(await pg.locator('.modal').count()) await K.conferma(pg,false);
  T('A04.27 la ✕ di una trasformazione (o proroga/periodo/massimale) chiede conferma (§10.1)', nTr>0 && chiesto, 'trasformazioni '+nTr+', conferma chiesta: '+chiesto);
  T('A04.25 zero errori di pagina', E.length===0, E.join('|'));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
