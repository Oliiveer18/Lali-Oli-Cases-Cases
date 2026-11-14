// Prueba en navegador de las escenas con aliado de policía (4C-3b-2): para una semilla de cada tipo de escena (exterior, comisaría, interrogatorio, reconstrucción) el caso GENERADO se juega con el motor real (index y artifact):
// el aliado está en su sala, se le puede hablar (3 temas sin efectos), el objeto de escena se dibuja, el coche y la mesa se animan y no hay errores. Con `--hoja` guarda capturas en /tmp/ally_<escena>.png. Uso: node build.js && node tools/ally_browser_test.js [--hoja]
const { launch } = require('./cdp'), path = require('path');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const KINDS = { exterior: 'police_car_0', comisaria: 'station_counter', interrogatorio: 'interrogation_table', reconstruccion: 'clue_board' }, seeds = {};
for (let s = 0; s < 400 && Object.keys(seeds).length < 4; s++) { const r = G.generateCase(s); if (!r.def || !r.def.npcs.aliado) continue; const rm = r.def.rooms[r.def.placement.aliado[0].room], p = rm.props.find((q) => /^poli_/.test(q.id)), k = Object.keys(KINDS).filter((x) => KINDS[x] === p.sprite)[0]; if (!seeds[k]) seeds[k] = s; }
(async () => {
  let bad = 0; const hoja = process.argv.indexOf('--hoja') >= 0;
  for (const file of ['index.html', 'artifact.html']) {
    for (const kind of Object.keys(KINDS)) {
      const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1500 }), E = (x) => b.eval(x);
      const ok0 = await E(`(function(){ var r = G.generateCase(${seeds[kind]}); if (!r.def) return 'sin caso'; var d = r.def; d.start.room = d.placement.aliado[0].room; var v = G.validateCase(d); if (!v.ok) return 'invalido ' + v.errors[0]; G.CASES['ally_${kind}'] = d; return 'ok'; })()`);
      if (ok0 !== 'ok') { console.log(`${file} · ${kind}: ${ok0} · FALLA`); bad++; b.close(); continue; }
      await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'ally_${kind}',diff:'normal',mode:'solo'}), 1)`);
      await E(`(function(){ window.__names = {}; var real = G.drawSpr; G.drawSpr = function (c, n) { window.__names[n] = 1; return real.apply(this, arguments); }; return 1; })()`);
      await E(`(G.scene.modals.length = 0, 1)`); await b.wait(1500); await E(`(G.scene.modals.length = 0, 1)`); await b.wait(2500);
      const r = JSON.parse(await E(`JSON.stringify((function(){ var w = G.scene.world, n = w.npcs && w.npcs.aliado, st = G.scene.st, out = n ? st.startTalk('aliado') : null, t = st.topicsFor('aliado'); return { here: !!n, name: n && st.def.npcs.aliado.name, topics: t.length, line: out && out.lines && out.lines[0] && (out.lines[0].text || out.lines[0]), names: Object.keys(window.__names).filter(function (x) { return /police_car|station_counter|interrogation_table|clue_board|cone/.test(x); }), errors: G.errors }; })())`));
      const names = r.names.join(','), want = KINDS[kind], anim = kind === 'exterior' ? /police_car_1/.test(names) && /police_car_0/.test(names) : kind === 'interrogatorio' ? /interrogation_table_(lit|dim)/.test(names) : true;
      const good = r.here && r.topics >= 3 && new RegExp(want.replace('police_car_0', 'police_car')).test(names) && anim && r.errors.length === 0;
      console.log(`${file} · ${kind} (semilla ${seeds[kind]}): aliado ${r.name} · ${r.topics} temas · dibujados ${names} · errores ${JSON.stringify(r.errors)} · ${good ? 'OK' : 'FALLA'}`);
      if (!good) bad++;
      if (hoja && file === 'index.html') await b.shot('/tmp/ally_' + kind + '.png');
      b.close();
    }
  }
  console.log(bad ? 'FALLOS: ' + bad : 'escenas con aliado en navegador OK');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
