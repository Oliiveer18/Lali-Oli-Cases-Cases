// c4 · SUBPASO 1 (LOW, SOLO LECTURA; no cambia el juego): ¿qué herramienta piden hoy las pistas de sostén y las pistas FALSAS (señuelos)? ¿cuántas charlas grabadas hay y de qué tipo? ¿cómo sale el reparto Oli/Lali?
// Uso: GENV=7 node tools/senuelos_c4.js [N=150] [paso=7919]   (semilla = i*paso+1; mismas que bot_masa/palancas). Informe JSON: /tmp/senuelos_c4.json
// Sostén = pistas de objeto (source.type 'prop') de rol prueba/descarte/refuta; señuelo = pistas de objeto de rol 'falsa'. Herramienta de una pista = la de su objeto obj_<id> (lupa/ganzua/uv/grabadora), 'sigilo' si tiene vigilante, 'libre' si no pide nada.
// Charlas grabadas: objetos con `listen`: con `chat` = lleva una pista (se mira su rol); sin `chat` = curiosidad grabada (sin pista).
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']); G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 150, STEP = +process.argv[3] || 7919, LV = ['facil', 'normal', 'dificil'], CL = ['lupa', 'ganzua', 'uv', 'grabadora', 'sigilo', 'libre'];
const obj = (def, id) => { let o = null; Object.values(def.rooms).forEach((r) => (r.props || []).forEach((p) => { if (p.id === 'obj_' + id) o = p; })); return o; };
const cls = (p) => (!p ? 'libre' : p.listen ? 'grabadora' : p.watcher ? 'sigilo' : ((p.steps || [])[0] || {}).tool && ((p.steps || [])[0] || {}).tool !== 'coop' ? p.steps[0].tool : 'libre');
const zero = () => Object.fromEntries(CL.map((k) => [k, 0]));
const out = { N, genV: G.GEN_VERSION, niveles: {} };
LV.forEach((L) => {
  const A = { sosten: zero(), senuelo: zero(), casos: 0, listen: { sosten: 0, senuelo: 0, sinPista: 0 }, listenPorCaso: [], senueloPorCaso: [], sostenPorCaso: [], oli: [], oliT: [], fuera: 0, sinSenueloGrab: 0 };
  for (let i = 1; A.casos < N && i < N * 4; i++) {
    const r = G.generateCase(i * STEP + 1, { level: L }); if (r.error) continue; A.casos++;
    const def = r.def; let ls = 0, ss = 0, sc = 0, fc = 0, grabSen = 0;
    r.bible.clues.forEach((c) => {
      if (c.source.type !== 'prop') return;
      const k = cls(obj(def, c.id));
      if (c.role === 'falsa') { A.senuelo[k]++; fc++; if (k === 'grabadora') grabSen++; } else if (['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0) { A.sosten[k]++; sc++; }
    });
    Object.values(def.rooms).forEach((rm) => (rm.props || []).forEach((p) => {
      if (!p.listen) return; ls++;
      if (!p.chat) { A.listen.sinPista++; return; }
      const id = ((p.steps || [])[0] || {}).clue, c = r.bible.clues.find((x) => x.id === id);
      if (c && c.role === 'falsa') A.listen.senuelo++; else A.listen.sosten++;
    }));
    A.listenPorCaso.push(ls); A.senueloPorCaso.push(fc); A.sostenPorCaso.push(sc);
    const w = G.workShare(def); A.oli.push(Math.round(w.share.num)); A.oliT.push(Math.round(w.share.time)); if (G.workIssues(def).length) A.fuera++;
    if (!grabSen) A.sinSenueloGrab++;
  }
  const av = (a) => Math.round(10 * a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)) / 10, pct = (o) => { const t = Object.values(o).reduce((x, y) => x + y, 0) || 1; return Object.fromEntries(CL.map((k) => [k, Math.round(1000 * o[k] / t) / 10 + ' %'])); };
  out.niveles[L] = { casos: A.casos, sosten: { porCaso: av(A.sostenPorCaso), reparto: pct(A.sosten) }, senuelo: { porCaso: av(A.senueloPorCaso), reparto: pct(A.senuelo), casosSinSenueloGrabadora: A.sinSenueloGrab }, charlasGrabadas: { porCaso: av(A.listenPorCaso), conPistaDeSosten: A.listen.sosten, conPistaFalsa: A.listen.senuelo, curiosidadSinPista: A.listen.sinPista }, oliPorcentaje: { enNumero: { media: av(A.oli), min: Math.min.apply(null, A.oli), max: Math.max.apply(null, A.oli) }, enTiempo: { media: av(A.oliT), min: Math.min.apply(null, A.oliT), max: Math.max.apply(null, A.oliT) }, casosFueraDeBanda: A.fuera } };
  console.log(L.toUpperCase(), JSON.stringify(out.niveles[L], null, 1));
});
fs.writeFileSync('/tmp/senuelos_c4.json', JSON.stringify(out, null, 1));
