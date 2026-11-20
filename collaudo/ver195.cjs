/* Collaudo ver195 (dati INVENTATI): nel «🖨️ Report PDF A4 per le paghe» le ore ordinarie che il cedolino paga in più delle
   lavorate NON vanno mai sui giorni AN (Christian, 20/11/2026: «AN = giorno lavorativo a 0 ore» → «Mai su AN»): prima sui
   giorni vuoti dell'orario, poi in proporzione sui giorni lavorati. Confronto con la ver194 congelata (.banco/ver194).
   Prima: python3 collaudo/rigenera.py ver194. Poi: node collaudo/ver195.cjs */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const fs=require('fs'), cp=require('child_process'); const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
const APPV=(fs.readFileSync(__dirname+'/../index.html','utf8').match(/const APP_VER = "(ver\d+)"/)||[])[1];
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function ottA(){ const g={}; const giorni=[]; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0) continue; if(wd===6){ g[d]='AN'; continue; } giorni.push(d); }
  giorni.forEach((d,i)=>{ if(i<8) g[d]='MAL'; }); const lav=giorni.slice(8); const per=101.5/lav.length; lav.forEach(d=>{ g[d]=String(per.toFixed(4)).replace('.',','); }); return g; }
function ottB(){ const g={}; const gg=[]; for(let d=1;d<=31;d++){ if(new Date(2026,9,d).getDay()!==0) gg.push(d); } gg.forEach((d,i)=>{ g[d]= i<26 ? '2,75' : '1' }); return g; }
function ottC(){ const g={}; for(let d=1;d<=31;d++){ if(new Date(2026,9,d).getDay()!==0) g[d]='3'; } g[12]='ASS.ING'; g[13]='1'; return g; }
function ottP(){ /* come il cedolino di una 15 h/sett.: 3 h lun-gio-ven per 21 giorni = 63 h */ const g={}; for(let d=1;d<=29;d++){ const wd=new Date(2026,9,d).getDay(); if(wd>=1&&wd<=5) g[d]='3'; } return g; }
function ottN(){ /* 19 h/sett su 6 giorni, lun-ven 3 h, sabati AN: 69 h lavorate contro 82,50 di ORE MENSILI */ const g={}; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0) continue; g[d]= wd===6 ? 'AN' : '3'; } return g; }
function ottV(){ /* come ottN, ma due martedì lasciati vuoti */ const g=ottN(); delete g[6]; delete g[13]; return g; }
const ST={ anni:[2026], dipendenti:[
  {id:'n',nome:'PROVA SABATI',oreSett:19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'},
  {id:'v',nome:'PROVA VUOTI',oreSett:19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'}],
  dati:{'2026-10':{ n:{giorni:ottN()}, v:{giorni:ottV()} }}, costoComune:{} };
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
  const out=__dirname+'/out/'+mese+'-'+(dl.suggestedFilename()||'o.pdf'); await dl.saveAs(out); const pagine=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(out)))||[0,0])[1];
  const txt=sh('pdftotext -layout '+JSON.stringify(out)+' -'); return {esiste:true,dl,out,pagine,txt,flat:txt.replace(/\s+/g,' '),nome:dl.suggestedFilename()}; }


const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
const hm=s=>{ const m=/^(-?)(\d+),(\d{2})$/.exec(s); if(!m) return NaN; return (m[1]?-1:1)*(+m[2]+(+m[3])/60); };
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const prova=async(ver)=>{ const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/'+ver+'/index.html');
    const eng=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const r=oreSuppPeriodo(st,dp,[{y:2026,m:10}],null,null,0).righe[0]; o[dp.nome]=R2(r.ordCed,2); }); return o; });
    const R=await pdf(pg,'🖨️ Report PDF A4 per le paghe',10); await ctx.close(); return {R,eng,E}; };
  const leggi=(pagina)=>{ const righe=pagina.split('\n').filter(r=>/^\s*\d{1,2} (lun|mar|mer|gio|ven|sab|dom)/.test(r));
    return righe.map(r=>{ const m=/^\s*(\d{1,2}) (\w{3})(\s+AN\b)?(?:\s+(\d+,\d{2}))?/.exec(r); return {d:+m[1], wd:m[2], an:!!m[3], v:m[4]?hm(m[4]):0}; }); };
  const A=await prova('ver194'), B=await prova('dip');
  const pagA=A.R.txt.split('\f').filter(p=>p.trim()), pagB=B.R.txt.split('\f').filter(p=>p.trim());
  const nA=leggi(pagA[0]), nB=leggi(pagB[0]), vB=leggi(pagB[1]);
  T('V01 ver194 congelata: PROVA SABATI aveva ore ordinarie sui sabati AN (il difetto)', nA.filter(x=>x.an && x.v>0).length===5, nA.filter(x=>x.an).map(x=>x.d+':'+x.v.toFixed(2)).join(' '));
  T('V02 ver195: PROVA SABATI non ha ore su nessun giorno AN', nB.filter(x=>x.an).length===5 && nB.filter(x=>x.an && x.v>0).length===0, nB.filter(x=>x.an).map(x=>x.d+':'+x.v.toFixed(2)).join(' '));
  const sB=nB.reduce((a,x)=>a+x.v,0);
  T('V03 ver195: la differenza va sui giorni lavorati e il totale delle ordinarie resta quello del cedolino ('+B.eng['PROVA SABATI']+')', Math.abs(sB-B.eng['PROVA SABATI'])*60<=nB.length+1 && nB.filter(x=>!x.an && x.v>3.001).length>0, sB.toFixed(3));
  T('V04 ver195: PROVA VUOTI — la differenza va prima sui due martedì vuoti (6 e 13), i sabati AN restano vuoti', vB.filter(x=>x.an && x.v>0).length===0 && [6,13].every(d=>(vB.find(x=>x.d===d)||{}).v>0), vB.filter(x=>x.d===6||x.d===13||x.an).map(x=>x.d+':'+x.v.toFixed(2)).join(' '));
  const tot=(p)=>((p.match(/TOTALE[^\n]*/)||[''])[0]).replace(/\s+/g,' ');
  T('V05 i TOTALI sono identici alla ver194 (nessun numero cambia)', tot(pagA[0])===tot(pagB[0]) && tot(pagA[1])===tot(pagB[1]), tot(pagB[0]));
  T('V06 zero errori di pagina', A.E.length===0 && B.E.length===0, A.E.concat(B.E).join(' | '));
  console.log('\nver195: '+P+' superati, '+F+' falliti'); await br.close(); })();
