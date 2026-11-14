// Prueba de la nota de calidad final (fase 2B-2; REESCRITA en S3b-1 de 4D-2 para la NOTA v3 por par (caso, dificultad)): el caso 1 saca buena nota y los casos rotos a propósito sacan mala.
// El caso 1 es un caso HECHO A MANO sin genLevel: sin `difficulty` explícito se mide como Normal (30-40 min). Para medirlo en Fácil o Difícil se pasa `difficulty`.
// Los casos GENERADOS por nivel (genLevel, genDecoys, anti-saturación, pelados) se prueban en test_quality_spread.js.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sandbox = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, parseInt, isFinite, Infinity, Proxy, setTimeout };
sandbox.globalThis = sandbox;
sandbox.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
vm.createContext(sandbox);
for (const f of process.argv.slice(2)) vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), sandbox, { filename: f });
const G = sandbox.G;
G.save = { data: { settings: {}, upgrades: {} } };
let bad = 0;
const clone = (o) => JSON.parse(JSON.stringify(o));
const base = G.CASES.tarta;
const rate = (mut, opts) => { const d = clone(base); if (mut) mut(d); return G.qualityCase(d, opts); };
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const has = (r, code) => r.findings.some((f) => f.code === code);
const sum = (r) => `nota ${r.quality} (${r.grade}) equidad ${r.fairness} jugabilidad ${r.play} · ${JSON.stringify(r.findings.map((f) => f.code))}`;

const r0 = rate();
const W = G.QUALITY_CFG.weights, WS = Object.keys(W).reduce((a, k) => a + W[k], 0);
console.log('Caso 1:', sum(r0), `· ${r0.bot.humanMinutes} min`);
r0.findings.forEach((f) => console.log(`  ${f.src}/${f.sev}: ${f.msg}`));
ok('el caso 1 se acepta con nota media-alta (55-95), nunca 100 de regalo', r0.ok && r0.accept && r0.quality >= 55 && r0.quality <= 95 && r0.grade !== 'rechazar', sum(r0));
ok('el caso 1 (a mano, sin genLevel) se mide como Normal 30-40 si no se dice otra cosa', r0.tier === 'normal' && r0.level === 'normal' && r0.band[0] === 30 && r0.band[1] === 40, sum(r0));
const rE = rate(null, { difficulty: 'easy' }), rH0 = rate(null, { difficulty: 'hard' });
ok('con difficulty explícito se mide con la banda de esa dificultad (Fácil 20-30, Difícil 40-55)', rE.tier === 'easy' && rE.level === 'facil' && rE.band[0] === 20 && rE.band[1] === 30 && rH0.tier === 'hard' && rH0.level === 'dificil' && rH0.band[0] === 40 && rH0.band[1] === 55, [rE.band, rH0.band]);
ok('no tiene errores', !r0.findings.some((f) => f.sev === 'error'), sum(r0));
ok('es determinista', JSON.stringify(rate().findings) === JSON.stringify(r0.findings) && rate().quality === r0.quality);
ok('la nota es la suma ponderada de sus 10 componentes (v3), cada una entre 0 y 100', Object.keys(W).length === 10 && WS === 100 && Math.abs(r0.quality - Object.keys(W).reduce((a, k) => a + W[k] * r0.parts[k], 0) / WS) <= 1 && Object.keys(W).every((k) => r0.parts[k] >= 0 && r0.parts[k] <= 100), JSON.stringify(r0.parts));
{
  const GR = G.QUALITY_CFG.groups, gw = (ks) => ks.reduce((a, k) => a + W[k], 0);
  ok('55 % calidad intrínseca (8 componentes) + 45 % ajuste al perfil (duración y profundidad)', GR.intrinseca.length === 8 && GR.ajuste.join() === 'dur,depth' && gw(GR.intrinseca) === 55 && gw(GR.ajuste) === 45, [gw(GR.intrinseca), gw(GR.ajuste)]);
  ok('la nota es ≈ 0,55 · intrínseca + 0,45 · ajuste (sin avisos de ayuda floja)', Math.abs(r0.quality - (0.55 * r0.intrinseca + 0.45 * r0.ajuste)) <= 2, [r0.quality, r0.intrinseca, r0.ajuste]);
  ok('ya no existe la regla provisional levelTier de v2 ni el componente «rich»', G.QUALITY_VERSION === 3 && G.QUALITY_CFG.levelTier === undefined && r0.parts.rich === undefined && r0.parts.depth !== undefined);
  ok('la respuesta trae nivel, perfil, intrínseca y ajuste', r0.level === 'normal' && r0.profile && r0.profile.diff === 'normal' && typeof r0.intrinseca === 'number' && typeof r0.ajuste === 'number');
}

