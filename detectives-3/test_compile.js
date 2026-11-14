// Prueba del compilador y el generador (fase 3D-1): G.compileBible y G.generateCase.
// 300 semillas → caso aceptado (validador ok, revisor ok, equidad ≥ 90), tasa de primer intento, determinismo, textos sin marcadores sueltos,
// ruta de error que NO se oculta, y el caso 1 sin cambios. Uso: node test_compile.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const dist = (m, k) => { m[k] = (m[k] || 0) + 1; };
const show = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]).map((k) => `${k} ${m[k]}`).join(' · ');
const N = 300;

// 1. cada semilla da un caso aceptado
const errs = [], low = [], retried = [], ids = {}, culp = {}, meth = {}, mot = {}, att = {}, leftovers = [], dupIds = [];
const caso1 = JSON.stringify(G.CASES.tarta), f1 = G.reviewCase(G.CASES.tarta).fairness;
let first = 0, minFair = 100;
for (let s = 0; s < N; s++) {
  const r = G.generateCase(s);
  if (r.error) { if (errs.length < 3) errs.push(`semilla ${s}: ${r.error} ${JSON.stringify((r.fails || []).slice(0, 2))}`); continue; }
  const v = G.validateCase(r.def), rv = G.reviewCase(r.def);
  if (!v.ok || !rv.ok || rv.fairness < 90) { if (low.length < 3) low.push(`semilla ${s}: valid ${v.ok} ${JSON.stringify(v.errors.slice(0, 2))} review ${rv.ok} ${rv.fairness}`); continue; }
  minFair = Math.min(minFair, rv.fairness);
  if (r.attempts === 1) first++; else retried.push(s);
  dist(att, r.attempts);
  if (ids[r.def.id]) dupIds.push(s); ids[r.def.id] = 1;
  const t = r.bible.truth; dist(culp, t.culprit); dist(meth, t.method.id); dist(mot, t.motive.id);
  if (/\{\w+\}|undefined|NaN|(?:^|[^\p{L}\p{N}_])(?:de|a) el(?![\p{L}\p{N}_])/u.test(JSON.stringify(r.def))) leftovers.push(s);
}
ok(`${N} semillas dan un caso aceptado (sin errores de generación)`, !errs.length, errs.join('\n   '));
ok('todas pasan el validador, el revisor y equidad ≥ 90', !low.length, low.join('\n   '));
const rate = first / N;
ok(`tasa de primer intento ≥ 90 % (${(rate * 100).toFixed(1)} %; reintentos en ${retried.length}: ${retried.slice(0, 8).join(',')})`, rate >= 0.9);
ok('equidad mínima ≥ 90', minFair >= 90, String(minFair));
ok('ids de caso únicos por semilla', !dupIds.length, dupIds.slice(0, 5).join(','));
ok('ningún texto con marcadores sueltos ni «de el»/«a el»', !leftovers.length, leftovers.slice(0, 5).join(','));
ok('hay variedad de culpables, métodos y móviles', Object.keys(culp).length >= 8 && Object.keys(meth).length >= 6 && Object.keys(mot).length >= 6, `${Object.keys(culp).length}/${Object.keys(meth).length}/${Object.keys(mot).length}`);
console.log('   intentos:', show(att), '\n   culpable:', show(culp), '\n   método:', show(meth), '\n   móvil:', show(mot));

// 2. determinismo: misma semilla ⇒ mismo def y misma biblia (byte a byte), y no se ensucia el estado global
{
  let same = true, where = '';
  for (let s = 0; s < 60; s++) {
    const a = G.generateCase(s * 7 + 1), b = G.generateCase(s * 7 + 1);
    if (JSON.stringify(a) !== JSON.stringify(b)) { same = false; where = String(s * 7 + 1); break; }
  }
  ok('misma semilla ⇒ resultado idéntico (60 semillas, dos veces)', same, where);
  const b0 = G.genClues(G.genTruth(5)), snap = JSON.stringify(b0); G.compileBible(b0);
  ok('compileBible no modifica la biblia que recibe', JSON.stringify(b0) === snap);
  ok('el código de caso lleva la versión del generador', /^G6-[0-9a-z]+$/.test(G.generateCase(123).code));
}

