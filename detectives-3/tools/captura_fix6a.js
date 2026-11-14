// Capturas a ojo de FIX-6a en 844×390 (iPhone 14 apaisado) para la mitad 2 del fallo 5 y la revisión 2b.
// Uso: node build.js && node tools/captura_fix6a.js /carpeta/salida     (usa dist/index.html; escribe PNG y un resumen de medidas)
const { launch } = require('./cdp'), path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/capturas_fix6a'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 1800, w: 844, h: 390 }), E = (x) => b.eval(x);
  const shot = async (n) => { await b.wait(350); await b.shot(path.join(out, n + '.png')); console.log('captura', n + '.png'); };
  // caso generado con MÁS sospechosos y los nombres más largos
  const info = JSON.parse(await E(`(function(){ var best = null; for (var i = 1; i <= 300; i++) { var r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error) continue; var st = new G.CaseState(JSON.parse(JSON.stringify(r.def)), 'normal'), L = st.boardOptions().suspects, mx = Math.max.apply(null, L.map(function(s){ return s.name.length; })), sc = L.length * 100 + mx; if (!best || sc > best.sc) best = { sc: sc, id: r.def.id, n: L.length, mx: mx, longest: L.filter(function(s){ return s.name.length === mx; })[0].name }; } return JSON.stringify(best); })()`));
  console.log('caso elegido', JSON.stringify(info));
  await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'${info.id}',diff:'normal',mode:'solo'}), 1)`); await b.wait(600);
  await E(`(G.scene.modals.length = 0, 1)`); await b.wait(200);
  const open = async (tab) => { await E(`(function(){ G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, ${tab}); G.scene.modals.push(N); window.__N = N; })()`); };
  // (2) Sospechosos con 6 tarjetas
  await open(1); await shot('1_sospechosos_normal');
  await E(`(G.save.data.settings.bigText = true, 1)`); await shot('2_sospechosos_texto_grande');
  await E(`(G.save.data.settings.bigText = false, 1)`);
  // (2b-A) menú de charla con scroll: se fuerza una lista larga de temas (si el caso no la tiene) para ver las flechas ▲▼ arriba y abajo
  const talk = JSON.parse(await E(`(function(){ G.scene.modals.length = 0; var st = G.scene.st, ids = Object.keys(st.def.npcs).filter(function(i){ return !st.def.npcs[i].cat; }); var id = ids.sort(function(a,b){ return st.topicsFor(b).length - st.topicsFor(a).length; })[0]; var real = st.topicsFor(id).length; var orig = st.topicsFor.bind(st); if (real < 9) st.topicsFor = function(x){ var t = orig(x); var o = t.slice(); var k = 0; while (o.length < 9) { o.push({ id: 'x' + k, label: 'Pregunta de relleno número ' + (k + 1) + ' sobre lo que pasó anoche', seen: k % 2 }); k++; } return o; }; var T = new G.PlayModals.Talk(G.scene, id); G.scene.modals.push(T); window.__T = T; T.stage = 'menu'; T.openMenu(); return JSON.stringify({ id: id, real: real, items: T.menu.items.length, scroll: !!T.menu.arrows().down }); })()`));
  console.log('menú de charla', JSON.stringify(talk));
  await shot('3_charla_menu_arriba_o_inicio');
  await E(`(window.__T.menu.sel = 0, window.__T.menu.scroll = 0, 1)`); await shot('4_charla_menu_scroll_0');
  await E(`(window.__T.menu.sel = window.__T.menu.items.length - 1, 1)`); await b.wait(500); await shot('5_charla_menu_final');
  // (2b-C) «Mostrar una prueba…» con más de 9 pruebas, con «ya mostrada» en primera y última fila para ver si las flechas lo tapan
  const pk = JSON.parse(await E(`(function(){ var st = G.scene.st, T = window.__T, all = Object.keys(st.def.clues); st.clueOrder = all.slice(); T.openPicker(); all.forEach(function(c, i){ if (i < 2 || i >= all.length - 2) st.shown[T.id + ':' + c] = true; }); T.openPicker(); return JSON.stringify({ n: all.length, items: T.pick.items.length, arrows: Object.keys(T.pick.arrows()) }); })()`));
  console.log('selector de pruebas', JSON.stringify(pk));
  await shot('6_mostrar_prueba_inicio');
  await E(`(window.__T.pick.sel = 0, 1)`); await b.wait(300);
  await E(`(window.__T.pick.sel = window.__T.pick.items.length - 1, 1)`); await shot('7_mostrar_prueba_final');
  // FIX-6b (fallo 7): botones «Mostrar prueba» / «Volver» con la lista larga y con una corta
  await E(`(window.__T.pick.sel = 2, window.__T.openConfirm(window.__T.pick.items[2].id), 1)`); await b.wait(300); await shot('9_mostrar_prueba_botones_lista_larga');
  await E(`(function(){ var st = G.scene.st, T = window.__T; st.clueOrder = st.clueOrder.slice(0, 3); T.openPicker(); T.pick.sel = 0; T.openConfirm(T.pick.items[0].id); return 1; })()`); await b.wait(300); await shot('10_mostrar_prueba_botones_lista_corta');
  // (2b-B) Acusar: selector de motivo con una fila de 3 líneas (si el caso no la tiene, se usa un motivo largo)
  const mo = JSON.parse(await E(`(function(){ G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, 3); G.scene.modals.push(N); window.__N = N; var sol = G.scene.st.def.solution; var long = 'Quería quedarse con la receta secreta para abrir su propia pastelería en otra ciudad y que nadie descubriera nunca de dónde sacó la idea, además de vengarse del dueño por el despido de hace años'; sol.motives[0].text = long; N.openChooser('motive'); var m = N.chooser.menu, ctx = document.querySelector('canvas').getContext('2d'); var worst = 0; m.items.forEach(function(it){ var rw = it.right ? Math.ceil(G.ui.measure(ctx, it.right, 16, true)) + 12 : 0; var L = G.ui.textLayout(ctx, it.label, { size: 17, maxW: Math.max(40, m.o.w - (it.icon ? 46 : 16) - 12 - rw), maxH: (it.h || m.o.h) - 8, minSize: 11 }); worst = Math.max(worst, L.lines.length); }); return JSON.stringify({ items: m.items.length, maxLines: worst }); })()`));
  console.log('selector de motivo', JSON.stringify(mo));
  await shot('8_acusar_motivo');
  console.log('errores', JSON.stringify(b.logs)); b.close();
})();
