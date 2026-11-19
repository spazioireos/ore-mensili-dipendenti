#!/bin/bash
# Ricostruisce da zero il banco di prova di Dipendenti (serve dopo che il contenitore di lavoro è stato ricreato).
#   bash collaudo/prepara-banco.sh [versione-di-confronto]
# Esempio: bash collaudo/prepara-banco.sh ver181   (la copia «congelata» si prende dalla storia git)
# Installa le stesse librerie che l'app carica da internet (react 18, babel standalone, xlsx, jsPDF 2.5.1 e
# autotable 3.8.2), costruisce il banco in collaudo/.banco e lo serve su http://127.0.0.1:8300.
set -e
cd "$(dirname "$0")"
mkdir -p .strumenti out
if [ ! -d .strumenti/node_modules/jspdf ]; then
  (cd .strumenti && echo '{"name":"strumenti-collaudo","private":true}' > package.json && npm i -s @babel/core@7.24.0 @babel/preset-react@7.23.3 react@18.2.0 react-dom@18.2.0 @babel/standalone@7.24.0 xlsx@0.18.5 jspdf@2.5.1 jspdf-autotable@3.8.2)
fi
python3 rigenera.py "${1:-}"
node controlla-sintassi.js ../index.html
if ! curl -s -o /dev/null http://127.0.0.1:8300/dip/index.html; then
  (cd .banco && setsid nohup python3 -m http.server 8300 --bind 127.0.0.1 </dev/null >/dev/null 2>&1 &)
  sleep 1
fi
echo "Banco pronto: http://127.0.0.1:8300/dip/index.html"
