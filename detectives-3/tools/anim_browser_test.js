// Prueba en navegador de la animación (4C-3b-1): un caso con objetos animados se juega con el motor real (index y artifact) y se dibujan cientos de fotogramas sin errores.
// Comprueba: sin errores de carga ni de dibujo, el mundo anima de verdad (varios fotogramas del coche, la cinta y la farola en pantalla), el tope de 6 animados por sala y
// que el caso 1 normal (sin objetos animados) se dibuja igual de bien. Uso: node build.js && node tools/anim_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0;
  for (const file of ['index.html', 'artifact.html']) {
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1800 });
    const E = (x) => b.eval(x);
    await E(`(function(){ var def = JSON.parse(JSON.stringify(G.CASES.tarta)), room = def.rooms[def.start.room];
      room.decor = (room.decor || []).concat([{ sprite: 'lamp_post_blink', x: 1, y: 2 }, { sprite: 'police_tape_h', x: 3, y: 5 }, { sprite: 'police_tape_v', x: 5, y: 4 }]);
      room.decals = (room.decals || []).concat([0, 1, 2, 3, 4].map(function (i) { return { sprite: 'decal_puddle', x: 2 + i, y: 6 }; }));
      G.CASES.anim_demo = def; return G.validateCase(def).ok; })()`);
    await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'anim_demo',diff:'normal',mode:'solo'}), 1)`);
    await E(`(function(){ window.__names = {}; window.__draws = 0; var real = G.drawSpr; G.drawSpr = function (c, n) { window.__names[n] = 1; return real.apply(this, arguments); }; var w = G.scene.world, orig = w.drawView.bind(w); w.drawView = function () { window.__draws++; return orig.apply(w, arguments); }; return 1; })()`);
    await E(`(G.scene.modals.length = 0, 1)`); // la introducción del caso (modal) pausa el reloj del mundo
    await b.wait(1500); await E(`(G.scene.modals.length = 0, 1)`);
    await b.wait(4500);
    const r = JSON.parse(await E(`JSON.stringify({ draws: window.__draws, count: G.scene.world.room.animCount, cap: G.ANIM_MAX_PER_ROOM, names: Object.keys(window.__names).filter(function (n) { return /tape|lamp_post|puddle/.test(n); }), errors: G.errors })`));
    const names = r.names.join(',');
    const okAnim = r.draws >= 100 && r.count === r.cap && /police_tape_h_w/.test(names) && /lamp_post_dim/.test(names) && /decal_puddle_g/.test(names) && r.errors.length === 0;
    console.log(`${file} · fotogramas ${r.draws} · animados en la sala ${r.count}/${r.cap} · fotogramas distintos: ${names} · errores ${JSON.stringify(r.errors)} · ${okAnim ? 'OK' : 'FALLA'}`);
    if (!okAnim) bad++;
    await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(1500);
    const r1 = JSON.parse(await E(`JSON.stringify({ count: G.scene.world.room.animCount, errors: G.errors })`));
    console.log(`${file} · caso 1: animados ${r1.count} · errores ${JSON.stringify(r1.errors)} · ${r1.count === 0 && r1.errors.length === 0 ? 'OK' : 'FALLA'}`);
    if (r1.count !== 0 || r1.errors.length) bad++;
    b.close();
  }
  console.log(bad ? 'FALLOS: ' + bad : 'animación en navegador OK');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
