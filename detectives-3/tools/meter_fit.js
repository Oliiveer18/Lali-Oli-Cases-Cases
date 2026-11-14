// meter_fit.js — calibra y comprueba el medidor barato (src/meter.js) contra el bot (G.qualityCase). 4D-1.
// Uso: node tools/meter_fit.js [semillasBot=200] [semillasMedidor=5000] [GEN_VERSION]
// Con GEN_VERSION 7 (4F-0b 3/4-d, cp. 266): ajusta `METER_CFG.v7` contra el bot v7, `semillasBot` casos POR NIVEL (Fácil/Normal/Difícil con su dificultad), restando el coste de los puzles (25 s código, 30 s línea); imprime el error por nivel y SALE (no toca el ajuste de v6).
// Imprime: error del estimador de duración frente al bot, coeficientes de mínimos cuadrados (para pegar en G.METER_CFG),
// coherencia de parSeconds (1,0-2,5 × tiempo del bot) y el informe de metas del medidor en N semillas (sin bot).
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const NB = +process.argv[2] || 200, NM = +process.argv[3] || 5000;
const GV = +process.argv[4] || 0;
const r1 = (x) => Math.round(x * 10) / 10, avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
if (GV >= 7) {
  G.GEN_VERSION = GV; const D = { facil: 'easy', normal: 'normal', dificil: 'hard' }, R = [];
  for (const L of ['facil', 'normal', 'dificil']) for (let k = 0; k < NB; k++) {
    const r = G.generateCase(k * 104729 + 3, { register: true, level: L }); if (r.error) continue; const o = G.qualityCase(r.def, { difficulty: D[L] }); if (!(o.bot && o.bot.finished)) continue;
    const f = G.meterFeatures(r.def); R.push({ L, f, y: o.bot.humanSeconds, pz: 25 * (f.puzCode || 0) + 30 * (f.puzLine || 0) });
  }
  const ks = ['topics', 'steps', 'curios', 'rooms'], n = ks.length + 1, A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
  R.forEach((x) => { const v = [1].concat(ks.map((k) => x.f[k])); for (let p = 0; p < n; p++) { b[p] += v[p] * (x.y - x.pz); for (let q = 0; q < n; q++) A[p][q] += v[p] * v[q]; } });
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const f = A[j][i] / A[i][i]; for (let k = i; k < n; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
  const w = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
  console.log(`v7: ${R.length} casos. Pegar en METER_CFG.v7: { base: ${w[0].toFixed(2)}, perTopic: ${w[1].toFixed(2)}, perStep: ${w[2].toFixed(2)}, perCurio: ${w[3].toFixed(2)}, perRoom: ${w[4].toFixed(2)} }`);
  for (const L of ['facil', 'normal', 'dificil']) { const a = R.filter((x) => x.L === L), e = a.map((x) => (w[0] + w[1] * x.f.topics + w[2] * x.f.steps + w[3] * x.f.curios + w[4] * x.f.rooms + x.pz) / x.y - 1); console.log(`  ${L}: n ${a.length} · error medio ${r1(avg(e) * 100)} % · absoluto ${r1(avg(e.map(Math.abs)) * 100)} % · peor ${r1(Math.max(...e.map(Math.abs)) * 100)} %`); }
  process.exit(0);
}
const rows = [];
for (let s = 0; s < NB; s++) {
  const r = G.generateCase(s * 104729 + 3); if (r.error) continue;
  const Q = G.qualityCase(r.def), f = G.meterFeatures(r.def);
  rows.push({ f, y: Q.bot.humanSeconds, q: Q.quality, play: Q.play, m: r.meter, par: r.def.parSeconds });
}
const errs = rows.map((x) => x.m.humanSeconds / x.y - 1);
console.log(`Estimador de duración vs bot (${rows.length} semillas): error medio ${r1(avg(errs.map(Math.abs)) * 100)} %, máx ${r1(Math.max(...errs.map(Math.abs)) * 100)} %, sesgo ${r1(avg(errs) * 100)} %`);
const dq = rows.map((x) => x.m.quality - x.q), dp = rows.map((x) => x.m.play - x.play);
console.log(`Nota estimada − nota del bot: media ${r1(avg(dq))} (|máx| ${Math.max(...dq.map(Math.abs))}) · jugabilidad estimada − bot: media ${r1(avg(dp))} (|máx| ${Math.max(...dp.map(Math.abs))})`);
const ratio = rows.map((x) => x.par / x.y), outside = ratio.filter((v) => v < 1 || v > 2.5).length;
console.log(`parSeconds / tiempo del bot: ${r1(Math.min(...ratio))}–${r1(Math.max(...ratio))} (media ${r1(avg(ratio))}); fuera de 1,0–2,5: ${outside}`);
// mínimos cuadrados (topics, chats, steps, curios, rooms); 4D-2: el relleno se separa de las piezas de base
const keys = ['topics', 'chats', 'steps', 'curios', 'rooms'], X = rows.map((x) => [1].concat(keys.map((k) => x.f[k]))), n = keys.length + 1, A = Array.from({ length: n }, () => Array(n).fill(0)), b = Array(n).fill(0);
X.forEach((x, i) => { for (let p = 0; p < n; p++) { b[p] += x[p] * rows[i].y; for (let q = 0; q < n; q++) A[p][q] += x[p] * x[q]; } });
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const f = A[j][i] / A[i][i]; for (let k = i; k < n; k++) A[j][k] -= f * A[i][k]; b[j] -= f * b[i]; }
const w = Array(n).fill(0); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * w[j]; w[i] = s / A[i][i]; }
console.log(`Coeficientes ajustados: base ${r1(w[0])}, perTopic ${w[1].toFixed(2)}, perChat ${w[2].toFixed(2)}, perStep ${w[3].toFixed(2)}, perCurio ${w[4].toFixed(2)}, perRoom ${w[5].toFixed(2)} (en uso: ${G.METER_CFG.base}, ${G.METER_CFG.perTopic}, ${G.METER_CFG.perChat}, ${G.METER_CFG.perStep}, ${G.METER_CFG.perCurio}, ${G.METER_CFG.perRoom})`);
// informe de metas del medidor (barato)
const t0 = Date.now(), st = { n: 0, minutes: 0, quality: 0, play: 0, all: 0 }, mins = [], par = [], rew = [];
for (let s = 0; s < NM; s++) { const r = G.generateCase(s); if (r.error) continue; const m = r.meter; st.n++; mins.push(m.humanMinutes); par.push(r.def.parSeconds); rew.push(r.def.reward); ['minutes', 'quality', 'play'].forEach((k) => { if (m.goals[k]) st[k]++; }); if (m.ok) st.all++; }
const pc = (v) => r1(v / st.n * 100) + ' %';
console.log(`Metas del medidor en ${st.n} semillas (${r1((Date.now() - t0) / 1000)} s): ≥ 20 min ${pc(st.minutes)} · nota > 80 ${pc(st.quality)} · jugabilidad ≥ 50 ${pc(st.play)} · TODAS ${pc(st.all)}`);
console.log(`Minutos estimados ${r1(Math.min(...mins))}–${r1(Math.max(...mins))} (media ${r1(avg(mins))}) · parSeconds ${Math.min(...par)}–${Math.max(...par)} · reward ${Math.min(...rew)}–${Math.max(...rew)} (media ${r1(avg(rew))})`);
