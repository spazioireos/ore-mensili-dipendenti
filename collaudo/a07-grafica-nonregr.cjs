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
      if(w===1280){ const ta=a.out[nome].testo, tb=b.out[nome].testo; let i=0; while(i<ta.length&&ta[i]===tb[i]) i++;
        T('A07 non regressione a video, '+nome+': testo della vista identico alla ver182', ta===tb, ta===tb?'':('diverge al carattere '+i+': «'+ta.slice(Math.max(0,i-40),i+60)+'» vs «'+tb.slice(Math.max(0,i-40),i+60)+'»')); }
    }
    T('A07 '+w+'px zero errori di pagina (ver183)', a.E.length===0, a.E.join('|'));
    if(w===1280){ const ha=a.head.replace(/\s+/g,' '), hb=b.head.replace(/\s+/g,' ');
      T('A07 testata: rispetto alla ver182 cambiano SOLO targhetta e pulsanti dei report', ha.replace(/ver18\d · \d+nov26/,'').replace(/🖨️ Report PDF A4[^💾⬇⬆📊🔑]*/g,'')===hb.replace(/ver18\d · \d+nov26/,'').replace(/🖨️ Report PDF A4[^💾⬇⬆📊🔑]*/g,''), ha+' // '+hb); }
  }
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
