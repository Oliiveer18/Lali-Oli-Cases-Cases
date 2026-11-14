// senuelos_charla_c43.js — c4-3 subpaso 1/4 (SOLO LECTURA, cp. 240): ¿cuánto hueco hay para CHARLAS SEÑUELO (grabaciones falsas)?
// Uso: GENV=7 node tools/senuelos_charla_c43.js [N=150]   (semillas i*7919+1, como uso_2b4 / palancas_cl5). No toca src/.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const N = +process.argv[2] || 150, LV = ['facil', 'normal', 'dificil'], SEEDS = { facil: [], normal: [], dificil: [] };
for (let i = 1; i < 3000 && LV.some((k) => SEEDS[k].length < N); i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true }); if (r.error || !r.def.genLevel) continue; if (SEEDS[r.def.genLevel].length < N) SEEDS[r.def.genLevel].push(sd); }
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
LV.forEach((L) => {
  const A = { pres: 0, presLibreSala: 0, factible: 0, factibleMover: 0, n: 0, real: 0, curio: 0, falsasObj: 0, falsasLibres: 0, kinds: {}, conParLibre: 0, conParLibreYFalsaLibre: 0, parLibreSum: 0, secs: 0, secsN: 0, grabSteps: 0, conSala: 0, falsaEnSalaDeCharla: 0 };
  SEEDS[L].forEach((sd) => {
    const r = G.generateCase(sd, { register: true, level: L }); if (r.error) return; A.n++;
    const def = r.def, b = r.bible, props = {}, charlaNpc = {}; let real = 0, curio = 0; const roomsConCharla = {};
    Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((p) => {
      props[p.id] = { p, rid };
      if (p.listen && p.chat) { roomsConCharla[rid] = 1; charlaNpc[p.chat.a] = charlaNpc[p.chat.b] = 1; const st = (p.steps || [])[0]; if (st && st.clue) real++; else curio++; if (st) { A.secs += st.time; A.secsN++; } A.grabSteps += (p.steps || []).filter((s) => s.tool === 'grabadora').length; }
    }));
    A.real += real; A.curio += curio;
    // falsas de objeto y cuántas están libres (sin herramienta: candidatas naturales a pasar a charla señuelo)
    const fo = b.clues.filter((c) => c.role === 'falsa' && c.source.type === 'prop');
    const libres = fo.filter((c) => { const q = props['obj_' + c.id]; return q && !(q.p.steps || []).some((s) => s.tool) && q.p.visible === undefined; });
    A.falsasObj += fo.length; A.falsasLibres += libres.length; fo.forEach((c) => { A.kinds[c.kind] = (A.kinds[c.kind] || 0) + 1; });
    // pareja libre: sospechosos que no son gato, ni vigilante, ni están ya en una charla (se necesitan 2)
    const sus = b.cast.filter((c) => c.role === 'sospechoso').map((c) => c.id), npcs = def.npcs || {};
    const libresN = sus.filter((id) => npcs[id] && !npcs[id].cat && !npcs[id].watch && !charlaNpc[id]);
    const pres = b.clues.filter((c) => c.role === 'falsa' && c.source.type === 'prop'); A.pres += pres.length; // cualquier falsa de objeto (la entrega pasa a ser charla; el tipo pasaría a «grabación», el texto y las `needs` del señuelo no cambian)
    const presOk = pres.filter((c) => { const q = props['obj_' + c.id]; return q && !roomsConCharla[q.rid]; });
    A.presLibreSala += presOk.length; if (presOk.length && libresN.length >= 2) A.factible++; if (pres.length && libresN.length >= 2 && Object.keys(def.rooms).some((rid) => !roomsConCharla[rid])) A.factibleMover++;
    A.parLibreSum += libresN.length; if (libresN.length >= 2) { A.conParLibre++; if (libres.length) A.conParLibreYFalsaLibre++; }
  });
  console.log(L.padEnd(8), 'n=' + A.n, '| charlas reales/caso ' + f2(A.real / A.n), '| de curiosidad/caso ' + f2(A.curio / A.n), '| pasos grabadora/caso ' + f2(A.grabSteps / A.n), '| seg. por charla ' + f2(A.secs / Math.max(1, A.secsN)));
  console.log('         falsas de objeto/caso ' + f2(A.falsasObj / A.n), '(libres, sin herramienta: ' + f2(A.falsasLibres / A.n) + ')', 'tipos:', JSON.stringify(A.kinds));
  console.log('         falsas de objeto/caso ' + f2(A.pres / A.n) + ' (en sala SIN charla real: ' + f2(A.presLibreSala / A.n) + ') · casos FACTIBLES sin mover nada (falsa en sala sin charla + pareja libre): ' + A.factible + '/' + A.n + ' · moviendo la falsa a otra sala sin charla: ' + A.factibleMover + '/' + A.n);
  console.log('         casos con pareja libre (≥2 sospechosos sin charla): ' + A.conParLibre + '/' + A.n + ' · con pareja libre Y falsa libre: ' + A.conParLibreYFalsaLibre + '/' + A.n + ' · sospechosos libres/caso ' + f2(A.parLibreSum / A.n));
});
