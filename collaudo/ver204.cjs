/* Collaudo ver204 (21/11/2026, Christian: «2, Mettere C uguale a B»): nei mesi a busta mensilizzata (da ottobre 2026) le
   «ORE CHE DEVONO RISULTARE …» (C) = ore mensili (B), in proporzione se il mese è parziale, come il cedolino della ver203.
   Dati INVENTATI. Prima: python3 collaudo/rigenera.py ver203. Poi: node collaudo/ver204.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300';
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function seme(anno,mese,celle,o){ o=o||{}; const r={giorni:celle}; if(o.oreLav) r.oreLav=o.oreLav;
  return { anni:[anno], dipendenti:[{id:'a',nome:'PROVA ESEMPIO',oreSett:o.ore||19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:o.mens!==false,mensilizzatoDal:'01/10/2026',dataAssunzione:o.ass||'01/01/2020',tettiAnnui:[{anno:2026,ore:400}],tettoPeriodo:'scolastico'}],
  dati:{[anno+'-'+String(mese).padStart(2,'0')]:{a:r}}, costoComune:{} }; }
function lunSab(anno,mese,fn){ const g={}; const n=new Date(anno,mese,0).getDate(); for(let d=1;d<=n;d++){ if(new Date(anno,mese-1,d).getDay()===0) continue; const v=fn(d); if(v!=null) g[d]=v; } return g; }
async function leggi(br,dir,S,anno,mese,w){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100}}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },S);
  await pg.goto('http://127.0.0.1:'+PORTA+'/'+dir+'/index.html',{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  const tabs=await pg.locator('.tabs .tab').allInnerTexts(); const L=['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'][mese-1];
  await pg.locator('.tabs .tab').nth(tabs.findIndex(t=>t.trim().toUpperCase().startsWith(L))).click(); await pg.waitForTimeout(1000);
  const r=await pg.evaluate(()=>{ const c=document.querySelector('.emp-card'); const q=s=>c.querySelector(s); const t=s=>((q(s)||{}).innerText||'').replace(/\s+/g,' ');
    const pc=[...c.querySelectorAll('.pill')].find(x=>/^C\)/.test(x.innerText.trim()));
    let ced=null; try{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); ced=cedOrePubblica(st); }catch(e){ ced='ERR '+e.message; }
    const h=q('.foot-fin');
    return { C:pc?(pc.innerText.match(/([\d.,]+)\s*$/)||[])[1]:null, Ctit:pc?pc.title:'', ris:(c.innerText.match(/Risultato del mese: ([+\-−]?[\d.,]+) h/)||[])[1],
      anc:t('.foot-ancora'), cosaE:t('.cosa-e'), base:(c.innerText.match(/Base = [^\n]*/)||[''])[0], chip:[...c.querySelectorAll('.cong-chip')].map(x=>x.innerText.replace(/\s+/g,' ')).filter(x=>/a cedolino/.test(x)).join(' | '),
      H:h?(h.querySelector('.foot-fin-r b')||{}).innerText:null, G:t('.foot-teor:not(.foot-noner) > b'), tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1], box:t('.ced-box'), ced:JSON.stringify(ced), pw:document.documentElement.scrollWidth }; });
  r.err=E.length; r.errs=E; await ctx.close(); return r; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  let j=0; const A=seme(2026,10,lunSab(2026,10,d=>(j++===0)?'MAL':'3,25'),{oreLav:'85'});      // ottobre 27 gg, 84,5 rese + 1 MAL
  let k=0; const B=seme(2026,11,lunSab(2026,11,d=>(k++<20)?'4':null));                          // novembre 25 gg, 80 ore
  let i=0; const C=seme(2027,1,lunSab(2027,1,d=>(d===1||d===6)?null:((i++<20)?'3,5':null)));    // gennaio 26 gg
  let p=0; const D=seme(2026,10,lunSab(2026,10,d=>(d>=15&&p++<10)?'4':null),{ass:'15/10/2026'}); // assunta il 15/10: mese parziale
  let q=0; const E=seme(2026,12,lunSab(2026,12,d=>([7,8,25,26].includes(d))?null:((q++<15)?'5':null)),{mens:false,ore:29}); // non mensilizzato
  let s9=0; const S9=seme(2026,9,lunSab(2026,9,d=>(s9++<20)?'4':null));                         // settembre 2026, prima della base mensile
  const R={}; for (const [nm,S,an,me] of [['A',A,2026,10],['B',B,2026,11],['C',C,2027,1],['D',D,2026,10],['E',E,2026,12],['S9',S9,2026,9]]) { R[nm]=await leggi(br,'dip',S,an,me); R[nm+'v']=await leggi(br,'ver203',S,an,me); }
  const t=await leggi(br,'dip',A,2026,10,390);
  console.log(JSON.stringify(Object.fromEntries(Object.entries(R).map(([k,v])=>[k,[v.C,v.ris,v.anc,v.H,v.G,v.tetto]]))));
  T('T01 ottobre 27 gg: C = B = 82,500 (ver203: 85,673)', R.A.C==='82,500' && R.Av.C==='85,673', R.A.C+' / '+R.Av.C);
  T('T02 ottobre: Risultato del mese +5,167 = supplementari a cedolino (ver203 su C: +1,994)', R.A.ris==='+5,167' && R.Av.ris==='+1,994' && /supplementari 5,167 h/.test(R.A.chip), R.A.ris+' / '+R.Av.ris+' · '+R.A.chip);
  T('T03 ottobre: capsula «Devi riempire ancora per» = C − G = −5,167', /−5,167|-5,167/.test(R.A.anc), R.A.anc);
  T('T04 ottobre: «COSA DEVE RISULTARE IN E» con D = 85 → 85,000 (ver203: 81,827)', /85,000/.test(R.A.cosaE) && /81,827/.test(R.Av.cosaE), R.A.cosaE.slice(0,90)+' / '+R.Av.cosaE.slice(0,60));
  T('T05 ottobre: H, G, massimale e cedOre identici alla ver203', R.A.H===R.Av.H && R.A.G===R.Av.G && R.A.tetto===R.Av.tetto && R.A.ced===R.Av.ced, R.A.H+' '+R.A.tetto+' '+R.A.ced);
  T('T06 ottobre: riquadro «Da inserire a cedolino» identico alla ver203', R.A.box===R.Av.box);
  T('T07 novembre 25 gg: C = 82,500 (ver203: 79,327), Risultato −2,500 = da trattenere a cedolino', R.B.C==='82,500' && R.Bv.C==='79,327' && /^[−-]2,500$/.test(R.B.ris) && /da trattenere 2,500 h/.test(R.B.chip), R.B.C+' '+R.B.ris+' · '+R.B.chip);
  T('T08 novembre: H, massimale, box e cedOre identici alla ver203', R.B.H===R.Bv.H && R.B.tetto===R.Bv.tetto && R.B.box===R.Bv.box && R.B.ced===R.Bv.ced);
  T('T09 gennaio 2027 (26 gg): C, Risultato e capsula identici alla ver203 (82,500)', R.C.C==='82,500' && R.C.C===R.Cv.C && R.C.ris===R.Cv.ris && R.C.anc===R.Cv.anc, R.C.C+' '+R.C.ris);
  T('T10 assunta il 15/10: C = B × 17/31 = 45,242, uguale alla soglia del cedolino (ver203: 47,596)', R.D.C==='45,242' && R.Dv.C==='47,596' && /ore mensili B 45,242/.test(R.D.chip), R.D.C+' / '+R.Dv.C+' · '+R.D.chip);
  T('T11 non mensilizzato (dicembre): C e Risultato identici alla ver203', R.E.C===R.Ev.C && R.E.ris===R.Ev.ris && R.E.C!=null, R.E.C+' '+R.E.ris);
  T('T12 settembre 2026 (prima della base mensile): C identica alla ver203', R.S9.C===R.S9v.C && R.S9.C!=null, R.S9.C);
  T('T13 suggerimento di C: «= B (ore mensili), in proporzione … come il cedolino mensilizzato»', /= B \(ore mensili\), in proporzione/.test(R.A.Ctit) && /÷ 26/.test(R.E.Ctit), R.A.Ctit.slice(0,120));
  T('T14 riga «Base = …» del riquadro dice C = B nei mesi mensilizzati', /Base = ore previste del mese \(C\) = ore mensili \(B\)/.test(R.A.base), R.A.base);
  T('T15 390px senza scorrimento laterale', t.pw===390, t.pw);
  T('T16 zero errori di pagina', Object.values(R).concat([t]).every(x=>x.err===0), Object.values(R).map(x=>x.errs.join(';')).join('|'));
  console.log('\nRISULTATO: '+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
