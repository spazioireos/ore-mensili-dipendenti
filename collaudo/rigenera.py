# Costruisce collaudo/.banco/dip (l'app di oggi) e, se richiesta, collaudo/.banco/<ver> (una versione vecchia
# presa dalla storia git cercando il commit che la introduce). Va rieseguito DOPO OGNI MODIFICA a index.html.
import io, os, re, subprocess, sys, shutil
QUI = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(QUI)
B = os.path.join(QUI, '.banco'); N = os.path.join(QUI, '.strumenti', 'node_modules')
LIB = {'react.js':'react/umd/react.production.min.js','react-dom.js':'react-dom/umd/react-dom.production.min.js',
       'babel.js':'@babel/standalone/babel.min.js','xlsx.js':'xlsx/dist/xlsx.full.min.js',
       'jspdf.js':'jspdf/dist/jspdf.umd.min.js','autotable.js':'jspdf-autotable/dist/jspdf.plugin.autotable.min.js'}
os.makedirs(os.path.join(B,'lib'), exist_ok=True)
for k,v in LIB.items(): shutil.copy(os.path.join(N,v), os.path.join(B,'lib',k))
io.open(os.path.join(B,'lib','stub.js'),'w').write('window.firebase=window.firebase||{};\n')
MAP=[('react-dom','../lib/react-dom.js'),('/react@','../lib/react.js'),('babel','../lib/babel.js'),('xlsx','../lib/xlsx.js'),
     ('autotable','../lib/autotable.js'),('jspdf/','../lib/jspdf.js')]
def localizza(src):
    out=[]; stub=False
    for ln in src.split('\n'):
        m=re.match(r'^\s*<script\b[^>]*src="(https?://[^"]+)"',ln)
        if m:
            u=m.group(1); r=next((l for p,l in MAP if p in u),None)
            if r: out.append('<script src="%s"></script>'%r)
            elif not stub: out.append('<script src="../lib/stub.js"></script>'); stub=True
            else: out.append('')
            continue
        out.append(ln)
    d='\n'.join(out)
    # modalità locale con PIN, senza Firebase: i dati di prova si mettono in localStorage
    return d.replace('const FB_READY = firebaseConfig.projectId && firebaseConfig.apiKey;','const FB_READY = false; // BANCO DI PROVA')
def scrivi(nome, src):
    os.makedirs(os.path.join(B,nome), exist_ok=True)
    io.open(os.path.join(B,nome,'index.html'),'w',encoding='utf-8').write(localizza(src)); print('banco:', nome)
scrivi('dip', io.open(os.path.join(REPO,'index.html'),encoding='utf-8').read())
ver = sys.argv[1] if len(sys.argv)>1 else ''
if ver:
    log = subprocess.run(['git','-C',REPO,'log','--format=%H','-S','const APP_VER = "%s"'%ver,'--','index.html'],capture_output=True,text=True).stdout.split()
    if not log: sys.exit('versione %s non trovata nella storia git' % ver)
    ref = log[-1]   # il commit che ha introdotto quella versione
    src = subprocess.run(['git','-C',REPO,'show',ref+':index.html'],capture_output=True,text=True).stdout
    scrivi(ver, src)
