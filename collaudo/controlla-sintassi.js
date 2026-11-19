// Compila con Babel il blocco <script type="text/babel"> di index.html e passa il risultato a node --check.
// Uso: node collaudo/controlla-sintassi.js index.html   (richiede prepara-banco.sh almeno una volta)
const fs=require('fs'), path=require('path'), cp=require('child_process');
const N=path.join(__dirname,'.strumenti','node_modules'); const babel=require(path.join(N,'@babel/core'));
const lines=fs.readFileSync(process.argv[2],'utf8').split('\n'); let st=-1,en=-1;
for(let i=0;i<lines.length;i++){ if(st===-1&&lines[i].indexOf('type="text/babel"')!==-1){st=i+1;continue;} if(st!==-1&&lines[i].trim()==='</script>'){en=i;break;} }
const out=babel.transformSync(lines.slice(st,en).join('\n'),{filename:'app.jsx',presets:[require(path.join(N,'@babel/preset-react'))],configFile:false,babelrc:false,compact:true});
const f=path.join(__dirname,'out','compilato.js'); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,out.code);
cp.execFileSync(process.execPath,['--check',f]); console.log('Babel e node --check: OK ('+out.code.length+' byte)');
