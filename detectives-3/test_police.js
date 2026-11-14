// Prueba del arte de policía y comisaría (4C-3a): sprites nuevos, aspectos de policía y que nada de lo anterior cambia.
// Comprueba: todos los sprites existen (13 objetos + 8 aspectos × 3 direcciones × 2 fotogramas), ningún id definido dos veces en el código,
// los 7 aspectos de siempre, el pool asp_01… y el caso 1 idénticos a la v0.7.29, aspectos de policía distintos entre sí (≥ 3 atributos por papel),
// la sirena alterna, y que el generador de casos aún NO usa nada de esto (eso es 4C-3b). Uso: node test_police.js  (el aspecto visual se revisa con tools/police_sheet.js)
const fs = require('fs'), path = require('path');
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const PROPS = ['police_car_0', 'police_car_1', 'police_tape_h', 'police_tape_v', 'cone', 'decal_puddle', 'decal_stain', 'decal_jam', 'station_counter', 'cell_bars', 'interrogation_table', 'clue_board', 'police_sign'];
const ROLES = G.POLICE_LOOKS, ALL = [].concat(ROLES.agente, ROLES.inspector, ROLES.comisario);

ok('los 13 sprites de objeto existen con su tamaño (coche 32×16, celda 16×32, el resto 16×16)', PROPS.every((id) => G.spr[id]) && G.spr.police_car_0.tw === 32 && G.spr.police_car_1.th === 16 && G.spr.cell_bars.th === 32 && G.spr.cone.tw === 16, PROPS.filter((id) => !G.spr[id]).join());
ok('hay 3 agentes, 3 inspectores y 2 comisarios, cada uno con sus 6 fotogramas (frente, espaldas y lado × 2)', ROLES.agente.length === 3 && ROLES.inspector.length === 3 && ROLES.comisario.length === 2 && ALL.every((id) => G.LOOKS[id] && ['down', 'up', 'side'].every((d) => [0, 1].every((f) => G.spr[`${id}_${d}_${f}`]))));
{ const seen = {}, dup = [];
  const src = ['sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js'].map((f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('\n');
  (src.match(/\b(?:S|D|defSprite)\('[a-z0-9_]+'/g) || []).forEach((m) => { const id = m.replace(/^.*\('/, '').replace(/'$/, ''); if (seen[id]) dup.push(id); seen[id] = 1; });
  // Vigilancia en tiempo de ejecución (G.sprDup): ve también los ids generados en bucles. Lali y Oli (luna/rex) se redefinen a propósito con arte a medida.
  const rt = G.sprDup.filter((id) => !/^(luna|rex)_(down|up|side)_[01]$/.test(id));
  ok('ningún sprite se define dos veces (ni en el código ni al cargar: los nuevos no pisan a los de antes; solo Lali y Oli se redefinen a propósito)', dup.length === 0 && rt.length === 0, dup.concat(rt).join()); }
ok('los 7 aspectos de siempre no cambian (caso 1 igual)', hash(JSON.stringify(['rex', 'luna', 'hogaza', 'baguette', 'merengue', 'pimienta', 'cliente'].map((k) => G.LOOKS[k]))) === 4107734425);
ok('el pool asp_01… no cambia (los aspectos de policía se definen después)', G.GEN_LOOK_IDS.length === 36 && hash(JSON.stringify(G.GEN_LOOK_IDS.map((k) => G.LOOKS[k]))) === 3978793985 && Object.keys(G.LOOKS).length === 7 + 36 + 8);
ok('el caso 1 es idéntico byte a byte (hash 74937935)', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok);
{ let min = 99, who = ''; Object.keys(ROLES).forEach((role) => ROLES[role].forEach((a, i) => ROLES[role].forEach((b, j) => { if (j > i) { const d = G.lookDiff(G.LOOKS[a], G.LOOKS[b]); if (d < min) { min = d; who = a + '/' + b; } } })));
  ok(`dentro de cada papel los aspectos difieren en ≥ ${G.LOOK_MIN_DIFF} atributos (mínimo ${min}: ${who})`, min >= G.LOOK_MIN_DIFF); }
ok('cada papel se distingue por su sombrero (agente: gorra; inspector: sombrero o bombín; comisario: gorra clara) y lleva placa o galones', ROLES.agente.every((k) => G.LOOKS[k].hat === 'police_cap') && ROLES.inspector.every((k) => ['fedora', 'bowler'].indexOf(G.LOOKS[k].hat) >= 0) && ROLES.comisario.every((k) => G.LOOKS[k].hat === 'chief_cap' && G.LOOKS[k].extra.indexOf('stars') >= 0) && ALL.every((k) => G.LOOKS[k].extra.indexOf('badge') >= 0));
ok('la sirena alterna entre police_car_0 y police_car_1 con el tiempo', G.sirenFrame(0) === 'police_car_0' && G.sirenFrame(0.4) === 'police_car_1' && G.sirenFrame(0.7) === 'police_car_0' && G.sirenFrame() === 'police_car_0');
{ const allowed = ['police_car_0', 'cone', 'station_counter', 'interrogation_table', 'clue_board', 'decal_stain', 'decal_jam'], seen = new Set(); let outside = 0;
  for (let s = 0; s < 300; s++) { const r = G.generateCase(s); if (r.def) JSON.stringify(r.def, (k, v) => { if (typeof v === 'string' && (ALL.indexOf(v) >= 0 || PROPS.indexOf(v) >= 0)) { seen.add(v); if (ALL.indexOf(v) < 0 && allowed.indexOf(v) < 0) outside++; } return v; }); }
  const gen = ['gen_data.js', 'gen_themes.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'].map((f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('\n');
  ok('el generador usa este arte SOLO en la escena del aliado (coche, cono, mostrador, mesa, tablón y aspectos de policía) y en las manchas de ambiente de 4C-4b (decal_stain, decal_jam); nada más (celda, cinta, cartel) todavía', seen.size >= 6 && outside === 0 && !/cell_bars|police_tape|police_sign/.test(gen), `vistos ${[...seen].join()} fuera ${outside}`); }
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