// 3. generateCase no registra casos salvo que se pida; con { register:true } queda en G.CASES
{
  const r = G.generateCase(9);
  ok('por defecto no toca G.CASES', !G.CASES[r.def.id]);
  const r2 = G.generateCase(9, { register: true });
  ok('con register:true el caso queda en G.CASES y valida con su clave', G.CASES[r2.def.id] === r2.def && G.validateCase(r2.def).ok);
  delete G.CASES[r2.def.id];
}

// 4. la ruta de error NO se oculta: si el generador estuviera roto, generateCase devuelve { error } tras 8 intentos
{
  const orig = G.genClues;
  G.genClues = (b) => { const x = JSON.parse(JSON.stringify(orig(b))); x.proof = []; return x; };
  const r = G.generateCase(1);
  G.genClues = orig;
  ok('con un generador roto devuelve { error } tras 8 intentos (no se oculta)', !!r.error && !r.def && r.attempts === 8 && r.fails.length === 8, JSON.stringify(r).slice(0, 200));
}

// 4b. 4A: generateCase con { level, form } fuerza ambas cosas y sigue dando casos aceptados; cada forma deja las pruebas que exige su contrato
{
  let all = true, why = '', n = 0;
  Object.keys(G.CAPTURE_FORMS).forEach((f) => G.LEVELS.forEach((l) => {
    for (let s = 0; s < 15; s++) {
      const r = G.generateCase(s * 31 + 5, { level: l, form: f }); n++;
      if (r.error) { all = false; why = `${f}/${l}/${s}: ${r.error}`; continue; }
      const b = r.bible, want = G.CAPTURE_FORMS[b.captureForm].proof.slice().sort().join(','), got = b.proof.map((id) => id.split('_')[0]).sort().join(',');
      const formOk = b.captureForm === f || (f === 'testigos_cruzados' && b.captureForm === 'clasica'); // sin testigo válido, testigos_cruzados pasa a clasica
      if (r.attempts === 1 && (!formOk || b.level !== l)) { all = false; why = `${f}/${l}/${s}: no respeta las opciones`; }
      if (want !== got || r.review.fairness < 90 || !G.validateCase(r.def).ok) { all = false; why = `${f}/${l}/${s}: pruebas [${got}] frente a [${want}] o caso no válido`; }
    }
  }));
  ok(`4A: ${n} casos con cada forma × nivel (4 × 3 × 15) aceptados, con las pruebas de su forma y equidad ≥ 90`, all, why);
  ok('4A: con las mismas opciones, la misma semilla da el mismo caso', JSON.stringify(G.generateCase(11, { level: 'dificil', form: 'desliz' })) === JSON.stringify(G.generateCase(11, { level: 'dificil', form: 'desliz' })));
  const dec = G.generateCase(40, { level: 'dificil' });
  ok('4A: los engañosos del def son sospechosos descartables con explicación', dec.bible.deceptive.every((d) => { const su = dec.def.suspects.filter((x) => x.id === d.who)[0]; return su && su.clearedBy && su.clearedBy.length > 0; }), JSON.stringify(dec.bible.deceptive));
}

// MP: acceso por código (G.caseSeedFromCode): ida y vuelta, mayúsculas, errores y otra versión
{ const rt = [1, 110867, 74937935, 4294967295].every((sd) => G.caseSeedFromCode(G.caseCode(sd)).seed === sd), up = G.caseSeedFromCode(' g6-2DJN ').seed === 110867;
  ok('MP: el código G6-… vuelve a su semilla (ida y vuelta, con espacios y mayúsculas); formato malo o versión distinta dan error', rt && up && G.caseSeedFromCode('hola').error && G.caseSeedFromCode('').error && G.caseSeedFromCode('G' + (G.GEN_VERSION + 1) + '-2djn').error && G.generateCase(110867).code === 'G6-2djn'); }

// 5. el caso 1 sigue igual
ok('el caso 1 no ha cambiado (equidad 100 y mismo contenido)', f1 === 100 && JSON.stringify(G.CASES.tarta) === caso1, String(f1));
console.log(bad ? `\n${bad} comprobación(es) fallida(s)` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
