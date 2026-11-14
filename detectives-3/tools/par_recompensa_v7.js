// par_recompensa_v7.js — TIEMPOS-6 (cp. 267), solo lectura: par, recompensa y límite de tiempo por nivel con v7 en memoria.
// Uso: node tools/par_recompensa_v7.js [N=100] [paso=7919]
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 100, STEP = +process.argv[3] || 7919; G.GEN_VERSION = 7;
const r1 = (x) => Math.round(x * 10) / 10, mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const DIFF = { facil: 'easy', normal: 'normal', dificil: 'hard' };
for (const L of ['facil', 'normal', 'dificil']) {
  const R = { par: [], rew: [], ratio: [], lim: [], monMin: [] }; let n = 0, fuera = 0;
  for (let i = 1; i <= N; i++) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
    const o = G.qualityCase(r.def, { difficulty: DIFF[L] }); if (!o.bot || !o.bot.finished) continue;
    const real = o.bot.botSeconds * 1.7, mc = G.meterCase(r.def); n++;
    R.par.push(mc.parSeconds / 60); R.rew.push(mc.reward); R.ratio.push(mc.parSeconds / real); R.lim.push(1.2 * mc.parSeconds / real); R.monMin.push(mc.reward / (real / 60));
    if (mc.parSeconds / real < 1.05 || mc.parSeconds / real > 2.4) fuera++;
  }
  const f = (a) => `${r1(Math.min(...a))}/${r1(mean(a))}/${r1(Math.max(...a))}`;
  console.log(`${L.padEnd(8)} n=${n} · par min ${f(R.par)} · par/real ${f(R.ratio)} (fuera 1,05-2,4: ${fuera}) · límite/real ${f(R.lim)} · recompensa ${f(R.rew)} · monedas por min real ${f(R.monMin)}`);
}
