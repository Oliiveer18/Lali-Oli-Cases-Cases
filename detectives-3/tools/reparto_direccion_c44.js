// c4-4 (cp. 255): dirección de los rechazos de reparto Oli/Lali con 1 intento. Uso: node tools/reparto_direccion_c44.js [N=300]  (GEN_VERSION 7 en memoria; solo lectura, no toca src/)
const P=require('path').join(__dirname,'..')+'/';
const G=require(P+'tools/load_g.js')(['bible.js','gen_data.js','gen_truth.js','gen_clues.js','compile.js']);
G.GEN_VERSION=7; G.GEN_MAX_ATTEMPTS=1;
const orig=G.workIssues; let last=null;
G.workIssues=(d,b)=>{const r=orig(d,b); last={r,w:G.workShare(d)}; return r;};
const N=+process.argv[2]||300, out={};
['facil','normal','dificil'].forEach(L=>{
  const o={n:0,rej:0,reparto:0,oliBajo:0,oliAlto:0,soloTiempo:0,soloNum:0,ambos:0,sinPareja:0,numBajo:0,numAlto:0,tBajo:0,tAlto:0,oliNums:[]};
  for(let i=1;i<=N;i++){
    const sd=i*7919+1; last=null;
    const r=G.generateCase(sd,{level:L}); o.n++;
    if(!r.error) continue; o.rej++;
    const why=(r.fails[0]||{}).why||''; if(!/reparto_caso/.test(why)) continue;
    o.reparto++;
    const is=last&&last.r||[]; const ax={};
    is.forEach(x=>{ax[x.axis]=x.oli});
    const num=ax.numero, tim=ax.tiempo;
    if(num!==undefined){ num<40?o.numBajo++:o.numAlto++; }
    if(tim!==undefined){ tim<40?o.tBajo++:o.tAlto++; }
    if(num!==undefined&&tim!==undefined)o.ambos++; else if(tim!==undefined)o.soloTiempo++; else if(num!==undefined)o.soloNum++;
    if(is.some(x=>x.oli===null))o.sinPareja++;
  }
  out[L]=o;
});
console.log(JSON.stringify(out,null,1));
