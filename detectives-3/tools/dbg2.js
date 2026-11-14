const { start } = require('./flow2');
(async () => {
  const b = await start('coop', 1);
  await b.skipModals();
  const W = 'G.scene.world', S = 'G.scene.st';
  await b.eval(`['gancho_vacio','sacos_cambiados','glaseado_salado','vitrina_vacia','nota_cierre'].forEach(c=>${S}.addClue(c,'t')); ${S}.setFlag('talked_merengue'); ${S}.setFlag('talked_pimienta'); ${S}.checkAdvance(); 0`);
  await b.skipModals(60);
  await b.wait(500);
  console.log('cap', await b.eval(`${S}.chapter`), 'modales', await b.eval('G.scene.modals.length'), 'trans', await b.eval('!!G.scene.trans'));
  await b.eval(`${W}.enterRoom('callejon','puerta_trasera'); 0`);
  await b.wait(500);
  console.log(await b.eval(`JSON.stringify({room:${W}.roomId, npcs:Object.values(${W}.npcs).map(n=>[n.id,n.room,n.x|0,n.y|0]), p:${W}.players.map(p=>[p.x|0,p.y|0])})`));
  await b.eval(`${W}.players[0].x=21.5*48; ${W}.players[0].y=5*48+8; ${W}.players[1].x=21.5*48+30; ${W}.players[1].y=5*48+8; ${W}.snapCamera(); 0`);
  await b.wait(800);
  console.log(await b.eval(`JSON.stringify({watch:${W}.npcs.baguette.watching, f:${W}.players[1].focus&&${W}.players[1].focus.kind, mod:G.scene.modals.length, err:G.errors})`));
  b.close();
})();
