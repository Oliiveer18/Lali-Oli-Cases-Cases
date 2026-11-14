// c4-3 2/4 (cp. 241): DATOS de las charlas señuelo (ENCENDIDOS en c4-3 4/4, cp. 250). Una a una: node test_charla_datos.js
// Comprueba: tabla `senuelos[nivel].charla` ([[0|1, peso]], máx. 1, pesos que suman 100), interruptor `herr2.charlaSenuelos` ENCENDIDO, banda de grabadora 1,0-2,0,
// textos `listen.veil.senuelo` (forma [3.ª de a, 4.ª de b], con {who}, sin pronombres de género ni lugares), plantilla `tracesGrab` (grabación, mismas variables que el descarte) y que el resto de la tabla sigue igual.
// Mutaciones: sin tabla de Normal · interruptor apagado · texto con pronombre de género.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'];
let bad = 0, checks = 0; const late = []; const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } };
function revisar(patch) { // → lista de fallos (vacía = todo bien)
  const G = require('./tools/load_g.js')(MOD, patch), D = G.GEN_DATA.compile, H = D.mech.herr2, f = [];
  LV.forEach((L) => { const t = H.senuelos[L] && H.senuelos[L].charla; if (!Array.isArray(t) || !t.length) { f.push('tabla ' + L); return; }
    if (t.reduce((x, e) => x + e[1], 0) !== 100) f.push('pesos ' + L); if (t.some((e) => e[0] !== 0 && e[0] !== 1)) f.push('máx. 1 ' + L); if (!t.some((e) => e[0] === 1)) f.push('sin 1 ' + L);
    ['lupa', 'uv', 'ganzua', 'cadena'].forEach((k) => { if (!H.senuelos[L][k]) f.push('perdida ' + k + ' ' + L); }); });
  if (H.charlaSenuelos !== true) f.push('interruptor no encendido');
  const bg = H.bandas && H.bandas.grabadora; if (!bg || bg[0] !== 1 || bg[1] !== 2) f.push('banda grabadora');
  const sn = D.listen.veil.senuelo; if (!Array.isArray(sn) || sn.length < 4) f.push('pocos textos'); else sn.forEach((p, i) => { if (!Array.isArray(p) || p.length !== 2 || p.some((x) => typeof x !== 'string' || !x)) f.push('forma ' + i); else {
    if (p[0].indexOf('{who}') < 0) f.push('sin {who} ' + i); if (/\b(él|ella|ellos|ellas)\b/i.test(p.join(' '))) f.push('pronombre de género ' + i); if (/\{(loc|pname|where|time|doing)\}/.test(p.join(' '))) f.push('lugar/hora ' + i); } });
  const tg = (D.bible && D.bible.tracesGrab) || (G.GEN_DATA.bible && G.GEN_DATA.bible.tracesGrab) || findTracesGrab(G.GEN_DATA);
  if (!tg || !tg.length || tg.some((x) => x.kind !== 'grabación' || !/\{who\}/.test(x.text))) f.push('tracesGrab');
  return f;
}
function findTracesGrab(o, d) { d = d || 0; if (!o || typeof o !== 'object' || d > 6) return null; if (o.tracesGrab) return o.tracesGrab; for (const k of Object.keys(o)) { const r = findTracesGrab(o[k], d + 1); if (r) return r; } return null; }
const F = revisar(); ok('datos de charla señuelo completos y encendidos (' + (F.join(' · ') || 'sin fallos') + ')', F.length === 0);
{ const m = mutador('gen_data.js', "cadena: [[0, 10], [1, 90]], charla: [[0, 45], [1, 55]] }", "cadena: [[0, 10], [1, 90]] }"); late.push(() => ok('mutación «sin tabla de Normal»: el patrón encaja', m.ok !== false)); ok('mutación «sin tabla de Normal» detectada', revisar(m.patch).length > 0);
  const n = mutador('gen_data.js', 'charlaSenuelos: true', 'charlaSenuelos: false'); late.push(() => ok('mutación «interruptor apagado»: el patrón encaja', n.ok !== false)); ok('mutación «interruptor apagado» detectada', revisar(n.patch).length > 0);
  const q = mutador('gen_data.js', "'Con cara no se condena a nadie, pero tampoco se olvida.'", "'Con cara no se condena a nadie, pero a ella tampoco se olvida.'"); late.push(() => ok('mutación «pronombre de género»: el patrón encaja', q.ok !== false)); ok('mutación «pronombre de género» detectada', revisar(q.patch).length > 0); }
late.forEach((g) => g()); console.log(bad ? `✗ ${bad} fallos de ${checks}` : `✓ test_charla_datos: ${checks} comprobaciones`); process.exit(bad ? 1 : 0);
