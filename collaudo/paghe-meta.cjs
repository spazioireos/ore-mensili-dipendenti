/* ver208: il «Report PDF A4 per le paghe» ha DUE persone affiancate per foglio A4 orizzontale. Le prove scritte per «una persona per
   pagina» leggono il testo di ogni METÀ foglio come se fosse una pagina: testoPaghe(file) restituisce il testo delle mezze pagine non
   vuote separate da \f (pagine = quante persone, fogli = quanti fogli A4). Un foglio con una persona sola a tutta larghezza
   (ripiego della ver208) qui risulterebbe tagliato: con i dati inventati delle prove non succede. */
const cp=require('child_process'); const sh=(c)=>cp.execSync(c,{encoding:'utf8'});
function testoPaghe(f){ const fogli=+(/^Pages:\s+(\d+)/m.exec(sh('pdfinfo '+JSON.stringify(f)))||[0,0])[1]; const p=[];
  const pezzo=(i,x)=>sh('pdftotext -layout -f '+i+' -l '+i+' -x '+x+' -y 0 -W 421 -H 595 '+JSON.stringify(f)+' -');
  for(let i=1;i<=fogli;i++){ const sx=pezzo(i,0);
    /* foglio a mezze pagine se la metà sinistra ha già l'ultima colonna («Non retribuite»); altrimenti (versioni fino alla
       ver207, o una persona sola a tutta larghezza) il foglio si legge intero */
    if(/Non retribuite/.test(sx)){ for(const t of [sx, pezzo(i,421)]) if(t.trim()) p.push(t); }
    else { const t=sh('pdftotext -layout -f '+i+' -l '+i+' '+JSON.stringify(f)+' -'); if(t.trim()) p.push(t); } }
  return { txt:p.join('\f'), pagine:p.length, fogli }; }
const ePaghe=(nome)=>/cedolino/i.test(String(nome||''));
module.exports={ testoPaghe, ePaghe };
