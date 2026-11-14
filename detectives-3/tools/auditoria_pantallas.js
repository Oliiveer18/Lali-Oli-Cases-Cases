// FIX-4b · AUDITORÍA DE PANTALLAS (solo mide, no arregla): recorre las pantallas del juego en tamaños de móvil/tablet, apunta cada texto dibujado
// (parcheando fillText) y marca: (1) texto fuera de la pantalla de juego, (2) texto pisado por otro, (3) texto pequeño en píxeles reales de ese dispositivo.
// Uso: node build.js && node tools/auditoria_pantallas.js   (capturas: SHOT=/carpeta · informe: escribe docs/AUDITORIA_PANTALLAS.md)
const { launch } = require('./cdp'), path = require('path'), fs = require('fs');
const VIEWS = [['iPhone 14 horizontal', 844, 390], ['iPhone Pro Max horizontal', 932, 430], ['iPhone SE horizontal', 667, 375], ['tablet horizontal', 1024, 768], ['iPhone 14 vertical', 390, 844]];
const NB = (k) => `(function(){ G.scene.modals.length = 0; G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, ${k}); G.scene.modals.push(N); window.__N = N; })()`;
const SCREENS = [
  ['01 título', `(G.go(G.scenes.title), 1)`],
  ['02 modo de juego', `(G.go(G.scenes.mode), 1)`],
  ['03 despacho (hub)', `(G.go(G.scenes.hub), 1)`],
  ['04 sala online', `(G.go(G.scenes.lobby), 1)`],
  ['05 tarjeta de introducción', `(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`, 'play'],
  ['06 juego (HUD)', `(G.scene.modals.length = 0, 1)`, 'play'],
  ['07 cuaderno · pestaña 1', NB(0), 'play'], ['08 cuaderno · pestaña 2', NB(1), 'play'], ['09 cuaderno · pestaña 3', NB(2), 'play'],
  ['10 cuaderno · Acusar', NB(3), 'play'],
  ['11 Acusar · elegir culpable', `(window.__N.sub='slots', window.__N.openChooser('culprit'), 1)`, 'play'],
  ['12 Acusar · ¿estáis seguros?', `(function(){ var N=window.__N; N.buildSlots(); N.confirm = new G.ui.Menu([{ label: 'Sí, ¡acusar!', icon: 'ico_star' }, { label: 'Seguir investigando', icon: 'ico_arrow' }], { x: 490, y: 320, w: 340, h: 46, gap: 8 }); N.sub='confirm'; return 1; })()`, 'play'],
  ['13 pausa', `(G.scene.modals.length = 0, G.scene.modals.push(new G.PlayModals.Pause(G.scene)), 1)`, 'play'],
  ['14 conversación', `(function(){ var s=G.scene; s.modals.length=0; var id=Object.keys(s.def.npcs).find(function(k){return !s.def.npcs[k].cat}); s.modals.push(new G.PlayModals.Talk(s,id)); return 1; })()`, 'play'],
  ['15 resultado', `(function(){ var s=G.scene; s.modals.length=0; s.modals.push(new G.PlayModals.Result(s, s.st.reward(), true, '')); return 1; })()`, 'play'],
];
const HOOK = `(function(){ if (window.__hooked) return 1; window.__hooked = true; var f = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(t, x, y){ if (window.__tl) { try { var m = this.measureText(t), M = this.getTransform(), L = G.layout, Q = 2;
    var px = parseInt((this.font.match(/(\\d+(?:\\.\\d+)?)px/)||[0,0])[1]); var gx = function(X,Y){ return (M.a*X + M.c*Y + M.e)/Q - L.sx; }, gy = function(X,Y){ return (M.b*X + M.d*Y + M.f)/Q; };
    var l = gx(x - m.actualBoundingBoxLeft, y), r = gx(x + m.actualBoundingBoxRight, y), tp = gy(x, y - m.actualBoundingBoxAscent), bt = gy(x, y + m.actualBoundingBoxDescent);
    window.__tl.push({ t: String(t), l: l, r: r, tp: tp, bt: bt, px: px * M.a / Q, a: this.globalAlpha }); } catch (e) {} } return f.apply(this, arguments); }; return 1; })()`;
