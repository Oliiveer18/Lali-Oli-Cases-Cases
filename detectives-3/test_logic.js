// Prueba de COHERENCIA LÓGICA de los casos generados (auditoría v0.7.17). Va más allá del validador: comprueba que la historia tiene sentido.
// Testigos que de verdad estaban allí y no mienten, horas dentro de la franja, pistas físicas en el lugar que nombran, coartadas que cuadran
// con la cronología, y que solo el culpable confiesa y solo ante las pruebas que lo señalan. Uso: node test_logic.js [semillas]
const G=require('./tools/load_g.js')(['bible.js','gen_data.js','gen_truth.js','gen_clues.js','compile.js','report.js','fingerprint.js']);
const N=+process.argv[2] || (+process.env.SEEDS ? Math.min(2000, +process.env.SEEDS) : 2000), F={}, ex={};
let bad0=0;
const bad=(k,s,m)=>{F[k]=(F[k]||0)+1;if(!ex[k])ex[k]=`semilla ${s}: ${m}`;};
const ov=(a,b,c,d)=>a<d&&c<b;
for(let s=0;s<N;s++){
 const r=G.generateCase(s);if(r.error){bad('generacion',s,r.error);continue;}
 const b=r.bible,def=r.def,tl=b.truth.timeline,cu=b.truth.culprit,w=b.truth.window,cli=b.cast.find(c=>c.role==='cliente').id;
 const liars=new Set(b.lies.map(l=>l.who)), dec=new Set((b.deceptive||[]).map(d=>d.who));
 const slotsOf=(who,place)=>tl.filter(e=>e.who===who&&(!place||e.place===place));
 b.clues.forEach(c=>{
  const e=c.derivedFrom!=null?tl[c.derivedFrom]:null;
  // A. pista de objeto puesta en el lugar de su franja (si deriva de una)
  if(e&&c.source.type==='prop'&&c.role==='descarte'&&c.kind==='física'&&c.source.place!==e.place)bad('A_descarte_lugar',s,`${c.id} en ${c.source.place} pero la franja es ${e.place}`);
  if(e&&c.source.type==='prop'&&c.role==='refuta'&&c.kind==='física'&&c.source.place!==e.place)bad('A_refuta_lugar',s,`${c.id} en ${c.source.place}, franja ${e.place}`);
  if(c.id==='rastro'&&c.source.place!==w.place)bad('A_rastro_lugar',s,c.source.place+' vs '+w.place);
  if(c.id==='escondite'){const h=tl.find(x=>x.who===cu&&/Esconde/.test(x.doing));if(!h||h.place!==c.source.place)bad('A_escondite_lugar',s,`${c.source.place} vs ${h&&h.place}`);
     const hm=G.GEN_DATA.hideAt[h&&h.place];if(hm&&!c.text.includes(hm))bad('A_escondite_texto',s,c.text);}
  // C. horas del texto dentro de la franja derivada
  const hs=(c.text.match(/\b\d\d:\d\d\b/g)||[]).map(G.strToMin);
  if(hs.length&&e)hs.forEach(m=>{if(m<e.t||m>e.until)bad('C_hora_fuera',s,`${c.id} ${G.minToStr(m)} fuera de ${G.minToStr(e.t)}-${G.minToStr(e.until)}`);});
  if(hs.length&&!e)bad('C_hora_sin_franja',s,c.id);
  // B/F. testigo: el personaje que cuenta estaba donde dice, a esa hora
  if(c.source.type==='npc'&&e&&/^ausente_/.test(c.id)){ // 4A testigos cruzados: estuvo donde el culpable DICE haber estado, toda la ventana, sin mentir, y el culpable no estaba
   const wit=c.source.npc, ac=b.alibis[cu].claim;
   if(!slotsOf(wit,ac.place).some(x=>x.t<=w.from&&x.until>=w.to))bad('AA_ausente_no_estaba_en_la_coartada',s,`${c.id}: ${wit} no cubre la ventana en ${ac.place}`);
   if(liars.has(wit))bad('AA_ausente_miente',s,c.id);
   if(slotsOf(cu,ac.place).some(x=>ov(x.t,x.until,w.from,w.to)))bad('AA_culpable_si_estaba',s,c.id);
   if(!c.text.includes(G.GEN_DATA.places.find(p=>p.id===ac.place).loc))bad('AA_ausente_sin_lugar',s,c.id+' '+c.text);
  } else if(c.source.type==='npc'&&e){
   const wit=c.source.npc, ok=slotsOf(wit,e.place).some(x=>ov(x.t,x.until,e.t,e.until));
   if(!ok&&c.role!=='falsa')bad('B_testigo_ausente',s,`${c.id}: ${wit} no estaba en ${e.place} entre ${G.minToStr(e.t)}-${G.minToStr(e.until)}`);
   if(wit===e.who)bad('B_testigo_de_si_mismo',s,c.id);
   if(c.role==='descarte'&&(wit===cu))bad('M_descarte_por_culpable',s,c.id);
   if(c.role==='descarte'&&liars.has(wit))bad('M_descarte_por_mentiroso',s,c.id+' '+wit);
   if(c.role==='prueba'&&liars.has(wit))bad('N_prueba_por_mentiroso',s,c.id+' '+wit);
  }
  // un objeto físico no nombra un lugar distinto del que ocupa
  if(c.source.type==='prop'&&c.kind==='física'&&c.id!=='imposible'){G.GEN_DATA.places.forEach(p=>{if(p.id!==c.source.place&&(c.text.includes(p.loc)||c.text.includes(p.name+')')))bad('P_fisica_nombra_otro_lugar',s,c.id+' en '+c.source.place+': '+c.text);});}
  if(c.role==='refuta'&&c.source.type==='prop'){G.GEN_DATA.places.forEach(p=>{if(p.id!==c.source.place&&(c.text.includes(p.loc)||c.text.includes(' '+p.name)))bad('P_refuta_nombra_otro_lugar',s,c.id+' en '+c.source.place+': '+c.text);});}
 });
 // G/H. lo que dice un sospechoso que no miente cuadra con la cronología
 Object.keys(b.alibis).forEach(id=>{const a=b.alibis[id];
  const cov=slotsOf(id,a.claim.place).some(x=>x.t<=a.claim.from&&x.until>=a.claim.to)||slotsOf(id,a.claim.place).reduce((m,x)=>m+Math.max(0,Math.min(x.until,a.claim.to)-Math.max(x.t,a.claim.from)),0)>=a.claim.to-a.claim.from;
  if(!liars.has(id)&&!cov)bad('H_coartada_no_cuadra',s,id);
  if(liars.has(id)&&cov)bad('H_mentira_en_realidad_cierta',s,id);
  if(a.claim.to<=a.claim.from)bad('H_claim_vacio',s,id);
 });
 // 4A. desliz: lo cuenta quien estaba en el lugar del robo y nombra el escondite real; objeto imposible: está en el escondite y es del lugar del robo
 b.clues.filter(c=>/^desliz_/.test(c.id)).forEach(c=>{const h=tl.find(x=>x.who===cu&&/Esconde/.test(x.doing));if(!h||!c.text.includes(G.GEN_DATA.hideAt[h.place]))bad('AB_desliz_sin_escondite',s,c.text);if(liars.has(c.source.npc)||c.source.npc===cu)bad('AB_desliz_testigo_malo',s,c.id);});
 b.clues.filter(c=>c.id==='imposible').forEach(c=>{const h=tl.find(x=>x.who===cu&&/Esconde/.test(x.doing));
   if(!h||c.source.place!==h.place)bad('AC_imposible_fuera_del_escondite',s,c.id);
   if(!G.GEN_DATA.impossible[w.place].some(it=>c.text.toLowerCase().includes(it.toLowerCase())))bad('AC_imposible_no_es_del_lugar_del_robo',s,c.text);});
 // 4A. engañosos: el culpable no es engañoso, no son testigos del robo, siguen en otro lugar durante la ventana y su explicación es la actividad que hacían
 b.deceptive.forEach(d=>{
   if(d.who===cu)bad('AD_culpable_enganoso',s,d.who);
   if(b.clues.some(c=>c.role==='prueba'&&c.source.type==='npc'&&c.source.npc===d.who))bad('AD_enganoso_testigo',s,d.who);
   const inW=tl.find(x=>x.who===d.who&&x.place!==w.place&&ov(x.t,x.until,w.from,w.to));
   if(!inW||inW.doing!==d.why)bad('AD_explicacion_no_es_su_actividad',s,d.who+': '+d.why);
   if(!def.suspects.find(x=>x.id===d.who).clearedBy.length)bad('AD_enganoso_sin_descarte_en_def',s,d.who);});
 if(G.caseFingerprint&&G.caseFingerprint(def,b).decoy!==String(b.deceptive.length))bad('AD_huella_no_coincide',s,'');
 // el culpable no puede tener descarte; los inocentes en la ventana no están en el lugar
 if(b.alibis[cu].clearedBy)bad('culpable_con_descarte',s,'');
 // E. alcanzable: cada npc con tema de pista está colocado; cada sala conectada
 Object.keys(def.npcs).forEach(id=>{if(!def.placement[id])bad('E_sin_colocacion',s,id);});
 const P=Object.keys(def.rooms);P.forEach(p=>{const d=def.rooms[p].doors.length;if(!d)bad('E_sala_aislada',s,p);});
 // I. el cliente no es sospechoso ni culpable ni mentiroso
 if(liars.has(cli)||cu===cli)bad('I_cliente',s,'');
 // O. un mismo personaje en 2 sitios (por si acaso) y nadie en el lugar del robo durante la ventana salvo culpable
 tl.filter(e=>e.place===w.place&&ov(e.t,e.until,w.from,w.to)&&e.who!==cu).forEach(e=>bad('O_otro_en_ventana',s,e.who));
 // reacciones por prueba: solo el culpable confiesa, y solo ante las pruebas
 Object.keys(def.npcs).forEach(id=>{const ev=def.npcs[id].evidence,ks=Object.keys(ev).filter(k=>k!=='*');const conf=ks.filter(k=>/me pillaron|lo hice yo/i.test(JSON.stringify(ev[k])));
  if(id===cu){if(ks.sort().join()!==b.proof.slice().sort().join())bad('R_culpable_evidencia',s,ks.join());if(/lo hice yo/.test(JSON.stringify(ev['*'])))bad('R_culpable_confiesa_a_todo',s,'');}
  else if(/lo hice yo/.test(JSON.stringify(ev)))bad('R_inocente_confiesa',s,id);
  else if(!liars.has(id)&&ks.length&&!(dec.has(id)&&ks.every(k=>k.indexOf('falsa_'+id)===0)))bad('R_honesto_con_evidencia',s,id);});
 // el personaje no habla de sí mismo en tercera persona al contar lo que vio, y el epílogo no tiene mayúsculas fuera de sitio
 Object.keys(def.npcs).forEach(id=>{const n=def.npcs[id];n.topics.forEach(tp=>tp.responses.forEach(rs=>{const say=(rs.say||rs)[0];
   if(rs.fx&&rs.fx.clue&&say.includes(n.name))bad('V_habla_de_si_en_3a_persona',s,id+': '+say);}));});
 def.epilogue.win.concat(def.epilogue.fail).forEach(l=>{if(/porque [A-ZÁÉÍÓÚ]/.test(l.text)||/\{\w+\}/.test(l.text))bad('V_epilogo',s,l.text);});
 // textos: nada vacío ni repetido entre frases del mismo personaje
 Object.keys(def.npcs).forEach(id=>{const n=def.npcs[id];const sy=n.topics.map(t=>JSON.stringify(t.responses));if(new Set(sy).size!==sy.length)bad('T_respuesta_repetida',s,id);});
}
const keys=Object.keys(F);
console.log(keys.length?'FALLA · '+keys.length+' tipo(s) de incoherencia en '+N+' casos':'OK · '+N+' casos sin ninguna incoherencia lógica (24 comprobaciones)');
keys.forEach(k=>console.log('  '+k+': '+F[k]+' · '+ex[k]));
console.log(keys.length?'\n'+keys.length+' comprobación(es) fallida(s)':'\nTodo en orden');
process.exit(keys.length?1:0);
