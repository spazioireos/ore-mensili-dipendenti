/* Collaudo ver208 (dati INVENTATI): «🖨️ Report PDF A4 per le paghe».
   Christian, 22/11/2026: «30 resta 3,00 e i 2 minuti vanno su una riga a parte in testa al foglio … Ogni giorno mostra quello
   che hai scritto e il totale torna con B», «per le supplementari rispetta per quanto possibile il mio inserimento a tabellone …
   se c'è un surplus rispetto al dovuto mensile, questo stia in colonna supplementari» e «2 per pagina, parole per intero».
   Confronto con la ver207 congelata. Prima: python3 collaudo/rigenera.py ver207. Poi: node collaudo/ver208.cjs [cartella-png] */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const fs=require('fs'), cp=require('child_process'); const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
const PNG=process.argv[2]||'';
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
/* novembre 2026: 25 giorni non domenicali; il 30 è lunedì */
function nov3(){ const g={}; for(let d=1;d<=30;d++){ if(new Date(2026,10,d).getDay()!==0) g[d]='3'; } return g; }
function novMal(){ const g=nov3(); g[10]='MAL'; g[11]='MAL'; g[20]='4,5'; return g; }
function novPoche(){ const g={}; for(let d=1;d<=30;d++){ const wd=new Date(2026,10,d).getDay(); if(wd>=1&&wd<=5) g[d]='3'; } return g; }   /* 63 h a 15 h/sett: sotto B */
function ott(fn){ const g={}; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); const v=fn(d,wd); if(v!=null) g[d]=v; } return g; }
function ottSei(){ const g={}; const lav=[]; for(let d=1;d<=31;d++){ const wd=new Date(2026,9,d).getDay(); if(wd===0) continue; if(wd===6){ g[d]='AN'; continue; } lav.push(d); }
  lav.forEach((d,i)=>{ g[d]= i<8 ? 'MAL' : (i%2 ? '5,25' : '4,75'); }); g[lav[lav.length-1]]='5'; return g; }
function ottCinque(){ const g=ott((d,wd)=>(wd>=1&&wd<=5)?'3,25':null); g[5]='FERIE'; g[6]='FERIE'; g[7]='MAL'; g[8]='MAL'; g[9]='MAL'; g[12]='ASS.ING'; g[13]='3'; return g; }
const dp=(id,nome,ore)=>({id,nome,oreSett:ore,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020'});
const ST={ anni:[2026], dipendenti:[dp('a','PROVA QUINDICI',15), dp('b','PROVA DICIANNOVE',19), dp('c','PROVA MALATTIA',15), dp('d','PROVA POCHE',15),
  Object.assign(dp('e','PROVA SEI',19),{livello:'D2'}), Object.assign(dp('f','PROVA CINQUE',19),{ana:{ggSettCosto:'5'}}), dp('g','PROVA COMPENSA',18), dp('h','PROVA SOTTO',15)],
  dati:{'2026-10':{ e:{giorni:ottSei()}, f:{giorni:ottCinque(), permessi:{13:{ore:1.25,tipo:'EXF'}}}, g:{giorni:Object.assign(ott((d,wd)=>wd!==0?'3':null),{12:'ASS.ING',13:'6'})}, h:{giorni:ott((d,wd)=>(wd>=1&&wd<=5)?'3':null)} },
  '2026-11':{ a:{giorni:nov3()}, b:{giorni:nov3()}, c:{giorni:novMal()}, d:{giorni:novPoche()} }}, costoComune:{} };
async function apri(br,url){ const ctx=await br.newContext({viewport:{width:1500,height:1100},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },ST); await pg.goto(url,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  return {ctx,pg,E}; }
async function pdf(pg,mese,tag){ const btn=pg.getByRole('button',{name:'🖨️ Report PDF A4 per le paghe',exact:true});
  await btn.first().click(); await pg.waitForTimeout(700); const sel=pg.locator('.modal select'); await sel.nth(0).selectOption(String(mese)); await sel.nth(1).selectOption('2026');
  const dlP=pg.waitForEvent('download',{timeout:30000}).catch(()=>null); await pg.getByRole('button',{name:/^Genera /}).first().click(); const dl=await dlP; if(!dl) return null;
  const out=__dirname+'/out/'+tag+'-'+mese+'.pdf'; await dl.saveAs(out); const pagine=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(out)))||[0,0])[1];
  const meta=(n,x)=>sh('pdftotext -layout -f '+n+' -l '+n+' -x '+x+' -y 0 -W 421 -H 595 '+JSON.stringify(out)+' -');   /* mezza pagina (punti) */
  return {out,pagine,meta,tutto:sh('pdftotext -layout '+JSON.stringify(out)+' -')}; }
