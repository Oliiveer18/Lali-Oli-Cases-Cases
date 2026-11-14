// duracion_niveles.js — 3-bis 2/3 (TIEMPOS-4, cp. 264): duración y tamaño por nivel con la franja OFICIAL de la versión activa (`G.QUALITY_CFG.bandOf/medianOf/ceilingOf/floorOf`: v7 = 20-28 · 28-36 · 36-45, techo 45; v6 = franjas `today`, techo 60) (solo lectura).
// Informa de CADA nivel: mínimo / mediana / media / máximo, % en rango y los casos FUERA de tope: sobre el tope de su nivel, sobre el techo duro y bajo el mínimo absoluto. `GENV=7` mide la receta v7 sin subir la versión (solo en memoria).
// Uso: node tools/duracion_niveles.js [N=300] [paso=7919] [Nbot=0]   (los 3 niveles con la MISMA semilla; Nbot = cuántos casos por nivel pasa además por el bot/qualityCase)
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const N = +process.argv[2] || 300, STEP = +process.argv[3] || 7919, NB = +process.argv[4] || 0;
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const Q = G.QUALITY_CFG, CEIL = Q.ceilingOf(), FLOOR = Q.floorOf(), r1 = (x) => Math.round(x * 10) / 10, mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };
const out = {};
console.log(`GEN_VERSION ${G.GEN_VERSION} · techo ${CEIL} · mínimo ${FLOOR} · ${N} casos por nivel · medidor (min humanos) y, si Nbot>0, bot×1,7`);
for (const L of ['facil', 'normal', 'dificil']) {
  const rows = [], bots = [], q = [];
  for (let i = 1; i <= N; i++) {
    const r = G.generateCase(i * STEP + 1, { register: true, level: L }); if (r.error) continue;
    const f = G.meterFeatures(r.def); rows.push({ min: G.meterSeconds(f) / 60, rooms: f.rooms, sus: Object.values(r.def.npcs).filter((n) => !n.cat && n.id !== 'aliado').length, curios: f.curios });
    if (i <= NB) { const o = G.qualityCase(r.def, { difficulty: { facil: 'easy', normal: 'normal', dificil: 'hard' }[L] }); if (o.bot && o.bot.finished) bots.push(Math.round(o.bot.botSeconds * 1.7 / 6) / 10); if (o.quality != null) q.push(o.quality); }
  }
  const t = { median: Q.medianOf(L), range: Q.bandOf(L) }, m = rows.map((x) => x.min), inR = m.filter((x) => x >= t.range[0] && x <= t.range[1]).length;
  out[L] = { n: rows.length, min: r1(Math.min(...m)), mediana: r1(med(m)), media: r1(mean(m)), max: r1(Math.max(...m)), enRango: Math.round(100 * inR / rows.length), salas: r1(mean(rows.map((x) => x.rooms))), sosp: r1(mean(rows.map((x) => x.sus))), curios: r1(mean(rows.map((x) => x.curios))), sobreTope: m.filter((x) => x > t.range[1]).length, sobreTecho: m.filter((x) => x > CEIL).length, bajoMinimo: m.filter((x) => x < FLOOR).length };
  if (bots.length) { out[L].bot = { n: bots.length, mediana: r1(med(bots)), min: Math.min(...bots), media: r1(mean(bots)), max: Math.max(...bots), sobreTope: bots.filter((x) => x > t.range[1]).length, sobreTecho: bots.filter((x) => x > CEIL).length, bajoMinimo: bots.filter((x) => x < FLOOR).length, enRango: Math.round(100 * bots.filter((x) => x >= t.range[0] && x <= t.range[1]).length / bots.length), calidad: r1(mean(q)) }; }
  const o = out[L]; console.log(`${L.padEnd(8)} objetivo ${t.median} (${t.range.join('-')}) · medidor min/mediana/media/máx ${o.min}/${o.mediana}/${o.media}/${o.max} · en rango ${o.enRango} % · salas ${o.salas} · sobre el tope ${t.range[1]}: ${o.sobreTope} · sobre el techo ${CEIL}: ${o.sobreTecho} · bajo ${FLOOR}: ${o.bajoMinimo} · sosp. ${o.sosp} · curiosidades ${o.curios}` + (o.bot ? ` · BOT min/mediana/media/máx ${o.bot.min}/${o.bot.mediana}/${o.bot.media}/${o.bot.max} (sobre el tope ${o.bot.sobreTope} · sobre el techo ${o.bot.sobreTecho} · bajo ${FLOOR}: ${o.bot.bajoMinimo}) en rango ${o.bot.enRango} % · calidad ${o.bot.calidad}` : ''));
}
console.log('orden de medianas ' + (out.facil.mediana < out.normal.mediana && out.normal.mediana < out.dificil.mediana ? 'OK (sube con el nivel)' : 'FALLA'));
require('fs').writeFileSync('/tmp/duracion_niveles.json', JSON.stringify(out, null, 1));
