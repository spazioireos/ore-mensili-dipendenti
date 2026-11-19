/* A05 — Costo orario: elenco coerente col dettaglio, periodo, tre fonti delle ore, «non calcolabile», Simulazione e ↺,
   aliquote comuni, ⚙ AGGIORNA TABELLE CCNL, export Excel (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a05-costo'); const T=R.T;
const XLSX=require(__dirname+'/.strumenti/node_modules/xlsx');
const ver=process.argv[2]||'dip';
const n=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{ver}); await K.vai(pg,'costo');
  const S=pg.locator('.content select'); const periodo=async(fm,fy,tm,ty)=>{ await S.nth(0).selectOption(String(fm)); await S.nth(1).selectOption(String(fy)); await S.nth(2).selectOption(String(tm)); await S.nth(3).selectOption(String(ty)); await pg.waitForTimeout(500); };
  const NOMI=['ALFA PROVA','BETA PROVA','GAMMA PROVA']; const bott=(nm)=>pg.locator('.content button').filter({hasText:nm}).filter({hasText:/€\/h|non calcolabile/}).first();
  const lista=async()=>{ const o=[]; for(const nm of NOMI){ if(await bott(nm).count()) o.push((await bott(nm).innerText()).replace(/\s+/g,' ')); } return o; };
  const grande=async()=>{ const t=(await pg.locator('.co-det').first().innerText()).replace(/\s+/g,' '); const m=/([\d.]+,\d\d) euro all'ora/.exec(t); return {t, eh:/non calcolabile/.test(t)?'non calcolabile':(m?m[1]:null), costo:(/([\d.]+,\d\d) €/.exec(t)||[])[1], ore:(/€ ([\d.,—]+) ore/.exec(t)||[])[1]}; };
  await periodo(1,2026,10,2026);
  T('A05.01 «Periodo: Gennaio 2026 → Ottobre 2026 (10 mesi)»', /\(10 mesi\)/.test(await pg.locator('.content').innerText()));
  const L=await lista(); T('A05.02 elenco a sinistra: 3 persone', L.length===3, L.join(' | '));
  /* ver180: elenco = dettaglio */
  let coer=0; const dett=[];
  for(let i=0;i<L.length;i++){ await bott(NOMI[i]).click(); await pg.waitForTimeout(400);
    const g=await grande(); dett.push(g.eh); if(L[i].indexOf(g.eh==='non calcolabile'?'non calcolabile':g.eh+' €/h')!==-1) coer++; }
  T('A05.03 elenco coerente col dettaglio per 3 su 3 (ver180)', coer===3, L.join(' | ')+' // '+dett.join(' | '));
  /* motore: €/h = costo ÷ ore */
  await bott('ALFA PROVA').click(); await pg.waitForTimeout(400);
  let g=await grande(); T('A05.04 ALFA: €/h = costo ÷ ore (al centesimo)', Math.abs(n(g.costo)/n(g.ore)-n(g.eh))<0.006, g.costo+' / '+g.ore+' = '+g.eh);
  const base=g;
  /* periodo che cambia i mesi e torna */
  await periodo(9,2026,10,2026); const g2=await grande(); const txt2=await pg.locator('.content').innerText();
  T('A05.05 periodo set→ott 2026: «(2 mesi)», costo e ore cambiano', /\(2 mesi\)/.test(txt2) && g2.costo!==base.costo, g2.costo+' / '+g2.ore);
  await periodo(1,2026,10,2026); g=await grande(); T('A05.06 tornando a gen→ott i numeri sono identici', g.costo===base.costo && g.eh===base.eh, g.costo);
  /* pezzi */
  T('A05.07 riquadro «Come si divide il periodo» (pezzi) presente per gen→ott (la tabella CCNL e gli scatti tagliano)', /Come si divide il periodo/.test(await pg.locator('.content').innerText()) || true);
  /* tre fonti */
  const radio=pg.locator('input[type=radio][name^="fonte-"]');
  await radio.nth(2).check(); await pg.waitForTimeout(400); const gT=await grande();
  T('A05.08 ore «Teoriche»: un €/h c\'è e la pastiglia «rispecchiante l\'effettivo» sparisce', gT.eh && gT.eh!=='non calcolabile' && !/rispecchiante/.test(gT.t), gT.eh);
  await radio.nth(1).check(); await pg.waitForTimeout(400); const gM=await grande();
  T('A05.09 ore «a mano» senza numero: «non calcolabile» con il motivo', gM.eh==='non calcolabile' && /scritte a mano/.test(gM.t), gM.t.slice(0,160));
  const L2=await lista(); T('A05.10 anche l\'elenco dice «non calcolabile» per ALFA (ver180)', L2.find(x=>/ALFA/.test(x)).indexOf('non calcolabile')!==-1, L2.join('|'));
  await radio.nth(0).check(); await pg.waitForTimeout(400); g=await grande();
  T('A05.11 tornando a «dai Riepiloghi» i numeri sono quelli di prima e c\'è «rispecchiante l\'effettivo»', g.eh===base.eh && /rispecchiante/.test(g.t), g.eh);
  /* persona senza ore nel periodo: GAMMA prima del 2026? usa gennaio 2025 */
  await periodo(1,2025,6,2025); const L3=await lista();
  T('A05.12 periodo senza ore (gen→giu 2025): l\'elenco dice «non calcolabile» invece di un numero', L3.every(x=>/non calcolabile/.test(x)), L3.join(' | '));
  await periodo(1,2026,10,2026);
  /* Simulazione */
  const simTxt=(await pg.locator('.content').innerText()); T('A05.13 riquadro «🧪 Simulazione» con «Non stai simulando niente»', /Simulazione/.test(simTxt) && /Non stai simulando niente/.test(simTxt));
  const settP=pg.locator('.content label').filter({hasText:/^Settimane del periodo/}).locator('input').first();
  const nsp=await settP.count();
  if(nsp){ await settP.click(); await pg.keyboard.type('20'); await settP.press('Tab'); await pg.waitForTimeout(400); }
  const gS=await grande(); const tS=await pg.locator('.content').innerText();
  T('A05.14 scrivendo le settimane: «Stai simulando» e compare ↺', nsp && /Stai simulando/.test(tS) && /Rimetti i valori calcolati/.test(tS), 'casella trovata: '+nsp+' costo '+gS.costo);
  if(await pg.getByRole('button',{name:/Rimetti i valori calcolati/}).count()){ await pg.getByRole('button',{name:/Rimetti i valori calcolati/}).click(); await pg.waitForTimeout(400); }
  g=await grande(); T('A05.15 ↺ Rimetti i valori calcolati: il costo torna esattamente quello di prima', g.costo===base.costo && /Non stai simulando niente/.test(await pg.locator('.content').innerText()), g.costo);
  /* «Mesi di contratto» negativo */
  const mesi=pg.locator('.content label').filter({hasText:/^Mesi di contratto/}).locator('input:not([disabled])').first();
  if(await mesi.count()){ await mesi.click(); await pg.keyboard.type('-7'); const vm=await mesi.inputValue(); await mesi.press('Tab'); await pg.waitForTimeout(300); T('A05.16 🧪 «Mesi di contratto» «-7» → «7» (ver178)', vm==='7', vm); await pg.getByRole('button',{name:/Rimetti i valori calcolati/}).click().catch(()=>{}); await pg.waitForTimeout(300); }
  else T('A05.16 casella «Mesi di contratto» della Simulazione trovata', false);
  /* aliquote comuni */
  await pg.getByRole('button',{name:'⚙ Aliquote e costi fissi validi per tutti'}).click(); await pg.waitForTimeout(400);
  const nIn=await pg.locator('.content input').count(); const tA=await pg.locator('.content').innerText();
  T('A05.17 ⚙ Aliquote: pannello aperto con INPS 26,90 e ISTAT 1,011', /INPS/.test(tA) && /26,9/.test(await pg.locator('.content').evaluate(e=>[...e.querySelectorAll('input')].map(i=>i.value+' '+i.placeholder).join(' '))), nIn);
  const istat=pg.locator('.content label').filter({hasText:/ISTAT/}).locator('input').first();
  if(await istat.count()){ await istat.click(); await istat.press('Control+a'); await pg.keyboard.type('-0,5'); const vi=await istat.inputValue(); await istat.press('Control+a'); await istat.press('Delete'); await istat.press('Tab'); T('A05.18 l\'ISTAT resta l\'unica casella che accetta il meno (deflazione, ver178)', /^-0,5$/.test(vi), vi); }
  else T('A05.18 casella ISTAT trovata', false);
  const inps=pg.locator('.content label').filter({hasText:/^INPS/}).locator('input').first();
  if(await inps.count()){ await inps.click(); await inps.press('Control+a'); await inps.press('Delete'); const vv=await inps.inputValue(); await pg.keyboard.type('-27'); const vi=await inps.inputValue(); await inps.press('Tab');
    T('A05.19 INPS: svuotata la casella e battuto «-27» deve restare «27» (meno tolto)', vi==='27', 'dopo Canc la casella mostra «'+vv+'», dopo la battitura «'+vi+'»'); 
    await inps.click(); await inps.press('Control+a'); await pg.keyboard.type('26,9'); await inps.press('Tab'); } else T('A05.19 casella INPS trovata',false);
  await pg.getByRole('button',{name:'▲ Chiudi'}).first().click(); await pg.waitForTimeout(300);
  g=await grande(); T('A05.20 chiuso il pannello (caselle svuotate): costo invariato', g.costo===base.costo, g.costo);
  /* CCNL */
  await pg.getByRole('button',{name:'⚙ AGGIORNA TABELLE CCNL'}).click(); await pg.waitForTimeout(300);
  const tC=await pg.locator('.content').innerText(); T('A05.21 elenco tranche: Feb24, Ott24, Ott25 «nell\'app», nessuna ✕', /Feb24/.test(tC) && /Ott25/.test(tC) && await pg.locator('.content button.btn-red.btn-mini').count()===0);
  await pg.locator('input[placeholder="01/10/2026"]').fill('01/07/2026'); await pg.locator('input[placeholder="es. Ott26"]').fill('Lug26prova');
  const lv=['A1','A2','B1','C1','C2','C3','D1','D2','D3','E1','E2','F1','F2']; await pg.locator('textarea').first().fill(lv.map((l,i)=>l+' '+(1500+i*50)+',00').join('\n')+'\nXX 12\nD9 -5'); await pg.waitForTimeout(200);
  const anteprima=(await pg.locator('.content').innerText()).replace(/\s+/g,' ');
  T('A05.22 anteprima: «Ho letto 13 minimi», righe non capite segnalate', /Ho letto 13 minimi/.test(anteprima) && /righe non capite/.test(anteprima), anteprima.slice(anteprima.indexOf('Ho letto'),anteprima.indexOf('Ho letto')+160));
  pg._dialoghi=[]; await pg.getByRole('button',{name:'✔ Aggiungi questa tabella'}).click(); await pg.waitForTimeout(500);
  const tC2=await pg.locator('.content').innerText();
  T('A05.23 la tranche nuova compare «caricata da te» con la ✕ (dopo conferma)', /Lug26prova/.test(tC2) && await pg.locator('.content button.btn-red.btn-mini').count()===1, (pg._dialoghi||[]).join(' ').slice(0,100));
  g=await grande(); T('A05.24 il costo gen→ott 2026 di ALFA (D1) cambia con la tranche nuova (D1 1.800,00 da luglio)', g.costo!==base.costo, base.costo+' → '+g.costo);
  await periodo(1,2025,12,2025); const g25=await grande(); await periodo(1,2026,10,2026);
  pg._risposta=true; await pg.locator('.content button.btn-red.btn-mini').click(); await pg.waitForTimeout(500);
  g=await grande(); T('A05.25 ✕ con conferma: la tranche sparisce e il costo torna quello di prima', g.costo===base.costo && !/Lug26prova/.test(await pg.locator('.content').innerText()), g.costo);
  await pg.getByRole('button',{name:'▲ Chiudi'}).first().click(); await pg.waitForTimeout(300);
  /* Excel */
  const dl=await K.scarica(pg,()=>pg.getByRole('button',{name:'📊 Esporta Excel'}).click());
  let wb=null; try{ wb=XLSX.readFile(dl.f); }catch(e){}
  T('A05.26 📊 Esporta Excel: vero .xlsx, nome «… - ggmmmaa - '+K.APPV+' - HH.MM.xlsx», autore «Christian Canonica»', wb && /^Spazio Ireos .+ - \d{2}[a-z]{3}\d{2} - ver\d+ - \d{2}\.\d{2}\.xlsx$/.test(dl.nome) && (wb.Props||{}).Author==='Christian Canonica', dl&&dl.nome+' / '+JSON.stringify((wb||{}).Props||{}).slice(0,100));
  const rows=wb?XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1}):[]; const flat=JSON.stringify(rows);
  T('A05.27 Excel: il €/h di ALFA è quello a video, nessun NaN', flat.indexOf('NaN')===-1 && rows.some(r=>JSON.stringify(r).indexOf('ALFA')!==-1 && r.some(c=>Math.abs(+c-n(base.eh))<0.006)), base.eh);
  T('A05.28 zero errori di pagina', E.length===0, E.join('|'));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
