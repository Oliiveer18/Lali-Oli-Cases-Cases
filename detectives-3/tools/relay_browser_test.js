// Prueba en navegador: el camino directo (PeerJS) queda BLOQUEADO (como en 4G/5G con NAT estricto) y el juego debe enlazar y sincronizar por el relé de respaldo.
const http = require('http'), fs = require('fs'), path = require('path');
const { launch } = require('./cdp.js');
const { broker, available } = require('./mqtt_broker.js');
if (!available) { console.log('SALTADO: falta el módulo ws'); process.exit(0); }
const harness = `<!doctype html><body style="margin:0;display:flex"><iframe id=a src=/index.html width=700 height=400 style="border:0"></iframe><iframe id=b src=/index.html width=700 height=400 style="border:0"></iframe>
<script>
function mkPeer(){ return class Peer{ constructor(id){ this.id=id||('anon'+Math.random()); this.h={}; setTimeout(()=>this.emit('open'),20);} on(e,f){this.h[e]=f;} emit(e,a){this.h[e]&&this.h[e](a);}
 connect(){ const c={h:{},open:false,on(e,f){(this.h[e]=this.h[e]||[]).push(f)},send(){},close(){}}; return c; } destroy(){} reconnect(){} } }
for (const id of ['a','b']) { const f=document.getElementById(id); f.addEventListener('load',()=>{ f.contentWindow.Peer=mkPeer(); }); }
</script>`;
const b1 = broker(), b2 = broker();
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(q.url === '/' ? harness : fs.readFileSync(path.join(__dirname, '../dist/web/index.html'))); }).listen(0);
(async () => {
  const br = await launch('http://127.0.0.1:' + srv.address().port + '/', { w: 1400, h: 400, wait: 2500 });
  const A = (e) => br.eval(`(function(){var G=document.getElementById('a').contentWindow.G; return (${e})})()`);
  const B = (e) => br.eval(`(function(){var G=document.getElementById('b').contentWindow.G; return (${e})})()`);
  const urls = JSON.stringify(['ws://127.0.0.1:' + b1.port, 'ws://127.0.0.1:' + b2.port]);
  await A(`(G.RELAY_URLS=${urls}, G.save.data.settings.mode='online', G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('QWERT',0), 1)`);
  await br.wait(500);
  await B(`(G.RELAY_URLS=${urls}, G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('QWERT',1), 1)`);
  await br.wait(2500);
  console.log('enlace A', await A('G.net.linkMode()'), 'B', await B('G.net.linkMode()'), '| A ve a B', await A('G.net.remoteHere'), '| B ve a A', await B('G.net.remoteHere'), '| lobby A', await A('G.scenes.lobby.state'), 'B', await B('G.scenes.lobby.state'));
  await A(`(G.scenes.lobby.starting=true, G.net.sendGo('tarta','easy',false), G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'online',me:0}), 1)`);
  await br.wait(2500);
  console.log('B arranca solo', await B('G.scene===G.scenes.play'), 'me', await B('G.scene.world&&G.scene.world.human'));
  const skip = `(function(){var s=G.scene; while(s.modals&&s.modals.length) s.modals.pop(); return 1})()`;
  await A(skip); await B(skip);
  await A('(G.input.touch.mx=1, 1)'); await br.wait(900); await A('(G.input.touch.mx=0, 1)'); await br.wait(900);
  console.log('B ve a Oli en x', await B('Math.round(G.scene.world.players[0].x)'), 'real', await A('Math.round(G.scene.world.players[0].x)'));
  await A(`(function(){ var w=G.scene.world; var p=w.room.props.find(function(q){return q.steps&&q.steps[0]&&q.steps[0].clue&&(!q.steps[0].tool||q.steps[0].tool==='lupa')}); w.completeStep(p,p.steps[0],w.players[0]); return 1 })()`);
  await br.wait(2500);
  console.log('pistas A', await A('G.scene.st.clueCount()'), 'B', await B('G.scene.st.clueCount()'));
  console.log('logs', br.logs.slice(0, 3));
  br.close(); srv.close(); b1.kill(); b2.kill(); process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
