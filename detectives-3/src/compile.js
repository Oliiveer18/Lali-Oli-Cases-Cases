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
  // `street` (v6, true/false; undefined = sin filtro): en el lugar de la calle solo variantes de calle (true) o solo de interior (false); en los demás lugares no cambia nada
  G.roomTemplate = function (pid, pick, street) {
    let vs = G.roomVariants(pid);
    if (street !== undefined && G.GEN_VERSION >= 6 && G.GEN_DATA.compile.street && G.GEN_DATA.compile.street.place === pid) { const f = vs.filter((v) => (v.scene === 'calle') === street); if (f.length) vs = f; }
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
  // 4F-0a: cada temática trae sus pesos (G.THEMES[t].mood, gen_themes.js); Robo usa SIEMPRE G.MOOD_WEIGHTS (test_themes.js vigila que sean los mismos números)
  G.pickMood = function (seed, theme) {
    const W = theme && theme !== G.DEFAULT_THEME && G.themeOk(theme) ? G.themeMoodWeights(theme) : G.MOOD_WEIGHTS, tot = G.MOODS.reduce((a, k) => a + W[k], 0);
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
    G.GEN_DATA.places.concat(G.GEN_DATA.reservedPlaces || []).forEach((p) => { PL[p.id] = p; }); // 4F-0b 3/4-b: también los de reserva
    const r = G.rng(((b.seed >>> 0) ^ 0xc0de) >>> 0), P = b.places.map((p) => p.id), tr = b.truth;
    const cli = b.cast.find((c) => c.role === 'cliente');
    const susIds = b.cast.filter((c) => c.role === 'sospechoso').map((c) => c.id);
    const nameOf = (id) => (b.cast.find((c) => c.id === id) || { name: id }).name;
    const o = { obj: b.object.name, Obj: cap(b.object.name), cli: cli.name, n: susIds.length };
    // 4B-2: el TONO del caso sale de la semilla con su propio azar (no cambia lo que ya salía de r); cada personaje tiene su azar propio
    // 4F-0a: solo entran los tonos recomendados de la temática (Robo: los 6 de siempre, en el mismo orden, así que el azar da lo mismo que antes)
    const thm = b.theme && G.themeOk(b.theme) ? b.theme : G.DEFAULT_THEME, tonesOk = T.tones.filter((x) => G.THEMES[thm].tones.indexOf(x.id) >= 0), tonePool = tonesOk.length ? tonesOk : T.tones;
    const tone = tonePool[(G.rng(((b.seed >>> 0) ^ 0x70e5) >>> 0)() * tonePool.length) | 0];
    // 4C-4a: ambiente. Los textos oscuros salen de `dark` (banco del tono y del ambiente) con azares PROPIOS (mdr, cr): en `claro` no se usa nada y el caso sale como antes; en los demás solo cambian TEXTOS (los hechos no).
    const MD = T.mood, mood = opts && G.MOODS.indexOf(opts.mood) >= 0 ? opts.mood : (b.mood && G.MOODS.indexOf(b.mood) >= 0 ? b.mood : G.pickMood(b.seed, thm)), dark = mood === 'claro' ? null : MD.tone[tone.id][mood];
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
      const t = tpl[pid] = G.roomTemplate(pid, rr, G.GEN_VERSION >= 6 ? G.wantsStreet(b.seed) : undefined), doors = [];
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
    // A4 3/4-b2 paso 2 (GEN_VERSION >= 6): CHARLA CON PISTA. Una pista de sostén de tipo «grabación» (objeto, role prueba/descarte/refuta) en una sala con «rincón de charla» se entrega desde la charla grabada de Lali (herramienta grabadora),
    // no desde un objeto suelto. Se reserva ANTES que la lupa. Si luego no se puede montar la charla, la pista se coloca como objeto normal (no se pierde nunca).
    // A4 3/4-b2 paso 3 (GEN_VERSION >= 6): OTRO CAMINO LIBRE. Una pista solo puede quedar detrás de una herramienta, un empujón o un sigilo si no es la que demuestra el método ni el móvil (única de su deducción)
    // y si cada mentira que desmonta conserva al menos otra refutación sin esas mecánicas (testimonio o pista libre). Así nadie se atasca por una herramienta. Con GEN_VERSION 5 todo vale (casos idénticos).
    const keyIds = {}; ((b.truth.method.needs || []).concat(b.truth.motive.needs || [])).forEach((id) => { keyIds[id] = true; });
    const okGate = (c) => c.role !== 'ambiente' && (G.GEN_VERSION < 6 || (!keyIds[c.id] && b.lies.every((l) => l.refutedBy.indexOf(c.id) < 0 || l.refutedBy.some((id) => id !== c.id && !taken[id]))));
    let listenClue = null, listenClue2 = null;
    // GRAB-1 (c3a, GEN_VERSION >= 7): de quién habla una pista (clave de `points`; las refutaciones no puntúan, así que se mira la mentira que desmontan)
    const aboutOf = (c) => { const k = Object.keys(c.points || {})[0]; if (k) return k; const l = b.lies.find((q) => q.refutedBy.indexOf(c.id) >= 0); return l ? l.who : null; };
    const listenable = (c) => c.source.type === 'prop' && c.kind === 'grabación' && ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0 && !taken[c.id] && okGate(c) && tpl[c.source.place].listen;
    // reparto de herramientas (cp. 184, S2, GEN_VERSION >= 7): cada herramienta tiene su cifra por NIVEL (mín, máx y pesos en datos: MECH.herr2.levels). Se sortea con el azar propio `mr`. La grabadora = nº de charlas con pista (0-2).
    const H2L = G.GEN_VERSION >= 7 && MECH.herr2 && MECH.herr2.levels && b.level ? MECH.herr2.levels[b.level] : null;
    const wpick = (tbl) => { const tot = tbl.reduce((a, x) => a + x[1], 0); let k = mr() * tot; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) return tbl[i][0]; } return tbl[tbl.length - 1][0]; };
    const wantTool = H2L ? { lupa: wpick(H2L.lupa), uv: wpick(H2L.uv), ganzua: wpick(H2L.ganzua), grabadora: wpick(H2L.grabadora), libres: wpick(H2L.libres) } : null;
    if (G.GEN_VERSION >= 6) {
      const lc = shuf(b.clues.filter(listenable));
      if (lc.length && (!wantTool || wantTool.grabadora >= 1)) { listenClue = lc[0]; taken[listenClue.id] = true; }
      if (G.GEN_VERSION >= 7 && listenClue && (!wantTool || wantTool.grabadora >= 2)) { // 2.ª charla: sala distinta; se prefiere la que habla de la misma persona (la confirma); si no, otra (contrasta)
        const l2 = shuf(b.clues.filter((c) => listenable(c) && c.source.place !== listenClue.source.place)).sort((x, y) => (aboutOf(x) === aboutOf(listenClue) ? 0 : 1) - (aboutOf(y) === aboutOf(listenClue) ? 0 : 1));
        if (l2.length) { listenClue2 = l2[0]; taken[listenClue2.id] = true; }
      }
    }
    // HERR-2 (GEN_VERSION >= 7): cuota por herramienta, varias pistas por caso. S = pistas de sostén de objeto; q = clamp(round(share · S), min, max); quedan ≈ round(share · S) libres.
    const H2 = G.GEN_VERSION >= 7 && MECH.herr2 ? MECH.herr2 : null, supportRole = (c) => ['prueba', 'descarte', 'refuta'].indexOf(c.role) >= 0;
    const sostenN = H2 ? b.clues.filter((c) => c.source.type === 'prop' && supportRole(c)).length : 0, freeMin = H2 ? (H2L && H2L.libres ? wantTool.libres : Math.round(sostenN * H2.share)) : 0;
    const sostenFree = () => b.clues.filter((c) => c.source.type === 'prop' && supportRole(c) && !taken[c.id]).length;
    if (H2) {
      const q = H2L ? Math.max(wantTool.lupa, wantTool.uv, wantTool.ganzua) : Math.max(H2.min, Math.min(H2.max, Math.round(sostenN * H2.share)));
      // la lupa va con la charla: 1 por charla con pista. c3a: con 2 charlas hacen falta 2 lupas, 1 UV y 1 ganzúa; si el reparto no sale, se suelta la 2.ª charla y se repite con una sola (nunca se pierde una herramienta por una charla de más)
      const runH2 = (nChat) => {
        const usedSp = {}, left = H2L ? { uv: wantTool.uv, ganzua: wantTool.ganzua, lupa: wantTool.lupa } : { uv: q, ganzua: q, lupa: q }; // cp. 177: la lupa sale por su cuota como la ganzúa y la UV; NO va ligada a las charlas (nChat solo reserva las pistas de las charlas)
        const pass = (rounds, order) => { for (let round = 0; round < rounds; round++) (H2L ? order().sort((x, y) => (H2.uvFirst ? (y === 'uv') - (x === 'uv') : 0) || left[y] - left[x]) : order()).forEach((tl) => { // v7 por nivel: primero la herramienta a la que más le falta (lupa y UV pesan más)
          if (left[tl] <= 0) return;
          const special = tl === 'ganzua' ? 'cerradura' : 'rincon', kinds = H2.kinds[tl], pref = (c) => kinds.indexOf(c.kind);
          const cand = shuf(b.clues.filter((c) => c.source.type === 'prop' && supportRole(c) && !taken[c.id] && okGate(c) && pref(c) >= 0 && (tl === 'lupa' || ((tpl[c.source.place].special || {})[special] && !usedSp[c.source.place + ':' + tl])))).sort((x, y) => pref(x) - pref(y));
          if (!cand.length || sostenFree() - 1 < freeMin) return; // no se gasta el mínimo de pistas libres
          const c = cand[0]; taken[c.id] = true; toolOf[c.id] = tl; left[tl]--; if (tl !== 'lupa') usedSp[c.source.place + ':' + tl] = true;
        }); };
        pass(q, () => ['uv', 'ganzua', 'lupa']);
        if (H2L) { left.uv = left.lupa = 9; pass(8, () => ['uv', 'lupa']); } // sobrante: lo que queda por encima de las pistas libres objetivo lo absorben la UV y la lupa (más lupa y UV, menos ganzúa y grabadora)
      };
      const nTool = (t) => Object.keys(toolOf).filter((id) => toolOf[id] === t).length, snapTaken = Object.assign({}, taken), snapTool = Object.assign({}, toolOf), c2 = listenClue2;
      runH2((listenClue ? 1 : 0) + (c2 ? 1 : 0));
      if (c2 && ((!H2L && (nTool('lupa') < 1 || nTool('uv') < 1 || nTool('ganzua') < 1)) || !okGate(c2))) {
        Object.keys(taken).forEach((k) => { delete taken[k]; }); Object.assign(taken, snapTaken); delete taken[c2.id];
        Object.keys(toolOf).forEach((k) => { delete toolOf[k]; }); Object.assign(toolOf, snapTool);
        listenClue2 = null; runH2(listenClue ? 1 : 0);
      }
    } else ['ganzua', 'uv', 'lupa'].forEach((tl) => {
      if (want.indexOf(tl) < 0) return;
      const fit = (kinds) => shuf(b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && okGate(c) && kinds.indexOf(c.kind) >= 0 && !(c.role === 'falsa' && c.kind === 'grabación' && G.GEN_VERSION >= 7) && (tl === 'lupa' || (tpl[c.source.place].special || {})[tl === 'ganzua' ? 'cerradura' : 'rincon'])));
      const c = (tl === 'lupa' ? fit(['física']).concat(fit(['grabación'])) : fit(['documento']))[0];
      if (c) { taken[c.id] = true; toolOf[c.id] = tl; }
    });
    // c4-2a (GEN_VERSION >= 7, cp. 227): SEÑUELOS CON LUPA. Parte de las pistas FALSAS de objeto piden lupa, en la proporción de las de sostén (cifra por nivel con mínimo, máximo y pesos en `MECH.herr2.senuelos`), para que «pide herramienta» no delate la pista verdadera.
    // Azar PROPIO (seed ^ 0x5e17e1): no mueve nada de lo demás. Va detrás de la cuota del sostén (no le quita candidatas: solo toca role `falsa`). UV y ganzúa de señuelos: mitad 2b.
    if (H2 && MECH.herr2.senuelos && b.level && MECH.herr2.senuelos[b.level]) {
      const sr = G.rng(((b.seed >>> 0) ^ 0x5e17e1) >>> 0), tbl = MECH.herr2.senuelos[b.level].lupa || [[0, 1]], tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = sr() * tot, want = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { want = tbl[i][0]; break; } }
      const cand = b.clues.filter((c) => c.source.type === 'prop' && c.role === 'falsa' && !taken[c.id] && okGate(c) && H2.kinds.lupa.indexOf(c.kind) >= 0 && !(c.kind === 'grabación' && G.GEN_VERSION >= 7)); // c4-3 3/4-b (1): la falsa-grabación de la charla señuelo va a una charla grabada, NUNCA a un señuelo de lupa (v6 y el interruptor apagado: no hay falsas-grabación, nada cambia)
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(sr() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
      cand.slice(0, want).forEach((c) => { taken[c.id] = true; toolOf[c.id] = 'lupa'; });
    }
    // c4-2b-2 (GEN_VERSION >= 7, cp. 230): SEÑUELOS CON UV (interruptor `MECH.herr2.uvSenuelos`, apagado hasta 2b-4). Parte de las pistas FALSAS de documento o física piden la linterna UV (rincón de luz de su sala), en la cifra por nivel de `MECH.herr2.senuelos[nivel].uv` (mín., máx. y pesos en datos). Azar PROPIO (seed ^ 0x75e17e): no mueve nada de lo demás.
    // Solo toca role `falsa`, una UV por sala (como las de sostén) y nunca entra en la cadena ganzúa→UV (`decoyUv`).
    const decoyUv = {};
    if (H2 && MECH.herr2.uvSenuelos && MECH.herr2.senuelos && b.level && MECH.herr2.senuelos[b.level] && MECH.herr2.senuelos[b.level].uv) { // `uvSenuelos` (datos): interruptor; APAGADO hasta 2b-4 (con él encendido sube la lupa)
      const ur = G.rng(((b.seed >>> 0) ^ 0x75e17e) >>> 0), tbl = MECH.herr2.senuelos[b.level].uv, tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = ur() * tot, want = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { want = tbl[i][0]; break; } }
      const uvPlace = {}; Object.keys(toolOf).forEach((id) => { if (toolOf[id] === 'uv') uvPlace[(b.clues.find((q) => q.id === id) || {}).source.place] = true; });
      const cand = b.clues.filter((c) => c.source.type === 'prop' && c.role === 'falsa' && !taken[c.id] && okGate(c) && H2.kinds.uv.indexOf(c.kind) >= 0 && (tpl[c.source.place].special || {}).rincon);
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(ur() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
      let put = 0; cand.forEach((c) => { if (put >= want || uvPlace[c.source.place]) return; uvPlace[c.source.place] = true; taken[c.id] = true; toolOf[c.id] = 'uv'; decoyUv[c.id] = true; put++; });
    }
    // c4-2b-3 (GEN_VERSION >= 7, cp. 232): SEÑUELOS CON GANZÚA (interruptor `MECH.herr2.ganzuaSenuelos`, APAGADO hasta 2b-4). Parte de las pistas FALSAS de documento o física piden la ganzúa (cajón/cerradura de su sala), en la cifra por nivel de `MECH.herr2.senuelos[nivel].ganzua` (mín., máx. y pesos en datos). Azar PROPIO (seed ^ 0x9a2c3b).
    // Solo toca role `falsa` y una cerradura por sala (como las de sostén). Va DESPUÉS de los señuelos UV (no les quita candidatas). La cadena de señuelos (ganzúa falsa → UV falsa de documento, `senuelos[nivel].cadena`) sale más abajo, aparte de la cadena real.
    const decoyGz = {};
    if (H2 && MECH.herr2.ganzuaSenuelos && MECH.herr2.senuelos && b.level && MECH.herr2.senuelos[b.level] && MECH.herr2.senuelos[b.level].ganzua) {
      const gr = G.rng(((b.seed >>> 0) ^ 0x9a2c3b) >>> 0), tbl = MECH.herr2.senuelos[b.level].ganzua, tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = gr() * tot, want = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { want = tbl[i][0]; break; } }
      const gzPlace = {}; Object.keys(toolOf).forEach((id) => { if (toolOf[id] === 'ganzua') gzPlace[(b.clues.find((q) => q.id === id) || {}).source.place] = true; });
      const cand = b.clues.filter((c) => c.source.type === 'prop' && c.role === 'falsa' && !taken[c.id] && okGate(c) && H2.kinds.ganzua.indexOf(c.kind) >= 0 && (tpl[c.source.place].special || {}).cerradura);
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(gr() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
      let put = 0; cand.forEach((c) => { if (put >= want || gzPlace[c.source.place]) return; gzPlace[c.source.place] = true; taken[c.id] = true; toolOf[c.id] = 'ganzua'; decoyGz[c.id] = true; put++; });
    }
    // A4 3/4-b2 paso 3 (GEN_VERSION >= 6): CADENA DE 2 PASOS. Si el caso lleva ganzúa y UV, la pista de la UV solo aparece cuando la ganzúa ha abierto su cajón (bandera «abierto_<pista>»): una herramienta de cada detective, sin minijuegos.
    const chainOf = {};
    // c4-2b-1 (GEN_VERSION >= 7): la cadena (papel del cajón) solo con una UV de documento
    if (G.GEN_VERSION >= 6) { const gz = Object.keys(toolOf).filter((id) => toolOf[id] === 'ganzua' && !decoyGz[id])[0], uvc = Object.keys(toolOf).filter((id) => toolOf[id] === 'uv' && (G.GEN_VERSION < 7 || (!decoyUv[id] && (b.clues.find((q) => q.id === id) || {}).kind === 'documento')))[0]; if (gz && uvc) { // c4-2b-4 paso 2 (cp. 234, GEN_VERSION >= 7): la cadena REAL es opcional (`herr2.cadenaReal[nivel]` = [[0|1, peso]], datos), para que la proporción de ganzúas con cadena sea la MISMA que en los señuelos (si no, «cajón + papel UV» delataría lo verdadero)
      let real = 1; const CR = G.GEN_VERSION >= 7 && MECH.herr2 && MECH.herr2.cadenaReal && b.level ? MECH.herr2.cadenaReal[b.level] : null;
      if (CR) { const rr = G.rng(((b.seed >>> 0) ^ 0x5ea1c4) >>> 0), tt = CR.reduce((x, e) => x + e[1], 0); let k = rr() * tt; real = CR[CR.length - 1][0]; for (let i = 0; i < CR.length; i++) { k -= CR[i][1]; if (k < 0) { real = CR[i][0]; break; } } }
      if (real) chainOf[uvc] = gz; } }
    // c4-2b-3: CADENA DE SEÑUELOS. Con la ganzúa de señuelo encendida, `senuelos[nivel].cadena` ([[0|1, peso], …]) dice si el caso lleva una 2.ª cadena FALSA: ganzúa falsa → UV falsa de documento, igual que la real (así «cajón + papel con UV» no delata la pista verdadera).
    // Usa una UV de señuelo de documento ya puesta (2b-2) o, si no hay, toma una falsa de documento con rincón libre (una UV por sala). Azar PROPIO (seed ^ 0xc4d3c0): no mueve nada de lo demás.
    if (H2 && Object.keys(decoyGz).length && MECH.herr2.senuelos[b.level] && MECH.herr2.senuelos[b.level].cadena) {
      const dr = G.rng(((b.seed >>> 0) ^ 0xc4d3c0) >>> 0), tbl = MECH.herr2.senuelos[b.level].cadena, tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = dr() * tot, want = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { want = tbl[i][0]; break; } }
      const kindOf = (id) => (b.clues.find((q) => q.id === id) || {}).kind, gzId = Object.keys(decoyGz)[0];
      if (want >= 1 && gzId) {
        let uvId = Object.keys(decoyUv).filter((id) => kindOf(id) === 'documento' && !chainOf[id])[0];
        if (!uvId) {
          const uvPlace = {}; Object.keys(toolOf).forEach((id) => { if (toolOf[id] === 'uv') uvPlace[(b.clues.find((q) => q.id === id) || {}).source.place] = true; });
          const cand = b.clues.filter((c) => c.source.type === 'prop' && c.role === 'falsa' && !taken[c.id] && okGate(c) && c.kind === 'documento' && (tpl[c.source.place].special || {}).rincon && !uvPlace[c.source.place]);
          for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(dr() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
          if (cand.length) { uvId = cand[0].id; taken[uvId] = true; toolOf[uvId] = 'uv'; decoyUv[uvId] = true; }
        }
        if (uvId) chainOf[uvId] = gzId;
      }
    }
    const chainGz = {}; Object.keys(chainOf).forEach((u) => { chainGz[chainOf[u]] = true; });
    const cr = G.rng(((b.seed >>> 0) ^ 0xc4a1) >>> 0), uvr = G.rng(((b.seed >>> 0) ^ 0x75c4b1) >>> 0); // uvr (c4-2b-1): azar propio de los textos de la UV
    // ---- 4C-2b-1: empujar. Azar PROPIO (no toca lo demás: sin empujar el caso sale idéntico que antes). Como mucho una vez por caso: una pista física o documento de objeto, que no se haya llevado ya una herramienta,
    // queda tapada por un objeto pesado en el hueco «empujable» de su sala; aparece (visible por bandera) al apartarlo entre los dos (paso `coop`). Si no hay pista que encaje, se omite.
    const pr = G.rng(((b.seed >>> 0) ^ 0x9051) >>> 0), pushOf = {};
    const doPush = () => {
    if (pr() < MECH.pushChance) {
      const cand = b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && okGate(c) && MECH.pushKinds.indexOf(c.kind) >= 0 && (tpl[c.source.place].special || {}).empujable && (!H2 || !supportRole(c) || sostenFree() > freeMin));
      if (cand.length) {
        const c = cand[(pr() * cand.length) | 0], pu = pick(pr, MECH.pushables), hid = pick(pr, MECH.hidden[c.kind]);
        taken[c.id] = true; pushOf[c.id] = { text: pick(pr, MECH.push), sprite: pu.sprite, label: pu.label, hidden: hid };
      }
    }
    };
    // ---- 4C-2b-2: sigilo. Azar PROPIO (no toca lo demás). Como mucho una vez por caso: una pista física o documento de objeto, sin herramienta ni empujón, en una sala donde está un personaje; ese personaje vigila.
    const castAt = {};
    b.cast.forEach((c) => { const f = b.truth.timeline.find((e) => e.who === c.id); (castAt[f ? f.place : P[0]] = castAt[f ? f.place : P[0]] || []).push(c); });
    const wr = G.rng(((b.seed >>> 0) ^ 0x5161) >>> 0), watchOf = {};
    const doWatch = () => {
    if (wr() < (G.GEN_VERSION >= 6 ? MECH.watchChanceV6 : MECH.watchChance)) {
      const cand = b.clues.filter((c) => c.source.type === 'prop' && !taken[c.id] && okGate(c) && MECH.watchKinds.indexOf(c.kind) >= 0 && (castAt[c.source.place] || []).length && (!H2 || !supportRole(c) || sostenFree() > freeMin));
      if (cand.length) {
        const c = cand[(wr() * cand.length) | 0], w = pick(wr, castAt[c.source.place]);
        taken[c.id] = true; watchOf[c.id] = { npc: w.id, text: pick(wr, MECH.watch), rhythm: pick(wr, MECH.watchRhythms), spotted: pick(wr, MECH.watchSpotted) };
      }
    }
    };
    if (G.GEN_VERSION >= 6) { doWatch(); doPush(); } else { doPush(); doWatch(); } // v6: el sigilo (1 por caso) se reserva antes que el empujón
    const pushProps = (c) => {
      const o = pushOf[c.id], sp = tpl[c.source.place].special.empujable, flag = 'movido_' + c.id;
      return [
        { id: 'push_' + c.id, sprite: o.sprite, x: sp.x, y: sp.y, solid: true, label: o.label, shimmer: true, steps: [{ tool: 'coop', time: 2.2, who: 'luna', text: o.text, fx: { flag, moveProp: { id: 'push_' + c.id, dx: sp.dx, dy: sp.dy } } }], doneText: MECH.done.push },
        { id: 'obj_' + c.id, sprite: o.hidden, x: sp.x, y: sp.y, solid: false, label: c.title, visible: { flag }, shimmer: true, steps: [{ tool: null, who: voz(c.id), text: c.text, clue: c.id }], doneText: 'Ya lo has examinado.' },
      ];
    };
    const mechProp = (c, tl, sl) => {
      const who = G.toolOwner(tl) || 'rex', base = pick(mr, MECH[tl]), uvT = tl === 'uv' && G.GEN_VERSION >= 7 && !chainOf[c.id] && MECH.uvTipos && MECH.uvTipos[c.kind] ? pick(uvr, pick(uvr, MECH.uvTipos[c.kind])) : null, text = (uvT || base) + ' ' + (chainOf[c.id] ? pick(cr, MECH.chain.uv) + ' ' : '') + c.text + (chainGz[c.id] ? ' ' + pick(cr, MECH.chain.gz) : '');
      if (tl === 'ganzua') {
        const sp = tpl[c.source.place].special.cerradura, flag = 'abierto_' + c.id, open = sp.open === undefined ? 'drawer' : sp.open;
        const pr = { id: 'obj_' + c.id, sprite: sp.sprite || 'drawer_locked', x: sp.x, y: sp.y, solid: true, label: sp.label || MECH.labels.ganzua, shimmer: true, steps: [{ tool: 'ganzua', time: 2.0, who, text, clue: c.id, fx: { flag } }], doneText: MECH.done.ganzua };
        if (open) pr.swap = { flag, sprite: open };
        return pr;
      }
      if (tl === 'uv') { const sp = tpl[c.source.place].special.rincon; return Object.assign({ id: 'obj_' + c.id, sprite: 'uv_text', x: sp.x, y: sp.y, dy: -2, solid: false, uvOnly: true, label: MECH.labels.uv, shimmer: true, steps: [{ tool: 'uv', who, text, clue: c.id }], doneText: MECH.done.uv }, chainOf[c.id] ? { visible: { flag: 'abierto_' + chainOf[c.id] } } : {}); }
      return { id: 'obj_' + c.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: c.title, shimmer: true, steps: [{ tool: 'lupa', who, text, clue: c.id }], doneText: MECH.done.lupa };
    };

    // ---- pistas: las de objeto van a un hueco de su sala (o al hueco especial de su herramienta); las de personaje, a un tema de su npc
    // c4-3 3/4-b (2) (v7, interruptor `herr2.charlaSenuelos`): la falsa-grabación (gen_clues 3/4-a) se entrega como CHARLA GRABADA SEÑUELO (más abajo); si no se puede montar, vuelve a ser un objeto normal de su sala.
    const decoyChat = (G.GEN_VERSION >= 7 && H2 && MECH.herr2.charlaSenuelos) ? (b.clues.find((c) => c.role === 'falsa' && c.kind === 'grabación' && c.source.type === 'prop') || null) : null;
    const clues = {}, byNpc = {};
    b.clues.forEach((c) => {
      clues[c.id] = { title: c.title, icon: ICON[c.kind] || 'ico_clue', kind: c.kind, text: c.text, sus: c.points || {} };
      if (c.source.type === 'prop') {
        if ((listenClue && c.id === listenClue.id) || (listenClue2 && c.id === listenClue2.id) || (decoyChat && c.id === decoyChat.id)) return; // la entrega la charla grabada (más abajo)
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
      // c4b · GRAB-3 (v7, `mech.grabReac.on`): ante una grabación que lo señala (c.points o refutación de su mentira) y sin frase propia, reacción NERVIOSA que nombra la grabación. Misma pool para todos (sin fuga); azar propio (no mueve `rr`).
      const GR = MECH.grabReac, grPool = GR && GR.on && G.GEN_VERSION >= 7 ? GR.frases[tone.id] : null;
      if (grPool && grPool.length) b.clues.forEach((k) => {
        if (k.kind !== 'grabación' || ev[k.id]) return;
        if (Object.keys(k.points || {}).indexOf(c.id) < 0 && !(liesBy[c.id] && (liesBy[c.id].refutedBy || []).indexOf(k.id) >= 0)) return;
        const gr = G.rng(G.hash(b.code + ':grabnerv:' + c.id + ':' + k.id) >>> 0), tot = grPool.reduce((a, x) => a + x[1], 0);
        let q = gr() * tot, ph = grPool[grPool.length - 1][0];
        for (let i = 0; i < grPool.length; i++) { q -= grPool[i][1]; if (q < 0) { ph = grPool[i][0]; break; } }
        ev[k.id] = [{ say: [ph] }];
      });
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
        const mine = b.clues.filter((c) => c.source.type === 'prop' && c.role !== 'ambiente'), hint = mine.length ? mine[(ar() * mine.length) | 0] : null;
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
    let listenOf = null, listenOf2 = null, listenN = 0, builtChat2 = false, decoyOf = null;
    if (!H2) {
      const LS = T.listen, lr = G.rng(((b.seed >>> 0) ^ 0x1157e) >>> 0), roll = lr();
      const watchers = Object.keys(watchOf).map((k) => watchOf[k].npc);
      const cand = susIds.filter((id) => npcs[id] && !npcs[id].cat && watchers.indexOf(id) < 0), lrooms = P.filter((pid) => tpl[pid].listen);
      // Pareja de la charla CON PISTA (azar propio seed ^ 0x1157f): no puede ser una pareja que ya viva entera en la sala de la charla (en el capítulo 3 «volverían» al mismo sitio y la charla seguiría grabable). Si no hay otra, rescate.
      let pairClue = null;
      if (listenClue && cand.length >= 2) {
        const pr2 = G.rng(((b.seed >>> 0) ^ 0x1157f) >>> 0), s2 = cand.slice(), home = (id) => placement[id][0].room;
        for (let i = s2.length - 1; i > 0; i--) { const j = (pr2() * (i + 1)) | 0, tt = s2[i]; s2[i] = s2[j]; s2[j] = tt; }
        for (let i = 0; i < s2.length && !pairClue; i++) for (let j = i + 1; j < s2.length && !pairClue; j++) if (!(home(s2[i]) === listenClue.source.place && home(s2[j]) === listenClue.source.place)) pairClue = [s2[i], s2[j]];
      }
      const withClue = !!listenClue && !!pairClue;
      if (listenClue && !withClue) { // rescate: sin pareja de charla la pista va a un objeto normal de su sala
        const pl = listenClue.source.place, n = (used[pl] = used[pl] || 0); used[pl]++;
        const sl = tpl[pl].slots[n];
        if (!sl) throw new Error(`compileBible: la sala «${pl}» no tiene hueco para el objeto n.º ${n + 1} (plantilla ${tpl[pl].id})`);
        rooms[pl].props.push({ id: 'obj_' + listenClue.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: listenClue.title, shimmer: true, steps: [{ tool: null, who: voz(listenClue.id), text: listenClue.text, clue: listenClue.id }], doneText: 'Ya lo has examinado.' });
      }
      if (LS && (withClue || (roll < LS.chance && !listenClue)) && cand.length >= 2 && lrooms.length) {
        const pid = withClue ? listenClue.source.place : lrooms[(lr() * lrooms.length) | 0], L = tpl[pid].listen, sh = cand.slice();
        for (let i = sh.length - 1; i > 0; i--) { const j = (lr() * (i + 1)) | 0, tt = sh[i]; sh[i] = sh[j]; sh[j] = tt; }
        const ia = withClue ? pairClue[0] : sh[0], ib = withClue ? pairClue[1] : sh[1], bank = LS.mood[mood], vars = { a: nameOf(ia), b: nameOf(ib) };
        const lines = bank.chats[(lr() * bank.chats.length) | 0].map((t, i) => ({ who: i % 2 === 0 ? ia : ib, text: fill(t, vars) }));
        const secs = Math.round(lines.length * (G.LISTEN_LINE_SECONDS || 1.2) * 100) / 100; // cada frase necesita su tiempo (validador: G.listenMinSeconds)
        const labelTxt = pick(lr, LS.label), recText = pick(lr, bank.rec), stp = { tool: 'grabadora', time: secs, who: G.toolOwner ? G.toolOwner('grabadora') || 'luna' : 'luna', text: withClue ? recText + ' ' + listenClue.text : recText };
        if (withClue) stp.clue = listenClue.id; // charla CON PISTA (GEN_VERSION >= 6): termina de grabar y la pista entra en el cuaderno
        rooms[pid].props.push({ id: withClue ? 'obj_' + listenClue.id : 'rec_charla', sprite: null, x: L.x, y: L.y, w: L.w, h: L.h, solid: false, label: labelTxt, shimmer: true, listen: true, chapterMin: 2, steps: [stp], chat: { a: ia, b: ib, lines }, doneText: LS.done });
        [[ia, L.a], [ib, L.b]].forEach(([id, sp]) => { const o = placement[id][0]; placement[id] = [o, { ch: 2, room: pid, x: sp.x, y: sp.y, face: sp.face }, Object.assign({}, o, { ch: 3 })]; }); // la lista va ordenada por `ch` (placementOf toma la última con ch <= capítulo)
        listenOf = { room: pid, L };
      }
    }
    // GRAB-1 (c3a, GEN_VERSION >= 7): hasta 2 charlas CON PISTA en salas distintas, parejas distintas (nadie está en dos charlas a la vez). La charla CONTIENE la pista, velada: 2 frases de humor + 1 insinuación + 1 reacción (`LS.veil`).
    // Si el sujeto de la pista no puede quedar fuera de la pareja, la charla se queda con su humor de siempre (la pista sigue llegando al terminar de grabar). La 2.ª charla reacciona a la 1.ª: confirma (mismo nombre) o contrasta (otro).
    // Sin pista elegible, la charla de curiosidad de siempre (~40 %). Si no hay pareja libre, la pista va a un objeto normal de su sala (nunca se pierde).
    if (H2) {
      const LS = T.listen, lr = G.rng(((b.seed >>> 0) ^ 0x1157e) >>> 0), roll = lr(), VEIL = LS && LS.veil, bank = LS && LS.mood[mood];
      const watchers = Object.keys(watchOf).map((k) => watchOf[k].npc), cand = susIds.filter((id) => npcs[id] && !npcs[id].cat && watchers.indexOf(id) < 0), lrooms = P.filter((pid) => tpl[pid].listen);
      const home = (id) => placement[id][0].room, usedNpc = {}, rec = (id) => rooms[id];
      const baseChat = (ia, ib) => bank.chats[(lr() * bank.chats.length) | 0].map((t, i) => ({ who: i % 2 === 0 ? ia : ib, text: fill(t, { a: nameOf(ia), b: nameOf(ib) }) }));
      const mount = (pid, ia, ib, lines, clue, decoy) => {
        const L = tpl[pid].listen, secs = Math.round(lines.length * (G.LISTEN_LINE_SECONDS || 1.2) * 100) / 100, recText = pick(lr, bank.rec);
        const stp = { tool: 'grabadora', time: secs, who: G.toolOwner ? G.toolOwner('grabadora') || 'luna' : 'luna', text: clue ? recText + ' ' + clue.text : recText };
        if (clue) stp.clue = clue.id;
        rooms[pid].props.push({ id: clue ? 'obj_' + clue.id : 'rec_charla', sprite: null, x: L.x, y: L.y, w: L.w, h: L.h, solid: false, label: pick(lr, LS.label), shimmer: true, listen: true, chapterMin: 2, steps: [stp], chat: { a: ia, b: ib, lines }, doneText: LS.done });
        [[ia, L.a], [ib, L.b]].forEach(([id, sp]) => { const o = placement[id][0]; placement[id] = [o, { ch: 2, room: pid, x: sp.x, y: sp.y, face: sp.face }, Object.assign({}, o, { ch: 3 })]; });
        usedNpc[ia] = usedNpc[ib] = true; if (!decoy) listenN++; // la charla señuelo NO pide lupa ni cuenta como charla real
        return { room: pid, L };
      };
      let prevAbout = null;
      [listenClue, listenClue2].filter(Boolean).forEach((cl, k) => {
        const pl = cl.source.place, about = aboutOf(cl), pr2 = G.rng(((b.seed >>> 0) ^ (0x1157f + k)) >>> 0), s2 = cand.filter((id) => !usedNpc[id]);
        for (let i = s2.length - 1; i > 0; i--) { const j = (pr2() * (i + 1)) | 0, tt = s2[i]; s2[i] = s2[j]; s2[j] = tt; }
        let pair = null, veiled = false;
        // c4-2c GRAB-4 (v7): pasada 2 = ÚLTIMO RECURSO. Si todos los sospechosos libres viven en la sala de la charla (Fácil: 4 en una sala), vale una pareja de esa sala: en el cap. 3 «vuelven» a su sitio y la charla sigue grabable (no se pierde nada: la pista se puede coger en el 2 o en el 3). Antes, esa pista caía en un objeto suelto y el caso se quedaba sin charla.
        for (let pass = 0; pass < 3 && !pair; pass++) for (let i = 0; i < s2.length && !pair; i++) for (let j = i + 1; j < s2.length && !pair; j++) {
          if (pass < 2 && home(s2[i]) === pl && home(s2[j]) === pl) continue; // en el cap. 3 «volverían» a la sala de la charla y seguiría grabable
          if (pass === 0 && (s2[i] === about || s2[j] === about)) continue; // el sujeto de la pista no charla de sí mismo
          pair = [s2[i], s2[j]]; veiled = pass === 0;
        }
        if (!pair || !bank) { // rescate: la pista va a un objeto normal de su sala
          const n = (used[pl] = used[pl] || 0); used[pl]++;
          const sl = tpl[pl].slots[n];
          if (!sl) throw new Error(`compileBible: la sala «${pl}» no tiene hueco para el objeto n.º ${n + 1} (plantilla ${tpl[pl].id})`);
          rec(pl).props.push({ id: 'obj_' + cl.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: cl.title, shimmer: true, steps: [{ tool: null, who: voz(cl.id), text: cl.text, clue: cl.id }], doneText: 'Ya lo has examinado.' });
          return;
        }
        const ia = pair[0], ib = pair[1];
        let lines = baseChat(ia, ib);
        // c4-3 3/4-b (4): la refutación REAL «grabación» (rastro del inocente que miente, `tracesGrab`) usa el tono SOSPECHOSO de la charla señuelo (`VEIL.senuelo`), no el de `VEIL.roles.refuta`: así el tono no delata cuál es la falsa
        if (veiled && VEIL && about) {
          const v = pick(lr, (G.GEN_VERSION >= 7 && cl.role === 'refuta' && cl.kind === 'grabación' && VEIL.senuelo) ? VEIL.senuelo : (VEIL.roles[cl.role] || VEIL.roles.prueba)), vv = { who: nameOf(about), prev: prevAbout ? nameOf(prevAbout) : '' };
          const react = k > 0 && prevAbout ? pick(lr, prevAbout === about ? VEIL.link.confirma : VEIL.link.contrasta) : v[1];
          lines = [lines[0], lines[1], { who: ia, text: fill(v[0], vv) }, { who: ib, text: fill(react, vv) }];
          prevAbout = about;
        }
        const o = mount(pl, ia, ib, lines, cl);
        if (k === 0) listenOf = o; else { listenOf2 = o; builtChat2 = true; }
      });
      if (!listenClue && LS && roll < LS.chance && cand.length >= 2 && lrooms.length) { // curiosidad sin pista (como siempre)
        const pid = lrooms[(lr() * lrooms.length) | 0], sh = cand.slice();
        for (let i = sh.length - 1; i > 0; i--) { const j = (lr() * (i + 1)) | 0, tt = sh[i]; sh[i] = sh[j]; sh[j] = tt; }
        listenOf = mount(pid, sh[0], sh[1], baseChat(sh[0], sh[1]), null);
      }
      // c4-3 3/4-b (2): CHARLA SEÑUELO. Va DESPUÉS de las reales y de la curiosidad (no les quita pareja ni rincón). Azar propio para la pareja (seed ^ 0xc43c44). Pareja libre: sin gatos, sin vigilante, sin nadie de otra charla, que no viva entera en la sala y que no sea el sujeto de la pista. Sala con rincón de charla y SIN otra charla montada.
      // La charla lleva 2 frases de humor + la insinuación SOSPECHOSA sobre el sujeto de la pista falsa (`LS.veil.senuelo`). Sin pareja o sin rincón: la pista vuelve a su tipo anterior y se coloca como objeto normal de su sala (nunca se pierde).
      if (decoyChat && LS && VEIL && VEIL.senuelo && bank) {
        const pl = decoyChat.source.place, about = aboutOf(decoyChat), dr = G.rng(((b.seed >>> 0) ^ 0xc43c44) >>> 0), s2 = cand.filter((id) => !usedNpc[id]);
        for (let i = s2.length - 1; i > 0; i--) { const j = (dr() * (i + 1)) | 0, tt = s2[i]; s2[i] = s2[j]; s2[j] = tt; }
        let pair = null;
        if (about && tpl[pl].listen && !rec(pl).props.some((pp) => pp.listen)) for (let pass = 0; pass < 2 && !pair; pass++) for (let i = 0; i < s2.length && !pair; i++) for (let j = i + 1; j < s2.length && !pair; j++) {
          if (pass === 0 && home(s2[i]) === pl && home(s2[j]) === pl) continue; // pasada 1 = último recurso (Fácil: 4 sospechosos en una sala): en el cap. 3 «vuelven» a la sala y la charla sigue grabable
          if (s2[i] === about || s2[j] === about) continue;
          pair = [s2[i], s2[j]];
        }
        if (pair) {
          const ln = baseChat(pair[0], pair[1]), v = pick(lr, VEIL.senuelo), vv = { who: nameOf(about) };
          decoyOf = mount(pl, pair[0], pair[1], [ln[0], ln[1], { who: pair[0], text: fill(v[0], vv) }, { who: pair[1], text: fill(v[1], vv) }], decoyChat, true);
        }
      }
      if (decoyChat && !decoyOf) { // sin charla: vuelve a su tipo anterior y es un objeto normal
        decoyChat.kind = decoyChat.kindAntes || decoyChat.kind; clues[decoyChat.id].kind = decoyChat.kind; clues[decoyChat.id].icon = ICON[decoyChat.kind] || 'ico_clue';
        const pl = decoyChat.source.place, n = (used[pl] = used[pl] || 0); used[pl]++; const sl = tpl[pl].slots[n];
        if (!sl) throw new Error(`compileBible: la sala «${pl}» no tiene hueco para el objeto n.º ${n + 1} (plantilla ${tpl[pl].id})`);
        rec(pl).props.push({ id: 'obj_' + decoyChat.id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: decoyChat.title, shimmer: true, steps: [{ tool: null, who: voz(decoyChat.id), text: decoyChat.text, clue: decoyChat.id }], doneText: 'Ya lo has examinado.' });
      }
    }

    // ---- A4 4/4 subpaso 2 (GEN_VERSION >= 6): REPARTO EQUILIBRADO POR CONSTRUCCIÓN (EQ-1, banda 40-60 % por caso y por capítulo, en número y en tiempo; medida: G.workShare).
    // Cada capítulo con trabajo lleva UN paso por detective: cap. 1 = cadena ganzúa (Oli) → UV (Lali); cap. 2 = lupa (Oli) + charla grabada (Lali). Por eso la lupa pasa al cap. 2 (chapterMin 2) cuando hay charla; sin charla no tiene pareja y se vuelve pista libre.
    // Después un balanceador estira el `time` del lado más corto de cada capítulo (hasta `MECH.workCap` veces su tiempo base: «cerradura dura», «tinta tenue», «huella borrosa») para que los segundos también queden cerca del 50/50. Los casos que aun así no cumplan (p. ej. sin UV) los rechaza el revisor (subpaso 3).
    const lupaCh2 = {};
    if (G.GEN_VERSION >= 6) {
      let lupaLeft = H2 ? listenN : (listenOf ? 99 : 0); // v6: una charla basta; v7: una lupa por charla realmente montada (la que sobra pasa a pista libre)
      const freeLupa = (id) => { const cl = b.clues.find((c) => c.id === id), pr = rooms[cl.source.place].props.find((q) => q.id === 'obj_' + id); if (!pr) return false; const st = pr.steps[0]; st.tool = null; delete st.time; st.who = voz(id); st.text = cl.text; delete toolOf[id]; return true; };
      if (H2) { // cp. 177 (decisión del usuario): NO se emparejan pasos. Cada detective hace los suyos; el reparto 40-60 % se mide sobre el caso entero. Solo si Oli se pasa de 60 % (Oli > 1,5 × Lali en número) se libera alguna lupa (pasa a pista libre).
        const cnt = () => { const c = { rex: 0, luna: 0 }; Object.keys(rooms).forEach((rid) => (rooms[rid].props || []).forEach((pr) => (pr.steps || []).forEach((st) => { if (!st.tool || st.tool === 'coop') return; const w = G.toolOwner(st.tool); if (w) c[w]++; }))); return c; };
        const lupas = Object.keys(toolOf).filter((id) => toolOf[id] === 'lupa');
        // c4-2b-4 paso 1 (GEN_VERSION >= 7, cp. 233): TOPE DE LUPA por nivel (`MECH.herr2.lupaTope[nivel]` = [[tope, peso], …], mín./máx./pesos en datos; banda del usuario 1,7-2,2 por caso). Si hay más lupas que el tope se liberan (pasan a pista libre) PRIMERO las de señuelo y luego las de sostén.
        // No depende de los pasos de Lali. Azar propio (seed ^ 0x70b3e5). Con `lupaTope` ausente o apagado no hace nada.
        if (MECH.herr2.lupaTope && b.level && MECH.herr2.lupaTope[b.level]) {
          const falsa = (id) => (b.clues.find((q) => q.id === id) || {}).role === 'falsa';
          lupas.sort((x, y) => (falsa(x) ? 1 : 0) - (falsa(y) ? 1 : 0));
          const tr = G.rng(((b.seed >>> 0) ^ 0x70b3e5) >>> 0), tb = MECH.herr2.lupaTope[b.level], tt = tb.reduce((x, e) => x + e[1], 0);
          let k = tr() * tt, tope = tb[tb.length - 1][0]; for (let i = 0; i < tb.length; i++) { k -= tb[i][1]; if (k < 0) { tope = tb[i][0]; break; } }
          while (lupas.length > tope) freeLupa(lupas.pop());
        }
        while (lupas.length) { const c = cnt(); if (c.rex <= 1.5 * c.luna) break; freeLupa(lupas.pop()); }
        // c4-4 subpaso 2 (GEN_VERSION >= 7, `herr2.balanceaLali`): si Lali lleva demasiados pasos (Oli por debajo de la banda 40-60 % del caso en número; lo habitual con la charla señuelo y las UV señuelo),
        // se liberan UV SEÑUELO de Lali (pasan a objeto normal con su texto, en un hueco libre de su sala) en vez de rechazar el caso. Solo señuelos (nunca la cadena ganzúa→UV ni las UV de sostén) y solo el MÍNIMO k que deja a Oli dentro de la banda
        // (si ningún k ≤ nº de señuelos lo consigue no se toca nada). Azar propio (seed ^ 0xc44a02). El tiempo lo ajusta después el balanceador de abajo.
        if (H2.balanceaLali) {
          const c0 = cnt(), B = G.WORK_BAND, inBand = (r, l) => r + l > 0 && (100 * r) / (r + l) >= B.min - 1e-9 && (100 * r) / (r + l) <= B.max + 1e-9;
          const cands = Object.keys(toolOf).filter((id) => toolOf[id] === 'uv' && decoyUv[id]);
          if (!inBand(c0.rex, c0.luna) && (100 * c0.rex) / (c0.rex + c0.luna) < B.min) {
            let k = 0; while (k <= cands.length && !inBand(c0.rex, c0.luna - k)) k++;
            if (k > 0 && k <= cands.length) {
              const ur = G.rng(((b.seed >>> 0) ^ 0xc44a02) >>> 0);
              for (let i = cands.length - 1; i > 0; i--) { const j = (ur() * (i + 1)) | 0, tt = cands[i]; cands[i] = cands[j]; cands[j] = tt; }
              let done = 0;
              for (let i = 0; i < cands.length && done < k; i++) {
                const id = cands[i], cl = b.clues.find((q) => q.id === id), pl = cl.source.place, ix = rooms[pl].props.findIndex((q) => q.id === 'obj_' + id), n = used[pl] || 0, sl = tpl[pl].slots[n];
                if (ix < 0 || !sl) continue; // sin hueco libre en su sala: se prueba con otra
                rooms[pl].props.splice(ix, 1); used[pl] = n + 1;
                rooms[pl].props.push({ id: 'obj_' + id, sprite: sl[2], x: sl[0], y: sl[1], solid: true, label: cl.title, shimmer: true, steps: [{ tool: null, who: voz(id), text: cl.text, clue: id }], doneText: 'Ya lo has examinado.' });
                delete toolOf[id]; done++;
              }
            }
          }
        }
      } else Object.keys(toolOf).filter((id) => toolOf[id] === 'lupa').forEach((id) => {
        const cl = b.clues.find((c) => c.id === id), pr = rooms[cl.source.place].props.find((q) => q.id === 'obj_' + id);
        if (!pr) return;
        if (lupaLeft > 0) { lupaLeft--; pr.chapterMin = 2; lupaCh2[id] = true; return; }
        freeLupa(id); // sin charla no hay pareja para la lupa: pista libre
      });
      const CAP = MECH.workCap || 3, byCh = {};
      Object.keys(rooms).forEach((rid) => (rooms[rid].props || []).forEach((pr) => (pr.steps || []).forEach((st) => {
        if (!st.tool || st.tool === 'coop') return;
        const who = G.toolOwner(st.tool); if (!who) return;
        const kc = H2 ? 1 : (pr.chapterMin || 1), c = (byCh[kc] = byCh[kc] || { rex: [], luna: [] }); // v7: se equilibra el caso entero (cp. 177)
        c[who].push(st);
      })));
      const tot = (a) => a.reduce((x, st) => x + G.stepBaseSeconds(st), 0);
      Object.keys(byCh).forEach((ch) => {
        const c = byCh[ch], tr_ = tot(c.rex), tl_ = tot(c.luna);
        if (!c.rex.length || !c.luna.length) return; // sin pareja no hay nada que equilibrar (lo señala el revisor)
        const lo = tr_ < tl_ ? c.rex : c.luna, f = Math.min(CAP, Math.max(tr_, tl_) / Math.min(tr_, tl_));
        lo.forEach((st) => { st.time = Math.round(G.stepBaseSeconds(st) * f * 100) / 100; });
      });
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
        [listenOf, listenOf2, decoyOf].forEach((lo) => { if (lo && lo.room === pid) { const L = lo.L; add(L.a.x, L.a.y); add(L.b.x, L.b.y); add(L.x, L.y + 1); add(L.x + 1, L.y + 1); } }); // A4 3/4-b1: personajes de la charla y hueco del detective (la zona ya está en props)
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
      // reparto de herramientas (cp. 185, S3, GEN_VERSION >= 7): TODOS los casos llevan de 1 a 3 situaciones (cifra sorteada con pesos en `S.counts`: más casos con 2), con las situaciones que ya existen (todas con humor); la intensidad la da el número, no un tipo de caso.
      // El relleno de duración (más abajo) llega a la meta de tiempo del nivel, así que cada situación de más desplaza una curiosidad.
      const sitV7 = G.GEN_VERSION >= 7 && MX.sit.counts;
      if (sitV7 || mood !== 'claro') {
        const sr = G.rng(((b.seed >>> 0) ^ 0x4c4c2) >>> 0), S = MX.sit;
        let n;
        if (sitV7) { const tot = S.counts.reduce((a, x) => a + x[1], 0); let k = sr() * tot; n = S.counts[S.counts.length - 1][0]; for (let i = 0; i < S.counts.length; i++) { k -= S.counts[i][1]; if (k < 0) { n = S.counts[i][0]; break; } } }
        else { n = sr() < S.chance[mood] ? 1 : 0; if (n && mood === 'macabro' && sr() < S.second) n = 2; else if (mood === 'macabro') sr(); }
        const items = S.items.filter((q) => sitV7 || mood === 'macabro' || q.soft);
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
        const chatBank = shuf(EX.chat), curBank = shuf(G.GEN_VERSION >= 7 && b.level === 'dificil' && EX.curiosV7 ? EX.curios.concat(EX.curiosV7) : EX.curios), chatN = {}, curN = {};
        let nChat = 0, nCur = 0, nCoin = 0, order = shuf(P); const coinsOn = !!EX.coins && !(opts && opts.noCoins); // 4F-0a/4: monedas sueltas (opts.noCoins solo para la prueba que demuestra que son el ÚNICO cambio)
        const est = () => { // duración estimada con el medidor (src/meter.js): curiosidades y charlas de relleno tienen coste propio en `G.METER_CFG`
          if (G.meterSeconds && G.meterFeatures) return G.meterSeconds(G.meterFeatures({ rooms, npcs, clues: {} }));
          let topics = 0, steps = 0, curios = 0; // respaldo si meter.js no está cargado
          Object.keys(npcs).forEach((id) => { topics += ((npcs[id] && npcs[id].topics) || []).filter((q) => !/^f_ch\d/.test(q.id)).length; });
          P.forEach((pid) => (rooms[pid].props || []).forEach((q) => { if (/^cur_/.test(q.id)) curios++; else if (!q.chat) steps += (q.steps || []).length; }));
          return Math.max(120, MC.base + MC.perTopic * topics + MC.perStep * steps + MC.perRoom * P.length + EX.perCurio * curios);
        };
        const LV7 = G.GEN_VERSION >= 7 && T.levels && b.level && T.levels[b.level], chatCap = LV7 && LV7.maxChatPerNpcV7 ? LV7.maxChatPerNpcV7 : EX.maxChatPerNpc; // CL-5a: tope de charlas por nivel solo en v7
        const addChat = () => {
          const c = talkers.filter((id) => (chatN[id] || 0) < chatCap).sort((a, z) => (chatN[a] || 0) - (chatN[z] || 0) || (xr() < 0.5 ? -1 : 1))[0];
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
            const coin = coinsOn && nCur % EX.coins.every === 0 && nCoin < EX.coins.n ? EX.coins.lines[nCoin++ % EX.coins.lines.length].replace('{n}', EX.coins.amount) : null;
            room.props.push({ id: 'cur_' + nCur, sprite: it.sprite, x: t.x, y: t.y, solid: true, label: it.label, shimmer: true, steps: [Object.assign({ tool: null, who: nCur % 2 ? 'rex' : 'luna', text: it.text[0] + ' ' + it.text[1] + (coin ? ' ' + coin : '') }, coin ? { fx: { money: EX.coins.amount, sfx: 'pickup' } } : {})], doneText: EX.done });
            curN[pid] = (curN[pid] || 0) + 1; order = order.slice(k + 1).concat(order.slice(0, k + 1)); return true;
          }
          return false;
        };
        const LV = G.GEN_VERSION >= 6 && T.levels && b.level && T.levels[b.level], target = (LV ? (G.GEN_VERSION >= 7 && LV.targetMinV7 ? LV.targetMinV7 : LV.targetMin) : EX.targetMin) * 60; // v6: el relleno llega al objetivo de SU nivel (3-bis 2/3)
        for (let guard = 0; guard < 80 && est() < target; guard++) if (!addCurio()) break; // la duración la dan las curiosidades (miden ~19 s cada una con el bot)
        // charlas de detalle: SIEMPRE, hasta `maxChatPerNpc` por personaje (no cuentan para la duración medida: el bot no las pregunta; son humor y rincones para el jugador humano)
        for (let guard = 0; guard < 40; guard++) if (!addChat()) break;
        // CL-5c-b (GEN_VERSION >= 7, solo Difícil): PASOS DE PUZLE. Cada puzle del caso (`b.puzzles`, de gen_clues.js) SUSTITUYE a una curiosidad ya colocada (no añade sitios nuevos): el mismo objeto pasa a ser `pz_N` con minijuego
        // (código = HHMM de la hora impresa en su pista; línea de tiempo = sucesos de sus pistas en orden). `requires` = las pistas del puzle (nunca está detrás de nada que dependa del puzle y no entrega pistas: sin ciclo posible).
        // Azar PROPIO (seed ^ 0x7a2c6). Si no queda ninguna curiosidad que sustituir, ese puzle no se coloca.
        if (G.GEN_VERSION >= 7 && b.puzzles && b.puzzles.length && T.puzzlesV7) {
          const PZ = T.puzzlesV7, zr = G.rng(((b.seed >>> 0) ^ 0x7a2c6) >>> 0), curs = [];
          P.forEach((pid) => (rooms[pid].props || []).forEach((q) => { if (/^cur_\d+$/.test(q.id)) curs.push(q); }));
          b.puzzles.forEach((pz, n) => {
            if (!curs.length) return;
            const q = curs.splice((zr() * curs.length) | 0, 1)[0], old = q.steps[0], ev = pz.events.map((x) => Object.assign({ clue: x.clue }, { e: b.truth.timeline[x.i] }));
            const bank = (pz.type === 'code' ? PZ.codes : PZ.lines).filter((x) => x.id === pz.bank)[0]; if (!bank) return;
            const coin = coinsOn && old.fx && old.fx.money ? EX.coins.lines.map((l) => l.replace('{n}', EX.coins.amount)).filter((l) => old.text.slice(-l.length) === l)[0] : null; // la moneda de siempre, si esta curiosidad la llevaba
            const mini = pz.type === 'code'
              ? { type: 'code', code: pz.code, title: bank.title, hint: fill(bank.hint, { q: fill(PZ.question, { who: nameOf(ev[0].e.who), to: G.placeById(ev[0].e.place).to }) }) }
              : { type: 'timeline', verb: 'Ordenar', icon: 'ico_clue', title: bank.title, hint: bank.hint, events: ev.map((x) => ({ text: nameOf(x.e.who) + ': ' + lower1(dot(x.e.doing)), time: G.minToStr(x.e.t), clue: x.clue })) };
            q.id = pz.id; q.sprite = bank.sprite; q.label = bank.label;
            q.steps = [Object.assign({ tool: null, who: n % 2 ? 'luna' : 'rex', requires: { clue: pz.clues.slice() }, mini, text: bank.prize[0] + ' ' + bank.prize[1] + (coin ? ' ' + coin : '') }, coin ? { fx: old.fx } : {})];
          });
        }
      }
    }

    // ---- solución, mentiras, capítulos
    // cp. 187 (arreglo del defecto del cp. 186): en v7 una pista cuenta como charla SOLO si la charla existe de verdad en una sala ya construida (prop `obj_<id>` con `listen`); v6 queda IDÉNTICO.
    const builtListen = (id) => Object.keys(rooms).some((pid) => (rooms[pid].props || []).some((pp) => pp.id === 'obj_' + id && pp.listen));
    const isListen = G.GEN_VERSION >= 7 ? (id) => ((listenClue && id === listenClue.id) || (listenClue2 && id === listenClue2.id)) && builtListen(id) : (id) => (listenClue && id === listenClue.id) || (builtChat2 && listenClue2 && id === listenClue2.id); // la 2.ª charla solo cuenta si se montó (si no, su pista es un objeto normal)
    const lies = {}; b.lies.forEach((l) => { lies[l.who] = { flag: 'lie_' + l.who, refutedBy: l.refutedBy.slice(), said: l.said }; });
    const gatedIds = G.GEN_VERSION >= 6 ? b.clues.filter((c) => c.source.type === 'prop' && (toolOf[c.id] || pushOf[c.id] || watchOf[c.id]) && !isListen(c.id)).map((c) => c.id) : []; // b2 paso 3: herramienta, empujón y sigilo pesan en el cap. 2
    const physical = b.clues.filter((c) => c.source.type === 'prop' && !isListen(c.id) && !lupaCh2[c.id] && !(decoyOf && decoyChat && c.id === decoyChat.id)).map((c) => c.id); // A4 4/4-2: la lupa del cap. 2 no cuenta en «Busca pistas»
    const freeN = physical.filter((id) => gatedIds.indexOf(id) < 0).length; // b2 paso 3: las herramientas se usan desde el cap. 1, pero el mínimo del objetivo se cumple SIEMPRE con pistas libres (nadie se atasca) // b2 3-bis: la pista de la charla grabada solo existe desde el cap. 2 (chapterMin 2): va al objetivo del cap. 2, no al del 1 (antes la ayuda mandaba a un objeto inalcanzable y el caso se alargaba hasta 63 min)
    const witness = b.clues.filter((c) => c.source.type === 'npc' || isListen(c.id) || lupaCh2[c.id]).map((c) => c.id); // 4D-2: testimonios (se obtienen preguntando a un personaje)
    // c3 subpaso 3 (GEN_VERSION >= 7): las charlas grabadas son el trabajo propio de Lali en el cap. 2, así que se exigen TODAS (objetivo propio g2c); en v6 contaban como un testimonio más y en ~96 % de los casos se podían saltar. Los testimonios de personajes siguen con su 60 % (g2b).
    const witnessNpc = G.GEN_VERSION >= 7 ? witness.filter((id) => !isListen(id)) : witness, witnessListen = G.GEN_VERSION >= 7 ? witness.filter((id) => isListen(id)) : [];
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
      theme: b.theme, goal: b.goal, scenario: b.scenario, // 4F-0a: marco de temáticas (undefined en biblias hechas a mano)
      genDecoys: b.level ? (b.deceptive || []).length : undefined, // S3b-1: nº de engañosos del caso (la nota lo compara con el rango de su nivel)
      genV: G.GEN_VERSION >= 7 ? G.GEN_VERSION : undefined, // CL-3: receta del generador SOLO en v7+ (undefined en v6 = el caso sale idéntico); activa Acusar por razones en logic.js
      genLevel: b.level, // S3b-1: dificultad con la que se generó (facil/normal/dificil; `level` sigue siendo el número de caso). Undefined si la biblia no lo trae (se descarta al serializar)
      start: { room: P[0], p1: [6, 7], p2: [7, 7] }, clientId: cli.id, clues,
      suspects: susIds.map((s) => ({ id: s, name: nameOf(s), desc: nameOf(s) + ', sospechoso.', look: b.cast.find((x) => x.id === s).look, clearedBy: b.alibis[s].clearedBy ? [b.alibis[s].clearedBy] : [] })),
      solution, lies,
      chapters: [ // 4D-2: tres capítulos (antes 2): pistas de objeto → interrogatorio (hablar con todos y escuchar a los testigos) → acusación
        { id: 1, title: 'Pistas', goals: [{ id: 'g1', text: 'Busca pistas', clues: physical, min: Math.min(Math.ceil(physical.length * 0.6), freeN) }] },
        { id: 2, title: 'Interrogatorio', goals: [{ id: 'g2', text: 'Habla con todos', flags: susIds.map((s) => 'talked_' + s), min: susIds.length }].concat(witnessNpc.length ? [{ id: 'g2b', text: 'Escucha a los testigos', clues: witnessNpc, min: Math.ceil(witnessNpc.length * 0.6) }] : []).concat(witnessListen.length ? [{ id: 'g2c', text: 'Graba las charlas', clues: witnessListen, min: witnessListen.length }] : []) },
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
    const theme = opts && opts.theme ? opts.theme : G.DEFAULT_THEME; // 4F-0a: temática pedida (hoy solo Robo está lista)
    if (!G.themeReady(theme)) return { error: G.themeOk(theme) ? 'La temática «' + G.THEMES[theme].name + '» aún no está lista (llega con el paquete ' + G.THEMES[theme].step + ')' : 'Temática desconocida: ' + theme, fails: [], attempts: 0, code: G.caseCode(seed, theme) };
    const fails = [];
    for (let k = 0; k < G.GEN_MAX_ATTEMPTS; k++) {
      const s = (seed + Math.imul(k, 0x9e3779b1)) >>> 0;
      let why = null, bible = null, def = null, review = null;
      try {
        bible = G.genClues(G.genTruth(s, opts), { mood: opts && G.MOODS.indexOf(opts.mood) >= 0 ? opts.mood : G.pickMood(s, theme), recentPuzzles: opts && opts.recentPuzzles }); // 4C-4c-1: el ambiente se decide ANTES de las pistas (mismo azar que antes: G.pickMood(s))
        const cb = G.checkBible(bible);
        if (!cb.ok) why = 'biblia: ' + cb.errors.slice(0, 2).map((e) => e.code + ' ' + e.path + ' ' + e.msg).join(' | ');
        else {
          def = G.compileBible(bible, opts);
          if (G.meterCase) { const mt = G.meterCase(def); def.parSeconds = mt.parSeconds; def.reward = mt.reward; } // 4D-1: tiempo de referencia y recompensa por caso (antes 600/100 fijos)
          const v = G.validateCase(def);
          if (!v.ok) why = 'validador: ' + v.errors.slice(0, 2).join(' | ');
          else {
            review = G.reviewCase(def, { bible });
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
    return { error: 'La semilla ' + seed + ' no dio un caso aceptado en ' + G.GEN_MAX_ATTEMPTS + ' intentos', fails, attempts: G.GEN_MAX_ATTEMPTS, code: G.caseCode(seed, theme) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
