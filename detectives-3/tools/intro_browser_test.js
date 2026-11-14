// Prueba en NAVEGADOR (A3 INTRO-1, parte 1/3): el informe del caso sale al empezar (tras la tarjeta y antes de la ayuda y de la charla),
// se cierra con la tecla y con un toque, se reabre desde la Pausa y existe la pestaña «Caso» del Cuaderno (←/→ y dibujo sin errores).
// Uso: node build.js && node tools/intro_browser_test.js
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1800 }), E = (x) => b.eval(x), J = async (x) => JSON.parse(await E('JSON.stringify(' + x + ')'));
    await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
    const names = `G.scene.modals.map(function(m){ return m instanceof G.PlayModals.Card ? 'Card' : m instanceof G.PlayModals.Briefing ? 'Briefing' : m instanceof G.PlayModals.LineSeq ? 'Seq' : m instanceof G.PlayModals.Pause ? 'Pause' : (m.constructor && m.constructor.name) || '?'; })`;
    await E(`(G.save.data.settings.seenHelp = false, G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`);
    await b.wait(300);
    let n = await J(names);
    ok(file + ': al empezar la pila es [charla, ayuda, Informe, Tarjeta] (' + n.join(',') + ')', n.length === 4 && n[0] === 'Seq' && n[2] === 'Briefing' && n[3] === 'Card');
    await b.wait(700); await b.key('Enter', 80); await b.wait(300);
    n = await J(names);
    ok(file + ': cerrada la tarjeta, arriba queda el Informe (' + n.join(',') + ')', n[n.length - 1] === 'Briefing');
    const t0 = await J('{ x: G.scene.world.players[0].x, y: G.scene.world.players[0].y }');
    await b.wait(500); await b.key('Enter', 80); await b.wait(300);
    n = await J(names);
    ok(file + ': Intro cierra el Informe y sigue la ayuda (' + n.join(',') + ')', n.indexOf('Briefing') < 0 && n.length === 2);
    // toque en el botón del Informe: se reabre desde la Pausa y se cierra tocando
    await E(`(function(){ G.scene.modals.length = 0; var P = new G.PlayModals.Pause(G.scene); G.scene.modals.push(P); window.__P = P; })()`);
    await b.wait(300); await b.key('ArrowDown', 80); await b.wait(150); await b.key('Enter', 80); await b.wait(300);
    ok(file + ': la Pausa abre el Informe del caso', await J('!!(window.__P.brief && window.__P.brief instanceof G.PlayModals.Briefing)'));
    await b.wait(400);
    await E(`(window.ptr('pointerdown', 480, 489, 11), 1)`); await b.wait(60); await E(`(window.ptr('pointerup', 480, 489, 11), 1)`); await b.wait(400);
    ok(file + ': tocar «Volver» cierra el Informe y la Pausa sigue abierta', await J('!window.__P.brief && G.scene.modals.indexOf(window.__P) >= 0'));
    // Cuaderno: pestaña Caso
    await E(`(function(){ G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, 3); G.scene.modals.push(N); window.__N = N; })()`);
    ok(file + ': el Cuaderno tiene la pestaña «Caso»', await J(`window.__N.tabsDef().indexOf('Caso') === 4`));
    await b.wait(300); await b.key('ArrowRight', 80); await b.wait(300);
    ok(file + ': desde Acusar, → lleva a «Caso»', await J('window.__N.tab === 4'));
    await b.key('ArrowRight', 80); await b.wait(200);
    ok(file + ': → desde «Caso» vuelve a «Pistas»', await J('window.__N.tab === 0'));
    await b.key('ArrowLeft', 80); await b.wait(200);
    ok(file + ': ← desde «Pistas» lleva a «Caso»', await J('window.__N.tab === 4'));
    const drawn = await J(`(function(){ var texts = [], c = document.getElementById('c').getContext('2d'), f = c.fillText; c.fillText = function(t){ texts.push(String(t)); return f.apply(c, arguments); }; var s = G.scene; try { s.draw(c); } catch (e) { texts.push('ERR ' + e.message); } c.fillText = f; return { n: texts.length, err: texts.filter(function(t){ return /^ERR/.test(t); }), cli: texts.join('|').indexOf(G.caseBriefing(G.scene.st).client) >= 0, h: texts.join('|').indexOf('QUÉ HAY QUE HACER') >= 0 }; })()`);
    ok(file + ': la pestaña «Caso» se dibuja con el cliente y «QUÉ HAY QUE HACER», sin errores', drawn.err.length === 0 && drawn.cli && drawn.h);
    await b.wait(100);
    const errs = await J('(window.__errs || [])');
    ok(file + ': sin errores de consola (' + errs.length + ')', errs.length === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
