// Prueba en NAVEGADOR (MP): el botón «Cargar código de caso» del menú registra el caso generado y queda jugable (sin esperar al caso 1); códigos malos no registran nada.
const { launch } = require('./cdp');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const f of ['dist/index.html', 'dist/web/index.html', 'dist/artifact.html']) {
    const b = await launch('file://' + require('path').join(__dirname, '..', f), { wait: 2200 }), E = (x) => b.eval(x), tag = f.replace('dist/', '');
    await E(`(function(){ var sc=G.scenes.hub; G.go(sc); window.__sc=sc; })()`); await b.wait(400);
    const pick = async (code) => { await E(`(function(){ var sc=window.__sc; sc.setState('main'); window.prompt=function(){return ${JSON.stringify(code)};}; var i=sc.menu.items.findIndex(function(x){return x.id==='loadcode';}); var o=sc.menu.update; sc.menu.update=function(){ sc.menu.update=o; return {chosen:i}; }; })()`); await b.wait(300); };
    const keys0 = JSON.parse(await E('JSON.stringify(Object.keys(G.CASES))'));
    await pick('hola'); await pick('G9-2djn');
    ok(tag + ': códigos malos no registran nada', JSON.stringify(JSON.parse(await E('JSON.stringify(Object.keys(G.CASES))'))) === JSON.stringify(keys0));
    await pick('g6-2DJN');
    const r = JSON.parse(await E(`JSON.stringify({ keys:Object.keys(G.CASES), st:window.__sc.state, un:(function(){var d=G.CASES.gen_g6_2djn; return d? window.__sc.unlocked(d):null;})(), t:(G.CASES.gen_g6_2djn||{}).title, err:G.errors })`));
    ok(tag + ': el código G6-2djn registra el caso, pasa a «Elegir caso» y está desbloqueado (' + r.t + ')', r.keys.length === keys0.length + 1 && r.st === 'cases' && r.un === true && !r.err.length);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})();
