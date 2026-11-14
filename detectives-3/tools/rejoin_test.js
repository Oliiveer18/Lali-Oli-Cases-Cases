// Prueba: el invitado se re-enlaza solo cuando el anfitrión cae y vuelve (PeerJS simulado con id "ocupado" un rato).
const http = require('http'), fs = require('fs'), path = require('path');
const { launch } = require('./cdp.js');
const harness = fs.readFileSync(path.join(__dirname, 'peer_test.js'), 'utf8').match(/const harness = `([\s\S]*?)`;/)[1]
  .replace("constructor(id){ this.id=id||('anon'+Math.random()); this.h={}; reg[this.id]=this; setTimeout(()=>this.emit('open'),20);}",
           "constructor(id){ this.id=id||('anon'+Math.random()); this.h={}; if(id&&reg[id]&&reg[id].zombie>Date.now()){ setTimeout(()=>this.emit('error',{type:'unavailable-id'}),20); return;} reg[this.id]=this; setTimeout(()=>this.emit('open'),20);}");
const srv = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(q.url === '/' ? harness : fs.readFileSync(path.join(__dirname, '../dist/web/index.html'))); }).listen(0);
(async () => {
  const br = await launch('http://127.0.0.1:' + srv.address().port + '/', { w: 1400, h: 400, wait: 2500 });
  const A = (e) => br.eval(`(function(){var G=document.getElementById('a').contentWindow.G; return (${e})})()`);
  const B = (e) => br.eval(`(function(){var G=document.getElementById('b').contentWindow.G; return (${e})})()`);
  await A(`(G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('RJ01',0), 1)`); await br.wait(300);
  await B(`(G.go(G.scenes.lobby,{caseId:'tarta',diff:'easy'}), G.scenes.lobby.open('RJ01',1), 1)`); await br.wait(800);
  console.log('conectados', await A('G.net.remoteHere'), await B('G.net.remoteHere'));
  // el anfitrión se cae: su id queda "ocupado" 5 s
  await br.eval(`(function(){var w=document.getElementById('a').contentWindow; var P=w.Peer; var r=Object.keys(window.reg||{}); return 1})()`);
  await A('(G.net._conn && G.net._conn.close(), 1)'); await br.wait(300);
  console.log('tras caída: B ve a A', await B('G.net.remoteHere'));
  await A('(G.net.leave(), 1)');
  await A(`(G.scenes.lobby.open('RJ01',0), 1)`);
  await br.wait(9000);
  console.log('A reenlazado', await A('G.net.remoteHere'), '| B reenlazado', await B('G.net.remoteHere'), '| logs', br.logs.slice(0, 3));
  br.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