(async () => {
  const report = []; const summary = [];
  for (const [vname, w, h] of VIEWS) {
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { w, h, wait: 1800 }), E = (x) => b.eval(x);
    await E(HOOK);
    await E(`(window.ptr=function(type,x,y,id){var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout,k=Math.min(r.width/L.fw,r.height/G.VH),ox=(r.width-L.fw*k)/2,oy=(r.height-G.VH*k)/2; c.dispatchEvent(new PointerEvent(type,{pointerId:id||7,pointerType:'touch',clientX:r.left+ox+(x+L.sx)*k,clientY:r.top+oy+y*k,bubbles:true}))}, 1)`);
    await E(`(ptr('pointerdown', 480, 40, 3), ptr('pointerup', 480, 40, 3), 1)`); // modo táctil, como en el iPhone
    if (/vertical/.test(vname)) { // FIX-4c (P10): en vertical con táctil el juego muestra el aviso «gira el teléfono» y se detiene; se comprueba el aviso y no las pantallas
      await E(`(G.go(G.scenes.play,{caseId:'tarta',diff:'normal',mode:'solo'}), 1)`); await b.wait(600);
      const shown = await E('!!G.rotateShown');
      if (process.env.SHOT) await b.shot(path.join(process.env.SHOT, vname.replace(/ /g, '_') + '__aviso_girar.png'));
      summary.push({ vname, sname: 'aviso «gira el teléfono»', notice: shown });
      console.log(`${vname} · aviso «gira el teléfono»: ${shown ? 'SALE (correcto)' : 'NO SALE (fallo)'}`);
      b.close(); continue;
    }
    let inPlay = false;
    for (const [sname, js, kind] of SCREENS) {
      if (kind !== 'play' && inPlay) inPlay = false;
      await E(js); await b.wait(kind === 'play' ? 500 : 350);
      if (sname.startsWith('05')) await b.wait(300);
      await E(`(window.__tl = [], 1)`); await b.wait(160);
      const d = JSON.parse(await E(`JSON.stringify({ tl: window.__tl, k: (function(){ var c=document.getElementById('c'),r=c.getBoundingClientRect(),L=G.layout; return Math.min(r.width/L.fw, r.height/G.VH); })(), sx: G.layout.sx, errs: (window.__errs||[]).length })`));
      await E(`(window.__tl = null, 1)`);
      if (process.env.SHOT) await b.shot(path.join(process.env.SHOT, vname.replace(/ /g, '_') + '__' + sname.replace(/[^\w]+/g, '_') + '.png'));
      // de-duplicar (sombras) y quedarnos con lo visible
      const seen = new Set(), T = [];
      d.tl.forEach((q) => { if (!q.t.trim() || q.a < 0.4) return; const key = q.t + '|' + Math.round(q.l) + '|' + Math.round(q.tp); if (seen.has(key)) return; seen.add(key); T.push(q); });
      const out = T.filter((q) => q.l < -1 || q.r > 961 || q.tp < -1 || q.bt > 541);
      const small = T.filter((q) => q.px * d.k < 8.5 && q.px > 0);
      const tiny = T.filter((q) => q.px * d.k < 6);
      const over = [];
      for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
        const A = T[i], B = T[j]; if (A.t === B.t || A.t.includes(B.t) || B.t.includes(A.t)) continue;
        const iw = Math.min(A.r, B.r) - Math.max(A.l, B.l), ih = Math.min(A.bt, B.bt) - Math.max(A.tp, B.tp);
        if (iw > 3 && ih > 3 && (iw * ih) / Math.min((A.r - A.l) * (A.bt - A.tp), (B.r - B.l) * (B.bt - B.tp)) > 0.25) over.push([A.t.slice(0, 28), B.t.slice(0, 28)]);
      }
      const minPx = T.length ? Math.min.apply(null, T.map((q) => q.px * d.k).filter((v) => v > 0)) : 0;
      summary.push({ vname, sname, n: T.length, out: out.length, over: over.length, small: small.length, tiny: tiny.length, minPx: Math.round(minPx * 10) / 10, k: Math.round(d.k * 100) / 100 });
      report.push({ vname, sname, out: out.slice(0, 4).map((q) => q.t.slice(0, 40)), over: over.slice(0, 3), small: small.slice(0, 3).map((q) => q.t.slice(0, 24) + ' (' + Math.round(q.px * d.k * 10) / 10 + ' px)') });
      console.log(`${vname} · ${sname}: textos ${T.length} · fuera ${out.length} · pisados ${over.length} · pequeños(<8,5 px) ${small.length} · mínimo ${Math.round(minPx * 10) / 10} px`);
    }
    if (b.logs.length) console.log('LOGS', b.logs.slice(0, 3));
    b.close();
  }
  fs.writeFileSync('/tmp/auditoria.json', JSON.stringify({ summary, report }, null, 1));
  console.log('FIN');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
