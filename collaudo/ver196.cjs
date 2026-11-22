/* Collaudo ver196 (dati INVENTATI): nei mesi a busta mensilizzata ASS.ING e ASP 0h si trattengono SEMPRE per la quota
   del giorno (18 h/sett. su 6 giorni = 3 h) e le ore fatte in più negli altri giorni NON le coprono: diventano
   supplementari (Christian, 20/11/2026: «un Asp 0h o un Ass ing deve valere 3» → «Sì, nessuna compensazione»).
   Confronto con la ver195 congelata (.banco/ver195). Prima: python3 collaudo/rigenera.py ver195. Poi: node collaudo/ver196.cjs */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PM=require('./paghe-meta.cjs'); const fs=require('fs'), cp=require('child_process'); const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function base(){ const g={}; for(let d=1;d<=31;d++){ if(new Date(2026,9,d).getDay()===0) continue; g[d]='3'; } return g; }
const A=base(); A[12]='ASS.ING';
const B=base(); B[12]='ASS.ING'; B[13]='6';
const C=base(); C[12]='ASP 0h'; C[13]='5';
const D=base(); D[13]='6';                       /* niente ASS.ING: deve restare come prima */
const O=base(); O[12]='ASS.ING'; O[13]='6';      /* non mensilizzato: deve restare come prima */
const mk=(id,n,mens)=>Object.assign({id,nome:n,oreSett:18,livello:'D1',tipoContratto:'indeterminato',dataAssunzione:'01/01/2020'}, mens===false?{mensilizzato:false}:{mensilizzato:true,mensilizzatoDal:'01/10/2026'});
const ST={ anni:[2026], dipendenti:[mk('a','PROVA SOLA'),mk('b','PROVA COMPENSA'),mk('c','PROVA PARZIALE'),mk('d','PROVA NIENTE'),mk('o','PROVA ORARIO',false)],
  dati:{'2026-10':{a:{giorni:A},b:{giorni:B},c:{giorni:C},d:{giorni:D},o:{giorni:O}}}, costoComune:{} };
async function apri(br,url,w){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },ST); await pg.goto(url,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  await pg.locator('.tabs .tab').nth(9).click(); await pg.waitForTimeout(900); return {ctx,pg,E}; }
const card=(pg,nome)=>pg.evaluate((nome)=>{ const c=[...document.querySelectorAll('.emp-card')].find(c=>((c.querySelector('.emp-head .nome')||{}).innerText||'').indexOf(nome)!==-1); if(!c) return null;
  const pill=[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText).join(' | '); const b=c.querySelector('.ced-box'); const cg=c.querySelector('.cong');
  const teor=[...c.querySelectorAll('.teor-abs')].map(x=>x.innerText.trim()); return { pill, box:b?b.innerText.replace(/[ \t]+/g,' '):'', cong:cg?cg.innerText.replace(/\s+/g,' '):'', teor }; },nome);
async function pdf(pg,nomeBtn,mese){ const btn=pg.getByRole('button',{name:nomeBtn,exact:true}); if(!(await btn.count())) return {esiste:false};
  await btn.first().click(); await pg.waitForTimeout(700); const sel=pg.locator('.modal select'); await sel.nth(0).selectOption(String(mese)); await sel.nth(1).selectOption('2026');
  const dlP=pg.waitForEvent('download',{timeout:30000}).catch(()=>null); await pg.getByRole('button',{name:/^Genera /}).first().click(); const dl=await dlP; if(!dl) return {esiste:true,dl:null};
  const out=__dirname+'/out/'+(pg.__tag||'')+mese+'-'+(dl.suggestedFilename()||'o.pdf'); await dl.saveAs(out); const pagine=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(out)))||[0,0])[1];
  let txt=sh('pdftotext -layout '+JSON.stringify(out)+' -'); let pagine2=pagine; if(PM.ePaghe(dl.suggestedFilename())){ const M=PM.testoPaghe(out); txt=M.txt; pagine2=M.pagine; }   /* ver208: due persone per foglio */
  return {esiste:true,dl,out,pagine:pagine2,txt,flat:txt.replace(/\s+/g,' '),nome:dl.suggestedFilename()}; }


async function giro(br,url,tag){ const {ctx,pg,E}=await apri(br,url); pg.__tag=tag+'-'; const out={E};
  for(const n of ['PROVA SOLA','PROVA COMPENSA','PROVA PARZIALE','PROVA NIENTE','PROVA ORARIO']) out[n]=await card(pg,n);
  const R=await pdf(pg,'🖨️ Report PDF A4 per le paghe',10); out.pag={};
  R.txt.split('\f').filter(p=>p.trim()).forEach(p=>{ const n=(p.match(/PROVA \w+/)||[''])[0]; const r={}; p.split('\n').forEach(l=>{ const t=l.replace(/\s+/g,' ').trim(); const m=/^(1[23]|TOTALE)\b/.exec(t); if(m) r[m[1]]=t; }); out.pag[n]=r; });
  await ctx.close(); return out; }
