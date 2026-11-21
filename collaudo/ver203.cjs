/* Collaudo ver203 (21/11/2026, Christian: «Il finanziatore prende in mano il cedolino, guarda la prima riga (retribuzione) e toglie
   le ore trattenute …», «B, Sì SUPPLEMENTARI», «Oltre B, come le paghe»): nei mesi mensilizzati il cedolino guarda solo le ore
   mensili (B). ⚠️ Dalla ver204 C = B nei mesi mensilizzati: T04 e T06 aggiornati (attese ricalcolate a mano). Dati INVENTATI. Prima: python3 collaudo/rigenera.py ver202. Poi: node collaudo/ver203.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300';
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function seme(anno,mese,celle,ero,mens,ore){ return { anni:[anno], dipendenti:[{id:'a',nome:'PROVA ESEMPIO',oreSett:ore||19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:mens!==false,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',tettiAnnui:[{anno:2026,ore:400}],tettoPeriodo:'scolastico'}],
  dati:{[anno+'-'+String(mese).padStart(2,'0')]:{a:{giorni:celle, ero:ero||{}}}}, costoComune:{} }; }
function lunSab(anno,mese,fn){ const g={}; const n=new Date(anno,mese,0).getDate(); for(let d=1;d<=n;d++){ if(new Date(anno,mese-1,d).getDay()===0) continue; const v=fn(d); if(v!=null) g[d]=v; } return g; }
async function leggi(br,dir,S,anno,mese,w){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100}}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },S);
  await pg.goto('http://127.0.0.1:'+PORTA+'/'+dir+'/index.html',{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  const tabs=await pg.locator('.tabs .tab').allInnerTexts(); const L=['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'][mese-1];
  await pg.locator('.tabs .tab').nth(tabs.findIndex(t=>t.trim().toUpperCase().startsWith(L))).click(); await pg.waitForTimeout(1000);
  const r=await pg.evaluate(([anno,mese])=>{ const c=document.querySelector('.emp-card'); const q=s=>c.querySelector(s); const t=s=>((q(s)||{}).innerText||'').replace(/\s+/g,' ');
    const h=q('.foot-fin'); const box=q('.ced-box'); const rows={}; if(box) box.querySelectorAll('tr').forEach(tr=>{ const td=tr.querySelectorAll('td'); if(td.length>=3) rows[td[0].innerText.trim()]={n:td[1].innerText.trim(),d:td[2].innerText.trim()}; });
    let ced=null; try{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); ced=cedOrePubblica(st); }catch(e){ ced='ERR '+e.message; }
    return { G:t('.foot-teor:not(.foot-noner) > b'), H:h?(h.querySelector('.foot-fin-r b')||{}).innerText:null, Htxt:h?h.innerText.replace(/\s+/g,' '):'', tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1],
      ris:(c.innerText.match(/Risultato del mese: ([+\-−]?[\d.,]+) h/)||[])[1], chip:[...c.querySelectorAll('.cong-chip')].map(x=>x.innerText.replace(/\s+/g,' ')).filter(x=>/a cedolino|trattenere/.test(x)).join(' | '),
      res:t('.cong-res'), rows:rows, rend:t('.ced-rend'), ced:ced, pw:document.documentElement.scrollWidth }; },[anno,mese]);
  r.err=E.length; r.errs=E; await ctx.close(); return r; }
const n=x=>parseFloat(String(x).replace(/\./g,'').replace(',','.'));
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  /* A: ottobre 2026 (27 gg), 1 MAL + 26 × 3,25 = 84,5 rese → oltre B 82,5 */
  let j=0; const A=seme(2026,10,lunSab(2026,10,d=>(j++===0)?'MAL':'3,25'));
  /* B: novembre 2026 (25 gg), 80 ore → sotto B: trattenute 2,5 (il Tabellone vero dice +0,667 su C) */
  let k=0; const B=seme(2026,11,lunSab(2026,11,d=>(k++<20)?'4':null));
  /* C: gennaio 2027 con sole 70 ore, 1/1 erosiva, 6/1 non erosiva */
  let i=0; const C=seme(2027,1,lunSab(2027,1,d=>(d===1||d===6)?null:((i++<20)?'3,5':null)),{6:false});
  /* D: dicembre 2026 a 29 h, ASS.ING dal 28 al 31, 4 festività godute, 15 giorni da 5 ore = 75 */
  let m=0; const D=seme(2026,12,lunSab(2026,12,d=>([7,8,25,26].includes(d))?null:(d>=28?'ASS.ING':((m++<15)?'5':null))),{},true,29);
  /* E: dicembre come D ma non mensilizzato (criterio orario: niente cambia) */
  let e2=0; const E=seme(2026,12,lunSab(2026,12,d=>([7,8,25,26].includes(d))?null:(d>=28?'ASS.ING':((e2++<15)?'5':null))),{},false,29);
  const a=await leggi(br,'dip',A,2026,10), b=await leggi(br,'dip',B,2026,11), c=await leggi(br,'dip',C,2027,1), d=await leggi(br,'dip',D,2026,12), e=await leggi(br,'dip',E,2026,12);
  const d2=await leggi(br,'ver202',D,2026,12), b2=await leggi(br,'ver202',B,2026,11), e3=await leggi(br,'ver202',E,2026,12), t=await leggi(br,'dip',D,2026,12,390);
  console.log(JSON.stringify({a:[a.H,a.G,a.ris,a.chip],b:[b.H,b.G,b.ris,b.chip],c:[c.H,c.G,c.Htxt],d:[d.H,d.G,d.chip,d.rows],d2:[d2.H,d2.G],e:[e.H,e.G]},null,0).slice(0,3000));
  T('T01 ottobre: la riga «ORE SUPPLEMENTARI (oltre le ore mensili)» c\'è', !!a.rows['ORE SUPPLEMENTARI (oltre le ore mensili)'], JSON.stringify(a.rows['ORE SUPPLEMENTARI (oltre le ore mensili)']));
  T('T02 ottobre: supplementari = 5,167 h (oltre B), nessuna trattenuta', /\+5,167/.test((a.rows['ORE SUPPLEMENTARI (oltre le ore mensili)']||{}).n||'') && !a.rows['di cui ore non fatte, da trattenere']);
  T('T03 ottobre: H = G = 87,667 (cedolino = ore vere) e = «Già usate»', a.H==='87,667' && a.G==='87,667' && a.tetto==='87,667', a.H+' / '+a.G+' / '+a.tetto);
  T('T04 ottobre: Risultato del mese del Tabellone (dalla ver204 su C = B: 87,667 − 82,500 = +5,167; nella ver203 su C +1,994)', a.ris==='+5,167', a.ris);
  T('T05 novembre 25 gg, 80 ore: a cedolino trattenute 2,500 e supplementari 0', /supplementari 0,000 h · da trattenere 2,500 h/.test(b.chip), b.chip);
  T('T06 novembre: Tabellone (dalla ver204 su C = B: 80 − 82,500 = −2,500; nella ver202 su C +0,673)', /^[−-]2,500$/.test(b.ris) && b2.ris==='+0,673', b.ris+' / '+b2.ris);
  T('T07 novembre: box «da trattenere» dice ore non lavorate sotto le ore mensili 2,500', /ore non lavorate sotto le ore mensili 2,500/.test((b.rows['di cui ore non fatte, da trattenere']||{}).d||''), JSON.stringify(b.rows['di cui ore non fatte, da trattenere']));
  T('T08 novembre: H = G = 80,000 (ver202: 83,167 = B + 0,673 di supplementari su C)', b.H==='80,000' && b.G==='80,000' && b2.H==='83,167', b.H+' / '+b2.H);
  T('T09 gennaio 70 ore: H = G = 73,167 (era 79,333)', c.H==='73,167' && c.G==='73,167', c.H+' / '+c.G);
  T('T10 gennaio: didascalia «ore mensili (B) 82,500 − ore trattenute a cedolino 6,167 + supplementari 0,000 − non erosive 3,167»', /ore mensili \(B\) 82,500 − ore trattenute a cedolino 6,167 \+ supplementari 0,000 − assenze retribuite non erosive 3,167/.test(c.Htxt) && /coincide con G/.test(c.Htxt), c.Htxt.slice(0,260));
  T('T11 dicembre (caso di Christian): H = G = 94,333 (ver202: 106,588)', d.H==='94,333' && d.G==='94,333' && /106,5/.test(d2.H||''), d.H+' / '+d.G+' · ver202 '+d2.H);
  T('T12 dicembre: trattenute 31,588 = ASS.ING 19,333 + ore non lavorate 12,255', /31,58/.test((d.rows['di cui ore non fatte, da trattenere']||{}).n||'') && /ASP 0h \/ SCIOP\) 19,333/.test((d.rows['di cui ore non fatte, da trattenere']||{}).d||'') && /sotto le ore mensili 12,25/.test((d.rows['di cui ore non fatte, da trattenere']||{}).d||''), JSON.stringify(d.rows['di cui ore non fatte, da trattenere']));
  T('T13 dicembre: ordinarie a cedolino = 75,000 (le ore lavorate)', ((d.rows['di cui ore lavorate ordinarie']||{}).n||'').startsWith('75,000'), JSON.stringify(d.rows['di cui ore lavorate ordinarie']));
  T('T14 dicembre: nessuna riga «ORE SOTTO L\'ORARIO, non trattenute»', !Object.keys(d.rows).some(x=>/SOTTO L'ORARIO/.test(x)));
  T('T15 cedOre per USOINT = ore a cedolino (dicembre 75,00, novembre 80,00)', d.ced && d.ced['2026-12'] && d.ced['2026-12'].a===75 && b.ced['2026-11'].a===80, JSON.stringify(d.ced)+' '+JSON.stringify(b.ced));
  T('T16 non mensilizzato: H, G e massimale identici alla ver202', e.H===e3.H && e.G===e3.G && e.tetto===e3.tetto, e.H+' / '+e3.H);
  T('T17 frase del riquadro: «A cedolino … conta solo le ore mensili (B)»', /A cedolino \(mensilizzati\) conta solo le ore mensili \(B\)/.test(d.res));
  T('T18 390px senza scorrimento laterale', t.pw===390, t.pw);
  T('T19 zero errori di pagina', [a,b,c,d,e,d2,b2,e3,t].every(x=>x.err===0), [a,b,c,d,e].map(x=>x.errs.join(';')).join('|'));
  console.log('\nRISULTATO: '+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
