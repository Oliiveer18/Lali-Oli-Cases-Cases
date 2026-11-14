// CL-5c-c 1/4: el VALIDADOR de casos conoce las reglas de justicia de los puzles (J1-J4; docs/DISENO_PUZLES_CL5C.md). Una a una: node test_validador_puzles.js [N=24]
// Toma casos de Difícil v7 con puzles, los estropea EN MEMORIA de ocho maneras y exige que el validador diga que no vale; los casos sin tocar, los de Fácil/Normal y v6 deben seguir válidos.
// Con mutación: si el bloque de puzles del validador se apaga, la prueba lo detecta.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 24;
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
const clone = (x) => JSON.parse(JSON.stringify(x));
const pzs = (d) => { const o = []; Object.values(d.rooms).forEach((r) => (r.props || []).forEach((q) => { if (/^pz_\d+$/.test(q.id)) o.push(q); })); return o; };
function correr(patch) {
  const G = require('./tools/load_g.js')(MOD, patch); G.GEN_VERSION = 7;
  const casos = []; for (let i = 1; casos.length < N && i < N * 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: 'dificil' }); if (!r.error) casos.push(r.def); }
  ok(casos.length === N, 'se generan ' + N + ' casos de Difícil v7');
  const rechaza = (d, rx, m) => { const v = G.validateCase(d); ok(!v.ok && v.errors.some((e) => rx.test(e)), m + ' → el validador debe rechazarlo' + (v.ok ? '' : ' (dijo: ' + v.errors[0] + ')')); };
  const stat = { codigo: 0, linea: 0 };
  casos.forEach((def) => {
    const v = G.validateCase(def); ok(v.ok, 'caso sin tocar válido: ' + (v.errors || [])[0]);
    pzs(def).forEach((q0) => {
      const tipo = q0.steps[0].mini.type;
      const tocar = (f) => { const d = clone(def), q = pzs(d).filter((x) => x.id === q0.id)[0]; f(d, q, q.steps[0]); return d; };
      rechaza(tocar((d, q, st) => { st.requires = {}; }), /sin requires|exige/, 'J4 · sin requires');
      rechaza(tocar((d, q, st) => { st.clue = Object.keys(d.clues)[0]; }), /entregar una pista/, 'J4 · el puzle entrega una pista');
      rechaza(tocar((d, q, st) => { const o = Object.values(d.rooms).reduce((a, r) => a.concat(r.props || []), []).filter((p) => !/^pz_/.test(p.id) && p.steps && p.steps[0] && p.steps[0].clue)[0]; o.steps[0].requires = { clue: st.requires.clue.slice(0, 1) }; }), /ciclo|exige pistas/, 'J4 · un paso que da pista exige una pista de puzle (ciclo)');
      if (tipo === 'code') {
        stat.codigo++;
        rechaza(tocar((d, q, st) => { st.mini.code = st.mini.code === '0000' ? '1111' : '0000'; }), /no coincide/, 'J3 · código distinto de la hora impresa');
        rechaza(tocar((d, q, st) => { st.mini.code = '123'; }), /4 cifras/, 'J3 · código de 3 cifras');
        rechaza(tocar((d, q, st) => { const c = d.clues[st.requires.clue[0]]; c.text = c.text.replace(/\d{1,2}:\d{2}/, 'tarde'); }), /no coincide/, 'J1 · la pista no imprime la hora');
      } else {
        stat.linea++;
        rechaza(tocar((d, q, st) => { const e = st.mini.events, t = e[0]; e[0] = e[1]; e[1] = t; }), /crecientes/, 'J2 · horas desordenadas');
        rechaza(tocar((d, q, st) => { st.mini.events.pop(); st.mini.events.pop(); }), /3 o 4 sucesos|no son las que exige/, 'J2 · línea con menos de 3 sucesos');
        rechaza(tocar((d, q, st) => { const c = d.clues[st.mini.events[1].clue]; c.title = d.clues[st.mini.events[0].clue].title; }), /títulos/, 'J2 · títulos de pista repetidos');
        rechaza(tocar((d, q, st) => { const c = d.clues[st.mini.events[0].clue]; c.text = c.text.replace(st.mini.events[0].time, 'a la hora de siempre'); }), /imprime la hora/, 'J1 · la pista de un suceso no imprime su hora');
      }
    });
  });
  ok(stat.codigo >= 5 && stat.linea >= 5, 'la muestra incluye códigos y líneas de tiempo (' + stat.codigo + ' / ' + stat.linea + ')');
  // lo que no lleva puzles sigue como siempre
  G.GEN_VERSION = 7; ['facil', 'normal'].forEach((L) => { for (let i = 1; i <= 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: L }); ok(!r.error && G.validateCase(r.def).ok, L + ' v7 sigue válido'); } });
  G.GEN_VERSION = 6; for (let i = 1; i <= 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: 'dificil' }); ok(!r.error && G.validateCase(r.def).ok && pzs(r.def).length === 0, 'Difícil v6 sigue válido y sin puzles'); }
  return bad;
}
correr(null); console.log(`casos ${N} · comprobaciones ${checks} · fallos ${bad}`);
const real = bad; bad = 0; checks = 0;
const MUT = [
  ['logic.js', 'if (pzList.length) {', 'if (false) {', 'validador sin reglas de puzles'],
  ['logic.js', "if (!printed(req[0], c)) E(", "if (false) E(", 'validador sin comprobar el código'],
  ['logic.js', "else if (k && m - minutes(ev[k - 1].time) < 10) E(", "else if (false) E(", 'validador sin comprobar el orden de la línea'],
];
let falla = false; const q = console.log;
MUT.forEach(([f, d, h, nom]) => {
  const m = mutador(f, d, h); bad = 0; checks = 0; console.log = () => {}; try { correr(m.patch); } catch (e) { bad++; } console.log = q;
  if (!m.ok) { console.log('✗ mutación (' + nom + '): ' + m.motivo); falla = true; return; }
  console.log(`(mutación «${nom}»: ${bad} fallos esperados)`); if (!bad) { console.log('✗ la mutación NO se detecta: ' + nom); falla = true; }
});
if (real || falla) process.exit(1); console.log('\nTodo en orden');
