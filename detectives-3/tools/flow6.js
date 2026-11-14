const { start } = require('./flow2');
const SC = require('os').tmpdir();
(async () => {
  const b = await start('coop', 2); // Difícil
  await b.skipModals();
  const W = 'G.scene.world', S = 'G.scene.st';
  const err = async (t) => { const e = await b.eval('JSON.stringify(G.errors)'); console.log(t, e === '[]' ? 'ok' : 'ERRORES ' + e); };
  console.log('dificultad:', await b.eval(`${S}.diffId`), 'strikes', await b.eval(`${S}.diff.strikes`));
  // pantalla dividida
  await b.eval(`${W}.players[0].x=2*48; ${W}.players[0].y=400; ${W}.players[1].x=21*48; ${W}.players[1].y=400; 0`);
  await b.wait(900);
  console.log('split:', await b.eval(`${W}.split`));
  await b.shot(SC + '/20_split.png');
  await err('split');
  // callejón en el capítulo 2
  await b.eval(`['gancho_vacio','sacos_cambiados','glaseado_salado','vitrina_vacia','nota_cierre'].forEach(c=>${S}.addClue(c,'t')); ${S}.setFlag('talked_merengue'); ${S}.setFlag('talked_pimienta'); ${S}.checkAdvance(); 0`);
  await b.skipModals(60);
  console.log('capítulo:', await b.eval(`${S}.chapter`));
  await b.eval(`${W}.enterRoom('callejon','puerta_trasera'); 0`);
  await b.eval(`${W}.players[0].x=21.5*48; ${W}.players[0].y=5*48+8; ${W}.players[1].x=21.5*48+30; ${W}.players[1].y=5*48+8; ${W}.snapCamera(); 0`);
  await b.wait(800);
  console.log('foco Lali:', await b.eval(`JSON.stringify(${W}.players[1].focus && ${W}.players[1].focus.verb)`), ' Baguette watching:', await b.eval(`${W}.npcs.baguette.watching`));
  await b.shot(SC + '/21_alley.png');
  // Lali graba (equipar grabadora ya es el predeterminado)
  let spotted = 0, done = 0;
  for (let i = 0; i < 6 && !done; i++) {
    await b.key('Enter', 60);
    await b.wait(4200);
    const m = await b.eval('G.scene.modals.length');
    if (m) done = 1;
  }
  console.log('grabación conseguida:', await b.eval(`${S}.hasClue('grabacion_baguette')`));
  await err('callejón');
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
