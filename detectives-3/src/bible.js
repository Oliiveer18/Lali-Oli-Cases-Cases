// bible.js — LA BIBLIA DEL CASO · comprobador (fábrica de casos, fase 3A)
// G.checkBible(bible, { partial }) → { ok, errors:[{code,path,msg}] }. Contrato: docs/BIBLIA_DEL_CASO.md.
// Con { partial:true } se saltan solo las reglas que dependen de las pistas (para la biblia parcial de genTruth, 3B).
// Si la FORMA está mal solo se informa de eso (como schema.js). Nunca lanza excepciones, aunque reciba basura.
// Código «determinismo» (la 14.ª regla): no se comprueba aquí, se prueba en 3B-3D (misma semilla ⇒ mismo JSON).
// Nota: no usar instanceof ni prototipos: la biblia puede venir de otro contexto (vm) que el motor.
(function (root) {
  'use strict';
  const G = root.G;
  G.GEN_VERSION = 6;
  G.BIBLE_FORMAT = 1;
  G.BIBLE_CODES = ['formato', 'reparto', 'lugares', 'cronologia', 'ventana', 'coartada_inocente', 'coartada_culpable', 'mentiras', 'pruebas', 'pistas_falsas', 'puntos', 'alcanzable', 'metodo_motivo', 'forma_captura', 'enganosos', 'matiz'];

  // ---------- 4A · formas de atrapar al culpable (captureForm) y sospechosos engañosos (deceptive)
  // proof = prefijos (id.split('_')[0]) de las pruebas que exige cada forma. Una biblia SIN captureForm (hecha a mano) solo debe cumplir `proof ≥ 3`.
  G.CAPTURE_FORMS = {
    clasica: { proof: ['rastro', 'testigo', 'escondite', 'metodo'] },            // rastro en el lugar + testigo + escondite + método
    desliz: { proof: ['desliz', 'escondite', 'metodo'] },                        // confesión indirecta: alguien oyó al culpable decir lo que solo sabría el ladrón
    testigos_cruzados: { proof: ['ausente', 'testigo', 'escondite', 'metodo'] }, // dos testimonios que se contradicen: uno estaba donde él dice estar y no lo vio; otro lo vio donde no debía
    objeto_imposible: { proof: ['rastro', 'imposible', 'metodo'] },              // el culpable guarda un objeto que solo podía salir del lugar del robo
  };
  G.LEVELS = ['facil', 'normal', 'dificil'];
  G.DECOY_RANGE = { facil: [0, 1], normal: [1, 2], dificil: [2, 3] };            // nº de engañosos por nivel (se recorta con pocos sospechosos)
  G.maxDecoys = (nSus) => (nSus <= 4 ? 2 : 3);
  // CL-5a (GEN_VERSION >= 7): engañosos por nivel con la receta v7 (decisión del usuario, 25 oct, PROPUESTA_CL5 §7): Normal [2,3] (50 % / 50 %) · Difícil [3,3] · Fácil igual. Con GEN_VERSION < 7 vale G.DECOY_RANGE (v6 idéntico).
  G.DECOY_RANGE_V7 = { facil: [0, 1], normal: [2, 3], dificil: [3, 3] };
  G.decoyRange = (level) => (G.GEN_VERSION >= 7 ? G.DECOY_RANGE_V7 : G.DECOY_RANGE)[level];
  // ---- 4C-4c-1 (GEN_VERSION 5): AMBIENTE en la biblia + MATIZ de las pistas. `mood` lo decide generateCase (G.pickMood o el forzado) y lo recibe genClues; si es inquietante o
  // macabro, unas pocas pistas de OBJETO (prueba, falsa o refuta; nunca descarte ni testimonio) llevan al final un detalle perturbador con su remate (`bible.matiz` = ids).
  // Solo cambian TEXTOS: puntos, fuentes, roles y derivaciones son idénticos en los tres ambientes. Una biblia SIN `mood` (hecha a mano o de GEN_VERSION < 5) no lleva matiz.
  G.MOODS = ['claro', 'inquietante', 'macabro'];
  G.MATIZ_COUNT = { claro: 0, inquietante: 2, macabro: 3 };
  G.DECOY_RATIO = 0.6;                                                            // un engañoso debe llegar al 60 % de la sospecha del culpable (la huella lo mide igual)

  // ---------- utilidades de tiempo y código
  G.minToStr = (m) => (Number.isInteger(m) && m >= 0 && m <= 1440 ? String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') : '??:??');
  G.strToMin = (s) => {
    const r = /^(\d{1,2}):([0-5]\d)$/.exec(String(s));
    if (!r) return null;
    const h = +r[1], m = +r[2];
    return h > 24 || (h === 24 && m) ? null : h * 60 + m;
  };
  // 4F-0a: el código lleva la LETRA de la temática justo tras la versión (Robo no lleva letra: G6-xxxx = Robo, como siempre; Sabotaje = G6s-xxxx…). Las letras están en G.THEMES (gen_themes.js).
  G.caseCode = (seed, theme) => 'G' + G.GEN_VERSION + ((theme && G.THEMES && G.THEMES[theme] && G.THEMES[theme].letter) || '') + '-' + (seed >>> 0).toString(36);
  // MP (acceso mínimo, provisional hasta 4E-1): código «G6-xxxx» → semilla; { seed } | { error } (formato malo o receta de otra versión)
  // 4F-0a: devuelve también la temática del código ({ seed, theme }); sin letra = Robo. Una letra desconocida es un error.
  G.caseSeedFromCode = (code) => {
    const m = /^G(\d+)([a-z]?)-([0-9a-z]{1,7})$/.exec(String(code || '').trim().toLowerCase().replace(/^g/, 'G'));
    if (!m) return { error: 'Código no válido (ejemplo: G6-2djn)' };
    if (+m[1] !== G.GEN_VERSION) return { error: 'Ese código es de otra versión del generador (G' + m[1] + '); este juego usa G' + G.GEN_VERSION };
    const theme = G.themeFromLetter ? G.themeFromLetter(m[2]) : (m[2] ? null : 'robo');
    if (!theme) return { error: 'Código no válido: la letra «' + m[2] + '» no es de ninguna temática' };
    return { seed: parseInt(m[3], 36) >>> 0, theme };
  };

  // ---------- validadores de forma (mismo estilo que schema.js, pero compactos)
  const ID = /^[A-Za-z][A-Za-z0-9_]*$/;
  const isObj = (v) => Object.prototype.toString.call(v) === '[object Object]';
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const T = {
    str: (v, p, a) => { if (typeof v !== 'string' || !v.trim()) a(p, 'debe ser un texto no vacío'); },
    id: (v, p, a) => { if (typeof v !== 'string' || !ID.test(v)) a(p, 'debe ser un id (letras, números y _, empezando por letra)'); },
    bool: (v, p, a) => { if (typeof v !== 'boolean') a(p, 'debe ser verdadero o falso'); },
    int: (min, max) => (v, p, a) => { if (!Number.isInteger(v) || v < min || v > max) a(p, `debe ser un entero entre ${min} y ${max}`); },
    oneOf: (list) => (v, p, a) => { if (list.indexOf(v) < 0) a(p, `debe ser uno de: ${list.join(', ')}`); },
    nullable: (f) => (v, p, a) => { if (v !== null) f(v, p, a); },
    list: (item) => (v, p, a) => { if (!Array.isArray(v)) return a(p, 'debe ser una lista'); v.forEach((x, i) => item(x, `${p}[${i}]`, a)); },
    dict: (item) => (v, p, a) => {
      if (!isObj(v)) return a(p, 'debe ser un objeto');
      Object.keys(v).forEach((k) => { if (!ID.test(k)) a(`${p}.${k}`, 'la clave debe ser un id'); item(v[k], `${p}.${k}`, a); });
    },
    obj: (req, opt) => (v, p, a) => {
      if (!isObj(v)) return a(p, 'debe ser un objeto');
      Object.keys(req).forEach((k) => (has(v, k) ? req[k](v[k], `${p}.${k}`, a) : a(`${p}.${k}`, 'falta el campo obligatorio')));
      Object.keys(v).forEach((k) => {
        if (has(req, k)) return;
        if (opt && has(opt, k)) opt[k](v[k], `${p}.${k}`, a);
        else a(`${p}.${k}`, 'campo desconocido (¿errata?)');
      });
    },
  };
  const TRAITS = ['nervioso', 'soberbio', 'evasivo', 'amable', 'seco'];
  const KINDS = ['física', 'documento', 'grabación', 'testimonio'];
  const CLUE_ROLES = ['prueba', 'descarte', 'falsa', 'refuta', 'ambiente'];
  const idList = T.list(T.id);
  const minute = T.int(0, 1440);
  const named = { id: T.id, text: T.str };
  const SHAPE = T.obj({
    format: T.int(1, 1), gen: T.int(1, 1000000), seed: T.int(0, 4294967295), schema: T.oneOf(['robo']), code: T.str,
    places: T.list(T.obj({ id: T.id, name: T.str })),
    object: T.obj({ id: T.id, name: T.str, place: T.id }),
    cast: T.list(T.obj({ id: T.id, name: T.str, role: T.oneOf(['cliente', 'sospechoso']), look: T.str, trait: T.oneOf(TRAITS) })),
    truth: T.obj({
      culprit: T.id,
      method: T.obj({ id: T.id, text: T.str, needs: idList }),
      motive: T.obj({ id: T.id, text: T.str, needs: idList }),
      window: T.obj({ from: minute, to: minute, place: T.id }),
      timeline: T.list(T.obj({ t: minute, until: minute, who: T.id, place: T.id, doing: T.str, witnesses: idList })),
      decoys: T.obj({ methods: T.list(T.obj(named, { needs: idList })), motives: T.list(T.obj(named, { needs: idList })) }),
    }),
    alibis: T.dict(T.obj({ claim: T.obj({ place: T.id, from: minute, to: minute }), holds: T.bool, clearedBy: T.nullable(T.id) })),
    lies: T.list(T.obj({ who: T.id, said: T.str, truth: T.str, refutedBy: idList })),
    clues: T.list(T.obj({
      id: T.id, title: T.str, kind: T.oneOf(KINDS), text: T.str, role: T.oneOf(CLUE_ROLES),
      points: T.dict(T.int(-20, 20)),
      source: T.obj({ type: T.oneOf(['prop', 'npc']) }, { place: T.id, npc: T.id, topic: T.id }),
      derivedFrom: T.nullable(T.int(0, 9999)),
    }, { kindAntes: T.oneOf(KINDS) })), // `kindAntes` (opcional, c4-3 3/4-b): tipo que tenía una pista falsa antes de pasar a «grabación» señuelo; compile.js lo restaura si no puede montar la charla
    proof: idList,
  }, {
    captureForm: T.oneOf(Object.keys(G.CAPTURE_FORMS)), level: T.oneOf(G.LEVELS),
    deceptive: T.list(T.obj({ who: T.id, why: T.str })),
    mood: T.oneOf(G.MOODS), matiz: T.list(T.id),
    // CL-5c-b (GEN_VERSION >= 7, solo Difícil): 1-2 puzles (código / línea de tiempo) con pistas propias de rol «ambiente». `events` = [{ clue, i }] (i = franja de la cronología; en el código hay una sola; en la línea, en orden cronológico). Las reglas de justicia J1-J6 las comprueba el validador en CL-5c-c.
    puzzles: T.list(T.obj({ id: T.id, type: T.oneOf(['code', 'timeline']), bank: T.id, clues: idList, events: T.list(T.obj({ clue: T.id, i: T.int(0, 9999) })) }, { code: T.str })),
    // 4F-0a: marco de temáticas (opcionales: las biblias hechas a mano o de antes no los traen). Se comprueban contra G.THEMES/G.SCENARIOS/G.GOALS (gen_themes.js), que se cargan después de este fichero.
    theme: (v, p, a) => { if (!G.THEMES || !G.themeOk(v)) a(p, 'temática desconocida'); },
    goal: (v, p, a) => { if (!G.GOALS || !G.GOALS[v]) a(p, 'objetivo desconocido'); },
    scenario: (v, p, a) => { if (!G.SCENARIOS || !G.SCENARIOS[v]) a(p, 'escenario desconocido'); },
  });

  // recorre el objeto: solo datos puros (null, booleano, texto, número finito, listas, objetos) y sin ciclos
  function plain(v, p, a, depth) {
    if (depth > 12) return a(p, 'demasiado profundo (¿referencia circular?)');
    if (v === null || typeof v === 'boolean' || typeof v === 'string') return;
    if (typeof v === 'number') { if (!isFinite(v)) a(p, 'número no finito'); return; }
    if (Array.isArray(v)) return v.forEach((x, i) => plain(x, `${p}[${i}]`, a, depth + 1));
    if (isObj(v)) return Object.keys(v).forEach((k) => plain(v[k], `${p}.${k}`, a, depth + 1));
    a(p, 'no es un dato serializable (' + typeof v + ')');
  }

  // ---------- consultas sobre la cronología
  const overlap = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;
  function covers(entries, from, to) { // ¿la unión de las franjas cubre [from,to]?
    const iv = entries.map((e) => [e.t, e.until]).sort((x, y) => x[0] - y[0]);
    let cur = from;
    for (let i = 0; i < iv.length && cur < to; i++) { if (iv[i][0] > cur) break; if (iv[i][1] > cur) cur = iv[i][1]; }
    return cur >= to;
  }

  G.checkBible = function (b, opts) {
    const errors = [];
    const partial = !!(opts && opts.partial);
    try {
      const addF = (p, m) => errors.push({ code: 'formato', path: 'biblia' + p.replace(/^\$/, ''), msg: m });
      if (!isObj(b)) { addF('', 'La biblia debe ser un objeto'); return { ok: false, errors }; }
      plain(b, '$', addF, 0);
      if (!errors.length) {
        SHAPE(b, '$', addF);
        if (!errors.length) {
          if (b.gen !== G.GEN_VERSION) addF('.gen', `la biblia es del generador ${b.gen} y este es el ${G.GEN_VERSION}`);
          { const lt = b.theme && G.THEMES && G.themeOk(b.theme) ? G.THEMES[b.theme].letter : ''; if (b.code !== 'G' + b.gen + lt + '-' + b.seed.toString(36)) addF('.code', 'el código no corresponde a la semilla, la versión y la temática'); } // 4F-0a: la letra de la temática va tras la versión (Robo, ninguna)
          [['places', b.places], ['cast', b.cast], ['clues', b.clues]].forEach(([n, l]) => {
            const seen = {};
            l.forEach((x, i) => { if (seen[x.id]) addF(`.${n}[${i}].id`, `id repetido: ${x.id}`); seen[x.id] = 1; });
          });
        }
      }
      if (errors.length) return { ok: false, errors };
      semantic(b, partial, (code, path, msg) => errors.push({ code, path: 'biblia' + path, msg }));
    } catch (e) {
      errors.push({ code: 'formato', path: 'biblia', msg: 'Error interno al comprobar la biblia (dato mal formado): ' + (e && e.message ? e.message : e) });
    }
    return { ok: errors.length === 0, errors };
  };

  function semantic(b, partial, add) {
    const tr = b.truth, win = tr.window, tl = tr.timeline, cu = tr.culprit;
    const ids = (l) => l.map((x) => x.id);
    const castIds = ids(b.cast), placeIds = ids(b.places);
    const sus = b.cast.filter((c) => c.role === 'sospechoso'), susIds = ids(sus);
    const inn = susIds.filter((s) => s !== cu);
    const clue = {}; b.clues.forEach((c) => { clue[c.id] = c; });
    const presentAt = (who, place, from, to) => covers(tl.filter((e) => e.who === who && e.place === place), from, to);
    const validSpan = (f, t) => f < t;

    // ---- reparto
    if (b.cast.filter((c) => c.role === 'cliente').length !== 1) add('reparto', '.cast', 'Debe haber exactamente 1 cliente');
    if (sus.length < 4 || sus.length > 6) add('reparto', '.cast', `Debe haber de 4 a 6 sospechosos (hay ${sus.length})`);
    if (susIds.indexOf(cu) < 0) add('reparto', '.truth.culprit', `El culpable (${cu}) no es un sospechoso del reparto`);
    b.cast.forEach((c, i) => {
      if (['rex', 'luna', 'narrator'].indexOf(c.id) >= 0) add('reparto', `.cast[${i}].id`, `«${c.id}» está reservado por el motor`);
      if (!G.LOOKS || !G.LOOKS[c.look]) add('reparto', `.cast[${i}].look`, `el aspecto «${c.look}» no existe en G.LOOKS`);
    });
    { const seenL = {}; // 4B: dos personajes del mismo caso no pueden tener el mismo aspecto
      b.cast.forEach((c, i) => { if (c.look && seenL[c.look] !== undefined) add('reparto', `.cast[${i}].look`, `«${c.look}» ya lo lleva ${b.cast[seenL[c.look]].id}: dos personajes del mismo caso no pueden verse iguales`); else seenL[c.look] = i; }); }
    susIds.forEach((s) => { if (!has(b.alibis, s)) add('reparto', `.alibis.${s}`, 'Falta la coartada de este sospechoso'); });
    Object.keys(b.alibis).forEach((k) => { if (susIds.indexOf(k) < 0) add('reparto', `.alibis.${k}`, 'Coartada de alguien que no es sospechoso'); });

    // ---- engañosos (4A): solo inocentes, sin repetir, en el rango del nivel y sin pasar del máximo según el nº de sospechosos
    const dec = b.deceptive || [], maxD = G.maxDecoys(sus.length), seenD = {};
    if (dec.length > maxD) add('enganosos', '.deceptive', `Con ${sus.length} sospechosos solo puede haber ${maxD} engañosos como mucho (hay ${dec.length})`);
    if (b.level) {
      const rg = G.decoyRange(b.level), lo = Math.min(rg[0], maxD), hi = Math.min(rg[1], maxD);
      if (dec.length < lo || dec.length > hi) add('enganosos', '.deceptive', `El nivel «${b.level}» admite de ${lo} a ${hi} engañosos con ${sus.length} sospechosos (hay ${dec.length})`);
    }
    dec.forEach((d, i) => {
      if (inn.indexOf(d.who) < 0) add('enganosos', `.deceptive[${i}].who`, `«${d.who}» debe ser un sospechoso inocente`);
      if (seenD[d.who]) add('enganosos', `.deceptive[${i}].who`, `«${d.who}» está repetido`); seenD[d.who] = 1;
    });

    // ---- lugares
    const maxPl = G.GEN_VERSION >= 7 ? 6 : 5; // 4F-0b 3/4-b: con GEN_VERSION >= 7 el Despacho del dueño es la 6.ª sala (Difícil)
    if (b.places.length < 3 || b.places.length > maxPl) add('lugares', '.places', `Debe haber de 3 a ${maxPl} lugares (hay ${b.places.length})`);
    const needPlace = (pl, p) => { if (placeIds.indexOf(pl) < 0) add('lugares', p, `el lugar «${pl}» no existe`); };
    needPlace(b.object.place, '.object.place');
    needPlace(win.place, '.truth.window.place');
    if (win.place !== b.object.place) add('lugares', '.truth.window.place', 'El robo debe ocurrir donde estaba el objeto');
    tl.forEach((e, i) => needPlace(e.place, `.truth.timeline[${i}].place`));
    Object.keys(b.alibis).forEach((k) => needPlace(b.alibis[k].claim.place, `.alibis.${k}.claim.place`));

    // ---- cronología
    const who = {};
    tl.forEach((e, i) => {
      const p = `.truth.timeline[${i}]`;
      if (!validSpan(e.t, e.until)) add('cronologia', p, `La franja ${G.minToStr(e.t)}-${G.minToStr(e.until)} debe tener t < until`);
      if (castIds.indexOf(e.who) < 0) add('cronologia', p + '.who', `«${e.who}» no está en el reparto`);
      if (i && tl[i - 1].t > e.t) add('cronologia', p + '.t', 'La cronología debe ir ordenada por hora de inicio');
      (who[e.who] = who[e.who] || []).push(e);
      e.witnesses.forEach((w, j) => {
        if (castIds.indexOf(w) < 0) return add('cronologia', `${p}.witnesses[${j}]`, `El testigo «${w}» no está en el reparto`);
        if (w === e.who) return add('cronologia', `${p}.witnesses[${j}]`, 'Nadie es testigo de sí mismo');
        if (!tl.some((o) => o.who === w && o.place === e.place && overlap(o.t, o.until, e.t, e.until))) add('cronologia', `${p}.witnesses[${j}]`, `«${w}» figura como testigo pero no está en ${e.place} en esa franja`);
      });
    });
    Object.keys(who).forEach((w) => {
      const l = who[w].slice().sort((x, y) => x.t - y.t || x.until - y.until);
      for (let i = 1; i < l.length; i++) if (l[i - 1].until > l[i].t) add('cronologia', '.truth.timeline', `«${w}» está en dos sitios a la vez (${G.minToStr(l[i].t)}-${G.minToStr(Math.min(l[i - 1].until, l[i].until))})`);
    });

    // ---- ventana del robo
    if (!validSpan(win.from, win.to)) add('ventana', '.truth.window', 'La ventana debe tener from < to');
    else {
      if (!presentAt(cu, win.place, win.from, win.to)) add('ventana', '.truth.window', `El culpable no está en ${win.place} durante toda la ventana del robo`);
      b.cast.forEach((c) => {
        if (c.id !== cu && tl.some((e) => e.who === c.id && e.place === win.place && overlap(e.t, e.until, win.from, win.to))) add('ventana', '.truth.timeline', `«${c.id}» está en el lugar del robo durante la ventana: no es el único que pudo hacerlo`);
      });
    }

    // ---- coartada del culpable
    const ac = b.alibis[cu];
    if (ac) {
      if (ac.holds !== false) add('coartada_culpable', `.alibis.${cu}.holds`, 'La coartada del culpable no debe sostenerse');
      if (ac.claim.place === win.place) add('coartada_culpable', `.alibis.${cu}.claim`, 'El culpable no puede afirmar que estaba en el lugar del robo');
      if (!validSpan(ac.claim.from, ac.claim.to) || !overlap(ac.claim.from, ac.claim.to, win.from, win.to)) add('coartada_culpable', `.alibis.${cu}.claim`, 'La coartada del culpable debe cubrir parte de la ventana del robo');
      else if (presentAt(cu, ac.claim.place, ac.claim.from, ac.claim.to)) add('coartada_culpable', `.alibis.${cu}.claim`, 'La cronología confirma lo que dice el culpable: su coartada no es mentira');
    }

    // ---- coartada de los inocentes (la parte que depende de pistas se salta en modo parcial)
    let uncleared = 0;
    inn.forEach((s) => {
      const a = b.alibis[s], p = `.alibis.${s}`;
      if (!a) return;
      if (!validSpan(a.claim.from, a.claim.to)) add('coartada_inocente', p + '.claim', 'La franja de la coartada debe tener from < to');
      else if (a.holds !== presentAt(s, a.claim.place, a.claim.from, a.claim.to)) add('coartada_inocente', p + '.holds', `«holds» (${a.holds}) no coincide con la cronología`);
      if (validSpan(win.from, win.to) && !b.places.some((pl) => pl.id !== win.place && presentAt(s, pl.id, win.from, win.to))) add('coartada_inocente', p, `«${s}» no tiene en la cronología una posición verificable fuera del lugar del robo durante toda la ventana`);
      if (partial) return;
      if (a.clearedBy === null) { uncleared++; return; }
      const c = clue[a.clearedBy], e = c && Number.isInteger(c.derivedFrom) ? tl[c.derivedFrom] : null;
      if (!c) add('coartada_inocente', p + '.clearedBy', `la pista «${a.clearedBy}» no existe`);
      else if (c.role !== 'descarte') add('coartada_inocente', p + '.clearedBy', `«${c.id}» debe tener rol «descarte»`);
      else if (!e || e.who !== s || e.place === win.place || !overlap(e.t, e.until, win.from, win.to)) add('coartada_inocente', p + '.clearedBy', `«${c.id}» debe derivar de una franja de «${s}» fuera del lugar del robo y dentro de la ventana`);
    });
    if (!partial && uncleared > 1) add('coartada_inocente', '.alibis', `Solo un inocente puede quedarse sin pista de descarte (hay ${uncleared})`);
    if (partial) return;

    // ---- mentiras
    const lies = {};
    b.lies.forEach((l, i) => {
      const p = `.lies[${i}]`, a = b.alibis[l.who];
      if (susIds.indexOf(l.who) < 0) return add('mentiras', p + '.who', `«${l.who}» no es sospechoso`);
      if (lies[l.who]) add('mentiras', p + '.who', `«${l.who}» miente dos veces: solo se admite una mentira por personaje`);
      lies[l.who] = l;
      if (a && a.holds !== false) add('mentiras', p, `«${l.who}» miente pero su coartada «se sostiene» según la cronología`);
      if (!l.refutedBy.length) add('mentiras', p + '.refutedBy', 'Una mentira necesita al menos una pista que la desmonte');
      l.refutedBy.forEach((r, j) => { if (!clue[r]) add('mentiras', `${p}.refutedBy[${j}]`, `la pista «${r}» no existe`); });
      const ext = l.refutedBy.map((r) => clue[r]).filter((c) => {
        if (!c || !(c.source.type === 'prop' || c.source.npc !== l.who) || !Number.isInteger(c.derivedFrom)) return false;
        const e = tl[c.derivedFrom];
        return !!(e && a && e.who === l.who && e.place !== a.claim.place && overlap(e.t, e.until, a.claim.from, a.claim.to));
      });
      if (!ext.length) add('mentiras', p + '.refutedBy', `Ninguna pista ajena a «${l.who}» y derivada de su cronología contradice lo que dice: la mentira sería indemostrable o circular`);
    });
    if (!lies[cu]) add('mentiras', '.lies', 'El culpable debe mentir');
    if (b.lies.length < 2 || !inn.some((s) => lies[s])) add('mentiras', '.lies', 'Debe haber al menos 2 mentiras: la del culpable y la de algún inocente');
    susIds.forEach((s) => { if (b.alibis[s] && b.alibis[s].holds === false && !lies[s]) add('mentiras', `.alibis.${s}`, `La coartada de «${s}» es falsa pero no figura en «lies»`); });

    // ---- pruebas contra el culpable
    const seenP = {};
    if (b.proof.length < 3) add('pruebas', '.proof', `Hacen falta al menos 3 pruebas (hay ${b.proof.length})`);
    b.proof.forEach((id, i) => {
      const c = clue[id], p = `.proof[${i}]`, e = c && Number.isInteger(c.derivedFrom) ? tl[c.derivedFrom] : null;
      if (seenP[id]) add('pruebas', p, `prueba repetida: ${id}`); seenP[id] = 1;
      if (!c) return add('pruebas', p, `la pista «${id}» no existe`);
      if (c.role !== 'prueba') add('pruebas', p, `«${id}» debe tener rol «prueba»`);
      if (!(c.points[cu] > 0)) add('pruebas', p, `«${id}» no suma puntos contra el culpable`);
      if (!e || e.who !== cu) add('pruebas', p, `«${id}» debe derivar de una franja de la cronología del culpable`);
    });

    // ---- forma de captura (4A): las pruebas de proof son exactamente las que pide la forma
    if (b.captureForm) {
      const want = G.CAPTURE_FORMS[b.captureForm].proof.slice().sort().join(','), got = b.proof.map((id) => id.split('_')[0]).sort().join(',');
      if (want !== got) add('forma_captura', '.proof', `La forma «${b.captureForm}» exige las pruebas [${want}] y hay [${got}]`);
    }

    // ---- pistas falsas
    inn.forEach((s) => {
      if (!b.clues.some((c) => c.role === 'falsa' && c.points[s] > 0 && !seenP[c.id])) add('pistas_falsas', `.alibis.${s}`, `«${s}» no tiene ninguna pista falsa (rol «falsa», puntos > 0, fuera de proof)`);
    });

    // ---- puntos de sospecha
    const score = {}; susIds.forEach((s) => { score[s] = 0; });
    b.clues.forEach((c, i) => {
      const p = `.clues[${i}]`, pts = c.points, ks = Object.keys(pts);
      ks.forEach((k) => { if (susIds.indexOf(k) < 0) add('puntos', `${p}.points.${k}`, 'solo se puntúa a sospechosos'); else score[k] += pts[k]; });
      if (c.role === 'prueba' && !(pts[cu] > 0)) add('puntos', p, `«${c.id}» es una prueba pero no suma contra el culpable`);
      if (c.role === 'falsa' && (pts[cu] > 0 || !ks.some((k) => pts[k] > 0))) add('puntos', p, `«${c.id}» es una pista falsa: debe sospechar de un inocente y nunca del culpable`);
      if (c.role === 'descarte' && ks.some((k) => pts[k] > 0)) add('puntos', p, `«${c.id}» es un descarte: no puede sumar sospecha`);
      if (c.role === 'ambiente' && ks.length) add('puntos', p, `«${c.id}» es de ambiente: no lleva puntos`);
    });
    if (score[cu] < 12) add('puntos', '.clues', `Las pistas suman solo ${score[cu]} puntos contra el culpable (mínimo 12)`);
    inn.forEach((s) => { if (b.alibis[s] && b.alibis[s].clearedBy === null && score[cu] - score[s] < 3) add('puntos', `.alibis.${s}`, `«${s}» no se puede descartar y queda a ${score[cu] - score[s]} puntos del culpable (mínimo 3)`); });

    // ---- engañosos con puntos (4A): descartables y casi tan sospechosos como el culpable (misma medida que la huella: suma neta de puntos)
    dec.forEach((d, i) => {
      const al = b.alibis[d.who];
      if (!al || al.clearedBy === null) add('enganosos', `.deceptive[${i}]`, `«${d.who}» es engañoso pero no tiene pista de descarte: tiene que poder descartarse`);
      if (score[d.who] === undefined) return;
      if (score[d.who] < G.DECOY_RATIO * score[cu]) add('enganosos', `.deceptive[${i}]`, `«${d.who}» suma ${score[d.who]} puntos y el culpable ${score[cu]}: un engañoso debe llegar al ${Math.round(G.DECOY_RATIO * 100)} %`);
    });

    // ---- matiz (4C-4c-1): nº según el ambiente, solo pistas de objeto de rol prueba/falsa/refuta, sin repetir; sin `mood` no hay matiz
    {
      const mz = b.matiz || [], want = b.mood ? G.MATIZ_COUNT[b.mood] : 0, seenM = {};
      if (mz.length !== want) add('matiz', '.matiz', `Con ambiente «${b.mood || 'sin mood'}» debe haber ${want} pistas con matiz (hay ${mz.length})`);
      mz.forEach((id, i) => {
        const c = b.clues.filter((x) => x.id === id)[0];
        if (!c) add('matiz', `.matiz[${i}]`, `«${id}» no es una pista`);
        else if (c.source.type !== 'prop' || ['prueba', 'falsa', 'refuta'].indexOf(c.role) < 0) add('matiz', `.matiz[${i}]`, `«${id}»: el matiz solo va en pistas de objeto de rol prueba, falsa o refuta (es ${c.source.type}/${c.role})`);
        if (seenM[id]) add('matiz', `.matiz[${i}]`, `«${id}» está repetida`); seenM[id] = 1;
      });
    }

    // ---- alcanzabilidad de las pistas
    const perPlace = {};
    b.clues.forEach((c, i) => {
      const p = `.clues[${i}]`, s = c.source;
      if (c.derivedFrom !== null && c.derivedFrom >= tl.length) add('alcanzable', p + '.derivedFrom', `no existe la franja ${c.derivedFrom} de la cronología`);
      if (s.type === 'prop') {
        if (!s.place || placeIds.indexOf(s.place) < 0) add('alcanzable', p + '.source.place', 'un objeto necesita un lugar que exista');
        else perPlace[s.place] = (perPlace[s.place] || 0) + 1;
        if (s.npc || s.topic) add('alcanzable', p + '.source', 'un objeto no lleva npc ni tema');
      } else {
        if (!s.npc || castIds.indexOf(s.npc) < 0) add('alcanzable', p + '.source.npc', 'un testimonio necesita un personaje del reparto');
        if (!s.topic) add('alcanzable', p + '.source.topic', 'un testimonio necesita el id del tema de conversación');
        if (s.place) add('alcanzable', p + '.source', 'un testimonio no lleva lugar');
      }
    });
    Object.keys(perPlace).forEach((pl) => { if (perPlace[pl] > 4) add('alcanzable', '.clues', `Hay ${perPlace[pl]} objetos en ${pl} (máximo 4 por lugar)`); });

    // ---- método y móvil
    [['method', 'methods'], ['motive', 'motives']].forEach(([k, pk]) => {
      const t = tr[k], dec = tr.decoys[pk], seen = {};
      if (!t.needs.length) add('metodo_motivo', `.truth.${k}.needs`, 'La opción verdadera necesita pistas que la demuestren');
      if (dec.length < 1) add('metodo_motivo', `.truth.decoys.${pk}`, 'Hace falta al menos un señuelo (mínimo 2 opciones en total)');
      [t].concat(dec).forEach((o, i) => {
        const p = i ? `.truth.decoys.${pk}[${i - 1}]` : `.truth.${k}`;
        if (seen[o.id]) add('metodo_motivo', p + '.id', `id repetido: ${o.id}`); seen[o.id] = 1;
        (o.needs || []).forEach((n, j) => { if (!clue[n]) add('metodo_motivo', `${p}.needs[${j}]`, `la pista «${n}» no existe`); });
      });
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
