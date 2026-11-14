// logic.js — reglas puras del juego (sin dibujo): estado del caso, diálogos con memoria y mentiras,
// director de ritmo (pistas adaptativas), acusación, recompensas, mejoras y VALIDADOR de casos.
(function (root) {
  'use strict';
  const G = root.G;

  // ---------------------------------------------------------------- HERRAMIENTAS Y ROLES
  G.TOOLS = {
    lupa: { name: 'Lupa', role: 'campo', time: 1.3, icon: 'ico_lupa', desc: 'Revela detalles diminutos: huellas, etiquetas, borrones.', first: 'Lupa: ahora hasta las migas tienen letra pequeña.' },
    ganzua: { name: 'Ganzúa', role: 'campo', time: 2.0, icon: 'ico_ganzua', desc: 'Abre cerraduras y cajones sin hacer ruido.', first: 'Ganzúa: abre cajones sin ruido. Los cajones no opinan.' },
    uv: { name: 'Linterna UV', role: 'analista', time: 1.0, icon: 'ico_uv', desc: 'Ilumina marcas invisibles: pintalabios, tinta secreta.', first: 'Linterna UV: lo invisible se hace el interesante.' },
    grabadora: { name: 'Grabadora', role: 'analista', time: 3.0, icon: 'ico_rec', desc: 'Graba conversaciones. Hay que quedarse quieto cerca.', first: 'Grabadora: quieta y calladita, que el chisme llega solo.' },
  };
  // Cada personaje: herramientas que lleva (en orden) y cuál tiene en la mano al empezar (startTool = posición en `tools`).
  // Un caso puede cambiarlo con `tools: { rex: [...], luna: [...] }` y `startTool: { rex: 0, luna: 1 }` (si no, se usa esto).
  G.ROLES = {
    rex: { id: 'rex', name: 'Oli', role: 'Detective de campo', tools: ['lupa', 'ganzua'], startTool: 0, look: 'rex', color: '#f0909c' },
    luna: { id: 'luna', name: 'Lali', role: 'Analista', tools: ['uv', 'grabadora'], startTool: 1, look: 'luna', color: '#8cc4f0' },
  };
  G.ROLE_IDS = ['rex', 'luna'];
  // herramientas de un personaje en un caso (def opcional)
  G.toolsOf = (roleId, def) => ((def && def.tools && def.tools[roleId]) || G.ROLES[roleId].tools).slice();
  G.startToolOf = (roleId, def) => {
    const n = G.toolsOf(roleId, def).length;
    const v = def && def.startTool && def.startTool[roleId] !== undefined ? def.startTool[roleId] : G.ROLES[roleId].startTool;
    return v >= 0 && v < n ? v : 0;
  };
  // quién lleva una herramienta (null si nadie)
  G.toolOwner = (tool, def) => {
    for (let i = 0; i < G.ROLE_IDS.length; i++) if (G.toolsOf(G.ROLE_IDS[i], def).indexOf(tool) >= 0) return G.ROLE_IDS[i];
    return null;
  };
  G.roleName = (id) => (G.ROLES[id] ? G.ROLES[id].name : '?');

  // ---------------------------------------------------------------- VIGILANTE (SIGILO) COMO DATOS (v0.7.21)
  // Un personaje vigila una acción si un objeto de la sala la declara con «watcher: <id>». Su ritmo sale de
  // G.WATCH_DEFAULTS y puede ajustarse por personaje con «npcs.<id>.watch» (ver docs/FORMATO_DE_CASO.md).
  // En Fácil nunca mira. Los valores por defecto son los del caso 1 (Baguette en el callejón).
  G.WATCH_DEFAULTS = {
    period: { normal: 6.5, hard: 6.0 }, // segundos de un ciclo completo
    look: { normal: 1.7, hard: 2.0 },   // segundos que mira en cada ciclo
    offset: 2,                          // desfase del ciclo respecto al reloj del mundo
    face: { watching: 'left', idle: 'right' },
    spotted: '¡Eh! ¿Quién anda ahí?',
  };
  G.WATCH_MARGIN = 1.0; // la ventana segura debe superar en ≥ 1 s a la acción más larga (bug de la v0.5.1: ventana 2,6 s < grabación 3 s)
  G.watchConfig = (def, npcId) => {
    const w = (def && def.npcs && def.npcs[npcId] && def.npcs[npcId].watch) || {}, D = G.WATCH_DEFAULTS;
    const mix = (k) => Object.assign({}, D[k], w[k] || {});
    return { period: mix('period'), look: mix('look'), offset: w.offset !== undefined ? w.offset : D.offset, face: mix('face'), spotted: w.spotted || D.spotted };
  };
  const watchKey = (diffId) => (diffId === 'hard' ? 'hard' : 'normal');
  G.watchLooking = (cfg, diffId, t) => {
    if (diffId === 'easy') return false;
    const k = watchKey(diffId), per = cfg.period[k], look = cfg.look[k];
    return ((t + cfg.offset) % per) > per - look;
  };
  // ¿está despejado desde t hasta t+need? (nadie la ve si empieza ahora una acción de «need» segundos). Lo usan la IA del compañero y el bot para esperar la ventana segura.
  G.watchClear = (cfg, diffId, t, need) => { if (diffId === 'easy') return true; for (let k = 0; k <= need + 1e-9; k += 0.05) if (G.watchLooking(cfg, diffId, t + k)) return false; return true; };
  G.watchSafeSeconds = (cfg, diffId) => { const k = watchKey(diffId); return cfg.period[k] - cfg.look[k]; };
  // duración base (sin mejoras) de un paso de un objeto: lo que tarda la herramienta o el valor «time» del paso
  G.stepBaseSeconds = (step) => step.time || (step.tool && G.TOOLS[step.tool] ? G.TOOLS[step.tool].time : 0.55);
  // A4 HERR-1 2/4 · grabadora: charla de dos personajes que se graba quedándose quieto cerca de un «punto de escucha» (objeto con `listen: true` y `chat`).
  // Cada frase necesita su tiempo para leerse como burbuja: el paso de grabar debe durar al menos G.listenMinSeconds(chat). El alcance base para empezar a grabar es el de cualquier objeto (40 px) y el
  // «Micrófono directivo» (mejora de la grabadora) lo multiplica por stats().listenRange.
  G.LISTEN_LINE_SECONDS = 1.2;
  G.LISTEN_REACH = 40;
  // GRAB-1 (c3, LOW): zona muerta al grabar. Un roce del joystick (entrada < REC_DEADZONE) no corta; hace falta empujar de verdad más de REC_GRACE segundos seguidos (se «enfría» a 1,5× la velocidad). Solo afecta a las charlas grabadas.
  G.REC_DEADZONE = 0.6; G.REC_GRACE = 0.35;
  G.listenMinSeconds = (chat) => Math.round((chat && chat.lines ? chat.lines.length : 0) * G.LISTEN_LINE_SECONDS * 100) / 100;
  // A4 HERR-1 4/4 · REPARTO DEL TRABAJO ENTRE OLI (rex) Y LALI (luna): UNA sola definición que comparten el revisor, el informe (tools/reparto_herramientas.js), el medidor y las pruebas.
  // «Trabajo» = pasos de objeto con herramienta (su dueño es G.toolOwner) y puertas con herramienta (locked.tool); cuenta su NÚMERO y sus SEGUNDOS base (G.stepBaseSeconds). Los pasos «coop» (empujar entre los dos) NO cuentan:
  // los hacen los dos a la vez y no desequilibran a nadie (se informan aparte). Capítulo de un objeto = chapterMin (1 si no lo dice); el de una puerta = locked.chapterMin (1 si no lo dice).
  // Banda oficial (EQ-1, decisión del usuario del 22 oct): cada detective entre el 40 y el 60 % del trabajo, en número Y en tiempo, por caso y por capítulo con trabajo.
  G.WORK_BAND = { min: 40, max: 60 };
  G.workShare = (def) => {
    const mk = () => ({ rex: { n: 0, s: 0 }, luna: { n: 0, s: 0 } });
    const out = { det: mk(), ch: {}, coop: { n: 0, s: 0 } };
    const add = (ch, who, s) => {
      out.det[who].n++; out.det[who].s += s;
      const c = (out.ch[ch] = out.ch[ch] || mk());
      c[who].n++; c[who].s += s;
    };
    Object.keys(def.rooms || {}).forEach((rid) => {
      const room = def.rooms[rid];
      (room.props || []).forEach((p) => {
        const ch = p.chapterMin || 1;
        (p.steps || []).forEach((st) => {
          if (st.tool === 'coop') { out.coop.n++; out.coop.s += G.stepBaseSeconds(st); return; }
          if (!st.tool) return;
          const who = G.toolOwner(st.tool, def);
          if (who) add(ch, who, G.stepBaseSeconds(st));
        });
      });
      (room.doors || []).forEach((d) => {
        if (!d.locked || !d.locked.tool) return;
        const who = G.toolOwner(d.locked.tool, def);
        if (who) add(d.locked.chapterMin || 1, who, d.locked.time || (G.TOOLS[d.locked.tool] ? G.TOOLS[d.locked.tool].time : 0));
      });
    });
    // % de Oli en número y en tiempo (null si ese ámbito no tiene trabajo)
    const pct = (a, b) => (a + b > 0 ? (100 * a) / (a + b) : null);
    const sh = (m) => ({ num: pct(m.rex.n, m.luna.n), time: pct(m.rex.s, m.luna.s), work: m.rex.n + m.luna.n });
    out.share = sh(out.det);
    out.chShare = {};
    Object.keys(out.ch).forEach((c) => { out.chShare[c] = sh(out.ch[c]); });
    return out;
  };
  // Incumplimientos de la banda (lista vacía = reparto equilibrado). `band` opcional {min,max}. Cada uno: {scope:'caso'|'capN', axis:'numero'|'tiempo', oli:% , msg}.
  G.workIssues = (def, band) => {
    const B = band || G.WORK_BAND, w = G.workShare(def), issues = [], EPS = 1e-9;
    const check = (scope, sh, label) => {
      if (!sh.work) { if (scope === 'caso') issues.push({ scope, axis: 'numero', oli: null, msg: 'El caso no tiene ningún trabajo con herramienta.' }); return; }
      [['numero', sh.num], ['tiempo', sh.time]].forEach(([axis, v]) => {
        if (v === null) return;
        if (v < B.min - EPS || v > B.max + EPS) issues.push({ scope, axis, oli: Math.round(v * 10) / 10, msg: `${label}: Oli lleva el ${Math.round(v)} % del trabajo en ${axis} y Lali el ${100 - Math.round(v)} % (debe estar entre ${B.min} y ${B.max} % cada uno).` });
      });
    };
    check('caso', w.share, 'En el caso');
    if (G.GEN_VERSION < 7) Object.keys(w.chShare).sort().forEach((c) => check('cap' + c, w.chShare[c], 'En el capítulo ' + c)); // cp. 177 (decisión del usuario): con GEN_VERSION >= 7 el reparto se exige SOLO sobre el caso entero; lo «muy exagerado» por capítulo lo vigila EQ-7 (espera máxima), no un porcentaje
    return issues;
  };
  // A4 HERR-1 4/4-4 · EQ-7 (SIN TIEMPOS MUERTOS): medida común del tiempo muerto de cada detective. La alimenta el bot (G.botPlay, stats.idle) con los eventos que hace
  // (el relleno cur_/f_ch, `fill`, ocupa a quien lo hace pero no cuenta como acción propia: es opcional); la usan tools/tiempo_muerto.js y test_reparto.js. Cada evento: {ch, who:'rex'|'luna'|'both', t0, t1, fill} en segundos del bot.
  //  · PROPIO de un detective = trabajo con herramienta de su dueño (G.toolOwner) o pista libre con su voz (step.who); «both» = compartido (hablar con un sospechoso, puerta que se abre sola, empujar entre los dos).
  //  · Un detective está «ocupado» en un evento propio o compartido; ESPERA mientras solo pasan eventos exclusivos del otro (o caminar entre ellos).
  //  · Por capítulo y detective: ownN, ownS (segundos propios) y maxWait (espera seguida más larga: entre eventos en los que está ocupado, y desde el inicio y hasta el final del capítulo).
  // Es una cota PESIMISTA: el bot es un solo andarín y la voz de una pista libre es cosmética (el otro detective también podría examinarla); mide el peor caso de «cada móvil con su rol».
  G.idleChapters = (def) => { const w = G.workShare(def), r = []; Object.keys(w.ch).forEach((c) => { if (w.ch[c].rex.n + w.ch[c].luna.n > 0) r.push(+c); }); return r.sort(); };   // capítulos con trabajo con herramienta (los mismos que juzga EQ-1)
  // UMBRAL (medido el 23 oct con el bot, 300 casos por nivel, `node tools/tiempo_muerto.js 300`): espera seguida máxima en capítulos con trabajo con herramienta: Fácil 190 s · Normal 215 s · Difícil 103 s
  // (mediana 22-60 s; en el cap. 2, que dura ~450-570 s, nunca pasa del 43 % del capítulo). Se fija en 240 s (≈ el máximo medido + 12 %, menos de la mitad de un capítulo 2 típico).
  // `minOwn` se exige en el CASO entero (el trabajo con herramienta del cap. 1 es opcional para avanzar —decisión 22 oct— y el bot puede dejarlo para el cap. 2), no por capítulo.
  G.IDLE = { maxWait: 240, minOwn: 1 };
  G.idleOf = (events, nCh, only) => {   // only = capítulos a juzgar (los que tienen trabajo con herramienta: G.idleChapters(def)); sin él, los que tengan acciones propias
    const out = {};
    for (let ch = 1; ch <= nCh; ch++) {
      const ev = (events || []).filter((e) => e.ch === ch).sort((a, b) => a.t0 - b.t0);
      const o = { events: ev.length, judged: false, span: 0, rex: { ownN: 0, ownS: 0, maxWait: 0 }, luna: { ownN: 0, ownS: 0, maxWait: 0 } };
      if (ev.length) {
        const a = ev[0].t0, z = Math.max.apply(null, ev.map((e) => e.t1));
        o.span = z - a;
        ['rex', 'luna'].forEach((d) => {
          let last = a, wait = 0;
          ev.forEach((e) => {
            if (e.who !== d && e.who !== 'both') return;
            wait = Math.max(wait, e.t0 - last); last = Math.max(last, e.t1);
            if (e.who === d && !e.fill) { o[d].ownN++; o[d].ownS += e.t1 - e.t0; }
          });
          wait = Math.max(wait, z - last);
          o[d].maxWait = wait;
        });
        o.judged = only ? only.indexOf(ch) >= 0 : o.rex.ownN + o.luna.ownN > 0;   // un capítulo sin trabajo propio de nadie (hoy Acusar) no se juzga
        ['rex', 'luna'].forEach((d) => { o[d].waitShare = o.span > 0 ? o[d].maxWait / o.span : 0; });
      }
      out[ch] = o;
    }
    return out;
  };
  // Incumplimientos de EQ-7 (lista vacía = sin tiempos muertos): cada detective tiene ≥ minOwn acciones propias en el caso (sumando los capítulos juzgados) y en cada capítulo juzgado su espera seguida ≤ maxWait.
  G.idleIssues = (idle, lim) => {
    const L = lim || G.IDLE, out = [], own = { rex: 0, luna: 0 };
    let judged = 0;
    Object.keys(idle || {}).forEach((ch) => {
      const c = idle[ch]; if (!c.events || !c.judged) return;
      judged++;
      ['rex', 'luna'].forEach((d) => {
        own[d] += c[d].ownN;
        if (c[d].maxWait > L.maxWait + 1e-9) out.push({ ch: +ch, who: d, kind: 'espera', wait: Math.round(c[d].maxWait), msg: `En el capítulo ${ch}, ${d === 'rex' ? 'Oli' : 'Lali'} espera ${Math.round(c[d].maxWait)} s seguidos sin nada propio (máximo ${L.maxWait} s).` });
      });
    });
    if (judged) ['rex', 'luna'].forEach((d) => { if (own[d] < L.minOwn) out.push({ ch: 0, who: d, kind: 'sin_trabajo', msg: `${d === 'rex' ? 'Oli' : 'Lali'} no tiene ninguna acción propia en todo el caso.` }); });
    return out;
  };
  // texto de la puerta que se abre sola (sin herramienta) y frases de «se acabó el tiempo»: del caso, con valores neutros por defecto
  G.autoDoorText = (door) => (door && door.locked && door.locked.text) || '¡Puerta abierta!';
  G.timeoutLines = (def) => (def.epilogue && def.epilogue.timeout && def.epilogue.timeout.length ? def.epilogue.timeout : [{ who: def.clientId, text: '¡Se acabó el tiempo! Ya no queda margen para seguir investigando...' }]);

  // ---------------------------------------------------------------- PUERTAS EN CUALQUIER PARED (fase 1B-1)
  // Una puerta ocupa UNA baldosa del muro: {id, x, y, wall, ...}. `wall` = 'n' (norte, por defecto) | 's' | 'e' | 'w'.
  // x,y son la baldosa de la puerta dentro del muro: n → y=0 · s → y=alto-1 · w → x=0 · e → x=ancho-1.
  // (las puertas antiguas sin `wall` son del muro norte, así que el caso 1 no cambia)
  G.WALLS = { n: { dx: 0, dy: 1 }, s: { dx: 0, dy: -1 }, w: { dx: 1, dy: 0 }, e: { dx: -1, dy: 0 } };
  G.doorWall = (d) => (d.wall && G.WALLS[d.wall] ? d.wall : 'n');
  G.doorTile = (d) => ({ x: d.x, y: d.y || 0 });
  // baldosa de suelo justo dentro de la sala, delante de la puerta
  G.doorInside = (d) => { const w = G.WALLS[G.doorWall(d)]; return { x: d.x + w.dx, y: (d.y || 0) + w.dy }; };
  // rectángulo de la puerta en píxeles [x, y, ancho, alto]
  G.doorRect = (d) => [d.x * G.TS, (d.y || 0) * G.TS, G.TS, G.TS];
  // dónde aparece cada jugador (i = 0 Oli, 1 Lali) al entrar por esta puerta
  G.doorSpawn = (d, i, room) => {
    const TS = G.TS, ins = G.doorInside(d), wall = G.doorWall(d), off = i ? 20 : -20;
    const nom = (wall === 'n' || wall === 's')
      ? { x: (ins.x + 0.5) * TS + off, y: (ins.y + 1) * TS - 10 }
      : { x: (ins.x + 0.5) * TS, y: (ins.y + 0.5) * TS + 10 + off * 0.6 };
    if (!room || !room.isSolidAt) return nom; // sin sala: el punto nominal de siempre
    // FIX-1: el punto nominal puede caer dentro de un prop sólido pegado a la puerta (el generador no lo evita) y el jugador
    // quedaba atrapado. Con la sala a mano se busca el punto libre más cercano (misma caja que World.hits: ±9 px, 10 de fondo).
    const free = (x, y) => !(room.isSolidAt(x - 9, y - 10) || room.isSolidAt(x + 9, y - 10) || room.isSolidAt(x - 9, y) || room.isSolidAt(x + 9, y));
    const inw = G.WALLS[wall]; // hacia dentro de la sala
    const other = i ? G.doorSpawn(d, 0, room) : null; // Lali no se pone encima de Oli
    let best = null, bd = Infinity;
    for (let a = -96; a <= 96; a += 4) for (let b = -24; b <= 120; b += 4) {
      // a = desplazamiento a lo largo del muro, b = profundidad hacia dentro (negativo = hacia el muro)
      const x = nom.x + (inw.dx ? inw.dx * b : a), y = nom.y + (inw.dy ? inw.dy * b : a);
      if (!free(x, y)) continue;
      const dist = Math.hypot(x - nom.x, y - nom.y);
      if (dist >= bd) continue;
      if (other && Math.abs(x - other.x) < 18 && Math.abs(y - other.y) < 12) continue;
      bd = dist; best = { x, y };
    }
    return best || nom;
  };
  // punto hacia el que apunta la flecha amistosa
  G.doorTarget = (d) => ({ x: (d.x + 0.5) * G.TS, y: ((d.y || 0) + (G.doorWall(d) === 'n' ? 0.9 : 0.5)) * G.TS });

  // ---------------------------------------------------------------- OFENSA TRAS UNA ACUSACIÓN FALLIDA (FIX-3a)
  G.OFFEND_SECS = 40;   // duración fija de la ofensa (segundos de juego); termina antes al cambiar de sala o examinar una pista física
  G.RANCOR = {   // textos genéricos (FIX-3c los sustituirá/ampliará por tono de caso)
    silent: ['({n} te da la espalda y no abre la boca.)', '({n} cruza los brazos y mira al techo. Hoy no habla.)', '({n} finge que no os oye.)'],
    evasive: ['No tengo nada que decir. Preguntad a otro.', 'Después de lo que habéis insinuado... No.', 'Hablad con mi abogado. Que no tengo, pero hablad.', 'Ahora mismo no me apetece nada colaborar.'],
    rumor: ['Si buscáis culpables, mirad a {t}. No tengo pruebas, pero me da igual.', 'Yo no he sido. {t} anda muy raro últimamente, y no digo más.', '¿Queréis un sospechoso? {t}. Lo digo sin ninguna prueba y con total rencor.'],
  };

  // FIX-3c: reacciones por tono de caso. Rex = Oli, Luna = Lali. Nunca dicen QUÉ parte de la acusación falló (culpable, motivo...).
  G.FAIL_LINES = {
    _: [['Pues no ha sido. O sí, pero no nos lo han creído.', 'Respira, Rex. Revisemos el cuaderno con calma.'], ['Eso ha sonado mejor en mi cabeza.', 'En la mía sonaba fatal. Sigamos buscando.'], ['Plan B: fingir que fue una prueba.', 'No cuela. Vamos a mirar otra vez las pistas.']],
    noir: [['Ha vuelto a llover. Y no ha sido en la calle.', 'Es el ruido de una acusación mojada, Rex.'], ['En esta ciudad se paga por equivocarse.', 'Y por hablar en voz baja con gabardina.'], ['Me da que alguien nos ha tendido una trampa.', 'Nadie. Hemos fallado solitos.']],
    telenovela: [['¡Qué humillación! ¡Todos nos miran!', 'Tranquilo, Rex: en una telenovela esto es solo el capítulo 40.'], ['Mi honor de detective ha quedado por los suelos.', 'Se levanta. Siempre vuelve alguien de entre los muertos.'], ['¡Tenía que ser esa persona! ¡Lo sentía en el corazón!', 'El corazón no es una prueba. Pregúntale al cuaderno.']],
    documental: [['Observemos al detective en su hábitat tras un error.', 'Con un poco de suerte, aprende. Es muy raro.'], ['El depredador ha fallado la presa.', 'La presa parece más tranquila que nosotros.'], ['La naturaleza es sabia. Nosotros, menos.', 'Volvamos a rastrear con paciencia.']],
    western: [['Esta ciudad no es lo bastante grande para dos errores.', 'Pues solo hemos cometido uno. Desenfunda el cuaderno.'], ['He desenfundado antes de tiempo, compañera.', 'Y has fallado el tiro. Vuelve a apuntar.'], ['El sheriff nos mira raro.', 'Pues demostrémosle que sabemos hacerlo mejor.']],
    espias: [['Misión comprometida. Repito: misión comprometida.', 'Cálmate, agente Rex. Reagrupemos.'], ['Nos han descubierto. O nos hemos descubierto solos.', 'Lo segundo. Revisemos los datos.'], ['El código rojo era un código naranja.', 'Y ahora toca reanalizar las pruebas.']],
    cuento: [['Érase una acusación que no era la correcta...', 'Y colorín colorado, aún no hemos terminado.'], ['Hasta el espejo mágico se ha reído.', 'Pues le demostraremos que sabemos más que él.'], ['No ha sido mi mejor capítulo.', 'Pasemos página, que quedan muchas.']],
  };
  G.FAIL_CUT = ['Y eso nos ha costado {p} % de la recompensa.', 'Nuestro bolsillo también lo ha notado: −{p} %.'];
  G.failLines = (def, wrong, strikesLeft, cut) => {
    const tone = (def && def.tone && G.FAIL_LINES[def.tone]) ? def.tone : '_', L = G.FAIL_LINES[tone];
    const h = G.hash((def.id || '') + ':fail:' + wrong), pr = L[h % L.length];
    const out = [{ who: 'rex', text: pr[0] }, { who: 'luna', text: pr[1] }];
    if (cut > 0) out.push({ who: 'luna', text: G.FAIL_CUT[h % G.FAIL_CUT.length].replace('{p}', Math.round(cut * 100)) });
    if (strikesLeft > 0) out.push({ who: 'rex', text: strikesLeft === 1 ? 'Solo nos queda un intento. Uno.' : 'Nos quedan ' + strikesLeft + ' intentos.' });
    return out;
  };
  // reacciones de ofendidos por tono (se suman a G.RANCOR.evasive / rumor)
  G.RANCOR_TONE = {
    noir: { evasive: ['No hablo con quien me señala en un callejón.'], rumor: ['{t} huele a problemas. Sin pruebas, claro: así empiezan los problemas.'] },
    telenovela: { evasive: ['¡Me habéis herido en lo más hondo! No diré nada.'], rumor: ['¡Mirad a {t}! ¡Seguro que tiene un hermano gemelo malvado! Sin pruebas.'] },
    documental: { evasive: ['(El sujeto se retira a su madriguera y no colabora.)'], rumor: ['(El sujeto señala a {t} con gesto vago. No hay evidencias.)'] },
    western: { evasive: ['Los forasteros que acusan al aire no me caen bien.'], rumor: ['Yo apostaría por {t}. Sin pruebas, pero con bigote.'] },
    espias: { evasive: ['Mi tapadera me impide hablar con gente que desconfía.'], rumor: ['Mis fuentes, que no existen, apuntan a {t}.'] },
    cuento: { evasive: ['Se acabó el hechizo de la confianza.'], rumor: ['Cuentan que {t} se ríe de noche. No lo he visto, pero lo cuentan.'] },
  };

  // ---------------------------------------------------------------- DIFICULTADES (simples: 3)
  G.DIFFS = {
    easy: {
      id: 'easy', name: 'Fácil', color: '#7de38a', short: 'Las pistas brillan. Tres sospechosos. Tres intentos de acusación.',
      hintFirst: 40, hintEvery: 25, sparkle: 'all', stubborn: -1, mult: 1, wrongCut: [0, 0.16, 0.50], wrongTime: 0, strikes: 3, timeLimit: 0, board: 1,
      companion: 'auto', hideSuspects: true, autoMark: true, hintCost: 0,
    },
    normal: {
      id: 'normal', name: 'Normal', color: '#ffd45a', short: 'Pistas sutiles con ayuda si te atascas. Los sospechosos mienten.',
      hintFirst: 110, hintEvery: 55, sparkle: 'hint', stubborn: 0, mult: 1.6, wrongCut: [0, 0.50], wrongTime: 0, strikes: 2, timeLimit: 0, board: 3,
      companion: 'ask', hideSuspects: false, autoMark: true, hintCost: 0,
    },
    hard: {
      id: 'hard', name: 'Difícil', color: '#ff7a6b', short: 'Sin ayudas. Mentiras coherentes. Tiempo ajustado y una sola acusación.',
      hintFirst: Infinity, hintEvery: Infinity, sparkle: 'never', stubborn: 1, mult: 2.4, wrongCut: [0], wrongTime: 0, strikes: 1, timeLimit: 1.2, board: 4,
      companion: 'ask', hideSuspects: false, autoMark: false, hintCost: 25,
    },
  };

  // ---------------------------------------------------------------- MEJORAS (progresión)
  G.UPGRADES = [
    { id: 'lupa', name: 'Lupa de precisión', icon: 'ico_lupa', max: 3, costs: [80, 170, 300], desc: 'La lupa examina más rápido (-22% por nivel).' },
    { id: 'ganzua', name: 'Ganzúas profesionales', icon: 'ico_ganzua', max: 3, costs: [80, 170, 300], desc: 'Abres cerraduras más rápido (-22% por nivel).' },
    { id: 'uv', name: 'Linterna UV potente', icon: 'ico_uv', max: 3, costs: [90, 180, 320], desc: 'El haz de luz UV es más ancho.' },
    { id: 'grabadora', name: 'Micrófono directivo', icon: 'ico_rec', max: 3, costs: [90, 180, 320], desc: 'Grabas más rápido y desde más lejos.' },
    { id: 'botas', name: 'Zapatillas de sigilo', icon: 'ico_arrow', max: 3, costs: [60, 140, 260], desc: 'Los detectives caminan más rápido.' },
    { id: 'olfato', name: 'Olfato de sabueso', icon: 'ico_bulb', max: 2, costs: [150, 320], desc: 'Las pistas cercanas brillan un poquito, hasta en Difícil.' },
    { id: 'cuaderno', name: 'Cuaderno de bolsillo', icon: 'ico_book', max: 2, costs: [120, 260], desc: 'Consigues pistas gratis por caso (1 y 2).' },
  ];
  G.upgLevel = (id) => (G.save && G.save.data.upgrades[id]) || 0;
  G.stats = function () {
    const l = G.upgLevel;
    return {
      speed: 74 + l('botas') * 7,
      toolMul: { lupa: 1 - 0.22 * l('lupa'), ganzua: 1 - 0.22 * l('ganzua'), uv: 1, grabadora: 1 - 0.2 * l('grabadora') },
      uvRadius: 88 + l('uv') * 22,
      listenRange: 1 + l('grabadora') * 0.5,
      sniff: l('olfato') * 40,
      freeHints: l('cuaderno'),
    };
  };

  // ---------------------------------------------------------------- CONDICIONES
  function evalCond(c, st, npcId) {
    if (!c) return true;
    if (c.any && !c.any.some((x) => evalCond(x, st, npcId))) return false;
    if (c.not && evalCond(c.not, st, npcId)) return false;
    const n = (npcId && st.npc[npcId]) || { trust: 0, pressure: 0 };
    const arr = (v) => [].concat(v);
    if (c.clue && !arr(c.clue).every((id) => st.hasClue(id))) return false;
    if (c.notClue && arr(c.notClue).some((id) => st.hasClue(id))) return false;
    if (c.anyClue && !arr(c.anyClue).some((id) => st.hasClue(id))) return false;
    if (c.flag && !arr(c.flag).every((f) => st.flags[f])) return false;
    if (c.notFlag && arr(c.notFlag).some((f) => st.flags[f])) return false;
    if (c.trustMin !== undefined && n.trust < c.trustMin) return false;
    if (c.trustMax !== undefined && n.trust > c.trustMax) return false;
    if (c.pressureMin !== undefined && n.pressure < c.pressureMin + (st.diff ? st.diff.stubborn : 0)) return false;
    if (c.chapterMin !== undefined && st.chapter < c.chapterMin) return false;
    if (c.chapterMax !== undefined && st.chapter > c.chapterMax) return false;
    if (c.flagCountMin) {
      let k = 0;
      Object.keys(st.flags).forEach((f) => { if (st.flags[f] && f.indexOf(c.flagCountMin.prefix) === 0) k++; });
      if (k < c.flagCountMin.min) return false;
    }
    return true;
  }
  G.evalCond = evalCond;

  // ---------------------------------------------------------------- ESTADO DEL CASO
  class CaseState {
    constructor(def, diffId) {
      this.def = def;
      this.diffId = diffId;
      this.diff = G.DIFFS[diffId];
      this.time = 0;
      this.chapter = 1;
      this.clues = {};
      this.clueOrder = [];
      this.flags = {};
      this.npc = {};
      this.shown = {};
      this.asked = {};
      this.progress = {};
      this.moved = {};
      this.wrong = 0;
      this.failedAccs = [];   // FIX-6b (fallo 8): combinaciones ya falladas {k, n, c, m, v, p}
      this.hintsUsed = 0;
      this.freeHints = G.stats ? G.stats().freeHints : 0;
      this.events = [];
      this.closed = false;
      this.failed = false;
      this.bonusMoney = 0;
      this.timePenalty = 0;
      Object.keys(def.npcs).forEach((id) => (this.npc[id] = { trust: 0, pressure: 0, lockedUntil: 0, talks: 0, chats: 0, presses: 0, off: G.hash((def.id || '') + ':' + id) % 3 }));
    }
    hasClue(id) { return !!this.clues[id]; }
    clueCount() { return this.clueOrder.length; }
    totalClues() { return Object.keys(this.def.clues).length; }
    setFlag(f, v) {
      if (v === false) delete this.flags[f];
      else if (!this.flags[f]) { this.flags[f] = true; this.events.push({ type: 'flag', id: f }); }
    }
    addClue(id, via) {
      if (!this.def.clues[id] || this.clues[id]) return false;
      this.clues[id] = { t: this.time, via: via || '' };
      if (via && !this.def.npcs[via]) this.calmAll();   // FIX-3a: examinar una pista física calma a los ofendidos
      this.clueOrder.push(id);
      this.events.push({ type: 'clue', id });
      return true;
    }
    elapsed() { return this.time + this.timePenalty; }
    timeLimit() { return this.diff.timeLimit ? this.def.parSeconds * this.diff.timeLimit : 0; }
    timeLeft() { const l = this.timeLimit(); return l ? l - this.elapsed() : Infinity; }

    // ---- capítulos
    chapterDef() { return this.def.chapters[this.chapter - 1]; }
    goalDone(g) {
      if (g.clue) return this.hasClue(g.clue);
      if (g.clues) return g.clues.filter((c) => this.hasClue(c)).length >= (g.min || g.clues.length);
      if (g.flags) return g.flags.filter((f) => this.flags[f]).length >= (g.min || g.flags.length);
      return false;
    }
    goalProgress(g) {
      if (g.clue) return this.hasClue(g.clue) ? [1, 1] : [0, 1];
      if (g.clues) return [Math.min(g.clues.filter((c) => this.hasClue(c)).length, g.min || g.clues.length), g.min || g.clues.length];
      if (g.flags) return [Math.min(g.flags.filter((f) => this.flags[f]).length, g.min || g.flags.length), g.min || g.flags.length];
      return [0, 1];
    }
    goals() { return this.chapterDef().goals.map((g) => ({ id: g.id, text: g.text, done: this.goalDone(g), prog: this.goalProgress(g), def: g })); }
    checkAdvance() {
      const ch = this.chapterDef();
      if (this.chapter >= this.def.chapters.length) return false;
      if (ch.goals.every((g) => this.goalDone(g))) {
        const from = this.chapter;
        this.chapter++;
        this.events.push({ type: 'chapter', from, to: this.chapter });
        return true;
      }
      return false;
    }

    // ---- personajes presentes
    placementOf(npcId) {
      const list = this.def.placement && this.def.placement[npcId];
      if (!list) return null;
      let cur = null;
      list.forEach((p) => { if (p.ch <= this.chapter) cur = p; });
      return cur;
    }
    npcsIn(roomId) {
      return Object.keys(this.def.npcs).filter((id) => {
        const p = this.placementOf(id);
        return p && p.room === roomId;
      });
    }

    // ---- diálogos
    isLocked(npcId) { return this.npc[npcId].lockedUntil > this.time; }
    lockLeft(npcId) { return Math.max(0, this.npc[npcId].lockedUntil - this.time); }
    topicsFor(npcId) {
      const nd = this.def.npcs[npcId];
      return nd.topics.filter((t) => evalCond(t.show, this, npcId)).map((t) => ({ id: t.id, label: t.label, seen: !!this.asked[npcId + ':' + t.id] }));
    }
    _apply(fx, npcId, out) {
      if (!fx) return;
      const n = npcId && this.npc[npcId];
      if (fx.clue) [].concat(fx.clue).forEach((c) => { if (this.addClue(c, npcId)) (out.newClues = out.newClues || []).push(c); });
      if (fx.flag) [].concat(fx.flag).forEach((f) => this.setFlag(f));
      if (fx.unflag) [].concat(fx.unflag).forEach((f) => this.setFlag(f, false));
      if (n && fx.trust) n.trust = G.clamp(n.trust + fx.trust, 0, 6);
      if (n && fx.pressure) n.pressure = G.clamp(n.pressure + fx.pressure, 0, 8);
      if (n && fx.lockFor && this.diff.id !== 'easy') { n.lockedUntil = this.time + fx.lockFor; out.locked = true; }
      if (fx.money) this.bonusMoney += fx.money;
      if (fx.sfx) out.sfx = fx.sfx;
    }
    _run(list, npcId) {
      const nd = this.def.npcs[npcId];
      const out = { lines: [], who: npcId, sfx: null };
      const norm = (list || []).map((e) => (Array.isArray(e) ? { say: e } : e));
      const hit = norm.find((r) => evalCond(r.when, this, npcId));
      if (hit) {
        out.lines = hit.say.slice();
        this._apply(hit.fx, npcId, out);
      }
      out.name = nd.name;
      this.checkAdvance();
      return out;
    }
    lockedReply(npcId) {
      const nd = this.def.npcs[npcId];
      return { lines: [`(${nd.name} se ha cerrado en banda. Dale ${Math.ceil(this.lockLeft(npcId))} segundos para que se calme.)`], who: 'narrator', locked: true, name: nd.name };
    }
    startTalk(npcId) {
      const n = this.npc[npcId];
      const first = n.talks === 0;
      n.talks++;
      this.setFlag('talked_' + npcId);
      this.checkAdvance();
      return first ? { lines: this.def.npcs[npcId].first.slice(), who: npcId, name: this.def.npcs[npcId].name } : null;
    }
    ask(npcId, topicId) {
      if (this.isLocked(npcId)) return this.lockedReply(npcId);
      if (this.isOffended(npcId)) return this.offendedReply(npcId);
      const nd = this.def.npcs[npcId];
      const t = nd.topics.find((x) => x.id === topicId);
      this.asked[npcId + ':' + topicId] = true;
      return this._run(t.responses, npcId);
    }
    chat(npcId) {
      if (this.isLocked(npcId)) return this.lockedReply(npcId);
      if (this.isOffended(npcId)) return this.offendedReply(npcId);
      const n = this.npc[npcId];
      const nd = this.def.npcs[npcId];
      n.trust = G.clamp(n.trust + 1, 0, 6);
      n.pressure = Math.max(0, n.pressure - 1);
      const list = nd.chat || [['...']];
      const out = this._run([list[(n.chats + (n.off || 0)) % list.length]], npcId);
      n.chats++;
      if (nd.cat && n.chats === 3 && !this.flags.cat_reward) {
        this.setFlag('cat_reward');
        this.bonusMoney += nd.petReward || 10;
        out.lines.push('(Bigotes deja una moneda a tus pies. Debe de ser un gato con ahorros.)');
        out.sfx = 'pickup';
        out.catReward = true;
      }
      return out;
    }
    press(npcId) {
      if (this.isLocked(npcId)) return this.lockedReply(npcId);
      if (this.isOffended(npcId)) return this.offendedReply(npcId);
      const n = this.npc[npcId];
      const nd = this.def.npcs[npcId];
      n.pressure = G.clamp(n.pressure + 1, 0, 8);
      n.presses++;
      return this._run(nd.press, npcId);
    }
    present(npcId, clueId) {
      if (this.isLocked(npcId)) return this.lockedReply(npcId);
      if (this.isOffended(npcId)) return this.offendedReply(npcId);
      const nd = this.def.npcs[npcId];
      if (this.def.solution.proof.indexOf(clueId) >= 0) this.setFlag(`${npcId}_pres_${clueId}`);
      this.shown[npcId + ':' + clueId] = true;
      const list = nd.evidence[clueId] || nd.evidence['*'] || [{ say: nd.evidenceDefault }];
      let out = this._run(list, npcId);
      if (!out.lines.length) out = this._run([{ say: nd.evidenceDefault }], npcId);
      // ¡Protesto!: la prueba desmonta una mentira que el personaje había dicho (o le hace saltar)
      const L = this.def.lies && this.def.lies[npcId];
      if (L && L.refutedBy.indexOf(clueId) >= 0 && !this.flags['refuted_' + npcId] && (this.flags[L.flag] || out.sfx === 'crack')) {
        this.setFlag('refuted_' + npcId);
        out.objection = true;
        if (Object.keys(this.def.lies).every((k) => this.flags['refuted_' + k])) out.allRefuted = true;
      }
      return out;
    }

    // ---- sospechosos
    suspectCleared(sid) {
      const s = this.def.suspects.find((x) => x.id === sid);
      return !!s && s.clearedBy.length > 0 && s.clearedBy.every((c) => this.hasClue(c));
    }
    suspicion(sid) {
      let v = 0;
      this.clueOrder.forEach((c) => { const s = this.def.clues[c].sus; if (s && s[sid]) v += s[sid]; });
      return v;
    }
    topSuspect() {
      let best = null, bv = 0;
      this.def.suspects.forEach((s) => { const v = this.suspicion(s.id); if (v > bv && !this.suspectCleared(s.id)) { bv = v; best = s.id; } });
      return best && bv >= 2 ? best : null;
    }

    // ---- acceso y siguiente acción (motor de pistas)
    roomAccessible(roomId) {
      if (roomId === this.def.start.room) return true; // la sala de arranque la define el caso (formato oficial, fase 1B-2)
      let ok = false;
      Object.keys(this.def.rooms).forEach((rid) => {
        this.def.rooms[rid].doors.forEach((d) => {
          if (d.to.room === roomId) {
            if (!d.locked || this.chapter >= (d.locked.chapterMin || 1)) ok = true;
          }
        });
      });
      return ok;
    }
    propVisible(p) { return !p.visible || evalCond(p.visible, this, null); }
    propDone(p) { return p.steps && (this.progress[p.id] || 0) >= p.steps.length; }
    propStep(p) { return p.steps ? p.steps[this.progress[p.id] || 0] : null; }
    nextAction() {
      const def = this.def;
      const goals = this.goals().filter((g) => !g.done);
      const goalClues = new Set();
      goals.forEach((g) => (g.def.clues || (g.def.clue ? [g.def.clue] : [])).forEach((c) => goalClues.add(c)));
      const cands = [];
      Object.keys(def.rooms).forEach((rid) => {
        if (!this.roomAccessible(rid)) return;
        def.rooms[rid].props.forEach((p) => {
          if (!p.steps || this.propDone(p) || !this.propVisible(p)) return;
          const step = this.propStep(p);
          if (step.requires && !evalCond(step.requires, this, null)) return;
          const pr = step.clue && goalClues.has(step.clue) ? 0 : step.clue && !this.hasClue(step.clue) ? 1 : 2;
          cands.push({ kind: 'prop', room: rid, id: p.id, label: p.label || 'algo', tool: step.tool, pr, step });
        });
        def.rooms[rid].doors.forEach((d) => {
          if (d.firstOpen && !this.hasClue(d.firstOpen.clue) && (!d.locked || this.chapter >= (d.locked.chapterMin || 1))) {
            cands.push({ kind: 'door', room: rid, id: d.id, label: d.label ? 'la puerta: ' + d.label : 'una puerta', pr: goalClues.has(d.firstOpen.clue) ? 0 : 1 });
          }
          if (d.locked && !this.flags['unlocked_' + d.id] && this.chapter >= (d.locked.chapterMin || 1) && d.locked.tool) {
            cands.push({ kind: 'door', room: rid, id: d.id, label: 'la puerta: ' + d.label, tool: d.locked.tool, pr: 1 });
          }
        });
      });
      cands.sort((a, b) => a.pr - b.pr);
      const best = cands.find((c) => c.pr === 0) || null;
      if (best) return this._describe(best);
      // personajes
      const npcCands = [];
      Object.keys(def.npcs).forEach((nid) => {
        const pl = this.placementOf(nid);
        if (!pl || !this.roomAccessible(pl.room) || def.npcs[nid].cat) return;
        const nd = def.npcs[nid];
        if (!this.flags['talked_' + nid]) npcCands.push({ kind: 'npc', room: pl.room, id: nid, label: nd.name, text1: `Aún no has hablado con ${nd.name}.`, pr: goals.some((g) => g.def.flags) ? 0 : 1 });
        else {
          this.clueOrder.forEach((c) => {
            if (!this.shown[nid + ':' + c] && (nd.evidence[c] || (nd.evidence['*'] && def.solution.proof.indexOf(c) >= 0))) npcCands.push({ kind: 'npc', room: pl.room, id: nid, label: nd.name, text1: `Enseñar «${def.clues[c].title}» a ${nd.name} podría dar resultado.`, clue: c, pr: 1 });
          });
          this.topicsFor(nid).filter((t) => !t.seen).forEach((t) => npcCands.push({ kind: 'npc', room: pl.room, id: nid, label: nd.name, text1: `Pregúntale a ${nd.name}: «${t.label}»`, pr: 1 }));
        }
      });
      if (npcCands.length && (!cands.length || npcCands.some((c) => c.pr === 0))) {
        npcCands.sort((a, b) => a.pr - b.pr);
        return this._describe(npcCands[0]);
      }
      if (cands.length) return this._describe(cands[0]);
      if (npcCands.length) return this._describe(npcCands[0]);
      if (this.chapter >= def.chapters.length) return { kind: 'accuse', room: null, id: null, text1: 'Creo que ya tenemos suficiente: ¡abrid el cuaderno y acusad!', text2: 'Abre el cuaderno y pulsa «Acusar».' };
      return null;
    }
    _describe(c) {
      const rn = this.def.rooms[c.room] ? this.def.rooms[c.room].name : '';
      if (c.kind === 'npc') return { kind: 'npc', room: c.room, id: c.id, text1: c.text1, text2: c.text1, clue: c.clue };
      const t = c.tool ? ` (hace falta ${G.TOOLS[c.tool] ? G.TOOLS[c.tool].name : c.tool})` : '';
      return { kind: c.kind, room: c.room, id: c.id, tool: c.tool, text1: `Creo que en «${rn}» hay algo que merece otra mirada.`, text2: `Fíjate en ${c.label}${t}.` };
    }

    // ---- acusación
    // CL-3: ¿este caso usa Acusar por razones (v7+)? Los casos v6 y el caso 1 siguen con las reglas de siempre.
    isV7() { return (this.def.genV || 0) >= 7; }
    // CL-3: ¿tiene el jugador al menos 1 pista de ALGUNA opción de ese hueco ('motive' | 'method')? (candado del hueco, no de la opción)
    gapOpen(kind) {
      if (this.gateOff || !this.isV7()) return true;
      const list = (kind === 'method' ? this.def.solution.methods : this.def.solution.motives) || [];
      return list.some((o) => (o.needs || []).some((c) => this.hasClue(c)));
    }
    boardOptions() {
      const d = this.diff;
      // CL-3 (v7): Fácil = quién fue · Normal = + por qué · Difícil = + cómo lo hizo; sin «Pruebas clave»
      if (this.isV7()) return { suspects: this.def.suspects.filter((s) => !(d.hideSuspects && s.easyHidden)), method: d.board >= 4, motive: d.board >= 3, proof: false };
      // FIX-3a: el motivo se pide en los tres niveles (Fácil = culpable + motivo; Normal = + método; Difícil = + pruebas)
      return { suspects: this.def.suspects.filter((s) => !(d.hideSuspects && s.easyHidden)), method: d.board >= 2, motive: true, proof: d.board >= 4 };
    }
    isCatSuspect(s) { const nd = this.def.npcs[s.id]; return s.look === 'cat' || !!(nd && nd.cat); }
    // quien se ha interrogado (hablado al menos una vez) o ha quedado señalado/descartado por una pista encontrada
    interrogated(sid) {
      const n = this.npc[sid];
      if (n && n.talks > 0) return true;
      return this.clueOrder.some((c) => { const q = this.def.clues[c].sus; return !!(q && q[sid]); });
    }
    // FIX-3a: lista de la pantalla de acusar (sin gatos) con el motivo de bloqueo de cada uno
    accuseList() {
      return this.boardOptions().suspects.filter((s) => !this.isCatSuspect(s)).map((s) => ({ s, ok: this.gateOff || this.isV7() || this.interrogated(s.id) })); // v7: lista siempre abierta
    }
    accuse(sel) {
      const sol = this.def.solution;
      const opt = this.boardOptions();
      if (!this.gateOff) {
        const s = this.def.suspects.find((x) => x.id === sel.culprit);
        if (!s || this.isCatSuspect(s) || (!this.isV7() && !this.interrogated(sel.culprit))) return { ok: false, blocked: true, strikesLeft: this.strikesLeft() };
        // CL-3: motivo y método se abren con 1 pista del tema; intentar un hueco cerrado NO cuenta como fallo
        if (this.isV7()) {
          const gap = (opt.motive && !this.gapOpen('motive')) ? 'motive' : (opt.method && !this.gapOpen('method')) ? 'method' : null;
          if (gap) return { ok: false, blocked: true, blockedBy: gap, strikesLeft: this.strikesLeft() };
        }
      }
      const res = { culpritOk: sel.culprit === sol.culprit, methodOk: !opt.method || sel.method === sol.method, motiveOk: !opt.motive || sel.motive === sol.motive, proofOk: true };
      if (opt.proof) {
        const good = (sel.proof || []).filter((p) => sol.proof.indexOf(p) >= 0 && this.hasClue(p));
        res.proofOk = new Set(good).size >= 2;
      }
      res.ok = res.culpritOk && res.methodOk && res.motiveOk && res.proofOk;
      if (res.ok) {
        this.closed = true;
        this.setFlag('case_closed');
        this.checkAdvance();
      } else {
        this.wrong++;
        this.timePenalty += this.diff.wrongTime;
        this.rememberFail(sel);
        this.offend(sel.culprit);
        res.offended = sel.culprit;
        if (this.wrong >= this.diff.strikes) { this.failed = true; res.failed = true; }
      }
      res.strikesLeft = this.strikesLeft();
      res.cut = this.cut();
      return res;
    }
    // FIX-6b (fallo 8): clave de una acusación según lo que el nivel deja elegir (persona, cómo, por qué, pruebas)
    accKey(sel) {
      const o = this.boardOptions();
      return [sel.culprit || '', o.method ? sel.method || '' : '', o.motive ? sel.motive || '' : '', o.proof ? (sel.proof || []).slice().sort().join('+') : ''].join('|');
    }
    rememberFail(sel) {
      const k = this.accKey(sel);
      if (this.failedAccs.some((f) => f.k === k)) return;
      this.failedAccs.push({ k, n: this.wrong, c: sel.culprit || null, m: sel.method || null, v: sel.motive || null, p: (sel.proof || []).slice() });
    }
    wasFailed(sel) { return !!sel && !!sel.culprit && this.failedAccs.some((f) => f.k === this.accKey(sel)); }
    lastFailed() { return this.failedAccs.reduce((a, f) => (!a || f.n >= a.n ? f : a), null); }
    strikesLeft() { return Math.max(0, this.diff.strikes - this.wrong); }
    // descuento acumulado de la recompensa según los fallos (G.DIFFS[..].wrongCut, longitud = strikes)
    cut() { const c = this.diff.wrongCut; return c[Math.min(this.wrong, c.length - 1)]; }
    // ---- sospechoso ofendido (FIX-3a): tras una acusación fallida, el acusado «se ofende» un rato corto y fijo
    offend(sid) {
      const n = this.npc[sid];
      if (!n) return;
      n.offN = (n.offN || 0) + 1;
      n.offUntil = this.time + G.OFFEND_SECS;
    }
    isOffended(sid) { const n = this.npc[sid]; return !!n && (n.offUntil || 0) > this.time && (n.calmN || 0) < (n.offN || 0); }
    // la ofensa termina antes si se cambia de sala o se examina una pista física (calmN solo crece: se sincroniza bien online)
    calmAll() { Object.keys(this.npc).forEach((k) => { const n = this.npc[k]; if (n.offN) n.calmN = n.offN; }); }
    // 0 = se calla, 1 = habla mal (evasivas), 2 = rumor sin pruebas (solo texto, nunca pista)
    rancorMode(sid) { const n = this.npc[sid]; return G.hash((this.def.id || '') + ':' + sid + ':' + (n.offN || 0)) % 3; }
    offendedReply(sid) {
      const nd = this.def.npcs[sid], n = this.npc[sid], mode = this.rancorMode(sid);
      const T = (this.def.tone && G.RANCOR_TONE[this.def.tone]) || { evasive: [], rumor: [] };
      const R = { silent: G.RANCOR.silent, evasive: G.RANCOR.evasive.concat(T.evasive), rumor: G.RANCOR.rumor.concat(T.rumor) }, h = G.hash((this.def.id || '') + ':' + sid + ':r' + (n.offN || 0) + ':' + (n.rcount = (n.rcount || 0) + 1));
      const pick = (a) => a[h % a.length];
      if (mode === 0) return { lines: [pick(R.silent).replace('{n}', nd.name)], who: 'narrator', name: nd.name, offended: true };
      if (mode === 1) return { lines: [pick(R.evasive)], who: sid, name: nd.name, offended: true, rancor: true };
      // rumor: señala a OTRO personaje que no es el culpable ni el que habla (nunca altera sospecha ni pistas)
      const others = this.def.suspects.filter((s) => s.id !== sid && s.id !== this.def.solution.culprit && !this.isCatSuspect(s) && this.def.npcs[s.id]);
      const tgt = others.length ? others[h % others.length] : null;
      const line = tgt ? pick(R.rumor).replace('{t}', tgt.name) : pick(R.evasive);
      return { lines: [line], who: sid, name: nd.name, offended: true, rancor: true };
    }
    reward() {
      const def = this.def, d = this.diff;
      const foundFrac = this.clueCount() / this.totalClues();
      let stars = 1, missing = null;
      if (this.isV7()) { // CL-3 (opción A, cp. 200): ★ resolver · ★★ + ≥ 80 % de pistas · ★★★ + sin fallos y dentro del par; cada peldaño exige el anterior
        if (foundFrac >= 0.8) { stars++; if (this.wrong === 0 && this.elapsed() <= def.parSeconds) stars++; }
        missing = stars >= 3 ? [] : stars === 2 ? [].concat(this.wrong > 0 ? ['sin fallos'] : [], this.elapsed() > def.parSeconds ? ['dentro del tiempo'] : []) : ['encontrar el 80 % de las pistas'];
      } else {
        if (this.elapsed() <= def.parSeconds) stars++;
        if (this.wrong === 0 && foundFrac >= 0.8) stars++;
      }
      if (this.failed || !this.closed) stars = 0;
      // FIX-3a: sin caso resuelto no hay recompensa (en ningún nivel); si se resuelve, el descuento sale de d.wrongCut
      const base = this.closed ? def.reward * d.mult * (1 + 0.25 * (stars - 1)) : 0;
      // FIX-5 (P1, 21 oct): las monedas sueltas (bonusMoney) solo se cobran si el caso se resuelve; al fallar del todo se pierden
      const money = this.closed ? Math.round(base * (1 - this.cut())) + this.bonusMoney : 0;
      return { stars, money, rep: stars * 5, foundFrac, time: this.elapsed(), cut: this.cut(), missing: stars > 0 ? missing : null };
    }
  }
  G.CaseState = CaseState;

  // A3 INTRO-1 · Informe del caso: texto breve (quién nos contrata, qué ha pasado, qué hay que hacer) compuesto SOLO con datos que el caso ya tiene
  // (cliente, sinopsis, nº de pruebas y sospechosos, lo que pide Acusar y los intentos de la dificultad). Sirve igual para el caso 1 y los generados.
  G.caseBriefing = function (st) {
    const def = st.def, d = st.diff, o = st.boardOptions();
    const nd = def.npcs && def.npcs[def.clientId];
    const nSus = o.suspects.filter((s) => !st.isCatSuspect(s)).length;
    const v7 = st.isV7();
    const parts = ['quién fue'];
    if (v7) { if (o.motive) parts.push('por qué lo hizo'); if (o.method) parts.push('cómo lo hizo'); } // CL-3: el orden de la pantalla y los huecos del nivel
    else { if (o.method) parts.push('cómo lo hizo'); parts.push('por qué lo hizo'); if (o.proof) parts.push('con qué pruebas'); }
    const list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1] : parts[0];
    const n = d.strikes;
    const tries = n <= 1 ? 'Solo tenéis una acusación: pensadlo bien.' : 'Tenéis ' + (n === 2 ? 'dos' : n === 3 ? 'tres' : String(n)) + ' intentos.';
    return {
      title: def.title,
      client: (nd && nd.name) || def.client,
      what: def.blurb,
      todo: [
        'Reunid pruebas: examinad el escenario y escuchad a los testigos (hay ' + st.totalClues() + ').',
        'Interrogad a los ' + nSus + ' sospechosos y enseñadles las pruebas que vayáis encontrando.',
        v7 ? 'Acusad desde el Cuaderno: ' + list + '. Podéis acusar cuando queráis; si falláis, perdéis un intento. ' + tries + (d.timeLimit ? ' Y el reloj corre.' : '')
          : 'Acusad desde el Cuaderno: ' + list + '. ' + tries + (d.timeLimit ? ' Y el reloj corre.' : ''),
      ],
    };
  };

  // ---------------------------------------------------------------- DIRECTOR DE RITMO
  G.Director = class {
    constructor(st) {
      this.st = st;
      this.idle = 0;
      this.tier = 0;
      this.frustration = 0;
      this.lastClues = 0;
      this.cluesTimes = [];
      this.pending = null;
    }
    bump() { this.idle = 0; this.tier = 0; }
    denied() { this.frustration = Math.min(8, this.frustration + 1); }
    adapt() {
      if (!G.save.data.settings.adaptive) return 1;
      let a = 1 / (1 + 0.12 * this.frustration);
      if (this.cluesTimes.length >= 2) {
        const gaps = [];
        for (let i = 1; i < this.cluesTimes.length; i++) gaps.push(this.cluesTimes[i] - this.cluesTimes[i - 1]);
        const avg = gaps.reduce((s, v) => s + v, 0) / gaps.length;
        if (avg < 50) a *= 1.35;
      }
      return a;
    }
    update(dt, active) {
      const st = this.st;
      if (st.clueCount() !== this.lastClues) {
        this.lastClues = st.clueCount();
        this.cluesTimes.push(st.time);
        if (this.cluesTimes.length > 5) this.cluesTimes.shift();
        this.bump();
        this.frustration = Math.max(0, this.frustration - 2);
      }
      if (!active) return null;
      this.idle += dt;
      this.frustration = Math.max(0, this.frustration - dt * 0.02);
      const d = st.diff;
      const first = d.hintFirst * this.adapt();
      const every = d.hintEvery * this.adapt();
      if (!isFinite(first)) return null;
      const need = first + this.tier * every;
      if (this.idle >= need && this.tier < 3) {
        this.tier++;
        return { tier: this.tier, action: st.nextAction() };
      }
      return null;
    }
    request() {
      const st = this.st;
      const free = st.freeHints > 0;
      if (free) st.freeHints--;
      else st.timePenalty += st.diff.hintCost;
      st.hintsUsed++;
      this.tier = Math.min(3, Math.max(this.tier + 1, 1));
      this.idle = 0;
      return { tier: this.tier, action: st.nextAction(), free };
    }
  };

  // ---------------------------------------------------------------- VALIDADOR DE CASOS
  // Comprueba la estructura y SIMULA una partida perfecta para garantizar que el caso tiene solución.
  const validateInner = function (def) {
    const errors = [], warnings = [];
    const E = (m) => errors.push(m), W = (m) => warnings.push(m);
    // 0) formato oficial (schema.js): si la forma está mal no se puede seguir, porque el resto daría errores confusos o se rompería
    const fmt = G.checkCaseFormat(def);
    if (!fmt.shapeOk) return { ok: false, errors: fmt.errors, warnings: fmt.warnings, reached: 0, total: 0, chapter: 0, formatOk: false };
    fmt.errors.forEach(E); fmt.warnings.forEach(W);
    const spr = (n, where) => { if (n && !G.spr[n]) E(`Sprite inexistente "${n}" en ${where}`); };
    const clueIds = Object.keys(def.clues);

    // --- herramientas de los personajes (datos)
    const owners = {};
    G.ROLE_IDS.forEach((rid) => {
      const list = G.toolsOf(rid, def);
      if (!list.length) E(`Personaje ${rid}: no lleva ninguna herramienta`);
      list.forEach((t) => {
        if (!G.TOOLS[t]) E(`Personaje ${rid}: herramienta inexistente "${t}"`);
        else if (owners[t]) E(`La herramienta "${t}" la llevan dos personajes (${owners[t]} y ${rid})`);
        else owners[t] = rid;
      });
      if (def.startTool && def.startTool[rid] !== undefined && !(def.startTool[rid] >= 0 && def.startTool[rid] < list.length)) E(`Personaje ${rid}: startTool fuera de rango`);
    });
    const needTool = (t, where) => { if (t && t !== 'coop' && G.TOOLS[t] && !owners[t]) E(`${where}: la herramienta "${t}" no la lleva ningún personaje (caso imposible)`); };

    // --- CL-5c-c 1/4: PUZLES generados (objetos `pz_N`, solo casos v7 de Difícil; los casos hechos a mano y v6 no los llevan y esta parte no se ejecuta).
    // Reglas de justicia de docs/DISENO_PUZLES_CL5C.md: J1 cada pista del puzle imprime la hora del suceso · J2 línea de 3-4 sucesos, horas crecientes con ≥ 10 min y títulos de pista únicos · J3 código = HHMM impreso en su pista, de 4 cifras y distinto entre puzles · J4 el puzle no entrega pistas, exige exactamente las pistas del puzle, éstas se pueden conseguir sin pasar por él y ningún paso que da una pista exige pistas de puzle.
    {
      const pzList = []; Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((q) => { if (/^pz_\d+$/.test(q.id)) pzList.push(q); }));
      if (pzList.length) {
        const givers = {}, pzClues = {}, minutes = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : -1; };
        Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((q) => (q.steps || []).forEach((st) => { if (st.clue) givers[st.clue] = q.id; })));
        Object.keys(def.npcs || {}).forEach((nid) => { const js = JSON.stringify(def.npcs[nid].topics || []), re = /"clue":"([^"]+)"/g; let mm; while ((mm = re.exec(js))) givers[mm[1]] = 'npc:' + nid; }); // el testimonio entrega su pista con fx.clue dentro de la respuesta
        pzList.forEach((q) => { const st = (q.steps || [])[0], mi = st && st.mini; if (st && st.requires) (st.requires.clue || []).forEach((id) => { pzClues[id] = 1; }); });
        const codes = {}, printed = (id, hhmm) => { const c = def.clues[id]; return !!c && (hhmm ? new RegExp('\\b' + hhmm.slice(0, 2) + ':' + hhmm.slice(2) + '\\b').test(c.text || '') : false); };
        pzList.forEach((q) => {
          const st = (q.steps || [])[0], mi = st && st.mini, W_ = `Puzle ${q.id}`;
          if (!st || (q.steps || []).length !== 1 || !mi) { E(`${W_}: debe tener un único paso con minijuego`); return; }
          const req = (st.requires && st.requires.clue) || [];
          if (st.clue) E(`${W_}: el puzle no puede entregar una pista (J4)`);
          if (!req.length) E(`${W_}: sin requires.clue (J4: debe exigir las pistas del puzle)`);
          req.forEach((id) => {
            if (!def.clues[id]) E(`${W_}: exige una pista inexistente ${id}`);
            else if (!givers[id]) E(`${W_}: la pista ${id} no se puede conseguir (J4)`);
            else if (/^pz_\d+$/.test(givers[id])) E(`${W_}: la pista ${id} está dentro de un puzle (J4: ciclo)`);
          });
          if (mi.type === 'code') {
            const c = String(mi.code || ''); if (!/^\d{4}$/.test(c)) E(`${W_}: el código debe tener 4 cifras (J3)`);
            else {
              if (codes[c]) E(`${W_}: código repetido con otro puzle (J3)`); codes[c] = 1;
              if (req.length !== 1) E(`${W_}: un código se apoya en una sola pista (J3)`);
              else if (!printed(req[0], c)) E(`${W_}: el código ${c} no coincide con la hora impresa en su pista (J1/J3)`);
            }
          } else if (mi.type === 'timeline') {
            const ev = mi.events || [], ids = ev.map((x) => x.clue);
            if (ev.length < 3 || ev.length > 4) E(`${W_}: la línea de tiempo lleva 3 o 4 sucesos (J2)`);
            if (ev.some((x) => !x.clue)) E(`${W_}: todo suceso de la línea lleva su pista (J2)`);
            if (JSON.stringify(ids.slice().sort()) !== JSON.stringify(req.slice().sort())) E(`${W_}: las pistas de los sucesos no son las que exige el paso (J4)`);
            ev.forEach((x, k) => {
              const m = minutes(x.time); if (m < 0) E(`${W_}: hora de suceso inválida "${x.time}"`);
              else if (k && m - minutes(ev[k - 1].time) < 10) E(`${W_}: horas no crecientes o a menos de 10 min (J2)`);
              if (x.clue && def.clues[x.clue] && (def.clues[x.clue].text || '').indexOf(x.time) < 0) E(`${W_}: la pista ${x.clue} no imprime la hora ${x.time} (J1)`);
            });
            const titles = ids.map((id) => (def.clues[id] || {}).title); if (new Set(titles).size !== titles.length) E(`${W_}: títulos de pista repetidos (J2)`);
          } else E(`${W_}: tipo de minijuego desconocido`);
        });
        Object.keys(def.rooms).forEach((rid) => (def.rooms[rid].props || []).forEach((q) => { if (!/^pz_\d+$/.test(q.id)) (q.steps || []).forEach((st) => { if (st.clue && st.requires && (st.requires.clue || []).some((id) => pzClues[id])) E(`Objeto ${q.id}: da una pista pero exige pistas de un puzle (J4: ciclo)`); }); }));
      }
    }

    // --- estructura de salas
    Object.keys(def.rooms).forEach((rid) => {
      const r = def.rooms[rid];
      const w = r.map[0].length;
      r.map.forEach((row, i) => { if (row.length !== w) E(`Sala ${rid}: la fila ${i} tiene ${row.length} columnas y debería tener ${w}`); });
      const H = r.map.length;
      const solidAt = (x, y) => r.map[y] && r.map[y][x] === '#';
      const seen = {};
      r.props.forEach((p) => {
        if (seen[p.id]) E(`Sala ${rid}: id de objeto repetido "${p.id}"`);
        seen[p.id] = true;
        if (p.x < 0 || p.y < 0 || p.x >= w || p.y >= H) E(`Sala ${rid}: objeto ${p.id} fuera del mapa (${p.x},${p.y})`);
        spr(p.sprite, `objeto ${p.id}`);
        if (p.swap) spr(p.swap.sprite, `objeto ${p.id} (swap)`);
        if (p.uvMark) spr(p.uvMark.sprite, `objeto ${p.id} (uvMark)`);
        if (p.steps) p.steps.forEach((s, i) => {
          if (s.clue && !def.clues[s.clue]) E(`Objeto ${p.id}: pista inexistente "${s.clue}"`);
          if (s.tool && s.tool !== 'coop' && !G.TOOLS[s.tool]) E(`Objeto ${p.id}: herramienta inexistente "${s.tool}"`);
          needTool(s.tool, `Objeto ${p.id}`);
          if (!s.text) E(`Objeto ${p.id}: el paso ${i} no tiene texto`);
          if (s.mini) {
            const mi = s.mini;
            if (mi.type === 'code') { if (!/^\d{3,6}$/.test(String(mi.code || ''))) E(`Objeto ${p.id}: código del minijuego inválido`); }
            else if (mi.type === 'timeline') {
              if (!mi.events || mi.events.length < 3) E(`Objeto ${p.id}: la línea de tiempo necesita 3 sucesos o más`);
              (mi.events || []).forEach((ev) => { if (ev.clue && !def.clues[ev.clue]) E(`Objeto ${p.id}: suceso con pista inexistente ${ev.clue}`); });
            } else E(`Objeto ${p.id}: tipo de minijuego desconocido "${mi.type}"`);
          }
        });
        if (p.steps && !p.solid && !p.label) W(`Objeto interactivo sin etiqueta: ${p.id}`);
        if (p.ref && !r.props.find((q) => q.id === p.ref)) E(`Objeto ${p.id}: referencia a "${p.ref}" que no existe`);
        if (p.solid && p.y < H && p.x < w && solidAt(p.x, p.y) && !(p.y === 0)) E(`Objeto ${p.id} está dentro de una pared (${p.x},${p.y})`);
      });
      const seenDoor = {};
      r.doors.forEach((d) => {
        spr(d.sprite, `puerta ${d.id}`);
        if (d.locked) needTool(d.locked.tool, `Puerta ${d.id}`);
        const tr = def.rooms[d.to.room];
        if (!tr) { E(`Puerta ${d.id}: destino inexistente "${d.to.room}"`); return; }
        if (r.doors.filter((x) => x.id === d.id).length > 1) E(`Sala ${rid}: id de puerta repetido "${d.id}"`);
        const back = tr.doors.find((x) => x.id === d.to.door);
        if (!back) E(`Puerta ${d.id}: la puerta de destino "${d.to.door}" no existe en ${d.to.room}`);
        else if (back.to.room !== rid || back.to.door !== d.id) E(`Puerta ${d.id}: la puerta de vuelta no apunta aquí`);
        // posición dentro del muro (fase 1B-1)
        const wl = d.wall === undefined ? 'n' : d.wall;
        if (!G.WALLS[wl]) { E(`Puerta ${d.id}: pared desconocida "${d.wall}" (usa n, s, e o w)`); return; }
        const dy = d.y || 0;
        const onWall = wl === 'n' ? dy === 0 : wl === 's' ? dy === H - 1 : wl === 'w' ? d.x === 0 : d.x === w - 1;
        if (!onWall) E(`Puerta ${d.id}: no está en el muro ${{ n: 'norte (y=0)', s: 'sur (y=' + (H - 1) + ')', w: 'oeste (x=0)', e: 'este (x=' + (w - 1) + ')' }[wl]} (está en ${d.x},${dy})`);
        else {
          const along = wl === 'n' || wl === 's' ? d.x : dy, len = wl === 'n' || wl === 's' ? w : H;
          if (along < 1 || along > len - 2) E(`Puerta ${d.id}: está en una esquina del muro`);
          if (!solidAt(d.x, dy)) E(`Puerta ${d.id}: la baldosa del muro (${d.x},${dy}) no es pared`);
          const ins = G.doorInside(d);
          if (solidAt(ins.x, ins.y)) E(`Puerta ${d.id}: la baldosa de delante (${ins.x},${ins.y}) es pared, nadie podría llegar`);
          else if (r.props.some((p) => p.solid && ins.x >= p.x && ins.x < p.x + (p.w || 1) && ins.y >= p.y && ins.y < p.y + (p.h || 1))) E(`Puerta ${d.id}: hay un objeto sólido delante de la puerta (${ins.x},${ins.y})`);
        }
        if (seenDoor[d.x + ',' + dy]) E(`Puerta ${d.id}: comparte baldosa con la puerta ${seenDoor[d.x + ',' + dy]}`);
        seenDoor[d.x + ',' + dy] = d.id;
      });
      (r.decor || []).concat(r.decals || []).forEach((d) => spr(d.sprite, 'decoración de ' + rid));
    });
    Object.keys(def.placement || {}).forEach((nid) => {
      if (!def.npcs[nid]) E(`Colocación de personaje desconocido "${nid}"`);
      def.placement[nid].forEach((p) => {
        const r = def.rooms[p.room];
        if (!r) { E(`Personaje ${nid}: sala inexistente ${p.room}`); return; }
        if (r.map[p.y] && r.map[p.y][p.x] === '#') E(`Personaje ${nid} dentro de una pared en ${p.room}`);
        if (r.props.some((q) => q.solid && q.x === p.x && q.y === p.y)) E(`Personaje ${nid} colocado encima de un objeto sólido en ${p.room} (${p.x},${p.y})`);
      });
    });
    def.suspects.forEach((s) => s.clearedBy.forEach((c) => { if (!def.clues[c]) E(`Sospechoso ${s.id}: pista de descarte inexistente ${c}`); }));
    if (!def.suspects.find((s) => s.id === def.solution.culprit)) E('La solución apunta a un culpable inexistente');
    def.solution.proof.forEach((c) => { if (!def.clues[c]) E(`Prueba de la solución inexistente: ${c}`); });
    ['methods', 'motives'].forEach((k) => def.solution[k].forEach((o) => (o.needs || []).forEach((c) => { if (!def.clues[c]) E(`Opción ${o.id}: pista inexistente ${c}`); })));
    if (!def.solution.methods.find((m) => m.id === def.solution.method)) E('Método correcto inexistente');
    if (!def.solution.motives.find((m) => m.id === def.solution.motive)) E('Motivo correcto inexistente');
    // NPC
    Object.keys(def.npcs).forEach((nid) => {
      const nd = def.npcs[nid];
      const checkList = (list, where) => (list || []).forEach((e) => {
        const r = Array.isArray(e) ? { say: e } : e;
        if (!r.say || !r.say.length) E(`${nid} ${where}: respuesta sin texto`);
        if (r.fx && r.fx.clue) [].concat(r.fx.clue).forEach((c) => { if (!def.clues[c]) E(`${nid} ${where}: pista inexistente ${c}`); });
      });
      nd.topics.forEach((t) => checkList(t.responses, 'tema ' + t.id));
      checkList(nd.chat, 'chat');
      checkList(nd.press, 'presionar');
      Object.keys(nd.evidence).forEach((c) => { if (c !== '*' && !def.clues[c]) E(`${nid}: evidencia para pista inexistente ${c}`); checkList(nd.evidence[c], 'evidencia ' + c); });
    });

    // --- simulación de una partida perfecta
    const st = new CaseState(def, 'normal');
    const profiles = [{ trust: 6, pressure: 0 }, { trust: 0, pressure: 8 }, { trust: 6, pressure: 8 }, { trust: 3, pressure: 4 }, { trust: 0, pressure: 0 }];
    let guard = 0, changed = true;
    const sig = () => st.clueOrder.length + '|' + Object.keys(st.flags).length + '|' + st.chapter + '|' + JSON.stringify(st.progress);
    while (changed && guard++ < 400) {
      const before = sig();
      st.time += 1000; // los bloqueos por presión expiran
      // objetos
      Object.keys(def.rooms).forEach((rid) => {
        if (!st.roomAccessible(rid)) return;
        def.rooms[rid].props.forEach((p) => {
          if (!p.steps || !st.propVisible(p)) return;
          let i = st.progress[p.id] || 0;
          while (i < p.steps.length) {
            const s = p.steps[i];
            if (p.chapterMin && st.chapter < p.chapterMin) break;
            if (s.requires && !evalCond(s.requires, st, null)) break;
            if (s.clue) st.addClue(s.clue, p.id);
            if (s.fx && s.fx.flag) st.setFlag(s.fx.flag);
            i++;
          }
          st.progress[p.id] = i;
        });
        def.rooms[rid].doors.forEach((d) => {
          if (d.locked && st.chapter < (d.locked.chapterMin || 1)) return;
          if (d.firstOpen && d.firstOpen.clue) st.addClue(d.firstOpen.clue, d.id);
        });
      });
      // personajes
      Object.keys(def.npcs).forEach((nid) => {
        const pl = st.placementOf(nid);
        if (!pl || !st.roomAccessible(pl.room)) return;
        profiles.forEach((pr) => {
          const n = st.npc[nid];
          const set = () => { n.trust = pr.trust; n.pressure = pr.pressure; n.lockedUntil = 0; };
          set(); st.startTalk(nid);
          st.topicsFor(nid).forEach((t) => { set(); st.ask(nid, t.id); });
          set(); st.chat(nid);
          set(); st.press(nid);
          st.clueOrder.slice().forEach((c) => { set(); st.present(nid, c); });
        });
      });
      while (st.checkAdvance());
      changed = sig() !== before;
    }
    clueIds.forEach((c) => { if (!st.hasClue(c)) E(`La pista "${c}" no se puede conseguir nunca (inalcanzable)`); });
    if (st.chapter < def.chapters.length) E(`La simulación se queda en el capítulo ${st.chapter} de ${def.chapters.length}`);
    def.suspects.forEach((s) => { if (s.clearedBy.length && !st.suspectCleared(s.id)) E(`No se puede descartar a ${s.name}`); });
    def.solution.methods.concat(def.solution.motives).forEach((o) => { if (o.needs && o.needs.length && !o.needs.every((c) => st.hasClue(c))) E(`Faltan pruebas para la opción ${o.id}`); });
    const proofGot = def.solution.proof.filter((c) => st.hasClue(c)).length;
    if (proofGot < 3) E('Hay menos de 3 pruebas alcanzables contra el culpable');
    ['easy', 'normal', 'hard'].forEach((dn) => {
      const s2 = new CaseState(def, dn);
      s2.gateOff = true;
      Object.keys(st.clues).forEach((c) => s2.addClue(c));
      s2.chapter = def.chapters.length;
      const opts = s2.boardOptions();
      const r = s2.accuse({ culprit: def.solution.culprit, method: def.solution.method, motive: def.solution.motive, proof: def.solution.proof.slice(0, 3) });
      if (!r.ok) E(`La solución correcta no funciona en dificultad ${dn} (${JSON.stringify(r)})`);
      if (!opts.suspects.find((s) => s.id === def.solution.culprit)) E('El culpable no aparece en el tablero');
    });
    return { ok: errors.length === 0, errors, warnings, reached: st.clueOrder.length, total: clueIds.length, chapter: st.chapter };
  };
  // si algo inesperado revienta dentro del validador (caso muy mal formado), se informa como error en vez de colgar el juego o las pruebas
  G.validateCase = function (def) {
    try { return validateInner(def); } catch (e) {
      return { ok: false, errors: ['Error interno al validar el caso (probablemente un dato mal formado): ' + (e && e.message ? e.message : e)], warnings: [], reached: 0, total: 0, chapter: 0 };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
