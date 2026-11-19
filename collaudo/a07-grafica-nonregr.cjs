/* A07 — grafica a 390 · 1280 · 1700 px su tutte le viste, e non regressione a video contro la ver182 congelata (dati INVENTATI).
   Prima: bash collaudo/prepara-banco.sh ver182 */
const K=require('./a00-comune.cjs'); const R=K.contatore('a07-grafica-nonregr'); const T=R.T;
const VISTE=[['Tabellone ott 2026','Ott',2026],['Tabellone dic 2025','Dic',2025],['Riepiloghi','rep',2026],['Anagrafica','ana',2026],['Costo orario','costo',2026],['Query personale','query',2026]];
async function giro(br,ver,w){ const {ctx,pg,E}=await K.apri(br,{ver,w}); const out={};
  for(const [nome,t,y] of VISTE){ await K.annoA(pg,y); await K.vai(pg,t); await pg.waitForTimeout(300);
    const m=await K.misura(pg); const testo=(await pg.locator('.content').innerText()).replace(/\s+/g,' ');
    out[nome]={m,testo}; }
  const head=await pg.locator('.app-header').innerText(); await ctx.close(); return {out,E,head}; }
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  for(const w of [390,1280,1700]){
    const a=await giro(br,'dip',w), b=await giro(br,'ver182',w);
    for(const [nome] of VISTE){ const A=a.out[nome].m, B=b.out[nome].m;
      T('A07 '+w+'px '+nome+': nessuno scorrimento laterale', !A.lato, A.SW+'/'+A.W);
      T('A07 '+w+'px '+nome+': scritte <12,5px fuori dalle griglie non aumentate rispetto alla ver182 ('+A.piccole+' vs '+B.piccole+')', A.piccole<=B.piccole, A.esempi.join(' | '));
      T('A07 '+w+'px '+nome+': comandi <32px non aumentati ('+A.bassi+' vs '+B.bassi+')', A.bassi<=B.bassi);
      /* ver185: le ore si scrivono a TRE decimali e due diciture sono cambiate (scelte da Christian il 19/11/2026):
         si riportano le due diciture a com'erano, poi si confrontano le PAROLE identiche e i NUMERI uno per uno, con
         la tolleranza del mezzo centesimo (3,167 contro 3,17). Qualunque altra parola o numero diverso lo fa cadere. */
      const dic=(t)=>t.replace(/ORE DA FAR RISULTARE NEL TOTALE PER AVERE LE ORE CONTRATTUALI/g,'ORE CORRETTE DA DARE').replace(/ORE CONTRATTUALI/g,'ORE MESE').replace(/ore contrattuali/g,'ore mese');
      const RX=/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
      const pezzi=(t)=>({ parole:dic(t).split(RX), numeri:(dic(t).match(RX)||[]).map(x=>parseFloat(x.replace(/\./g,'').replace(',','.'))) });
      if(w===1280){ const A2=pezzi(a.out[nome].testo), B2=pezzi(b.out[nome].testo); let dove='';
        if(A2.parole.length!==B2.parole.length) dove='numero di pezzi '+A2.parole.length+' vs '+B2.parole.length;
        else { for(let k=0;k<A2.parole.length && !dove;k++){ if(A2.parole[k]!==B2.parole[k]) dove='parole: «'+A2.parole[k].slice(0,80)+'» vs «'+B2.parole[k].slice(0,80)+'»';
          else if(k<A2.numeri.length && Math.abs(A2.numeri[k]-B2.numeri[k])>0.0051) dove='numero dopo «'+A2.parole[k].slice(-40)+'»: '+A2.numeri[k]+' vs '+B2.numeri[k]; } }
        T('A07 non regressione a video, '+nome+': testo della vista identico alla ver182 (a meno dei decimali e delle due diciture nuove)', !dove, dove); }
    }
    T('A07 '+w+'px zero errori di pagina (ver183)', a.E.length===0, a.E.join('|'));
    if(w===1280){ const ha=a.head.replace(/\s+/g,' '), hb=b.head.replace(/\s+/g,' ');
      T('A07 testata: rispetto alla ver182 cambiano SOLO targhetta e pulsanti dei report', ha.replace(/ver18\d · \d+nov26/,'').replace(/🖨️ Report PDF A4[^💾⬇⬆📊🔑]*/g,'')===hb.replace(/ver18\d · \d+nov26/,'').replace(/🖨️ Report PDF A4[^💾⬇⬆📊🔑]*/g,''), ha+' // '+hb); }
  }
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
