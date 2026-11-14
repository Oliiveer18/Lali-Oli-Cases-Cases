// net.js — juego online para 2 móviles con código de sala.
// Transporte: capacidad "room" de los artefactos de Claude (sala con nombre = código). No hay servidor propio.
// Modelo: cada móvil simula su propio mundo y publica por "presence" (a) su pose y (b) su estado del caso.
// El estado del caso solo crece (pistas, banderas, progreso, confianza...), así que se fusiona por unión/máximo:
// converge siempre, aunque se pierdan mensajes o uno se desconecte unos segundos.
(function (root) {
  'use strict';
  const G = root.G;
  const GAME = 'det1';
  const ALPHA = 'ABCDEFGHJKLMNPRSTUVXYZ';
  const FACES = { u: 'up', d: 'down', l: 'left', r: 'right' };

  const N = (G.net = {
    available: false, // ¿hay capacidad "room" en este visor?
    code: null,
    me: 0, // 0 = Oli (anfitrión), 1 = Lali (invitado)
    nr: null,
    connected: false,
    error: null,
    remote: null, // presence del compañero
    remoteHere: false,
    last: {}, // último patch enviado
    goSeen: 0,
    onGo: null,
  });

  // servidores STUN + TURN (el TURN retransmite la conexión cuando el 4G/5G no deja conectar directamente)
  N.iceServers = function () {
    const s = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun2.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:global.stun.twilio.com:3478' }];
    if (G.TURN && G.TURN.length) G.TURN.forEach((t) => s.push(t));
    else s.push({ urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }, { urls: ['turn:turn.anyfirewall.com:443?transport=tcp'], username: 'webrtc', credential: 'webrtc' }, { urls: ['turn:freestun.net:3478', 'turn:freestun.net:5349'], username: 'free', credential: 'free' }); // varios relés públicos gratuitos (sin cuenta): si uno está caído vale otro
    return s;
  };
  // texto claro de cada fallo de conexión (antes salía solo «timeout»); 'timeout-servidor' = no llegó al servidor de salas, 'timeout-companero' = llegó pero no pudo enlazar con el otro móvil
  N.errorText = function (t) {
    if (t === 'unavailable-id') return 'El servidor aún tiene ocupada esa sala. Esperad 30 s y volved a crearla.';
    if (t === 'peer-unavailable') return 'No encuentro esa sala. Comprueba el código y que el anfitrión ya la haya creado y siga en la pantalla de espera.';
    if (t === 'timeout-companero' || t === 'webrtc' || t === 'negotiation' || t === 'connection') return 'He llegado a los servidores pero el otro móvil no aparece. Comprobad que el anfitrión sigue en la pantalla de espera, que el código es el mismo y que los dos tenéis la misma versión del juego.';
    if (t === 'timeout-servidor' || t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') return 'No consigo conectar con ningún servidor (ni el directo ni el de respaldo). Revisa tu internet o desactiva la VPN y repite.';
    return 'No se pudo abrir la sala (' + (t || 'error') + '). Inténtalo de nuevo.';
  };
  N.CODE_LEN = 5; // 22^5 ≈ 5,1 millones de códigos (con 4 eran solo ≈ 234.000)
  N.genCode = () => {
    let c = '';
    const n = N.CODE_LEN, buf = root.crypto && root.crypto.getRandomValues ? root.crypto.getRandomValues(new Uint32Array(n)) : null;
    for (let i = 0; i < n; i++) c += ALPHA[Math.floor((buf ? buf[i] / 4294967296 : Math.random()) * ALPHA.length)];
    return c;
  };
  N.cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, N.CODE_LEN);

  N.init = function () {
    if (N._init) return N._init;
    N._init = (async () => {
      // versión web pública: conexión directa entre móviles con PeerJS (código = id del anfitrión)
      if (root.__STANDALONE) {
        // la librería se carga desde varios CDN (jsDelivr, unpkg, cdnjs): esperamos a que llegue de alguno
        for (let i = 0; i < 50 && !root.Peer; i++) await new Promise((res) => setTimeout(res, 150));
        if (root.Peer) { N.transport = 'peer'; N.available = true; return true; }
        return false;
      }
      N.transport = 'room';
      try {
        const c = root.claude;
        if (!c || !c.use) return false;
        const r = await Promise.race([c.use('room'), new Promise((res) => setTimeout(() => res(null), 6000))]);
        if (!r || !r.join) return false;
        N.lobby = r;
        N.available = true;
        return true;
      } catch (e) { return false; }
    })();
    return N._init;
  };

  N.leave = function () {
    try { N._un && N._un.forEach((f) => f && f()); } catch (e) {}
    N._un = [];
    try { N.nr && N.nr.leave(); } catch (e) {}
    try { N._conn && N._conn.close(); } catch (e) {}
    try { N._rel && N._rel.close(); } catch (e) {}
    try { N._peer && N._peer.destroy(); } catch (e) {}
    clearInterval(N._lt); N._rel = null; N._tok = null;
    N._conn = null; N._peer = null; N.mine = {};
    N.nr = null; N._relink = null; N.retrying = false; N.code = null; N.remote = null; N.remoteHere = false; N.connected = false; N.last = {};
  };

  // abre (o crea) la sala con ese código
  N.open = async function (code, me) {
    N.error = null;
    const ok = await N.init();
    if (!ok) { N.error = 'unavailable'; throw new Error('unavailable'); }
    N.leave();
    if (N.transport === 'peer') return N.peerOpen(code, me);
    N.code = code;
    try {
      N.nr = await N.lobby.join('det-' + code.toLowerCase());
    } catch (e) {
      N.error = (e && e.code) || 'join';
      throw e;
    }
    const nr = N.nr;
    // si ya hay alguien con mi mismo papel (p. ej. el anfitrión que vuelve a entrar), tomo el otro
    if (nr.peers().some((p) => !p.isMe && p.presence && p.presence.g === GAME && p.presence.i === me)) me = 1 - me;
    N.me = me;
    N._un = [
      nr.onPeers((ch) => N.readPeers(ch.peers)),
      nr.onConnection((c) => { N.connected = !!c; }),
    ];
    N.connected = nr.connected();
    N.last = {};
    N.patch({ g: GAME, i: me, v: G.VERSION });
    N.readPeers(nr.peers());
    return nr;
  };

  N.readPeers = function (peers) {
    let r = null;
    (peers || []).forEach((p) => { if (!p.isMe && p.presence && p.presence.g === GAME && p.presence.i !== N.me) r = p.presence; });
    N.remote = r;
    N.remoteHere = !!r;
    if (r && r.go && r.go.n !== N.goSeen) { N.goSeen = r.go.n; N.onGo && N.onGo(r.go); }
  };

  // envía solo los campos que han cambiado
  N.patch = function (obj) {
    if (N.transport === 'peer') return N.peerPatch(obj);
    if (!N.nr) return;
    const out = {};
    let any = false;
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      const j = JSON.stringify(v === undefined ? null : v);
      if (N.last[k] !== j) { N.last[k] = j; out[k] = v === undefined ? null : v; any = true; }
    });
    if (any) N.nr.presence(out).catch(() => {});
  };

  N.sendGo = function (caseId, diff, resume) { N.patch({ go: { c: caseId, d: diff, r: resume ? 1 : 0, n: Date.now() % 1000000007 } }); };
  N.clearGo = function () { N.patch({ go: null }); };
  // Versiones distintas (p. ej. un móvil con la copia antigua en caché) pueden desincronizar la partida.
  // Quien no envía versión es una versión anterior a 0.7.4, así que también cuenta como distinta.
  N.versionMismatch = () => !!(N.remote && N.remote.v !== G.VERSION);
  N.versionMsg = () => 'Tu compañero tiene otra versión del juego (' + ((N.remote && N.remote.v) || 'anterior') + ' frente a ' + G.VERSION + '). Cerrad el juego en los dos móviles y volved a abrirlo con el enlace para actualizar.';
  // ¿está el compañero jugando (con pose) y no solo en la sala de espera?
  N.partnerPlaying = () => !!(N.remote && N.remote.rm !== undefined);


  // ------------------------------------------------------------ transporte PeerJS (P2P directo)
  N.mine = {};
  // aplica un parche (o copia completa) del compañero, llegue por el camino directo o por el relé de respaldo
  N.recv = function (m) {
    if (!m || m.t !== 'p') return;
    const r = Object.assign({}, N.remote || {});
    Object.keys(m.d || {}).forEach((k) => { if (m.d[k] === null) delete r[k]; else r[k] = m.d[k]; });
    N.remote = r;
    N.remoteHere = r.g === GAME && r.i !== N.me;
    if (r.go && r.go.n !== N.goSeen) { N.goSeen = r.go.n; N.onGo && N.onGo(r.go); }
  };
  N.p2pOpen = () => !!(N._conn && N._conn.open);
  N.relayLive = () => !!(N._rel && N._rel.live);
  // por dónde van ahora los datos: 'directo' (móvil a móvil), 'respaldo' (servidor público) o null (sin enlace)
  N.linkMode = () => (N.p2pOpen() ? 'directo' : N.relayLive() ? 'respaldo' : null);

  // Abre la sala por DOS caminos a la vez: directo (PeerJS/WebRTC) y relé de respaldo (relay.js, servidores públicos por wss).
  // La promesa se cumple en cuanto uno de los dos sirve; solo falla si ninguno llega a nada.
  N.peerOpen = function (code, me) {
    N.code = code; N.me = me; N.mine = {}; N.last = {};
    const tok = (N._tok = {});
    const alive = () => N._tok === tok;
    N.patch({ g: GAME, i: me, v: G.VERSION }); // se guarda ya; se envía en cuanto haya enlace por cualquiera de los dos caminos
    return new Promise((resolve, reject) => {
      let done = false, peerUp = false, p2pErr = null, tries = 0, timer = null, early = null;
      const id = 'rexluna-' + code.toLowerCase();
      const fail = (t) => {
        if (done) return;
        done = true; clearTimeout(timer); clearTimeout(early);
        N.leave(); N.error = t;
        reject({ type: t });
      };
      const ok = () => { if (done) return; done = true; clearTimeout(timer); clearTimeout(early); resolve(); };
      const reached = () => peerUp || !!(N._rel && N._rel.ever);
      // el anfitrión que vuelve a entrar puede toparse con su id aún "ocupado" en el servidor: reintenta; el invitado espera hasta 40 s (móviles con relé)
      timer = setTimeout(() => {
        if (!alive()) return;
        if (!reached()) return fail('timeout-servidor');
        fail(me === 0 ? (p2pErr === 'unavailable-id' ? 'unavailable-id' : 'timeout-servidor') : (p2pErr === 'peer-unavailable' ? 'peer-unavailable' : 'timeout-companero'));
      }, me === 0 ? 45000 : 40000);
      early = setTimeout(() => { if (alive() && !done && !reached()) fail('timeout-servidor'); }, 20000);

      // ---- camino 2: relé de respaldo (no depende de la red de cada móvil)
      N._rel = G.relay && root.WebSocket ? G.relay.open(code, me, {
        snapshot: () => N.mine,
        onMsg: (m) => { if (alive()) N.recv(m); },
        onLive: (b) => {
          if (!alive()) return;
          if (b) { N.connected = true; ok(); }
          else if (!N.p2pOpen()) { N.remote = null; N.remoteHere = false; N.connected = false; }
        },
        onBroker: (n) => { if (alive() && me === 0 && n > 0) ok(); }, // anfitrión: ya hay sala; basta con que algún servidor de respaldo esté vivo
        active: () => !N.p2pOpen(),
      }) : null;

      // ---- camino 1: directo (PeerJS)
      const po = { config: { iceServers: N.iceServers() } };
      const start = () => {
        if (!alive()) return;
        let peer;
        try { peer = me === 0 ? new root.Peer(id, po) : new root.Peer(undefined, po); } catch (e) { p2pErr = 'peerjs'; return; }
        N._peer = peer;
        peer.on('error', (e) => {
          if (!alive() || N._peer !== peer) return;
          const t = (e && e.type) || 'peer';
          p2pErr = t;
          if (me === 0 && t === 'unavailable-id') {
            N.retrying = true;
            try { peer.destroy(); } catch (x) {}
            if (++tries < 40) setTimeout(start, 2500);
            return;
          }
          if (!peerUp && /^(network|server-error|socket-error|socket-closed)$/.test(t) && ++tries < 12) { // el servidor de salas no contestó: otra vez en 4 s
            try { peer.destroy(); } catch (x) {}
            setTimeout(start, 4000);
          }
          // 'peer-unavailable' y demás: el invitado sigue reintentando el enlace y el relé de respaldo sigue su camino
        });
        peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) {} });
        peer.on('open', () => {
          peerUp = true; N.retrying = false;
          if (me === 0) { N.connected = true; ok(); peer.on('connection', (c) => N.peerConn(c)); }
          else {
            const link = () => {
              const c = peer.connect(id, { reliable: true });
              N.peerConn(c);
              c.on('open', ok);
              return c;
            };
            N._relink = () => { if (N._peer !== peer || N.p2pOpen() || Date.now() - (N._linkT || 0) < 7000) return; N._linkT = Date.now(); try { link(); } catch (e) {} };
            link();
            // sigue intentando el enlace directo cada 8 s (~3 min) aunque el respaldo ya esté sirviendo; si lo consigue, pasa al directo solo
            let n = 0;
            clearInterval(N._lt);
            N._lt = setInterval(() => { if (!alive() || N._peer !== peer || N.p2pOpen() || ++n > 22) return clearInterval(N._lt); try { link(); } catch (e) {} }, 8000);
          }
        });
      };
      start();
    });
  };
  N.peerConn = function (c) {
    try { N._conn && N._conn !== c && N._conn.close(); } catch (e) {}
    N._conn = c;
    c.on('open', () => { N.connected = true; try { c.send({ t: 'p', d: N.mine }); } catch (e) {} });
    c.on('data', (m) => N.recv(m));
    const gone = () => {
      if (N._conn !== c) return;
      N._conn = null;
      if (N.relayLive()) N._rel.snapshot(); // el directo se cayó pero el respaldo sigue vivo: sigue por ahí y reenvía todo mi estado
      else { N.remote = null; N.remoteHere = false; N.connected = false; }
      if (N.me === 1 && N._relink) { const pr = N._peer; setTimeout(function again() { if (N._peer !== pr || !pr) return; if (N.p2pOpen()) return; N._relink(); setTimeout(again, 3000); }, 2000); }
    };
    c.on('close', gone);
    c.on('error', gone);
  };
  N.peerPatch = function (obj) {
    const out = {};
    let any = false;
    Object.keys(obj).forEach((k) => {
      const v = obj[k] === undefined ? null : obj[k];
      const j = JSON.stringify(v);
      if (N.last[k] !== j) { N.last[k] = j; out[k] = v; any = true; if (v === null) delete N.mine[k]; else N.mine[k] = v; }
    });
    if (!any) return;
    if (N.p2pOpen()) { try { N._conn.send({ t: 'p', d: out }); } catch (e) {} }
    else if (N._rel && N._rel.brokers) N._rel.patch(out);
  };

  // ------------------------------------------------------------ estado compartido
  const deepUnion = (a, b) => {
    if (b === undefined || b === null) return a;
    if (a === undefined || a === null) return JSON.parse(JSON.stringify(b));
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
    if (Array.isArray(a) && Array.isArray(b)) { const out = a.slice(); b.forEach((x) => { if (!out.some((y) => JSON.stringify(y) === JSON.stringify(x))) out.push(x); }); return out; }
    if (typeof a === 'object' && typeof b === 'object') { Object.keys(b).forEach((k) => { a[k] = deepUnion(a[k], b[k]); }); return a; }
    return a;
  };

  // lo que se comparte (compacto)
  N.packState = function (st) {
    const snap = {
      c: st.clueOrder, cl: Object.keys(st.clues).map((k) => [k, Math.round(st.clues[k].t), st.clues[k].via]),
      fl: Object.keys(st.flags), p: st.progress, m: st.moved, n: st.npc, sh: st.shown, as: st.asked, tm: st.testimony || {},
      w: st.wrong, fa: st.failedAccs || [], h: st.hintsUsed, b: st.bonusMoney, tp: st.timePenalty, t: Math.round(st.time / 5) * 5,
    };
    let j = JSON.stringify(snap);
    if (j.length > 3300) { snap.tm = {}; j = JSON.stringify(snap); }
    return snap;
  };

  // aplica el estado del compañero al mío. Devuelve true si algo cambió.
  N.mergeState = function (st, world, r) {
    if (!r) return false;
    let changed = false;
    (r.cl || []).forEach(([id, t, via]) => { if (st.def.clues[id] && !st.clues[id]) { st.clues[id] = { t, via }; st.clueOrder.push(id); st.events.push({ type: 'clue', id }); changed = true; } });
    (r.fl || []).forEach((f) => { if (!st.flags[f]) { st.flags[f] = true; st.events.push({ type: 'flag', id: f }); changed = true; } });
    Object.keys(r.p || {}).forEach((k) => { if ((st.progress[k] || 0) < r.p[k]) { st.progress[k] = r.p[k]; changed = true; } });
    // objetos movidos (cajas, etc.)
    Object.keys(r.m || {}).forEach((id) => {
      const mine = st.moved[id] || { dx: 0, dy: 0 }, theirs = r.m[id];
      const ddx = theirs.dx - mine.dx, ddy = theirs.dy - mine.dy;
      if (!ddx && !ddy) return;
      st.moved[id] = { dx: theirs.dx, dy: theirs.dy };
      Object.keys(world.rooms).forEach((rid) => {
        const q = world.rooms[rid].props.find((x) => x.id === id);
        if (q) { q.x += ddx; q.y += ddy; world.rooms[rid].rebuild(); }
      });
      changed = true;
    });
    const before = JSON.stringify([st.npc, st.shown, st.asked, st.testimony]);
    if (r.n) st.npc = deepUnion(st.npc, r.n);
    if (r.sh) st.shown = deepUnion(st.shown, r.sh);
    if (r.as) st.asked = deepUnion(st.asked, r.as);
    if (r.tm) st.testimony = deepUnion(st.testimony || {}, r.tm);
    if (JSON.stringify([st.npc, st.shown, st.asked, st.testimony]) !== before) changed = true;
    if (r.fa && r.fa.length) {   // FIX-6b (fallo 8): las acusaciones falladas del compañero se ven también en mi pantalla de Acusar
      st.failedAccs = st.failedAccs || [];
      r.fa.forEach((f) => { if (f && f.k && !st.failedAccs.some((x) => x.k === f.k)) { st.failedAccs.push(f); changed = true; } });
    }
    st.wrong = Math.max(st.wrong, r.w || 0);
    st.hintsUsed = Math.max(st.hintsUsed, r.h || 0);
    st.bonusMoney = Math.max(st.bonusMoney, r.b || 0);
    st.timePenalty = Math.max(st.timePenalty, r.tp || 0);
    if ((r.t || 0) > st.time + 0.5) st.time = r.t;
    return changed;
  };

  // ------------------------------------------------------------ pose del jugador
  N.packPose = function (w) {
    const a = w.players[w.human];
    const out = {
      x: Math.round(a.x), y: Math.round(a.y), f: (a.face || 'down')[0], mv: a.moving ? 1 : 0, rm: w.roomId, ti: a.toolIdx,
      wk: a.work ? Math.round((a.work.t / a.work.dur) * 100) / 100 : null, wt: a.work && a.work.tool ? a.work.tool : null,
      ps: a.pushing ? 1 : 0,
    };
    if (a.bubble && a.bubble.text !== N._lastBubble) { N._lastBubble = a.bubble.text; N._bn = (N._bn || 0) + 1; out.bt = a.bubble.text.slice(0, 90); out.bn = N._bn; }
    return out;
  };

  N.applyPose = function (w, dt) {
    const a = w.players[1 - w.human];
    const r = N.remote;
    if (!r || r.x === undefined) { a.hidden = true; return; }
    a.ctrl = 'remote';
    a.hidden = r.rm !== w.roomId;
    if (!a.hidden) {
      const far = Math.hypot(r.x - a.x, r.y - a.y) > 220 || a._wasHidden;
      if (far) { a.x = r.x; a.y = r.y; } else { const k = Math.min(1, dt * 12); a.x += (r.x - a.x) * k; a.y += (r.y - a.y) * k; }
    }
    a._wasHidden = a.hidden;
    a.face = FACES[r.f] || 'down';
    a.moving = !!r.mv;
    if (a.moving) a.anim += dt;
    if (r.ti !== undefined && r.ti !== a.toolIdx && r.ti < a.tools.length) a.toolIdx = r.ti;
    a.work = r.wk !== null && r.wk !== undefined ? { t: r.wk, dur: 1, tool: r.wt || null, remote: true, kind: 'prop' } : null;
    a.pushing = !!r.ps;
    if (r.bn !== undefined && r.bn !== a._bn) { a._bn = r.bn; if (r.bt) a.say(r.bt, 3); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
