const { start } = require('./flow2');
const SC = require('os').tmpdir();
(async () => {
  const b = await start('coop', 1);
  await b.skipModals();
  const W = 'G.scene.world', S = 'G.scene.st';
  const err = async (t) => { const e = await b.eval('JSON.stringify(G.errors)'); console.log(t, e === '[]' ? 'ok' : 'ERRORES ' + e); };
  // --- conversación con Merengue
  await b.eval(`const m=${W}.npcs.merengue; ${W}.players[0].x=m.x-40; ${W}.players[0].y=m.y; ${W}.players[1].x=m.x-80; ${W}.players[1].y=m.y; ${W}.snapCamera(); 0`);
  await b.wait(300); await b.key('KeyE'); await b.wait(500);
  console.log('modal:', await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'));
  await b.key('Enter'); await b.wait(300); await b.key('Enter'); await b.wait(300);
  await b.shot(SC + '/09_talk.png');
  await b.key('Enter'); await b.wait(500); await b.key('Enter'); await b.wait(300); await b.key('Enter'); await b.wait(300);
  await b.shot(SC + '/10_talk2.png');
  await err('charla');
  await b.key('Escape'); await b.wait(300);
  await b.skipModals();
  // --- todas las pistas + cuaderno
  await b.eval(`Object.keys(${S}.def.clues).forEach(c=>${S}.addClue(c,'test')); ${S}.setFlag('talked_merengue'); ${S}.setFlag('talked_pimienta'); ${S}.checkAdvance(); ${S}.checkAdvance(); 0`);
  await b.wait(300);
  console.log('capítulo:', await b.eval(`${S}.chapter`), 'modales:', await b.eval('G.scene.modals.length'));
  await b.skipModals(60);
  await b.key('KeyF'); await b.wait(400);
  await b.shot(SC + '/11_book_clues.png');
  await b.key('ArrowRight'); await b.wait(300); await b.shot(SC + '/12_book_susp.png');
  await b.key('ArrowRight'); await b.wait(300); await b.shot(SC + '/13_book_testi.png');
  await b.key('ArrowRight'); await b.wait(300);
  // elegir culpable
  await b.key('Enter'); await b.wait(300); await b.shot(SC + '/14_book_accuse.png');
  await err('cuaderno');
  console.log('opciones:', await b.eval(`G.scene.modals[0].chooser.menu.items.map(i=>i.id).join()`));
  // pimienta = 3er elemento
  await b.key('ArrowDown'); await b.key('ArrowDown'); await b.key('Enter'); await b.wait(300);
  await b.key('ArrowDown'); await b.key('Enter'); await b.wait(300);   // método
  const m1 = await b.eval(`G.scene.modals[0].chooser.menu.items.map(i=>i.id).join()`); console.log('métodos:', m1);
  await b.key('Enter'); await b.wait(300);  // carretilla (1º)
  await b.key('ArrowDown'); await b.key('Enter'); await b.wait(300);   // motivo
  await b.key('Enter'); await b.wait(300);  // error (1º)
  console.log('acc:', await b.eval(`JSON.stringify(G.scene.modals[0].acc)`));
  await b.shot(SC + '/15_book_ready.png');
  await b.key('ArrowDown'); await b.key('Enter'); await b.wait(300); // ACUSAR
  await b.shot(SC + '/16_confirm.png');
  await b.key('Enter'); await b.wait(600);
  console.log('tras acusar:', await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'), 'closed', await b.eval(`${S}.closed`), 'wrong', await b.eval(`${S}.wrong`));
  await b.skipModals(30);
  await b.shot(SC + '/17_result.png');
  console.log('final:', await b.eval('G.scene.modals.map(m=>m.constructor.name).join()'));
  await err('final');
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
