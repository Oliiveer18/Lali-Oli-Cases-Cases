// Prueba en NAVEGADOR (FIX-2): al jugar, el HUD enseña la sala actual y el rótulo de entrada aparece y se apaga solo.
// Uso: node build.js && node tools/hud_sala_browser_test.js   (con captura opcional: SHOT=/ruta.png)
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1800 }), E = (x) => b.eval(x);
    await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`);
    await b.wait(500);
    await E(`(G.scene.modals.length = 0, 1)`); // quita la tarjeta de introducción: el rótulo cuenta desde que se puede jugar
    await b.wait(400);
    const s1 = JSON.parse(await E(`JSON.stringify({ room: G.scene.world.roomId, name: G.scene.def.rooms[G.scene.world.roomId].name, banner: G.scene.bannerT > 0, errs: (window.__errs||[]).length })`));
    ok(file + ': al empezar el rótulo de sala está activo y la sala tiene nombre (' + s1.name + ')', s1.banner && !!s1.name);
    if (process.env.SHOT && file === 'index.html') await b.shot(process.env.SHOT);
    await b.wait(3200);
    ok(file + ': el rótulo se apaga solo', JSON.parse(await E('JSON.stringify(G.scene.bannerT === 0)')));
    await E(`(function(){ var w=G.scene.world; w.enterRoom('cocina', null, true); })()`); await b.wait(300);
    const s2 = JSON.parse(await E(`JSON.stringify({ banner: G.scene.bannerT > 0, room: G.scene.bannerRoom })`));
    ok(file + ': al entrar en otra sala el rótulo vuelve a salir (' + s2.room + ')', s2.banner && s2.room === 'cocina');
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})();
