// gen_truth.js — LA VERDAD (fábrica de casos, fase 3B). G.genTruth(seed) → biblia PARCIAL (contrato: docs/BIBLIA_DEL_CASO.md).
// Pura y determinista: solo G.rng. Decide reparto, lugares, objeto, culpable, método, móvil, ventana, cronología, coartadas y QUIÉN MIENTE
// (el culpable y 1-2 inocentes llevan holds:false). Deja vacío lo que rellena 3C: clues, lies, proof, method.needs, motive.needs, clearedBy.
// 4A (GEN_VERSION 3): además decide el NIVEL (facil/normal/dificil, derivado de la semilla), la FORMA DE CAPTURA (G.CAPTURE_FORMS) y los SOSPECHOSOS ENGAÑOSOS
// (inocentes con una actividad secreta graciosa durante la ventana). Lo decide un azar propio (seed ^ 0xd3c0): no mueve la historia base.
// opts = { level, form } solo para pruebas y herramientas (con opts el código de caso no basta para reproducir el caso).
// Pasa G.checkBible(b, { partial:true }). Necesita bible.js y gen_data.js cargados antes.
(function (root) {
  'use strict';
  const G = root.G, D = G.GEN_DATA;
  const rnd = (r, n) => Math.floor(r() * n); // entero 0..n-1
  const pick = (r, a) => a[rnd(r, a.length)];
  const shuffle = (r, a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = rnd(r, i + 1), t = x[i]; x[i] = x[j]; x[j] = t; } return x; };
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(v, k) ? v[k] : m));
  const byId = (l, id) => l.filter((x) => x.id === id)[0];
  const DAY_END = 1440, MARGIN = 15; // el culpable llega 15 min antes de la ventana y se queda 15 después

  // v6: ¿este caso lleva escena de calle? Azar propio (seed ^ 0x57ee7) y probabilidad de D.compile.street.chance: no depende del nº de salas. false con GEN_VERSION 5.
  G.wantsStreet = function (seed) { const S = G.GEN_VERSION >= 6 && D.compile && D.compile.street; return !!S && G.rng(((seed >>> 0) ^ 0x57ee7) >>> 0)() < S.chance; };

  // 4F-0a: elige el escenario de la temática entre los LISTOS. Con uno solo (hoy: la panadería) no gasta azar; con varios usa un azar propio de la semilla (nunca el del caso).
  G.pickScenario = function (seed, theme) {
    const ok = G.readyScenarios(theme);
    return ok.length === 1 ? ok[0] : ok[(G.rng(((seed >>> 0) ^ 0x5c3e11) >>> 0)() * ok.length) | 0];
  };
  // 4F-0b 3/4-b: lugares que puede sortear un caso. GEN_VERSION < 7: solo los base (casos idénticos). >= 7: los base + los de reserva (el Despacho). placeById busca en ambas listas (solo se pregunta por lugares de un caso).
  G.casePlaces = function () { const D = G.GEN_DATA; return G.GEN_VERSION >= 7 ? D.places.concat(D.reservedPlaces || []) : D.places; };
  G.placeById = function (id) { const D = G.GEN_DATA; return D.places.concat(D.reservedPlaces || []).filter((p) => p.id === id)[0]; };
  G.genTruth = function (seed, opts) {
    seed = seed >>> 0;
    const theme = opts && opts.theme ? opts.theme : G.DEFAULT_THEME; // 4F-0a
    if (!G.themeReady(theme)) throw new Error('La temática «' + theme + '» aún no está lista');
    const scenario = G.pickScenario(seed, theme);
    const r = G.rng(seed ^ 0x7e57);

    // ---- lugares y objeto (el robo ocurre donde estaba el objeto)
    const obj = pick(r, D.objects), wp = pick(r, obj.where);
    // 3-bis 2/3 (GEN_VERSION >= 6): el nivel se decide ANTES (mismo azar propio r2, mismo primer valor) y fija el tamaño del caso (D.compile.levels); r consume lo mismo que antes
    const r2 = G.rng(seed ^ 0xd3c0), lv = r2(), level = (opts && opts.level) || (lv < 0.35 ? 'facil' : lv < 0.7 ? 'normal' : 'dificil');
    const LP = G.GEN_VERSION >= 6 && D.compile && D.compile.levels ? D.compile.levels[level] : null;
    // 4F-0b 3/4-b (GEN_VERSION >= 7): el sorteo de lugares incluye el Despacho del dueño (D.reservedPlaces, nunca es sala del robo) y cada nivel fija SU nº de salas (extraPlacesV7: Fácil 3 + robo = 4, Normal 5, Difícil 6, siempre).
    const POOL = G.casePlaces();
    const shufPlaces = shuffle(r, POOL.map((p) => p.id).filter((id) => id !== wp)), nExtra0 = 2 + rnd(r, 3); // mismo orden de consumo de r que antes (primero el barajado)
    const EP = LP ? (G.GEN_VERSION >= 7 && LP.extraPlacesV7 ? LP.extraPlacesV7 : LP.extraPlaces) : null;
    const nExtra = LP ? Math.max(EP[0], Math.min(EP[1], nExtra0)) : nExtra0;
    const extra = shufPlaces.slice(0, nExtra); // v5: 2..4 más ⇒ 3..5 lugares; v6: según el nivel
    // v6: si el caso lleva calle (decisión propia, G.wantsStreet), el lugar de la calle entra SIEMPRE (sustituye al último extra; el nº de lugares no cambia)
    if (LP && D.compile.street && G.wantsStreet(seed) && wp !== D.compile.street.place && extra.indexOf(D.compile.street.place) < 0 && extra.length) extra[extra.length - 1] = D.compile.street.place;
    const placeIds = POOL.map((p) => p.id).filter((id) => id === wp || extra.indexOf(id) >= 0);
    const others = placeIds.filter((id) => id !== wp); // lugares donde se puede estar sin tocar el robo
    const to = (id) => G.placeById(id).to;

    // ---- reparto: cliente primero, luego 4-6 sospechosos
    const k0 = 4 + rnd(r, 3), k = LP ? Math.max(LP.suspects[0], Math.min(LP.suspects[1], k0)) : k0;
    const names = shuffle(r, D.names).slice(0, k + 1), traits = shuffle(r, D.traits), looks = shuffle(G.rng(seed ^ 0x1ca5), D.looks); // 4B: aspectos con su propia secuencia de azar; sin repetir dentro del caso (hay ≥ 40)
    const cast = names.map((n, i) => ({ id: n.id, name: n.name, role: i ? 'sospechoso' : 'cliente', look: i ? looks[(i - 1) % looks.length] : D.clientLook, trait: traits[i % traits.length] }));
    const sus = cast.slice(1).map((c) => c.id), culprit = pick(r, sus), inn = sus.filter((s) => s !== culprit);

    // ---- 4A: nivel, nº de engañosos (0-3 según el nivel; con 4 sospechosos, 2 como mucho) y forma de captura
    const FORMS = Object.keys(G.CAPTURE_FORMS);
    const maxD = G.maxDecoys(k), rg = G.decoyRange(level), lo = Math.min(rg[0], maxD), hi = Math.min(rg[1], maxD);
    const dv = r2(), nDec = hi > lo && dv < (level === 'dificil' ? 0.6 : 0.5) ? hi : lo;
    const decoys = shuffle(r2, inn).slice(0, nDec);
    const fv = r2(); let form = (opts && opts.form) || FORMS[Math.floor(fv * FORMS.length)];

    // ---- verdad: método, móvil y señuelos
    const ms = shuffle(r, D.methods), mo = shuffle(r, D.motives);
    const tag = (o) => ({ id: o.id, text: o.text });

    // ---- ventana (22:00-23:00 de inicio, 15-30 min) y papeles de cada uno
    const w = { from: 1320 + 5 * rnd(r, 13) }; w.to = w.from + 15 + 5 * rnd(r, 4); w.place = wp;
    const pool = [cast[0].id].concat(inn.filter((x) => decoys.indexOf(x) < 0)); // los engañosos no son testigos del robo
    const late = pick(r, pool); // vuelve al lugar del robo justo después y lo descubre
    const early = r() < 0.7 ? pick(r, pool.filter((x) => x !== late)) : null; // está en el lugar del robo justo antes
    const liars = shuffle(r, inn.filter((x) => x !== late && x !== early)).slice(0, 1 + rnd(r, 2)); // los testigos del robo (late/early) nunca mienten sobre sí mismos

    // ---- cronología: cada persona es una cadena de franjas seguidas hasta las 24:00
    const E = [], at = {}; // at[id] = { place, a0, a1 }: dónde está durante la ventana
    const push = (who, place, t, until, doing) => E.push({ t, until, who, place, doing, witnesses: [] });
    const act = (place, kind) => pick(r, D.acts[place][kind]);
    cast.forEach((c) => {
      const S = 1230 + 5 * rnd(r, 13); // empieza entre 20:30 y 21:30
      if (c.id === culprit) {
        const Y = pick(r, others), Z = pick(r, others);
        push(c.id, Y, S, w.from - MARGIN, act(Y, 'normal'));
        push(c.id, wp, w.from - MARGIN, w.to + MARGIN, fill(D.theft, { obj: obj.name }));
        push(c.id, Z, w.to + MARGIN, DAY_END, fill(D.hide, { where: D.hideAt[Z] }));
        return;
      }
      const P = pick(r, others), isLate = c.id === late, isEarly = c.id === early;
      let a0 = S;
      if (isEarly) a0 = w.from - 5;
      else if (r() >= 0.5) { const max = Math.floor((w.from - 10 - S) / 5); a0 = S + 5 * (3 + rnd(r, max - 2)); }
      let a1 = DAY_END;
      if (isLate) a1 = w.to + 5;
      else if (r() >= 0.5) { const max = Math.floor((Math.min(w.to + 40, 1425) - w.to) / 5); a1 = w.to + 5 * (2 + rnd(r, max - 1)); }
      if (a0 > S) { const Q = isEarly ? wp : pick(r, placeIds.filter((x) => x !== P)); push(c.id, Q, S, a0, act(Q, 'normal')); }
      push(c.id, P, a0, a1, liars.indexOf(c.id) >= 0 || decoys.indexOf(c.id) >= 0 ? act(P, 'secret') : act(P, 'normal'));
      if (a1 < DAY_END) { const R = isLate ? wp : pick(r, placeIds.filter((x) => x !== P)); push(c.id, R, a1, DAY_END, isLate ? fill(D.discover, { to: to(wp), obj: obj.name }) : act(R, 'normal')); }
      at[c.id] = { place: P, a0, a1 };
    });
    const order = {}; cast.forEach((c, i) => { order[c.id] = i; });
    E.sort((x, y) => x.t - y.t || x.until - y.until || order[x.who] - order[y.who]);
    E.forEach((e) => { // testigos: quien coincide con él al menos 10 min en el mismo lugar
      cast.forEach((c) => { if (c.id !== e.who && E.some((o) => o.who === c.id && o.place === e.place && Math.min(o.until, e.until) - Math.max(o.t, e.t) >= 10)) e.witnesses.push(c.id); });
    });

    // forma «testigos_cruzados»: el culpable dice estar donde de verdad estuvo, toda la ventana, un inocente que no miente (y no lo vio)
    let absent = null;
    if (form === 'testigos_cruzados') {
      const hon = inn.filter((x) => liars.indexOf(x) < 0), cand = hon.filter((x) => decoys.indexOf(x) < 0); // el testigo ausente no puede ser un engañoso
      if (cand.length) absent = cand[Math.floor(r2() * cand.length)]; else form = 'clasica'; // sin testigo válido, el caso se resuelve de forma clásica
    }

    // ---- coartadas: el culpable y los mentirosos dicen algo falso; los demás, lo cierto
    const alibis = {};
    sus.forEach((s) => {
      if (s === culprit) {
        alibis[s] = { claim: { place: pick(r, others), from: w.from - 5 * (2 + rnd(r, 7)), to: w.to + 5 * (1 + rnd(r, 6)) }, holds: false, clearedBy: null };
        if (absent) alibis[s].claim.place = at[absent].place;
      } else if (liars.indexOf(s) >= 0) {
        const X = pick(r, others.filter((x) => x !== at[s].place));
        alibis[s] = { claim: { place: X, from: w.from - 5 * (1 + rnd(r, 6)), to: w.to + 5 * (1 + rnd(r, 6)) }, holds: false, clearedBy: null };
      } else {
        const a = at[s];
        alibis[s] = { claim: { place: a.place, from: Math.max(a.a0, w.from - 5 * (1 + rnd(r, 4))), to: Math.min(a.a1, w.to + 5 * (1 + rnd(r, 4))) }, holds: true, clearedBy: null };
      }
    });

    return {
      format: G.BIBLE_FORMAT, gen: G.GEN_VERSION, seed, schema: 'robo', code: G.caseCode(seed, theme),
      theme, goal: G.THEMES[theme].goal, scenario, // 4F-0a: marco de temáticas (hoy siempre robo / acusar / panadería)
      places: placeIds.map((id) => ({ id, name: G.placeById(id).name })),
      object: { id: obj.id, name: obj.name, place: wp },
      cast,
      truth: {
        culprit,
        method: { id: ms[0].id, text: ms[0].text, needs: [] },
        motive: { id: mo[0].id, text: mo[0].text, needs: [] },
        window: w,
        timeline: E,
        decoys: { methods: [tag(ms[1]), tag(ms[2])], motives: [tag(mo[1]), tag(mo[2])] },
      },
      alibis, lies: [], clues: [], proof: [],
      captureForm: form, level,
      deceptive: decoys.map((d) => ({ who: d, why: E.filter((e) => e.who === d && e.place === at[d].place && e.t < w.to && w.from < e.until)[0].doing })),
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
