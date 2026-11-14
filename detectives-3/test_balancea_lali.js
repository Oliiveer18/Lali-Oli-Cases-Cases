// c4-4 subpaso 2 (cp. 252): el BALANCEADOR corrige el reparto Oli/Lali en vez de rechazar el caso. Una a una: node test_balancea_lali.js [N=80]
// Interruptor `herr2.balanceaLali` (solo v7). Se compara cada semilla compilada CON el interruptor (ON) y SIN él (REF, mutación en memoria), el mismo bible.
// (1) solo actúa si en REF Oli < 40 % (en número); (2) solo libera UV SEÑUELO (rol `falsa`), nunca la cadena ni las de sostén, y lo liberado queda como objeto normal (sin herramienta, con su pista);
// (3) libera el MÍNIMO k que deja a Oli en 40-60 %; Oli y el resto de Lali no cambian; (4) el caso compilado queda en banda (número) y no hay errores de compilación; (5) actúa (≥ 5 casos por nivel) y baja los rechazos de reparto por número al menos un 30 %.
// Mutaciones: libera cualquier UV (no solo señuelo) · libera una de más · interruptor apagado. El filtro «hay hueco libre en la sala» es RED DE SEGURIDAD sin mutación: no se alcanza en 240 semillas (como el filtro de lupa del sostén, cp. 244).
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'], N = +process.argv[2] || 80;
let bad = 0, checks = 0; const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } }; // (mensaje, condición)
const OFF = mutador('gen_data.js', 'balanceaLali: true', 'balanceaLali: false');
function medir(patch) {
  const G = require('./tools/load_g.js')(MOD, (f, t) => [patch].filter(Boolean).reduce((x, q) => q(f, x), t)); G.GEN_VERSION = 7;
  const out = {};
  LV.forEach((L) => { out[L] = {}; for (let i = 1; i <= N; i++) { const sd = i * 7919 + 1; let r;
    try { const b = G.genClues(G.genTruth(sd, { level: L }), { mood: G.pickMood(sd, G.DEFAULT_THEME) }), def = G.compileBible(b, { level: L }), roles = {}; b.clues.forEach((c) => { roles[c.id] = c.role; });
      const uv = [], props = {}, c = { rex: 0, luna: 0 };
      Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((p) => { props[p.id] = p; (p.steps || []).forEach((s) => { if (s.tool === 'uv') uv.push(s.clue); if (s.tool && s.tool !== 'coop') { const w = G.toolOwner(s.tool); if (w) c[w]++; } }); }));
      r = { uv, props, roles, rex: c.rex, luna: c.luna, num: 100 * c.rex / (c.rex + c.luna) };
    } catch (e) { r = { err: e.message }; }
    out[L][sd] = r; } });
  return out;
}
function revisar(on, ref) {
  const f = []; const inB = (r, l) => 100 * r / (r + l) >= 40 - 1e-9 && 100 * r / (r + l) <= 60 + 1e-9;
  LV.forEach((L) => { let cambia = 0, badRef = 0, badOn = 0, err = 0;
    Object.keys(on[L]).forEach((sd) => { const a = on[L][sd], b = ref[L][sd];
      if (a.err || b.err) { if (a.err && !b.err) { err++; if (process.env.DBG) console.log('ERR', L, sd, a.err); } return; }
      if (b.num < 40) badRef++; if (a.num < 40) badOn++;
      const freed = b.uv.filter((x) => a.uv.indexOf(x) < 0), extra = a.uv.filter((x) => b.uv.indexOf(x) < 0);
      if (extra.length) f.push(L + ' ' + sd + ': el interruptor añade UV');
      if (!freed.length) return;
      cambia++;
      if (!(b.num < 40)) f.push(L + ' ' + sd + ': actúa con Oli ≥ 40 % en REF');
      if (freed.some((x) => b.roles[x] !== 'falsa')) f.push(L + ' ' + sd + ': libera una UV que no es de señuelo');
      if (freed.some((x) => !a.props['obj_' + x] || (a.props['obj_' + x].steps || []).some((s) => s.tool) || a.props['obj_' + x].steps[0].clue !== x)) f.push(L + ' ' + sd + ': lo liberado no queda como objeto normal con su pista');
      if (a.rex !== b.rex || b.luna - a.luna !== freed.length) f.push(L + ' ' + sd + ': cambia algo más que los pasos de Lali liberados');
      if (!inB(a.rex, a.luna)) f.push(L + ' ' + sd + ': Oli no queda en 40-60 % (' + a.num.toFixed(0) + ')');
      if (freed.length > 1 && inB(b.rex, b.luna - (freed.length - 1))) f.push(L + ' ' + sd + ': libera más de lo necesario');
    });
    if (err) f.push(L + ': ' + err + ' errores de compilación que REF no tiene');
    if (cambia < 5) f.push(L + ': el balanceador casi no actúa (' + cambia + ' casos)');
    if (badOn > 0.7 * badRef) f.push(L + ': los casos con Oli < 40 % no bajan lo bastante (' + badRef + ' → ' + badOn + ')');
    console.log(`  ${L}: ${cambia} casos corregidos · Oli < 40 % en número: ${badRef} → ${badOn} de ${N}`);
  });
  return f;
}
const ref = medir(OFF.patch), on = medir(null);
ok('mutación de referencia (interruptor apagado) encaja', OFF.ok !== false);
const base = revisar(on, ref); base.slice(0, 8).forEach((x) => console.log('  · ' + x)); ok('(1)-(5) balanceador de Lali', base.length === 0);
console.log('Mutaciones:');
[['libera cualquier UV (no solo señuelo)', "toolOf[id] === 'uv' && decoyUv[id]", "toolOf[id] === 'uv'"], ['libera una de más', 'done < k', 'done < k + 1']].forEach(([nom, d, h]) => {
  const m = mutador('compile.js', d, h), r = medir(m.patch), f = revisar(r, ref);
  ok('«' + nom + '»: el patrón encaja', m.ok !== false); ok('«' + nom + '»: DEBE detectarse', f.length > 0); console.log('  · «' + nom + '»: ' + (f.length ? 'detectada (' + f[0] + ')' : 'NO DETECTADA'));
});
{ const r = revisar(ref, ref); ok('«interruptor apagado»: DEBE detectarse', r.length > 0); console.log('  · «interruptor apagado»: ' + (r.length ? 'detectada (' + r[0] + ')' : 'NO DETECTADA')); }
console.log(bad ? '✗ ' + bad + ' fallos de ' + checks : '✓ test_balancea_lali: ' + checks + ' comprobaciones'); process.exit(bad ? 1 : 0);
