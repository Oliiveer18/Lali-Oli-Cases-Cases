// Prueba de puertas en cualquier pared (fase 1B-1): copia el caso 1, mueve las puertas de la cocina a S, O y E,
// y comprueba que se validan, que los jugadores aparecen en suelo libre delante de la puerta, que se puede interactuar
// con ellas y que el compañero IA encuentra camino hasta cada una.
const { launch } = require('./cdp');
(async () => {
  const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 1800 });
  const E = (x) => b.eval(x);
  console.log('preparado', await E(`(function(){
    var c = JSON.parse(JSON.stringify(G.CASES.tarta)); c.id = 'paredes';
    var d = c.rooms.cocina.doors;
    var set = function (id, wall, x, y) { var o = d.find(function (q) { return q.id === id; }); o.wall = wall; o.x = x; o.y = y; };
    set('puerta_tienda', 's', 3, 11); set('puerta_almacen', 'w', 0, 6); set('puerta_trasera', 'e', 21, 4);
    G.CASES.paredes = c;
    var r = G.validateCase(c);
    return JSON.stringify({ ok: r.ok, errores: r.errors });
  })()`));
  await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'paredes',diff:'normal',mode:'solo'}), 1)`);
  await b.wait(500);
  for (const [id, wall] of [['puerta_tienda', 's'], ['puerta_almacen', 'w'], ['puerta_trasera', 'e']]) {
    const r = await E(`(function(){
      var s = G.scene; s.modals.length = 0; var w = s.world;
      w.enterRoom('cocina', '${id}');
      var room = w.room, d = room.doors.find(function (q) { return q.id === '${id}'; });
      var libre = w.players.every(function (p) { return !room.isSolidAt(p.x, p.y); });
      var f = w.findFocus(w.players[0]);
      var spots = w.workSpots(d, 'door');
      var ai = w.players[1], path = spots.length ? G.findPath(w, Math.floor(ai.x / G.TS), Math.floor((ai.y - 1) / G.TS), spots[0].x, spots[0].y) : null;
      var t = w.targetPos && (w.target = { kind: 'door', room: 'cocina', id: '${id}' }, w.targetPos());
      return JSON.stringify({ libre: libre, foco: !!(f && f.kind === 'door' && f.d.id === '${id}'), spots: spots.length > 0, camino: !!path, flecha: !!t });
    })()`);
    console.log(`${wall} ${id}: ${r}`);
  }
  await b.wait(500);
  console.log('errores', await E('JSON.stringify(G.errors)'), 'logs', b.logs.slice(0, 5));
  b.close();
})().catch((e) => { console.error(e); process.exit(1); });
