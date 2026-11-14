// ia_iniciativa.js — A5 IA-1 (solo lectura). Mide, por nivel, cuánto trabajo con herramienta hace el compañero IA POR SU CUENTA
// cuando el jugador humano está parado. Uso: node tools/ia_iniciativa.js [casos por nivel=30] [segundos por sala=90]
// Salida: resumen por nivel y /tmp/ia_iniciativa.json
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const N = +process.argv[2] || 30, SECS = +process.argv[3] || 90;
const LV = [['easy', 'facil'], ['normal', 'normal'], ['hard', 'dificil']];
const out = {};
LV.forEach(([diff, lvl]) => {
  const o = { casos: 0, pasosIA: 0, pasosHechos: 0, salasConTrabajo: 0, primeraS: [], sinAyuda: 0 };
  for (let i = 0; i < N; i++) {
    const r = G.generateCase(i * 7919 + 1, { level: lvl }); if (!r.def) continue;
    const def = r.def; o.casos++;
    const st = new G.CaseState(def, diff), w = new G.World(st, { mode: 'solo' });
    const ai = w.players[1 - w.human];
    st.chapter = 2; // todo el contenido de capítulo 1-2 disponible
    const rooms = Object.keys(def.rooms);
    let first = null;
    rooms.forEach((rn) => {
      w.enterRoom(rn); w.onChapter(); w.out.length = 0;
      const mine = w.room.props.filter((p) => p.steps && p.steps.some((s) => s.tool && s.tool !== 'coop' && ai.tools.indexOf(s.tool) >= 0));
      if (!mine.length) return;
      o.salasConTrabajo++; o.pasosIA += mine.length;
      const before = mine.map((p) => st.progress[p.key] || 0);
      let t0 = 0;
      for (let t = 0; t < SECS; t += 0.05) {
        w.update(0.05, true); w.out.length = 0;
        if (first === null && mine.some((p, k) => (st.progress[p.key] || 0) > before[k])) first = w.time;
      }
      mine.forEach((p, k) => { if ((st.progress[p.key] || 0) > before[k]) o.pasosHechos++; });
    });
    if (first !== null) o.primeraS.push(first); else o.sinAyuda++;
  }
  o.primeraMediana = o.primeraS.length ? o.primeraS.sort((a, b) => a - b)[Math.floor(o.primeraS.length / 2)] : null;
  delete o.primeraS; out[lvl] = o;
  console.log(`${lvl}: ${o.casos} casos · salas con trabajo de la IA ${o.salasConTrabajo} · objetos de su herramienta ${o.pasosIA} · hechos por su cuenta ${o.pasosHechos} (${o.pasosIA ? (100 * o.pasosHechos / o.pasosIA).toFixed(0) : 0} %) · casos donde no hizo NADA ${o.sinAyuda} · primera acción (mediana) ${o.primeraMediana}`);
});
require('fs').writeFileSync('/tmp/ia_iniciativa.json', JSON.stringify(out, null, 1));
