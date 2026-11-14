// schema.js — FORMATO OFICIAL DE UN CASO (versión 1 · fábrica de casos, fase 1B-2)
// Describe qué es un caso válido: campos obligatorios y opcionales, tipos y referencias cruzadas
// (salas, puertas, personajes, pistas, banderas...). Es la única fuente de verdad del formato; el texto
// explicado está en docs/FORMATO_DE_CASO.md.
// G.checkCaseFormat(def) → { errors, warnings, shapeOk }. `G.validateCase` lo llama primero:
//   · si la FORMA está mal (falta un campo, un tipo equivocado, una errata en un nombre) devuelve solo esos errores,
//     porque el resto de comprobaciones no pueden fiarse de datos mal formados;
//   · si la forma está bien, además comprueba las referencias cruzadas y deja pasar al validador y la simulación.
// Esto NO juzga si el caso es justo o divertido (eso es la fase 2).
(function (root) {
  'use strict';
  const G = root.G;
  G.CASE_FORMAT = 1;

  // Sonidos que un efecto (`fx.sfx`) puede pedir. La prueba unitaria comprueba que coincide con core.js.
  G.SFX_NAMES = ['select', 'ok', 'back', 'error', 'pickup', 'clue', 'unlock', 'door', 'tool', 'work', 'hint', 'talk', 'crack', 'success', 'fanfare', 'objection', 'boing', 'meow', 'creak'];
  G.CLUE_KINDS = ['física', 'documento', 'grabación', 'testimonio', 'deducción'];
  G.MINI_TYPES = ['code', 'timeline'];
  G.FACES = ['up', 'down', 'left', 'right'];
  // suelos disponibles: los sprites floor_* (floor_wood2 es solo la variante del ajedrezado de la madera)
  G.floorNames = () => Object.keys(G.spr).filter((k) => /^floor_/.test(k) && k !== 'floor_wood2').map((k) => k.slice(6));

  // ---------------------------------------------------------------- DESCRIPTORES
  const str = { k: 'str' };
  const strN = { k: 'str', nullable: true };
  const bool = { k: 'bool' };
  const num = (o) => Object.assign({ k: 'num' }, o);
  const int = (o) => Object.assign({ k: 'num', int: true }, o);
  const arr = (of, o) => Object.assign({ k: 'arr', of }, o);
  const tuple = (n, of) => ({ k: 'tuple', n, of });
  const dict = (of, o) => Object.assign({ k: 'dict', of }, o);
  const obj = (req, opt) => ({ k: 'obj', req: req || {}, opt: opt || {} });
  const en = (list) => ({ k: 'enum', list });
  const strs = { k: 'strs' }; // un texto o una lista de textos
  const either = (pick, alts) => ({ k: 'either', pick, alts });
  const ID = /^[A-Za-z][A-Za-z0-9_]*$/; // ids de salas, personajes y pistas
  const ID2 = /^[A-Za-z0-9_]+$/; // ids de objetos y puertas

  // condiciones (recursivas: any / not)
  const COND = obj({}, {
    clue: strs, notClue: strs, anyClue: strs, flag: strs, notFlag: strs,
    trustMin: num(), trustMax: num(), pressureMin: num(), chapterMin: int({ min: 1 }), chapterMax: int({ min: 1 }),
    flagCountMin: obj({ prefix: str, min: int({ min: 1 }) }),
  });
  COND.opt.any = arr(COND, { min: 1 });
  COND.opt.not = COND;
  // efectos (de pasos, respuestas de personajes...)
  const FX = obj({}, {
    clue: strs, flag: strs, unflag: strs, trust: num(), pressure: num(), lockFor: num({ min: 0 }), money: num(), sfx: en(G.SFX_NAMES),
    moveProp: obj({ id: str, dx: int(), dy: int() }),
  });

  const LINE = obj({ who: str, text: str });
  const MINI = obj({ type: en(G.MINI_TYPES) }, {
    title: str, hint: str, verb: str, icon: str, code: str,
    events: arr(obj({ text: str, time: str }, { clue: str }), { min: 1 }),
  });
  const STEP = obj({ who: str, text: str }, { tool: strN, time: num({ min: 0.1 }), clue: str, fx: FX, requires: COND, mini: MINI });
  // A4 HERR-1 2/4: charla que se graba (objeto con `listen: true`): dos personajes (a, b) y sus frases en orden; cada frase se muestra como burbuja mientras se graba
  const CHAT = obj({ a: str, b: str, lines: arr(obj({ who: str, text: str }), { min: 2 }) });
  const PROP = obj({ id: str, sprite: strN, x: int({ min: 0 }), y: int({ min: 0 }) }, {
    w: int({ min: 1 }), h: int({ min: 1 }), dy: num(), solid: bool, label: str, shimmer: bool, steps: arr(STEP, { min: 1 }),
    doneText: str, denied: str, visible: COND, chapterMin: int({ min: 1 }), uvOnly: bool,
    uvMark: obj({ sprite: str, afterStep: int({ min: 0 }) }, { dy: num() }),
    swap: obj({ flag: str, sprite: str }), ref: str, pigeon: bool, listen: bool, watcher: str, chat: CHAT,
  });
  const DOOR = obj({ id: str, x: int({ min: 0 }), sprite: str, to: obj({ room: str, door: str }) }, {
    y: int({ min: 0 }), wall: str, lockedSprite: str, label: str,
    locked: obj({}, { tool: strN, time: num({ min: 0.1 }), chapterMin: int({ min: 1 }), denied: str, text: str }),
    firstOpen: obj({ who: str, text: str, clue: str }),
  });
  const TILE_ART = obj({ sprite: str, x: int({ min: 0 }), y: int({ min: 0 }) }, { w: int({ min: 1 }), h: int({ min: 1 }), big: bool });
  const ROOM = obj({ name: str, map: arr(str, { min: 3 }), props: arr(PROP), doors: arr(DOOR) }, {
    floor: { k: 'enum', list: () => G.floorNames() }, wallStyle: en(['stone']), ambient: str, template: str,
    decor: arr(TILE_ART), decals: arr(TILE_ART), npcs: arr({ k: 'any' }),
  });
  const CLUE = obj({ title: str, icon: str, kind: en(G.CLUE_KINDS), text: str }, { sus: dict(num(), { keyRe: ID }) });
  const SUSPECT = obj({ id: str, name: str, desc: str, look: str, clearedBy: arr(str) }, { easyHidden: bool });
  const OPTION = obj({ id: str, text: str }, { needs: arr(str) });
  const SOLUTION = obj({ culprit: str, method: str, motive: str, methods: arr(OPTION, { min: 2 }), motives: arr(OPTION, { min: 2 }), proof: arr(str, { min: 3 }) });
  const GOAL = obj({ id: str, text: str }, { clue: str, clues: arr(str, { min: 1 }), flags: arr(str, { min: 1 }), min: int({ min: 1 }) });
  const CHAPTER = obj({ id: int({ min: 1 }), title: str, goals: arr(GOAL, { min: 1 }) }, { intro: arr(LINE, { min: 1 }), outro: arr(LINE, { min: 1 }) });
  // una respuesta de personaje: lista de frases (atajo) o { say, when?, fx? }
  const ENTRY = either((v) => (Array.isArray(v) ? 0 : 1), [arr(str, { min: 1 }), obj({ say: arr(str, { min: 1 }) }, { when: COND, fx: FX })]);
  const TOPIC = obj({ id: str, label: str, responses: arr(ENTRY, { min: 1 }) }, { show: COND });
  const WATCH = obj({}, {
    period: obj({}, { normal: num({ min: 1 }), hard: num({ min: 1 }) }), look: obj({}, { normal: num({ min: 0.3 }), hard: num({ min: 0.3 }) }),
    offset: num({ min: 0 }), face: obj({}, { watching: en(G.FACES), idle: en(G.FACES) }), spotted: str,
  });
  const NPC = obj({
    name: str, title: str, look: str, first: arr(str, { min: 1 }), topics: arr(TOPIC, { min: 1 }),
    evidenceDefault: arr(str, { min: 1 }), evidence: dict(arr(ENTRY)),
  }, { chat: arr(ENTRY), press: arr(ENTRY), cat: bool, petReward: num({ min: 0 }), watch: WATCH });
  const PLACE = obj({ ch: int({ min: 1 }), room: str, x: int({ min: 0 }), y: int({ min: 0 }) }, { face: en(G.FACES), wander: arr(tuple(2, int({ min: 0 })), { min: 1 }) });
  const BANTER = obj({}, { enter: dict(arr(str, { min: 1 })), idle: arr(str, { min: 1 }), theory: dict(arr(str, { min: 1 })), help: arr(str, { min: 1 }), done: arr(str, { min: 1 }) });
  const CASE = obj({
    id: { k: 'str', re: /^[a-z][a-z0-9_]*$/, reText: 'solo minúsculas, números y _ (empieza por letra)' },
    title: str, client: str, blurb: str, level: int({ min: 1 }), parSeconds: int({ min: 60 }), reward: int({ min: 0 }),
    start: obj({ room: str, p1: tuple(2, int({ min: 0 })), p2: tuple(2, int({ min: 0 })) }),
    clientId: str,
    clues: dict(CLUE, { keyRe: ID, minKeys: 1 }),
    suspects: arr(SUSPECT, { min: 2 }),
    solution: SOLUTION,
    chapters: arr(CHAPTER, { min: 1 }),
    rooms: dict(ROOM, { keyRe: ID, minKeys: 1 }),
    npcs: dict(NPC, { keyRe: ID, minKeys: 1 }),
    epilogue: obj({ win: arr(LINE, { min: 1 }), fail: arr(LINE, { min: 1 }) }, { timeout: arr(LINE, { min: 1 }) }),
  }, {
    format: int({ min: 1 }), theme: str, goal: str, scenario: str, tone: str, mood: en(['claro', 'inquietante', 'macabro']), genLevel: en(['facil', 'normal', 'dificil']), genV: int({ min: 7 }), genDecoys: int({ min: 0 }), detectives: obj({}, { rex: str, luna: str }),
    lies: dict(obj({ flag: str, refutedBy: arr(str, { min: 1 }), said: str }), { keyRe: ID }),
    placement: dict(arr(PLACE), { keyRe: ID }),
    banter: dict(BANTER, { keyRe: ID }),
    tools: dict(arr(str, { min: 1 }), { keyRe: ID }), startTool: dict(int({ min: 0 }), { keyRe: ID }),
  });
  G.CASE_SCHEMA = CASE; // para documentación y herramientas

  // ---------------------------------------------------------------- COMPROBACIÓN DE FORMA
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const typeName = (v) => (v === null ? 'null' : Array.isArray(v) ? 'una lista' : typeof v === 'object' ? 'un objeto' : typeof v === 'string' ? 'un texto' : typeof v === 'number' ? 'un número' : typeof v === 'boolean' ? 'verdadero/falso' : String(typeof v));
  function check(d, v, path, out) {
    const E = (m) => out.push(`${path}: ${m}`);
    if (v === null && d.nullable) return;
    switch (d.k) {
      case 'any': return;
      case 'str':
        if (typeof v !== 'string') return E(`debe ser un texto (es ${typeName(v)})`);
        if (!v.trim()) return E('no puede estar vacío');
        if (d.re && !d.re.test(v)) E(`«${v}» no es válido (${d.reText || 'formato incorrecto'})`);
        return;
      case 'num':
        if (typeof v !== 'number' || !isFinite(v)) return E(`debe ser un número (es ${typeName(v)})`);
        if (d.int && Math.floor(v) !== v) E(`debe ser un número entero (es ${v})`);
        if (d.min !== undefined && v < d.min) E(`debe ser ${d.min} o más (es ${v})`);
        if (d.max !== undefined && v > d.max) E(`debe ser ${d.max} o menos (es ${v})`);
        return;
      case 'bool': if (typeof v !== 'boolean') E(`debe ser verdadero o falso (es ${typeName(v)})`); return;
      case 'enum': {
        const list = typeof d.list === 'function' ? d.list() : d.list;
        if (list.indexOf(v) < 0) E(`el valor «${v}» no es válido (permitidos: ${list.join(', ')})`);
        return;
      }
      case 'strs':
        if (typeof v === 'string') { if (!v.trim()) E('no puede estar vacío'); return; }
        if (!Array.isArray(v) || !v.length || v.some((x) => typeof x !== 'string' || !x.trim())) E('debe ser un texto o una lista de textos');
        return;
      case 'arr':
        if (!Array.isArray(v)) return E(`debe ser una lista (es ${typeName(v)})`);
        if (d.min !== undefined && v.length < d.min) E(`necesita al menos ${d.min} elemento${d.min === 1 ? '' : 's'} (tiene ${v.length})`);
        v.forEach((x, i) => check(d.of, x, path + '[' + (isObj(x) && typeof x.id === 'string' ? x.id : i) + ']', out));
        return;
      case 'tuple':
        if (!Array.isArray(v) || v.length !== d.n) return E(`debe ser una lista de ${d.n} valores`);
        v.forEach((x, i) => check(d.of, x, path + '[' + i + ']', out));
        return;
      case 'dict': {
        if (!isObj(v)) return E(`debe ser un objeto (es ${typeName(v)})`);
        const keys = Object.keys(v);
        if (d.minKeys && keys.length < d.minKeys) E(`necesita al menos ${d.minKeys} elemento${d.minKeys === 1 ? '' : 's'}`);
        keys.forEach((k) => {
          if (d.keyRe && !d.keyRe.test(k)) out.push(`${path}: el nombre «${k}» no es válido (letras, números y _; empieza por letra)`);
          check(d.of, v[k], path + '.' + k, out);
        });
        return;
      }
      case 'obj': {
        if (!isObj(v)) return E(`debe ser un objeto (es ${typeName(v)})`);
        Object.keys(d.req).forEach((k) => { if (v[k] === undefined) E(`falta el campo obligatorio «${k}»`); else check(d.req[k], v[k], path + '.' + k, out); });
        Object.keys(d.opt).forEach((k) => { if (v[k] !== undefined) check(d.opt[k], v[k], path + '.' + k, out); });
        Object.keys(v).forEach((k) => { if (!(k in d.req) && !(k in d.opt)) E(`campo desconocido «${k}» (¿errata? los campos válidos son: ${Object.keys(d.req).concat(Object.keys(d.opt)).join(', ')})`); });
        return;
      }
      case 'either': check(d.alts[d.pick(v)], v, path, out); return;
    }
  }

  // ---------------------------------------------------------------- REFERENCIAS CRUZADAS
  // Solo se llama con datos que ya pasaron la comprobación de forma.
  function refs(def, E, W) {
    const norm = (list) => (list || []).map((e) => (Array.isArray(e) ? { say: e } : e));
    const roomIds = Object.keys(def.rooms), npcIds = Object.keys(def.npcs), suspIds = def.suspects.map((s) => s.id);
    const nCh = def.chapters.length;
    const speaker = (w) => w === 'rex' || w === 'luna' || w === 'narrator' || !!def.npcs[w];
    const needSpeaker = (w, where) => { if (!speaker(w)) E(`${where}: quien habla, «${w}», no existe (usa rex, luna, narrator o el id de un personaje)`); };
    const needClue = (c, where) => { if (!def.clues[c]) E(`${where}: la pista «${c}» no existe`); };
    const inMap = (room, x, y) => y >= 0 && y < room.map.length && x >= 0 && x < room.map[0].length;
    const isWall = (room, x, y) => room.map[y] && room.map[y][x] === '#';

    // ---- recorrido de todos los efectos y condiciones
    const npcFlags = {}; // banderas que pone cada personaje con sus diálogos
    const settable = {}; // todas las banderas que alguien puede poner
    const flagsOf = (fx) => (fx && fx.flag ? [].concat(fx.flag) : []);
    const conds = []; // [condición, dónde]
    npcIds.forEach((nid) => {
      const nd = def.npcs[nid];
      const set = (npcFlags[nid] = {});
      const take = (list, where) => norm(list).forEach((e) => {
        flagsOf(e.fx).forEach((f) => { set[f] = true; settable[f] = true; });
        if (e.when) conds.push([e.when, `${nid} ${where}`]);
        if (e.fx && e.fx.clue) [].concat(e.fx.clue).forEach((c) => needClue(c, `${nid} ${where}`));
      });
      nd.topics.forEach((t) => { take(t.responses, 'tema ' + t.id); if (t.show) conds.push([t.show, `${nid} tema ${t.id} (show)`]); });
      take(nd.chat, 'chat'); take(nd.press, 'presionar');
      Object.keys(nd.evidence).forEach((c) => take(nd.evidence[c], 'evidencia ' + c));
    });
    roomIds.forEach((rid) => def.rooms[rid].props.forEach((p) => {
      (p.steps || []).forEach((s) => flagsOf(s.fx).forEach((f) => { settable[f] = true; }));
    }));
    // banderas que pone el propio motor
    npcIds.forEach((nid) => {
      settable['talked_' + nid] = true;
      if (def.npcs[nid].cat) settable.cat_reward = true;
      else def.solution.proof.forEach((c) => { settable[`${nid}_pres_${c}`] = true; });
    });
    settable.case_closed = true;
    Object.keys(def.lies || {}).forEach((nid) => { settable['refuted_' + nid] = true; });
    roomIds.forEach((rid) => def.rooms[rid].doors.forEach((d) => { if (d.locked) settable['unlocked_' + d.id] = true; }));

    const condRefs = (c, where) => {
      if (c.any) c.any.forEach((x) => condRefs(x, where));
      if (c.not) condRefs(c.not, where);
      ['clue', 'notClue', 'anyClue'].forEach((k) => { if (c[k] !== undefined) [].concat(c[k]).forEach((id) => { if (!def.clues[id]) E(`${where}: la condición usa la pista «${id}», que no existe`); }); });
      if (c.flag) [].concat(c.flag).forEach((f) => { if (!settable[f]) E(`${where}: la condición exige la bandera «${f}», que nadie pone nunca (se quedaría bloqueado)`); });
      if (c.notFlag) [].concat(c.notFlag).forEach((f) => { if (!settable[f]) W(`${where}: la condición pregunta por la bandera «${f}», que nadie pone nunca (¿errata?)`); });
      if (c.flagCountMin) {
        const k = Object.keys(settable).filter((f) => f.indexOf(c.flagCountMin.prefix) === 0).length;
        if (k < c.flagCountMin.min) E(`${where}: pide ${c.flagCountMin.min} banderas que empiecen por «${c.flagCountMin.prefix}», pero solo se pueden poner ${k}`);
      }
    };

    // ---- formato y arranque
    if (def.format !== undefined && def.format !== G.CASE_FORMAT) E(`caso.format: este motor entiende el formato ${G.CASE_FORMAT} y el caso es del formato ${def.format}`);
    const sr = def.rooms[def.start.room];
    if (!sr) E(`caso.start.room: la sala de arranque «${def.start.room}» no existe`);
    else {
      [['p1', def.start.p1], ['p2', def.start.p2]].forEach(([n, t]) => {
        if (!inMap(sr, t[0], t[1])) E(`caso.start.${n}: la baldosa (${t[0]},${t[1]}) está fuera de la sala ${def.start.room}`);
        else if (isWall(sr, t[0], t[1])) E(`caso.start.${n}: la baldosa (${t[0]},${t[1]}) es pared`);
        else if (sr.props.some((p) => p.solid && t[0] >= p.x && t[0] < p.x + (p.w || 1) && t[1] >= p.y && t[1] < p.y + (p.h || 1))) E(`caso.start.${n}: la baldosa (${t[0]},${t[1]}) está ocupada por un objeto sólido`);
      });
      if (def.start.p1[0] === def.start.p2[0] && def.start.p1[1] === def.start.p2[1]) E('caso.start: p1 y p2 están en la misma baldosa');
    }
    if (!def.npcs[def.clientId]) E(`caso.clientId: el cliente «${def.clientId}» no es un personaje del caso`);
    else if (def.npcs[def.clientId].cat) E('caso.clientId: el cliente no puede ser un gato');

    // ---- herramientas por personaje (la forma ya está; aquí, los nombres de personaje)
    ['tools', 'startTool'].forEach((k) => Object.keys(def[k] || {}).forEach((rid) => { if (G.ROLE_IDS.indexOf(rid) < 0) E(`caso.${k}: «${rid}» no es un personaje jugable (${G.ROLE_IDS.join(', ')})`); }));

    // ---- mentiras
    Object.keys(def.lies || {}).forEach((nid) => {
      const L = def.lies[nid], w = `caso.lies.${nid}`;
      if (!def.npcs[nid]) { E(`${w}: «${nid}» no es un personaje del caso`); return; }
      L.refutedBy.forEach((c) => needClue(c, `${w}.refutedBy`));
      if (!npcFlags[nid][L.flag]) E(`${w}.flag: la bandera «${L.flag}» no la pone ningún diálogo de ${nid}, así que esa mentira nunca se dirá`);
    });

    // ---- pistas y sospechosos
    Object.keys(def.clues).forEach((cid) => {
      const c = def.clues[cid];
      if (!G.spr[c.icon]) E(`caso.clues.${cid}.icon: el icono «${c.icon}» no existe`);
      Object.keys(c.sus || {}).forEach((s) => { if (suspIds.indexOf(s) < 0) E(`caso.clues.${cid}.sus: «${s}» no es un sospechoso`); });
    });
    const seenS = {};
    def.suspects.forEach((s) => {
      if (seenS[s.id]) E(`caso.suspects: sospechoso repetido «${s.id}»`);
      seenS[s.id] = true;
      if (!G.LOOKS[s.look] && s.look !== 'cat') E(`caso.suspects[${s.id}].look: el aspecto «${s.look}» no existe (G.LOOKS)`);
      if (!def.npcs[s.id]) W(`El sospechoso «${s.id}» no tiene un personaje con su mismo id: no se le podrá interrogar`);
    });

    // ---- solución
    ['methods', 'motives'].forEach((k) => {
      const seen = {};
      def.solution[k].forEach((o) => { if (seen[o.id]) E(`caso.solution.${k}: id repetido «${o.id}»`); seen[o.id] = true; });
    });
    if (new Set(def.solution.proof).size !== def.solution.proof.length) E('caso.solution.proof: hay pruebas repetidas');

    // ---- capítulos
    const seenG = {};
    def.chapters.forEach((ch, i) => {
      const w = `caso.chapters[${ch.id}]`;
      if (ch.id !== i + 1) E(`${w}: los capítulos deben numerarse 1, 2, 3... en orden (este es el ${i + 1}º y tiene id ${ch.id})`);
      (ch.intro || []).concat(ch.outro || []).forEach((l) => needSpeaker(l.who, `${w} (diálogo)`));
      ch.goals.forEach((g) => {
        const gw = `${w}.goals[${g.id}]`;
        if (seenG[g.id]) E(`${gw}: id de objetivo repetido`);
        seenG[g.id] = true;
        const kinds = ['clue', 'clues', 'flags'].filter((k) => g[k] !== undefined);
        if (kinds.length !== 1) { E(`${gw}: debe tener exactamente uno de clue, clues o flags (tiene ${kinds.length})`); return; }
        if (g.clue) needClue(g.clue, gw);
        (g.clues || []).forEach((c) => needClue(c, gw));
        (g.flags || []).forEach((f) => { if (!settable[f]) E(`${gw}: la bandera «${f}» nadie la pone nunca, el objetivo no se podría cumplir`); });
        const len = (g.clues || g.flags || [1]).length;
        if (g.min !== undefined && g.min > len) E(`${gw}: min (${g.min}) es mayor que el número de elementos (${len})`);
      });
    });
    if (!def.chapters[nCh - 1].goals.some((g) => (g.flags || []).indexOf('case_closed') >= 0)) W('El último capítulo no tiene un objetivo con la bandera «case_closed» (acusar al culpable)');
    (def.epilogue.win || []).concat(def.epilogue.fail || [], def.epilogue.timeout || []).forEach((l) => needSpeaker(l.who, 'caso.epilogue'));

    // ---- salas
    const reach = {};
    if (sr) {
      const todo = [def.start.room]; reach[def.start.room] = true;
      while (todo.length) { const r = todo.pop(); def.rooms[r].doors.forEach((d) => { if (def.rooms[d.to.room] && !reach[d.to.room]) { reach[d.to.room] = true; todo.push(d.to.room); } }); }
      roomIds.forEach((rid) => { if (!reach[rid]) E(`Sala ${rid}: no hay camino de puertas desde la sala de arranque (${def.start.room}); nadie podría llegar`); });
    }
    const watched = {}; // personajes que vigilan algún objeto (ver G.watchConfig)
    roomIds.forEach((rid) => {
      const r = def.rooms[rid], w = `caso.rooms.${rid}`, W0 = r.map[0].length, H = r.map.length;
      const border = (x, y) => r.map[y] && r.map[y][x] === '#';
      let ringOk = true;
      for (let x = 0; x < W0; x++) if (!border(x, 0) || !border(x, H - 1)) ringOk = false;
      for (let y = 0; y < H; y++) if (!border(0, y) || !border(W0 - 1, y)) ringOk = false;
      if (!ringOk) E(`${w}.map: el borde del mapa debe ser todo pared («#»)`);
      (r.decor || []).forEach((d, i) => { if (!inMap(r, d.x, d.y)) E(`${w}.decor[${i}]: está fuera del mapa (${d.x},${d.y})`); });
      (r.decals || []).forEach((d, i) => { if (!inMap(r, d.x, d.y)) E(`${w}.decals[${i}]: está fuera del mapa (${d.x},${d.y})`); });
      if ((r.npcs || []).length) W(`${w}.npcs: se ignora; la posición de los personajes se define en «placement»`);
      r.props.forEach((p) => {
        const pw = `${w}.props[${p.id}]`;
        if (inMap(r, p.x, p.y) && !inMap(r, p.x + (p.w || 1) - 1, p.y + (p.h || 1) - 1)) E(`${pw}: se sale del mapa por el lado (ocupa ${p.w || 1}×${p.h || 1} desde ${p.x},${p.y})`);
        if (p.visible) conds.push([p.visible, pw + '.visible']);
        if (p.watcher) {
          watched[p.watcher] = true;
          const wn = def.npcs[p.watcher];
          if (!wn) E(`${pw}.watcher: «${p.watcher}» no es un personaje del caso`);
          else {
            if (wn.cat) E(`${pw}.watcher: «${p.watcher}» es un gato y no puede vigilar`);
            if (!((def.placement || {})[p.watcher] || []).some((pl) => pl.room === rid)) E(`${pw}.watcher: «${p.watcher}» nunca está en la sala «${rid}» según «placement»; el sigilo no tendría vigilante`);
            const cfg = G.watchConfig(def, p.watcher), ww = `caso.npcs.${p.watcher}.watch`;
            ['normal', 'hard'].forEach((k) => {
              if (cfg.look[k] >= cfg.period[k]) { E(`${ww}: en ${k} el tiempo que mira (${cfg.look[k]} s) debe ser menor que el ciclo (${cfg.period[k]} s)`); return; }
              const safe = G.watchSafeSeconds(cfg, k);
              (p.steps || []).forEach((st2, i) => {
                if (st2.tool === 'coop') return;
                const need = G.stepBaseSeconds(st2) + G.WATCH_MARGIN;
                if (safe < need - 1e-9) E(`${pw}.steps[${i}]: en ${k} la ventana segura del vigilante («${p.watcher}») dura ${safe.toFixed(1)} s y la acción necesita ${need.toFixed(1)} s (${G.stepBaseSeconds(st2)} s + ${G.WATCH_MARGIN} s de margen): sería imposible sin mejoras`);
              });
            });
          }
        }
        if (p.chat) { // A4 HERR-1 2/4: punto de escucha con charla grabada
          const ch = p.chat, cw = `${pw}.chat`;
          if (!p.listen) E(`${cw}: un objeto con «chat» tiene que llevar listen: true`);
          const rec = (p.steps || []).filter((q) => q.tool === 'grabadora');
          if (!rec.length) E(`${cw}: hace falta un paso con la grabadora para grabar la charla`);
          if (ch.a === ch.b) E(`${cw}: «a» y «b» son el mismo personaje («${ch.a}»); una charla necesita dos`);
          [['a', ch.a], ['b', ch.b]].forEach(([k, id]) => {
            const nn = def.npcs[id];
            if (!nn) { E(`${cw}.${k}: «${id}» no es un personaje del caso`); return; }
            if (nn.cat) E(`${cw}.${k}: «${id}» es un gato y no puede charlar`);
          });
          (ch.lines || []).forEach((ln, i) => { if (ln.who !== ch.a && ln.who !== ch.b) E(`${cw}.lines[${i}].who: «${ln.who}» no es ni «a» («${ch.a}») ni «b» («${ch.b}»)`); });
          [ch.a, ch.b].forEach((id) => { if (!(ch.lines || []).some((ln) => ln.who === id)) E(`${cw}.lines: «${id}» nunca habla; no sería una charla`); });
          const need = G.listenMinSeconds(ch);
          rec.forEach((q) => { if (G.stepBaseSeconds(q) < need - 1e-9) E(`${cw}: grabar dura ${G.stepBaseSeconds(q)} s y ${ch.lines.length} frases necesitan ${need} s (${G.LISTEN_LINE_SECONDS} s por frase)`); });
          // los dos tienen que estar a la vez en esta sala en algún capítulo en que el objeto ya se pueda usar (si no, nadie charlaría)
          const at = (id, c) => { let cur = null; ((def.placement || {})[id] || []).forEach((pl) => { if (pl.ch <= c) cur = pl; }); return cur; };
          const first = Math.max(1, p.chapterMin || 1), last = Math.max(first, (def.chapters || []).length || 3);
          let together = false;
          for (let c = first; c <= last; c++) { const pa = at(ch.a, c), pb = at(ch.b, c); if (pa && pb && pa.room === rid && pb.room === rid) together = true; }
          if (def.npcs[ch.a] && def.npcs[ch.b] && !together) E(`${cw}: «${ch.a}» y «${ch.b}» nunca están a la vez en la sala «${rid}» según «placement»; nadie charlaría`);
        }
        (p.steps || []).forEach((s, i) => {
          const sw = `${pw}.steps[${i}]`;
          needSpeaker(s.who, sw + '.who');
          if (s.requires) conds.push([s.requires, sw + '.requires']);
          if (s.fx && s.fx.clue) [].concat(s.fx.clue).forEach((c) => needClue(c, sw + '.fx'));
          if (s.fx && s.fx.moveProp && !r.props.some((q) => q.id === s.fx.moveProp.id)) E(`${sw}.fx.moveProp: el objeto «${s.fx.moveProp.id}» no existe en esta sala`);
          if (s.tool && s.tool !== 'coop' && !G.TOOLS[s.tool]) E(`${sw}.tool: la herramienta «${s.tool}» no existe`);
        });
        if (p.uvMark && p.steps && p.uvMark.afterStep >= p.steps.length) E(`${pw}.uvMark.afterStep: el paso ${p.uvMark.afterStep} no existe`);
      });
      r.doors.forEach((d) => {
        const dw = `${w}.doors[${d.id}]`;
        if (d.locked) {
          if (d.locked.tool && !G.TOOLS[d.locked.tool]) E(`${dw}.locked.tool: la herramienta «${d.locked.tool}» no existe`);
          if (d.locked.chapterMin !== undefined && d.locked.chapterMin > nCh) E(`${dw}.locked.chapterMin: el capítulo ${d.locked.chapterMin} no existe (el caso tiene ${nCh})`);
        }
        if (d.lockedSprite && !d.locked) W(`${dw}.lockedSprite: la puerta no está cerrada con llave (no tiene «locked»)`);
        if (d.firstOpen) { needClue(d.firstOpen.clue, dw + '.firstOpen'); needSpeaker(d.firstOpen.who, dw + '.firstOpen.who'); }
      });
    });
    conds.forEach(([c, where]) => condRefs(c, where));

    Object.keys(def.npcs).forEach((nid) => { if (def.npcs[nid].watch && !watched[nid]) W(`caso.npcs.${nid}.watch: ningún objeto lo nombra en «watcher»; esta configuración no se usa`); });

    // ---- colocación de personajes
    const placed = {};
    Object.keys(def.placement || {}).forEach((nid) => {
      if (!def.npcs[nid]) return; // lo avisa el validador clásico
      placed[nid] = true;
      let last = 0;
      def.placement[nid].forEach((p, i) => {
        const pw = `caso.placement.${nid}[${i}]`;
        if (p.ch <= last) E(`${pw}.ch: los capítulos de la colocación deben ir en orden creciente`);
        last = p.ch;
        if (p.ch > nCh) E(`${pw}.ch: el capítulo ${p.ch} no existe (el caso tiene ${nCh})`);
        const r = def.rooms[p.room];
        if (!r) return; // lo avisa el validador clásico
        if (!inMap(r, p.x, p.y)) E(`${pw}: la baldosa (${p.x},${p.y}) está fuera de la sala ${p.room}`);
        (p.wander || []).forEach((t, j) => {
          if (!inMap(r, t[0], t[1])) E(`${pw}.wander[${j}]: (${t[0]},${t[1]}) está fuera de la sala ${p.room}`);
          else if (isWall(r, t[0], t[1])) E(`${pw}.wander[${j}]: (${t[0]},${t[1]}) es pared`);
        });
      });
    });
    npcIds.forEach((nid) => { if (!placed[nid]) E(`Personaje ${nid}: no tiene colocación en «placement» (no aparecería en ninguna sala)`); });

    // ---- personajes
    npcIds.forEach((nid) => {
      const nd = def.npcs[nid], w = `caso.npcs.${nid}`;
      if (!nd.cat && !G.LOOKS[nd.look]) E(`${w}.look: el aspecto «${nd.look}» no existe (G.LOOKS)`);
      const seen = {};
      nd.topics.forEach((t) => { if (seen[t.id]) E(`${w}.topics: tema repetido «${t.id}»`); seen[t.id] = true; });
      if (nd.petReward !== undefined && !nd.cat) W(`${w}.petReward: solo se usa en personajes con «cat: true»`);
    });

    // ---- charla del compañero
    Object.keys(def.banter || {}).forEach((rid) => {
      const b = def.banter[rid], w = `caso.banter.${rid}`;
      if (G.ROLE_IDS.indexOf(rid) < 0) E(`${w}: «${rid}» no es un personaje jugable (${G.ROLE_IDS.join(', ')})`);
      Object.keys(b.enter || {}).forEach((r) => { if (!def.rooms[r]) E(`${w}.enter: la sala «${r}» no existe`); });
      Object.keys(b.theory || {}).forEach((s) => { if (suspIds.indexOf(s) < 0) E(`${w}.theory: «${s}» no es un sospechoso`); });
    });
  }

  // ---------------------------------------------------------------- PUNTO DE ENTRADA
  G.checkCaseFormat = function (def) {
    const shape = [];
    check(CASE, def, 'caso', shape);
    if (shape.length) {
      const more = shape.length > 40 ? [`...y ${shape.length - 40} errores de formato más`] : [];
      return { errors: shape.slice(0, 40).concat(more), warnings: [], shapeOk: false };
    }
    const errors = [], warnings = [];
    const E = (m) => { if (errors.indexOf(m) < 0) errors.push(m); };
    const W = (m) => { if (warnings.indexOf(m) < 0) warnings.push(m); };
    refs(def, E, W);
    return { errors, warnings, shapeOk: true };
  };
})(typeof window !== 'undefined' ? window : globalThis);
