// Prueba del MEDIDOR con la receta v7 (4F-0b 3/4-d, cp. 266). Uso: node test_meter_v7.js [casosPorNivel=40]
// El medidor (`G.meterSeconds`) estima los minutos sin ejecutar el bot. Con v6 va con los coeficientes de 4D-2; con `GEN_VERSION >= 7` usa `METER_CFG.v7`, ajustado contra el bot v7 (salas 4 / 5 / 6, puzles, relleno nuevo).
// EXIGE: v6 IDÉNTICO (misma fórmula de siempre) · v7 con sus coeficientes y el coste de puzle intacto (25 s por código, 30 s por línea) · frente al bot v7, en CADA nivel: error medio ≤ 3 %, error absoluto medio ≤ 5 % y peor caso ≤ 20 %
//   (antes del ajuste: −8 / −9 / −12 % de error medio) · la estimación sube con el nivel.
// MUTACIONES (deben hacer fallar): sin coeficientes v7 (vuelve a los de v6) · salas con el coste de v6 · base +100 s · pasos al doble.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 40, STEP = 7919, LEVELS = ['facil', 'normal', 'dificil'], DIFF = { facil: 'easy', normal: 'normal', dificil: 'hard' };
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1), r1 = (x) => Math.round(x * 10) / 10, clone = (x) => JSON.parse(JSON.stringify(x));
const M = G.METER_CFG, GV0 = G.GEN_VERSION, V7 = clone(M.v7 || null);

// 1) v6 intacto: la fórmula de 4D-2 con sus números de siempre
G.GEN_VERSION = 6;
const viejo = (f) => Math.max(120, Math.round(-43.04 + 24.67 * f.topics + 25.66 * f.steps + 19.26 * (f.curios || 0) + 33.36 * f.rooms + 25 * (f.puzCode || 0) + 30 * (f.puzLine || 0)));
let iguales = 0, total = 0;
for (const L of LEVELS) for (let i = 1; i <= 6; i++) { const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue; const f = G.meterFeatures(r.def); total++; if (G.meterSeconds(f) === viejo(f)) iguales++; }
ok(total > 0 && iguales === total, 'v6: el medidor da EXACTAMENTE la fórmula de 4D-2 (' + iguales + '/' + total + ')');

// 2) v7: coeficientes propios y coste de puzle intacto
G.GEN_VERSION = 7;
ok(!!V7 && ['base', 'perTopic', 'perStep', 'perCurio', 'perRoom'].every((k) => typeof V7[k] === 'number'), 'METER_CFG.v7 tiene base, perTopic, perStep, perCurio y perRoom');
ok(G.METER_VERSION >= 4, 'METER_VERSION ≥ 4');
const f0 = { topics: 20, steps: 15, curios: 10, rooms: 5, chats: 0 };
ok(G.meterSeconds(Object.assign({}, f0, { puzCode: 2, puzLine: 1 })) - G.meterSeconds(f0) === 2 * 25 + 30, 'v7: el puzle sigue costando 25 s por código y 30 s por línea');
ok(G.meterSeconds(f0) !== viejo(f0), 'v7: da una estimación distinta de la de v6');

// 2b) partidas del bot en v7, una vez (las mutaciones solo cambian el medidor sobre estos mismos casos)
const filas = [];
for (const L of LEVELS) for (let i = 1; i <= N; i++) {
  const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
  const o = G.qualityCase(r.def, { difficulty: DIFF[L] }); if (!(o.bot && o.bot.finished)) continue;
  filas.push({ L, bot: o.bot.humanSeconds, f: G.meterFeatures(r.def) });
}
const informe = () => LEVELS.map((L) => {
  const a = filas.filter((x) => x.L === L), e = a.map((x) => G.meterSeconds(x.f) / x.bot - 1);
  return { L, n: a.length, med: mean(e) * 100, abs: mean(e.map(Math.abs)) * 100, max: Math.max(...e.map(Math.abs)) * 100, min: mean(a.map((x) => G.meterSeconds(x.f))) / 60, bot: mean(a.map((x) => x.bot)) / 60 };
});
const fallos = (inf) => { const f = []; inf.forEach((o) => { if (!o.n) f.push(o.L + ': sin casos'); if (Math.abs(o.med) > 3) f.push(o.L + ': error medio ' + r1(o.med) + ' % (máx. ±3)'); if (o.abs > 5) f.push(o.L + ': error absoluto medio ' + r1(o.abs) + ' % (máx. 5)'); if (o.max > 20) f.push(o.L + ': peor caso ' + r1(o.max) + ' % (máx. 20)'); });
  if (!(inf[0].min < inf[1].min && inf[1].min < inf[2].min)) f.push('la estimación no sube con el nivel'); return f; };
const real = informe();
real.forEach((o) => console.log('  ' + o.L.padEnd(8) + 'n=' + o.n + ' · bot ' + r1(o.bot) + ' min · medidor ' + r1(o.min) + ' min · error medio ' + r1(o.med) + ' % · absoluto ' + r1(o.abs) + ' % · peor ' + r1(o.max) + ' %'));
const fr = fallos(real); ok(fr.length === 0, 'medidor v7 frente al bot: ' + fr.join('; '));

// 3) mutaciones
const mut = (nombre, cambia) => {
  M.v7 = clone(V7); try { cambia(); const fm = fallos(informe()); console.log('  mutación «' + nombre + '»: ' + (fm.length ? 'detectada (' + fm.length + ' fallos)' : 'NO detectada')); ok(fm.length > 0, 'MUTACIÓN no detectada «' + nombre + '»'); } finally { M.v7 = clone(V7); }
};
mut('sin coeficientes v7 (vuelve a v6)', () => { delete M.v7; });
mut('salas con el coste de v6 (33,36)', () => { M.v7.perRoom = 33.36; });
mut('base +100 s', () => { M.v7.base += 100; });
mut('pasos al doble', () => { M.v7.perStep *= 2; });
G.GEN_VERSION = GV0;
console.log(fails ? `✗ ${fails} de ${checks} comprobaciones fallan` : `✓ medidor v7: ${checks} comprobaciones correctas`);
process.exit(fails ? 1 : 0);