const worse = (name, mut, code, opts, maxQ) => {
  const r = rate(mut, opts);
  ok(`${name} → ${code}, peor nota que el caso 1` + (maxQ !== undefined ? ` y ≤ ${maxQ}` : ''), has(r, code) && r.quality < r0.quality && (maxQ === undefined || r.quality <= maxQ), sum(r));
  return r;
};
// ---- R1: casos ROTOS o PELADOS a propósito: la nota tiene que bajar claramente ----
{
  const r2 = rate(null, { humanFactor: 1.2 });
  ok('un caso corto para su banda (≈ 13 min) pierde ≥ 10 puntos de duración y ≥ 3 de nota, sin error', !r2.findings.some((f) => f.sev === 'error') && r2.parts.dur <= r0.parts.dur - 10 && r2.quality <= r0.quality - 3, sum(r2) + ' ' + JSON.stringify(r2.parts));
  const r3 = rate(null, { difficulty: 'hard' });
  ok('la MISMA duración puntúa distinto según la dificultad: en Difícil (40-55) el caso 1 (18 min) cae mucho', r3.tier === 'hard' && r3.parts.dur <= 20 && r3.quality <= r0.quality - 10, sum(r3) + ' ' + JSON.stringify(r3.parts));
  const r4 = rate(null, { difficulty: 'easy', humanFactor: 3.4 });
  ok('en Fácil, un caso de ≈ 37 min (pasado de banda) puntúa peor que dentro de banda', r4.tier === 'easy' && r4.parts.dur < 100 && r4.quality < rate(null, { difficulty: 'easy', humanFactor: 2.3 }).quality, sum(r4));
  const r5 = rate(null, { difficulty: 'normal', humanFactor: 2.9 });
  ok('en Normal (30-40) un caso de ≈ 31 min (dentro de banda) saca duración 100', r5.tier === 'normal' && r5.parts.dur === 100, sum(r5) + ' ' + JSON.stringify(r5.parts));
}
const rejected = (r) => ok('  …y no se acepta', !r.accept && !r.ok, sum(r));
const wall = (rid, y) => (d) => { d.rooms[rid].map[y] = '#'.repeat(d.rooms[rid].map[y].length); };

