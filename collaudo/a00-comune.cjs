/* Collaudo individuale Livello A — funzioni comuni (dati INVENTATI). Banco: bash collaudo/prepara-banco.sh ver182 */
const { chromium } = (function(){ try { return require('playwright'); } catch(e) { return require('/opt/node-tools/node_modules/playwright'); } })();
const fs=require('fs'), cp=require('child_process');
const BASE='http://127.0.0.1:8300';
const APPV=(fs.readFileSync(__dirname+'/../index.html','utf8').match(/const APP_VER = "(ver\d+)"/)||[])[1];
const OUT=__dirname+'/out'; try{ fs.mkdirSync(OUT,{recursive:true}); }catch(e){}
const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
function contatore(nome){ const r={P:0,F:0,nome}; r.T=(id,c,d)=>{ (c?r.P++:r.F++); console.log((c?'  OK  ':'  NO  ')+id+(d!==undefined?'  -> '+String(d).slice(0,300):'')); return c; };
  r.fine=()=>{ console.log('\n'+nome+': '+r.P+' superati, '+r.F+' falliti'); }; return r; }
/* stato di prova: persone inventate */
function giorniFeriali(y,m,val,escludiSab){ const g={}; const nd=new Date(y,m,0).getDate(); for(let d=1;d<=nd;d++){ const wd=new Date(y,m-1,d).getDay(); if(wd===0) continue; if(escludiSab&&wd===6) continue; g[d]=val; } return g; }
function statoBase(){ return { version:4, anni:[2025,2026], locked:{}, costoComune:{},
  dipendenti:[
    {id:'a',nome:'ALFA PROVA',oreSett:38,livello:'D1',tipoContratto:'indeterminato',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'01/01/2020',colore:'#00B0F0',ana:{cognome:'ALFA',nome:'PROVA'},tettiAnnui:[{id:'t1',ore:'500',periodo:'scolastico',anno:'2026'}]},
    {id:'b',nome:'BETA PROVA',oreSett:19,livello:'D2',tipoContratto:'determinato',scadenza:'31/12/2026',mensilizzato:true,mensilizzatoDal:'01/10/2026',dataAssunzione:'15/09/2025',colore:'#FFC000',ana:{cognome:'BETA',nome:'PROVA'}},
    {id:'c',nome:'GAMMA PROVA',oreSett:15,livello:'C1',tipoContratto:'indeterminato',mensilizzato:false,dataAssunzione:'01/03/2021',colore:'#9AD0C2',ana:{cognome:'GAMMA',nome:'PROVA'}}],
  dati:{
    '2025-12':{ a:{giorni:Object.assign(giorniFeriali(2025,12,'6'),{7:'FESTNG'})}, c:{giorni:Object.assign(giorniFeriali(2025,12,'3'),{7:'FESTNG'})} },
    '2026-09':{ a:{giorni:giorniFeriali(2026,9,'6,5')}, b:{giorni:giorniFeriali(2026,9,'3,5')}, c:{giorni:giorniFeriali(2026,9,'2,5')} },
    '2026-10':{ a:{giorni:Object.assign(giorniFeriali(2026,10,'6,5'),{5:'FERIE',6:'MAL',7:'MAL'})}, b:{giorni:Object.assign(giorniFeriali(2026,10,'4',true),{12:'ASS.ING'})}, c:{giorni:giorniFeriali(2026,10,'3')} },
    '2026-11':{ a:{giorni:{2:'6',3:'6'}} } } }; }
async function apri(br,opz){ opz=opz||{}; const ver=opz.ver||'dip'; const w=opz.w||1500;
  const ctx=opz.ctx||await br.newContext({viewport:{width:w,height:opz.h||1000},acceptDownloads:true}); const pg=await ctx.newPage(); const E=[];
  pg.on('pageerror',e=>E.push(e.message.slice(0,200))); pg.on('dialog',d=>{ (pg._dialoghi=pg._dialoghi||[]).push(d.message()); const r=pg._risposta; if(d.type()==='prompt') d.accept(r===undefined?'':String(r)); else if(r===false) d.dismiss(); else d.accept(); });
  if(opz.stato!==null){ const st=opz.stato||statoBase(); await pg.addInitScript(x=>{ if(!sessionStorage.getItem('_s')){ localStorage.clear(); if(x) localStorage.setItem('spazioireos_reportore_v1',JSON.stringify(x)); sessionStorage.setItem('_s','1'); } },st); }
  await pg.goto(BASE+'/'+ver+'/index.html',{waitUntil:'domcontentloaded'}); await pg.waitForFunction(()=>document.querySelector('.login-box,.app-header'),null,{timeout:60000}).catch(()=>{});
  await pg.waitForTimeout(300);
  if(opz.pin!==false) await entraPin(pg,'1234');
  return {ctx,pg,E}; }
