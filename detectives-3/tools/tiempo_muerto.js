// tiempo_muerto.js — A4 HERR-1 4/4-4 (23 oct): mide EQ-7 (tiempos muertos) con el BOT, por nivel (regla 7). Solo lectura; no cambia el juego.
// Uso: node tools/tiempo_muerto.js [N=300] [paso=7919]   (semilla = i*paso+1; misma semilla en los 3 niveles). Informe JSON en /tmp/tiempo_muerto.json
// Definición: G.idleOf / G.idleIssues (src/logic.js). Por capítulo y detective: acciones propias, segundos propios y espera seguida máxima (segundos del bot).
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'bot.js']);
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;   // c3 subpaso 2 (cp. 179): GENV=7 mide la receta v7 SIN subir la versión del repositorio (solo en memoria)
const N = +process.argv[2] || 300, STEP = +process.argv[3] || 7919;
const LV = ['facil', 'normal', 'dificil'], NAMES = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };
const r1 = (x) => Math.round(x * 10) / 10;
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const rep = { n: N, step: STEP, limit: G.IDLE, levels: {} };
LV.forEach((L) => {
  const lv = { casos: 0, sinBot: 0, ch: {}, peor: [] }, all = { rex: [], luna: [] };
  let sinPropio = 0, conIncumplimiento = 0;
  for (let i = 1; i <= N; i++) {
    const seed = i * STEP + 1, r = G.generateCase(seed, { register: true, level: L });
    if (r.error) continue;
    const b = G.botPlay(JSON.parse(JSON.stringify(r.def)), { difficulty: L === 'facil' ? 'easy' : L === 'normal' ? 'normal' : 'hard' });
    if (!b.stats || !b.stats.idle || b.stuck) { lv.sinBot++; continue; }
    lv.casos++;
    const idle = b.stats.idle;
    Object.keys(idle).forEach((ch) => {
      const c = idle[ch]; if (!c.events || !c.judged) return;
      const k = (lv.ch[ch] = lv.ch[ch] || { casos: 0, rex: { own0: 0, w: [], n: [] }, luna: { own0: 0, w: [], n: [] }, span: [] });
      k.casos++; k.span.push(c.span); k.sh = k.sh || { rex: [], luna: [] }; k.sh.rex.push(c.rex.waitShare); k.sh.luna.push(c.luna.waitShare);
      ['rex', 'luna'].forEach((d) => { k[d].w.push(c[d].maxWait); k[d].n.push(c[d].ownN); if (!c[d].ownN) k[d].own0++; all[d].push(c[d].maxWait); });
    });
    const iss = G.idleIssues(idle);
    if (iss.length) { conIncumplimiento++; if (lv.peor.length < 5) lv.peor.push({ seed, iss: iss.map((x) => x.msg) }); }
    if (Object.keys(idle).some((ch) => idle[ch].judged && (!idle[ch].rex.ownN || !idle[ch].luna.ownN))) sinPropio++;
  }
  lv.sinPropio = sinPropio; lv.conIncumplimiento = conIncumplimiento;
  lv.max = { rex: Math.max(0, ...all.rex), luna: Math.max(0, ...all.luna) };
  rep.levels[L] = lv;
});
const out = [];
LV.forEach((L) => {
  const lv = rep.levels[L];
  out.push(`== ${NAMES[L]}: ${lv.casos} casos con bot (sin bot ${lv.sinBot}) · con algún detective SIN acción propia en un capítulo: ${lv.sinPropio} · incumplen el límite actual (${G.IDLE.maxWait} s / ${G.IDLE.minOwn} acción): ${lv.conIncumplimiento} · espera máx. Oli ${r1(lv.max.rex)} s, Lali ${r1(lv.max.luna)} s`);
  Object.keys(lv.ch).sort().forEach((ch) => {
    const k = lv.ch[ch];
    out.push(`   cap ${ch} (${k.casos} casos, duración mediana ${r1(pct(k.span, 0.5))} s): ` + ['rex', 'luna'].map((d) => `${d === 'rex' ? 'Oli ' : 'Lali'} acciones propias mediana ${pct(k[d].n, 0.5)} (mín ${Math.min(...k[d].n)}, sin ninguna ${k[d].own0}) · espera seguida mediana ${r1(pct(k[d].w, 0.5))} s, p95 ${r1(pct(k[d].w, 0.95))} s, máx ${r1(Math.max(...k[d].w))} s · % del capítulo: mediana ${Math.round(100 * pct(k.sh[d], 0.5))} p95 ${Math.round(100 * pct(k.sh[d], 0.95))} máx ${Math.round(100 * Math.max(...k.sh[d]))}`).join('  |  '));
  });
  lv.peor.forEach((p) => out.push(`   ej. semilla ${p.seed}: ${p.iss.join(' ')}`));
});
console.log(out.join('\n'));
fs.writeFileSync('/tmp/tiempo_muerto.json', JSON.stringify(rep));
