/* Collaudo ver202 (21/11/2026, Christian: «me lo descrivi meglio in didascalia ben visibile?» → «H deve comparire anche se uguale a G»):
   riga H «Ore che paga il finanziatore (cedolino + erosive)» = quello che scende dal massimale. Dati INVENTATI.
   Prima: python3 collaudo/rigenera.py ver201. Poi: node collaudo/ver202.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300';
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
function seme(anno,mese,celle,ero,mens){ return { anni:[anno], dipendenti:[{id:'a',nome:'PROVA ESEMPIO',oreSett:19,livello:'D1',tipoContratto:'indeterminato',mensilizzato:mens!==false,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',tettiAnnui:[{anno:2026,ore:400}],tettoPeriodo:'scolastico'}],
  dati:{[anno+'-'+String(mese).padStart(2,'0')]:{a:{giorni:celle, ero:ero||{}}}}, costoComune:{} }; }
function lunSab(anno,mese,fn){ const g={}; const n=new Date(anno,mese,0).getDate(); for(let d=1;d<=n;d++){ if(new Date(anno,mese-1,d).getDay()===0) continue; const v=fn(d); if(v!=null) g[d]=v; } return g; }
async function leggi(br,dir,S,anno,mese,w){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100}}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },S);
  await pg.goto('http://127.0.0.1:'+PORTA+'/'+dir+'/index.html',{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  const tabs=await pg.locator('.tabs .tab').allInnerTexts(); const L=['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'][mese-1];
  await pg.locator('.tabs .tab').nth(tabs.findIndex(t=>t.trim().toUpperCase().startsWith(L))).click(); await pg.waitForTimeout(1000);
  const r=await pg.evaluate(()=>{ const c=document.querySelector('.emp-card'); const q=s=>c.querySelector(s); const t=s=>(q(s)||{}).innerText||'';
    const h=q('.foot-fin'); const cs=h?getComputedStyle(h):null;
    return { G:(t('.foot-teor:not(.foot-noner) > b')), H:h?(h.querySelector('.foot-fin-r b')||{}).innerText:null, Htxt:h?h.innerText.replace(/\s+/g,' '):'', tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1],
      rend:t('.ced-rend'), bg:cs?cs.backgroundColor+' '+cs.borderTopColor:'', minFs:h?Math.min(...[...h.querySelectorAll('*')].map(x=>parseFloat(getComputedStyle(x).fontSize))):0,
      ordine:[...c.querySelectorAll('.tot-righe > *')].map(x=>x.innerText.trim().slice(0,2)).join(''), pw:document.documentElement.scrollWidth, sotto:h?(h.getBoundingClientRect().top>q('.foot-teor:not(.foot-noner)').getBoundingClientRect().top):false }; });
  r.err=E.length; await ctx.close(); return r; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  let k=0; const A=seme(2027,1,lunSab(2027,1,d=>(d===1||d===6)?null:((k++<22)?'3,5':'2,75')),{6:false});
  let j=0; const B=seme(2026,10,lunSab(2026,10,d=>(j++===0)?'MAL':'3,25'));
  let i=0; const C=seme(2027,1,lunSab(2027,1,d=>(d===1||d===6)?null:((i++<20)?'3,5':null)),{6:false});
  let m=0; const D=seme(2026,10,lunSab(2026,10,d=>(m++===0)?'MAL':'3,25'),{},false);
  const a=await leggi(br,'dip',A,2027,1), b=await leggi(br,'dip',B,2026,10), c=await leggi(br,'dip',C,2027,1), d=await leggi(br,'dip',D,2026,10), t=await leggi(br,'dip',B,2026,10,390), v=await leggi(br,'ver201',B,2026,10);
  console.log(JSON.stringify({a,b,c,d},null,0).slice(0,1500));
  T('H01 gennaio 26 gg: H compare anche se uguale a G (85,667 = 85,667)', a.H==='85,667' && a.G==='85,667', a.H+' / '+a.G);
  T('H02 … e dice «Questo mese coincide con G.»', /Questo mese coincide con G\./.test(a.Htxt) && !/Differisce/.test(a.Htxt));
  T('H03 ottobre 27 gg: H 84,500, G 87,667, «Differisce da G di -3,167»', b.H==='84,500' && b.G==='87,667' && /Differisce da G di -3,167/.test(b.Htxt), b.H+' / '+b.G);
  T('H04 solo 70 ore: H 79,333, G 73,167, «+6,166»', c.H==='79,333' && c.G==='73,167' && /Differisce da G di \+6,166/.test(c.Htxt), c.H+' / '+c.G);
  T('H05 H = «Già usate» del massimale in tutti e tre', a.H===a.tetto && b.H===b.tetto && c.H===c.tetto, [a.tetto,b.tetto,c.tetto].join(' · '));
  T('H06 H = riga «Per il rendiconto» del riquadro cedolino', /= 84,500 tolte dal massimale/.test(b.rend) && /ordinarie e supplementari 81,333 \+ ore retribuite erosive 3,167/.test(b.Htxt));
  T('H07 non mensilizzato: H = G con la frase «quindi H = G»', d.H===d.G && /quindi H = G/.test(d.Htxt) && d.H===d.tetto, d.H+' / '+d.G);
  T('H08 ordine E F G H, H sotto G', a.ordine.startsWith('E)F)G)H)') && a.sotto, a.ordine);
  T('H09 giallo con bordo ambra', /rgb\(255, 248, 225\) rgb\(245, 158, 11\)/.test(a.bg), a.bg);
  T('H10 nessuna scritta sotto i 12,5px nella riga H', a.minFs>=12.5, a.minFs);
  T('H11 390px: niente scorrimento laterale', t.pw===390, t.pw);
  T('H12 ver201: nessuna riga H, G e massimale identici', v.H===null && v.G===b.G && v.tetto===b.tetto, v.G+' · '+v.tetto);
  T('H13 zero errori di pagina', [a,b,c,d,t,v].every(x=>x.err===0));
  console.log('\nRISULTATO: '+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