async function entraPin(pg,pin){ const pins=pg.locator('.login-box input[type=password]'); const n=await pins.count(); if(!n) return;
  await pins.nth(0).fill(pin); if(n>=2) await pins.nth(1).fill(pin); await pg.locator('.login-box button').first().click(); await pg.waitForTimeout(1200); }
const TAB={ Gen:0,Feb:1,Mar:2,Apr:3,Mag:4,Giu:5,Lug:6,Ago:7,Set:8,Ott:9,Nov:10,Dic:11,rep:12,ana:13,costo:14,query:15 };
async function vai(pg,t){ await pg.locator('.tabs .tab').nth(typeof t==='number'?t:TAB[t]).click(); await pg.waitForTimeout(700); }
async function anno(pg){ return +(await pg.locator('.yearbar .yr').innerText()); }
async function annoA(pg,y){ for(let i=0;i<6;i++){ const a=await anno(pg); if(a===y) return; await pg.locator('.yearbar button').nth(a<y?1:0).click(); await pg.waitForTimeout(500); } }
const statoLS=(pg)=>pg.evaluate(()=>JSON.parse(localStorage.getItem('spazioireos_reportore_v1')||'null'));
/* cella del Tabellone: scheda per nome, giorno d */
const cella=(pg,nome,d)=>pg.locator('.emp-card').filter({has:pg.locator('.emp-head .nome',{hasText:nome})}).locator('table.cal tr').nth(2).locator("td").nth(d-1).locator("input.cell-in");
const carta=(pg,nome)=>pg.locator('.emp-card').filter({has:pg.locator('.emp-head .nome',{hasText:nome})});
async function conferma(pg,si){ const m=pg.locator('.overlay .modal'); await m.first().waitFor({timeout:3000}).catch(()=>{}); const t=await m.first().innerText().catch(()=>'');
  const b=m.first().locator('.modal-actions button'); const n=await b.count(); if(n){ await b.nth(si?n-1:0).click(); await pg.waitForTimeout(400); } return t; }
async function scarica(pg,azione,timeout){ const p=pg.waitForEvent('download',{timeout:timeout||20000}).catch(()=>null); await azione(); const dl=await p; if(!dl) return null;
  const f=OUT+'/'+dl.suggestedFilename(); await dl.saveAs(f); return {nome:dl.suggestedFilename(),f}; }
/* misure di grafica: scorrimento laterale, scritte <12,5px fuori dalle griglie, comandi <32px */
const misura=(pg)=>pg.evaluate(()=>{ const W=document.documentElement.clientWidth, SW=document.documentElement.scrollWidth;
  const dentro=(e)=>e.closest('table.cal,.grid-wrap,.co-scroll,.app-rev,.banner,.zoombar,.ced-tab,table.rep,.rep-scroll');
  let piccole=[]; document.querySelectorAll('body *').forEach(e=>{ if(!e.childNodes.length) return; const t=[...e.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).length; if(!t) return;
    const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return; const r=e.getBoundingClientRect(); if(!r.width||!r.height) return;
    if(parseFloat(cs.fontSize)<12.45 && !dentro(e)) piccole.push(cs.fontSize+':'+e.textContent.trim().slice(0,30)); });
  let bassi=0; document.querySelectorAll('button,input,select').forEach(e=>{ const r=e.getBoundingClientRect(); if(r.width&&r.height&&r.height<32 && !e.closest('table.cal,.grid-wrap') && e.type!=='checkbox' && e.type!=='radio' && e.type!=='range' && e.type!=='file') bassi++; });
  return {W,SW,lato:SW>W+1,piccole:piccole.length,esempi:piccole.slice(0,6),bassi,alt:document.documentElement.scrollHeight}; });
module.exports={chromium,BASE,APPV,OUT,sh,contatore,statoBase,giorniFeriali,apri,entraPin,TAB,vai,anno,annoA,statoLS,cella,carta,conferma,scarica,misura};
