// ver210 — Dipendenti rilegge da Fogli ore dopo 5 minuti (elenco operatori e dati del mese), senza ricaricare la pagina.
// Banco COMUNE con finta Firebase (rendicontazione-usoint/collaudo/comune, porta 8340); confronto con la ver209
// congelata in /dip209/ (localizza.py su `git show <commit ver209>:index.html`). Il tempo si fa avanzare con Date.now.
// SOLO DATI INVENTATI.   NODE_PATH=/opt/node-tools/node_modules node collaudo/ver210.cjs
const K = require('/home/user/rendicontazione-usoint/collaudo/interconnessioni/ic-01-comune.cjs');
const { FO, ADMIN, PWD, ADMIN_UID, chk } = K;
const MENS = { mensilizzato: true, mensilizzatoDal: '01/10/2026' };
const ST = { version: 4, anni: [2026], locked: {}, costoComune: {},
  dipendenti: [K.dipendente('d1', 'ROSSI MARIO', Object.assign({ foUid: 'W1' }, MENS))],
  dati: { '2026-11': { d1: { giorni: K.giorniFeriali(2026, 11, '4') } }, '2026-10': { d1: { giorni: K.giorniFeriali(2026, 10, '4') } } } };
const TS = (chiuso, risp) => Object.assign({ workerUid: 'W1', year: 2026, month: 11, days: { 3: { t1f: '08:00', t1t: '12:00' } } },
  chiuso ? { meseChiuso: true, meseChiusoAt: '2026-12-01T09:00:00.000Z', workerConfirmed: true, workerConfirmedAt: '2026-12-01T09:00:00.000Z', completamento: risp } : {});
const docs = Object.assign({}, K.utenteFO(ADMIN_UID, ADMIN, 'AMMINISTRAZIONE', 'PROVA', 'admin'), K.utenteFO('W1', 'rossi@prova.it', 'ROSSI', 'MARIO'),
  { 'timesheets/W1__2026_11_0': TS(false) }, { ['report-ore-mensile/' + ADMIN_UID]: ST });
const seed = (id) => ({ id, [FO]: { reset: true, users: [{ email: ADMIN, password: PWD, uid: ADMIN_UID }, { email: 'rossi@prova.it', password: PWD, uid: 'W1' }], docs } });
const tempo = () => { const o = Date.now; window.__dt = 0; Date.now = function () { return o() + window.__dt; }; };

async function entra(page, cartella) {
  await page.goto(K.URL + cartella + '/');
  await page.waitForSelector('.login-box input, .app-header', { timeout: 40000 });
  if (await page.$('.login-box input[type=password]')) { const i = page.locator('.login-box input'); await i.nth(0).fill(ADMIN); await i.nth(1).fill(PWD); await page.click('.login-box button'); }
  await page.waitForSelector('.app-header', { timeout: 40000 }); await K.attesa(1500);
}
async function pill(page) {
  await K.attesa(1200);
  return page.evaluate(() => { const p = document.querySelector('.emp-head .chiu-pill'); return p ? p.textContent.trim() : '(nessuna)'; });
}
const vai = async (page) => { await K.dipMese(page, 'Ott'); await K.dipMese(page, 'Nov'); };
const cambia = (page, ts) => page.evaluate(([p, d]) => __fakefb.seed(p, { 'timesheets/W1__2026_11_0': d }), [FO, ts]);
const avanza = (page, ms) => page.evaluate(ms => { window.__dt += ms; }, ms);

(async () => {
  const browser = await K.chromium.launch();
  /* ---------- ver209: la pastiglia resta quella del primo accesso ---------- */
  {
    const ctx = await K.contesto(browser, { seed: seed('v210-old') }); await ctx.addInitScript(tempo);
    const d = await K.pagina(ctx); await entra(d, 'dip209'); await K.dipMese(d, 'Nov');
    const p0 = await pill(d); await cambia(d, TS(true, 'si')); await avanza(d, 301000); await vai(d);
    const p1 = await pill(d);
    chk('V00', 'ver209 (confronto)', 'pastiglia dopo la chiusura in Fogli ore', 'resta vecchia (difetto riprodotto)', 'invariata', p0 + ' → ' + p1, p0 === p1 && /non ancora chiuso/.test(p1));
    await ctx.close();
  }
  /* ---------- ver210 ---------- */
  const ctx = await K.contesto(browser, { seed: seed('v210-new') }); await ctx.addInitScript(tempo);
  const d = await K.pagina(ctx); await entra(d, 'dip'); await K.dipMese(d, 'Nov');
  chk('V01', 'Dipendenti', 'targhetta', 'ver210', 'ver210', await d.evaluate(() => APP_VER), (await d.evaluate(() => APP_VER)) === 'ver210');
  let p = await pill(d);
  chk('V02', 'Fogli ore → Dipendenti', 'pastiglia iniziale', 'mese non ancora chiuso', '«Mese non ancora chiuso in Fogli ore»', p, /non ancora chiuso/.test(p));
  const casi = [[TS(true, 'si'), /Chiede ferie\/permessi/], [TS(true, 'no'), /Lascia così/], [TS(false), /non ancora chiuso/]];
  for (let c = 0; c < 3; c++) {
    await cambia(d, casi[c][0]);
    await avanza(d, 60000); await vai(d); p = await pill(d);
    const prima = p;
    chk('V03.' + (c + 1), 'Dipendenti', 'prima dei 5 minuti', 'resta la lettura precedente', 'come prima', prima, !casi[c][1].test(prima));
    await avanza(d, 250000); await vai(d); p = await pill(d);
    chk('V04.' + (c + 1), 'Fogli ore → Dipendenti', 'dopo 5 minuti, tornando sul mese', 'pastiglia aggiornata senza ricaricare', String(casi[c][1]), p, casi[c][1].test(p));
  }
  /* rilettura caduta: si tengono i dati di prima, nessun messaggio di errore */
  await cambia(d, TS(true, 'si')); await avanza(d, 301000);
  await d.evaluate(() => { __fakefb.failReads = true; }); await vai(d); p = await pill(d);
  const errTxt = await d.evaluate(() => /confronto Fogli ore non disponibile/.test(document.body.innerText));
  chk('V05', 'Dipendenti', 'rilettura caduta dopo 5 minuti', 'tiene la pastiglia di prima, niente errore a video', 'non ancora chiuso · nessun errore', p + ' · errore a video: ' + errTxt, /non ancora chiuso/.test(p) && !errTxt);
  await d.evaluate(() => { __fakefb.failReads = false; }); await avanza(d, 301000); await vai(d); p = await pill(d);
  chk('V06', 'Dipendenti', 'tornata la linea, dopo 5 minuti', 'pastiglia aggiornata', 'Chiede ferie/permessi', p, /Chiede ferie\/permessi/.test(p));
  /* un account nuovo in Fogli ore entra nell'elenco senza ricaricare (aggancio) */
  const w = await d.evaluate(f => __fakefb.log.filter(o => /set|update|delete|batch|commit/i.test(o.op) && /^(users|timesheets)\//.test(o.path || '')).length, FO);
  chk('V07', 'Dipendenti', 'Fogli ore: users/timesheets', 'nessuna scrittura', '0', String(w), w === 0);
  chk('V08', 'Dipendenti', 'errori di pagina', '0', '0', String(d.__errori.length) + ' ' + d.__errori.join(' | ').slice(0, 200), d.__errori.length === 0);
  await browser.close();
  K.riepilogo('ver210');
})();
