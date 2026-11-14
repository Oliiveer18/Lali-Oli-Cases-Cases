// compile.js — COMPILADOR Y GENERADOR (fábrica de casos, fase 3D-1).
// G.compileBible(bible, { mood }?) → def (formato oficial v1). G.generateCase(seed, { level, form, mood, register }) → { def, bible, review, meter, attempts, code } | { error, attempts, code }.
// Puro y determinista: sin Math.random ni Date, solo G.rng. Reglas: docs/BIBLIA_DEL_CASO.md («Cómo se compila»). Referencia: tools/spike_compilador.js.
// Carga: require('./tools/load_g.js')(['bible.js','gen_data.js','gen_truth.js','gen_clues.js','compile.js'])
(function (root) {
  'use strict';
  const G = root.G;
  const SLOTS = [[3, 3], [9, 3], [3, 6], [9, 6]]; // baldosas de objetos (las de arranque y personajes quedan libres)
  const SPR = ['crate', 'table', 'drawer', 'locker'];
  const ICON = { física: 'ico_lupa', documento: 'paper', grabación: 'ico_rec', testimonio: 'ico_star' };
  // 4B-2: contrae «de el» → «del» y «a el» → «al» (los objetos llevan artículo: «la leyenda de el saco» queda «la leyenda del saco»)
  const fill = (tpl, o) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m)).replace(/(^|[^\p{L}\p{N}_])([Dd])e el /gu, '$1$2el ').replace(/(^|[^\p{L}\p{N}_])([Aa]) el /gu, '$1$2l ');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const dot = (s) => String(s).replace(/[.\s]+$/, '');

  // Lo que dice un personaje al contar una pista de testimonio: la misma frase de la pista pasada a primera persona
  // (en la tarjeta de pista se lee «Galleta vio a Trufa…»; en boca de Galleta tiene que ser «Vi a Trufa…»). Si la frase no encaja con ninguna plantilla, queda tal cual.
  const FIRST = [
    [/^(.+?) vio a (.+?) merodeando en (.+?) poco antes de que desapareciera (.+)\.$/, 'Vi a $2 merodeando en $3 poco antes de que desapareciera $4.'],
    [/^Al llegar (.+?), (.+?) vio a (.+?) a punto de marcharse con mucha prisa\. Poco después faltaba (.+)\.$/, 'Al llegar $1, vi a $3 a punto de marcharse con mucha prisa. Poco después faltaba $4.'],
    [/^(.+?) jura que (.+?) estuvo en (.+?) todo ese rato: (.+)\.$/, 'Le juro que $2 estuvo en $3 todo ese rato: $4.'],
    [/^(.+?) cuenta que (.+?) andaba muy raro esa noche y hasta preguntó por (.+)\.$/, 'Le cuento que $2 andaba muy raro esa noche y hasta preguntó por $3.'],
    // 4A: desliz, testigo ausente y rumores de engañoso
    [/^(.+?) oyó a (.+?) (decir|murmurar|presumir) (.+)$/, 'Oí a $2 $3 $4'],
    [/^(.+?) estuvo en (.+?) de (.+?) a (.+?) y no vio a (.+?) por ninguna parte, (.+)$/, 'Estuve en $2 de $3 a $4 y no vi a $5 por ninguna parte, $6'],
    [/^Según (.+?), que estuvo en (.+?) de (.+?) a (.+?), (.+?) nunca apareció por allí\. (.+)$/, 'Estuve en $2 de $3 a $4 y $5 nunca apareció por allí. $6'],
    [/^(.+?) cuenta que (.+?) no paraba de preguntar por (.+?) y de mirar el reloj\.$/, 'Le cuento que $2 no paraba de preguntar por $3 y de mirar el reloj.'],
    [/^(.+?) jura que (.+?) llevaba toda la noche cuchicheando y escondiendo algo bajo la chaqueta\.$/, 'Le juro que $2 llevaba toda la noche cuchicheando y escondiendo algo bajo la chaqueta.'],
    [/^(.+?) asegura que (.+?) se quedó sin color en cuanto se mencionó (.+)\.$/, 'Le aseguro que $2 se quedó sin color en cuanto se mencionó $3.'],
  ];
  const firstPerson = (text, who) => { for (const [re, to] of FIRST) { const m = re.exec(text); if (m && m[1] === who || (m && re === FIRST[1][0] && m[2] === who)) return text.replace(re, to); } return text; };

  // 4C-1a/4C-2a: plantilla de un lugar (datos de G.GEN_DATA.rooms: lista de variantes con peso) o, si no hay, la sala de relleno de siempre (14×9 vacía con 4 huecos).
  // `pick` = función de azar [0,1) (la del compilador, propia de la semilla): elige una variante según su `weight` (por defecto 1). Sin `pick` devuelve la primera (la de 4C-1a).
  const FILL = { walls: [], decor: [], decals: [], scenery: [], ch: '.', scene: 'interior', weight: 1 };
  G.roomVariants = function (pid) { const v = (G.GEN_DATA.rooms || {})[pid]; return v ? [].concat(v) : []; };
  G.roomTemplate = function (pid, pick) {
    const vs = G.roomVariants(pid);
    if (vs.length) {
      let t = vs[0];
      if (pick && vs.length > 1) { const w = vs.map((v) => (v.weight === undefined ? 1 : v.weight)), tot = w.reduce((a, b) => a + b, 0); let x = pick() * tot; t = vs[vs.length - 1]; for (let i = 0; i < vs.length; i++) { if (x < w[i]) { t = vs[i]; break; } x -= w[i]; } }
      return Object.assign({}, FILL, t);
    }
    return { id: 'relleno', w: 14, h: 9, floor: 'wood', ch: '.', walls: [], doorX: [3, 10], decor: [], decals: [], scenery: [], scene: 'interior', slots: SLOTS.map((q, k) => [q[0], q[1], SPR[k]]) };
  };
  // escena de una plantilla por su id (`room.template`): 'calle' (escenario exterior abierto) o 'interior'; un id desconocido (caso 1, a mano) es 'interior'
  G.roomScene = function (templateId) { const all = Object.values(G.GEN_DATA.rooms || {}); for (let i = 0; i < all.length; i++) { const v = [].concat(all[i]).filter((t) => t.id === templateId)[0]; if (v) return v.scene || 'interior'; } return 'interior'; };
  // mapa de una plantilla: borde de pared, suelo con su carácter y paredes interiores (`walls`)
  G.roomMap = function (t) {
    const rows = [];
    for (let y = 0; y < t.h; y++) {
      let row = '';
      for (let x = 0; x < t.w; x++) row += (x === 0 || y === 0 || x === t.w - 1 || y === t.h - 1 || (t.walls || []).some((q) => q[0] === x && q[1] === y)) ? '#' : (t.ch || '.');
      rows.push(row);
    }
    return rows;
  };

  // ---- 4C-4a: AMBIENTE. `def.mood` ∈ claro · inquietante · macabro, elegido por la semilla con su propio azar (seed ^ 0x4d00d) y estos pesos (ajustables tras jugar; el macabro es «a veces», nunca el tono general).
  // Con { mood } en las opciones se fuerza (muestras, pruebas y el futuro selector de 4E-2); entonces el código de caso no basta para reproducir el caso.
  // (G.MOODS y G.MATIZ_COUNT viven en bible.js desde 4C-4c-1: la biblia ya lleva `mood`)
  G.MOOD_WEIGHTS = { claro: 50, inquietante: 32, macabro: 18 };
  G.pickMood = function (seed) {
    const W = G.MOOD_WEIGHTS, tot = G.MOODS.reduce((a, k) => a + W[k], 0);
    let x = G.rng(((seed >>> 0) ^ 0x4d00d) >>> 0)() * tot;
    for (let i = 0; i < G.MOODS.length; i++) { x -= W[G.MOODS[i]]; if (x < 0) return G.MOODS[i]; }
    return 'claro';
  };

  // ---- 4C-4b: LUZ, NIEBLA Y SONIDO DEL AMBIENTE. G.moodFx(def, plantilla) → null (claro, o un caso sin `mood` como el caso 1: no se dibuja ni suena nada)
  // o los ajustes del ambiente: `dark` (opacidad de la capa oscura), `flicker` (cuánto parpadea la bombilla), `vig` (viñetas extra), `hum` (volumen del zumbido 0..1),
  // `creak` (segundos de media entre crujidos), niebla en la calle y polvo en los interiores. Solo lo lee el motor al dibujar y sonar: no toca hechos, pistas ni red.
  G.MOOD_FX = {
    inquietante: { dark: 0.14, flicker: 0.5, vig: 1, hum: 0.5, creak: 55, fogA: { calle: 0.16, interior: 0.30 }, dipEvery: 11 },
    macabro: { dark: 0.26, flicker: 1.0, vig: 2, hum: 1.0, creak: 28, fogA: { calle: 0.24, interior: 0.45 }, dipEvery: 7 },
  };
  G.moodFx = function (def, templateId) {
    const m = def && def.mood, B = m && G.MOOD_FX[m];
    if (!B) return null;
    const calle = G.roomScene(templateId) === 'calle';
    return { mood: m, dark: B.dark, flicker: B.flicker, vig: B.vig, hum: B.hum, creak: B.creak, dipEvery: B.dipEvery, fog: calle ? 'niebla' : 'polvo', fogA: calle ? B.fogA.calle : B.fogA.interior };
  };

  G.compileBible = function (b, opts) {
    const T = G.GEN_DATA.compile, PL = {};
    G.GEN_DATA.places.forEach((p) => { PL[p.id] = p; });
    const r = G.rng(((b.seed >>> 0) ^ 0xc0de) >>> 0), P = b.places.map((p) => p.id), tr = b.truth;
    const cli = b.cast.find((c) => c.role === 'cliente');
    const susIds = b.cast.filter((c) => c.role === 'sospechoso').map((c) => c.id);
    const nameOf = (id) => (b.cast.find((c) => c.id === id) || { name: id }).name;
    const o = { obj: b.object.name, Obj: cap(b.object.name), cli: cli.name, n: susIds.length };
    // 4B-2: el TONO del caso sale de la semilla con su propio azar (no cambia lo que ya salía de r); cada personaje tiene su azar propio
    const tone = T.tones[(G.rng(((b.seed >>> 0) ^ 0x70e5) >>> 0)() * T.tones.length) | 0];
    // 4C-4a: ambiente. Los textos oscuros salen de `dark` (banco del tono y del ambiente) con azares PROPIOS (mdr, cr): en `claro` no se usa nada y el caso sale como antes; en los demás solo cambian TEXTOS (los hechos no).
    const MD = T.mood, mood = opts && G.MOODS.indexOf(opts.mood) >= 0 ? opts.mood : (b.mood && G.MOODS.indexOf(b.mood) >= 0 ? b.mood : G.pickMood(b.seed)), dark = mood === 'claro' ? null : MD.tone[tone.id][mood];
    const mdr = G.rng(((b.seed >>> 0) ^ 0x4d00e) >>> 0), pairText = (p2) => p2[0] + ' ' + p2[1], rawOff = G.hash(b.code + ':raro') % 2;
    const pick = (rr, a) => a[(rr() * a.length) | 0];
    // A4 3/4-b1: VOZ alternada. `who` solo decide el retrato y la voz del cartel (el motor guarda aparte quién lo hizo: `by`). Sin herramienta: par/impar de un hash propio (no gasta azar). Las de herramienta siguen con su dueño (G.toolOwner).
    const voz = (id) => (G.hash(b.code + ':voz:' + id) % 2 ? 'luna' : 'rex');
    const timeline = (b.truth.timeline || []), W = b.truth.window;
    const x1Of = (id) => { const e = timeline.find((q) => q.who === id && q.t < W.to && W.from < q.until && G.GEN_DATA.pastFirst[q.doing]); return e ? G.GEN_DATA.pastFirst[e.doing] : null; };
    const gagOff = G.hash(b.code + ':gag') % tone.gag.length; // cada personaje cuenta una frase distinta del gag (5 frases; con 6 personajes solo se repite una)
    const say1 = (tpl, v, x1) => fill(tpl, Object.assign({ x1: x1 || '', X1: x1 ? cap(x1) : '' }, v));

    // ---- 4C-1a: cada sala sale de la plantilla de su lugar (G.GEN_DATA.rooms; si un lugar no tuviera plantilla, sala de relleno 14×9). Las puertas van en cadena por la pared norte.
    // 4C-2a: la variante de cada sala sale de la semilla con un azar PROPIO (seed ^ 0x5ce4e; no altera ni la biblia ni la mecánica de 4C-1b, que tiene el suyo) y del peso de cada variante.
    const rooms = {}, used = {}, tpl = {}, rr = G.rng(((b.seed >>> 0) ^ 0x5ce4e) >>> 0);
    P.forEach((pid, i) => {
      const t = tpl[pid] = G.roomTemplate(pid, rr), doors = [];
      if (i > 0) doors.push({ id: `${pid}_a_${P[i - 1]}`, x: t.doorX[0], y: 0, wall: 'n', sprite: 'door', to: { room: P[i - 1], door: `${P[i - 1]}_a_${pid}` }, label: b.places[i - 1].name });
      if (i < P.length - 1) doors.push({ id: `${pid}_a_${P[i + 1]}`, x: t.doorX[1], y: 0, wall: 'n', sprite: 'door', to: { room: P[i + 1], door: `${P[i + 1]}_a_${pid}` }, label: b.places[i + 1].name });
      const room = { name: b.places[i].name, template: t.id, floor: t.floor, map: G.roomMap(t), props: t.scenery.map((q, k) => ({ id: 'deco' + k, sprite: q.sprite, x: q.x, y: q.y, solid: true })), doors };
      if (t.wallStyle) room.wallStyle = t.wallStyle;
      if (t.ambient) room.ambient = t.ambient;
      if (t.decor.length) room.decor = t.decor.map((q) => Object.assign({}, q));
      if (t.decals.length) room.decals = t.decals.map((q) => Object.assign({}, q));
      rooms[pid] = room;
    });

    // ---- 4C-1b: mecánica con herramientas. El conjunto de herramientas del caso sale de la semilla con un azar PROPIO (no altera nada de lo demás); a cada herramienta le toca una pista de objeto distinta:
    // ganzúa → un documento en la «cerradura» de su sala; uv → un documento con tinta invisible en el «rincón oscuro»; lupa → una pista física (si no hay, una foto) en un hueco normal. Si no hay pista que encaje, esa herramienta se omite.
    const MECH = T.mech, mr = G.rng(((b.seed >>> 0) ^ 0x7001) >>> 0), want0 = MECH.sets[(mr() * MECH.sets.length) | 0], toolOf = {}, taken = {};
    // A4 3/4-b2 (GEN_VERSION >= 6): CUOTA, no azar. Siempre se intenta una pista por herramienta (lupa, ganzúa, UV; la grabadora llega con las charlas con pista). Con GEN_VERSION 5 el conjunto sale del azar de siempre (casos idénticos).
    const want = G.GEN_VERSION >= 6 ? ['lupa', 'ganzua', 'uv'] : want0;
    const shuf = (a) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = (mr() * (i + 1)) | 0, t = o[i]; o[i] = o[j]; o[j] = t; } return o; };
    ['ganzua', 'uv', 'lupa'].forEach((tl) => {
      if (want.indexOf(tl) < 0) return;
      const fit = (kinds) => shuf(b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && kinds.indexOf(c.kind) >= 0 && (tl === 'lupa' || (tpl[c.source.place].special || {})[tl === 'ganzua' ? 'cerradura' : 'rincon'])));
      const c = (tl === 'lupa' ? fit(['física']).concat(fit(['grabación'])) : fit(['documento']))[0];
      if (c) { taken[c.id] = true; toolOf[c.id] = tl; }
    });
    // ---- 4C-2b-1: empujar. Azar PROPIO (no toca lo demás: sin empujar el caso sale idéntico que antes). Como mucho una vez por caso: una pista física o documento de objeto, que no se haya llevado ya una herramienta,
    // queda tapada por un objeto pesado en el hueco «empujable» de su sala; aparece (visible por bandera) al apartarlo entre los dos (paso `coop`). Si no hay pista que encaje, se omite.
    const pr = G.rng(((b.seed >>> 0) ^ 0x9051) >>> 0), pushOf = {};
    if (pr() < MECH.pushChance) {
      const cand = b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && MECH.pushKinds.indexOf(c.kind) >= 0 && (tpl[c.source.place].special || {}).empujable);
      if (cand.length) {
        const c = cand[(pr() * cand.length) | 0], pu = pick(pr, MECH.pushables), hid = pick(pr, MECH.hidden[c.kind]);
        taken[c.id] = true; pushOf[c.id] = { text: pick(pr, MECH.push), sprite: pu.sprite, label: pu.label, hidden: hid };
      }
    }
    // ---- 4C-2b-2: sigilo. Azar PROPIO (no toca lo demás). Como mucho una vez por caso: una pista física o documento de objeto, sin herramienta ni empujón, en una sala donde está un personaje; ese personaje vigila.
    const castAt = {};
    b.cast.forEach((c) => { const f = b.truth.timeline.find((e) => e.who === c.id); (castAt[f ? f.place : P[0]] = castAt[f ? f.place : P[0]] || []).push(c); });
    const wr = G.rng(((b.seed >>> 0) ^ 0x5161) >>> 0), watchOf = {};
    if (wr() < MECH.watchChance) {
      const cand = b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && MECH.watchKinds.indexOf(c.kind) >= 0 && (castAt[c.source.place] || []).length);
      if (cand.length) {
        const c = cand[(wr() * cand.length) | 0], w = pick(wr, castAt[c.source.place]);
        taken[c.id] = true; watchOf[c.id] = { npc: w.id, text: pick(wr, MECH.watch), rhythm: pick(wr, MECH.watchRhythms), spotted: pick(wr, MECH.watchSpotted) };
      }
    }
    const pushProps = (c) => {
      const o = pushOf[c.id], sp = tpl[c.source.place].special.empujable, flag = 'movido_' + c.id;
      return [
        { id: 'push_' + c.id, sprite: o.sprite, x: sp.x, y: sp.y, solid: true, label: o.label, shimmer: true, steps: [{ tool: 'coop', time: 2.2, who: 'luna', text: o.text, fx: { flag, moveProp: { id: 'push_' + c.id, dx: sp.dx, dy: sp.dy } } }], doneText: MECH.done.push },
        { id: 'obj_' + c.id, sprite: o.hidden, x: sp.x, y: sp.y, solid: false, label: c.title, visible: { flag }, shimmer: true, steps: [{ tool: null, who: voz(c.id), text: c.text, clue: c.id }], doneText: 'Ya lo has examinado.' },
      ];
    };
    const mechProp = (c, tl, sl) => {
      const who = G.toolOwner(tl) || 'rex', text = pick(mr, MECH[tl]) + ' ' + c.text;
      if (tl === 'ganzua') {
        const sp = tpl[c.source.place].special.cerradura, flag = 'abierto_' + c.id, open = sp.open === undefined ? 'drawer' : sp.open;
        const pr = { id: 'obj_' + c.id, sprite: sp.sprite || 'drawer_locked', x: sp.x, y: sp.y, solid: true, label: sp.label || MECH.labels.ganzua, shimmer: true, steps: [{ tool: 'ganzua', time: 2.0, who, text, clue: c.id, fx: { flag } }], doneText: MECH.done.ganzua };
        if (open) pr.swap = { flag, sprite: open };
        return pr;
      }
      if (tl === 'uv') { const sp = tpl[c.source.place].special.rincon; return { id: 'obj_' + c.id, sprite: 'uv_text', x: sp.x, y: sp.y, dy: -2, solid: false, uvOnly: true, label: MECH.labels.uv, shimmer: true, steps: [{ tool: 'uv', who, text, clue: c.id }], doneText: MECH.done.uv }; }
      return { id: 'obj_' + c.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: c.title, shimmer: true, steps: [{ tool: 'lupa', who, text, clue: c.id }], doneText: MECH.done.lupa };
    };

    // ---- pistas: las de objeto van a un hueco de su sala (o al hueco especial de su herramienta); las de personaje, a un tema de su npc
    const clues = {}, byNpc = {};
    b.clues.forEach((c) => {
      clues[c.id] = { title: c.title, icon: ICON[c.kind] || 'ico_clue', kind: c.kind, text: c.text, sus: c.points || {} };
      if (c.source.type === 'prop') {
        const tl = toolOf[c.id];
        if (tl === 'ganzua' || tl === 'uv') { rooms[c.source.place].props.push(mechProp(c, tl)); return; } // hueco especial: no gasta un hueco normal
        if (pushOf[c.id]) { pushProps(c).forEach((q) => rooms[c.source.place].props.push(q)); return; } // hueco especial «empujable»: tampoco gasta un hueco normal
        const n = (used[c.source.place] = used[c.source.place] || 0);
        used[c.source.place]++;
        const sl = tpl[c.source.place].slots[n];
        if (!sl) throw new Error(`compileBible: la sala «${c.source.place}» no tiene hueco para el objeto n.º ${n + 1} (plantilla ${tpl[c.source.place].id})`);
        const wo = watchOf[c.id];
        rooms[c.source.place].props.push(tl ? mechProp(c, tl, sl) : Object.assign({ id: 'obj_' + c.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: c.title, shimmer: true, steps: [wo ? { tool: null, time: MECH.watchTime, who: voz(c.id), text: wo.text + ' ' + c.text, clue: c.id } : { tool: null, who: voz(c.id), text: c.text, clue: c.id }], doneText: 'Ya lo has examinado.' }, wo ? { watcher: wo.npc } : {}));
      } else (byNpc[c.source.npc] = byNpc[c.source.npc] || []).push(c);
    });

    const liesBy = {}; b.lies.forEach((l) => { liesBy[l.who] = l; });
    // ---- reacción a las pruebas: por pista concreta (el culpable solo confiesa ante lo que lo señala; un inocente que miente, solo ante lo que desmonta su mentira)
    const decoyIds = (b.deceptive || []).map((d) => d.who);
    const evid = (c, v, rr) => {
      if (c.role === 'cliente') return { '*': [['Vaya, qué interesante.']] };
      const ev = { '*': [{ say: [pick(rr, v.deny)] }] }, x1 = x1Of(c.id);
      if (c.id === tr.culprit) b.proof.forEach((k) => { ev[k] = [{ say: [pick(rr, v.confess)] }]; });
      else {
        if (liesBy[c.id]) liesBy[c.id].refutedBy.forEach((k) => { if (b.clues.find((x) => x.id === k && x.role !== 'prueba')) ev[k] = [{ say: [x1 ? say1(pick(rr, v.admit), {}, x1) : T.admitMissing] }]; });
        // sospechoso engañoso: al enseñarle lo que lo hacía parecer culpable da su explicación tonta (no es una confesión)
        if (decoyIds.indexOf(c.id) >= 0) b.clues.filter((x) => x.role === 'falsa' && x.points && x.points[c.id]).forEach((k) => { ev[k.id] = [{ say: [x1 ? say1(pick(rr, v.decoy), {}, x1) : T.decoyMissing] }]; });
      }
      return ev;
    };

    // ---- 4C-4c-2: giro del testigo (solo macabro). Azar PROPIO (seed ^ 0x4c4c3): a veces uno de los personajes (no el cliente) insiste en haber visto a alguien que ya no estaba. Solo texto, sin datos del caso.
    const MX = T.macabro, giroPair = (() => {
      if (mood !== 'macabro') return null;
      const gr = G.rng(((b.seed >>> 0) ^ 0x4c4c3) >>> 0), roll = gr(), cand = b.cast.filter((c) => c.role !== 'cliente');
      if (roll >= MX.giro.chance || !cand.length) return null;
      return { id: cand[(gr() * cand.length) | 0].id, pair: MX.giro.pairs[(gr() * MX.giro.pairs.length) | 0] };
    })();
    // ---- personajes
    const npcs = {}, placement = {};
    b.cast.forEach((c, i) => {
      const v = T.voice[c.trait] || T.voice.amable, topics = [], al = b.alibis[c.id], l = liesBy[c.id];
      const cr = G.rng(G.hash(b.code + ':mood:' + c.id) >>> 0), rr = G.rng(G.hash(b.code + ':' + c.id) >>> 0), others = b.cast.filter((x) => x.id !== c.id && x.role !== 'cliente');
      const other = others.length ? others[(rr() * others.length) | 0].name : cli.name;
      const vars = { who: c.name, obj: b.object.name, cli: cli.name, other };
      if (c.role === 'cliente') {
        const tell0 = pick(rr, tone.cTell);
        topics.push({ id: 'caso', label: T.clientAsk, responses: [[fill(dark ? pairText(pick(cr, dark.cTell)) : tell0, { obj: b.object.name, loc: PL[b.object.place].loc })]] });
        topics.push({ id: 'f_sospechas', label: T.labels.clientSus, responses: [[pick(rr, T.clientSus)]] });
      } else {
        const loc = PL[al.claim.place].loc, said = l ? l.said : fill('Estuve en {loc} de {desde} a {hasta}, sin moverme.', { loc, desde: G.minToStr(al.claim.from), hasta: G.minToStr(al.claim.to) });
        topics.push({ id: 'coartada', label: T.askWhere, responses: [l ? { say: [said], fx: { flag: 'lie_' + c.id } } : { say: [said] }] });
        const kind = ['work', 'cli', 'oth'][(rr() * 3) | 0];
        topics.push({ id: 'f_' + kind, label: T.labels[kind], responses: [[fill(pick(rr, v[kind]), vars)]] });
      }
      // el gag del tono: cada personaje cuenta una frase distinta del mismo banco
      topics.push({ id: 'f_gag', label: tone.gagLabel, responses: [[tone.gag[(gagOff + i) % tone.gag.length]]] });
      // 4C-4a: «¿Ha notado algo raro?» (susto + remate según su rasgo). macabro: todos; inquietante: uno de cada dos (con desfase de la semilla)
      if (dark && (mood === 'macabro' || (i + rawOff) % 2 === 0)) topics.push({ id: 'f_raro', label: MD.labels.raro, responses: [[fill(pairText(pick(cr, MD.traits[T.voice[c.trait] ? c.trait : 'amable'][mood])), vars)]] });
      if (giroPair && giroPair.id === c.id) topics.push({ id: 'f_giro', label: MX.giro.label, responses: [[pairText(giroPair.pair)]] }); // 4C-4c-2
      (byNpc[c.id] || []).forEach((k) => topics.push({ id: k.source.topic, label: T.askSaw, responses: [{ say: [firstPerson(k.text, c.name)], fx: { clue: k.id } }] }));
      const greet0 = c.role === 'cliente' ? pick(rr, tone.cFirst) : pick(rr, v.first), greet = dark && c.role === 'cliente' ? pairText(pick(cr, dark.cFirst)) : greet0;
      npcs[c.id] = {
        name: c.name, title: c.role === 'cliente' ? 'Cliente' : 'Sospechoso', look: c.look,
        first: [fill(greet, vars) + (c.role === 'cliente' || i % 2 === 0 ? ' ' + tone.tag : '')], topics,
        chat: v.chat.map((t) => [t]), press: [{ when: { pressureMin: 3 }, say: [pick(rr, v.pressHard)] }, { say: [pick(rr, v.press)] }],
        evidenceDefault: [pick(rr, v.deny)],
        evidence: evid(c, v, rr),
      };
      Object.keys(watchOf).forEach((k) => { if (watchOf[k].npc === c.id) npcs[c.id].watch = Object.assign({}, watchOf[k].rhythm, { spotted: watchOf[k].spotted }); });
      const first = b.truth.timeline.find((e) => e.who === c.id);
      placement[c.id] = [{ ch: 1, room: first ? first.place : P[0], x: 5 + i, y: 5, face: 'down' }];
    });

    // ---- 4C-3b-2: ESCENA CON ALIADO DE POLICÍA. Azar propio (seed ^ 0xa11e5): no altera nada anterior. Va a una sala del caso (exterior en una plantilla de calle; si no, comisaría, interrogatorio o reconstrucción en una sala de interior)
    // con su objeto de escena en el hueco reservado `special.escena` (y el coche, de 2 baldosas, en `special.coche`). El aliado ayuda poco y NUNCA resuelve: el parte (ventana del robo y objeto), un consejo sobre el lugar de una pista de objeto y una teoría graciosa sin nombres.
    {
      const AL = T.ally, ar = G.rng(((b.seed >>> 0) ^ 0xa11e5) >>> 0), roll = ar(), roll2 = ar(), streetRoom = P.find((pid) => G.roomScene(tpl[pid].id) === 'calle'), inner = P.filter((pid) => G.roomScene(tpl[pid].id) !== 'calle');
      const kind = streetRoom && roll2 < AL.exteriorChance ? 'exterior' : ['comisaria', 'interrogatorio', 'reconstruccion'][(ar() * 3) | 0], room = kind === 'exterior' ? streetRoom : inner[(ar() * inner.length) | 0];
      if (roll < AL.chance && room && tpl[room].special.escena && (kind !== 'exterior' || tpl[room].special.coche)) {
        const K = AL.kinds[kind], rk = AL.ranks[pick(ar, AL.byKind[kind])], pKey = ['serio', 'torpe', 'colega'][(ar() * 3) | 0], pers = AL.personas[pKey], es = tpl[room].special.escena, co = tpl[room].special.coche;
        const name = rk.title + ' ' + pick(ar, rk.names), look = pick(ar, rk.looks);
        const mine = b.clues.filter((c) => c.source.type === 'prop'), hint = mine.length ? mine[(ar() * mine.length) | 0] : null;
        if (kind === 'exterior') { rooms[room].props.push({ id: 'poli_coche', sprite: K.sprite, x: co.x, y: co.y, w: 2, h: 1, solid: true, label: K.label }); rooms[room].props.push({ id: 'poli_cono', sprite: 'cone', x: es.x, y: es.y, solid: true, label: K.cone }); }
        else rooms[room].props.push({ id: 'poli_escena', sprite: K.sprite, x: es.x, y: es.y, solid: true, label: K.label });
        const vv = { who: name, obj: b.object.name, desde: G.minToStr(W.from), hasta: G.minToStr(W.to), loc: PL[b.object.place].loc }, tops = [{ id: 'a_hecho', label: AL.labels.hecho, responses: [[fill(pick(ar, pers.hecho), vv)]] }];
        if (hint) tops.push({ id: 'a_mira', label: AL.labels.mira, responses: [[fill(pick(ar, pers.mira), Object.assign({}, vv, { loc: PL[hint.source.place].loc }))]] });
        tops.push({ id: 'a_error', label: AL.labels.error, responses: [[pick(ar, pers.error)]] });
        if (dark) tops.push({ id: 'a_noche', label: MD.labels.noche, responses: [[fill(pairText(pick(G.rng(G.hash(b.code + ':mood:aliado') >>> 0), MD.ally[pKey][mood])), vv)]] }); // 4C-4a: el aliado también se inquieta (con remate)
        const taken2 = {}; Object.keys(placement).forEach((id) => { placement[id].forEach((q) => { if (q.room === room) taken2[q.x] = true; }); });
        let ax = 11; while (ax > 5 && taken2[ax]) ax--;
        const deny = pick(ar, pers.deny);
        npcs.aliado = { name, title: rk.title, look, first: [fill(pick(ar, pers.first), vv)], topics: tops, chat: pers.chat.map((t) => [t]), press: [{ when: { pressureMin: 3 }, say: [pers.press[1]] }, { say: [pers.press[0]] }], evidenceDefault: [deny], evidence: { '*': [{ say: [deny] }] } };
        placement.aliado = [{ ch: 1, room, x: ax, y: 5, face: 'down' }];
      }
    }

    // ---- A4 HERR-1 3/4-b1: CHARLA GRABADA. Azar PROPIO (seed ^ 0x1157e; no altera nada anterior: sin charla el caso sale como antes). En ~40 % de los casos dos sospechosos (no gatos, ni aliado, ni vigilantes de `watchOf`)
    // charlan en el «rincón de charla» (`template.listen`) de una sala del caso durante los capítulos 2 (`placement` ch 2) y vuelven a su sitio en el 3. La grabadora (Lali) los graba: objeto `rec_charla` SIN `clue`
    // (curiosidad grabada: no toca la biblia ni las pistas; el medidor no la cuenta como paso de la historia). Los textos viven en `GEN_DATA.compile.listen` por ambiente: humor, nada del crimen.
    let listenOf = null;
    {
      const LS = T.listen, lr = G.rng(((b.seed >>> 0) ^ 0x1157e) >>> 0), roll = lr();
      const watchers = Object.keys(watchOf).map((k) => watchOf[k].npc);
      const cand = susIds.filter((id) => npcs[id] && !npcs[id].cat && watchers.indexOf(id) < 0), lrooms = P.filter((pid) => tpl[pid].listen);
      if (LS && roll < LS.chance && cand.length >= 2 && lrooms.length) {
        const pid = lrooms[(lr() * lrooms.length) | 0], L = tpl[pid].listen, sh = cand.slice();
        for (let i = sh.length - 1; i > 0; i--) { const j = (lr() * (i + 1)) | 0, tt = sh[i]; sh[i] = sh[j]; sh[j] = tt; }
        const ia = sh[0], ib = sh[1], bank = LS.mood[mood], vars = { a: nameOf(ia), b: nameOf(ib) };
        const lines = bank.chats[(lr() * bank.chats.length) | 0].map((t, i) => ({ who: i % 2 === 0 ? ia : ib, text: fill(t, vars) }));
        const secs = Math.round(lines.length * (G.LISTEN_LINE_SECONDS || 1.2) * 100) / 100; // cada frase necesita su tiempo (validador: G.listenMinSeconds)
        rooms[pid].props.push({ id: 'rec_charla', sprite: null, x: L.x, y: L.y, w: L.w, h: L.h, solid: false, label: pick(lr, LS.label), shimmer: true, listen: true, chapterMin: 2, steps: [{ tool: 'grabadora', time: secs, who: G.toolOwner ? G.toolOwner('grabadora') || 'luna' : 'luna', text: pick(lr, bank.rec) }], chat: { a: ia, b: ib, lines }, doneText: LS.done });
        [[ia, L.a], [ib, L.b]].forEach(([id, sp]) => { const o = placement[id][0]; placement[id] = [o, { ch: 2, room: pid, x: sp.x, y: sp.y, face: sp.face }, Object.assign({}, o, { ch: 3 })]; }); // la lista va ordenada por `ch` (placementOf toma la última con ch <= capítulo)
        listenOf = { room: pid, L };
      }
    }

    // ---- 4C-4b: objetos de ambiente según `mood` (azar PROPIO seed ^ 0xa7405: no altera nada de lo demás). Solo decoración: charcos y manchas son decals (no estorban), la silla es un objeto sólido
    // sin pasos y la sombra una ventana animada en la pared norte. La silla solo va donde no corta ningún camino ni tapa el acceso a un objeto o puerta; si no hay sitio válido, se omite.
    {
      const AT = T.atmos, ar = G.rng(((b.seed >>> 0) ^ 0xa7405) >>> 0), AM = AT.mood[mood];
      const dims = (room) => ({ w: room.map[0].length, h: room.map.length });
      const solidGrid = (room, extra) => {
        const { w, h } = dims(room), g = [];
        for (let y = 0; y < h; y++) { g.push([]); for (let x = 0; x < w; x++) g[y].push(room.map[y][x] === '#'); }
        room.props.forEach((q) => { if (q.solid) for (let yy = 0; yy < (q.h || 1); yy++) for (let xx = 0; xx < (q.w || 1); xx++) if (g[q.y + yy] && g[q.y + yy][q.x + xx] !== undefined) g[q.y + yy][q.x + xx] = true; });
        if (extra) g[extra.y][extra.x] = true;
        return g;
      };
      const reach = (g, w, h, sx, sy) => { const seen = new Set([sy * w + sx]), st = [[sx, sy]]; while (st.length) { const [x, y] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || g[ny][nx] || seen.has(ny * w + nx)) return; seen.add(ny * w + nx); st.push([nx, ny]); }); } return seen; };
      const touches = (r, w, x, y, ww, hh) => { for (let yy = y - 1; yy <= y + hh; yy++) for (let xx = x - 1; xx <= x + ww; xx++) { if (xx >= x && xx < x + ww && yy >= y && yy < y + hh) continue; if (r.has(yy * w + xx)) return true; } return false; };
      // Como `touches`, pero SOLO baldosas contiguas en cruz (sin diagonales): las situaciones macabras `sit_*` exigen una baldosa de acceso contigua alcanzable (4C-4c-2; test_macabro.js). 4D-2: el relleno `cur_*` las dejaba cerradas con la diagonal como única salida (semillas 427 macabro, 1134 y 1374 inquietante)
      const touchesOrtho = (r, w, x, y, ww, hh) => { for (let k = 0; k < ww; k++) if (r.has((y - 1) * w + x + k) || r.has((y + hh) * w + x + k)) return true; for (let k = 0; k < hh; k++) if (r.has((y + k) * w + x - 1) || r.has((y + k) * w + x + ww)) return true; return false; };
      const okTiles = (room, tile) => { // ¿conserva todo su alcance la sala si pongo algo sólido en `tile`?
        const { w, h } = dims(room);
        const r0 = reach(solidGrid(room), w, h, 6, 7), r1 = reach(solidGrid(room, tile), w, h, 6, 7);
        if (r1.size !== r0.size - (r0.has(tile.y * w + tile.x) ? 1 : 0)) return false; // cortaría una zona
        const near = (r, q) => touches(r, w, q.x, q.y, q.w || 1, q.h || 1);
        return room.props.every((q) => !q.steps || !near(r0, q) || near(r1, q)) && room.doors.every((d) => !r0.has(w + d.x) || r1.has(w + d.x));
      };
      const reservedOf = (pid) => {
        const t = tpl[pid], res = new Set(), add = (x, y) => res.add(y * 64 + x);
        add(6, 7); add(7, 7); for (let x = 5; x <= 11; x++) add(x, 5);
        (t.doorX || []).forEach((x) => { add(x, 1); add(x, 0); });
        Object.keys(t.special || {}).forEach((k) => { const sp = t.special[k]; add(sp.x, sp.y); if (sp.dx !== undefined) add(sp.x + sp.dx, sp.y + sp.dy); if (k === 'coche') add(sp.x + 1, sp.y); });
        (t.slots || []).forEach((q) => add(q[0], q[1]));
        (t.crowd || []).forEach((q) => add(q[0], q[1]));
        if (listenOf && listenOf.room === pid) { const L = listenOf.L; add(L.a.x, L.a.y); add(L.b.x, L.b.y); add(L.x, L.y + 1); add(L.x + 1, L.y + 1); } // A4 3/4-b1: personajes de la charla y hueco del detective (la zona ya está en props)
        (rooms[pid].props || []).forEach((q) => { for (let yy = 0; yy < (q.h || 1); yy++) for (let xx = 0; xx < (q.w || 1); xx++) add(q.x + xx, q.y + yy); });
        (rooms[pid].decor || []).concat(rooms[pid].decals || []).forEach((q) => add(q.x, q.y));
        return res;
      };
      const freeTiles = (pid) => { const room = rooms[pid], res = reservedOf(pid), { w, h } = dims(room), out = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (room.map[y][x] !== '#' && !res.has(y * 64 + x)) out.push({ x, y }); return out; };
      const pickRoom = (list) => (list.length ? list[(ar() * list.length) | 0] : null);
      const animIn = (room) => (room.props || []).filter((q) => G.ANIMS && G.ANIMS[q.sprite]).length + (room.decor || []).concat(room.decals || []).filter((q) => G.ANIMS && G.ANIMS[q.sprite]).length;
      const puddle = (sprite) => { const pid = pickRoom(P), fr = pid ? freeTiles(pid) : []; if (!fr.length) return; const t = fr[(ar() * fr.length) | 0]; (rooms[pid].decals = rooms[pid].decals || []).push({ sprite, x: t.x, y: t.y }); };
      if (ar() < AM.puddle) { puddle(AT.puddles[(ar() * AT.puddles.length) | 0]); if (ar() < AT.second) puddle(AT.puddles[(ar() * AT.puddles.length) | 0]); }
      if (ar() < AM.stain) { puddle(AT.stain); if (ar() < AT.second) puddle(AT.stain); }
      const inside = P.filter((pid) => (tpl[pid].scene || 'interior') !== 'calle');
      if (ar() < AM.chair) { // silla que se mece
        const pid = pickRoom(inside), room = pid && rooms[pid];
        if (room && animIn(room) < G.ANIM_MAX_PER_ROOM) {
          const fr = freeTiles(pid); for (let i = fr.length - 1; i > 0; i--) { const j = (ar() * (i + 1)) | 0, tt = fr[i]; fr[i] = fr[j]; fr[j] = tt; }
          const t = fr.find((q) => okTiles(room, q));
          if (t) room.props.push({ id: 'amb_silla', sprite: AT.chair, x: t.x, y: t.y, solid: true });
        }
      }
      if (ar() < AM.window) { // sombra en una ventana de la pared norte
        const pid = pickRoom(inside), room = pid && rooms[pid];
        if (room && animIn(room) < G.ANIM_MAX_PER_ROOM) {
          const w = dims(room).w, busy = new Set((tpl[pid].doorX || []).concat((room.decor || []).filter((q) => q.y <= 1).map((q) => q.x)));
          const xs = []; for (let x = 2; x < w - 2; x++) if (!busy.has(x)) xs.push(x);
          if (xs.length) (room.decor = room.decor || []).push({ sprite: AT.window, x: xs[(ar() * xs.length) | 0], y: 0 });
        }
      }

      // 4C-4c-2: ningún personaje puede quedarse sin acceso por culpa de una situación. Los personajes de pie son obstáculos y el A* del bot y del compañero IA (`G.findPath`), para llegar a alguien, va a la baldosa libre
      // MÁS CERCANA EN ORDEN DE LECTURA, sin comprobar que se pueda llegar a ella: si esa baldosa queda en una bolsa cerrada, no llega nunca (fallo real visto con un cajón junto al aliado). Aquí se comprueba con el mismo criterio.
      const npcOk = (pid, room, tile) => {
        const { w, h } = dims(room), g = solidGrid(room, tile), spots = [];
        Object.keys(placement).forEach((id) => { if (npcs[id] && !npcs[id].cat) placement[id].forEach((q) => { if (q.room === pid) spots.push(q); }); });
        spots.forEach((q) => { g[q.y][q.x] = true; });
        const r = reach(g, w, h, 6, 7);
        return spots.every((q) => {
          let best = null, bd = 1e9;
          for (let rr = 1; rr < 6 && !best; rr++) for (let y = q.y - rr; y <= q.y + rr; y++) for (let x = q.x - rr; x <= q.x + rr; x++) if (g[y] && g[y][x] === false) { const d = Math.abs(x - q.x) + Math.abs(y - q.y); if (d < bd) { bd = d; best = [x, y]; } }
          return !!best && r.has(best[1] * w + best[0]);
        });
      };
      // ---- 4C-4c-2: SITUACIONES MACABRAS del escenario. Azar PROPIO (seed ^ 0x4c4c2; se coloca DESPUÉS de lo de arriba, que no cambia). inquietante: 0 o 1 (solo las `soft`); macabro: 1 o 2.
      // Objeto sólido examinable sin pista (susto + remate): no cambia ningún hecho. Solo va en un hueco libre que no corta caminos ni tapa objetos o puertas; si no hay sitio, se omite.
      if (mood !== 'claro') {
        const sr = G.rng(((b.seed >>> 0) ^ 0x4c4c2) >>> 0), S = MX.sit;
        let n = sr() < S.chance[mood] ? 1 : 0; if (n && mood === 'macabro' && sr() < S.second) n = 2; else if (mood === 'macabro') sr();
        const items = S.items.filter((q) => mood === 'macabro' || q.soft);
        for (let i = items.length - 1; i > 0; i--) { const j = (sr() * (i + 1)) | 0, tt = items[i]; items[i] = items[j]; items[j] = tt; }
        const rl = P.slice(); for (let i = rl.length - 1; i > 0; i--) { const j = (sr() * (i + 1)) | 0, tt = rl[i]; rl[i] = rl[j]; rl[j] = tt; }
        let placed = 0;
        for (let k = 0; k < items.length && placed < n; k++) {
          const it = items[k];
          for (let q = 0; q < rl.length; q++) {
            const pid = rl[(q + placed) % rl.length], room = rooms[pid], fr = freeTiles(pid);
            for (let i = fr.length - 1; i > 0; i--) { const j = (sr() * (i + 1)) | 0, tt = fr[i]; fr[i] = fr[j]; fr[j] = tt; }
            const { w: rw, h: rh } = dims(room), r0 = reach(solidGrid(room), rw, rh, 6, 7); // 4C-4c-2: que se pueda llegar a examinarla (con una baldosa contigua alcanzable —no en diagonal—; no en una bolsa de suelo ya cerrada por otros objetos: semillas 351, 422 y 740, plantilla calle_plaza)
            const t = fr.find((c2) => okTiles(room, c2) && npcOk(pid, room, c2) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some((dd) => r0.has((c2.y + dd[1]) * rw + c2.x + dd[0])));
            if (!t) continue;
            room.props.push({ id: 'sit_' + placed, sprite: it.sprite, x: t.x, y: t.y, solid: true, label: it.label, shimmer: true, steps: [{ tool: null, who: voz('sit_' + placed), text: it.text[0] + ' ' + it.text[1] }], doneText: S.done });
            placed++; break;
          }
        }
      }

      // ---- 4D-2: RELLENO DE DURACIÓN. Azar PROPIO (seed ^ 0x4d2d2; va DESPUÉS de todo lo anterior, que no cambia). Si la duración estimada no llega a `targetMin`, añade por turnos un tema de charla a un personaje
      // y un objeto «curiosidad» (sólido, examinable, sin pista) en un hueco que no corta caminos, hasta llegar o agotar los topes. Los hechos no cambian.
      {
        const EX = T.extra, xr = G.rng(((b.seed >>> 0) ^ 0x4d2d2) >>> 0), MC = G.METER_CFG || EX.meter;
        const shuf = (a) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = (xr() * (i + 1)) | 0, tt = o[i]; o[i] = o[j]; o[j] = tt; } return o; };
        const talkers = Object.keys(npcs).filter((id) => !npcs[id].cat && id !== 'aliado' && npcs[id].topics);
        const chatBank = shuf(EX.chat), curBank = shuf(EX.curios), chatN = {}, curN = {};
        let nChat = 0, nCur = 0, order = shuf(P);
        const est = () => { // duración estimada con el medidor (src/meter.js): curiosidades y charlas de relleno tienen coste propio en `G.METER_CFG`
          if (G.meterSeconds && G.meterFeatures) return G.meterSeconds(G.meterFeatures({ rooms, npcs, clues: {} }));
          let topics = 0, steps = 0, curios = 0; // respaldo si meter.js no está cargado
          Object.keys(npcs).forEach((id) => { topics += ((npcs[id] && npcs[id].topics) || []).filter((q) => !/^f_ch\d/.test(q.id)).length; });
          P.forEach((pid) => (rooms[pid].props || []).forEach((q) => { if (/^cur_/.test(q.id)) curios++; else if (!q.chat) steps += (q.steps || []).length; }));
          return Math.max(120, MC.base + MC.perTopic * topics + MC.perStep * steps + MC.perRoom * P.length + EX.perCurio * curios);
        };
        const addChat = () => {
          const c = talkers.filter((id) => (chatN[id] || 0) < EX.maxChatPerNpc).sort((a, z) => (chatN[a] || 0) - (chatN[z] || 0) || (xr() < 0.5 ? -1 : 1))[0];
          if (!c || nChat >= chatBank.length) return false;
          const q = chatBank[nChat++]; npcs[c].topics.push({ id: 'f_ch' + nChat, label: q[0], responses: [[q[1]]] }); chatN[c] = (chatN[c] || 0) + 1; return true;
        };
        // El A* del bot y del compañero (G.findPath) va, para llegar a un objeto sólido, a la baldosa libre MÁS CERCANA (en orden de lectura) sin comprobar que se pueda llegar a ella. Una curiosidad puede
        // cambiar cuál sale elegida y dejar un objeto con pista «inalcanzable» (semilla 3770247: baldosa en una bolsa cerrada por el aliado). Aquí se reproduce esa elección y se exige que siga siendo alcanzable.
        const aimOk = (pid, room, tile) => {
          const { w, h } = dims(room), spots = [];
          Object.keys(placement).forEach((id) => { if (npcs[id] && !npcs[id].cat) placement[id].forEach((q) => { if (q.room === pid) spots.push(q); }); });
          const bad = (extra) => {
            const g = solidGrid(room, extra), blk = g.map((row) => row.slice()); spots.forEach((q) => { blk[q.y][q.x] = true; });
            const r = reach(blk, w, h, 6, 7), out = new Set(); // con los personajes de pie como obstáculos
            room.props.concat(extra ? [{ id: '_new', x: extra.x, y: extra.y }] : []).forEach((q) => {
              if (q.id !== '_new' && !q.steps) return;
              const free = (x, y) => y >= 0 && x >= 0 && y < h && x < w && blk[y][x] === false;
              let best = null, bd = 1e9; for (let rr = 1; rr < 6 && !best; rr++) for (let y = q.y - rr; y <= q.y + rr; y++) for (let x = q.x - rr; x <= q.x + rr; x++) if (free(x, y)) { const d = Math.abs(x - q.x) + Math.abs(y - q.y); if (d < bd) { bd = d; best = [x, y]; } }
              if (!best || !r.has(best[1] * w + best[0])) out.add(q.id);
            });
            return out;
          };
          const before = bad(null), after = bad(tile);
          return [...after].every((id) => before.has(id)); // la propia curiosidad nueva también debe poder examinarse (semilla 13091128: su baldosa de acceso quedó en una bolsa cerrada por otras curiosidades y por el personaje)
        };
        // Conectividad REAL de la sala con una curiosidad nueva en `tile`, en dos estados: al entrar (`pushed` falso) y después de empujar los objetos empujables (`pushed` verdadero; fx.moveProp).
        // Los personajes de pie son obstáculos y el alcance se mide desde el inicio (6,7) Y desde dentro de cada puerta (por donde se entra de verdad). Semillas 8587781 y 16337727: una curiosidad
        // pegada al objeto empujable o a la fila de personajes cerraba una zona (la puerta quedaba aislada del resto) y el bot —y una persona— se quedaba sin poder seguir.
        const connOk = (pid, room, tile, pushed) => {
          const { w, h } = dims(room), mv = {};
          if (pushed) room.props.forEach((q) => (q.steps || []).forEach((sp) => { if (sp.fx && sp.fx.moveProp) mv[sp.fx.moveProp.id] = sp.fx.moveProp; }));
          if (pushed && !Object.keys(mv).length) return true; // sin empujables, el estado de entrada ya lo comprueba okTiles
          const props = room.props.map((q) => (mv[q.id] ? Object.assign({}, q, { x: q.x + mv[q.id].dx, y: q.y + mv[q.id].dy }) : q)), spots = [];
          Object.keys(placement).forEach((id) => { if (npcs[id] && !npcs[id].cat) placement[id].forEach((q) => { if (q.room === pid) spots.push(q); }); });
          const mk = (extra) => { const g = solidGrid({ map: room.map, props }, extra); spots.forEach((q) => { g[q.y][q.x] = true; }); return g; };
          const srcs = [[6, 7]].concat(room.doors.map((d) => { const ins = G.doorInside(d); return [ins.x, ins.y]; }));
          const from = (g, sx, sy) => (sy >= 0 && sx >= 0 && sy < h && sx < w && !g[sy][sx] ? reach(g, w, h, sx, sy) : new Set());
          const g0 = mk(null), g1 = mk(tile); let r0 = new Set(), r1 = new Set();
          for (const [sx, sy] of srcs) { // CADA origen por separado (la unión escondía que una curiosidad separara la puerta del resto)
            const a = from(g0, sx, sy), b = from(g1, sx, sy);
            if (b.size !== a.size - (a.has(tile.y * w + tile.x) ? 1 : 0)) return false; // cortaría una zona
            a.forEach((k) => r0.add(k)); b.forEach((k) => r1.add(k));
          }
          const near = (r, q) => (q.solid === false ? r.has(q.y * w + q.x) : String(q.id).indexOf('sit_') === 0 ? touchesOrtho(r, w, q.x, q.y, q.w || 1, q.h || 1) : touches(r, w, q.x, q.y, q.w || 1, q.h || 1));
          return props.every((q) => !q.steps || !near(r0, q) || near(r1, q));
        };
        const addCurio = () => {
          if (nCur >= curBank.length) return false;
          for (let k = 0; k < order.length; k++) {
            const pid = order[k]; if ((curN[pid] || 0) >= EX.maxCurioPerRoom) continue;
            const room = rooms[pid], fr = shuf(freeTiles(pid)), { w: rw, h: rh } = dims(room), r0 = reach(solidGrid(room), rw, rh, 6, 7);
            const t = fr.find((c2) => okTiles(room, c2) && connOk(pid, room, c2, false) && connOk(pid, room, c2, true) && npcOk(pid, room, c2) && aimOk(pid, room, c2) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some((dd) => r0.has((c2.y + dd[1]) * rw + c2.x + dd[0])));
            if (!t) continue;
            const it = curBank[nCur++];
            room.props.push({ id: 'cur_' + nCur, sprite: it.sprite, x: t.x, y: t.y, solid: true, label: it.label, shimmer: true, steps: [{ tool: null, who: nCur % 2 ? 'rex' : 'luna', text: it.text[0] + ' ' + it.text[1] }], doneText: EX.done });
            curN[pid] = (curN[pid] || 0) + 1; order = order.slice(k + 1).concat(order.slice(0, k + 1)); return true;
          }
          return false;
        };
        const target = EX.targetMin * 60;
        for (let guard = 0; guard < 80 && est() < target; guard++) if (!addCurio()) break; // la duración la dan las curiosidades (miden ~19 s cada una con el bot)
        // charlas de detalle: SIEMPRE, hasta `maxChatPerNpc` por personaje (no cuentan para la duración medida: el bot no las pregunta; son humor y rincones para el jugador humano)
        for (let guard = 0; guard < 40; guard++) if (!addChat()) break;
      }
    }

    // ---- solución, mentiras, capítulos
    const lies = {}; b.lies.forEach((l) => { lies[l.who] = { flag: 'lie_' + l.who, refutedBy: l.refutedBy.slice(), said: l.said }; });
    const physical = b.clues.filter((c) => c.source.type === 'prop').map((c) => c.id);
    const witness = b.clues.filter((c) => c.source.type === 'npc').map((c) => c.id); // 4D-2: testimonios (se obtienen preguntando a un personaje)
    const m = tr.method, mo = tr.motive;
    const solution = {
      culprit: tr.culprit, method: m.id, motive: mo.id,
      methods: [{ id: m.id, text: m.text, needs: m.needs.slice() }].concat(tr.decoys.methods.map((d) => (d.needs ? { id: d.id, text: d.text, needs: d.needs.slice() } : { id: d.id, text: d.text }))),
      motives: [{ id: mo.id, text: mo.text, needs: mo.needs.slice() }].concat(tr.decoys.motives.map((d) => (d.needs ? { id: d.id, text: d.text, needs: d.needs.slice() } : { id: d.id, text: d.text }))),
      proof: b.proof.slice(),
    };
    const ti = (r() * tone.titles.length) | 0, bi = (r() * tone.blurbs.length) | 0; // mismo orden de azar que antes
    return {
      id: 'gen_' + b.code.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      title: dark ? fill(pick(mdr, dark.titles), o) : fill(tone.titles[ti], o), client: cli.name, blurb: dark ? fill(pairText(pick(mdr, dark.blurbs)), o) : fill(tone.blurbs[bi], o), tone: tone.id, mood,
      level: T.clientLevel, parSeconds: 600, reward: 100,
      genDecoys: b.level ? (b.deceptive || []).length : undefined, // S3b-1: nº de engañosos del caso (la nota lo compara con el rango de su nivel)
      genLevel: b.level, // S3b-1: dificultad con la que se generó (facil/normal/dificil; `level` sigue siendo el número de caso). Undefined si la biblia no lo trae (se descarta al serializar)
      start: { room: P[0], p1: [6, 7], p2: [7, 7] }, clientId: cli.id, clues,
      suspects: susIds.map((s) => ({ id: s, name: nameOf(s), desc: nameOf(s) + ', sospechoso.', look: b.cast.find((x) => x.id === s).look, clearedBy: b.alibis[s].clearedBy ? [b.alibis[s].clearedBy] : [] })),
      solution, lies,
      chapters: [ // 4D-2: tres capítulos (antes 2): pistas de objeto → interrogatorio (hablar con todos y escuchar a los testigos) → acusación
        { id: 1, title: 'Pistas', goals: [{ id: 'g1', text: 'Busca pistas', clues: physical, min: Math.ceil(physical.length * 0.6) }] },
        { id: 2, title: 'Interrogatorio', goals: [{ id: 'g2', text: 'Habla con todos', flags: susIds.map((s) => 'talked_' + s), min: susIds.length }].concat(witness.length ? [{ id: 'g2b', text: 'Escucha a los testigos', clues: witness, min: Math.ceil(witness.length * 0.6) }] : []) },
        { id: 3, title: 'Acusar', goals: [{ id: 'g3', text: 'Acusa', flags: ['case_closed'] }] },
      ],
      rooms, placement, npcs,
      epilogue: {
        win: T.win.concat([tone.win]).map((t) => ({ who: 'rex', text: fill(t, { culprit: nameOf(tr.culprit), method: dot(m.text), motive: lower1(dot(mo.text)) }) })).concat(dark ? [{ who: 'luna', text: fill(pairText(pick(mdr, dark.chill)), { culprit: nameOf(tr.culprit), obj: b.object.name, cli: cli.name }) }] : []), // 4C-4a: cierre con escalofrío y remate
        fail: T.fail.map((t) => ({ who: 'rex', text: fill(t, { culprit: nameOf(tr.culprit), obj: b.object.name }) })),
      },
    };
  };

  // ---- generador completo con reintentos deterministas (seed + k·0x9e3779b1, k < 8). Nunca oculta un fallo: devuelve { error }.
  G.GEN_MAX_ATTEMPTS = 8;
  G.generateCase = function (seed, opts) {
    seed = seed >>> 0;
    const fails = [];
    for (let k = 0; k < G.GEN_MAX_ATTEMPTS; k++) {
      const s = (seed + Math.imul(k, 0x9e3779b1)) >>> 0;
      let why = null, bible = null, def = null, review = null;
      try {
        bible = G.genClues(G.genTruth(s, opts), { mood: opts && G.MOODS.indexOf(opts.mood) >= 0 ? opts.mood : G.pickMood(s) }); // 4C-4c-1: el ambiente se decide ANTES de las pistas (mismo azar que antes: G.pickMood(s))
        const cb = G.checkBible(bible);
        if (!cb.ok) why = 'biblia: ' + cb.errors.slice(0, 2).map((e) => e.code + ' ' + e.path + ' ' + e.msg).join(' | ');
        else {
          def = G.compileBible(bible, opts);
          if (G.meterCase) { const mt = G.meterCase(def); def.parSeconds = mt.parSeconds; def.reward = mt.reward; } // 4D-1: tiempo de referencia y recompensa por caso (antes 600/100 fijos)
          const v = G.validateCase(def);
          if (!v.ok) why = 'validador: ' + v.errors.slice(0, 2).join(' | ');
          else {
            review = G.reviewCase(def);
            if (!review.ok || review.fairness < 90) why = 'revisor: equidad ' + review.fairness + ' ' + review.findings.filter((f) => f.sev === 'error').slice(0, 2).map((f) => f.code).join(',');
          }
        }
      } catch (e) { why = 'excepción: ' + (e && e.message); }
      if (!why) {
        if (opts && opts.register) G.CASES[def.id] = def;
        return { def, bible, review, meter: G.meterCase ? G.meterCase(def, { fairness: review.fairness }) : null, attempts: k + 1, code: bible.code };
      }
      fails.push({ seed: s, why });
    }
    return { error: 'La semilla ' + seed + ' no dio un caso aceptado en ' + G.GEN_MAX_ATTEMPTS + ' intentos', fails, attempts: G.GEN_MAX_ATTEMPTS, code: G.caseCode(seed) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
