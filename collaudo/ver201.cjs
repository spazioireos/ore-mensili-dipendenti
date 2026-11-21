/* Collaudo ver201 (21/11/2026, Christian: «Il giorno valga B diviso 26» → «Solo per C»): C = B ÷ 26 × giorni non domenicali in forza;
   assenze e festività restano a ore settimanali ÷ giorni. Dati INVENTATI. Confronto con la ver200 congelata.
   Prima: python3 collaudo/rigenera.py ver200. Poi: node collaudo/ver201.cjs   (PORTA=8300 di serie) */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const PORTA=process.env.PORTA||'8300'; const OUT=process.env.OUT||(__dirname+'/out/');
let P=0,F=0; const T=(n,c,d)=>{(c?P++:F++);console.log((c?'  OK  ':'  NO  ')+n+(d!==undefined?'  -> '+d:''));};
async function apri(br,url,w,tab){ const ctx=await br.newContext({viewport:{width:w||1500,height:1100},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[]; pg.on('pageerror',e=>E.push(e.message.slice(0,200)));
  await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },SEME); await pg.goto(url,{waitUntil:'domcontentloaded'}); await pg.waitForTimeout(4500);
  const pins=pg.locator('input[type=password]'); if(await pins.count()>=2){ await pins.nth(0).fill('1234'); await pins.nth(1).fill('1234'); await pg.getByRole('button',{name:/Crea PIN/i}).first().click(); await pg.waitForTimeout(1800); }
  await pg.locator('.tabs .tab').nth(tab).click(); await pg.waitForTimeout(900); return {ctx,pg,E}; }
const num=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.').replace('+',''));
async function leggi(pg){ return pg.evaluate(()=>{ const c=document.querySelector('.emp-card'); const q=s=>c.querySelector(s);
  const pill=[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText).find(t=>/ORE CHE DEVONO/.test(t))||'';
  const tabs=[...c.querySelectorAll('.teor-abs,.teor-fest')].map(x=>({t:x.innerText.trim(), ne:x.classList.contains('no-ero'), cls:x.className}));
  const st=x=>{ const s=getComputedStyle(x); return s.borderTopStyle+' '+s.borderTopColor+' '+s.backgroundColor; };
  const e=c.querySelector('.teor-abs:not(.no-ero)'), ne=c.querySelector('.teor-abs.no-ero');
  return { pill, teor:(q('.foot-teor:not(.foot-noner) > b')||{}).innerText, teorTxt:(q('.foot-line')||{}).innerText, fTot:(q('.foot-noner > b')||{}).innerText, eTxt:(q('.foot-tot')||{}).innerText, gTxt:(q('.foot-teor:not(.foot-noner)')||{}).innerText, fTxt:(q('.foot-noner')||{}).innerText, pills:[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText.replace(/\s+/g,' ')), cosa:(q('.cosa-e')||{}).innerText, cosaFs:q('.cosa-e-lbl')?getComputedStyle(q('.cosa-e-lbl')).fontSize:'', cosaVal:q('.cosa-e-val')?q('.cosa-e-val').innerText:null, dIn:!!q('.orelav-in'), dBg:q('.orelav-in')?getComputedStyle(q('.orelav-in')).backgroundColor+' '+getComputedStyle(q('.orelav-in')).borderTopColor:'', ordine:[...c.querySelectorAll('.tot-righe > span')].map(x=>x.innerText.slice(0,2)).join(''), tops:[...c.querySelectorAll('.tot-righe > span')].map(x=>Math.round(x.getBoundingClientRect().top)), tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1], cellTeor:(q('.tot-teor')||{}).innerText, anc:q('.foot-ancora')?q('.foot-ancora').innerText:null, ancCls:q('.foot-ancora')?q('.foot-ancora').className:'',
    leg:q('.ero-legenda')?q('.ero-legenda').innerText:null, tabs, stE:e?st(e):'', stNE:ne?st(ne):'', fsE:e?getComputedStyle(e).fontSize:'',
    tw:(q('table.cal')||{}).scrollWidth, pw:document.documentElement.scrollWidth }; }); }
