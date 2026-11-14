// CL-5c-d: DURACIÓN de Difícil v7 CON puzles (objetivo `targetMinV7` = 39 desde 4F-0b 3/4-d; antes 34 con el medidor viejo). Una a una: node test_duracion_puzles.js [N=40]
// Partida completa del bot (minutos humanos = bot × 1,7). Límites duros: 0 atascos/derrotas, 0 casos > 45 min en los 3 niveles. Difícil: mediana entre 36 y 40,5 y cada caso con puzles.
// Mínimos por debajo de 36 son normales mientras falte contenido (rangos oficiales: solo se vigila el techo). Con mutación: si el objetivo de Difícil sube, la prueba lo detecta.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 40;
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
function correr(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7;
  const cuenta = { facil: 0, normal: 0, dificil: 0 }, mins = { facil: [], normal: [], dificil: [] }; let sinPuzle = 0;
  for (let i = 1; i < 3000 && Object.values(cuenta).some((n) => n < N); i++) {
    const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true }); if (r.error || !r.def.genLevel) continue; const L = r.def.genLevel; if (cuenta[L] >= N) continue; cuenta[L]++;
    const x = G.qualityCase(r.def), b = x.bot || {};
    ok(b.win && !b.stuck, L + ' semilla ' + sd + ': el bot gana sin atascarse'); ok(b.humanMinutes <= 45, L + ' semilla ' + sd + ': ' + b.humanMinutes + ' min > 45');
    mins[L].push(b.humanMinutes);
    if (L === 'dificil' && !G.puzzleClueIds(r.def).length) sinPuzle++;
  }
  const med = (a) => { const s = a.slice().sort((p, q) => p - q); return s[(s.length / 2) | 0]; };
  ok(sinPuzle === 0, 'todos los casos de Difícil llevan puzle (' + sinPuzle + ' sin él)');
  ok(med(mins.dificil) >= 36 && med(mins.dificil) <= 40.5, 'Difícil: mediana ' + med(mins.dificil) + ' entre 36 y 40,5');
  ok(Math.max.apply(null, mins.dificil) <= 44.5, 'Difícil: máximo ' + Math.max.apply(null, mins.dificil) + ' ≤ 44,5 (margen 0,5 con el techo duro de 45; antes 44: las charlas señuelo de c4-3 añaden ≈ 1 min al peor caso, cp. 254)');
  console.log('  (medianas: Fácil ' + med(mins.facil) + ' · Normal ' + med(mins.normal) + ' · Difícil ' + med(mins.dificil) + ' · máx. Difícil ' + Math.max.apply(null, mins.dificil) + ')');
  return bad;
}
correr(null); console.log(`casos ${N} por nivel · comprobaciones ${checks} · fallos ${bad}`);
const real = bad; bad = 0; checks = 0;
const MUT = [['gen_data.js', 'targetMinV7: 39,', 'targetMinV7: 44,', 'Difícil con objetivo 44 (sin recalcular tras los puzles)']];
let falla = false; const q = console.log;
MUT.forEach(([f, d, h, nom]) => {
  const m = mutador(f, d, h); bad = 0; checks = 0; console.log = () => {}; try { correr(m.patch); } catch (e) { bad++; } console.log = q;
  if (!m.ok) { console.log('✗ mutación (' + nom + '): ' + m.motivo); falla = true; return; }
  console.log(`(mutación «${nom}»: ${bad} fallos esperados)`); if (!bad) { console.log('✗ la mutación NO se detecta: ' + nom); falla = true; }
});
if (real || falla) process.exit(1); console.log('\nTodo en orden');
