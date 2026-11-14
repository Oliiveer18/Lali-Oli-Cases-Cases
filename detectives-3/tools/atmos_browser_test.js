// Prueba en NAVEGADOR de la atmósfera II (4C-4b), con el motor real (index y artifact): luz tenue, niebla o polvo, zumbido y crujidos según `def.mood`.
// Comprueba: el caso 1 y un caso claro NO tienen atmósfera (sin zumbido, sin crujidos, sin niebla ni polvo); en inquietante y macabro el zumbido suena (nivel > 0),
// el crujido suena de verdad, hay niebla en la calle y polvo en los interiores, el macabro es más oscuro y suena más fuerte; la pantalla de resultados lo apaga;
// se dibujan cientos de fotogramas sin errores. Uso: node build.js && node tools/atmos_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0;
  const check = (name, cond, extra) => { console.log(`  ${cond ? 'OK   ' : 'FALLA'} · ${name}${!cond && extra ? ' → ' + extra : ''}`); if (!cond) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    console.log(file);
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1800 });
    const E = (x) => b.eval(x);
    // busca semillas por ambiente y por tipo de sala (calle o interior) con el generador del propio juego
    const seeds = JSON.parse(await E(`(function(){ var want = { claro: null, inq_int: null, inq_calle: null, mac_int: null, mac_calle: null };
      for (var s = 1; s < 400; s++) { var g = G.generateCase(s); if (!g.def) continue; var d = g.def, ids = Object.keys(d.rooms);
        var calle = ids.filter(function (id) { return G.roomScene(d.rooms[id].template) === 'calle'; })[0], inte = ids.filter(function (id) { return G.roomScene(d.rooms[id].template) !== 'calle'; })[0];
        if (d.mood === 'claro' && !want.claro) want.claro = [s, inte];
        if (d.mood === 'inquietante') { if (!want.inq_int) want.inq_int = [s, inte]; if (calle && !want.inq_calle) want.inq_calle = [s, calle]; }
        if (d.mood === 'macabro') { if (!want.mac_int) want.mac_int = [s, inte]; if (calle && !want.mac_calle) want.mac_calle = [s, calle]; } }
      return JSON.stringify(want); })()`));
    check('hay semillas para todos los ambientes y salas', Object.values(seeds).every(Boolean), JSON.stringify(seeds));
    // prepara el espía de sonido y de dibujo, entra en la sala y deja correr el reloj
    const run = async (label, caseId, def, room, expect) => {
      if (def) await E(`(G.CASES.${caseId} = ${JSON.stringify(def)}, 1)`);
      await E(`(G.save.data.settings.mode='solo', G.save.data.settings.sfx = true, G.go(G.scenes.play,{caseId:'${caseId}',diff:'normal',mode:'solo'}), 1)`);
      await b.wait(700); await E(`(G.scene.modals.length = 0, 1)`);
      if (room) { await E(`(G.scene.world.enterRoom('${room}', null, true), G.scene.modals.length = 0, 1)`); }
      await E(`(function(){ var a = G.audio; window.__lvl = []; window.__creak = 0; var rAmb = a.ambience, rSfx = a.sfx; a.ambience = function (l) { window.__lvl.push(l); return rAmb.apply(this, arguments); };
        a.sfx = function (n) { if (n === 'creak') window.__creak++; return rSfx.apply(this, arguments); };
        var w = G.scene.world; window.__fog = {}; window.__moods = 0; var rF = w.drawFog; w.drawFog = function (c, vp, t, fx) { window.__fog[fx.fog] = (window.__fog[fx.fog] || 0) + 1; window.__fx = fx; return rF.apply(this, arguments); };
        var rM = w.drawMood; w.drawMood = function () { window.__moods++; return rM.apply(this, arguments); }; return 1; })()`);
      await E(`(G.scene.modals.length = 0, G.scene.world.creakT !== undefined ? (G.scene.world.creakT = 0.05) : 0, 1)`);
      await b.wait(1600); await E(`(G.scene.modals.length = 0, 1)`);
      await b.wait(1400);
      const r = JSON.parse(await E(`JSON.stringify({ mood: G.scene.world.st.def.mood || null, lvl: Math.max.apply(null, window.__lvl.concat([0])), frames: window.__lvl.length, creak: window.__creak, fog: window.__fog, moods: window.__moods, fx: window.__fx || null, atm: !!G.scene.world.atmos(), fogTex: !!G.scene.world.fogTex, errors: G.errors })`));
      console.log(`  ${label}: ambiente ${r.mood || '(caso 1)'} · fotogramas ${r.frames} · zumbido ${r.lvl} · crujidos ${r.creak} · niebla/polvo ${JSON.stringify(r.fog)}`);
      return r;
    };
    // caso 1: sin atmósfera
    const r1 = await run('caso 1', 'tarta', null, null);
    check('caso 1: sin atmósfera, zumbido, crujidos, niebla ni polvo y sin errores', !r1.atm && r1.lvl === 0 && r1.creak === 0 && !r1.fog.niebla && !r1.fog.polvo && r1.errors.length === 0, JSON.stringify(r1));
    // caso claro generado
    const defOf = async (s) => JSON.parse(await E(`JSON.stringify(G.generateCase(${s}).def)`));
    const rc = await run('claro', 'at_claro', await defOf(seeds.claro[0]), null);
    check('caso claro: sin atmósfera ni zumbido ni crujidos ni niebla ni polvo', rc.mood === 'claro' && !rc.atm && rc.lvl === 0 && rc.creak === 0 && !rc.fog.niebla && !rc.fog.polvo && rc.errors.length === 0, JSON.stringify(rc));
    // inquietante y macabro: interior y calle
    const res = {};
    for (const [k, mood, calle] of [['inq_int', 'inquietante', false], ['inq_calle', 'inquietante', true], ['mac_int', 'macabro', false], ['mac_calle', 'macabro', true]]) {
      const [s, room] = seeds[k];
      const r = res[k] = await run(k, 'at_' + k, await defOf(s), room);
      check(`${k}: ambiente ${mood}, atmósfera activa, zumbido > 0, al menos un crujido, se dibuja cada fotograma (≥ 50 en 3 s)`, r.mood === mood && r.atm && r.lvl > 0 && r.creak >= 1 && r.moods >= 50, JSON.stringify(r));
      check(`${k}: ${calle ? 'niebla en la calle (y no polvo)' : 'polvo en el interior (y no niebla)'}`, calle ? r.fog.niebla > 50 && !r.fog.polvo && r.fogTex : r.fog.polvo > 50 && !r.fog.niebla && !r.fogTex, JSON.stringify(r.fog));
      check(`${k}: sin errores de carga ni de dibujo`, r.errors.length === 0 && b.logs.length === 0, JSON.stringify([r.errors, b.logs]));
    }
    check('el macabro es más oscuro y suena más fuerte que el inquietante', res.mac_int.fx.dark > res.inq_int.fx.dark && res.mac_int.lvl > res.inq_int.lvl && res.mac_calle.fx.dark > res.inq_calle.fx.dark);
    // la pantalla de resultados lo apaga
    const off = JSON.parse(await E(`(function(){ var w = G.scene.world, got = []; var r0 = G.audio.ambience; G.audio.ambience = function (l) { got.push(l); }; w.ambience(0.016, false); w.ambience(0.016, true); G.audio.ambience = r0; return JSON.stringify(got); })()`));
    check('con la pantalla de resultados (on = false) el zumbido se pide a 0, y al volver se pide de nuevo', off[0] === 0 && off[1] > 0, JSON.stringify(off));
    // volver al caso 1 después de un caso oscuro: todo limpio
    const rb = await run('caso 1 otra vez', 'tarta', null, null);
    check('de vuelta al caso 1 no queda atmósfera ni zumbido', !rb.atm && rb.lvl === 0 && rb.creak === 0 && rb.errors.length === 0, JSON.stringify(rb));
    b.close();
  }
  console.log(bad ? 'FALLOS: ' + bad : 'atmósfera en navegador OK');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
