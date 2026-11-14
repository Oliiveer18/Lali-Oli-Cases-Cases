// mqtt_broker.js — broker MQTT 3.1.1 mínimo por WebSocket, SOLO para pruebas (test_relay.js, tools/relay_browser_test.js). Necesita el módulo ws.
let WSS; try { WSS = require('ws').WebSocketServer; } catch (e) { try { WSS = require('/tmp/wst/node_modules/ws').WebSocketServer; } catch (e2) { WSS = null; } }
function broker() {
  const subs = new Set(); const wss = new WSS({ port: 0, handleProtocols: (p) => (p.has('mqtt') ? 'mqtt' : false) });
  wss.on('connection', (ws) => {
    const me = { ws, topics: [] }; subs.add(me); let buf = Buffer.alloc(0);
    ws.on('message', (d) => {
      buf = Buffer.concat([buf, Buffer.from(d)]);
      for (;;) {
        if (buf.length < 2) return; let mult = 1, rem = 0, i = 1, b;
        do { if (i >= buf.length) return; b = buf[i++]; rem += (b & 127) * mult; mult *= 128; } while ((b & 128) && i < 5);
        if (buf.length < i + rem) return;
        const first = buf[0], body = buf.subarray(i, i + rem), full = buf.subarray(0, i + rem); buf = buf.subarray(i + rem);
        const type = first >> 4;
        if (type === 1) ws.send(Buffer.from([0x20, 2, 0, 0]));
        else if (type === 8) { const tl = (body[2] << 8) | body[3]; me.topics.push(body.subarray(4, 4 + tl).toString()); ws.send(Buffer.from([0x90, 3, body[0], body[1], 0])); }
        else if (type === 12) ws.send(Buffer.from([0xd0, 0]));
        else if (type === 3) { const tl = (body[0] << 8) | body[1], t = body.subarray(2, 2 + tl).toString(); subs.forEach((s) => { if (s.topics.includes(t)) s.ws.send(Buffer.from(full)); }); }
      }
    });
    ws.on('close', () => subs.delete(me));
  });
  return { wss, port: wss.address().port, kill: () => { wss.clients.forEach((c) => c.terminate()); wss.close(); } };
}
module.exports = { broker, available: !!WSS };
