// test_relay.js — prueba del relé de respaldo (src/relay.js) con brokers MQTT simulados por WebSocket (sin internet).
// Necesita el módulo «ws» solo para el broker de prueba: si no está, se salta con aviso (exit 0).
const { available } = require("./tools/mqtt_broker.js"); if (!available) { console.log("SALTADO: falta el módulo ws (npm i ws)"); process.exit(0); }
const assert = require('assert');
const { broker } = require('./tools/mqtt_broker.js');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  global.window = global; global.G = {};
  require('./src/relay.js');
  const b1 = broker(), b2 = broker();
  G.RELAY_URLS = ['ws://127.0.0.1:' + b1.port, 'ws://127.0.0.1:' + b2.port];
  const mk = (me) => { const got = []; const st = { n: 0 }; const r = G.relay.open('ABCDE', me, { snapshot: () => ({ who: me, st: 1 }), onMsg: (m) => got.push(m), onLive: (b) => { st.live = b; }, onBroker: () => {}, active: () => true }); return { r, got, st }; };
  const A = mk(0), B = mk(1);
  await wait(800);
  assert(A.r.brokers === 2 && B.r.brokers === 2, 'los dos conectan a los dos brokers');
  assert(A.st.live && B.st.live, 'ambos se oyen (hi/respuesta)');
  assert(B.got.some((m) => m.d && m.d.who === 0), 'B recibió el estado completo de A');
  A.r.patch({ x: 10 }); A.r.patch({ y: 20 }); await wait(400);
  const pm = B.got.filter((m) => m.d && m.d.x === 10);
  assert(pm.length === 1 && pm[0].d.y === 20, 'parches agrupados y SIN duplicados aunque lleguen por 2 brokers (' + pm.length + ')');
  B.r.patch({ z: 5 }); await wait(400);
  assert(A.got.some((m) => m.d && m.d.z === 5), 'A recibe de B');
  b1.kill(); await wait(500);
  assert(A.r.brokers === 1, 'cae un broker y queda 1 (' + A.r.brokers + ')');
  A.r.patch({ w: 7 }); await wait(400);
  assert(B.got.some((m) => m.d && m.d.w === 7), 'sigue funcionando con un solo broker');
  A.r.close(); await wait(300);
  assert(B.st.live === false, 'B se entera del bye');
  B.r.close(); b2.kill();
  console.log('test_relay OK'); process.exit(0);
})().catch((e) => { console.error('FALLO', e.message); process.exit(1); });
