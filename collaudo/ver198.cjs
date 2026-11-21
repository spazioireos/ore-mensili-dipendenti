/* Collaudo ver198 (sopra la ver197) (dati INVENTATI): (1) capsula «Devi riempire ancora per» accanto al TOT teorico = ORE CHE DEVONO RISULTARE NEL
   TOTALE TEORICO MENSILE PER AVERE LE ORE CONTRATTUALI − TOT teorico (Christian, 20/11/2026); (2) il segno dell'erosione sotto la
   cella diventa una linguetta «E» / «NE» ben visibile, con una riga che spiega dove si segna. Confronto con la ver197 congelata.
   ver198 (21/11/2026, Christian: «il tot teorico segni tutto anche le NE (usa però l'acronimo NON ER)»): il TOT teorico
   comprende anche le parti NON ER; la linguetta NE diventa «NON ER». Il Tetto annuo non cambia.
   Poi, stesso giorno: «Lasciamo come era, ma aggiungi un ulteriore riga …» → tre righe E) Tot ore inserite a mano,
   F) Tot teorico con NON ER (tutto), G) Tot teorico con ER (il TOT teorico di prima, da cui parte la capsula).
   Prima: python3 collaudo/rigenera.py ver197. Poi: node collaudo/ver198.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300'; const OUT=process.env.OUT||(__dirname+'/out/');
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function dic(){ const g={}; for(let d=1;d<=31;d++){ const wd=new Date(2026,11,d).getDay(); if(wd===0) continue; if([7,8,25,26].includes(d)) continue; g[d]='3'; } g[14]='FERIE'; g[28]='FERIE'; g[29]='MAL'; return g; }
function nov(){ const g={}; for(let d=1;d<=30;d++){ if(new Date(2026,10,d).getDay()!==0) g[d]='3'; } return g; }
const ST={ anni:[2026], dipendenti:[{id:'a',nome:'PROVA EROSIONE',oreSett:18,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',tettiAnnui:[{anno:2026,ore:400}],tettoPeriodo:'scolastico'}],
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
  return { pill, teor:(q('.foot-teor:not(.foot-noner) > b')||{}).innerText, teorTxt:(q('.foot-line')||{}).innerText, fTot:(q('.foot-noner > b')||{}).innerText, eTxt:(q('.foot-tot')||{}).innerText, gTxt:(q('.foot-teor:not(.foot-noner)')||{}).innerText, fTxt:(q('.foot-noner')||{}).innerText, ordine:[...c.querySelectorAll('.tot-righe > span')].map(x=>x.innerText.slice(0,2)).join(''), tops:[...c.querySelectorAll('.tot-righe > span')].map(x=>Math.round(x.getBoundingClientRect().top)), tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1], cellTeor:(q('.tot-teor')||{}).innerText, anc:q('.foot-ancora')?q('.foot-ancora').innerText:null, ancCls:q('.foot-ancora')?q('.foot-ancora').className:'',
    leg:q('.ero-legenda')?q('.ero-legenda').innerText:null, tabs, stE:e?st(e):'', stNE:ne?st(ne):'', fsE:e?getComputedStyle(e).fontSize:'',
    tw:(q('table.cal')||{}).scrollWidth, pw:document.documentElement.scrollWidth }; }); }
async function apriMese(br,url,tab,w){ const {ctx,pg,E}=await apri(br,url,w,tab); return {ctx,pg,E}; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const R={};
  for(const [k,url] of [['n','http://127.0.0.1:'+PORTA+'/dip/index.html'],['v','http://127.0.0.1:'+PORTA+'/ver197/index.html']]){
    for(const [tab,mm] of [[11,'dic'],[10,'nov']]){ for(const w of [1500,390]){ const {ctx,pg,E}=await apri(br,url,w,tab); R[k+mm+w]=await leggi(pg); R[k+mm+w].E=E;
      if(k==='n'&&mm==='dic'){ await pg.addStyleTag({content:'.app-header,.tabs,.monthstrip,.zoombar,.yearbar{position:static!important}'}); const el=pg.locator('.emp-card').first(); await el.screenshot({path:OUT+'anteprima198-'+w+'.png'}); }
      await ctx.close(); } } }
  const n=R.ndic1500, v=R.vdic1500, nv=R.nnov1500;
  T('W00 zero errori di pagina', [R.ndic1500,R.ndic390,R.nnov1500,R.nnov390].every(x=>!x.E.length), R.ndic1500.E.join('|'));
  T('W01 ver197: TOT teorico 75,000 (solo erosive)', v.teor==='75,000', v.teor);
  T('W02 G) Tot teorico con ER = 75,000, come il TOT teorico della ver197', n.teor==='75,000' && /^G\) Tot teorico con ER: 75,000$/.test(n.gTxt||''), n.gTxt);
  T('W03 F) Tot teorico con NON ER = 81,000 (75 + ferie NON ER 3 + Santo Stefano NON ER 3)', n.fTot==='81,000' && /^F\) Tot teorico con NON ER: 81,000$/.test(n.fTxt||''), n.fTxt);
  T('W04 E) Tot ore inserite a mano = 60,000 (il TOT calcolato di prima)', /^E\) Tot ore inserite a mano: 60,000$/.test(n.eTxt||'') && /TOT calcolato: 60,000/.test(v.teorTxt||''), n.eTxt);
  T('W04b tre righe, in ordine E F G, una sotto l\'altra', n.ordine==='E)F)G)' && n.tops[0]<n.tops[1] && n.tops[1]<n.tops[2], n.ordine+' '+n.tops.join(','));
  T('W05 «teor.» nella cella TOT resta 75,000 (con ER)', /75,000/.test(n.cellTeor||'') && n.cellTeor===v.cellTeor, n.cellTeor);
  T('W06 capsula come prima: 81 − G 75 = +6,000', n.anc===v.anc && /\+6,000/.test(n.anc||''), n.anc);
  T('W07 novembre: F = G (niente NON ER)', nv.fTot===nv.teor && nv.teor===R.vnov1500.teor, nv.fTot+' / '+nv.teor);
  T('W08 linguette: «E» sulle erosive, «NON ER» sulle non erosive', n.tabs.length>=6 && n.tabs.every(t=> t.ne ? /^NON ER\s*\d/.test(t.t) : /^E\s*\d/.test(t.t)), n.tabs.map(t=>t.t).join(' | '));
  T('W09 nessuna linguetta «NE» rimasta', !n.tabs.some(t=>/^NE\s*\d/.test(t.t)));
  T('W10 Tetto annuo identico alla ver197 (le NON ER non erodono)', n.tetto===v.tetto, n.tetto+' vs '+v.tetto);
  T('W11 riga di spiegazione con «NON ER»', /diventa NON ER/.test(n.leg||''), (n.leg||'').slice(0,160));
  T('W13 tabella del mese non più larga della ver197 (1500px)', n.tw<=v.tw, n.tw+' vs '+v.tw);
  T('W14 390px: niente scorrimento laterale', R.ndic390.pw<=390 && R.nnov390.pw<=390, R.ndic390.pw+' / '+R.nnov390.pw);
  console.log('\n'+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
