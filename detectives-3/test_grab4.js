// c4 · 2c GRAB-4 (cp. 238): TODOS los casos llevan ≥ 1 charla grabada CON pista (v7). Una a una: node test_grab4.js [N=60]
// Por nivel (GEN_VERSION 7 en memoria): cada caso tiene un punto de escucha con `chat` cuyo paso lleva `clue`; esa pista existe en la biblia (tipo «grabación», de objeto, rol prueba/descarte/refuta);
// la grabadora no pasa de 2 charlas con pista; el bot gana. Semillas de regresión fijas (las 3 de Fácil que fallaban). Mutaciones: sin conversión de descarte · sin 2.º recurso (testimonio) · sin pareja de último recurso.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'];
const N = +process.argv[2] || 60, LV = ['facil', 'normal', 'dificil'], REG = [15839, 1591720, 2779570], SUP = ['prueba', 'descarte', 'refuta'];
let bad = 0, checks = 0; const late = []; /* «el patrón encaja» se mira al final: m.ok se rellena al cargar el archivo (FIX-OK, cp. 247) */ const ok = (m, c) => { checks++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m); } };
function revisar(G, r) { // → { charlas, conPista, malTipo, tope }
  const byId = {}; r.bible.clues.forEach((c) => { byId[c.id] = c; }); const o = { charlas: 0, conPista: 0, malTipo: 0, senuelo: 0 };
  Object.values(r.def.rooms).forEach((rm) => (rm.props || []).forEach((p) => { if (!(p.listen && p.chat)) return; o.charlas++; const st = (p.steps || [])[0]; if (st && st.clue) { const c0 = byId[st.clue]; if (c0 && c0.role === 'falsa' && c0.kind === 'grabación') { o.senuelo++; return; } /* c4-3 4/4: la charla SEÑUELO no cuenta como charla con pista real */ o.conPista++; const c = byId[st.clue]; if (!c || c.kind !== 'grabación' || c.source.type !== 'prop' || SUP.indexOf(c.role) < 0) o.malTipo++; } }));
  return o;
}
const KNOWN_ERR = { 443465: 'difícil: v7 la rechaza en 8 intentos desde antes de c4-3 (cp. 244); revisada en c4-4 (cp. 251): no es un fallo, es la cola de un rechazo alto de v7 (con 16 intentos da caso); ver docs/INFORME_C44_PASO1.txt' }; // semillas que ya fallaban con el interruptor apagado: no son culpa de este paso (FIX-OK-2, cp. 248)
const MOFF = mutador('gen_data.js', 'charlaSenuelos: true', 'charlaSenuelos: false'); // c4-3 4/4 (cp. 250): las MUTACIONES de GRAB-4 se miden con el interruptor de charlas señuelo apagado (con él encendido los 3 casos de regresión se salvan por otra vía y la mutación no muerde); la medición principal va con el interruptor ENCENDIDO, como se entrega
function medir(patch, off) {
  const pts = [off && MOFF.patch, patch].filter(Boolean), comp = pts.length ? (f, t) => pts.reduce((x, q) => q(f, x), t) : undefined;
  const G = require('./tools/load_g.js')(MOD, comp); G.GEN_VERSION = 7; const res = { sin: 0, malTipo: 0, tope: 0, n: 0, win: 0, err: 0, reg: 0 };
  LV.forEach((L) => { for (let i = 1, k = 0; k < N && i < N * 6; i++) { const r = G.generateCase(i * 7919 + 1, { level: L }); if (r.error) { if (!KNOWN_ERR[i * 7919 + 1]) res.err++; continue; } k++; res.n++; const o = revisar(G, r); if (o.conPista < 1) res.sin++; res.malTipo += o.malTipo; if (o.conPista > 2) res.tope++; }
    const b = G.generateCase(4321, { level: L }); if (b.def && G.botPlay(b.def).win) res.win++; });
  REG.forEach((sd) => { const r = G.generateCase(sd, { level: 'facil' }); if (!r.error && revisar(G, r).conPista >= 1) res.reg++; });
  return res;
}
const S = medir();
ok(`${S.n} casos (${N}/nivel) sin errores de generación (${S.err} errores)`, S.err === 0 && S.n === N * 3);
ok(`ningún caso sin charla grabada con pista (${S.sin} sin charla)`, S.sin === 0);
ok(`toda charla con pista entrega una grabación de objeto de sostén (${S.malTipo} mal)`, S.malTipo === 0);
ok(`ningún caso pasa de 2 charlas con pista (${S.tope})`, S.tope === 0);
ok('las 3 semillas de Fácil que fallaban llevan charla con pista', S.reg === 3);
ok('el bot gana el caso de muestra en los 3 niveles', S.win === 3);
{ const m1 = mutador('gen_clues.js', "if (G.GEN_VERSION >= 7 && !clues.some((q) => q.kind === 'grabación'", "if (false && !clues.some((q) => q.kind === 'grabación'"); late.push(() => ok('mutación «sin conversión de descarte»: el patrón encaja', m1.ok !== false)); late.push(() => ok('apagar el interruptor: el patrón encaja', MOFF.ok !== false));
  const M1 = medir(m1.patch, true); ok('mutación «sin conversión de descarte» detectada', M1.sin > 0 || M1.reg < 3);
  const m2 = mutador('gen_clues.js', "d.kind === 'testimonio' && !d.liar", "d.kind === 'nada' && !d.liar"); late.push(() => ok('mutación «sin 2.º recurso (testimonio)»: el patrón encaja', m2.ok !== false));
  const M2 = medir(m2.patch, true); ok('mutación «sin 2.º recurso» detectada', M2.sin > 0 || M2.reg < 3);
  const m3 = mutador('compile.js', 'pass < 3 && !pair', 'pass < 2 && !pair'); late.push(() => ok('mutación «sin pareja de último recurso»: el patrón encaja', m3.ok !== false));
  const M3 = medir(m3.patch, true); ok('mutación «sin pareja de último recurso» detectada', M3.sin > 0 || M3.reg < 3); }
late.forEach((g) => g()); console.log(bad ? `\n✗ ${bad} de ${checks} comprobaciones fallan` : `\n✓ GRAB-4: ${checks} comprobaciones correctas y 3 mutaciones detectadas`);
process.exit(bad ? 1 : 0);
