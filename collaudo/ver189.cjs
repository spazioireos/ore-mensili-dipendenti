/* Collaudo ver189/ver190/ver191 (dati INVENTATI): «🖨️ Report PDF A4 per le paghe» a tre per pagina, A4 orizzontale, senza legende,
   righe in ORE,MINUTI e TOTALE in centesimi (Christian, 20/11/2026: «nei report le ore vanno in sessantesimi»).
   Rifà sul formato nuovo i controlli numerici di ver183 (P6, P8, P9, P10, P11), che leggevano il formato vecchio.
   Prima: bash collaudo/prepara-banco.sh ver188. Poi: node collaudo/ver189.cjs */
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
  dati:{'2026-10':{ a:{giorni:ottA()}, b:{giorni:ottB()}, c:{giorni:ottC()}, e:{giorni:{1:'4',2:'4'}}, p:{giorni:ottP()}, o:{giorni:ottP(), permessi:{6:{ore:1.5,tipo:'EXF'}}} }, '2026-09':{ b:{giorni:{1:'3'}}, p:{giorni:{1:'3',2:'1'}} }}, costoComune:{} };
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
  const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/dip/index.html');
  T('Q1 targhetta '+APPV, (await pg.locator('.app-rev').first().innerText()).indexOf(APPV)!==-1);
  const eng=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const r=oreSuppPeriodo(st,dp,[{y:2026,m:10}],null,null,0).righe[0]; if(r) o[dp.nome]={ord:R2(r.ordCed,2),supp:R2(r.supp,2),ret:R2(r.ass+r.fest,2),tr:R2(r.tratt,2),ced:cedOrePubblica(st)['2026-10'][dp.id]}; }); return o; });
  const R=await pdf(pg,'🖨️ Report PDF A4 per le paghe',10);
  T('Q2 il report per le paghe si genera, nome invariato', R.dl && new RegExp('^Spazio Ireos Ore da riportare a cedolino - \\d{2}[a-z]{3}\\d{2} - '+APPV+' - \\d{2}\\.\\d{2}\\.pdf$').test(R.nome||''), R.nome);
  const info=sh('pdfinfo '+JSON.stringify(R.out)); const larg=/Page size:\s+([\d.]+) x ([\d.]+)/.exec(info);
  T('Q3 A4 orizzontale, 5 mensilizzati su 2 pagine (3 + 2), il non mensilizzato non c\'è', larg && +larg[1]>+larg[2] && R.pagine===2 && !/PROVA ORARIO/.test(R.flat), (larg?larg[1]+'x'+larg[2]:'?')+' · pagine '+R.pagine);
  const mens=['PROVA CINQUE','PROVA INGIUST','PROVA MALATTIA','PROVA QUINDICI','PROVA SOTTO'];
  const pag=(R.txt||'').split('\f').filter(p=>p.trim());
  T('Q4 in ogni pagina tre persone (l\'ultima due), solo nominativo e mese in testa', pag.length===2 && mens.slice(0,3).every(n=>pag[0].indexOf(n)!==-1) && mens.slice(3).every(n=>pag[1].indexOf(n)!==-1) && (pag[0].match(/Ottobre 2026/g)||[]).length===3, pag.map(p=>(p.match(/PROVA \w+/g)||[]).join(',')).join(' / '));
  T('Q5 nessuna legenda, nessun riquadro «DA INSERIRE A CEDOLINO», nessun † o *', !/DA INSERIRE|ORE CONTRATTUALI|legenda|minuti|†|\*/i.test(R.txt), (R.txt.match(/DA INSERIRE|ORE CONTRATTUALI|†|\*/g)||[]).join(','));
  T('Q6 nessun numero a tre decimali (le ore non sono più in millesimi)', !/\d,\d{3}\b/.test(R.txt), (R.txt.match(/\d+,\d{3}\b/g)||[]).slice(0,5).join(' '));
  /* le tabelle sono affiancate: si legge il testo per colonne ritagliando ogni terzo della pagina */
  const W=+larg[1], H=+larg[2]; const col=(p,k)=>sh('pdftotext -layout -f '+p+' -l '+p+' -x '+Math.round(k*W/3*96/72)+' -y 0 -W '+Math.round(W/3*96/72)+' -H '+Math.round(H*96/72)+' -r 96 '+JSON.stringify(R.out)+' -');
  const blocchi={}; mens.forEach((n,i)=>{ blocchi[n]=col(1+Math.floor(i/3), i%3); });
  mens.forEach(n=>{ const b=blocchi[n]; const f=b.replace(/\s+/g,' '); const e=eng[n];
    /* ver191: il TOTALE è «centesimi (ore,minuti)»; nella colonna stretta delle ordinarie va su due righe, quindi la riga
       del piede si legge dalle ultime righe del blocco: «86,84» / «TOTALE 0,00 (0,00) …» / «(86,50)» */
    const piede=b.split('\n').map(x=>x.trim()).filter(Boolean); const iT=piede.findIndex(x=>/^TOTALE/.test(x)); const zona=piede.slice(Math.max(0,iT-1)).join(' ');
    const cent=(zona.match(/(?<![(\d,])\d[\d.]*,\d{2}(?!\))/g)||[]).map(num); const sess=(zona.match(/\((\d+,\d{2})\)/g)||[]).map(x=>x.slice(1,-1));
    const m=cent.length===4 && sess.length===4 ? [null].concat(cent) : null;
    const coppie=m ? [[cent[0],sess[3]],[cent[1],sess[0]],[cent[2],sess[1]],[cent[3],sess[2]]] : [];
    T('Q7 '+n+': TOTALE in centesimi = voci del cedolino (ord. '+e.ord+' · suppl. '+e.supp+' · retr. '+e.ret+' · tratt. '+e.tr+')', m && Math.abs(cent[0]-e.ord)<0.006 && Math.abs(cent[1]-e.supp)<0.006 && Math.abs(cent[2]-e.ret)<0.006 && Math.abs(cent[3]-e.tr)<0.006, zona);
    T('Q7b '+n+': fra parentesi lo stesso totale in ore,minuti (ver191)', m && coppie.every(c=>Math.abs(hm(c[1])-c[0])<=1/60+0.006), coppie.map(c=>c[0]+' ('+c[1]+')').join(' · '));
    const righe=b.split('\n').filter(r=>/^\s*\d{1,2} (lun|mar|mer|gio|ven|sab|dom)/.test(r));
    let ord=0, okmin=true; righe.forEach(r=>{ const t=r.replace(/^\s*\d{1,2} \w{3}\s+/,'').trim().split(/\s{2,}/); const v=t[0]; if(/^\d+,\d{2}$/.test(v)){ const mm=+v.split(',')[1]; if(mm>59) okmin=false; ord+=hm(v); } });
    T('Q8 '+n+': righe in ORE,MINUTI (minuti fra 00 e 59) e la loro somma torna al totale delle ordinarie (± 1 minuto per riga)', okmin && m && Math.abs(ord-e.ord)*60 <= righe.length+1, righe.length+' righe, somma '+ord.toFixed(3)+' h contro '+e.ord);
    T('Q9 '+n+': ordinarie + supplementari = ore a cedolino che legge USOINT ('+e.ced+')', Math.abs(e.ord+e.supp-e.ced)<0.011);
  });
  T('Q10 MALATTIA: 8 giorni «MAL 3,10» (3 h 10 min = 3,1731 h), le domeniche «R»', (blocchi['PROVA MALATTIA'].match(/MAL 3,10/g)||[]).length===8 && /dom\s+R/.test(blocchi['PROVA MALATTIA']), (blocchi['PROVA MALATTIA'].match(/MAL \d+,\d+/g)||[]).slice(0,3).join(' '));
  T('Q11 INGIUST: il 12 «ASS.ING 3,00» fra le non retribuite', /12 lun.*ASS\.ING 3,00/.test(blocchi['PROVA INGIUST']));
  { const z=blocchi['PROVA QUINDICI'].replace(/\s+/g,' '); T('Q12 QUINDICI (63 h lavorate, stipendio intero): TOTALE ordinarie 65,13 (65,08), niente da trattenere', /65,13 TOTALE 0,00 \(0,00\) [\d,]+ \([\d,]+\) 0,00 \(0,00\) \(65,08\)/.test(z), z.slice(-80)); }
  const S=await pdf(pg,'🖨️ Report PDF A4 per le paghe',9);
  T('Q13 settembre (prima della base mensile): lo dice, nessun foglio', S.dl && /Nessun dipendente mensilizzato/.test(S.flat));
  const H2=await pdf(pg,'🖨️ Report PDF A4',10); T('Q14 il Report PDF A4 storico si genera ancora, ore in ore,minuti', H2.dl && /Report Ore/.test(H2.flat) && /\b\d+,[0-5]\d\b/.test(H2.flat));
  { const tt=/TOT ORE RESE([^\n]*)/.exec(H2.txt); T('Q17 Report storico: TOT ORE RESE in centesimi con le ore,minuti fra parentesi (ver191: 101,50 (101,30))', tt && /101,50 \(101,30\)/.test(tt[1]) && /72,50 \(72,30\)/.test(tt[1]), tt&&tt[1].trim().slice(0,90)); }
  T('Q16 Report storico: il permesso di 1,5 h si scrive «Aggiungere 1,30 ore» (ver190: ore,minuti anche in calce)', /Aggiungere 1,30 ore di permesso \(EXF\)/.test(H2.flat) && !/Aggiungere 1,50/.test(H2.flat), (H2.flat.match(/Aggiungere [\d,]+ ore[^)]*\)/)||[''])[0]);
  if(R.out) sh('pdftoppm -r 80 -png -f 1 -l 1 '+JSON.stringify(R.out)+' '+JSON.stringify(__dirname+'/out/ver189-p1'));
  T('Q15 zero errori di pagina', E.length===0, E.join(' | '));
  console.log('\nver189: '+P+' superati, '+F+' falliti'); await br.close(); })();
