// Prueba en NAVEGADOR (FIX-6c 4/4): estrés del táctil. Cientos de diálogos/transiciones abiertos y cerrados con dedos que se apoyan, mueven, levantan y cancelan
// en orden aleatorio (semilla fija): al final no queda ningún id atascado y el stick vuelve a responder. Uso: node build.js && node tools/touch_stress_browser_test.js
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
    const t = JSON.parse(await E('JSON.stringify({A:G.input.touch.A,T:G.input.touch.T,S:G.input.touch.S})'));
    // 400 pasos aleatorios (generador con semilla): abrir/cerrar diálogo, apoyar/mover/levantar/cancelar dedos en zonas variadas; se espera un fotograma cada pocos pasos
    await E(`(function(){ var seed=12345; window.rnd=function(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }; window.live=[]; window.nid=1000; window.mod=null;
      window.zones=[[-60,300],[-90,200],[100,250],[${t.A.x},${t.A.y}],[${t.T.x},${t.T.y}],[${t.S.x},${t.S.y}],[700,200],[300,150]];
      window.step=function(){ var r=rnd();
        if(r<0.12){ if(!mod){ mod={d:false,update:function(){return this.d?'done':null},draw:function(){}}; G.scene.modals.push(mod);} else { mod.d=true; mod=null; } }
        else if(r<0.45){ var z=zones[Math.floor(rnd()*zones.length)], id=nid++; live.push(id); ptr('pointerdown',z[0],z[1],id); }
        else if(r<0.65&&live.length){ var id2=live[Math.floor(rnd()*live.length)]; ptr('pointermove',-60+rnd()*200,120+rnd()*250,id2); }
        else if(r<0.85&&live.length){ var i=Math.floor(rnd()*live.length); ptr('pointerup',0,0,live[i]); live.splice(i,1); }
        else if(live.length){ var j=Math.floor(rnd()*live.length); ptr('pointercancel',0,0,live[j]); live.splice(j,1); }
      }; return 1})()`);
    for (let i = 0; i < 80; i++) { await E(`(function(){for(var k=0;k<5;k++)step();return 1})()`); await b.wait(40); }
    const errs0 = await E('G.errors.length');
    // se cierra todo y se sueltan todos los dedos que quedan
    await E(`(function(){ if(mod){mod.d=true;mod=null} live.forEach(function(id){ptr('pointerup',0,0,id)}); live=[]; return 1})()`); await b.wait(400);
    const s = JSON.parse(await E('JSON.stringify({st:G.input.touch.stick.id,A:G.input.touch.A.id,T:G.input.touch.T.id,S:G.input.touch.S.id,kA:G.input.key("TouchA"),kT:G.input.key("TouchT"),kS:G.input.key("TouchS"),mx:G.input.touch.mx,pl:G.input.touch.playing,mod:G.scene.modals.length})'));
    ok(tag + '400 pasos aleatorios: al final se juega y no queda ningún id ni botón atascado (' + JSON.stringify(s) + ')', s.pl === true && s.mod === 0 && s.st === null && s.A === null && s.T === null && s.S === null && !s.kA && !s.kT && !s.kS && s.mx === 0);
    // el stick vuelve a responder con un toque nuevo
    await E(`(ptr('pointerdown', -60, 300, 9001), ptr('pointermove', 40, 300, 9001), 1)`); await b.wait(100);
    const m = await E('G.input.touch.mx.toFixed(2)'); ok(tag + 'tras el estrés el stick responde a un toque nuevo (mx ' + m + ')', Number(m) > 0.3 && (await E('G.input.touch.stick.id')) === 9001);
    await E(`(ptr('pointerup', 0, 0, 9001), 1)`);
    // 60 ciclos: se abre un diálogo, se APOYA un dedo nuevo en la zona del stick durante él y se cierra con el dedo aún apoyado: el stick lo coge siempre
    let fails = 0;
    for (let i = 0; i < 60; i++) {
      const id = 9100 + i;
      await E(`(window.__m={d:false,update(){return this.d?'done':null},draw(){}}, G.scene.modals.push(window.__m), 1)`); await b.wait(40);
      await E(`(ptr('pointerdown', -60, 300, ${id}), 1)`);
      await E(`(window.__m.d=true, 1)`);
      let got = null; for (let w = 0; w < 40 && got !== id; w++) { await b.wait(25); got = await E('G.input.touch.stick.id'); } // el dedo se adopta en 1-2 fotogramas tras cerrar el diálogo; se espera hasta 1 s por si la máquina va lenta
      if (got !== id) fails++;
      await E(`(ptr('pointerup', 0, 0, ${id}), 1)`);
    }
    ok(tag + '60 diálogos seguidos con un dedo apoyado durante cada uno: el stick lo coge siempre (' + fails + ' fallos)', fails === 0);
    ok(tag + 'sin errores en el juego (' + errs0 + ')', (await E('G.errors.length')) === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('EXC: ' + e.stack); process.exit(1); });
