/* ver206 — 🎯 Massimali mese per mese (Riepiloghi + Query personale), dati INVENTATI. Banco: bash collaudo/prepara-banco.sh ver205 */
const K=require('./a00-comune.cjs'); const R=K.contatore('ver206');
const gf=(y,m,v,s)=>{const g={};const nd=new Date(y,m,0).getDate();for(let d=1;d<=nd;d++){const w=new Date(y,m-1,d).getDay(); if(w===0)continue; if(s&&w===6)continue; g[d]=v;} return g;};
const num=s=>parseFloat(String(s||'').replace(/\./g,'').replace(',','.'));
function stato(){ const st=K.statoBase();
  st.dipendenti[1].tettiAnnui=[{id:'t2',anno:'2026',ore:'408,5',voci:[{nome:'CAG',ore:'200'},{nome:'CASA DI QUARTIERE',ore:'208,5'}]}];
  st.dipendenti[2].tettiAnnui=[{id:'t3',anno:'2026',ore:'300'}]; st.dipendenti[2].tettoPeriodo='civile';
  st.dati['2026-11'].a={giorni:Object.assign(gf(2026,11,'6,5'),{9:'FERIE',10:'FERIE'})};
  st.dati['2026-11'].b={giorni:Object.assign(gf(2026,11,'3,5'),{16:'MAL'})};
  st.dati['2026-11'].c={giorni:Object.assign(gf(2026,11,'3'),{17:'FERIE'})};
  st.dati['2026-10'].a.ero={5:false}; return st; }
async function hTab(pg,ver,st){ const out={}; await K.annoA(pg,2026);
  for(const m of ['Set','Ott','Nov']){ await K.vai(pg,m); for(const n of ['ALFA','BETA','GAMMA']){ const t=await K.carta(pg,n).locator('.foot-fin').innerText().catch(()=>''); out[m+n]=(t.match(/[\d.]+,\d{3}/)||[])[0]||''; } }
  return out; }