// equidad rota
rejected(worse('el culpable se puede descartar', (d) => { d.suspects.find((s) => s.id === 'pimienta').clearedBy = ['vitrina_vacia']; }, 'culpable_descartable', undefined, 40));
rejected(worse('un inocente igual de sospechoso que el culpable', (d) => { d.suspects.find((s) => s.id === 'merengue').clearedBy = []; d.clues.tenedor_labial.sus = { merengue: 40 }; }, 'inocente_igual', undefined, 40));
// jugabilidad rota
rejected(worse('la tienda partida por una pared', wall('tienda', 5), 'atasco', undefined, 40));
rejected(worse('la cocina partida por una pared', wall('cocina', 3), 'atasco', undefined, 40));
// duración
rejected(worse('un caso que dura muy poco', null, 'demasiado_corto', { humanFactor: 0.3 }, 40));
rejected(worse('un caso que dura muchísimo', null, 'demasiado_largo', { humanFactor: 8 }, 40));
{
  const r = rate(null, { humanFactor: 1.0 });
  ok('algo corto (≈ 11 min) → aviso «corto», nota baja pero sin error', has(r, 'corto') && !r.findings.some((f) => f.sev === 'error') && r.quality < r0.quality, sum(r));
  const r2 = rate(null, { difficulty: 'easy', humanFactor: 2.3 });
  ok('algo largo (≈ 25 min) con el factor 2,3, medido en Fácil → cae en la banda 20-30 y mejora la nota', r2.tier === 'easy' && r2.quality >= rE.quality && !has(r2, 'largo') && !has(r2, 'corto'), sum(r2));
}
// tiempo de referencia
worse('parSeconds demasiado ajustado', (d) => { d.parSeconds = 300; }, 'par_corto');
worse('parSeconds demasiado generoso', (d) => { d.parSeconds = 9000; }, 'par_largo');
// pistas
{
  const r = rate((d) => { d.suspects.find((s) => s.id === 'merengue').clearedBy = []; d.clues.tenedor_labial.sus = { merengue: 21 }; });
  ok('equidad floja se arrastra a la nota final', r.fairness < r0.fairness && r.quality < r0.quality, sum(r));
}
// casos inválidos y basura
{
  const r = rate((d) => { d.title = ''; });
  ok('un caso inválido sale con nota 0 y no se acepta', r.quality === 0 && !r.accept && !r.ok && has(r, 'invalido') && r.bot === null, sum(r));
  const r2 = G.qualityCase(null), r3 = G.qualityCase({}), r4 = G.qualityCase(undefined);
  ok('lo que no es un caso no revienta la nota', [r2, r3, r4].every((x) => x.quality === 0 && !x.accept));
}
{
  const r = rate((d) => { d.suspects.find((s) => s.id === 'pimienta').clearedBy = ['vitrina_vacia']; d.lies = {}; wall('tienda', 5)(d); d.parSeconds = 100; });
  ok('varios fallos juntos nunca bajan de 0 ni pasan de 40', r.quality >= 0 && r.quality <= 40 && !r.accept, sum(r));
}
ok('la nota siempre está entre 0 y 100 y las claves son coherentes', [r0, rate(null, { humanFactor: 0.3 }), rate(wall('tienda', 5))].every((x) => x.quality >= 0 && x.quality <= 100 && typeof x.grade === 'string' && Array.isArray(x.findings)));
// ---- nivel del par y casos manipulados (caso 1 a mano) ----
{
  const real = G.botPlay, seen = [];
  G.botPlay = function (def, o) { seen.push(o && o.difficulty); return real.apply(this, arguments); };
  const got = [undefined, 'easy', 'normal', 'hard'].map((df) => { seen.length = 0; rate(null, df ? { difficulty: df } : undefined); return seen[0]; });
  G.botPlay = real;
  ok('el bot juega en la dificultad del par (sin dificultad → normal)', got.join() === 'normal,easy,normal,hard', got);
  const mk = (lv, opts) => rate((d) => { d.genLevel = lv; }, opts);
  ok('un caso con genLevel se mide con su nivel (facil→Fácil, dificil→Difícil)', mk('facil').tier === 'easy' && mk('facil').band[1] === 30 && mk('dificil').tier === 'hard' && mk('dificil').band[0] === 40, [mk('facil').tier, mk('dificil').tier]);
  ok('opts.difficulty manda sobre genLevel', mk('facil', { difficulty: 'hard' }).tier === 'hard' && mk('dificil', { difficulty: 'easy' }).tier === 'easy');
  { const x = mk('raro'), y = rate((d) => { d.genDecoys = -1; }); ok('un genLevel o genDecoys inválido lo para el esquema: nota 0, no se acepta y no revienta', x.quality === 0 && !x.accept && has(x, 'invalido') && y.quality === 0 && !y.accept && has(y, 'invalido'), [x.quality, y.quality]); }
  const bits = (r) => r.bot.stats.metrics;
  const dup = rate((d) => {
    const f = (x) => (typeof x === 'string' ? 'No sé nada de eso, de verdad.' : Array.isArray(x) ? x.map(f) : x && x.say ? Object.assign({}, x, { say: f(x.say) }) : x && x.text ? Object.assign({}, x, { text: f(x.text) }) : x);
    Object.values(d.npcs).forEach((n) => { if (n.first) n.first = f(n.first); if (n.chat) n.chat = f(n.chat); if (n.press) n.press = f(n.press); (n.topics || []).forEach((t) => { if (!/^coartada/.test(t.id || '')) t.responses = f(t.responses); }); });
    Object.values(d.rooms).forEach((rm) => (rm.props || []).forEach((p) => (p.steps || []).forEach((s) => { if (s.text) s.text = 'Aquí no hay nada raro, de verdad.'; })));
  });
  ok('líneas repetidas en todo el caso → avisa «textos_repetidos» y baja la proporción de líneas distintas', dup.ok && has(dup, 'textos_repetidos') && bits(dup).distinctShare < bits(r0).distinctShare && dup.parts.text < r0.parts.text, [r0.parts.text, dup.parts.text, bits(dup).distinctShare]);
  const lab = rate((d) => { Object.values(d.rooms).forEach((rm) => (rm.props || []).forEach((p) => { if (p.steps) p.label = 'Cosa rara'; })); });
  ok('todas las etiquetas de objeto iguales → baja «obj» y avisa «objetos_repetidos»', lab.ok && lab.parts.obj < r0.parts.obj && has(lab, 'objetos_repetidos'), [r0.parts.obj, lab.parts.obj]);
  const kind = rate((d) => { Object.values(d.clues).forEach((c) => { c.kind = 'documento'; }); });
  ok('todas las pistas del mismo tipo → baja «var» (variedad de pistas)', kind.ok && kind.parts.var < r0.parts.var && bits(kind).clueKinds === 1, [r0.parts.var, kind.parts.var]);
}
ok('el caso original no se modifica', JSON.stringify(base) === JSON.stringify(G.CASES.tarta) && base.parSeconds === 1500);
process.exit(bad ? 1 : 0);
