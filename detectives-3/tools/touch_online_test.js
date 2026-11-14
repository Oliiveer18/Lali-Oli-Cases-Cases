// Prueba con TOQUES REALES (PointerEvent touch) en modo online: el joystick virtual debe mover al detective propio y el botón ACCIÓN debe responder.
const http = require('http'), fs = require('fs'), path = require('path');
const { launch } = require('./cdp.js');
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(path.join(__dirname, '../dist/web/index.html'))); }).listen(0);
(async () => {
  const br = await launch('http://127.0.0.1:' + srv.address().port + '/', { w: 844, h: 390, wait: 2500 });
  const E = (e) => br.eval(`(function(){ return (${e}) })()`);
  await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'online',me:0}), 1)`);
  await br.wait(600);
  await E(`(function(){var s=G.scene; while(s.modals&&s.modals.length) s.modals.pop(); return 1})()`);
  await br.wait(300);
  await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
  await E('(ptr("pointerdown",480,40,3), ptr("pointerup",480,40,3), 1)'); await br.wait(400);
  console.log('modo de entrada', await E('G.input.mode'), '| jugando', await E('G.input.touch.playing'));
  const x0 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
  await E('(ptr("pointerdown",-60,300), ptr("pointermove",60,300), 1)');
  await br.wait(900);
  const mid = await E('G.input.touch.mx.toFixed(2)');
  await E('(ptr("pointerup",60,300), 1)');
  await br.wait(300);
  const x1 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
  console.log('joystick mx', mid, '| x antes', x0, 'después', x1, '| MUEVE', x1 > x0 + 10);
  // en 1 jugador debe seguir igual
  await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'solo'}), 1)`); await br.wait(600);
  await E(`(function(){var s=G.scene; while(s.modals&&s.modals.length) s.modals.pop(); return 1})()`); await br.wait(300);
  const y0 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
  await E('(ptr("pointerdown",-60,300), ptr("pointermove",60,300), 1)'); await br.wait(900); await E('(ptr("pointerup",60,300), 1)'); await br.wait(300);
  const y1 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
  console.log('solo: x antes', y0, 'después', y1, '| MUEVE', y1 > y0 + 10, '| logs', br.logs.slice(0, 3));
  br.close(); srv.close(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
