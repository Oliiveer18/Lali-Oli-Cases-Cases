// relay.js — respaldo de conexión online (v0.7.39): relé por servidores públicos.
// El camino directo (WebRTC/PeerJS) falla en algunas redes móviles (NAT estricto, 4G/5G de cada operadora). Este respaldo NO depende
// de la red de cada móvil: cada móvil abre una conexión WebSocket SEGURA (wss, puerto 443/8084/8884/8081, que casi ninguna red bloquea)
// con varios brokers MQTT públicos y gratuitos, y los mensajes pasan por ellos. Va en paralelo al directo: si el directo conecta se usa
// el directo; si no, o si se cae, el juego sigue por aquí sin cortes.
// Cliente MQTT 3.1.1 mínimo escrito a mano (sin librerías ni CDN): CONNECT, SUBSCRIBE, PUBLISH (QoS 0), PINGREQ.
// Cada móvil publica en .../<sala>/<su papel> y escucha en .../<sala>/<el otro papel>. Se conecta a TODOS los brokers a la vez y publica
// por todos los que estén vivos; el receptor descarta duplicados (s = sesión, n = nº de mensaje).
(function (root) {
  'use strict';
  const G = root.G;
  const R = (G.relay = {});
  // wss: broker.hivemq.com:8884, broker.emqx.io:8084, test.mosquitto.org:8081, mqtt.eclipseprojects.io:443 (comprobados en sus páginas oficiales; G.RELAY_URLS los sustituye)
  R.URLS = [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081/',
    'wss://mqtt.eclipseprojects.io:443/mqtt',
  ];

  // ---------------------------------------------------------------- MQTT mínimo
  const enc = new TextEncoder(), dec = new TextDecoder();
  const cat = (parts) => {
    let n = 0;
    parts.forEach((p) => { n += p.length; });
    const out = new Uint8Array(n);
    let o = 0;
    parts.forEach((p) => { out.set(p, o); o += p.length; });
    return out;
  };
  const remLen = (n) => {
    const b = [];
    do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; b.push(d); } while (n > 0);
    return Uint8Array.from(b);
  };
  const str = (s) => { const u = enc.encode(s); return cat([Uint8Array.from([u.length >> 8, u.length & 255]), u]); };
  const pkt = (first, body) => cat([Uint8Array.from([first]), remLen(body.length), body]);
  R._enc = { cat, remLen, str, pkt };

  // acumula bytes y entrega paquetes completos (un mensaje WebSocket puede traer varios paquetes o la mitad de uno)
  const parser = (onPacket) => {
    let buf = new Uint8Array(0);
    return (chunk) => {
      buf = buf.length ? cat([buf, chunk]) : chunk;
      for (;;) {
        if (buf.length < 2) return;
        let mult = 1, rem = 0, i = 1, b;
        do {
          if (i >= buf.length) return; // longitud incompleta
          b = buf[i++];
          rem += (b & 127) * mult;
          mult *= 128;
        } while ((b & 128) && i < 5);
        if (buf.length < i + rem) return;
        const first = buf[0], body = buf.slice(i, i + rem);
        buf = buf.slice(i + rem);
        onPacket(first, body);
      }
    };
  };
  R._parser = parser;

  // ---------------------------------------------------------------- relé de una sala
  // cb: { snapshot(): estado completo propio, onMsg(m): parche del compañero, onLive(bool), onBroker(): cambió el nº de brokers, active(): ¿es el camino activo? }
  R.open = function (code, me, cb) {
    const sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
    const base = 'lalioli/v1/' + String(code).toLowerCase() + '/';
    const pubT = base + me, subT = base + (1 - me);
    const urls = G.RELAY_URLS && G.RELAY_URLS.length ? G.RELAY_URLS : R.URLS;
    const r = { live: false, brokers: 0, ever: false, closed: false, sid, urls: urls.length };
    let seq = 0, lastHeard = 0, pending = null, flushT = null, tickN = 0, pid = 1;
    const seenList = [], seenSet = new Set();
    const links = [];

    const count = () => { const n = links.filter((l) => l.up).length; if (n !== r.brokers) { r.brokers = n; try { cb.onBroker && cb.onBroker(n); } catch (e) {} } };
    const setLive = (b) => { if (r.live === b) return; r.live = b; try { cb.onLive && cb.onLive(b); } catch (e) {} };

    const raw = (frame) => { links.forEach((l) => { if (l.up) { try { l.ws.send(frame); } catch (e) {} } }); };
    const publish = (obj) => {
      obj.s = sid; obj.n = ++seq;
      raw(pkt(0x30, cat([str(pubT), enc.encode(JSON.stringify(obj))])));
    };
    r.publish = publish;

    const handle = (m) => {
      if (!m || typeof m !== 'object' || m.s === sid) return;
      const key = m.s + ':' + m.n;
      if (seenSet.has(key)) return; // el mismo mensaje llegó por otro broker
      seenSet.add(key); seenList.push(key);
      if (seenList.length > 400) seenSet.delete(seenList.shift());
      if (m.t === 'bye') { lastHeard = 0; setLive(false); return; }
      lastHeard = Date.now();
      setLive(true);
      if (m.t === 'hi') {
        if (m.d) { try { cb.onMsg({ t: 'p', d: m.d, snap: 1 }); } catch (e) {} }
        publish({ t: 'p', d: cb.snapshot(), snap: 1 }); // el otro aún no me ha oído: le contesto con todo mi estado
        return;
      }
      if (m.t === 'p') { try { cb.onMsg(m); } catch (e) {} }
    };

    const connect = (L) => {
      if (r.closed) return;
      let ws;
      try { ws = new root.WebSocket(L.url, 'mqtt'); } catch (e) { return again(L); }
      ws.binaryType = 'arraybuffer';
      L.ws = ws; L.up = false;
      clearTimeout(L.ct);
      L.ct = setTimeout(() => { if (L.ws === ws && !L.up) { try { ws.close(); } catch (e) {} } }, 9000);
      const feed = parser((first, body) => {
        const type = first >> 4;
        if (type === 2) { // CONNACK
          if (body[1] !== 0) { try { ws.close(); } catch (e) {} return; }
          pid = (pid % 60000) + 1;
          ws.send(pkt(0x82, cat([Uint8Array.from([pid >> 8, pid & 255]), str(subT), Uint8Array.from([0])])));
        } else if (type === 9) { // SUBACK: ya oigo al compañero por este broker
          if (L.up) return;
          L.up = true; L.tries = 0; r.ever = true;
          clearInterval(L.ping);
          L.ping = setInterval(() => { try { ws.send(Uint8Array.from([0xc0, 0])); } catch (e) {} }, 20000);
          count();
          try { publish({ t: 'hi', d: cb.snapshot() }); } catch (e) {}
        } else if (type === 3) { // PUBLISH
          const tl = (body[0] << 8) | body[1], qos = (first >> 1) & 3, off = 2 + tl + (qos ? 2 : 0);
          let m = null;
          try { m = JSON.parse(dec.decode(body.subarray(off))); } catch (e) {}
          handle(m);
        }
      });
      ws.onopen = () => {
        const id = 'lo-' + sid + '-' + links.indexOf(L);
        try { ws.send(pkt(0x10, cat([str('MQTT'), Uint8Array.from([4, 2, 0, 45]), str(id)]))); } catch (e) {}
      };
      ws.onmessage = (ev) => { if (ev.data instanceof ArrayBuffer) { try { feed(new Uint8Array(ev.data)); } catch (e) {} } };
      const down = () => {
        if (L.ws !== ws) return;
        L.ws = null; L.up = false;
        clearInterval(L.ping); clearTimeout(L.ct);
        count();
        again(L);
      };
      ws.onclose = down; ws.onerror = down;
    };
    const again = (L) => {
      if (r.closed) return;
      L.tries++;
      clearTimeout(L.rt);
      L.rt = setTimeout(() => connect(L), Math.min(1500 * L.tries, 12000));
    };
    urls.forEach((u) => { const L = { url: u, ws: null, up: false, tries: 0 }; links.push(L); connect(L); });

    // latido: «hi» hasta que el otro contesta; después «k» cada ~4 s y copia completa cada ~6 s si este es el camino activo
    const tick = setInterval(() => {
      tickN++;
      if (!r.brokers) return;
      if (r.live && Date.now() - lastHeard > 14000) setLive(false);
      if (!r.live) publish({ t: 'hi', d: cb.snapshot() });
      else if (tickN % 3 === 0 && cb.active && cb.active()) publish({ t: 'p', d: cb.snapshot(), snap: 1 });
      else if (tickN % 2 === 0) publish({ t: 'k' });
    }, 2000);

    // los parches de pose se agrupan (máx. ~8 mensajes/s) para no saturar los brokers públicos
    r.patch = (d) => {
      pending = Object.assign(pending || {}, d);
      if (flushT) return;
      flushT = setTimeout(() => {
        flushT = null;
        const p = pending; pending = null;
        if (p && r.brokers) publish({ t: 'p', d: p });
      }, 120);
    };
    r.snapshot = () => { if (r.brokers) publish({ t: 'p', d: cb.snapshot(), snap: 1 }); };

    r.close = () => {
      if (r.closed) return;
      try { publish({ t: 'bye' }); } catch (e) {}
      r.closed = true;
      clearInterval(tick); clearTimeout(flushT);
      links.forEach((l) => { clearTimeout(l.rt); clearTimeout(l.ct); clearInterval(l.ping); try { l.ws && l.ws.close(); } catch (e) {} });
      r.live = false; r.brokers = 0;
    };
    return r;
  };
})(typeof window !== 'undefined' ? window : globalThis);
