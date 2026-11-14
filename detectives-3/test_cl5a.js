// CL-5a: datos de duración v7 (solo GEN_VERSION >= 7): engaños Normal [2,3] 50/50 · Difícil [3,3] · Fácil [0,1]; charlas de relleno tope 3 por personaje en Difícil (2 en los demás);
// CL-5b: +8 curiosidades nuevas SOLO en Difícil v7 (banco 32 → 40); objetivos de relleno v7 en los datos; v6 SIN cambios (rangos y charlas de siempre). Con mutación: si el rango v7 no se usa, la prueba lo detecta.
// Una a una: node test_cl5a.js [N=40]
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 40;
let bad = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
function gen(G, ver, level, n) { G.GEN_VERSION = ver; const out = []; for (let i = 1; out.length < n && i < n * 6; i++) { const r = G.generateCase(i * 7919 + 1, { register: true, level }); if (!r.error && r.def.genLevel === level) out.push(r.def); } return out; }
const chatMax = (def) => Math.max(0, ...Object.values(def.npcs || {}).map((n) => (n.topics || []).filter((t) => /^f_ch\d/.test(t.id)).length));
const labelsDe = (def) => { const o = []; Object.values(def.rooms || {}).forEach((r) => (r.props || []).forEach((q) => { if (/^cur_/.test(q.id)) o.push(q.label); })); return o; };
function correr(patch) {
  const G = require('./tools/load_g.js')(MOD, patch), r = {};
  G.GEN_VERSION = 6; ok(JSON.stringify(G.decoyRange('normal')) === '[1,2]' && JSON.stringify(G.decoyRange('dificil')) === '[2,3]', 'v6: rangos de siempre (Normal 1-2, Difícil 2-3)');
  G.GEN_VERSION = 7; ok(JSON.stringify(G.decoyRange('facil')) === '[0,1]' && JSON.stringify(G.decoyRange('normal')) === '[2,3]' && JSON.stringify(G.decoyRange('dificil')) === '[3,3]', 'v7: rangos Fácil [0,1] · Normal [2,3] · Difícil [3,3]');
  const T = G.GEN_DATA.compile.levels;
  ok(T.facil.targetMinV7 === 24 && T.normal.targetMinV7 === 32 && T.dificil.targetMinV7 === 39 && T.dificil.maxChatPerNpcV7 === 3, 'datos: objetivos v7 (24 · 32 · 39, 4F-0b 3/4-d) y charlas Difícil 3');
  const EX = G.GEN_DATA.compile.extra, nuevas = (EX.curiosV7 || []).map((c) => c.label);
  ok(EX.curios.length === 32 && nuevas.length === 8 && new Set(nuevas.concat(EX.curios.map((c) => c.label))).size === 40 && EX.curiosV7.every((c) => c.sprite && G.spr[c.sprite] && c.text && c.text.length === 2 && c.text[0] && c.text[1]), 'banco: 32 curiosidades de siempre + 8 nuevas (CL-5b), sin etiquetas repetidas y con sprite, texto y remate');
  ['facil', 'normal', 'dificil'].forEach((L) => {
    const d7 = gen(G, 7, L, N), rg = G.DECOY_RANGE_V7[L]; r[L] = d7.map((d) => d.genDecoys);
    ok(d7.length === N, L + ': v7 genera ' + N + ' casos');
    ok(d7.every((d) => d.genDecoys >= rg[0] && d.genDecoys <= rg[1]), L + ': engaños v7 dentro de ' + JSON.stringify(rg) + ' (' + [...new Set(r[L])] + ')');
    ok(d7.every((d) => chatMax(d) <= (L === 'dificil' ? 3 : 2)), L + ': charlas de relleno por personaje ≤ ' + (L === 'dificil' ? 3 : 2));
    if (L === 'dificil') ok(d7.some((d) => chatMax(d) === 3), 'dificil: algún personaje llega a 3 charlas');
    const usan7 = d7.filter((d) => labelsDe(d).some((l) => nuevas.indexOf(l) >= 0)).length;
    ok(L === 'dificil' ? usan7 >= N * 0.5 : usan7 === 0, L + ': curiosidades nuevas solo en Difícil v7 (' + usan7 + ' de ' + N + ' casos las llevan)');
    const d6 = gen(G, 6, L, 8), r6 = G.DECOY_RANGE[L];
    ok(d6.every((d) => labelsDe(d).every((l) => nuevas.indexOf(l) < 0)), L + ': v6 sin curiosidades nuevas');
    ok(d6.every((d) => d.genDecoys >= r6[0] && d.genDecoys <= r6[1] && chatMax(d) <= 2 && d.genV === undefined), L + ': v6 con engaños ' + JSON.stringify(r6) + ', charlas ≤ 2 y sin genV');
  });
  ok(r.normal.filter((x) => x === 2).length >= N * 0.25 && r.normal.filter((x) => x === 3).length >= N * 0.25, 'normal: reparto de engaños 2/3 equilibrado (' + r.normal.filter((x) => x === 2).length + '/' + r.normal.filter((x) => x === 3).length + ')');
  ok(r.dificil.every((x) => x === 3), 'dificil: siempre 3 engaños');
  return bad;
}
correr(); console.log(`casos v7 ${N} por nivel · comprobaciones ${checks} · fallos ${bad}`);
const real = bad; bad = 0; checks = 0;
const MUT = [
  ['bible.js', 'G.decoyRange = (level) => (G.GEN_VERSION >= 7 ? G.DECOY_RANGE_V7 : G.DECOY_RANGE)[level];', 'G.decoyRange = (level) => G.DECOY_RANGE[level];', 'rango de engaños v7'],
  ['compile.js', "G.GEN_VERSION >= 7 && b.level === 'dificil' && EX.curiosV7 ? EX.curios.concat(EX.curiosV7) : EX.curios", 'EX.curios', 'curiosidades nuevas de Difícil'],
];
let falla = false; const q = console.log;
MUT.forEach(([f, d, h, nom]) => {
  const m = mutador(f, d, h); bad = 0; checks = 0; console.log = () => {}; correr(m.patch); console.log = q;
  if (!m.ok) { console.log('✗ mutación (' + nom + '): ' + m.motivo); falla = true; return; }
  console.log(`(mutación «${nom}»: ${bad} fallos esperados)`); if (!bad) { console.log('✗ la mutación NO se detecta: ' + nom); falla = true; }
});
if (real || falla) process.exit(1); console.log('\nTodo en orden');
