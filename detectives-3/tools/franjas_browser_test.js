// Prueba en NAVEGADOR (FIX-4a parte 1): con táctil, los controles viven en franjas laterales FUERA del mapa; con ratón no hay franjas.
// Uso: node build.js && node tools/franjas_browser_test.js   (capturas opcionales: SHOT=/carpeta)
const { launch } = require('./cdp'), path = require('path');
const SIZES = [[844, 390], [932, 430], [667, 375], [1024, 768]];
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    for (const [w, h] of SIZES) {
      const tag = file + ' ' + w + '×' + h + ': ';
      const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { w, h, wait: 1800 }), E = (x) => b.eval(x);
      await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
      await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
      await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
      // 1) con ratón (táctil apagado) no hay franjas y el lienzo es el de siempre
      const m = JSON.parse(await E(`JSON.stringify({ sx: G.layout.sx, w: document.getElementById('c').width })`));
      ok(tag + 'con ratón no hay franjas (sx 0, lienzo 1920)', m.sx === 0 && m.w === 1920);
      // 2) el primer toque activa el modo táctil: aparecen las franjas
      await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); await b.wait(500);
      const t = JSON.parse(await E(`JSON.stringify({ sx: G.layout.sx, fw: G.layout.fw, w: document.getElementById('c').width, A: G.input.touch.A, T: G.input.touch.T, S: G.input.touch.S, VW: G.VW, VH: G.VH })`));
      ok(tag + 'con táctil aparecen franjas de ≥112 px lógicos (sx ' + t.sx + ')', t.sx >= 112 && t.sx <= 200);
      ok(tag + 'el lienzo se ensancha (' + t.w + ' = (960+2·' + t.sx + ')·2)', t.w === (960 + 2 * t.sx) * 2);
      const inStrip = (b2) => b2.x - b2.r >= t.VW && b2.x + b2.r <= t.VW + t.sx && b2.y - b2.r >= 0 && b2.y + b2.r <= t.VH;
      ok(tag + 'ACCIÓN, Cambiar y Detective están dentro de la franja derecha, fuera del mapa', inStrip(t.A) && inStrip(t.T) && inStrip(t.S));
      const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) >= p.r + q.r + 8;
      ok(tag + 'los tres botones no se pisan', d(t.A, t.T) && d(t.T, t.S) && d(t.A, t.S));
      // 3) pulsar ACCIÓN en la franja: tecla táctil activa y suelta
      await E(`(ptr('pointerdown', ${t.A.x}, ${t.A.y}, 11), 1)`);
      const a1 = await E('G.input.key("TouchA")');
      await E(`(ptr('pointerup', ${t.A.x}, ${t.A.y}, 11), 1)`);
      const a2 = await E('G.input.key("TouchA")');
      ok(tag + 'tocar ACCIÓN en la franja la activa y al soltar se apaga', a1 === true && a2 === false);
      await E(`(ptr('pointerdown', ${t.S.x}, ${t.S.y}, 12), 1)`);
      const s1 = await E('G.input.key("TouchS")'); await E(`(ptr('pointerup', ${t.S.x}, ${t.S.y}, 12), 1)`);
      ok(tag + 'tocar Detective en la franja funciona', s1 === true);
      // 4) joystick: arrastrar en la franja izquierda mueve al detective; un toque en el mapa lejos de los botones no pulsa ningún botón
      const x0 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
      await E(`(ptr('pointerdown', -${Math.round(t.sx / 2)}, 300, 21), ptr('pointermove', 50, 300, 21), 1)`); await b.wait(800);
      const mx = await E('G.input.touch.mx.toFixed(2)'); await E(`(ptr('pointerup', 50, 300, 21), 1)`); await b.wait(200);
      const x1 = await E('Math.round(G.scene.world.players[G.scene.world.human].x)');
      ok(tag + 'arrastrar desde la franja izquierda mueve al detective (mx ' + mx + ', x ' + x0 + '→' + x1 + ')', Number(mx) > 0.5 && x1 > x0 + 5);
      // 5) el área de juego sigue siendo 960×540 y cabe entera en pantalla (nada del mapa queda bajo los controles)
      const v = JSON.parse(await E(`JSON.stringify((function(){ var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH); return { k: k, mapW: G.VW*k, mapH: G.VH*k, boxW: r.width, boxH: r.height }; })())`));
      ok(tag + 'el mapa entero cabe en pantalla (' + Math.round(v.mapW) + '×' + Math.round(v.mapH) + ' px de ' + Math.round(v.boxW) + '×' + Math.round(v.boxH) + ')', v.mapW <= v.boxW + 0.5 && v.mapH <= v.boxH + 0.5);
      // 6) al volver al menú desaparecen las franjas
      await E(`(G.go(G.scenes.title), 1)`); await b.wait(400);
      const back = JSON.parse(await E(`JSON.stringify({ sx: G.layout.sx, w: document.getElementById('c').width })`));
      ok(tag + 'fuera de la partida no hay franjas', back.sx === 0 && back.w === 1920);
      if (process.env.SHOT && file === 'index.html') { await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500); await E(`(G.scene.modals.length = 0, 1)`); await b.wait(400); await b.shot(path.join(process.env.SHOT, 'franjas_' + w + 'x' + h + '.png')); }
      ok(tag + 'sin errores de consola', b.logs.length === 0);
      b.close();
    }
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
