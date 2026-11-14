// Prueba de la capa online: dos copias del juego en iframes conectadas por una sala simulada (misma API que "room").
const http = require('http'), fs = require('fs'), path = require('path');
const { launch } = require('./cdp.js');
const SCR = require('os').tmpdir() + '/';
const harness = `<!doctype html><body style="margin:0;background:#000;display:flex"><iframe id=a src=/index.html width=800 height=450 style="border:0"></iframe><iframe id=b src=/index.html width=800 height=450 style="border:0"></iframe>
<script>
const rooms={};
function mkShim(win,name){ let peerId=name; return { use: async (n)=> n==='room'? { join: async (rn)=>{ const R=rooms[rn]=rooms[rn]||{members:[]}; const me={id:peerId,pres:{},ch:[]}; R.members.push(me);
 const peersFor=(viewer)=>R.members.map(m=>({peer:m.id,isMe:m===viewer,presence:Object.freeze(Object.assign({},m.pres)),updatedAt:Date.now()}));
 const notify=()=>R.members.forEach(m=>m.ch.forEach(f=>f({peers:peersFor(m),joined:[],left:[],updated:[]})));
 return { presence: async(p)=>{ Object.keys(p).forEach(k=>{ if(p[k]===null) delete me.pres[k]; else me.pres[k]=p[k]; }); notify(); }, peers:()=>peersFor(me), onPeers:(f)=>{me.ch.push(f); return ()=>{}}, onConnection:(f)=>{f(true);return ()=>{}}, connected:()=>true, leave: async()=>{ R.members=R.members.filter(m=>m!==me); notify(); } }; } } : null }; }
for (const id of ['a','b']) { const f=document.getElementById(id); f.addEventListener('load',()=>{ f.contentWindow.claude=mkShim(f.contentWindow,id); }); }
</script>`;
const srv = http.createServer((q, r) => { if (q.url === '/') { r.setHeader('content-type', 'text/html'); r.end(harness); } else { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync(path.join(__dirname, '../dist/index.html'))); } }).listen(0);
(async () => {
  const port = srv.address().port;
  const br = await launch('http://127.0.0.1:' + port + '/', { w: 1600, h: 450, wait: 2500 });
  const A = (e) => br.eval(`(function(){var G=document.getElementById('a').contentWindow.G; return (${e})})()`);
  const B = (e) => br.eval(`(function(){var G=document.getElementById('b').contentWindow.G; return (${e})})()`);
  const caseId = await A("Object.keys(G.CASES)[0]");
  console.log('case', caseId);
  await A(`(G.save.data.settings.mode='online', G.go(G.scenes.lobby,{caseId:'${caseId}',diff:'easy'}), G.scenes.lobby.open('ABCD',0), 1)`);
  await B(`(G.save.data.settings.mode='online', G.go(G.scenes.lobby,{caseId:'${caseId}',diff:'easy'}), G.scenes.lobby.open('ABCD',1), 1)`);
  await br.wait(600);
  console.log('A remoteHere', await A('G.net.remoteHere'), 'B remoteHere', await B('G.net.remoteHere'), 'A state', await A('G.scenes.lobby.state'));
  // host empieza
  await A(`(G.scenes.lobby.starting=true, G.net.sendGo('${caseId}','easy'), G.go(G.scenes.play,{caseId:'${caseId}',diff:'easy',mode:'online',me:0}), 1)`);
  await br.wait(800);
  console.log('B scene is play?', await B('G.scene===G.scenes.play'), 'B me', await B('G.scene.world && G.scene.world.human'));
  // saltar ventanas
  const skip = `(function(){ var s=G.scene; var n=0; while(s.modals && s.modals.length && n++<30){ s.modals.pop(); } return n })()`;
  await A(skip); await B(skip);
  // mover A con el joystick virtual
  await A('(G.input.touch.mx=1, G.input.touch.my=0, 1)');
  await br.wait(900);
  await A('(G.input.touch.mx=0, 1)');
  await br.wait(400);
  console.log('A rex x', await A('Math.round(G.scene.world.players[0].x)'), ' B ve a rex en', await B('Math.round(G.scene.world.players[0].x)'), 'hidden', await B('G.scene.world.players[0].hidden'));
  // A completa un paso: busca la primera pista sin herramienta
  const r = await A(`(function(){ var w=G.scene.world, st=G.scene.st; var p=w.room.props.find(function(q){return q.steps && q.steps[0] && q.steps[0].clue && (!q.steps[0].tool||q.steps[0].tool==='lupa'||q.steps[0].tool==='coop')}); if(!p) return 'none'; w.completeStep(p,p.steps[0],w.players[0]); return p.id+' '+p.steps[0].clue })()`);
  await br.wait(1200);
  console.log('A completó', r, '| pistas A', await A('G.scene.st.clueCount()'), 'B', await B('G.scene.st.clueCount()'));
  console.log('presence size A', await A('JSON.stringify(Object.assign({}, G.net.nr && 0)).length'), 'state bytes', await A('JSON.stringify(G.net.packState(G.scene.st)).length'));
  // ---- desconexión de B: la IA debe ocupar su lugar en A
  await B('(G.net.leave(), 1)');
  await br.wait(7500);
  for (let i = 0; i < 12 && !(await A('G.scene.world.aiTakeover')); i++) await br.wait(1000); // bajo carga la IA tarda más en tomar el relevo: se espera hasta 12 s más
  console.log('tras caída: A aiTakeover', await A('G.scene.world.aiTakeover'), 'ctrl compañero', await A('G.scene.world.players[1].ctrl'));
  await A('(G.input.touch.mx=-1, 1)'); await br.wait(1500); await A('(G.input.touch.mx=0, 1)'); await br.wait(1500);
  console.log('IA sigue a Oli: dist', await A('Math.round(Math.hypot(G.scene.world.players[0].x-G.scene.world.players[1].x, G.scene.world.players[0].y-G.scene.world.players[1].y))'));
  // A consigue otra pista mientras B está fuera
  await A(`(function(){ var st=G.scene.st; st.addClue('gancho_vacio','t'); return 1 })()`);
  await br.wait(800);
  // ---- B vuelve (página nueva simulada)
  await B(`(G.net.goSeen=0, G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('ABCD',1), 1)`);
  await br.wait(1500);
  await B(skip);
  await br.wait(1500);
  console.log('tras vuelta: B en juego', await B('G.scene===G.scenes.play'), 'me', await B('G.scene.world&&G.scene.world.human'), 'A aiTakeover', await A('G.scene.world.aiTakeover'), 'pistas A', await A('G.scene.st.clueCount()'), 'B', await B('G.scene.st.clueCount()'));
  // ---- guardado online: los dos guardan, salen y continúan con otro código
  await A('(G.scene.autosave(), 1)'); await B('(G.scene.autosave(), 1)');
  console.log('run guardado A', await A('G.save.data.run && G.save.data.run.mode'), 'pistas guardadas', await A('G.save.data.run.snap.clueOrder.length'));
  await A('(G.net.leave(), 1)'); await B('(G.net.leave(), 1)');
  await A(`(G.net.goSeen=0, G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy',resume:G.save.data.run}), G.scenes.lobby.open('WXYZ',0), 1)`);
  await B(`(G.net.goSeen=0, G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('WXYZ',1), 1)`);
  await br.wait(800);
  await A(`(G.scenes.lobby.starting=true, G.net.sendGo('tarta','easy',true), G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'online',me:0,resume:G.scenes.lobby.a.resume}), 1)`);
  await br.wait(1000);
  console.log('continuar: A pistas', await A('G.scene.st.clueCount()'), 'B pistas', await B('G.scene.st.clueCount()'), 'B en juego', await B('G.scene===G.scenes.play'));
  await br.shot(SCR + 'online_test.png');
  console.log('logs', br.logs.slice(0, 5));
  br.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
