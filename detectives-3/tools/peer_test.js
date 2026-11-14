// Prueba de la versión web pública: dos copias conectadas con un "PeerJS" simulado (misma API).
const http = require('http'), fs = require('fs'), path = require('path');
const { launch } = require('./cdp.js');
const harness = `<!doctype html><body style="margin:0;display:flex"><iframe id=a src=/index.html width=700 height=400 style="border:0"></iframe><iframe id=b src=/index.html width=700 height=400 style="border:0"></iframe>
<script>
const reg={};
function mkPeer(win){ return class Peer{ constructor(id){ this.id=id||('anon'+Math.random()); this.h={}; reg[this.id]=this; setTimeout(()=>this.emit('open'),20);} on(e,f){this.h[e]=f;} emit(e,a){this.h[e]&&this.h[e](a);} 
 connect(tid){ const t=reg[tid]; const mk=()=>({h:{},open:false,on(e,f){(this.h[e]=this.h[e]||[]).push(f)},emit(e,a){(this.h[e]||[]).forEach(function(f){f(a)})},send(m){ const o=this.other; setTimeout(()=>o.emit('data',JSON.parse(JSON.stringify(m))),5)},close(){ this.open=false; this.emit('close'); this.other.open=false; this.other.emit('close')}}); const c1=mk(), c2=mk(); c1.other=c2; c2.other=c1; setTimeout(()=>{ if(!t){c1.emit('error',{type:'peer-unavailable'});return;} c1.open=c2.open=true; t.emit('connection',c2); c2.emit('open'); c1.emit('open'); },30); return c1; }
 destroy(){ delete reg[this.id]; } reconnect(){} } }
for (const id of ['a','b']) { const f=document.getElementById(id); f.addEventListener('load',()=>{ f.contentWindow.Peer=mkPeer(f.contentWindow); }); }
</script>`;
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(q.url === '/' ? harness : fs.readFileSync(path.join(__dirname, '../dist/web/index.html'))); }).listen(0);
(async () => {
  const br = await launch('http://127.0.0.1:' + srv.address().port + '/', { w: 1400, h: 400, wait: 2500 });
  const A = (e) => br.eval(`(function(){var G=document.getElementById('a').contentWindow.G; return (${e})})()`);
  const B = (e) => br.eval(`(function(){var G=document.getElementById('b').contentWindow.G; return (${e})})()`);
  await A(`(G.save.data.settings.mode='online', G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('QWER',0), 1)`);
  await br.wait(300);
  await B(`(G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('QWER',1), 1)`);
  await br.wait(800);
  console.log('transporte', await A('G.net.transport'), '| A ve a B', await A('G.net.remoteHere'), '| B ve a A', await B('G.net.remoteHere'), '| lobby A', await A('G.scenes.lobby.state'), 'B', await B('G.scenes.lobby.state'), 'msg', await B('G.scenes.lobby.msg'));
  await A(`(G.scenes.lobby.starting=true, G.net.sendGo('tarta','easy',false), G.go(G.scenes.play,{caseId:'tarta',diff:'easy',mode:'online',me:0}), 1)`);
  await br.wait(900);
  console.log('B arranca solo', await B('G.scene===G.scenes.play'), 'me', await B('G.scene.world&&G.scene.world.human'));
  const skip = `(function(){var s=G.scene; while(s.modals&&s.modals.length) s.modals.pop(); return 1})()`;
  await A(skip); await B(skip);
  await A('(G.input.touch.mx=1, 1)'); await br.wait(900); await A('(G.input.touch.mx=0, 1)'); await br.wait(500);
  console.log('B ve a Oli en x', await B('Math.round(G.scene.world.players[0].x)'), 'real', await A('Math.round(G.scene.world.players[0].x)'));
  await A(`(function(){ var w=G.scene.world; var p=w.room.props.find(function(q){return q.steps&&q.steps[0]&&q.steps[0].clue&&(!q.steps[0].tool||q.steps[0].tool==='lupa')}); w.completeStep(p,p.steps[0],w.players[0]); return 1 })()`);
  await br.wait(1000);
  console.log('pistas A', await A('G.scene.st.clueCount()'), 'B', await B('G.scene.st.clueCount()'));
  await B('(G.net.leave(), 1)'); await br.wait(7500);
  console.log('A: IA al mando', await A('G.scene.world.aiTakeover'), '| logs', br.logs.slice(0, 3));
  br.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
