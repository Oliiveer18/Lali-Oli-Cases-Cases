// c4b · GRAB-3 (cp. 257, compile.js `evid` + gen_data `mech.grabReac`): reacción NERVIOSA al enseñar una grabación. Una a una: node test_grab_reac.js [N=25]
// (1) COBERTURA: todo par (grabación, sospechoso señalado: c.points o refutación de su mentira) SIN frase propia tiene una frase nerviosa del banco de SU tono. (2) NO TOCA LAS PROPIAS: confesión, admisión y explicación del engañoso
// quedan idénticas con el interruptor apagado, y lo demás del caso (todo salvo esas frases) no cambia. (3) SIN FUGA: descartes y señuelos salen de la misma pool. (4) v6 sin ninguna nerviosa.
// Mutaciones: distingue señuelo · pisa la confesión · pool de otro tono · interruptor apagado.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'], N = +process.argv[2] || 25;
let bad = 0, checks = 0; const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } };
const load = (patch, v) => { const G = require('./tools/load_g.js')(MOD, patch ? patch.patch : undefined); G.GEN_VERSION = v || 7; return G; };
const sinEv = (def) => JSON.stringify(def, (k, v) => (k === 'evidence' ? undefined : v));
const casos = (G) => { const o = []; LV.forEach((L) => { for (let i = 1; i <= N; i++) { const r = G.generateCase(i * 7919 + 1, { level: L }); if (!r.error) o.push(r); } }); return o; };
// pares (grabación, sospechoso) del caso, con su tipo de frase propia (según la biblia)
function pares(b) {
  const out = [], liesBy = {}; b.lies.forEach((l) => { liesBy[l.who] = l; });
  const decoy = (b.deceptive || []).map((d) => d.who);
  b.clues.filter((c) => c.kind === 'grabación').forEach((c) => {
    const subj = Array.from(new Set(Object.keys(c.points || {}).concat(b.lies.filter((l) => (l.refutedBy || []).indexOf(c.id) >= 0).map((l) => l.who))));
    subj.forEach((s) => {
      const cm = b.cast.find((x) => x.id === s); if (!cm || cm.role === 'cliente') return;
      const confiesa = s === b.truth.culprit && b.proof.indexOf(c.id) >= 0;
      const admite = !confiesa && s !== b.truth.culprit && liesBy[s] && liesBy[s].refutedBy.indexOf(c.id) >= 0 && c.role !== 'prueba';
      const explica = !confiesa && s !== b.truth.culprit && decoy.indexOf(s) >= 0 && c.role === 'falsa' && c.points && c.points[s];
      out.push({ c, s, propia: !!(confiesa || admite || explica) });
    });
  });
  return out;
}
const G1 = load(), POOL = G1.GEN_DATA.compile.mech.grabReac.frases, TODAS = Object.keys(POOL).flatMap((t) => POOL[t].map((x) => x[0]));
function revisa(G0, Goff, etiqueta, strict) { // devuelve nº de fallos nuevos
  const antes = bad, on = casos(G0), off = casos(Goff);
  const tot = { nerv: 0, propias: 0, desc: 0, senu: 0, mezcla: 0 };
  on.forEach((r, i) => {
    const q = off[i], tone = r.def.tone, pool = (POOL[tone] || []).map((x) => x[0]), tonos = new Set();
    pares(r.bible).forEach((p) => {
      const ev = r.def.npcs[p.s].evidence[p.c.id], evOff = q.def.npcs[p.s].evidence[p.c.id];
      if (p.propia) { tot.propias++; ok(etiqueta + ': la frase propia no cambia (' + r.code + ' ' + p.c.id + '→' + p.s + ')', JSON.stringify(ev) === JSON.stringify(evOff) && !(ev && TODAS.indexOf(ev[0].say[0]) >= 0)); return; }
      tot.nerv++;
      const t = ev && ev[0] && ev[0].say && ev[0].say[0];
      ok(etiqueta + ': falta la nerviosa (' + r.code + ' ' + p.c.id + '→' + p.s + ')', !!t && pool.indexOf(t) >= 0);
      ok(etiqueta + ': apagado no hay frase propia (' + r.code + ')', !evOff);
      if (t) tonos.add(TODAS.findIndex((x) => x === t) >= 0 ? tone : '?');
      if (p.c.role === 'falsa') tot.senu++; else tot.desc++;
    });
    ok(etiqueta + ': el resto del caso no cambia (' + r.code + ')', sinEv(r.def) === sinEv(q.def));
  });
  if (strict) { ok(etiqueta + ': hay descartes Y señuelos con nerviosa (pool común)', tot.desc > 0 && tot.senu > 0); ok(etiqueta + ': hay propias que comprobar', tot.propias > 0); console.log(etiqueta, JSON.stringify(tot)); }
  return bad - antes;
}
const off = () => load(mutador('gen_data.js', 'grabReac: { on: true', 'grabReac: { on: false'));
// ---- real
ok('el banco tiene los 6 tonos, 2-3 variantes con peso', Object.keys(POOL).length === 6 && Object.keys(POOL).every((t) => POOL[t].length >= 2 && POOL[t].length <= 3 && POOL[t].every((x) => x[1] > 0)));
ok('ninguna frase suena a confesión ni lleva lugar/llaves', TODAS.every((t) => !/confes|culpable|lo hice|fui yo|\{|\}/i.test(t)) && TODAS.every((t) => /grab|cinta|micr[oó]f/i.test(t)));
revisa(G1, off(), 'real', true);
// v6 idéntico: ninguna nerviosa
{ const G6 = load(null, 6); casos(G6).forEach((r) => Object.keys(r.def.npcs).forEach((n) => ok('v6 sin nerviosa', !JSON.stringify(r.def.npcs[n].evidence).split('"').some((x) => TODAS.indexOf(x) >= 0)))); }
// ---- mutaciones (cada una DEBE hacer fallar algo)
const mut = (nombre, m) => { const Gm = load(m); if (!m.ok) { ok('mutación «' + nombre + '»: ' + m.motivo, false); return; } const f = revisa(Gm, off(), 'mut', false); bad -= f; ok('mutación «' + nombre + '» detectada', f > 0); console.log('  mutación «' + nombre + '»:', f > 0 ? 'detectada (' + f + ' fallos)' : 'NO detectada'); };
mut('distingue señuelo', mutador('compile.js', "if (k.kind !== 'grabación' || ev[k.id]) return;", "if (k.kind !== 'grabación' || ev[k.id] || k.role === 'falsa') return;"));
mut('pisa la confesión', mutador('compile.js', "if (k.kind !== 'grabación' || ev[k.id]) return;", "if (k.kind !== 'grabación') return;"));
mut('pool de otro tono', mutador('compile.js', 'GR.frases[tone.id]', "GR.frases[tone.id === 'noir' ? 'cuento' : 'noir']"));
mut('interruptor apagado', mutador('gen_data.js', 'grabReac: { on: true', 'grabReac: { on: false'));
console.log(bad ? '✗ ' + bad + ' fallos de ' + checks : '✓ ' + checks + ' comprobaciones OK');
process.exit(bad ? 1 : 0);
