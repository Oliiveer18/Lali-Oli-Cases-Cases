const { start } = require('./flow2');
(async () => {
  const b = await start('solo', 1);
  await b.skipModals();
  const W = 'G.scene.world';
  await b.eval(`${W}.players[0].x=13.5*48; ${W}.players[0].y=212; ${W}.players[1].x=12*48; ${W}.players[1].y=300; ${W}.snapCamera(); 0`);
  await b.wait(1500);
  await b.key('KeyE');
  for (let i = 0; i < 8; i++) {
    await b.wait(500);
    console.log(await b.eval(`JSON.stringify({pos:[${W}.players[1].x|0,${W}.players[1].y|0], task:!!${W}.players[1].task, arrived:${W}.players[1].task&&${W}.players[1].task.arrived, started:${W}.players[1].task&&${W}.players[1].task.started, path:${W}.players[1].path&&${W}.players[1].path.length, work:!!${W}.players[1].work, mod:G.scene.modals.length, t:${W}.players[1].task&&${W}.players[1].task.t})`));
  }
  console.log(await b.eval(`JSON.stringify(${W}.workSpots(${W}.players[1].task? ${W}.players[1].task.target : ${W}.room.props.find(p=>p.id==='tenedor'),'prop').slice(0,8))`));
  b.close();
})();
