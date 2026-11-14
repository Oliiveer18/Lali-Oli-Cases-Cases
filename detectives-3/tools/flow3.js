const { start } = require('./flow2');
const SC = require('os').tmpdir();
(async () => {
  const b = await start('coop');
  await b.skipModals();
  const W = 'G.scene.world';
  await b.eval(`${W}.players[0].x=552; ${W}.players[0].y=212; ${W}.players[1].x=700; ${W}.players[1].y=400; ${W}.snapCamera(); 0`);
  await b.wait(400);
  console.log('foco:', await b.eval(`JSON.stringify(${W}.players[0].focus && {k:${W}.players[0].focus.kind, v:${W}.players[0].focus.verb, l:${W}.players[0].focus.label})`));
  await b.shot(SC + '/07_focus.png');
  await b.key('KeyE'); await b.wait(900);
  console.log('trabajo/modales:', await b.eval('G.scene.modals.length'), await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'));
  await b.shot(SC + '/08_discover.png');
  await b.skipModals();
  console.log('pistas:', await b.eval('G.scene.st.clueOrder.join()'));
  console.log('errores:', await b.eval('JSON.stringify(G.errors)'), b.logs);
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
