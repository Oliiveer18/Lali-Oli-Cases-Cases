// Prueba en NAVEGADOR (FIX-6c 3/4): un dedo apoyado durante un diálogo/transición y que sigue apoyado al acabar NO se queda «muerto»:
// el stick lo coge al terminar. Uso: node build.js && node tools/touch_dialog_browser_test.js
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
    const t = JSON.parse(await E('JSON.stringify({A:G.input.touch.A,T:G.input.touch.T})'));
    const st = async () => JSON.parse(await E('JSON.stringify({st:G.input.touch.stick.id,A:G.input.touch.A.id,T:G.input.touch.T.id,kA:G.input.key("TouchA"),kT:G.input.key("TouchT"),mx:G.input.touch.mx,pl:G.input.touch.playing})'));
    const openModal = async () => { await E(`(window.__m={d:false,update(){return this.d?'done':null},draw(){}}, G.scene.modals.push(window.__m), 1)`); await b.wait(150); };
    const closeModal = async () => { await E(`(window.__m.d=true, 1)`); await b.wait(250); };
    // 1) dedo apoyado en la zona del stick DURANTE un diálogo y que sigue apoyado cuando termina
    await openModal(); let s = await st(); ok(tag + 'con el diálogo abierto no se está jugando', s.pl === false);
    await E(`(ptr('pointerdown', -60, 300, 71), 1)`); s = await st(); ok(tag + 'durante el diálogo el dedo no coge el stick', s.st === null);
    await closeModal(); s = await st();
    ok(tag + 'al acabar el diálogo el dedo que sigue apoyado COGE el stick (id ' + s.st + ')', s.st === 71);
    await E(`(ptr('pointermove', 40, 300, 71), 1)`); s = await st(); ok(tag + 'y al moverlo el detective se mueve (mx ' + s.mx + ')', s.mx > 0.3);
    await E(`(ptr('pointerup', 0, 0, 71), 1)`); s = await st(); ok(tag + 'al soltar queda libre', s.st === null && s.mx === 0);
    // 2) dedo que se apoya y se levanta DENTRO del diálogo no deja nada atascado al acabar
    await openModal(); await E(`(ptr('pointerdown', -60, 300, 72), ptr('pointerup', 0, 0, 72), 1)`); await closeModal(); s = await st();
    ok(tag + 'dedo apoyado y levantado durante el diálogo: nada atascado al acabar', s.st === null && s.mx === 0);
    // 3) dedo apoyado en un botón durante el diálogo: NO se activa solo el botón al acabar
    await openModal(); await E(`(ptr('pointerdown', ${t.A.x}, ${t.A.y}, 73), 1)`); await closeModal(); s = await st();
    ok(tag + 'dedo sobre ACCIÓN durante el diálogo: al acabar no dispara la acción sola', s.A === null && !s.kA);
    await E(`(ptr('pointerup', 0, 0, 73), 1)`);
    // 4) dedo apoyado en zona NO-stick (centro-derecha) durante el diálogo: no se adopta
    await openModal(); await E(`(ptr('pointerdown', 700, 200, 74), 1)`); await closeModal(); s = await st();
    ok(tag + 'dedo fuera de la zona del stick: no coge el stick', s.st === null);
    await E(`(ptr('pointerup', 0, 0, 74), 1)`);
    // 5) con el stick ya sujeto por otro dedo, el adoptado no se lo quita
    await E(`(ptr('pointerdown', -60, 300, 75), 1)`); await openModal(); await E(`(ptr('pointerdown', -80, 250, 76), 1)`); await closeModal(); s = await st();
    ok(tag + 'el dedo que ya tenía el stick lo conserva (id ' + s.st + ')', s.st === 75);
    await E(`(ptr('pointerup', 0, 0, 75), ptr('pointerup', 0, 0, 76), 1)`); s = await st(); ok(tag + 'y todo se libera', s.st === null && s.mx === 0);
    // 6) transición (fundido) en lugar de diálogo
    await E(`(G.scene.trans = {t:0}, G.scene.updateTrans = function(dt){ this.trans.t += dt; if (this.trans.t > 0.4) this.trans = null; }, 1)`); await b.wait(60);
    await E(`(ptr('pointerdown', -60, 300, 77), 1)`); s = await st(); await b.wait(700); const s2 = await st();
    ok(tag + 'dedo apoyado durante una transición coge el stick al acabar (antes ' + s.st + ', después ' + s2.st + ')', s.st === null && s2.st === 77);
    await E(`(ptr('pointerup', 0, 0, 77), 1)`);
    ok(tag + 'sin errores en el juego', (await E('G.errors.length')) === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC: ' + e.stack); process.exit(1); });
