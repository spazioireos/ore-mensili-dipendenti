/* A08 — ritest delle correzioni ver176-ver183 non coperte altrove: testi ver179, fascia del titolo, Tetto annuo = motore,
   + Dipendente, eliminazione con conferma, cloud sospeso solo in modalità cloud (dati INVENTATI). */
const K=require('./a00-comune.cjs'); const R=K.contatore('a08-ritest-storici'); const T=R.T;
const ver=process.argv[2]||'dip';
(async()=>{ const br=await K.chromium.launch({args:['--no-sandbox']});
  const {ctx,pg,E}=await K.apri(br,{ver,w:1280});
  let tutto=''; let titoli='';
  for(const t of ['Ott','rep','ana','costo','query']){ await K.vai(pg,t); tutto+=' '+(await pg.locator('body').innerText());
    titoli+=' '+await pg.evaluate(()=>[...document.querySelectorAll('[title]')].map(e=>e.getAttribute('title')).join(' ')); }
  const apos=(tutto+' '+titoli).match(/\b(e|piu|li|finche|gia|anzianita|FESTIVITA|perche|cosi|puo|sara|verra)'(?=[\s.,;:)]|$)/g)||[];
  T('A08.01 ver179: nessun accento scritto con l\'apostrofo nelle 5 viste e nei suggerimenti (esclusi i valori salvati «DA LUNEDI\'…»)', apos.length===0, apos.slice(0,8).join(' | '));
  T('A08.02 ver179: la legenda non dice «crimson» né un codice colore', !/crimson|#B22222/i.test(tutto));
  await K.vai(pg,'Ott'); const tipMese=await pg.locator('.emp-head .pill').filter({hasText:'ORE CONTRATTUALI'})   /* ver185: «ORE MESE» → «ORE CONTRATTUALI» (Christian) */.first().getAttribute('title');
  T('A08.03 ver179: il suggerimento di «ORE CONTRATTUALI» (era «ORE MESE») non nomina la Banca ore', !/Banca ore/i.test(tipMese||''), tipMese);
  const fs=await pg.evaluate(()=>{ const s=document.querySelector('.monthstrip').getBoundingClientRect(), h=document.querySelector('.app-header').getBoundingClientRect(); return {s:[s.left,s.right],h:[h.left,h.right],W:document.documentElement.clientWidth}; });
  T('A08.04 ver179: la fascia scura del titolo arriva al bordo destro', Math.abs(fs.s[1]-fs.W)<=1 && fs.s[0]<=1, JSON.stringify(fs));
  /* Tetto annuo = motore */
  const tet=await pg.evaluate(()=>{ const st=JSON.parse(localStorage.getItem('spazioireos_reportore_v1')); const dp=st.dipendenti.find(d=>d.id==='a'); return R2(consumoTetto(st,dp,2026,10),3); });
  const txtA=(await K.carta(pg,'ALFA PROVA').innerText()).replace(/\s+/g,' '); const gu=/Già usate: ([\d.,]+) h/.exec(txtA);
  T('A08.05 ver174: Tetto annuo «Già usate» = consumoTetto del motore (set rese + ott ore a cedolino + erosive)', gu && Math.abs(parseFloat(gu[1].replace(/\./g,'').replace(',','.'))-tet)<0.0015, (gu&&gu[1])+' vs '+tet);
  /* + Dipendente */
  await pg.getByRole('button',{name:'+ Dipendente'}).click(); await pg.waitForTimeout(500);
  const s2=await pg.locator('.monthstrip').innerText(); const nd=(await pg.locator('.ana-sheet').innerText()).indexOf('NUOVO DIPENDENTE')!==-1;
  T('A08.06 «+ Dipendente» crea la scheda e apre l\'Anagrafica (nasce mensilizzato dal 01/10/2026)', /Anagrafica/.test(s2) && nd && /01\/10\/2026/.test(await pg.locator('.ana-sheet').innerText()));
  /* elimina con conferma */
  await K.vai(pg,'Ott'); const nPrima=await pg.locator('.emp-card').count();
  await K.carta(pg,'GAMMA PROVA').locator('.emp-head button[title="Elimina definitivamente"]').click(); const c1=await K.conferma(pg,false);
  T('A08.07 🗑 dipendente: conferma che suggerisce la cessazione; annullando resta', /DEFINITIVAMENTE/.test(c1) && /cessazione/.test(c1) && await pg.locator('.emp-card').count()===nPrima);
  await K.carta(pg,'GAMMA PROVA').locator('.emp-head button[title="Elimina definitivamente"]').click(); await K.conferma(pg,true); await pg.waitForTimeout(300);
  T('A08.08 confermando sparisce (solo in memoria)', await K.carta(pg,'GAMMA PROVA').count()===0 && (await K.statoLS(pg)).dipendenti.some(d=>d.id==='c'));
  /* ver179 cloud sospeso: funzioni presenti, ma il percorso si prova solo con Firebase */
  const fz=await pg.evaluate(()=>[typeof cloudSospesoLeggi,typeof cloudSospesoSegna,typeof cloudSospesoTogli].join(','));
  T('A08.09 ver179: le funzioni del cloud sospeso esistono (percorso NON verificabile in modalità locale)', fz==='function,function,function', fz);
  T('A08.10 zero errori di pagina', E.length===0, E.join('|'));
  R.fine(); await br.close(); })().catch(e=>{ console.error(e); process.exit(1); });
