// Prueba del sigilo del callejón: Lali graba a Baguette esperando a que no mire (Normal y Difícil).
const { launch } = require('./cdp');
(async () => {
  for (const diff of ['normal', 'hard']) {
    const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 1800 });
    const E = (x) => b.eval(x);
    await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'tarta',diff:'${diff}',mode:'solo'}), 1)`);
    await E(`(function(){var s=G.scene; s.modals.length=0; var st=s.st,w=s.world; ['gancho_vacio','sacos_cambiados','glaseado_salado','vitrina_vacia','nota_cierre'].forEach(function(c){st.addClue(c,'t')}); st.setFlag('talked_merengue'); st.setFlag('talked_pimienta'); st.checkAdvance(); s.modals.length=0; w.swapSolo(); w.enterRoom('callejon','puerta_trasera'); w.onChapter(); s.trans=null; var p=w.players[1]; p.x=21.5*48; p.y=6*48; w.snapCamera(); return st.chapter })()`);
    await b.wait(600);
    console.log(diff, 'baguette en', await E(`JSON.stringify([G.scene.world.npcs.baguette.room, G.scene.world.npcs.baguette.x|0])`), 'foco', await E(`JSON.stringify(G.scene.world.players[1].focus && G.scene.world.players[1].focus.verb)`));
    let ok = false, tries = 0;
    for (let i = 0; i < 400 && !ok; i++) {
      const r = await E(`(function(){G.scene.modals.length=0; var w=G.scene.world,st=G.scene.st,n=w.npcs.baguette,hard=st.diff.id==='hard',per=hard?6.0:6.5,look=hard?2.0:1.7; var ph=(w.time+2)%per, left=per-look-ph; var p=w.players[1]; if(st.hasClue('grabacion_baguette')) return 'DONE'; if(!p.work && !n.watching && left>3.4){ w.interact(p); return 'go'} return 'wait'})()`);
      if (r === 'go') tries++;
      if (r === 'DONE') ok = true;
      await b.wait(100);
    }
    console.log(diff, 'grabación conseguida:', ok, 'intentos', tries, 'errores', await E('JSON.stringify(G.errors)'));
    b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });

// 4C-2b-2: un caso GENERADO con vigilante, en el navegador: la IA del compañero espera la ventana segura y consigue la pista sin que la vean (Normal y Difícil).
(async () => {
  for (const diff of ['normal', 'hard']) {
    const b = await launch('file://' + require('path').join(__dirname, '..', 'dist', 'index.html'), { wait: 1800 });
    const E = (x) => b.eval(x);
    const seed = await E(`(function(){for(var s=1;s<3000;s+=7){var r=G.generateCase(s);if(r.def&&Object.values(r.def.rooms).some(function(rm){return rm.props.some(function(p){return p.watcher})})){G.CASES.gen_sigilo=r.def;return s}}return -1})()`);
    await E(`(G.save.data.settings.mode='solo', G.go(G.scenes.play,{caseId:'gen_sigilo',diff:'${diff}',mode:'solo'}), 1)`);
    await b.wait(600);
    await E(`(function(){var s=G.scene,w=s.world; s.modals.length=0; var rn=Object.keys(w.st.def.rooms).find(function(k){return w.st.def.rooms[k].props.some(function(p){return p.watcher})}); w.enterRoom(rn); window.__sp=0; var op=w.out.push.bind(w.out); w.out.push=function(e){if(e&&e.t==='spotted')window.__sp++; return op(e)}; var prop=w.room.props.find(function(p){return p.watcher}); var ai=w.players[1-w.human]; ai.x=(prop.x+0.5)*G.TS; ai.y=(prop.y+2)*G.TS; w.dispatch(ai,{kind:'prop',p:prop,step:prop.steps[0]}); window.__clue=prop.steps[0].clue; return 1})()`);
    let ok = false;
    for (let i = 0; i < 300 && !ok; i++) { ok = await E(`!!G.scene.st.hasClue(window.__clue)`); await b.wait(100); }
    console.log(diff, 'caso generado (semilla ' + seed + '): la IA consigue la pista:', ok, '· veces vista:', await E('window.__sp'), '· errores', await E('JSON.stringify(G.errors)'));
    if (!ok || (await E('window.__sp')) !== 0) process.exitCode = 1;
    b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
