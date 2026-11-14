// CL-5c-c 4/4: PRUEBA EN NAVEGADOR de los puzles generados (pz_N) en 844×390 (iPhone 14 apaisado).
// Uso: node build.js && node tools/puzle_browser_test.js [/carpeta/capturas]  (usa dist/index.html; escribe PNG y OK/FALLO)
// Comprueba: (1) sin pistas el puzle SE PUEDE examinar y avisa de cuántas faltan (no abre el minijuego); (2) con las pistas abre el minijuego; (3) el candado se resuelve con su código;
// (4) la línea de tiempo trae las horas en orden y todos los títulos de pista caben; (5) resolverlo avanza el progreso UNA vez y se sincroniza al compañero (monedas sin duplicar);
// (6) capturas con texto normal y grande para ver que nada se sale del recuadro.
const { launch } = require('./cdp'), path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/capturas_puzles'; fs.mkdirSync(out, { recursive: true });
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 1800, w: 844, h: 390 }), E = (x) => b.eval(x);
  const shot = async (n) => { await b.wait(350); await b.shot(path.join(out, n + '.png')); };
  // caso de Difícil v7 con un código y una línea, el de textos más largos
  const info = JSON.parse(await E(`(function(){ G.GEN_VERSION = 7; var best = null;
    for (var i = 1; i <= 120; i++) { var r = G.generateCase(i * 7919 + 3, { level: 'dificil' }); if (r.error) continue; var pz = []; Object.keys(r.def.rooms).forEach(function(k){ r.def.rooms[k].props.forEach(function(p){ if (/^pz_\\d+$/.test(p.id)) pz.push(p); }); });
      var types = pz.map(function(p){ return p.steps[0].mini.type; }); if (types.indexOf('code') < 0 || types.indexOf('timeline') < 0) continue;
      var len = 0; pz.forEach(function(p){ var m = p.steps[0].mini; len += (m.hint || '').length + (m.events || []).reduce(function(a, e){ return a + e.text.length; }, 0); });
      if (!best || len > best.len) best = { seed: i * 7919 + 3, len: len }; }
    if (!best) return JSON.stringify({ none: true }); var c = G.generateCase(best.seed, { level: 'dificil', register: true }); return JSON.stringify({ id: c.def.id, seed: best.seed, len: best.len }); })()`));
  ok('hay un caso de Difícil v7 con código y línea de tiempo', !info.none);
  if (info.none) { b.close(); process.exit(1); }
  console.log('caso elegido', JSON.stringify(info));
  await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'${info.id}',diff:'hard',mode:'solo'}), 1)`); await b.wait(700);
  await E(`(G.scene.modals.length = 0, 1)`); await b.wait(200);
  // (1) y (2): colocar al jugador junto a cada puzle
  const res = JSON.parse(await E(`(function(){ var w = G.scene.world, st = w.st, o = [];
    Object.keys(st.def.rooms).forEach(function(rid){ st.def.rooms[rid].props.forEach(function(p){ if (!/^pz_\\d+$/.test(p.id)) return;
      w.enterRoom(rid, null, true); var rp = w.room.props.filter(function(q){ return q.id === p.id; })[0], a = w.players[w.human]; a.x = (rp.x + rp.w / 2) * G.TS; a.y = (rp.y + rp.h + 0.6) * G.TS; a.work = null;
      var req = p.steps[0].requires.clue, f1 = w.findFocus(a); var r1 = { id: p.id, type: p.steps[0].mini.type, need: req.length, locked: !!(f1 && f1.locked), missing: f1 && f1.missing, verb: f1 && f1.verb };
      a.focus = f1; w.out.length = 0; w.interact(a); r1.mini1 = w.out.some(function(e){ return e.t === 'mini'; }); r1.soft = w.out.some(function(e){ return e.t === 'denied_soft'; });
      req.slice(0, req.length - 1).forEach(function(id){ st.addClue(id, 'prop'); }); var f2 = w.findFocus(a); r1.missing2 = f2 && f2.missing;
      st.addClue(req[req.length - 1], 'prop'); var f3 = w.findFocus(a); r1.locked3 = !!(f3 && f3.locked); r1.verb3 = f3 && f3.verb; a.focus = f3; w.out.length = 0; w.interact(a); r1.mini3 = w.out.some(function(e){ return e.t === 'mini'; });
      o.push(r1); }); }); return JSON.stringify(o); })()`));
  res.forEach((r) => {
    ok(`${r.id} (${r.type}): sin pistas se puede examinar y dice que faltan ${r.need} (dice ${r.missing})`, r.locked && r.missing === r.need && r.verb === 'Examinar');
    ok(`${r.id}: sin pistas NO abre el minijuego y avisa`, !r.mini1 && r.soft);
    ok(`${r.id}: con una pista menos dice que falta 1 (dice ${r.missing2})`, r.missing2 === 1);
    ok(`${r.id}: con todas las pistas abre el minijuego (verbo «${r.verb3}»)`, !r.locked3 && r.mini3);
  });
  // (3)-(4): minijuegos reales
  const mj = JSON.parse(await E(`(function(){ var st = G.scene.st, o = []; Object.keys(st.def.rooms).forEach(function(rid){ st.def.rooms[rid].props.forEach(function(p){ if (!/^pz_\\d+$/.test(p.id)) return; var cfg = p.steps[0].mini, m = new G.PlayModals.Mini(G.scene, cfg), r = { id: p.id, type: cfg.type };
      if (cfg.type === 'code') { r.len = cfg.code.length; for (var i = 0; i < 4; i++) m.press('0'); m.shake = 0; m.entry = ''; for (var j = 0; j < 4; j++) m.press(cfg.code[j]); r.solved = m.solved; }
      else { var ts = cfg.events.map(function(e){ return +e.time.replace(':', ''); }); r.sorted = ts.every(function(t, i){ return !i || t > ts[i - 1]; }); r.titles = cfg.events.every(function(e){ return !!st.def.clues[e.clue]; }); r.n = cfg.events.length; }
      o.push(r); }); }); return JSON.stringify(o); })()`));
  mj.forEach((r) => { if (r.type === 'code') ok(`${r.id}: el candado de 4 cifras se abre con su código`, r.len === 4 && r.solved); else ok(`${r.id}: la línea trae ${r.n} sucesos en orden creciente y con sus pistas`, r.sorted && r.titles && r.n >= 3); });
  // (5): resolver avanza el progreso una vez; el compañero lo recibe y las monedas no se duplican
  const sy = JSON.parse(await E(`(function(){ var w = G.scene.world, st = w.st, o = []; Object.keys(st.def.rooms).forEach(function(rid){ st.def.rooms[rid].props.forEach(function(p){ if (!/^pz_\\d+$/.test(p.id)) return;
      w.enterRoom(rid, null, true); var rp = w.room.props.filter(function(q){ return q.id === p.id; })[0], step = p.steps[0], a = w.players[w.human], before = st.bonusMoney, key = rp.key;
      w.completeStep(rp, step, a); var st2 = new G.CaseState(JSON.parse(JSON.stringify(st.def)), 'hard'); var snap = JSON.parse(JSON.stringify(G.net.packState(st))); G.net.mergeState(st2, null, snap); G.net.mergeState(st2, null, snap);
      o.push({ id: p.id, prog: st.progress[key], prog2: st2.progress[key], gain: st.bonusMoney - before, money1: st.bonusMoney, money2: st2.bonusMoney, coin: step.fx ? step.fx.money : 0 }); }); }); return JSON.stringify(o); })()`));
  sy.forEach((r) => ok(`${r.id}: resolverlo avanza el progreso (${r.prog}), el compañero lo recibe (${r.prog2}) y las monedas no se duplican (${r.money1}/${r.money2}, premio ${r.coin})`, r.prog === 1 && r.prog2 === 1 && r.gain === r.coin && r.money2 === r.money1));
  // (6): capturas
  await b.wait(3200); // que se vaya el aviso «Código incorrecto» de la prueba anterior
  for (const big of [false, true]) {
    await E(`(G.save.data.settings.bigText = ${big}, 1)`);
    for (const tipo of ['code', 'timeline']) {
      await E(`(function(){ G.scene.modals.length = 0; var st = G.scene.st, cfg = null; Object.keys(st.def.rooms).forEach(function(rid){ st.def.rooms[rid].props.forEach(function(p){ if (/^pz_\\d+$/.test(p.id) && p.steps[0].mini.type === '${tipo}') cfg = p.steps[0].mini; }); }); var m = new G.PlayModals.Mini(G.scene, cfg); G.scene.modals.push(m); window.__m = m; })()`);
      await shot(`${tipo === 'code' ? 'codigo' : 'linea'}_${big ? 'texto_grande' : 'normal'}`);
    }
  }
  await E(`(G.save.data.settings.bigText = false, G.scene.modals.length = 0, 1)`);
  ok('sin errores de consola', b.logs.length === 0); if (b.logs.length) console.log(b.logs.slice(0, 5));
  b.close(); console.log(bad ? `\n${bad} FALLOS` : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})();
