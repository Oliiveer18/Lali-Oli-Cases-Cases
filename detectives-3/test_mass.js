// Prueba masiva de la fábrica de casos (fase 3D-2): 5000 semillas consecutivas → 100 % aceptadas (validador + revisor, equidad ≥ 90),
// ≥ 90 % al primer intento, determinismo en una muestra de 200, informe legible sin marcadores sueltos, variedad y tiempo. Uso: node test_mass.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'report.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const N = +process.env.SEEDS ? Math.min(5000, +process.env.SEEDS) : 5000, t0 = Date.now(), MAX_MS = 240000;
const errs = [], low = [], combos = {}, culp = {}, meth = {}, mot = {}, bad_rep = [], ids = {};
const forms = {}, decs = {}, lvls = {}, formFirst = {}, rangeBad = [];
let first = 0, minFair = 100, dupIds = 0;
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s);
  if (r.error) { if (errs.length < 3) errs.push(`semilla ${s}: ${r.error} ${JSON.stringify((r.fails || []).slice(0, 2))}`); continue; }
  const v = G.validateCase(r.def), rv = G.reviewCase(r.def);
  if (!v.ok || !rv.ok || rv.fairness < 90) { if (low.length < 3) low.push(`semilla ${s}: ${v.ok} ${rv.ok} ${rv.fairness}`); continue; }
  minFair = Math.min(minFair, rv.fairness);
  if (r.attempts === 1) first++;
  if (ids[r.def.id]) dupIds++; ids[r.def.id] = 1;
  { const b = r.bible, nS = b.cast.filter((c) => c.role === 'sospechoso').length, rg = G.DECOY_RANGE[b.level], md = G.maxDecoys(nS); // 4A
    forms[b.captureForm] = (forms[b.captureForm] || 0) + 1; decs[b.deceptive.length] = (decs[b.deceptive.length] || 0) + 1; lvls[b.level] = (lvls[b.level] || 0) + 1;
    if (r.attempts === 1) formFirst[b.captureForm] = (formFirst[b.captureForm] || 0) + 1;
    if (b.deceptive.length < Math.min(rg[0], md) || b.deceptive.length > Math.min(rg[1], md) || b.gen !== G.GEN_VERSION) rangeBad.push(s); }
  const t = r.bible.truth, k = t.culprit + '|' + t.method.id + '|' + t.motive.id;
  combos[k] = 1; culp[t.culprit] = 1; meth[t.method.id] = 1; mot[t.motive.id] = 1;
  if (s % 25 === 0) { // el informe se comprueba en una de cada 25
    const rep = G.caseReport(r.bible);
    if (typeof rep !== 'string' || rep.length < 800 || /\{\w+\}|undefined|NaN|(?:^|[^\p{L}\p{N}_])(?:de|a) el(?![\p{L}\p{N}_])/u.test(rep) || rep.split('\n').length > 120) bad_rep.push(s);
  }
}
const ms = Date.now() - t0;
ok(`${N} semillas consecutivas aceptadas al 100 %`, !errs.length && !low.length, errs.concat(low).join('\n   '));
ok(`tasa de primer intento ≥ 90 % (${(first / N * 100).toFixed(2)} %)`, first / N >= 0.9);
ok(`equidad mínima ≥ 90 (${minFair})`, minFair >= 90);
ok('ids de caso únicos', dupIds === 0, String(dupIds));
ok('informes legibles: texto, sin marcadores sueltos y de una página (≤ 120 líneas)', !bad_rep.length, bad_rep.slice(0, 5).join(','));
ok(`variedad: ${Object.keys(culp).length} culpables · ${Object.keys(meth).length} métodos · ${Object.keys(mot).length} móviles · ${Object.keys(combos).length} combinaciones`, Object.keys(culp).length >= 12 && Object.keys(meth).length === 9 && Object.keys(mot).length === 9 && Object.keys(combos).length >= Math.min(1000, N / 5), String(Object.keys(combos).length));
{ let same = true, where = '';
  for (let i = 0; i < 200; i++) { const s = i * 25 + 3, a = G.generateCase(s), b = G.generateCase(s); if (JSON.stringify(a) !== JSON.stringify(b) || G.caseReport(a.bible) !== G.caseReport(b.bible)) { same = false; where = String(s); break; } }
  ok('determinismo en 200 semillas (caso e informe idénticos)', same, where); }
{ // 4A: formas de captura, engañosos y niveles en las 5000 semillas ACEPTADAS
  const share = (m) => Math.max.apply(null, Object.keys(m).map((k) => m[k])) / N, show = (m) => Object.keys(m).sort().map((k) => k + ' ' + m[k]).join(' · ');
  ok(`4A: ≥ 4 formas de captura y ninguna supera el 40 % (${show(forms)})`, Object.keys(forms).length >= 4 && share(forms) <= 0.4);
  ok(`4A: aparecen los recuentos de engañosos 0, 1, 2 y 3 y ninguno supera el 40 % (${show(decs)})`, [0, 1, 2, 3].every((n) => decs[n] > 0) && share(decs) <= 0.4);
  ok(`4A: aparecen los tres niveles (${show(lvls)}) y cada caso respeta el rango de engañosos de su nivel`, ['facil', 'normal', 'dificil'].every((l) => lvls[l] > 0) && !rangeBad.length, rangeBad.slice(0, 5).join(','));
  ok('4A: cada forma de captura se acepta al primer intento ≥ 90 % de las veces', Object.keys(forms).every((f) => (formFirst[f] || 0) / forms[f] >= 0.9), show(formFirst));
}
ok(`tiempo total razonable (${(ms / 1000).toFixed(1)} s, tope ${MAX_MS / 1000} s)`, ms < MAX_MS);
ok('el caso 1 sigue igual (equidad 100)', G.reviewCase(G.CASES.tarta).fairness === 100);
console.log(bad ? `\n${bad} comprobación(es) fallida(s)` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
