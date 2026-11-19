/* Collaudo ver182 (dati INVENTATI). Prima: bash collaudo/prepara-banco.sh ver181. Poi: node collaudo/ver182.cjs */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const fs=require('fs'), cp=require('child_process'); const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
const APPV=(fs.readFileSync(__dirname+'/../index.html','utf8').match(/const APP_VER = "(ver\d+)"/)||[])[1];
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function ottA(){ const g={}; const giorni=[]; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0) continue; if(wd===6){ g[d]='AN'; continue; } giorni.push(d); }
  giorni.forEach((d,i)=>{ if(i<8) g[d]='MAL'; }); const lav=giorni.slice(8); const per=101.5/lav.length; lav.forEach(d=>{ g[d]=String(per.toFixed(4)).replace('.',','); }); return g; }
function ottB(){ const g={}; const gg=[]; for(let d=1;d<=31;d++){ if(new Date(2026,9,d).getDay()!==0) gg.push(d); } gg.forEach((d,i)=>{ g[d]= i<26 ? '2,75' : '1' }); return g; }
function ottC(){ const g={}; for(let d=1;d<=31;d++){ if(new Date(2026,9,d).getDay()!==0) g[d]='3'; } g[12]='ASS.ING'; g[13]='1'; return g; }
function ottP(){ /* come il cedolino di una 15 h/sett.: 3 h lun-gio-ven per 21 giorni = 63 h */ const g={}; for(let d=1;d<=29;d++){ const wd=new Date(2026,9,d).getDay(); if(wd>=1&&wd<=5) g[d]='3'; } return g; }
const ST={ anni:[2026], dipendenti:[
  {id:'a',nome:'PROVA MALATTIA',oreSett:19,livello:'D2',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'15/09/2025'},
  {id:'b',nome:'PROVA SOTTO',oreSett:17,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'},
  {id:'c',nome:'PROVA INGIUST',oreSett:18,livello:'C1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'},
  {id:'e',nome:'PROVA CINQUE',oreSett:20,livello:'C1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',ana:{ggSettCosto:'5'}},
  {id:'p',nome:'PROVA QUINDICI',oreSett:15,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'},
  {id:'o',nome:'PROVA ORARIO',oreSett:15,livello:'D1',tipoContratto:'indeterminato',mensilizzato:false,dataAssunzione:'01/01/2020'}],
  dati:{'2026-10':{ a:{giorni:ottA()}, b:{giorni:ottB()}, c:{giorni:ottC()}, e:{giorni:{1:'4',2:'4'}}, p:{giorni:ottP()}, o:{giorni:ottP()} }, '2026-09':{ b:{giorni:{1:'3'}}, p:{giorni:{1:'3',2:'1'}} }}, costoComune:{} };
async function apri(br,url,w){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },ST); await pg.goto(url,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  await pg.locator('.tabs .tab').nth(9).click(); await pg.waitForTimeout(900); return {ctx,pg,E}; }
const card=(pg,nome)=>pg.evaluate((nome)=>{ const c=[...document.querySelectorAll('.emp-card')].find(c=>((c.querySelector('.emp-head .nome')||{}).innerText||'').indexOf(nome)!==-1); if(!c) return null;
  const pill=[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText).join(' | '); const b=c.querySelector('.ced-box'); const cg=c.querySelector('.cong');
  const teor=[...c.querySelectorAll('.teor-abs')].map(x=>x.innerText.trim()); return { pill, box:b?b.innerText.replace(/[ \t]+/g,' '):'', cong:cg?cg.innerText.replace(/\s+/g,' '):'', teor }; },nome);
/* ver184: dalla ver183 i pulsanti «conto per le paghe», «ord/extra», «paghe e LUL» e «mensilizz.» NON ci sono più
   (decisione di Christian), ma le funzioni restano nel file: se il pulsante manca e si indica la funzione, il PDF
   si genera chiamandola direttamente, così il controllo sul CONTENUTO resta quello di prima. */
async function pdf(pg,nomeBtn,mese,fn){ const btn=pg.getByRole('button',{name:nomeBtn,exact:true}); const nBtn=await btn.count(); if(!nBtn && !fn) return {esiste:false};
  let dl;
  if(nBtn){ await btn.first().click(); await pg.waitForTimeout(700); const sel=pg.locator('.modal select'); await sel.nth(0).selectOption(String(mese)); await sel.nth(1).selectOption('2026');
    const dlP=pg.waitForEvent('download',{timeout:30000}).catch(()=>null); await pg.getByRole('button',{name:/^Genera /}).first().click(); dl=await dlP; }
  else { const dlP=pg.waitForEvent('download',{timeout:30000}).catch(()=>null);
    await pg.evaluate(([fn,mese])=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const pr=[{y:2026,m:mese}]; if(fn==='LUL') esportaPDF(st,pr,{lul:true}); else window[fn](st,pr); },[fn,mese]); dl=await dlP; }
  if(!dl) return {esiste:!!nBtn,dl:null,senzaPulsante:!nBtn};
  const out=__dirname+'/out/'+mese+'-'+(dl.suggestedFilename()||'o.pdf'); await dl.saveAs(out); const pagine=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(out)))||[0,0])[1];
  const txt=sh('pdftotext -layout '+JSON.stringify(out)+' -'); return {esiste:!!nBtn,senzaPulsante:!nBtn,dl,out,pagine,txt,flat:txt.replace(/\s+/g,' '),nome:dl.suggestedFilename()}; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/dip/index.html');
  T('V1 targhetta '+APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(APPV)!==-1);
  const A=await card(pg,'MALATTIA');
  T('V2 ORE CORRETTE DA DARE 19 h → 85,50 (19/6 × 27)', /ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI: 85,500/.test(A.pill), A.pill);
  T('V3 ORE MESE resta 82,50 (stipendio fisso)', /ORE CONTRATTUALI: 82,500/.test(A.pill));
  T('V4 il numerino sotto la MAL vale 3,167 (19/6)', A.teor.length===8 && A.teor.every(x=>/3,167/.test(x)), A.teor.join(','));
  T('V5 Risultato del mese +41,333 = 101,5 + 25,333 − 85,5', /Risultato del mese: \+41,333/.test(A.cong));
  T('V6 la base mostrata è quella del conto: 85,500', /Base del mese: 85,500 h/.test(A.cong));
  T('V7 box: MAL 8 gg = 25,33 (come il cedolino vero di ottobre)', /altre assenze retribuite\s*25,333 h\s*MAL 8 gg/.test(A.box));
  T('V8 box: ordinarie 57,17 = 82,50 − 25,33 (il cedolino vero: Retribuzione 57,16672)', /ore lavorate ordinarie\s*57,167 h/.test(A.box));
  T('V9 box: supplementari +41,33', /ORE SUPPLEMENTARI \(Risultato del mese\)\s*\+41,333 h/.test(A.box));
  T('V10 box: festività non goduta il 4 = 3,17 (1 gg × 3,167)', /FESTIVITÀ NON GODUTE, a sé\s*3,167 h\s*1 gg × 3,167 h \(il 4\)/.test(A.box));
  T('V11 box: rendiconto 98,50 + 25,33 = 123,83', /ordinarie e supplementari 98,500 \+ ore retribuite erosive 25,333 = 123,833/.test(A.box));
  const B=await card(pg,'SOTTO');
  T('V12 B: 17 h → ore previste 76,50; Risultato −4,000', /ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI: 76,500/.test(B.pill) && /Risultato del mese: -4,000/.test(B.cong), B.pill);
  T('V13 B: niente riga «da trattenere», ordinarie = ORE MESE 73,82', !/da trattenere/.test(B.box) && /ore lavorate ordinarie\s*73,820 h/.test(B.box));
  T('V14 B: riga «ORE SOTTO L\'ORARIO, non trattenute 4,00»', /ORE SOTTO L'ORARIO, non trattenute\s*4,000 h/.test(B.box));
  T('V15 B: nel riquadro «da trattenere 0,000 · sotto l\'orario, non trattenute 4,000»', /da trattenere \(ASS\.ING \/ ASP 0h\): 0,000 h · sotto l'orario, non trattenute: 4,000 h/.test(B.cong));
  const C=await card(pg,'INGIUST'); console.log('---- box C ----\n'+C.box);
  T('V16 C: ASS.ING 1 gg → da trattenere 3,00, sotto l\'orario 2,00 (rese 76 su previste 81)', /di cui ore non fatte, da trattenere\s*3,000 h\s*solo assenze ingiustificate/.test(C.box) && /ORE SOTTO L'ORARIO, non trattenute\s*2,000 h/.test(C.box));
  T('V17 C: ordinarie = 78,16 − 3,00 = 75,16', /ore lavorate ordinarie\s*75,160 h/.test(C.box));
  const Ee=await card(pg,'CINQUE'); T('V18 5 giorni a settimana (ANAGRAFICA): quota 4 h × 22 giorni lun-ven = 88', /ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI: 88,000( |$)/.test(Ee.pill), Ee.pill);
  const Q=await card(pg,'QUINDICI'); console.log('---- box 15 h (come il cedolino di ottobre: 63 h su 21 giorni) ----\n'+Q.box);
  T('V19 15 h/sett., 63 h: previste 67,50, sotto l\'orario 4,50 NON trattenute, ordinarie 65,13 (stipendio intero)', /ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI: 67,500/.test(Q.pill) && /ORE SOTTO L'ORARIO, non trattenute\s*4,500 h/.test(Q.box) && /ore lavorate ordinarie\s*65,130 h/.test(Q.box) && !/da trattenere/.test(Q.box), Q.pill);
  const co=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; ['a','b','c','p','o'].forEach(id=>{ const dp=st.dipendenti.find(x=>x.id===id); const r=oreSuppPeriodo(st,dp,[{y:2026,m:10}],null,null,0).righe[0]; const s=oreSuppPeriodo(st,dp,[{y:2026,m:9}],null,null,0).righe[0]; o[id]={tratt:r.tratt,sotto:r.sotto,ordCed:r.ordCed,supp:r.supp, settTratt:s?s.tratt:null}; }); o.ced=cedOrePubblica(st); return o; });
  console.log('  motore: '+JSON.stringify(co));
  T('V20 cedOre per USOINT: A 98,50 · B 73,82 · C 75,16 · 15 h 65,13 (stipendio intero)', co.ced['2026-10'].a===98.5 && co.ced['2026-10'].b===73.82 && co.ced['2026-10'].c===75.16 && co.ced['2026-10'].p===65.13, JSON.stringify(co.ced));
  T('V21 trattenute del Costo orario: A 0 · B 0 · C 3 · 15 h 0', co.a.tratt===0 && co.b.tratt===0 && co.c.tratt===3 && co.p.tratt===0);
  T('V22 NON mensilizzato (criterio orario): le ore mancanti restano trattenute come prima (4,50)', co.o.tratt===4.5 && co.o.sotto===0, JSON.stringify(co.o));
  T('V23 settembre 2026 (prima della base mensile): trattenute come prima', co.p.settTratt>0, co.p.settTratt);
  const R=await pdf(pg,'🖨️ Report PDF A4 conto per le paghe',10,'esportaPDFConto');
  T('V24 dalla ver183 il pulsante «Report PDF A4 conto per le paghe» non c\'è più, ma la funzione genera ancora il PDF', R.senzaPulsante && !!R.dl, R.nome);
  if(R.dl){ console.log(R.txt.split('\n').filter(x=>x.trim()).map(x=>'    '+x.replace(/\s+/g,' ')).join('\n'));
    T('V25 nome file «Conto ore per le paghe» con versione e ora', new RegExp('Spazio Ireos Conto ore per le paghe - \\d{2}[a-z]{3}\\d{2} - '+APPV+' - \\d{2}\\.\\d{2}\\.pdf').test(R.nome), R.nome);   /* ver184: versione dal file (era «ver182» scritto a mano) */
    T('V26 titolo e sottotitolo (27 giorni, solo mensilizzati)', /Conto delle ore per le paghe · Ottobre 2026/.test(R.flat) && /27 giorni lavorativi \(da lunedì a sabato\)/.test(R.flat) && /solo dipendenti mensilizzati/.test(R.flat));
    T('V27 riga A: 19,00 82,50 85,50 - 25,33 60,17 101,50 +41,33 — — 3,17', /PROVA MALATTIA 19,00 82,50 85,50 - 25,33 60,17 101,50 \+41,33 — — 3,17/.test(R.flat));
    T('V28 riga B: sotto l\'orario 4,00, nessuna trattenuta', /PROVA SOTTO 17,00 73,82 76,50 — 76,50 72,50 — 4,00 —/.test(R.flat));
    T('V29 riga C: sotto 2,00 e da trattenere 3,00', /PROVA INGIUST 18,00 78,16 81,00 — 81,00 76,00 — 2,00 3,00/.test(R.flat));
    T('V30 riga 15 h: 65,13 67,50 — 67,50 63,00 — 4,50 —', /PROVA QUINDICI 15,00 65,13 67,50 — 67,50 63,00 — 4,50 —/.test(R.flat));
    T('V31 chi non è mensilizzato non c\'è', !/PROVA ORARIO/.test(R.flat));
    T('V32 riga TOTALE e legenda «Come si legge» per intero', /TOTALE /.test(R.flat) && R.flat.indexOf("Come si legge: lo stipendio fisso si paga sempre intero (mensilizzazione).")!==-1 && /si trattengono solo le assenze ingiustificate \(ASS\.ING\) e le aspettative non pagate \(ASP 0h\)\. Le festività non godute si pagano a parte\./.test(R.flat));
    T('V33 nessun carattere sbagliato (il «−» di jsPDF esce come «"»)', !/"/.test(R.txt));
    T('V34 una pagina sola', R.pagine===1, R.pagine);
    sh('pdftoppm -r 80 -png "'+R.out+'" '+__dirname+'/out/conto'); }
  const S=await pdf(pg,'🖨️ Report PDF A4 conto per le paghe',9,'esportaPDFConto'); T('V35 settembre: nessun mensilizzato → lo dice', S.dl && /nessun dipendente mensilizzato \(la base mensile parte da ottobre 2026\)/.test(S.flat), S.flat&&S.flat.slice(0,160));
  const O=await pdf(pg,'🖨️ Report PDF A4 ord/extra',10,'esportaPDFOrdExtra'); T('V36 ord/extra: «19,00 h settimanali ÷ 6 giorni = 3,17 h al giorno»', O.dl && /19,00 h settimanali ÷ 6 giorni = 3,17 h al giorno/.test(O.flat));
  const L=await pdf(pg,'🖨️ Report PDF A4 paghe e LUL',10,'LUL'); T('V37 paghe e LUL: MAL 25,33 e riga «ORE SOTTO L\'ORARIO, non trattenute 4,00»', L.dl && /altre assenze retribuite 25,33 h/.test(L.flat) && /ORE SOTTO L'ORARIO, non trattenute 4,00 h/.test(L.flat));
  const M=await pdf(pg,'🖨️ Report PDF A4 mensilizz.',10,'esportaPDFMens'); T('V38 report mensilizz. si genera ancora', M.dl && /SUPPLEMENTARE/.test(M.flat));
  const H=await pdf(pg,'🖨️ Report PDF A4',10); T('V39 Report storico si genera ancora', H.dl && /Report Ore/.test(H.flat));
  T('V40 zero errori di pagina', E.length===0, E.join('|')||'nessuno');
  await ctx.close();
  const v=await apri(br,'http://127.0.0.1:8300/ver181/index.html'); const A0=await card(v.pg,'MALATTIA');
  T('V41 ver181 congelata: 85,67 e +41,215 (la quota era 82,50/26)', /ORE CORRETTE DA DARE: 85,67/.test(A0.pill) && /Risultato del mese: \+41,215/.test(A0.cong), A0.pill);
  T('V42 ver181 congelata: nessun pulsante «conto per le paghe»', !(await v.pg.getByRole('button',{name:'🖨️ Report PDF A4 conto per le paghe',exact:true}).count()));
  await v.ctx.close();
  for (const w of [390,1280]){ const m=await apri(br,'http://127.0.0.1:8300/dip/index.html',w); const sw=await m.pg.evaluate(()=>document.documentElement.scrollWidth);
    const fz=await m.pg.evaluate(()=>{ let p=0; document.querySelectorAll('.ced-box *, .cong *').forEach(n=>{ if([...n.childNodes].some(x=>x.nodeType===3&&x.textContent.trim()) && parseFloat(getComputedStyle(n).fontSize)<12.5) p++; }); return p; });
    T('V43 '+w+'px: nessuno scorrimento laterale, zero scritte sotto 12,5px nel box e nel riquadro', sw===w && fz===0, sw+' / '+fz);
    if(w===1280){ const b=m.pg.locator('.emp-card .ced-box').nth(2); await b.scrollIntoViewIfNeeded(); await b.screenshot({path:__dirname+'/out/box-1280.png'}); }
    await m.ctx.close(); }
  console.log('\n=== ver182: superati='+P+' falliti='+F+' ==='); await br.close(); process.exit(F?1:0); })().catch(e=>{console.error(e);process.exit(2)});
