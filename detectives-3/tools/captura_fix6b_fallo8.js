// Capturas a ojo del fallo 8 de FIX-6b (acusación fallada visible en Acusar) en 844×390.
// Uso: node build.js && node tools/captura_fix6b_fallo8.js docs/capturas_fix6b
const { launch } = require('./cdp'), path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp/capturas_fix6b'; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await launch('file://' + path.join(__dirname, '..', 'dist', 'index.html'), { wait: 1800, w: 844, h: 390 }), E = (x) => b.eval(x);
  const shot = async (n) => { await b.wait(350); await b.shot(path.join(out, n + '.png')); console.log('captura', n + '.png'); };
  // caso generado con el motivo/método MÁS largo (peor caso para que quepa)
  const info = JSON.parse(await E(`(function(){ var best = null; for (var i = 1; i <= 120; i++) { var r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error) continue; var s = r.def.solution, L = 0; s.methods.concat(s.motives).forEach(function(m){ L = Math.max(L, m.text.length); }); if (!best || L > best.L) best = { id: r.def.id, L: L }; } return JSON.stringify(best); })()`));
  console.log('caso elegido', JSON.stringify(info));
  await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'${info.id}',diff:'normal',mode:'solo'}), 1)`); await b.wait(600);
  await E(`(G.scene.modals.length = 0, 1)`); await b.wait(200);
  const open = async () => { await E(`(function(){ G.scene.modals.length = 0; var N = new G.PlayModals.Notebook(G.scene, 3); G.scene.modals.push(N); window.__N = N; })()`); };
  await open(); await shot('11_acusar_sin_fallos');
  // un fallo: culpable equivocado con el resto bien (como pasa en la partida; el cuaderno se cierra y se vuelve a abrir)
  const f = JSON.parse(await E(`(function(){ var st = G.scene.st, sol = st.def.solution; st.gateOff = true; var inn = st.def.suspects.filter(function(s){ return s.id !== sol.culprit && !st.isCatSuspect(s); })[0]; var r = st.accuse({ culprit: inn.id, method: sol.method, motive: sol.motive, proof: sol.proof.slice(0, 3).filter(function(c){ return st.hasClue(c); }) }); st.gateOff = false; return JSON.stringify({ ok: r.ok, wrong: st.wrong, n: st.failedAccs.length, who: inn.name }); })()`));
  console.log('fallo', JSON.stringify(f));
  await open(); await shot('12_acusar_tras_fallo');
  await E(`(G.save.data.settings.bigText = true, 1)`); await shot('13_acusar_tras_fallo_texto_grande');
  await E(`(G.save.data.settings.bigText = false, 1)`);
  await E(`(function(){ var N = window.__N; N.sub = 'confirm'; N.confirm = new G.ui.Menu([{ label: 'Sí, ¡acusar!', icon: 'ico_star', color: G.ui.colors.accent }, { label: 'Seguir investigando', icon: 'ico_arrow' }], { x: 490, y: 320, w: 340, h: 46, gap: 8 }); })()`); await shot('14_confirmar_repeticion');
  await E(`(function(){ var N = window.__N; N.sub = 'slots'; var st = G.scene.st; var o = st.def.suspects.filter(function(s){ return s.id !== N.acc.culprit && !st.isCatSuspect(s); })[0]; N.acc.culprit = o.id; })()`); await b.wait(300); await shot('15_acusar_otra_persona_sin_aviso');
  await b.close && b.close();
})().catch((e) => { console.error(e); process.exit(1); });
