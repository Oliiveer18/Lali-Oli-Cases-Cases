// Prueba del MEDIDOR BARATO (4D-1): estimador de duración/calidad (src/meter.js), parSeconds y reward por caso, informe de metas.
// Comprueba: determinismo; parSeconds y reward distintos de 600/100 y dentro de rango; par 1,0-2,5 × tiempo del bot; error de duración
// frente al bot ≤ 20 % (y medio ≤ 8 %); el medidor es barato (sin bot); informe de metas coherente; el caso 1 no cambia (hash 74937935).
// Uso: node test_meter.js [semillasMedidor=1500] [semillasBot=40]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const N = +process.argv[2] || 1500, NB = +process.argv[3] || 40;
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0; return h; };
const M = G.METER_CFG;

ok('el medidor está cargado (G.meterCase, G.meterFeatures, G.METER_CFG)', typeof G.meterCase === 'function' && typeof G.meterFeatures === 'function' && M && M.goals.minutes === 20 && M.goals.quality === 80 && M.goals.play === 50);

let invalid = 0, noMeter = 0, fixed = 0, parBad = 0, rewBad = 0, nondet = 0, repBad = 0, goalsMismatch = 0, nOk = 0;
const t0 = Date.now(), mins = [], pars = new Set(), rews = new Set();
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s); if (r.error) continue;
  if (!r.meter) { noMeter++; continue; }
  const d = r.def, m = r.meter;
  if (!G.validateCase(d).ok) invalid++;
  if (d.parSeconds === 600 && d.reward === 100) fixed++;
  if (d.parSeconds !== m.parSeconds || d.reward !== m.reward) nondet++;
  if (d.parSeconds < 60 || d.parSeconds % M.parRound !== 0 || d.parSeconds < m.humanSeconds * 1.0 || d.parSeconds > m.humanSeconds * 2.5) parBad++;
  if (!Number.isInteger(d.reward) || d.reward < 60 || d.reward > 300 || d.reward % M.rewardRound !== 0) rewBad++;
  if (G.meterCase(d, { fairness: r.review.fairness }).humanSeconds !== m.humanSeconds) nondet++;
  if (typeof m.report !== 'string' || !m.report.length) repBad++;
  if (m.ok !== (m.goals.minutes && m.goals.quality && m.goals.play)) goalsMismatch++;
  if (m.ok) nOk++;
  mins.push(m.humanMinutes); pars.add(d.parSeconds); rews.add(d.reward);
}
const dt = (Date.now() - t0) / 1000;
ok(`${N} casos generados: todos con medidor y válidos (${noMeter} sin medidor, ${invalid} inválidos)`, noMeter === 0 && invalid === 0);
ok('ninguno conserva los valores fijos 600/100', fixed === 0, fixed + ' casos');
ok('parSeconds y reward del caso coinciden con los del medidor y se recalculan igual', nondet === 0, nondet + ' casos');
ok('parSeconds: múltiplo de 30 s y entre 1,0 y 2,5 × el tiempo estimado', parBad === 0, parBad + ' casos');
ok('reward: entero, múltiplo de 5 y entre 60 y 300', rewBad === 0, rewBad + ' casos');
ok(`varían entre casos (${pars.size} valores de par, ${rews.size} de reward)`, pars.size >= 10 && rews.size >= 5);
ok('informe de metas coherente con las metas', repBad === 0 && goalsMismatch === 0);
ok(`barato: ${N} casos con generador y medidor en ${dt.toFixed(1)} s (sin bot)`, dt < 120);

// contra el bot
const errs = [], ratio = [];
for (let s = 0; s < NB; s++) {
  const r = G.generateCase(s * 104729 + 3); if (r.error) continue;
  const Q = G.qualityCase(r.def); errs.push(Math.abs(r.meter.humanSeconds / Q.bot.humanSeconds - 1)); ratio.push(r.def.parSeconds / Q.bot.humanSeconds);
}
const avg = errs.reduce((a, b) => a + b, 0) / errs.length;
ok(`duración estimada frente al bot (${errs.length} casos): error medio ${(avg * 100).toFixed(1)} % (≤ 8 %), máximo ${(Math.max(...errs) * 100).toFixed(1)} % (≤ 20 %)`, avg <= 0.08 && Math.max(...errs) <= 0.2);
ok(`parSeconds frente al tiempo del bot: ${Math.min(...ratio).toFixed(2)}–${Math.max(...ratio).toFixed(2)} (dentro de 1,0–2,5, sin avisos par_corto/par_largo)`, Math.min(...ratio) >= 1 && Math.max(...ratio) <= 2.5);

// medidor sobre casos a mano
const t1 = G.meterCase(G.CASES.tarta);
ok(`caso 1: el medidor lo estima en ~${t1.humanMinutes} min con par ${t1.parSeconds} s (no se modifica el caso)`, t1.humanSeconds > 300 && G.CASES.tarta.parSeconds === 1500 && G.CASES.tarta.reward === 120);
ok('el caso 1 es idéntico byte a byte (hash 74937935)', hash(JSON.stringify(G.CASES.tarta)) === 74937935 && G.validateCase(G.CASES.tarta).ok);
console.log(`\nInforme (medidor, ${N} semillas): ${nOk} cumplen TODAS las metas (${(nOk / N * 100).toFixed(1)} %) · minutos ${Math.min(...mins)}–${Math.max(...mins)} (se resuelve en 4D-2)`);
console.log(bad ? `\n${bad} FALLO(S)` : '\nTODO OK');
process.exit(bad ? 1 : 0);