(async()=>{ const br=await K.chromium.launch();
  /* 1) riferimento: la riga H del Tabellone nella ver205 */
  let a=await K.apri(br,{ver:'ver205',stato:stato()}); const H205=await hTab(a.pg); await a.ctx.close();
  let b=await K.apri(br,{ver:'dip',stato:stato()}); const pg=b.pg; const H=await hTab(pg);
  R.T('Z01 riga H del Tabellone identica alla ver205 (9 schede-mese)', JSON.stringify(H)===JSON.stringify(H205), JSON.stringify(H));
  R.T('Z02 targhetta '+K.APPV, new RegExp(K.APPV).test(await pg.locator('.app-rev').innerText()));   /* ver207: la versione si legge dal file */
  /* 2) Riepiloghi */
  await K.vai(pg,'rep'); const sel=pg.locator('.toolbar select');
  await sel.nth(0).selectOption('9'); await sel.nth(1).selectOption('2026'); await sel.nth(2).selectOption('8'); await sel.nth(3).selectOption('2027'); await pg.waitForTimeout(500);
  const box=pg.locator('.rep-box').filter({hasText:'Massimali — consumo mese per mese'});
  R.T('Z03 riquadro «🎯 Massimali — consumo mese per mese» nei Riepiloghi', await box.count()===1);
  const righe=await box.locator('tbody tr').evaluateAll(trs=>trs.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.innerText.trim())));
  R.T('Z04 due righe per persona con massimale (3 persone → 6 righe)', righe.length===6, righe.length);
  const per=(i)=>{ const ced=righe[i], ero=righe[i+1]; return {nome:ced[0], ced:ced.slice(2,-1), ero:ero.slice(1,-1), tc:ced[ced.length-1], te:ero[ero.length-1]}; };
  let okH=true, okS=true; const det=[];
  for(let i=0;i<6;i+=2){ const p=per(i); const n=p.nome.split(' ')[0]; let sc=0,se=0;
    ['Set','Ott','Nov'].forEach((m,j)=>{ const h=num(p.ced[j])+num(p.ero[j]); sc+=num(p.ced[j]); se+=num(p.ero[j]); if(Math.abs(h-num(H[m+n]))>0.0006){ okH=false; det.push(n+m+' '+h+'≠'+H[m+n]); } });
    if(Math.abs(sc-num(p.tc))>0.0015||Math.abs(se-num(p.te))>0.0015){ okS=false; det.push(n+' somme'); } }
  R.T('Z05 per ogni mese a cedolino + erosive = riga H del Tabellone', okH, det.join('; '));
  R.T('Z06 «Nel periodo» = somma dei mesi, per le due righe', okS, det.join('; '));
  R.T('Z07 ALFA ottobre: erosive 12,667 (FERIE spenta = non erosiva, 2 MAL erosive)', per(0).ero[1]==='12,667', per(0).ero[1]);
  R.T('Z08 mesi senza dati vuoti', per(0).ced[3]==='' && per(0).ero[11]==='', per(0).ced[3]);
  R.T('Z09 GAMMA (non mensilizzata): ore fatte + erosive = H di novembre', num(per(4).ced[2])+num(per(4).ero[2])===num(H.NovGAMMA), per(4).ced[2]+' + '+per(4).ero[2]);
  /* 3) Query personale */
  await K.vai(pg,'query'); await pg.locator('button',{hasText:'🎯 Massimali'}).click(); await pg.waitForTimeout(400);
  const q=async()=>pg.locator('body').innerText();
  let t=await q();
  R.T('Z10 Query: pulsante e pastiglie', /Massimo a\.s\. 2026\/27: 500,000 h/.test(t) && /Già usate: 499,834 h/.test(t) && /Restano: 0,166 h/.test(t));
  await K.vai(pg,'Nov'); const rq=await K.carta(pg,'ALFA').innerText(); const usT=(rq.match(/Già usate[^\d]*([\d.,]+)/)||[])[1];
  R.T('Z11 «Già usate» = riquadro 🎯 Tetto annuo del Tabellone', usT==='499,834', usT);
  await K.vai(pg,'query'); await pg.locator('button',{hasText:'🎯 Massimali'}).click(); await pg.waitForTimeout(300);
  await pg.locator('select').filter({hasText:'BETA'}).first().selectOption('b'); await pg.waitForTimeout(300); t=await q();
  R.T('Z12 BETA: 408,500 · 262,167 · 146,333 e «Come è diviso»', /408,500 h/.test(t)&&/Già usate: 262,167/.test(t)&&/Restano: 146,333/.test(t)&&/CAG 200,000 h · CASA DI QUARTIERE 208,500 h/.test(t));
  R.T('Z13 «Usate fin qui» progressivo (Novembre = 262,167)', /Novembre 2026\s+84,000\s+3,167\s+87,167\s+262,167\s+146,333/.test(t));
  await pg.locator('select').filter({hasText:'GAMMA'}).first().selectOption('c'); await pg.waitForTimeout(300); t=await q();
  R.T('Z14 GAMMA a periodo civile: anno 2026, da Gennaio a Dicembre', /Massimo anno 2026: 300,000 h/.test(t)&&/Gennaio 2026/.test(t)&&/Dicembre 2026/.test(t)&&!/Gennaio 2027/.test(t));
  await pg.locator('select').filter({hasText:'GAMMA'}).first().selectOption('a'); await pg.waitForTimeout(200);
  await pg.locator('select').filter({hasText:'a.s. 2025/26'}).first().selectOption('2025'); await pg.waitForTimeout(300); t=await q();
  R.T('Z15 periodo senza massimale: «nessun massimale» e niente Restano', /Massimo a\.s\. 2025\/26: nessun massimale/.test(t)&&!/Restano:/.test(t));
  R.T('Z16 niente salvataggio: il 💾 resta spento', await pg.locator('button',{hasText:'Salva'}).first().isDisabled());
  R.T('Z17 zero errori di pagina', b.E.length===0, b.E.join('|')); await b.ctx.close();
  /* 4) nessuno con massimale */
  const s0=K.statoBase(); s0.dipendenti.forEach(d=>delete d.tettiAnnui);
  let c=await K.apri(br,{ver:'dip',stato:s0}); await K.vai(c.pg,'rep'); t=await c.pg.locator('body').innerText();
  R.T('Z18 Riepiloghi senza massimali: lo dice', /Nessun dipendente ha un massimale\./.test(t));
  await K.vai(c.pg,'query'); await c.pg.locator('button',{hasText:'🎯 Massimali'}).click(); await c.pg.waitForTimeout(300);
  R.T('Z19 Query senza massimali: lo dice, zero errori', /Nessun dipendente ha un massimale\./.test(await c.pg.locator('body').innerText()) && c.E.length===0, c.E.join('|')); await c.ctx.close();
  /* 5) grafica */
  for(const w of [390,1280]){ const g=await K.apri(br,{ver:'dip',stato:stato(),w}); await K.vai(g.pg,'rep'); let m=await K.misura(g.pg);
    R.T('Z20 '+w+'px Riepiloghi: niente scorrimento laterale', !m.lato, m.SW);
    await K.vai(g.pg,'query'); await g.pg.locator('button',{hasText:'🎯 Massimali'}).click(); await g.pg.waitForTimeout(300); m=await K.misura(g.pg);
    R.T('Z21 '+w+'px Query Massimali: niente scorrimento laterale', !m.lato, m.SW); await g.ctx.close(); }
  await br.close(); R.fine(); })();
