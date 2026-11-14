// Prueba en NAVEGADOR: «Elegir caso» trae los 3 casos de prueba (★ PRUEBA) con su dificultad fija; al elegirlos entran directo a jugar con ella, sin pantalla de dificultad ni código.
const { launch } = require('./cdp');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  const WANT = [['gen_g6_3wje', 'easy', 'Fácil'], ['gen_g6_2prl', 'normal', 'Normal'], ['gen_g6_95yj', 'hard', 'Difícil']];
  for (const f of ['dist/index.html', 'dist/web/index.html', 'dist/artifact.html']) {
    const b = await launch('file://' + require('path').join(__dirname, '..', f), { wait: 2200 }), E = (x) => b.eval(x), tag = f.replace('dist/', '');
    await E(`(function(){ var sc=G.scenes.hub; G.go(sc); window.__sc=sc; sc.setState('cases'); })()`); await b.wait(400);
    const items = JSON.parse(await E(`JSON.stringify(window.__sc.menu.items.map(function(x){return {id:x.id,label:x.label,sub:x.sub||'',disabled:!!x.disabled};}))`));
    for (const [id, df, nm] of WANT) {
      const it = items.find((x) => x.id === id);
      ok(tag + ': ' + id + ' sale en el menú, desbloqueado, rotulado «★ PRUEBA ' + nm + '»', !!it && !it.disabled && it.label.indexOf('★ PRUEBA ' + nm) === 0 && it.sub.indexOf(nm) > 0);
    }
    ok(tag + ': los 3 de prueba van antes del caso principal', items.findIndex((x) => /^PRINCIPAL/.test(x.label)) > 2);
    for (const [id, df] of WANT) {
      await E(`(function(){ var sc=window.__sc; sc.setState('cases'); window.__go=null; var og=G.go; G.go=function(s,a){ window.__go={scene:s===G.scenes.play?'play':(s===G.scenes.lobby?'lobby':'otra'),args:a}; G.go=og; }; var i=sc.menu.items.findIndex(function(x){return x.id==='${id}';}); var o=sc.menu.update; sc.menu.update=function(){ sc.menu.update=o; return {chosen:i}; }; sc.update&&sc.update(0.016); })()`); await b.wait(300);
      const r = JSON.parse(await E('JSON.stringify(window.__go)'));
      ok(tag + ': ' + id + ' entra directo a jugar en ' + df + ' (sin pantalla de dificultad)', !!r && r.scene === 'play' && r.args.caseId === id && r.args.diff === df && r.args.mode === 'solo');
    }
    const errs = JSON.parse(await E('JSON.stringify(window.__errs||[])'));
    ok(tag + ': sin errores', errs.length === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})();
