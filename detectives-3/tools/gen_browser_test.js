// Prueba en NAVEGADOR (v0.7.21): el generador de casos y la huella viajan dentro del juego y funcionan sin errores,
// el caso 1 sigue siendo el único caso del menú (generar no registra nada) y el vigilante/avisos salen de los datos.
const { launch } = require('./cdp');
(async () => {
  for (const f of ['dist/index.html', 'dist/artifact.html']) {
    const b = await launch('file://' + require('path').join(__dirname, '..', f), { wait: 2200 });
    const E = (x) => b.eval(x);
    const tag = f.replace('dist/', '').replace('.html', '');
    console.log(tag, 'escena:', await E('G.scene && G.scene.constructor.name'), '· errores:', await E('JSON.stringify(G.errors)'));
    console.log(tag, 'módulos:', await E(`JSON.stringify([typeof G.generateCase, typeof G.checkBible, typeof G.genTruth, typeof G.genClues, typeof G.compileBible, typeof G.caseFingerprint, typeof G.watchConfig, typeof G.bot, typeof G.qualityCase, typeof G.caseReport])`));
    console.log(tag, 'GEN_VERSION', await E('G.GEN_VERSION'));
    const r = await E(`(function(){ var out=[]; for (var s=1;s<=25;s++){ var g=G.generateCase(s); if(!g.def){out.push('fallo '+s);continue;} var v=G.validateCase(g.def); if(!v.ok) out.push('invalido '+s); var f=G.caseFingerprint(g.def,g.bible); if(!f||!f.key) out.push('huella '+s); } return JSON.stringify(out); })()`);
    console.log(tag, 'generar 25 casos y su huella en el navegador, problemas:', r);
    console.log(tag, 'casos en el menú:', await E('JSON.stringify(Object.keys(G.CASES))'));
    console.log(tag, 'caso 1 válido:', await E('G.validateCase(G.CASES.tarta).ok && G.validateCase(G.CASES.tarta).warnings.length === 0'));
    console.log(tag, 'texto de la puerta:', await E('G.autoDoorText(G.CASES.tarta.rooms.cocina.doors.find(function(d){return d.id==="puerta_trasera"}))'));
    console.log(tag, 'logs', JSON.stringify(b.logs));
    b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