const sup=b=>{ const m=/ORE SUPPLEMENTARI \((?:Risultato del mese|oltre le ore mensili)\)\s*\+?([\d,]+) h/.exec(b||''); return m?m[1]:'?'; };
const trt=b=>{ const m=/da trattenere\s*([\d,]+) h/.exec(b||''); return m?m[1]:'0'; };
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const N=await giro(br,'http://127.0.0.1:8300/dip/index.html','n'); const V=await giro(br,'http://127.0.0.1:8300/ver195/index.html','v');
  T('Z00 zero errori di pagina', N.E.length===0, N.E.join('|'));
  T('Z01 ver195: ASS.ING compensata dal giorno con 6 h → 0,00 nel report', /12 lun ASS\.ING 0,00/.test(V.pag['PROVA COMPENSA']['12']||''), V.pag['PROVA COMPENSA']['12']);
  T('Z02 ver195: ASP 0h compensata in parte → 1,00', /12 lun ASP 0h 1,00/.test(V.pag['PROVA PARZIALE']['12']||''), V.pag['PROVA PARZIALE']['12']);
  for(const n of ['PROVA SOLA','PROVA COMPENSA','PROVA PARZIALE']) T('Z03 ver196 '+n+': il giorno 12 vale 3,00 (3 h)', /12 lun (ASS\.ING|ASP 0h) 3,00 \(3 h\)/.test(N.pag[n]['12']||''), N.pag[n]['12']);
  /* ver203 (Christian: «Oltre B, come le paghe»): le supplementari a cedolino partono dalle ore mensili (B 78,158), non da C (81 in
     ottobre); le ASS.ING / ASP 0h restano trattenute per intero (ver196). Attese ricalcolate a mano:
     SOLA 78 h → 78 − (78,158 − 3) = 2,842 → al passo 2,83 · COMPENSA 81 → 5,83 · PARZIALE 80 → 4,83 · NIENTE 84 → 5,83 */
  T('Z04 COMPENSA: il 13 porta 3 h ordinarie e le sue ore in più fra le supplementari', /^13 mar 3,00 \(3 h\) /.test(N.pag['PROVA COMPENSA']['13']||'') || /^13 mar \d+,\d{2} \([^)]*\) \d+,\d{2}/.test(N.pag['PROVA COMPENSA']['13']||''), N.pag['PROVA COMPENSA']['13']);
  T('Z05 COMPENSA TOTALE: ordinarie 75,16 · supplementari 5,83 · non retribuite 3,00', /TOTALE 75,16 .* 5,83 \(5,50 = 5 h e 50 min\) 0,00 .* 3,00 \(3,00 = 3 h\)/.test(N.pag['PROVA COMPENSA'].TOTALE||''), N.pag['PROVA COMPENSA'].TOTALE);
  T('Z06 PARZIALE TOTALE: supplementari 4,83 · non retribuite 3,00', /TOTALE 75,16 .* 4,83 \(4,50 = 4 h e 50 min\) 0,00 .* 3,00/.test(N.pag['PROVA PARZIALE'].TOTALE||''), N.pag['PROVA PARZIALE'].TOTALE);
  T('Z07 SOLA: supplementari 2,83 oltre B (ver195: 0 su C), ASS.ING 3,00', /TOTALE 75,16 .* 2,83 \(2,50 = 2 h e 50 min\) 0,00 .* 3,00/.test(N.pag['PROVA SOLA'].TOTALE||''), N.pag['PROVA SOLA'].TOTALE);
  T('Z08 box COMPENSA: da trattenere 3,000 e supplementari +5,833', trt(N['PROVA COMPENSA'].box)==='3,000' && sup(N['PROVA COMPENSA'].box)==='5,833', trt(N['PROVA COMPENSA'].box)+' / '+sup(N['PROVA COMPENSA'].box));
  T('Z09 box PARZIALE: da trattenere 3,000 e supplementari +4,833', trt(N['PROVA PARZIALE'].box)==='3,000' && sup(N['PROVA PARZIALE'].box)==='4,833', trt(N['PROVA PARZIALE'].box)+' / '+sup(N['PROVA PARZIALE'].box));
  T('Z10 box: la frase sul perché', /non si compensano con le ore in più/.test(N['PROVA COMPENSA'].box||''));
  /* dalla ver201 C = B ÷ 26 × 27 = 81,164: il Risultato vero (su C) di COMPENSA è 81 − 81,164 e di PARZIALE 80 − 81,164 */
  T('Z11 Tabellone: il Risultato del mese su C = B (ver204): 81 − 78,158 = +2,842 · 80 − 78,158 = +1,842', /Risultato del mese: \+2,842 ore/.test(N['PROVA COMPENSA'].cong) && /Risultato del mese: \+1,842 ore/.test(N['PROVA PARZIALE'].cong), (N['PROVA COMPENSA'].cong.match(/Risultato del mese: [^)]*\)/)||[''])[0]);
  T('Z12 Tabellone COMPENSA: «a cedolino (soglia: ore mensili B …): supplementari 5,833 h · da trattenere 3,000 h»', /a cedolino \(soglia: ore mensili B 78,158\): supplementari 5,833 h · da trattenere 3,000 h \(di cui ASS\.ING \/ ASP 0h \/ SCIOP 3,000 h\)/.test(N['PROVA COMPENSA'].cong), (N['PROVA COMPENSA'].cong.match(/a cedolino.{0,140}/)||[''])[0]);
  T('Z13 senza ASS.ING: a cedolino supplementari 5,83 oltre B (ver195: 3,00 su C)', /TOTALE 78,16 .* 5,83 \(5,50 = 5 h e 50 min\) 0,00 .* 0,00/.test(N.pag['PROVA NIENTE'].TOTALE||'') && /TOTALE 78,16 .* 3,00 \(3,00 = 3 h\)/.test(V.pag['PROVA NIENTE'].TOTALE||''), N.pag['PROVA NIENTE'].TOTALE+' | '+V.pag['PROVA NIENTE'].TOTALE);
  T('Z14 non mensilizzato: niente box e niente pastiglia «a cedolino», Risultato su C (−0,164)', !N['PROVA ORARIO'].box && !/a cedolino/.test(N['PROVA ORARIO'].cong) && /Risultato del mese: -0,164 ore/.test(N['PROVA ORARIO'].cong), (N['PROVA ORARIO'].cong.match(/Risultato del mese: [^)]*\)/)||[''])[0]);
  console.log('\n'+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
