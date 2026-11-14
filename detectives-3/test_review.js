// Prueba del revisor de equidad (fase 2A): el caso 1 sale bien parado y los casos injustos hechos a propósito salen mal.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sandbox = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, parseInt, isFinite, Infinity, Proxy };
sandbox.globalThis = sandbox;
sandbox.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkCtx() });
vm.createContext(sandbox);
const files = process.argv.slice(2);
for (const f of files) {
  const code = fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const G = sandbox.G;
G.save = { data: { settings: {}, upgrades: {} } };
let bad = 0;
const clone = (o) => JSON.parse(JSON.stringify(o));
const base = G.CASES.tarta;
const review = (mut) => { const d = clone(base); if (mut) mut(d); return G.reviewCase(d); };
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const r0 = review();
console.log('Caso 1:', JSON.stringify({ ok: r0.ok, equidad: r0.fairness, stats: r0.stats }));
r0.findings.forEach((f) => console.log(`  ${f.sev}: ${f.msg}`));
ok('el caso 1 es justo y saca buena nota (≥ 90)', r0.ok && r0.fairness >= 90, JSON.stringify(r0.findings));
const has = (r, code) => r.findings.some((f) => f.code === code);
const broken = (name, mut, code, maxScore) => { const r = review(mut); ok(`${name} → ${code}` + (maxScore !== undefined ? ` y nota ≤ ${maxScore}` : ''), has(r, code) && (maxScore === undefined || r.fairness <= maxScore) && r.fairness < r0.fairness, `nota ${r.fairness} · ${JSON.stringify(r.findings.map((f) => f.code))}`); };
broken('el culpable se puede descartar', (d) => { d.suspects.find((s) => s.id === 'pimienta').clearedBy = ['vitrina_vacia']; }, 'culpable_descartable', 65);
broken('un inocente igual de sospechoso que el culpable', (d) => { d.suspects.find((s) => s.id === 'merengue').clearedBy = []; d.clues.tenedor_labial.sus = { merengue: 40 }; }, 'inocente_igual', 65);
broken('un inocente muy cerca del culpable', (d) => { d.suspects.find((s) => s.id === 'merengue').clearedBy = []; d.clues.tenedor_labial.sus = { merengue: 21 }; }, 'inocente_cercano');
broken('pocas pruebas señalan al culpable', (d) => { Object.keys(d.clues).forEach((c) => { if (d.clues[c].sus) delete d.clues[c].sus.pimienta; }); }, 'pocas_pruebas', 65);
broken('un inocente sin pista falsa', (d) => { d.clues.tenedor_labial.sus = {}; }, 'sin_pista_falsa');
broken('mentira circular (solo la desmiente el propio mentiroso)', (d) => { d.lies.merengue.refutedBy = ['testimonio_merengue']; }, 'mentira_circular', 65);
broken('caso sin mentiras', (d) => { d.lies = {}; }, 'sin_mentiras');
{
  const r = review((d) => { d.title = ''; });
  ok('un caso que no pasa el validador sale con nota 0', !r.ok && r.fairness === 0 && has(r, 'invalido'));
  const r2 = G.reviewCase(null);
  ok('lo que no es un caso se rechaza sin reventar', !r2.ok && r2.fairness === 0);
}
{
  const r = review((d) => { d.suspects.find((s) => s.id === 'pimienta').clearedBy = ['vitrina_vacia']; d.lies = {}; d.clues.tenedor_labial.sus = {}; });
  ok('varios fallos juntos nunca bajan de 0', r.fairness >= 0 && r.fairness < 60, 'nota ' + r.fairness);
}
process.exit(bad ? 1 : 0);
