// c4-4 (cp. 255): uso de cada herramienta, reparto de Oli, reintentos y casos sin caso por nivel. Uso: node tools/bandas_c44.js [N=100]  (GEN_VERSION 7 en memoria; solo lectura)
const P=require('path').join(__dirname,'..')+'/';
const sw=process.argv[3]==='off';
const G=require(P+'tools/load_g.js')(['bible.js','gen_data.js','gen_truth.js','gen_clues.js','compile.js']);
G.GEN_VERSION=7; if(sw) G.GEN_DATA&&0;
const N=+process.argv[2]||60;
['facil','normal','dificil'].forEach(L=>{
 const a={n:0,err:0,att:0,lupa:0,ganzua:0,uv:0,grabadora:0,oli:0,fuera:0,minOli:100,maxOli:0};
 for(let i=1;i<=N;i++){
  const r=G.generateCase(i*7919+1,{level:L}); if(r.error){a.err++;continue;} a.n++; a.att+=r.attempts;
  const t={lupa:0,ganzua:0,uv:0,grabadora:0}; Object.values(r.def.rooms).forEach(rm=>(rm.props||[]).forEach(p=>(p.steps||[]).forEach(s=>{if(t[s.tool]!==undefined)t[s.tool]++;})));
  for(const k in t)a[k]+=t[k];
  const o=100*(t.lupa+t.ganzua)/(t.lupa+t.ganzua+t.uv+t.grabadora); a.oli+=o; if(o<40||o>60)a.fuera++; a.minOli=Math.min(a.minOli,o); a.maxOli=Math.max(a.maxOli,o);
 }
 const f=x=>(x/a.n).toFixed(2);
 console.log(L,`n=${a.n} err=${a.err} intentos=${f(a.att)} lupa=${f(a.lupa)} ganzua=${f(a.ganzua)} uv=${f(a.uv)} grab=${f(a.grabadora)} Oli=${(a.oli/a.n).toFixed(1)}% [${a.minOli.toFixed(0)}-${a.maxOli.toFixed(0)}] fuera40-60=${a.fuera}`);
});
