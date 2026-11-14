// Capturas a ojo del Informe del caso (A3 INTRO-1, parte 2/3) en 844×390.
// Uso: node build.js && node tools/captura_intro.js docs/capturas_intro
const { launch } = require('./cdp'), path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/capturas_intro'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 1800, w: 844, h: 390 }), E = (x) => b.eval(x);
  const shot = async (n) => { await b.wait(450); await b.shot(path.join(out, n + '.png')); console.log('captura', n + '.png'); };
  // caso generado con la sinopsis MÁS larga (peor caso)
  const info = JSON.parse(await E(`(function(){ var best = null; for (var i = 1; i <= 120; i++) { var r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error) continue; var L = r.def.blurb.length + r.def.title.length; if (!best || L > best.L) best = { id: r.def.id, L: L, n: r.def.suspects.length }; } return JSON.stringify(best); })()`));
  console.log('caso largo', JSON.stringify(info));
  const start = async (id, diff) => { await E(`(G.save.data.settings.seenHelp = true, G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'${id}',diff:'${diff}',mode:'solo'}), 1)`); await b.wait(700); await b.key('Enter', 80); await b.wait(400); };
  await start('tarta', 'normal'); await shot('1_informe_caso1_normal');
  await E(`(G.save.data.settings.bigText = true, 1)`); await shot('2_informe_caso1_texto_grande'); await E(`(G.save.data.settings.bigText = false, 1)`);
  await start(info.id, 'hard'); await shot('3_informe_largo_dificil');
  await E(`(G.save.data.settings.bigText = true, 1)`); await shot('4_informe_largo_dificil_texto_grande'); await E(`(G.save.data.settings.bigText = false, 1)`);
  await start(info.id, 'easy'); await shot('5_informe_largo_facil');
  await E(`(function(){ G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, 4); G.scene.modals.push(N); })()`); await shot('6_cuaderno_caso');
  await E(`(G.save.data.settings.bigText = true, 1)`); await shot('7_cuaderno_caso_texto_grande'); await E(`(G.save.data.settings.bigText = false, 1)`);
  await E(`(function(){ G.scene.modals.length = 0; G.scene.modals.push(new G.PlayModals.Pause(G.scene)); })()`); await shot('8_pausa');
  await b.close && b.close();
})().catch((e) => { console.error(e); process.exit(1); });
