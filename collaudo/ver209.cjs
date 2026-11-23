/* Collaudo ver209 (dati INVENTATI): «🖨️ Report PDF A4 per le paghe», schema del cedolino senza la colonna «Note»
   e senza la riga «FESTIVITÀ NON GODUTE, a parte» (Christian, 23/11/2026: «Nel report paghe, in legenda, togli le note e
   togli l'ultima riga sulle festività»). Confronto con la ver208 congelata: stessi giorni, stessi numeri, stesse righe salvo quella.
   Prima: python3 collaudo/rigenera.py ver208. Poi: node collaudo/ver209.cjs [cartella-png] */
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

const schema=(t)=>{ const o={}; t.split('\n').forEach(r=>{ const m=/^\s*((?:ORE |FESTIVIT|di cui)[^\d]*?)\s{2,}(\d+,\d{2}(?: \([^)]*\))?)/.exec(r); if(m) o[m[1].trim()]=m[2]; }); return o; };
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  const res={};
  for (const [tag,url] of [['v208','http://127.0.0.1:8300/ver208/index.html'],['v209','http://127.0.0.1:8300/dip/index.html']]){
    const {ctx,pg,E}=await apri(br,url); res[tag]={E};
    for (const mese of [10,11]){ const R=await pdf(pg,mese,tag); res[tag][mese]=R; }
    await ctx.close(); }
  const PM=require('./paghe-meta.cjs');
  for (const mese of [10,11]){
    const A=res.v208[mese], B=res.v209[mese];
    const ta=PM.testoPaghe(A.out).txt, tb=PM.testoPaghe(B.out).txt;
    T('S01 '+mese+': la ver208 aveva la colonna «Note» e la riga FESTIVITÀ NON GODUTE', /SCHEMA DEL CEDOLINO\s+Ore\s+Note/.test(ta) && /FESTIVIT. NON GODUTE/.test(ta));
    T('S02 '+mese+': la ver209 non ha più la colonna «Note»', /SCHEMA DEL CEDOLINO\s+Ore/.test(tb) && !/SCHEMA DEL CEDOLINO\s+Ore\s+Note/.test(tb));
    T('S03 '+mese+': la ver209 non ha più la riga FESTIVITÀ NON GODUTE', !/FESTIVIT. NON GODUTE/.test(tb));
    T('S04 '+mese+': nessuna nota rimasta («da pagare in più», «lo stipendio fisso», «fino alle ore dovute»)', !/da pagare in pi|lo stipendio fisso del mese|fino alle ore dovute|mancano alle ore dovute/.test(tb));
    const ga=giorni(ta).map(x=>x.d+' '+x.riga.replace(/\s+/g,' ').trim()).join('\n'), gb=giorni(tb).map(x=>x.d+' '+x.riga.replace(/\s+/g,' ').trim()).join('\n');
    T('S05 '+mese+': le righe dei giorni sono identiche alla ver208', ga===gb && ga.length>0, ga.length+' / '+gb.length);
    const sa=schema(ta), sb=schema(tb); delete sa['FESTIVITÀ NON GODUTE, a parte'];
    const ka=Object.keys(sa).filter(k=>!/^FESTIVIT/.test(k)); const diff=ka.filter(k=>sa[k]!==sb[k]);
    T('S06 '+mese+': ogni riga rimasta dello schema ha le stesse ore della ver208', ka.length>0 && diff.length===0, ka.length+' righe, diverse: '+diff.join(' | '));
    T('S07 '+mese+': ORE DOVUTE e ORE SUPPLEMENTARI ci sono ancora', /ORE DOVUTE/.test(tb) && /ORE SUPPLEMENTARI/.test(tb));
    T('S08 '+mese+': pagine non aumentate ('+A.pagine+' → '+B.pagine+')', B.pagine<=A.pagine);
    if (PNG){ sh('pdftoppm -png -r 70 -f 1 -l 1 '+JSON.stringify(B.out)+' '+JSON.stringify(PNG+'/ver209-'+mese)); }
  }
  T('S09 zero errori di pagina', res.v209.E.length===0, res.v209.E.join(' | '));
  await br.close(); console.log('\nver209: '+P+' superati, '+F+' falliti'); process.exit(F?1:0); })();