async function apriMese(br,url,tab,w){ const {ctx,pg,E}=await apri(br,url,w,tab); return {ctx,pg,E}; }
let SEME;
function semeGen(oreSett, alto, basso){ const g={}; let k=0; for(let d=1;d<=31;d++){ const wd=new Date(2027,0,d).getDay(); if(wd===0||d===1||d===6) continue; g[d]=(k<22)?alto:basso; k++; }
  return { anni:[2026,2027], dipendenti:[{id:'a',nome:'PROVA ESEMPIO',oreSett:oreSett,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',tettiAnnui:[{anno:2026,ore:400}],tettoPeriodo:'scolastico'}],
    dati:{'2027-01':{a:{giorni:g, ero:{6:false}}}}, costoComune:{} }; }
async function misura(br,dir){ const {ctx,pg,E}=await apri(br,'http://127.0.0.1:'+PORTA+'/'+dir+'/index.html',1500,0);
  await pg.evaluate(()=>{ const b=[...document.querySelectorAll('button,.yearbar *')].find(x=>/^\s*2027\s*$/.test(x.innerText)); if(b) b.click(); }); await pg.waitForTimeout(600);
  const tabs=await pg.locator('.tabs .tab').allInnerTexts(); const gi=tabs.findIndex(t=>/^Gen/i.test(t.trim())); await pg.locator('.tabs .tab').nth(gi).click(); await pg.waitForTimeout(900);
  const r=await pg.evaluate(()=>{ const c=document.querySelector('.emp-card'); const t=s=>(c.querySelector(s)||{}).innerText||''; const pill=[...c.querySelectorAll('.emp-head .pill')].map(p=>p.innerText).find(x=>/^C\)/.test(x))||'';
    return { C:(pill.match(/([\d.,]+)\s*$/)||[])[1], E:t('.foot-tot'), G:t('.foot-teor:not(.foot-noner)'), anc:(t('.foot-ancora').match(/([-+]?[\d.,]+)\s*$/)||[])[1], ris:t('.cong-chip.strong'), box:t('.ced-box').replace(/\s+/g,' '), tetto:(c.innerText.match(/Già usate[^\d]*([\d.,]+)/)||[])[1] }; });
  r.err=E.length; await ctx.close(); return r; }
(async()=>{ const br=await chromium.launch({args:['--no-sandbox']});
  SEME=semeGen(19,'3,5','2,75');   // 22 × 3,5 + 2 × 2,75 = 82,5 ore; 1 gennaio festività E, 6 gennaio NON ER
  const v=await misura(br,'ver200'), n=await misura(br,'dip');
  console.log('ver200',JSON.stringify({C:v.C,anc:v.anc,ris:v.ris,G:v.G,tetto:v.tetto})); console.log('ver201',JSON.stringify({C:n.C,anc:n.anc,ris:n.ris,G:n.G,tetto:n.tetto}));
  T('W01 ver200: C 82,333 (ore sett. ÷ giorni × 26)', v.C==='82,333', v.C);
  T('W02 ver201: C 82,500 = B (B ÷ 26 × 26 giorni)', n.C==='82,500', n.C);
  T('W03 Risultato del mese +6,500 → +6,333', /\+6,500/.test(v.ris) && /\+6,333/.test(n.ris), v.ris+' → '+n.ris);
  T('W04 capsula -3,334 → -3,167 (= C − G)', v.anc==='-3,334' && n.anc==='-3,167', v.anc+' → '+n.anc);
  T('W05 E e G identici (82,500 · 85,667)', v.E===n.E && v.G===n.G && /85,667/.test(n.G), n.G);
  T('W06 massimale 85,833 → 85,667 (= G)', v.tetto==='85,833' && n.tetto==='85,667', v.tetto+' → '+n.tetto);
  T('W07 riquadro cedolino: festività godute ancora 2 gg × 3,167 h', /2 gg × 3,167 h/.test(n.box), '');
  T('W08 riquadro cedolino: rendiconto 82,500 + 3,167 = 85,667', /82,500 \+ ore retribuite erosive 3,167 = 85,667 tolte dal massimale/.test(n.box));
  T('W09 zero errori di pagina', v.err===0 && n.err===0, v.err+'/'+n.err);
  SEME=semeGen(18,'3','3'); const v2=await misura(br,'ver200'), n2=await misura(br,'dip');
  T('W10 18 h su 6 gg, 26 giorni: C 78,000 → 78,158 (= B)', v2.C==='78,000' && n2.C==='78,158', v2.C+' → '+n2.C);
  console.log('\nRISULTATO: '+P+' superati, '+F+' falliti'); await br.close(); process.exit(F?1:0); })();
