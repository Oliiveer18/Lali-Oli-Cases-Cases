// Prueba en NAVEGADOR (FIX-3): selector de culpable (bloqueados con candado, sin gatos), corazones del HUD, fallo con ofensa y fin de partida.
// Uso: node build.js && node tools/accuse_browser_test.js   (capturas opcionales: SHOT=/carpeta/)
const { launch } = require('./cdp'), path = require('path');
(async () => {
  let bad = 0; const ok = (m, c) => { console.log((c ? 'OK · ' : 'FALLO · ') + m); if (!c) bad++; };
  for (const file of ['index.html', 'artifact.html']) {
    const b = await launch('file://' + path.join(__dirname, '..', 'dist', file), { wait: 1800 }), E = (x) => b.eval(x), shot = async (n) => { if (process.env.SHOT && file === 'index.html') await b.shot(path.join(process.env.SHOT, n + '.png')); };
    await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'solo'}), 1)`);
    await b.wait(500);
    await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300);
    const s0 = JSON.parse(await E(`JSON.stringify({ strikes: G.scene.st.diff.strikes, left: G.scene.st.strikesLeft(), n: G.scene.st.accuseList().length, locked: G.scene.st.accuseList().filter(x=>!x.ok).length, cats: G.scene.st.accuseList().filter(x=>G.scene.st.isCatSuspect(x.s)).length })`));
    ok(file + ': Fácil tiene 3 intentos y la lista de acusar no incluye gatos (' + JSON.stringify(s0) + ')', s0.strikes === 3 && s0.left === 3 && s0.cats === 0 && s0.n >= 1);
    await shot('hud_3_corazones');
    // cuaderno > Acusar > elegir culpable (hay bloqueados)
    await E(`(function(){ var N = new G.PlayModals.Notebook(G.scene, 3); G.scene.modals.push(N); N.openChooser('culprit'); window.__N = N; })()`);
    await b.wait(300); await shot('selector_culpable');
    const ch = JSON.parse(await E(`JSON.stringify(window.__N.chooser.menu.items.map(i=>({l:i.label,d:!!i.disabled,r:i.right||''})))`));
    ok(file + ': selector con bloqueados deshabilitados y candado (' + ch.map((x) => x.l + (x.d ? '🔒' : '')).join(', ') + ')', ch.length === s0.n && ch.filter((x) => x.d).length === s0.locked && ch.filter((x) => x.d).every((x) => x.r === '🔒'));
    // FIX-6a (tercio 2/3): los selectores de método, motivo y pruebas NO cortan la lista y sus textos caben (fuente real del navegador)
    for (const k of ['method', 'motive', 'proof']) {
      const rr = JSON.parse(await E(`(function(){ var N = window.__N, st = G.scene.st, sol = st.def.solution; N.openChooser('${k}'); var m = N.chooser.menu, ctx = G.ctx || document.querySelector('canvas').getContext('2d'); var want = '${k}' === 'proof' ? st.clueOrder.length + 1 : sol['${k}' === 'method' ? 'methods' : 'motives'].length; var bad = 0, worst = 0; m.items.forEach(function(it){ var rw = it.right ? Math.ceil(G.ui.measure(ctx, it.right, 16, true)) + 12 : 0; var tx = it.icon ? 46 : 16; var L = G.ui.textLayout(ctx, it.label, { size: 17, maxW: Math.max(40, m.o.w - tx - 12 - rw), maxH: (it.h || m.o.h) - 8, minSize: 11 }); if (L.truncated) bad++; worst = Math.max(worst, L.lines.length); }); return JSON.stringify({ n: m.items.length, want: want, view: !!m.o.view, truncated: bad, maxLines: worst }); })()`));
      ok(file + ': selector «' + k + '» sin cortar la lista y con los textos enteros ' + JSON.stringify(rr), rr.n === rr.want && rr.view && rr.truncated === 0);
    }
    await shot('selector_motivo');
    // FIX-6a (fallo 5, mitad 2): ahora es FALLO. Pestaña SOSPECHOSOS con la fuente REAL del navegador: ningún nombre recortado (ni pisa la descripción) en el caso 1 ni en 60 casos generados × 3 niveles × «Texto grande» sí/no
    const chk = (big) => `(function(){ G.save.data.settings.bigText = ${big}; var ctx = document.querySelector('canvas').getContext('2d'), tot = 0, over = [], descCut = 0; function card(list, def){ var cw = Math.min(200, (G.VW - 160) / list.length - 10); list.forEach(function(s){ tot++; var nm = G.ui.textLayout(ctx, s.name, { size: 17, bold: true, maxW: cw - 16, maxH: 52, minSize: 13, lineH: 22 }); var dy = Math.max(156, 128 + nm.h + 4); var ds = G.ui.textLayout(ctx, s.desc || '', { size: 14, maxW: cw - 24, lineH: 19, maxH: 246 - dy, minSize: 11 }); if (nm.truncated) over.push(s.name + ' (' + Math.round(cw) + ' px)'); if (ds.truncated) descCut++; }); } card(G.scene.st.boardOptions().suspects); for (var i = 1; i <= 60; i++) { var r = G.generateCase(i * 7919 + 1, { register: true }); if (r.error) continue; ['easy','normal','hard'].forEach(function(d){ card(new G.CaseState(JSON.parse(JSON.stringify(r.def)), d).boardOptions().suspects); }); } G.save.data.settings.bigText = false; return JSON.stringify({ tot: tot, over: over.slice(0, 6), nOver: over.length, descCut: descCut }); })()`;
    for (const big of [false, true]) {
      const sg = JSON.parse(await E(chk(big)));
      ok(file + ': pestaña Sospechosos' + (big ? ' con «Texto grande»' : '') + ' (fuente real): 0 nombres recortados y 0 descripciones recortadas en ' + sg.tot + ' tarjetas ' + JSON.stringify(sg), sg.tot > 100 && sg.nOver === 0 && sg.descCut === 0);
    }
    // acusar a alguien bloqueado: no cuenta fallo
    const r1 = JSON.parse(await E(`(function(){ var st=G.scene.st, L=st.accuseList().filter(x=>!x.ok); if(!L.length) return JSON.stringify({skip:true}); var r=st.accuse({culprit:L[0].s.id}); return JSON.stringify({blocked:!!r.blocked, left:st.strikesLeft(), wrong:st.wrong}); })()`));
    ok(file + ': acusar a un bloqueado no cuenta como fallo ' + JSON.stringify(r1), r1.skip || (r1.blocked && r1.left === 3 && r1.wrong === 0));
    // interrogar a un inocente y fallar
    const r2 = JSON.parse(await E(`(function(){ var st=G.scene.st, sol=st.def.solution; var inn=st.accuseList().map(x=>x.s).find(s=>s.id!==sol.culprit); st.npc[inn.id]=Object.assign(st.npc[inn.id]||{}, {talks:1}); window.__inn=inn.id; G.scene.modals.length=0; G.scene.onAccuse({culprit:inn.id, method:sol.methods[0].id, motive:sol.motives[0].id, proof:[]}); return JSON.stringify({left:st.strikesLeft(), wrong:st.wrong, off:st.isOffended(inn.id), modals:G.scene.modals.length}); })()`));
    await b.wait(400); await shot('fallo_comentario');
    ok(file + ': tras un fallo quedan 2 intentos, el acusado se ofende y salen los comentarios de Rex y Luna ' + JSON.stringify(r2), r2.left === 2 && r2.wrong === 1 && r2.off && r2.modals >= 1);
    await E(`(G.scene.modals.length = 0, 1)`); await b.wait(300); await shot('hud_2_corazones');
    // agotar los intentos
    await E(`(function(){ var st=G.scene.st, sol=st.def.solution; var L=st.accuseList().map(x=>x.s).filter(s=>s.id!==sol.culprit); for (var k=0;k<2;k++){ var s=L[k%L.length]; st.npc[s.id]=Object.assign(st.npc[s.id]||{}, {talks:1}); G.scene.modals.length=0; G.scene.onAccuse({culprit:s.id, method:sol.methods[0].id, motive:sol.motives[0].id, proof:[]}); } })()`);
    await b.wait(300);
    // avanzar los diálogos hasta que salga la pantalla de resultado
    let res = null;
    for (let i = 0; i < 40 && !res; i++) {
      res = JSON.parse(await E(`JSON.stringify((function(){ var M=G.scene.modals, m=M[M.length-1]; if (m instanceof G.PlayModals.Result) return { ok:m.ok, money:m.res&&m.res.money, stars:m.res&&m.res.stars, ended:G.scene.ended }; if (m && !(m instanceof G.PlayModals.Result)) m.update = function(){ return 'done'; }; return null; })())`));
      await b.wait(150);
    }
    await shot('fin_sin_intentos');
    ok(file + ': al agotar los intentos la partida termina sin recompensa ' + JSON.stringify(res), res && res.ok === false && res.stars === 0 && !(res.money > 0 && false));
    const errs = JSON.parse(await E('JSON.stringify(window.__errs||[])'));
    ok(file + ': sin errores en consola ' + JSON.stringify(errs), errs.length === 0);
    b.close();
  }
  console.log(bad ? '\n' + bad + ' fallo(s)' : '\nTodo en orden'); process.exit(bad ? 1 : 0);
})();
