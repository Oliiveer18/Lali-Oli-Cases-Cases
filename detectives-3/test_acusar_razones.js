// CL-3 (parte 1): Acusar por razones, solo GEN_VERSION >= 7. Fácil = quién fue · Normal = + por qué · Difícil = + cómo lo hizo; sin «Pruebas clave»;
// sospechosos siempre abiertos; motivo y método se abren con 1 pista del tema (hueco bloqueado NO cuenta como fallo); estrellas A (cp. 200); v6 sin cambios.
// Con mutación: si el candado del hueco no existe, la prueba lo detecta. Una a una: node test_acusar_razones.js [N=30]
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js'];
const N = +process.argv[2] || 30;
let bad = 0, checks = 0, quiet = false; const ok = (c, m) => { checks++; if (!c) { bad++; if (bad <= 25 && !quiet) console.log('✗ ' + m); } };
function gen(G, ver, n) { G.GEN_VERSION = ver; const out = []; for (let i = 1; out.length < n && i < n * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) out.push(r.def); } return out; }
function correr(patch) {
  const G = require('./tools/load_g.js')(MOD, patch);
  const v7 = gen(G, 7, N), v6 = gen(G, 6, 10);
  ok(v7.length === N && v7.every((d) => d.genV === 7), 'v7: genV marcado en todos');
  ok(v6.length > 0 && v6.every((d) => d.genV === undefined), 'v6: sin genV (caso idéntico)');
  const want = { easy: { m: false, v: false }, normal: { m: false, v: true }, hard: { m: true, v: true } };
  let blockedMot = 0, blockedMet = 0, wins = 0;
  v7.forEach((def) => ['easy', 'normal', 'hard'].forEach((dn) => {
    const st = new G.CaseState(def, dn), o = st.boardOptions(), sol = def.solution, tag = def.id + '/' + dn;
    ok(st.isV7() && o.motive === want[dn].v && o.method === want[dn].m && o.proof === false, tag + ': huecos del nivel ' + JSON.stringify(o).slice(0, 60));
    ok(st.accuseList().every((x) => x.ok) && st.accuseList().length > 0, tag + ': sospechosos siempre abiertos');
    // hueco cerrado: sin pistas no cuenta como fallo
    const pick = (list, id) => list.find((x) => x.id === id);
    const sel = { culprit: sol.culprit, motive: sol.motive, method: sol.method };
    const r0 = st.accuse(sel);
    if (o.motive || o.method) { ok(r0.blocked === true && !r0.ok && st.wrong === 0 && !st.failed, tag + ': hueco cerrado bloquea sin fallo'); ok(r0.blockedBy === (o.motive ? 'motive' : 'method'), tag + ': dice qué hueco falta (' + r0.blockedBy + ')'); if (o.motive) blockedMot++; if (o.method) blockedMet++; }
    else ok(r0.ok === true, tag + ': Fácil acierta desde el segundo 0');
    if (!o.motive && !o.method) return;
    // abrir motivo con una pista de un SEÑUELO (cualquier opción vale) y método con otra
    const clueOf = (list) => { const a = list.find((x) => x.needs && x.needs.length && x.id !== (list === sol.motives ? sol.motive : sol.method)) || list.find((x) => x.needs && x.needs.length); return a.needs[0]; };
    const st2 = new G.CaseState(def, dn);
    st2.addClue(clueOf(sol.motives));
    if (o.method) { const r1 = st2.accuse(sel); ok(r1.blocked && r1.blockedBy === 'method' && st2.wrong === 0, tag + ': motivo abierto, método aún cerrado'); st2.addClue(clueOf(sol.methods)); }
    ok(st2.gapOpen('motive') && (!o.method || st2.gapOpen('method')), tag + ': huecos abiertos con 1 pista');
    const bad1 = st2.accuse({ culprit: sol.culprit, motive: 'x_mal', method: o.method ? 'x_mal' : sol.method });
    ok(!bad1.blocked && !bad1.ok && st2.wrong === 1, tag + ': hueco abierto + opción errónea = fallo');
    if (!st2.failed) { const r2 = st2.accuse(sel); ok(r2.ok === true, tag + ': acierta con las razones'); }
    // gatos nunca acusables
    const cat = def.suspects.find((s) => st2.isCatSuspect(s)); if (cat) ok(new G.CaseState(def, dn).accuse({ culprit: cat.id, motive: sol.motive, method: sol.method }).blocked === true, tag + ': gato no acusable');
    // estrellas (A): 1★ resolver · 2★ ≥ 80 % pistas · 3★ + sin fallos y en el par
    const s3 = new G.CaseState(def, dn); s3.gateOff = true; s3.accuse(sel);
    if (s3.closed) { const r = s3.reward(); ok(r.stars === 1 && Array.isArray(r.missing), tag + ': acierto con pocas pistas = 1★ (' + r.stars + ')'); }
    const s4 = new G.CaseState(def, dn); s4.gateOff = true; Object.keys(def.clues).forEach((c) => s4.addClue(c)); s4.accuse(sel); s4.time = 0;
    const r4 = s4.reward(); ok(r4.stars === 3 && r4.missing.length === 0, tag + ': todas las pistas, sin fallos y a tiempo = 3★ (' + r4.stars + ')');
    const s5 = new G.CaseState(def, dn); s5.gateOff = true; Object.keys(def.clues).forEach((c) => s5.addClue(c)); s5.time = def.parSeconds * 5; s5.accuse(sel);
    const r5 = s5.reward(); if (!s5.failed && s5.closed) ok(r5.stars === 2 && r5.missing.indexOf('dentro del tiempo') >= 0, tag + ': tarde = 2★ (' + r5.stars + ')');
    if (dn !== 'hard') { const s6 = new G.CaseState(def, dn); s6.gateOff = true; Object.keys(def.clues).forEach((c) => s6.addClue(c)); s6.accuse({ culprit: 'x_mal', motive: 'x_mal', method: 'x_mal' }); s6.accuse(sel); if (s6.closed) ok(s6.reward().stars <= 2, tag + ': un fallo deja máximo 2★'); }
    ok(typeof G.caseBriefing(st).todo[2] === 'string' && /cuando queráis/.test(G.caseBriefing(st).todo[2]), tag + ': briefing v7');
  }));
  // v6 conserva las reglas de siempre
  v6.forEach((def) => { const st = new G.CaseState(def, 'easy'), o = st.boardOptions(); ok(!st.isV7() && o.motive === true && o.method === false, def.id + ': v6 Fácil = culpable + motivo'); ok(st.accuseList().some((x) => !x.ok), def.id + ': v6 conserva el candado de «interrogado»'); });
  // bot con acusación temprana (informativa) y partida completa
  [7].forEach(() => ['easy', 'normal', 'hard'].forEach((dn) => { let e = 0, w = 0, n = 0; v7.slice(0, 6).forEach((def) => { const r = G.botPlay(def, { difficulty: dn, early: true }); n++; if (r.win) w++; if (r.win && r.early) e++; }); ok(w === n, 'bot ' + dn + ' (acusa en cuanto puede): ganó ' + w + '/' + n); ok(e === n, 'bot ' + dn + ': acusó en modo temprano (' + e + '/' + n + ')'); }));
  return { blockedMot, blockedMet };
}
const r = correr();
// MUTACIÓN: sin el candado del hueco (gapOpen siempre abierto) la prueba tiene que fallar
const before = bad; quiet = true;
correr((f, src) => (f === 'logic.js' ? src.replace("if (this.gateOff || !this.isV7()) return true;", 'return true;') : src));
quiet = false; ok(bad > before, 'mutación (sin candado de hueco) detectada');
if (bad > before) { const fallos = bad - before; bad = before; console.log('(mutación: ' + fallos + ' fallos esperados)'); }
console.log('casos v7 ' + N + ' · huecos motivo bloqueados ' + r.blockedMot + ' · método ' + r.blockedMet + ' · comprobaciones ' + checks + ' · fallos ' + bad);
process.exit(bad ? 1 : 0);
