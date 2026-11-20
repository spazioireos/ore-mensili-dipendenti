/* Collaudo ver197 (dati INVENTATI): (1) capsula «Devi riempire ancora per» accanto al TOT teorico = ORE CHE DEVONO RISULTARE NEL
   TOTALE TEORICO MENSILE PER AVERE LE ORE CONTRATTUALI − TOT teorico (Christian, 20/11/2026); (2) il segno dell'erosione sotto la
   cella diventa una linguetta «E» / «NE» ben visibile, con una riga che spiega dove si segna. Confronto con la ver196 congelata.
   Prima: python3 collaudo/rigenera.py ver196. Poi: node collaudo/ver197.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300'; const OUT=process.env.OUT||(__dirname+'/out/');
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function dic(){ const g={}; for(let d=1;d<=31;d++){ const wd=new Date(2026,11,d).getDay(); if(wd===0) continue; if([7,8,25,26].includes(d)) continue; g[d]='3'; } g[14]='FERIE'; g[28]='FERIE'; g[29]='MAL'; return g; }
function nov(){ const g={}; for(let d=1;d<=30;d++){ if(new Date(2026,10,d).getDay()!==0) g[d]='3'; } return g; }
const ST={ anni:[2026], dipendenti:[{id:'a',nome:'PROVA EROSIONE',oreSett:18,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'}],
  dati:{'2026-12':{a:{giorni:dic(), ero:{28:false, 26:false}}}, '2026-11':{a:{giorni:nov()}}}, costoComune:{} };
async function apri(br,url,w,tab){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },ST); await pg.goto(url,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  await pg.locator('.tabs .tab').nth(tab).click(); await pg.waitForTimeout(900); return {ctx,pg,E}; }
const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.').replace('+',''));
async function leggi(pg){ return pg.evaluate(()=>{ const c=document.querySelector('.emp-card'); const q=s=>c.querySelector(s);
  const pill=[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText).find(t=>/ORE CHE DEVONO/.test(t))||'';
  const tabs=[...c.querySelectorAll('.teor-abs,.teor-fest')].map(x=>({t:x.innerText.trim(), ne:x.classList.contains('no-ero'), cls:x.className}));
  const st=x=>{ const s=getComputedStyle(x); return s.borderTopStyle+' '+s.borderTopColor+' '+s.backgroundColor; };
  const e=c.querySelector('.teor-abs:not(.no-ero)'), ne=c.querySelector('.teor-abs.no-ero');
  return { pill, teor:(q('.foot-teor b')||{}).innerText, anc:q('.foot-ancora')?q('.foot-ancora').innerText:null, ancCls:q('.foot-ancora')?q('.foot-ancora').className:'',
    leg:q('.ero-legenda')?q('.ero-legenda').innerText:null, tabs, stE:e?st(e):'', stNE:ne?st(ne):'', fsE:e?getComputedStyle(e).fontSize:'',
    tw:(q('table.cal')||{}).scrollWidth, pw:document.documentElement.scrollWidth }; }); }
async function apriMese(br,url,tab,w){ const {ctx,pg,E}=await apri(br,url,w,tab); return {ctx,pg,E}; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const R={};
  for(const [k,url] of [['n','http://127.0.0.1:'+PORTA+'/dip/index.html'],['v','http://127.0.0.1:'+PORTA+'/ver196/index.html']]){
    for(const [tab,mm] of [[11,'dic'],[10,'nov']]){ for(const w of [1500,390]){ const {ctx,pg,E}=await apri(br,url,w,tab); R[k+mm+w]=await leggi(pg); R[k+mm+w].E=E;
      if(k==='n'&&mm==='dic'){ await pg.addStyleTag({content:'.app-header,.tabs,.monthstrip,.zoombar,.yearbar{position:static!important}'}); const el=pg.locator('.emp-card').first(); await el.screenshot({path:OUT+'anteprima197-'+w+'.png'}); }
      await ctx.close(); } } }
  const n=R.ndic1500, v=R.vdic1500;
  T('V00 zero errori di pagina', [R.ndic1500,R.ndic390,R.nnov1500,R.nnov390].every(x=>!x.E.length), R.ndic1500.E.join('|'));
  const dov=num((n.pill.match(/([\d.,]+)\s*$/)||[])[1]), teor=num(n.teor), anc=num((n.anc||'').replace(/^.*:\s*/,''));
  T('V01 capsula «Devi riempire ancora per» presente', /^Devi riempire ancora per: /.test(n.anc||''), n.anc);
  T('V02 valore = ore che devono risultare − TOT teorico', Math.abs(anc-(dov-teor))<0.0015, dov+' − '+teor+' = '+anc);
  T('V03 positivo col segno +, ambra', /\+/.test(n.anc) && !/fatto/.test(n.ancCls), n.anc);
  const nv=R.nnov1500; const ancN=num((nv.anc||'').replace(/^.*:\s*/,'')); const dovN=num((nv.pill.match(/([\d.,]+)\s*$/)||[])[1]);
  T('V04 novembre (25 gg × 3 h = 75, dovute '+dovN+'): valore e colore', Math.abs(ancN-(dovN-num(nv.teor)))<0.0015 && (ancN>0.0005 ? !/fatto/.test(nv.ancCls) : /fatto/.test(nv.ancCls)), nv.anc+' · '+nv.ancCls);
  T('V05 ver196: nessuna capsula', v.anc===null);
  T('V06 linguette E sulle erosive, NE sulle non erosive', n.tabs.length>=6 && n.tabs.every(t=> t.ne ? /^NE\s*\d/.test(t.t) : /^E\s*\d/.test(t.t)), n.tabs.map(t=>t.t).join(' | '));
  T('V07 numeri delle linguette identici alla ver196 (solo la sigla in più)', JSON.stringify(n.tabs.map(t=>t.t.replace(/^N?E\s*/,''))) === JSON.stringify(v.tabs.map(t=>t.t)), v.tabs.map(t=>t.t).join(' | '));
  T('V08 E arancio pieno, NE grigia tratteggiata', /solid rgb\(234, 88, 12\) rgb\(255, 237, 213\)/.test(n.stE) && /dashed/.test(n.stNE), n.stE+' / '+n.stNE);
  T('V09 sigla a 10px (dentro la griglia, eccezione dichiarata)', n.fsE==='10px', n.fsE);
  T('V10 riga che spiega dove si segna l\'erosione', /Erosione del massimale/.test(n.leg||'') && /Cliccala/.test(n.leg||''), (n.leg||'').slice(0,90));
  T('V11 mese senza assenze né festività godute: niente riga', nv.leg===null);
  T('V12 tabella del mese non si allarga (1500px)', n.tw===v.tw, n.tw+' vs '+v.tw);
  T('V13 390px: niente scorrimento laterale della pagina', R.ndic390.pw<=390 && R.nnov390.pw<=390, R.ndic390.pw+' / '+R.nnov390.pw);
  T('V14 TOT teorico identico alla ver196', n.teor===v.teor, n.teor);
  console.log('\n'+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
