// Prueba en NAVEGADOR (FIX-6c 1/4): un dedo «fantasma» (se pierde pointerup/pointercancel) ya no deja el stick o los botones atascados.
// Uso: node build.js && node tools/touch_stuck_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    const tag = file + ': ';
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { w: 844, h: 390, wait: 1800 }), E = (x) => b.eval(x);
    await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
    await E(`(window.cap=new Set(), (function(){var c=document.getElementById('c'); c.setPointerCapture=function(i){cap.add(i)}; c.hasPointerCapture=function(i){return cap.has(i)}})(), 1)`);
    await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
    await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
    await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); await b.wait(400); // activa el táctil y las franjas
    const t = JSON.parse(await E('JSON.stringify({A:G.input.touch.A,T:G.input.touch.T,S:G.input.touch.S,sx:G.layout.sx})'));
    const st = () => E('JSON.stringify([G.input.touch.stick.id,G.input.touch.A.id,G.input.touch.T.id,G.input.touch.S.id,G.input.key("TouchA"),G.input.key("TouchT"),G.input.key("TouchS"),G.input.touch.mx])');
    const hold = async () => { await E(`(ptr('pointerdown', -50, 300, 41), ptr('pointermove', 40, 300, 41), ptr('pointerdown', ${t.A.x}, ${t.A.y}, 42), ptr('pointerdown', ${t.T.x}, ${t.T.y}, 43), 1)`); await b.wait(100); };
    // 0) normal: los 3 dedos agarran y al soltar se liberan
    await hold(); let s = JSON.parse(await st());
    ok(tag + 'tres dedos (stick, ACCIÓN, herramienta) agarrados: ' + JSON.stringify(s), s[0] === 41 && s[1] === 42 && s[2] === 43 && s[4] && s[5]);
    await E(`(ptr('pointerup', 0, 0, 41), ptr('pointerup', 0, 0, 42), ptr('pointerup', 0, 0, 43), 1)`); s = JSON.parse(await st());
    ok(tag + 'al soltar normal todo queda libre', s[0] === null && s[1] === null && s[2] === null && !s[4] && !s[5] && s[7] === 0);
    // 1) se pierde la captura sin pointerup
    await hold(); await E(`(['41','42','43'].forEach(function(i){document.getElementById('c').dispatchEvent(new PointerEvent('lostpointercapture',{pointerId:+i,pointerType:'touch'}))}), 1)`); s = JSON.parse(await st());
    ok(tag + 'lostpointercapture sin pointerup libera stick y botones', s[0] === null && s[1] === null && s[2] === null && !s[4] && !s[5] && s[7] === 0);
    // 2) la ventana pierde el foco
    await hold(); await E(`(window.dispatchEvent(new Event('blur')), 1)`); s = JSON.parse(await st());
    ok(tag + 'blur libera todo', s[0] === null && s[1] === null && s[2] === null && !s[4] && !s[5]);
    // 3) la página se oculta (cambio de app)
    await hold(); await E(`(Object.defineProperty(document,'hidden',{configurable:true,get:function(){return true}}), document.dispatchEvent(new Event('visibilitychange')), Object.defineProperty(document,'hidden',{configurable:true,get:function(){return false}}), 1)`); s = JSON.parse(await st());
    ok(tag + 'ocultar la página libera todo', s[0] === null && s[1] === null && s[2] === null && !s[4] && !s[5]);
    // 4) dedo fantasma: la captura desaparece sin ningún evento; el siguiente toque barre el id obsoleto y el stick vuelve a responder
    await E(`(cap.clear(), ptr('pointerdown', -50, 300, 51), 1)`); // 51 agarra el stick y su captura se logra
    await E(`(cap.delete(51), 1)`); // el navegador la pierde en silencio
    await E(`(ptr('pointerdown', -50, 300, 52), ptr('pointermove', 40, 300, 52), 1)`); await b.wait(100);
    s = JSON.parse(await st());
    ok(tag + 'tras un dedo fantasma, el toque nuevo recupera el stick (id ' + s[0] + ', mx ' + s[7] + ')', s[0] === 52 && s[7] > 0.3);
    await E(`(ptr('pointerup', 0, 0, 52), 1)`);
    // 5) un dedo legítimo (captura viva) NO se barre aunque entre otro dedo
    await E(`(ptr('pointerdown', -50, 300, 61), 1)`); await E(`(ptr('pointerdown', ${t.A.x}, ${t.A.y}, 62), 1)`); s = JSON.parse(await st());
    ok(tag + 'un dedo con captura viva conserva el stick al entrar otro dedo', s[0] === 61 && s[1] === 62);
    await E(`(ptr('pointerup', 0, 0, 61), ptr('pointerup', 0, 0, 62), 1)`);
    ok(tag + 'sin errores en el juego', (await E('G.errors.length')) === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC: ' + e.stack); process.exit(1); });
