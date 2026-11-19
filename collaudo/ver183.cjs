/* Collaudo ver183 (dati INVENTATI). Prima: bash collaudo/prepara-banco.sh ver182. Poi: node collaudo/ver183.cjs */
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
async function pdf(pg,nomeBtn,mese){ const btn=pg.getByRole('button',{name:nomeBtn,exact:true}); if(!(await btn.count())) return {esiste:false};
  await btn.first().click(); await pg.waitForTimeout(700); const sel=pg.locator('.modal select'); await sel.nth(0).selectOption(String(mese)); await sel.nth(1).selectOption('2026');
  const dlP=pg.waitForEvent('download',{timeout:30000}).catch(()=>null); await pg.getByRole('button',{name:/^Genera /}).first().click(); const dl=await dlP; if(!dl) return {esiste:true,dl:null};
  const out=__dirname+'/out/'+mese+'-'+(dl.suggestedFilename()||'o.pdf'); await dl.saveAs(out); const pagine=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(out)))||[0,0])[1];
  const txt=sh('pdftotext -layout '+JSON.stringify(out)+' -'); return {esiste:true,dl,out,pagine,txt,flat:txt.replace(/\s+/g,' '),nome:dl.suggestedFilename()}; }

const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/dip/index.html');
  T('P1 targhetta '+APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(APPV)!==-1);
  const btn=await pg.evaluate(()=>[...document.querySelectorAll('button')].map(b=>b.innerText.trim()).filter(t=>/Report PDF A4/.test(t)));
  T('P2 restano solo due report: «🖨️ Report PDF A4» e «🖨️ Report PDF A4 per le paghe»', btn.length===2 && btn.indexOf('🖨️ Report PDF A4')!==-1 && btn.indexOf('🖨️ Report PDF A4 per le paghe')!==-1, btn.join(' | '));
  const eng=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const r=oreSuppPeriodo(st,dp,[{y:2026,m:10}],null,null,0).righe[0]; if(r) o[dp.nome]={ord:R2(r.ordCed,2),supp:R2(r.supp,2),ret:R2(r.ass+r.fest,2),tr:R2(r.tratt,2),monte:R2(r.monteP,2),ced:cedOrePubblica(st)['2026-10'][dp.id]}; }); return o; });
  const R=await pdf(pg,'🖨️ Report PDF A4 per le paghe',10);
  T('P3 il report per le paghe si genera (ottobre)', R.dl, R.nome);
  T('P4 nome del file secondo la convenzione', /^Spazio Ireos Ore da riportare a cedolino - \d{2}[a-z]{3}\d{2} - ver183 - \d{2}\.\d{2}\.pdf$/.test(R.nome||''), R.nome);
  const pagine=(R.txt||'').split('\f').filter(p=>p.trim());
  const mens=['PROVA MALATTIA','PROVA SOTTO','PROVA INGIUST','PROVA CINQUE','PROVA QUINDICI'];
  T('P5 un foglio per ogni mensilizzato con dati (5), uno per pagina; il non mensilizzato non c\'è', R.pagine===5 && !/PROVA ORARIO/.test(R.flat), R.pagine);
  mens.forEach(n=>{ const p=pagine.find(x=>x.indexOf(n)!==-1)||''; const f=p.replace(/\s+/g,' ');
    const m=/TOTALE ([\d.,]+)(?: \*)? ([\d.,]+) ([\d.,]+) ([\d.,]+)/.exec(f); const e=eng[n];
    const ok=m && Math.abs(num(m[1])-e.ord)<0.005 && Math.abs(num(m[2])-e.supp)<0.005 && Math.abs(num(m[3])-e.ret)<0.005 && Math.abs(num(m[4])-e.tr)<0.005;
    T('P6 '+n+': TOTALE = voci del cedolino (ordinarie '+e.ord+' · suppl. '+e.supp+' · retribuite '+e.ret+' · trattenute '+e.tr+')', ok, m&&m.slice(1).join(' / '));
    const mm=/ORE MESE \(stipendio fisso\): ([\d.,]+) h = ordinarie ([\d.,]+) \+ assenze retribuite ([\d.,]+) \+ da trattenere ([\d.,]+)/.exec(f);
    T('P7 '+n+': ORE MESE '+e.monte+' = ordinarie + assenze retribuite + da trattenere', mm && Math.abs(num(mm[1])-e.monte)<0.005 && Math.abs(num(mm[2])+num(mm[3])+num(mm[4])-e.monte)<0.011, mm&&mm.slice(1).join(' / '));
    T('P8 '+n+': ordinarie + supplementari = ore a cedolino che legge USOINT ('+e.ced+')', Math.abs(e.ord+e.supp-e.ced)<0.011);
  });
  const pA=(pagine.find(x=>x.indexOf('PROVA MALATTIA')!==-1)||'');
  T('P9 MALATTIA: 8 giorni «MAL 3,17» (25,33 al centesimo) e le domeniche «R»', (pA.match(/MAL 3,1[67]/g)||[]).length===8 && /\d+ dom +R/.test(pA));
  const pC=(pagine.find(x=>x.indexOf('PROVA INGIUST')!==-1)||'');
  T('P10 INGIUST: il 12 «ASS.ING 3,00» fra le non retribuite e «DA TRATTENERE: 3,00»', /12 lun.*ASS\.ING 3,00/.test(pC) && /DA TRATTENERE: 3,00 h/.test(pC.replace(/\s+/g,' ')));
  const pQ=(pagine.find(x=>x.indexOf('PROVA QUINDICI')!==-1)||'').replace(/\s+/g,' ');
  T('P11 QUINDICI (63 h lavorate, stipendio intero): ordinarie a cedolino 65,13, niente da trattenere', /TOTALE 65,13 0,00 [\d,]+ 0,00/.test(pQ) && /DA TRATTENERE: nessuna/.test(pQ), pQ.slice(pQ.indexOf('TOTALE'),pQ.indexOf('TOTALE')+40));
  const pB=(pagine.find(x=>x.indexOf('PROVA SOTTO')!==-1)||'');
  const supB=eng['PROVA SOTTO'].supp; T('P12 SOTTO: nessuna supplementare scritta nei giorni (Risultato negativo)', supB===0 && /SUPPLEMENTARI da pagare: nessuna/.test(pB.replace(/\s+/g,' ')));
  const S=await pdf(pg,'🖨️ Report PDF A4 per le paghe',9);
  T('P13 settembre (prima della base mensile): lo dice, nessun foglio', S.dl && /Nessun dipendente mensilizzato/.test(S.flat), S.flat&&S.flat.slice(0,120));
  const H=await pdf(pg,'🖨️ Report PDF A4',10); T('P14 il Report PDF A4 delle ore pure si genera ancora', H.dl && /Report Ore/.test(H.flat));
  if(R.out) sh('pdftoppm -r 70 -png -f 1 -l 1 '+JSON.stringify(R.out)+' '+JSON.stringify(__dirname+'/out/ver183-p1'));
  T('P15 zero errori di pagina', E.length===0, E.join(' | '));
  console.log('\nver183: '+P+' superati, '+F+' falliti'); await br.close(); })();
