// Prueba en NAVEGADOR (FIX-4a parte 2): en cada puerta de cada sala del caso, el globo de quien habla queda dentro de la zona segura (G.safe()),
// también en 844×390 con franjas táctiles. Uso: node build.js && node tools/burbujas_browser_test.js   (captura opcional: SHOT=/ruta.png)
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    for (const touch of [false, true]) {
      const tag = file + (touch ? ' táctil 844×390' : ' escritorio') + ': ';
      const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), touch ? { w: 844, h: 390, wait: 1800 } : { wait: 1800 }), E = (x) => b.eval(x);
      await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
      await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
      await E(`(G.scene.modals.length = 0, 1)`); await b.wait(200);
      if (touch) { await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); await b.wait(500); }
      const rooms = JSON.parse(await E(`JSON.stringify(Object.keys(G.scene.def.rooms))`));
      let total = 0, outside = 0, worst = '', overl = 0, worstOv = '', hudHit = 0, withZ = 0, worstHz = '';
      for (const rid of rooms) {
        const doors = JSON.parse(await E(`JSON.stringify((function(){ var w=G.scene.world; w.enterRoom('${rid}', null, true); return w.rooms['${rid}'].doors.map(function(d){return d.id}); })())`));
        for (const did of doors.concat([null])) {
          await E(`(function(){ var w=G.scene.world, r=w.rooms['${rid}']; if ('${did}' !== 'null') { var d=r.doors.find(function(q){return q.id==='${did}'}); w.players.forEach(function(p,i){ var sp=G.doorSpawn(d,i,r); p.x=sp.x; p.y=sp.y; }); }
            w.players.forEach(function(p){ p.say('Yo estaba en la cocina cuando oí un ruido muy extraño que venía de la despensa y me asusté mucho.', 6); }); G.ui.bubbleLog = []; return 1; })()`);
          await b.wait(250);
          const r = JSON.parse(await E(`JSON.stringify((function(){ var sf=G.safe(), L=G.ui.bubbleLog||[]; var bad=L.filter(function(q){ return q.x < sf.x-0.01 || q.y < sf.y-0.01 || q.x+q.w > sf.r+0.01 || q.y+q.h > sf.b+0.01; }); var last = L.slice(-2), ov = last.length === 2 && Math.min(last[0].x+last[0].w, last[1].x+last[1].w) - Math.max(last[0].x, last[1].x) > 0.5 && Math.min(last[0].y+last[0].h, last[1].y+last[1].h) - Math.max(last[0].y, last[1].y) > 0.5; var Z = (G.scene.world.hudZones || []), hz = last.filter(function(q){ return Z.some(function(z){ return Math.min(q.x+q.w, z.x+z.w) - Math.max(q.x, z.x) > 0.5 && Math.min(q.y+q.h, z.y+z.h) - Math.max(q.y, z.y) > 0.5; }); }).length; return { n: L.length, bad: bad.length, ex: bad[0] || null, ov: ov ? 1 : 0, nz: Z.length, hz: hz }; })())`));
          total += r.n; outside += r.bad; overl += r.ov; hudHit += r.hz; if (r.nz) withZ++; if (r.hz && !worstHz) worstHz = rid + '/' + did; if (r.ov && !worstOv) worstOv = rid + '/' + did; if (r.bad && !worst) worst = rid + '/' + did + ' ' + JSON.stringify(r.ex);
          if (process.env.SHOT && file === 'index.html' && touch && rid === rooms[0] && did === doors[0]) await b.shot(process.env.SHOT);
        }
      }
      ok(tag + 'se dibujaron globos (' + total + ') en ' + rooms.length + ' salas', total > 0);
      ok(tag + 'ningún globo fuera de la zona segura ' + worst, outside === 0);
      ok(tag + 'los globos de los dos detectives no se solapan entre sí ' + worstOv, overl === 0);
      ok(tag + 'el juego pasa las zonas del HUD a los globos', withZ > 0);
      ok(tag + 'ningún globo tapa el HUD ' + worstHz, hudHit === 0);
      ok(tag + 'sin errores de consola', b.logs.length === 0);
      b.close();
    }
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
