// Prueba en NAVEGADOR (FIX-6c 2/4): varios dedos a la vez no se pisan ni dejan ids atascados.
// Uso: node build.js && node tools/touch_multi_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    const tag = file + ': ';
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { w: 844, h: 390, wait: 1800 }), E = (x) => b.eval(x);
    await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
    await E(`(window.cap=new Set(), (function(){var c=document.getElementById('c'); c.setPointerCapture=function(i){cap.add(i)}; c.hasPointerCapture=function(i){return cap.has(i)}; c.releasePointerCapture=function(i){cap.delete(i)}})(), 1)`);
    await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
    await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
    await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); await b.wait(400);
    const t = JSON.parse(await E('JSON.stringify({A:G.input.touch.A,T:G.input.touch.T,S:G.input.touch.S,sx:G.layout.sx})'));
    const st = async () => JSON.parse(await E('JSON.stringify({st:G.input.touch.stick.id,A:G.input.touch.A.id,T:G.input.touch.T.id,S:G.input.touch.S.id,kA:G.input.key("TouchA"),kT:G.input.key("TouchT"),kS:G.input.key("TouchS"),mx:G.input.touch.mx,ox:G.input.touch.stick.ox,oy:G.input.touch.stick.oy})'));
    const free = (s) => s.st === null && s.A === null && s.T === null && s.S === null && !s.kA && !s.kT && !s.kS && s.mx === 0;
    // S1: segundo dedo en la zona del stick mientras el primero lo sujeta
    await E(`(ptr('pointerdown', -60, 300, 1), ptr('pointermove', 30, 300, 1), 1)`); const a = await st();
    await E(`(ptr('pointerdown', -80, 250, 2), ptr('pointermove', -20, 200, 2), ptr('pointermove', 60, 150, 2), 1)`); const c1 = await st();
    ok(tag + 'un 2.º dedo en la zona del stick no le quita el mando ni mueve su origen (id ' + c1.st + ')', c1.st === 1 && c1.ox === a.ox && c1.oy === a.oy && c1.mx > 0.3);
    await E(`(ptr('pointerup', 0, 0, 2), 1)`); const c2 = await st();
    ok(tag + 'al soltar ese 2.º dedo el stick sigue sujeto por el 1.º', c2.st === 1 && c2.mx > 0.3);
    await E(`(ptr('pointermove', 40, 320, 1), 1)`); const c3 = await st();
    ok(tag + 'el 1.º dedo sigue moviendo el stick', c3.st === 1 && c3.mx > 0.3);
    await E(`(ptr('pointerup', 0, 0, 1), 1)`); ok(tag + 'todo libre al soltar', free(await st()));
    // S2: dos dedos sobre ACCIÓN: solo el primero cuenta; soltar el segundo no apaga el botón
    await E(`(ptr('pointerdown', ${t.A.x}, ${t.A.y}, 11), ptr('pointerdown', ${t.A.x}, ${t.A.y}, 12), 1)`); let s = await st();
    ok(tag + 'dos dedos en ACCIÓN: la sujeta el 1.º', s.A === 11 && s.kA);
    await E(`(ptr('pointerup', 0, 0, 12), 1)`); s = await st(); ok(tag + 'soltar el 2.º no apaga ACCIÓN', s.A === 11 && s.kA);
    await E(`(ptr('pointerup', 0, 0, 11), 1)`); ok(tag + 'soltar el 1.º la apaga', free(await st()));
    // S3: gesto del sistema de iOS (5 dedos): pointercancel de todos
    await E(`(ptr('pointerdown', -60, 300, 21), ptr('pointerdown', ${t.A.x}, ${t.A.y}, 22), ptr('pointerdown', ${t.T.x}, ${t.T.y}, 23), ptr('pointerdown', ${t.S.x}, ${t.S.y}, 24), ptr('pointerdown', 300, 200, 25), 1)`); s = await st();
    ok(tag + 'cuatro controles agarrados a la vez', s.st === 21 && s.A === 22 && s.T === 23 && s.S === 24);
    await E(`([21,22,23,24,25].forEach(function(i){ptr('pointercancel',0,0,i)}), 1)`); ok(tag + '5 pointercancel seguidos lo liberan todo', free(await st()));
    // S4: 8 dedos y soltar en orden distinto; un pointerup de un id desconocido no suelta a los demás
    await E(`(ptr('pointerdown', -60, 300, 31), ptr('pointerdown', ${t.A.x}, ${t.A.y}, 32), 1)`);
    await E(`(ptr('pointerup', 0, 0, 999), 1)`); s = await st(); ok(tag + 'un pointerup de un id desconocido no suelta a los demás', s.st === 31 && s.A === 32);
    await E(`([33,34,35,36,37,38].forEach(function(i){ptr('pointerdown',300+i,200,i)}), [38,31,35,32,37,34,36,33].forEach(function(i){ptr('pointerup',0,0,i)}), 1)`); ok(tag + '8 dedos soltados en otro orden: todo libre', free(await st()));
    // S5: ráfaga de 300 toques rápidos intercalados mientras el stick está sujeto
    await E(`(ptr('pointerdown', -60, 300, 41), ptr('pointermove', 30, 300, 41), 1)`);
    await E(`(function(){for(var i=0;i<300;i++){var id=100+i,p=i%3===0?[${t.A.x},${t.A.y}]:i%3===1?[${t.T.x},${t.T.y}]:[300,200];ptr('pointerdown',p[0],p[1],id);if(i%2)ptr('pointermove',p[0]+3,p[1],id);ptr(i%7?'pointerup':'pointercancel',0,0,id)}return 1})()`); s = await st();
    ok(tag + 'tras 300 toques rápidos el stick sigue sujeto y los botones libres', s.st === 41 && s.A === null && s.T === null && !s.kA && !s.kT && s.mx > 0.3);
    await E(`(ptr('pointerup', 0, 0, 41), 1)`); ok(tag + 'y todo se libera al final', free(await st()));
    // S6: un toque corto de ACCIÓN (down y up en el mismo fotograma) sí cuenta como pulsación
    await E(`(window.__p=0, G.input.__u=G.input.update, G.input.update=function(){ if(G.input.keyPressed('TouchA')) window.__p++; return G.input.__u.apply(this,arguments)}, ptr('pointerdown', ${t.A.x}, ${t.A.y}, 51), ptr('pointerup', 0, 0, 51), 1)`); await b.wait(200);
    ok(tag + 'un toque relámpago en ACCIÓN (down+up en el mismo fotograma) se registra una vez (' + await E('window.__p') + ')', (await E('window.__p')) === 1);
    ok(tag + 'sin errores en el juego', (await E('G.errors.length')) === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC: ' + e.stack); process.exit(1); });
