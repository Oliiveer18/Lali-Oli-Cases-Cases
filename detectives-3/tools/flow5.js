const { start } = require('./flow2');
const SC = require('os').tmpdir();
(async () => {
  const b = await start('solo', 1);
  await b.skipModals();
  const W = 'G.scene.world', S = 'G.scene.st';
  const err = async (t) => { const e = await b.eval('JSON.stringify(G.errors)'); console.log(t, e === '[]' ? 'ok' : 'ERRORES ' + e); };
  console.log('modo:', await b.eval(`${W}.mode`), 'humano:', await b.eval(`${W}.human`), 'ctrl:', await b.eval(`${W}.players.map(p=>p.ctrl).join()`));
  // A) marca UV en el mostrador
  await b.eval(`${W}.players[0].x=13.5*48; ${W}.players[0].y=212; ${W}.players[1].x=12*48; ${W}.players[1].y=300; ${W}.snapCamera(); 0`);
  await b.wait(2500);
  console.log('Lali autoUV:', await b.eval(`${W}.players[1].autoUV`), ' foco Oli:', await b.eval(`JSON.stringify(${W}.players[0].focus && ${W}.players[0].focus.verb)`));
  await b.shot(SC + '/18_solo_uv.png');
  await b.key('KeyE'); await b.wait(4000);
  console.log('tarea Lali:', await b.eval(`JSON.stringify(${W}.players[1].task && {k:${W}.players[1].task.kind, st:${W}.players[1].task.started})`), 'modales:', await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'));
  await b.skipModals();
  console.log('pistas:', await b.eval(`${S}.clueOrder.join()`));
  await err('A');
  // B) nevera con ayuda de la IA
  await b.eval(`${W}.enterRoom('cocina','puerta_tienda'); ${W}.players[0].x=17.5*48; ${W}.players[0].y=160; ${W}.players[1].x=14*48; ${W}.players[1].y=300; ${W}.snapCamera(); 0`);
  await b.wait(600);
  console.log('foco nevera:', await b.eval(`JSON.stringify(${W}.players[0].focus && ${W}.players[0].focus.verb)`));
  await b.key('KeyE', 50);
  await b.down('KeyE');
  await b.wait(4500);
  await b.up('KeyE');
  await b.wait(500);
  console.log('nevera movida:', await b.eval(`${S}.flags.nevera_movida`), 'modales:', await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'));
  await b.shot(SC + '/19_solo_fridge.png');
  await b.skipModals();
  // C) cajón con ganzúa (Oli) + UV (Lali IA)
  await b.eval(`${W}.players[0].x=2.5*48; ${W}.players[0].y=6*48+14; ${W}.players[1].x=4*48; ${W}.players[1].y=7*48; ${W}.snapCamera(); 0`);
  await b.wait(500);
  await b.key('KeyE'); await b.wait(3000); await b.skipModals();
  console.log('cajón abierto:', await b.eval(`${S}.flags.cajon_abierto`));
  await b.wait(2500);
  await b.key('KeyE'); await b.wait(4500); await b.skipModals();
  console.log('pistas ahora:', await b.eval(`${S}.clueOrder.join()`));
  await err('B/C');
  console.log('logs', b.logs);
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
