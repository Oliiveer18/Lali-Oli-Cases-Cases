// FIX-6b (fallo 8): una acusación fallida se VE dentro de la pantalla de Acusar al volver a acusar (persona + «cómo» + «por qué» + pruebas
// ya elegidos, sin lista aparte), con aviso si repites una combinación ya fallada; en ONLINE lo ven los dos jugadores.
// SIN navegador: dos CaseState del mismo caso (jugador A y jugador B) unidos con el código REAL de net.js (packState → JSON → mergeState)
// y la pantalla REAL (Notebook de src/play.js) dibujada con un lienzo que registra cada texto. Casos generados × 3 niveles.
// COMPROBADA CON MUTACIÓN: se ejecuta también con 4 versiones estropeadas del código y DEBE fallar en todas.
// Una a una: node test_acusar_fallo.js [N=20]
const loadG = require('./tools/load_g.js');
const N = +process.argv[2] || 20, EXTRA = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'net.js', 'play.js'];
const MUT = [   // [nombre, fichero, texto a buscar, texto que lo sustituye]
  ['el fallo no se guarda (comportamiento antiguo)', 'logic.js', '        this.rememberFail(sel);\n', ''],
  ['el estado compartido no lleva las acusaciones falladas (online)', 'net.js', 'fa: st.failedAccs || [], ', ''],
  ['la pantalla de Acusar no vuelve con lo elegido en el último fallo', 'play.js', 'if (lf && !this.st.closed) this.acc =', 'if (false) this.acc ='],
  ['repetir una combinación fallada no avisa', 'play.js', "return !!(ready && this.st.wasFailed && this.st.wasFailed(A));", 'return false;'],
];
const mkCtx = () => {
  const t = { font: '16px x', log: [] };
  return new Proxy(t, {
    get: (o, k) => {
      if (k === 'measureText') return (s) => { const bold = /^bold /.test(o.font), px = parseFloat(o.font.replace(/^bold /, '')) || 16; return { width: String(s).length * px * (bold ? 0.64 : 0.58) }; };   // medida pesimista
      if (k === 'fillText') return (s, x, y) => { o.log.push({ s: String(s), x, y, font: o.font }); };
      return k in o ? o[k] : () => {};
    },
    set: (o, k, v) => ((o[k] = v), true),
  });
};
function run(patch) { const problems = []; try { return run0(patch, problems); } catch (e) { problems.push('excepción: ' + e.stack.split('\n').slice(0, 3).join(' | ')); return problems; } }
function run0(patch, problems) {
  const G = loadG(EXTRA, patch ? (f, t) => (f === patch[0] ? t.replace(patch[1], patch[2]) : t) : undefined);
  const U = G.ui; G.audio = G.audio || {}; G.audio.sfx = () => {}; G.speak = () => {}; G.award = () => {};
  const ok = (c, m) => { if (!c) { if (problems.length < 12) problems.push(m); else if (problems.length === 12) problems.push('… (más fallos)'); } };
  const nk = () => ({ up: false, down: false, left: false, right: false, ok: false, back: false });
  G.input = G.input || {}; G.input.touch = G.input.touch || { enabled: false }; G.input.menu = nk(); G.input.mouse = { moved: false, clicked: false, x: -1, y: -1 };
  const Net = G.net;
  const world = { rooms: {} };
  const WARN = '✗ Esta combinación ya falló', WARN_BTN = '(ya falló)', LV = ['easy', 'normal', 'hard'];
  const cases = [];
  for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 3, { register: true }); if (!r.error) cases.push(r.def); }
  ok(cases.length === N, 'se generaron ' + cases.length + ' casos');
  const texts = (ctx) => ctx.log.map((l) => l.s).join(' ¦ ');
  const draw = (nb) => { const ctx = mkCtx(); nb.draw(ctx); return ctx; };
  const upd = (nb) => { G.input.menu = nk(); G.input.mouse = { moved: false, clicked: false, x: -1, y: -1 }; nb.update(0.016); };
  const go = (nb) => nb.slots.items.find((i) => i.k === 'go');
  let combos = 0;
  cases.forEach((def0, idx) => LV.forEach((d) => {
    const mk = () => JSON.parse(JSON.stringify(def0));
    const A = new G.CaseState(mk(), d), B = new G.CaseState(mk(), d); A.gateOff = true; B.gateOff = true;
    const sol = A.def.solution, opt = A.boardOptions();
    const tag = d + ' ' + idx + ': ';
    const inn = A.def.suspects.filter((s) => s.id !== sol.culprit && !A.isCatSuspect(s) && A.def.npcs[s.id]);
    if (!inn.length) return;
    // ---- sin fallos: nada guardado y la pantalla de Acusar empieza vacía (como antes)
    ok(A.failedAccs.length === 0 && !A.lastFailed(), tag + 'sin fallos no debe haber combinaciones guardadas');
    const nb0 = new G.PlayModals.Notebook({ st: A }, 3);
    ok(!nb0.acc.culprit && !nb0.isRepeat(), tag + 'sin fallos la pantalla de Acusar empieza vacía');
    // ---- el jugador B ya tiene el cuaderno de Acusar ABIERTO cuando A falla
    const nbB = new G.PlayModals.Notebook({ st: B }, 3);
    // ---- A falla: culpable equivocado, el resto bien (el resto de piezas cuenta en la clave si el nivel las pide)
    const sel = { culprit: inn[0].id, method: sol.method, motive: sol.motive, proof: (sol.proof || []).slice(0, 3) };
    const r = A.accuse(sel);
    ok(!r.ok && !r.blocked, tag + 'la acusación equivocada debía fallar');
    ok(A.failedAccs.length === 1 && A.wasFailed(sel), tag + 'el fallo se guarda en el estado de A (' + A.failedAccs.length + ')');
    // acusar bien no guarda nada; bloqueada tampoco
    const cat = A.def.suspects.find((s) => A.isCatSuspect(s));
    if (cat) { A.gateOff = false; const rb = A.accuse({ culprit: cat.id, method: sol.method, motive: sol.motive, proof: [] }); ok(rb.blocked && A.failedAccs.length === 1, tag + 'una acusación bloqueada no se guarda'); A.gateOff = true; }
    // ---- ONLINE: el estado compartido de A llega a B (código real de net.js, pasando por JSON como por la red)
    const snap = JSON.parse(JSON.stringify(Net.packState(A)));
    ok(B.failedAccs.length === 0, tag + 'B no sabe nada del fallo antes de recibir el estado');
    Net.mergeState(B, world, snap);
    ok(B.failedAccs.length === 1 && B.wasFailed(sel), tag + 'B ve la acusación fallada de A tras recibir el estado');
    Net.mergeState(B, world, snap);
    ok(B.failedAccs.length === 1, tag + 'recibir el mismo estado dos veces no duplica');
    // ---- B tenía el cuaderno abierto: el aviso aparece solo (sin cerrarlo) si B elige esa combinación
    nbB.acc = { culprit: sel.culprit, method: opt.method ? sel.method : null, motive: opt.motive ? sel.motive : null, proof: opt.proof ? sel.proof.slice() : [] };
    upd(nbB);
    ok(nbB.isRepeat() && /ya falló/.test(go(nbB).label), tag + 'con el cuaderno abierto, B ve el aviso en el botón (' + go(nbB).label + ')');
    // ---- B abre Acusar DESPUÉS: viene con persona + cómo + por qué (+ pruebas) del fallo de A, SIN pasar por ninguna lista aparte
    const nb = new G.PlayModals.Notebook({ st: B }, 3);
    ok(nb.acc.culprit === sel.culprit, tag + 'B: la persona del fallo ya está elegida');
    if (opt.method) ok(nb.acc.method === sol.method, tag + 'B: el «cómo» del fallo ya está elegido');
    if (opt.motive) ok(nb.acc.motive === sol.motive, tag + 'B: el «por qué» del fallo ya está elegido');
    if (opt.proof) ok(nb.acc.proof.length >= 2, tag + 'B: las pruebas del fallo ya están elegidas');
    ok(nb.isRepeat() && /\(ya falló\)/.test(go(nb).label), tag + 'B: el botón avisa «ya falló»');
    const ctx = draw(nb), all = texts(ctx);
    ok(all.indexOf(WARN) >= 0, tag + 'B: el título rojo avisa de la combinación repetida');
    ok(/Montad vuestra acusaci/.test(all) === false, tag + 'B: no debe mostrar el título normal cuando repite');
    ok(all.indexOf(inn[0].name) >= 0, tag + 'B: el nombre del acusado fallado se ve en la pantalla de Acusar');
    // no hay lista aparte: el cuaderno solo tiene las 4 de siempre + «Caso» (A3 INTRO-1); ninguna pestaña/lista de acusaciones falladas
    ok(JSON.stringify(nb.tabsDef()) === JSON.stringify(['Pistas', 'Sospechosos', 'Testimonios', 'Acusar', 'Caso']), tag + 'no se ha añadido ninguna pestaña/lista aparte');
    // caben: el título y el botón dentro de su zona (medida pesimista, también con «Texto grande»)
    [false, true].forEach((big) => {
      G.save.data.settings.bigText = big;
      const c2 = draw(nb);
      c2.log.forEach((l) => {
        if (l.s.indexOf(WARN.slice(0, 8)) === 0) { const px = parseFloat(l.font.replace(/^bold /, '')); ok(l.x + l.s.length * px * 0.64 <= 466 && px >= 11, tag + 'el título rojo cabe (' + Math.round(l.x + l.s.length * px * 0.64) + ' px, letra ' + px + ', grande=' + big + ')'); }
      });
      const rows = nb.slots.items.length; ok(rows >= 2, tag + 'hay filas');
    });
    G.save.data.settings.bigText = false;
    // ---- cambiar UNA pieza quita el aviso (si el nivel deja elegir algo más que la persona)
    const nb2 = new G.PlayModals.Notebook({ st: B }, 3);
    const other = A.def.suspects.filter((s) => s.id !== sel.culprit && !A.isCatSuspect(s))[0];
    nb2.acc.culprit = other.id; upd(nb2);
    ok(!nb2.isRepeat() && !/ya falló/.test(go(nb2).label), tag + 'otra persona distinta NO es combinación repetida');
    ok(texts(draw(nb2)).indexOf(WARN) < 0, tag + 'otra persona: el título rojo desaparece');
    if (opt.method && sol.methods.length > 1) { const nb3 = new G.PlayModals.Notebook({ st: B }, 3); nb3.acc.method = sol.methods.find((m) => m.id !== sol.method).id; upd(nb3); ok(!nb3.isRepeat(), tag + 'otro «cómo» no es combinación repetida'); }
    // ---- panel de confirmación con aviso: el texto cabe sobre los botones (y 320)
    nb.sub = 'confirm'; nb.confirm = new U.Menu([{ label: 'Sí, ¡acusar!' }, { label: 'Seguir investigando' }], { x: 490, y: 320, w: 340, h: 46, gap: 8 });
    const c3 = draw(nb); const wl = c3.log.filter((l) => /Ya fallasteis|fallasteis con esta/.test(l.s));
    ok(wl.length >= 1, tag + 'el panel de confirmación avisa de la repetición');
    wl.forEach((l) => { const px = parseFloat(l.font.replace(/^bold /, '')); ok(l.y + px <= 322 && l.x + l.s.length * px * 0.58 <= 900, tag + 'el aviso del panel cabe sobre los botones (y ' + Math.round(l.y) + ', letra ' + px + ')'); });
    // ---- guardar y reanudar partida conserva lo fallado
    const C = new G.CaseState(mk(), d); C.restore(A.snapshot());
    ok(C.failedAccs.length === 1 && C.wasFailed(sel), tag + 'guardar y reanudar conserva la combinación fallada');
    combos++;
  }));
  ok(combos > 0, 'no se probó ninguna combinación');
  return problems;
}
const base = run(); let fails = base.length; base.forEach((p) => console.log('✗ ' + p));
MUT.forEach(([nm, f, a, b]) => { const pr = run([f, a, b]); if (!pr.length) { fails++; console.log('✗ la mutación NO se detecta: ' + nm + ' (¿cambió el texto de ' + f + '?)'); } else console.log('  mutación detectada (' + pr.length + '): ' + nm); });
console.log(fails ? 'FALLOS: ' + fails : 'Acusación fallada visible en Acusar y compartida entre dos jugadores: OK, con ' + MUT.length + ' mutaciones detectadas');
process.exit(fails ? 1 : 0);
