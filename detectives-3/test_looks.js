// Prueba del generador de aspectos de personaje (4B, parte de aspectos): el pool asp_01… (sprites_b.js) y su reparto en los casos generados.
// Comprueba: pool completo y distinto entre sí y del resto (≥ G.LOOK_MIN_DIFF atributos), los 7 aspectos de siempre intactos (el caso 1 no cambia),
// sprites de las tres direcciones, determinismo y que NINGÚN caso generado repite aspecto. Uso: node test_looks.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const BASE = ['rex', 'luna', 'hogaza', 'baguette', 'merengue', 'pimienta', 'cliente'], POOL = G.GEN_LOOK_IDS, ALL = BASE.concat(POOL);
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

ok('los 7 aspectos de siempre no han cambiado (el caso 1 sigue igual)', hash(JSON.stringify(BASE.map((k) => G.LOOKS[k]))) === 4107734425);
ok(`el pool tiene ${G.LOOK_POOL_SIZE} aspectos con ids asp_01… únicos y presentes en G.LOOKS`, POOL.length === G.LOOK_POOL_SIZE && new Set(POOL).size === POOL.length && POOL.every((k, i) => k === 'asp_' + String(i + 1).padStart(2, '0') && G.LOOKS[k]));
{ let min = 99, who = '';
  for (let i = 0; i < ALL.length; i++) for (let j = i + 1; j < ALL.length; j++) { const d = G.lookDiff(G.LOOKS[ALL[i]], G.LOOKS[ALL[j]]); if (d < min) { min = d; who = ALL[i] + ' / ' + ALL[j]; } }
  ok(`todos los aspectos (${ALL.length}) difieren de los demás en ≥ ${G.LOOK_MIN_DIFF} atributos (mínimo ${min})`, min >= G.LOOK_MIN_DIFF, who); }
ok('cada aspecto del pool tiene sus sprites de frente, espalda y perfil (2 fotogramas)', POOL.every((k) => ['down', 'up', 'side'].every((d) => [0, 1].every((f) => G.spr[`${k}_${d}_${f}`]))));
ok('el pool usa solo piezas que dibuja el motor (peinado, sombrero y extras conocidos)', POOL.every((k) => { const L = G.LOOKS[k]; return G.LOOK_PARTS.style.indexOf(L.style) >= 0 && ['none', 'fedora', 'beret', 'chef', 'chef_small'].indexOf(L.hat) >= 0 && L.extra.every((e) => G.LOOK_PARTS.extra.concat(['apron_pink', 'apron_p']).indexOf(e) >= 0); }));
{ const kinds = (f) => new Set(POOL.map((k) => f(G.LOOKS[k]))).size;
  ok(`el pool es variado: ${kinds((l) => l.hat)} sombreros, ${kinds((l) => l.style)} peinados, ${kinds((l) => l.skin)} pieles, ${kinds((l) => l.coat)} abrigos, ${kinds((l) => l.hair)} colores de pelo`, kinds((l) => l.hat) >= 4 && kinds((l) => l.style) === 3 && kinds((l) => l.skin) === 3 && kinds((l) => l.coat) >= 10 && kinds((l) => l.hair) >= 10); }
ok('el generador de casos reparte los 4 aspectos de siempre + el pool (sin rex, luna ni cliente)', G.GEN_DATA.looks.length === 4 + POOL.length && G.GEN_DATA.looks.every((k) => ['rex', 'luna', 'cliente'].indexOf(k) < 0 && G.LOOKS[k]));
ok('determinismo: volver a generar el pool da exactamente los mismos aspectos', (() => { const a = JSON.stringify(POOL.map((k) => G.LOOKS[k])), save = {}; POOL.forEach((k) => { save[k] = G.LOOKS[k]; delete G.LOOKS[k]; }); const again = G.makeLookPool(); const b = JSON.stringify(again.map((k) => G.LOOKS[k])); return a === b && JSON.stringify(again) === JSON.stringify(POOL); })());

// casos generados: ningún aspecto repetido dentro de un caso, todos existen, y el reparto usa casi todo el pool
const N = 5000, used = {}, sets = new Set(); let rep = 0, missing = 0, minLooks = 99;
for (let s = 0; s < N; s++) {
  const b = G.genTruth(s), ls = b.cast.map((c) => c.look);
  if (new Set(ls).size !== ls.length) rep++;
  ls.forEach((l) => { if (!G.LOOKS[l]) missing++; used[l] = (used[l] || 0) + 1; });
  sets.add(b.cast.filter((c) => c.role === 'sospechoso').map((c) => c.look).sort().join(','));
}
ok(`${N} semillas: ningún caso repite aspecto entre sus personajes`, rep === 0, rep + ' casos');
ok(`${N} semillas: todos los aspectos existen en G.LOOKS`, missing === 0);
const pu = POOL.filter((k) => used[k]).length, counts = G.GEN_DATA.looks.map((k) => used[k] || 0), mx = Math.max.apply(null, counts), mn = Math.min.apply(null, counts); // el cliente (aspecto fijo) no entra en el reparto
ok(`se usan los ${G.GEN_DATA.looks.length} aspectos del reparto (el menos usado sale ${mn} veces, el más usado ${mx})`, pu === POOL.length && mn > 0 && mx < mn * 2);
ok(`los repartos de sospechosos casi nunca se repiten (${sets.size} distintos en ${N})`, sets.size > N * 0.95);
ok('un caso generado completo pasa validador y revisor con los aspectos nuevos (300 semillas)', (() => { for (let s = 0; s < 300; s++) { const r = G.generateCase(s); if (r.error || !G.validateCase(r.def).ok || r.review.fairness < 90) return false; } return true; })());
console.log(bad ? `\n${bad} comprobación(es) fallida(s)` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