const hm=s=>{ const m=/^(-?)(\d+),(\d{2})$/.exec(s); if(!m) return NaN; return (m[1]?-1:1)*(+m[2]+(+m[3])/60); };
const giorni=(t)=>t.split('\n').filter(r=>/^\s*\d{1,2} (lun|mar|mer|gio|ven|sab|dom)/.test(r)).map(r=>{ const m=/^\s*(\d{1,2}) (\w{3})\s*(.*)$/.exec(r);
  const hh=[...m[3].matchAll(/(\d+,\d{2}) \(/g)].map(x=>hm(x[1])); return {d:+m[1], riga:m[3], hh}; });
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  /* ver207 congelata: una persona per pagina, il 30 a 2,58 */
  { const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/ver207/index.html'); const R=await pdf(pg,11,'v207');
    const p1=R.tutto.split('\f').find(p=>p.indexOf('PROVA QUINDICI')!==-1)||''; const r30=(p1.split('\n').find(r=>/^\s*30 lun/.test(r))||'');
    T('V01 ver207 congelata: il 30 novembre di PROVA QUINDICI esce 2,58 invece di 3,00 (il difetto)', /2,58 \(2 h e 58 min\)/.test(r30), r30.trim().slice(0,60));
    T('V02 ver207 congelata: una persona per pagina (4 persone → 4 pagine)', R.pagine===4, R.pagine); await ctx.close(); }
  const {ctx,pg,E}=await apri(br,'http://127.0.0.1:8300/dip/index.html');
  const eng=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const T=tsMese(st,dp,2026,11); if(!T) return; const r=T.riga;
    o[dp.nome]={ ordC:T.ordC, supp:T.supp, monte:T.monte, rese:r.rese, ass:T.assTot, trattNL:T.trattNL }; }); return o; });
  const R=await pdf(pg,11,'v208');
  T('V03 due persone per pagina: 4 persone → 2 pagine A4 orizzontali', R.pagine===2, R.pagine);
  const metà=[R.meta(1,0),R.meta(1,421),R.meta(2,0),R.meta(2,421)];
  const nomi=['PROVA DICIANNOVE','PROVA MALATTIA','PROVA POCHE','PROVA QUINDICI'];   /* ordine alfabetico */
  T('V04 a sinistra e a destra le persone giuste, nell\'ordine', nomi.every((n,i)=>metà[i].indexOf(n)!==-1), metà.map(t=>(t.match(/PROVA \w+/)||['?'])[0]).join(' · '));
  T('V05 ogni metà ha la sua tabella dei giorni e il suo schema del cedolino', metà.every(t=>/TOTALE/.test(t) && /SCHEMA DEL CEDOLINO/.test(t) && giorni(t).length===30), metà.map(t=>giorni(t).length).join(','));
  T('V06 le parole restano per intero in ogni cella («3,00 (3 h)»)', metà.every(t=>/3,00 \(3 h\)/.test(t)));
  const Q=metà[3], gQ=giorni(Q), r30=gQ.find(x=>x.d===30);
  T('V07 PROVA QUINDICI: il 30 novembre resta 3,00', r30 && /^3,00 \(3 h\)/.test(r30.riga.trim()), r30 && r30.riga.trim().slice(0,40));
  T('V08 PROVA QUINDICI: in testa «arrotondamento delle ore mensili: -2 min»', /arrotondamento delle ore mensili: -2 min/.test(Q), (Q.match(/arrotondamento[^\n]*/)||['—'])[0]);
  T('V09 PROVA QUINDICI: ogni giorno ordinarie + supplementari = le ore scritte (3,00)', gQ.filter(x=>x.hh.length).every(x=>Math.abs(x.hh.reduce((a,b)=>a+b,0)-3)<0.01) && gQ.filter(x=>x.hh.length).length===25);
  const e=eng['PROVA QUINDICI'];
  T('V10 PROVA QUINDICI: TOTALE ordinarie = ordinarie a cedolino (B, 65,13), supplementari = surplus sulle ore mensili', /65,13 \(65,08 = 65 h e/.test((Q.split('\n').filter(r=>/TOTALE/.test(r))[0]||'')+' '+Q.split('\n')[Q.split('\n').findIndex(r=>/TOTALE/.test(r))-1]) && Math.abs(e.ordC-e.monte)<0.001 && Math.abs(e.supp-(e.rese+e.ass-e.monte))<0.09, 'ordC '+e.ordC.toFixed(3)+' · B '+e.monte.toFixed(3)+' · supp '+e.supp.toFixed(3)+' · rese '+e.rese);
  const Dn=metà[0];
  T('V11 PROVA DICIANNOVE (B 82,50 tondo): nessuna riga di arrotondamento', !/arrotondamento/.test(Dn) && !/differenza fra i giorni/.test(Dn));
  const gD=giorni(Dn); T('V12 PROVA DICIANNOVE: ogni giorno somma alle ore scritte', gD.filter(x=>x.hh.length).every(x=>Math.abs(x.hh.reduce((a,b)=>a+b,0)-3)<0.01));
  const M=metà[1], gM=giorni(M), r20=gM.find(x=>x.d===20), r10=gM.find(x=>x.d===10);
  T('V13 PROVA MALATTIA: il 20 (4,30 scritte) somma a 4 h 30, la MAL del 10 nelle assenze retribuite', r20 && Math.abs(r20.hh.reduce((a,b)=>a+b,0)-4.5)<0.01 && r10 && /MAL /.test(r10.riga), (r20&&r20.riga.trim().slice(0,60))+' | '+(r10&&r10.riga.trim().slice(0,40)));
  const Po=metà[2], gP=giorni(Po);
  T('V14 PROVA POCHE (sotto B): niente supplementari, giorni come scritti, ore non lavorate da trattenere nello schema', gP.filter(x=>x.hh.length).every(x=>Math.abs(x.hh[0]-3)<0.01 && x.hh.length===1) && /da TRATTENERE: ore non/.test(Po) && eng['PROVA POCHE'].supp===0);
  T('V15 zero errori di pagina', E.length===0, E.join(' | '));
  /* ottobre 2026: i casi delle prove vecchie (ver184 PROVA SEI e PROVA CINQUE, ver196 COMPENSA, ver183 SOTTO), letti a mezza pagina */
  const eng10=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const o={}; st.dipendenti.forEach(dp=>{ const T=tsMese(st,dp,2026,10); if(!T) return;
    o[dp.nome]={ ordC:T.ordC, supp:T.supp, ret:T.assTot, nr:T.trattNR, giorni:(getRecFrom(st,2026,10,dp.id).giorni||{}) }; }); return o; });
  const R10=await pdf(pg,10,'v208');
  const ok5=k=>[0,10,15,20,30,40,45,50].indexOf(k)!==-1;
  let fogli=[]; for(let i=1;i<=R10.pagine;i++) fogli.push(R10.meta(i,0),R10.meta(i,421));
  T('V16 ottobre: 4 mensilizzati con dati (+ chi ne ha) su '+R10.pagine+' fogli, due per foglio', R10.pagine===Math.ceil(fogli.filter(t=>/PROVA/.test(t)).length/2), R10.pagine);
  for(const nome of ['PROVA SEI','PROVA CINQUE','PROVA COMPENSA','PROVA SOTTO']){
    const t=fogli.find(x=>x.indexOf(nome)!==-1)||''; const e=eng10[nome]; if(!e||!t){ T('V17 '+nome+': c\'è', false); continue; }
    const rr=giorni(t); let sO=0, sS=0, male=[], dif=[];
    rr.forEach(x=>{ const toks=[...x.riga.matchAll(/(?<![A-Za-z]\s)(?<![A-Za-z])(\d+,\d{2}) \(/g)].map(m=>m[1]);
      const scritto=String(e.giorni[x.d]==null?'':e.giorni[x.d]); const h=/^\d/.test(scritto)?parseFloat(scritto.replace(',','.')):0;
      const v=toks.map(hm); if(v.length>2) male.push(x.d+':troppi'); if(v.length){ sO+=v[0]; if(v.length>1) sS+=v[1]; }
      toks.forEach(tk=>{ if(!ok5(+tk.split(',')[1])) male.push(x.d+':'+tk); });
      if(Math.abs(v.reduce((a,b)=>a+b,0)-h)>0.01) dif.push(x.d+':'+toks.join('+')+'≠'+scritto); });
    const am=/arrotondamento delle ore mensili: ([+-]\d+) min/.exec(t); const arr=am?(+am[1])/60:0;
    T('V17 '+nome+': ogni giorno ordinarie + supplementari = ore scritte nel Tabellone', dif.length===0, dif.slice(0,6).join(' '));
    T('V18 '+nome+': ogni cella coi minuti ammessi (00 10 15 20 30 40 45 50)', male.length===0, male.slice(0,6).join(' '));
    T('V19 '+nome+': giorni + arrotondamento = ordinarie a cedolino ('+e.ordC.toFixed(3)+'), supplementari = TS ('+e.supp.toFixed(3)+')', Math.abs(sO+arr-e.ordC)<0.0175 && Math.abs(sS-e.supp)<0.0175, 'ord '+sO.toFixed(3)+(am?' '+am[1]+' min':'')+' · supp '+sS.toFixed(3));
  }
  const tC=fogli.find(x=>x.indexOf('PROVA COMPENSA')!==-1)||''; const r12=giorni(tC).find(x=>x.d===12);
  T('V20 PROVA COMPENSA: il 12 «ASS.ING 3,00 (3 h)» fra le non retribuite', r12 && /ASS\.ING 3,00 \(3 h\)/.test(r12.riga), r12&&r12.riga.trim());
  if (PNG){ sh('pdftoppm -png -r 70 -f 1 -l 1 '+JSON.stringify(R.out)+' '+JSON.stringify(PNG+'/report-paghe-ver208')); }
  await ctx.close(); console.log('\nver208: '+P+' superati, '+F+' falliti'); await br.close(); })();
