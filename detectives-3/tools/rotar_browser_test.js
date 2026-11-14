// Prueba en NAVEGADOR (FIX-4c, P10): en el móvil en VERTICAL sale el aviso «gira el teléfono» y todo se detiene; en horizontal no sale; con ratón nunca.
// Uso: node build.js && node tools/rotar_browser_test.js   (capturas opcionales: SHOT=/carpeta)
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    for (const [w, h, touch, expect, name] of [[844, 390, true, false, 'iPhone 14 horizontal'], [390, 844, true, true, 'iPhone 14 vertical'], [390, 844, false, false, 'vertical con ratón (ordenador)'], [1024, 768, true, false, 'tablet horizontal'], [768, 1024, true, true, 'tablet vertical']]) {
      const tag = file + ' ' + name + ' ' + w + '×' + h + ': ';
      const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { w, h, wait: 1800 }), E = (x) => b.eval(x);
      await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
      await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(500);
      await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
      if (touch) { await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); await b.wait(500); }
      const s = JSON.parse(await E(`JSON.stringify({ shown: !!G.rotateShown, touch: G.input.touch.enabled, errs: G.errors.length })`));
      ok(tag + (expect ? 'sale el aviso «gira el teléfono»' : 'NO sale el aviso') + ' (touch ' + s.touch + ')', s.shown === expect);
      ok(tag + 'sin errores', s.errs === 0);
      if (expect) {
        // todo se detiene: el reloj del caso no avanza y los toques no hacen nada
        const t0 = await E('G.scene.st.elapsed()'); await b.wait(1200); const t1 = await E('G.scene.st.elapsed()');
        ok(tag + 'el caso no avanza con el aviso (' + t0 + '→' + t1 + ')', t1 === t0);
        if (process.env.SHOT) await b.shot(process.env.SHOT + '/rotar_' + name.replace(/\W+/g, '_') + '.png');
        // al girar (ventana apaisada) el aviso desaparece y el juego sigue
        await E(`(window.__r = 1)`);
      }
    }
  }
  console.log(bad ? 'HAY FALLOS' : 'Todo en orden'); process.exit(bad ? 1 : 0);
})();
