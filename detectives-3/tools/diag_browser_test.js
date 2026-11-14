// Prueba en NAVEGADOR (FIX-6c, parte LOW): el diagnóstico del táctil graba los toques, se ve con ?diag / F9, detecta huecos de fotograma
// y NO cambia el comportamiento del juego. Uso: node build.js && node tools/diag_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    for (const q of ['', '?diag']) {
      const tag = file + q + ': ';
      const b = await launch('file://' + path.join(__dirname, '..', 'dist', file) + q, { w: 844, h: 390, wait: 1800 }), E = (x) => b.eval(x);
      await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
      await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
      await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
      ok(tag + (q ? 'con ?diag el recuadro está activo' : 'sin ?diag el recuadro está apagado'), (await E('G.input.diag.on')) === !!q);
      // toques: abajo/arriba, y uno cancelado
      await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), ptr('pointerdown', 300, 300, 4), ptr('pointercancel', 300, 300, 4), 1)`); await b.wait(300);
      const n = JSON.parse(await E('JSON.stringify(G.input.diag.n)'));
      ok(tag + 'cuenta lienzo 4, down 2, up 1, cancel 1, página 4 (' + JSON.stringify(n) + ')', n.lienzo === 4 && n.down === 2 && n.up === 1 && n.cancel === 1 && n.pagina === 4);
      // un toque que se queda «atascado» se ve en los ids del registro
      await E(`(ptr('pointerdown', -50, 300, 21), 1)`); await b.wait(100);
      const last = JSON.parse(await E('JSON.stringify(G.input.diag.ring[G.input.diag.ring.length-1])'));
      ok(tag + 'el registro muestra el id del stick (21)', last.ids[0] === 21 || last.ids[0] === null && (await E('G.input.touch.stick.id')) === 21);
      await E(`(ptr('pointerup', -50, 300, 21), 1)`);
      ok(tag + 'tras soltar no queda id atascado', (await E('G.input.touch.stick.id')) === null);
      // anillo acotado a 80
      await E(`(function(){for(var i=0;i<200;i++){ptr('pointerdown',480,40,50+i);ptr('pointerup',480,40,50+i);}return 1})()`);
      ok(tag + 'el anillo no pasa de 80 eventos', (await E('G.input.diag.ring.length')) <= 80);
      // hueco de fotograma: se congela el hilo 700 ms
      await E(`(function(){var t=performance.now();while(performance.now()-t<700);return 1})()`); await b.wait(400);
      ok(tag + 'detecta un hueco de fotograma > 400 ms', (await E('G.input.diag.maxGap')) > 600 && (await E('G.input.diag.gaps.length')) >= 1);
      const txt = await E('G.input.diag.dump()');
      ok(tag + 'dump() da texto con resumen y eventos', /página \d+/.test(txt) && /lienzo-down/.test(txt));
      // no cambia el juego: pulsar ACCIÓN sigue funcionando
      const A = JSON.parse(await E('JSON.stringify(G.input.touch.A)')); await E(`(ptr('pointerdown', ${A.x}, ${A.y}, 11), 1)`); const a1 = await E('G.input.key("TouchA")'); await E(`(ptr('pointerup', ${A.x}, ${A.y}, 11), 1)`);
      ok(tag + 'ACCIÓN táctil sigue funcionando', a1 === true && (await E('G.input.key("TouchA")')) === false);
      // F9 conmuta
      const on0 = await E('G.input.diag.on'); await b.key('F9'); const on1 = await E('G.input.diag.on');
      ok(tag + 'F9 conmuta el recuadro', on0 !== on1);
      ok(tag + 'sin errores en el juego', (await E('G.errors.length')) === 0);
      b.close();
    }
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC: ' + e.stack); process.exit(1); });
