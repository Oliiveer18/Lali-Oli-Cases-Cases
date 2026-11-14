// fingerprint.js — HUELLA DE CASO (fábrica de casos, fase 4.0). Mide que cada caso generado sea ÚNICO.
// G.caseFingerprint(def, bible?) → { v, capture, decoy, rooms, scene, mechanic, tone, ally, mood, key }  (datos serializables, puro, sin azar)
//   capture  = cómo se atrapa al culpable (bible.captureForm si existe; si no, los ids de `solution.proof` sin sufijo: rastro+testigo+escondite+metodo)
//   decoy    = nº de sospechosos ENGAÑOSOS (0-3, como texto): inocentes DESCARTABLES que llegan a ≥ 60 % de la sospecha del culpable (G.DECOY_RATIO)
//   rooms    = plantilla(s) de sala (`room.template` si existe, si no `mapa_<ancho>x<alto>`) + nº de salas
//   scene    = 'calle' si alguna sala del caso usa una plantilla de escenario exterior abierto (4C-2a; se deduce de `room.template` con G.roomScene, sin campos nuevos en el caso), si no 'interior'
//   mechanic = mecánicas del caso 1 que usa el caso (herramientas, empujar, uv, sigilo, minijuego); 'solo_leer' si no usa ninguna
//   ally     = (4C-3b-2) aliado de policía: '<escena>:<rango>' (exterior, comisaria, interrogatorio, reconstruccion) o 'ninguno'
//   mood     = (4C-4a) ambiente del caso: claro, inquietante o macabro; 'ninguno' si el caso no lo declara (el caso 1)
//   tone     = tono del caso (4B-2: noir, telenovela, documental, western, espias, cuento); 'ninguno' si el caso no lo declara (el caso 1)
// G.fingerprintStats(lista) → reparto y dominancia. G.FINGERPRINT_GOALS = metas de unicidad: capture y decoy se EXIGEN desde 4A (test_fingerprint.js); rooms y mechanic desde 4C.
// Carga: require('./tools/load_g.js')(['fingerprint.js'])  (con bible.js/gen_*.js/compile.js para generar casos)
(function (root) {
  'use strict';
  const G = root.G;
  G.FINGERPRINT_VERSION = 6; // CL-5c-c 2/4: campo `puzzle`
  G.FINGERPRINT_GOALS = { topShareMax: 0.4, minCaptureForms: 4, minMechanics: 3, minMechanicKinds: 5, minRoomTemplates: 4, minTones: 4, sceneCalleMin: 0.25, sceneCalleMax: 0.35, decoyCounts: ['0', '1', '2', '3'], minDistinctPer1000: 100, puzzleMinCases: 40, puzzleTopShareMax: 0.65, allyMin: 0.5, minAllyScenes: 3, moodMacaboMin: 0.12, moodMacaboMax: 0.25 };
  const uniq = (a) => Array.from(new Set(a)).sort();
  const base = (id) => String(id).split('_')[0];

  function mechanicsOf(def) {
    const m = [];
    const step = (s) => {
      if (s.tool === 'coop') m.push('empujar'); else if (s.tool) m.push(s.tool);
      if (s.mini) m.push('minijuego');
    };
    Object.values(def.rooms || {}).forEach((r) => {
      (r.props || []).forEach((p) => {
        (p.steps || []).forEach(step);
        if (p.watcher || (p.listen && !p.chat)) m.push('sigilo'); // una charla grabada (`chat`) no es sigilo: la grabadora ya cuenta como herramienta
        if (p.uvOnly || p.uvMark) m.push('uv');
        if (p.locked && p.locked.tool) m.push(p.locked.tool);
      });
      (r.doors || []).forEach((d) => { if (d.locked && d.locked.tool) m.push(d.locked.tool); });
    });
    return uniq(m);
  }

  function decoyOf(def) {
    const cu = def.solution.culprit, sus = {};
    Object.values(def.clues || {}).forEach((c) => Object.keys(c.sus || {}).forEach((k) => { sus[k] = (sus[k] || 0) + c.sus[k]; }));
    const top = sus[cu] || 0;
    if (top <= 0) return '0';
    return String((def.suspects || []).filter((s) => s.id !== cu && (s.clearedBy || []).length > 0 && (sus[s.id] || 0) >= (G.DECOY_RATIO || 0.6) * top).length);
  }

  function roomsOf(def) {
    const t = Object.values(def.rooms || {}).map((r) => r.template || ('mapa_' + ((r.map && r.map[0] && r.map[0].length) || 0) + 'x' + ((r.map && r.map.length) || 0)));
    return uniq(t).join('+') + ':' + t.length;
  }

  // 4C-2a: escena del caso (G.roomScene vive en compile.js; sin él, o con plantillas desconocidas como las del caso 1, es 'interior')
  function sceneOf(def) {
    return Object.values(def.rooms || {}).some((r) => r.template && G.roomScene && G.roomScene(r.template) === 'calle') ? 'calle' : 'interior';
  }

  // 4C-3b-2: aliado de policía y su escena, deducidos de los objetos y del personaje (sin campos nuevos en el caso): '<escena>:<rango>' o 'ninguno'
  // escena = exterior (coche patrulla), comisaria (mostrador), interrogatorio (mesa) o reconstruccion (tablón); rango = título del aliado (agente, inspector, comisario)
  const ALLY_SPRITE = { police_car_0: 'exterior', station_counter: 'comisaria', interrogation_table: 'interrogatorio', clue_board: 'reconstruccion' };
  function allyOf(def) {
    const n = def.npcs && def.npcs.aliado; if (!n) return 'ninguno';
    const pl = ((def.placement || {}).aliado || [])[0], r = pl && def.rooms[pl.room], p = r && (r.props || []).find((q) => /^poli_/.test(q.id));
    return (p && ALLY_SPRITE[p.sprite] ? ALLY_SPRITE[p.sprite] : 'sin_escena') + ':' + String(n.title || '').toLowerCase();
  }

  // CL-5c-c 2/4: puzles del caso (objetos `pz_N`): 'ninguno', 'codigo', 'linea', 'codigo+linea' o 'codigo+codigo' (ordenado). Solo entra en la clave si hay puzles (así los casos sin ellos no cambian).
  function puzzleOf(def) {
    const k = [];
    Object.values(def.rooms || {}).forEach((r) => (r.props || []).forEach((p) => { if (/^pz_\d+$/.test(p.id)) { const mi = p.steps && p.steps[0] && p.steps[0].mini; k.push(mi && mi.type === 'timeline' ? 'linea' : 'codigo'); } }));
    return k.length ? k.sort().join('+') : 'ninguno';
  }

  G.caseFingerprint = function (def, bible) {
    const proof = (def.solution && def.solution.proof) || [];
    const capture = (bible && bible.captureForm) || (proof.length ? uniq(proof.map(base)).join('+') : 'manual');
    const mech = mechanicsOf(def);
    const fp = { v: G.FINGERPRINT_VERSION, capture, decoy: decoyOf(def), rooms: roomsOf(def), scene: sceneOf(def), mechanic: mech.length ? mech.join('+') : 'solo_leer', tone: def.tone || 'ninguno', ally: allyOf(def), mood: def.mood || 'ninguno' };
    fp.puzzle = puzzleOf(def); fp.theme = def.theme || 'ninguno'; fp.scenario = def.scenario || 'ninguno'; // 4F-0a: solo entran en la clave si NO son los de siempre (así la clave de los casos Robo/panadería no cambia)
    fp.key = [fp.capture, fp.decoy, fp.rooms, fp.scene, fp.mechanic, fp.tone, fp.ally, fp.mood].concat(fp.theme !== 'robo' && fp.theme !== 'ninguno' ? ['t:' + fp.theme] : [], fp.scenario !== 'panaderia' && fp.scenario !== 'ninguno' ? ['e:' + fp.scenario] : [], fp.puzzle !== 'ninguno' ? ['p:' + fp.puzzle] : []).join(' | ');
    return fp;
  };

  // lista de huellas → { n, distinct, topKey, topShare, fields:{campo:{valor:n}}, topShareByField:{campo:cuota} }
  G.fingerprintStats = function (list) {
    const n = list.length, out = { n, distinct: 0, topKey: null, topShare: 0, fields: {}, topShareByField: {} };
    const keys = {};
    list.forEach((f) => { keys[f.key] = (keys[f.key] || 0) + 1; });
    out.distinct = Object.keys(keys).length;
    Object.keys(keys).forEach((k) => { if (keys[k] > (keys[out.topKey] || 0)) out.topKey = k; });
    out.topShare = n ? (keys[out.topKey] || 0) / n : 0;
    ['capture', 'decoy', 'rooms', 'scene', 'mechanic', 'tone', 'ally', 'mood', 'puzzle'].forEach((fld) => {
      const c = {}; list.forEach((f) => { c[f[fld] || 'ninguno'] = (c[f[fld]] || 0) + 1; });
      out.fields[fld] = c; out.topShareByField[fld] = n ? Math.max.apply(null, Object.values(c)) / n : 0;
    });
    // 4C-2b-2: mecánicas distintas por separado (lupa, ganzúa, uv, empujar, sigilo...) que aparecen en la lista
    const kinds = {}; Object.keys(out.fields.mechanic).forEach((k) => k.split('+').forEach((m) => { if (m !== 'solo_leer') kinds[m] = (kinds[m] || 0) + out.fields.mechanic[k]; }));
    out.mechanicKinds = Object.keys(kinds).length; out.mechanicKindCounts = kinds;
    return out;
  };

  // ¿cumple las metas de unicidad? (se exige desde 4A para capture/decoy y desde 4C para rooms/mechanic)
  G.fingerprintGoals = function (st) {
    const g = G.FINGERPRINT_GOALS, F = st.fields, cnt = (f) => Object.keys(F[f]).length;
    const res = {
      capture: cnt('capture') >= g.minCaptureForms && st.topShareByField.capture <= g.topShareMax,
      decoy: g.decoyCounts.every((k) => F.decoy[k] > 0) && st.topShareByField.decoy <= g.topShareMax, // aparecen 0, 1, 2 y 3 y ninguno domina
      rooms: cnt('rooms') >= g.minRoomTemplates && st.topShareByField.rooms <= g.topShareMax, // 4C-2a: ningún valor de salas pasa del 40 %
      scene: !F.scene || (F.scene.calle / st.n >= g.sceneCalleMin && F.scene.calle / st.n <= g.sceneCalleMax && !!F.scene.interior), // 4C-2a: casos de calle entre el 25 y el 35 %
      mechanic: cnt('mechanic') >= g.minMechanics && st.topShareByField.mechanic <= g.topShareMax && st.mechanicKinds >= g.minMechanicKinds, // 4C-2b-2: ≥ 5 mecánicas distintas y ninguna combinación domina
      tone: !F.tone || (cnt('tone') >= g.minTones && st.topShareByField.tone <= g.topShareMax), // 4B-2: ≥ 4 tonos y ninguno domina
      // 4C-3b-2: ≥ 50 % de los casos con aliado, ≥ 3 tipos de escena y ninguna combinación escena+rango domina
      ally: !F.ally || ((st.n - (F.ally.ninguno || 0)) / (st.n || 1) >= g.allyMin && new Set(Object.keys(F.ally).filter((k) => k !== 'ninguno').map((k) => k.split(':')[0])).size >= g.minAllyScenes && st.topShareByField.ally <= g.topShareMax),
      // 4C-4a: aparecen los tres ambientes y el macabro queda entre el 12 y el 25 % (no domina ni desaparece)
      mood: !F.mood || (['claro', 'inquietante', 'macabro'].every((k) => F.mood[k] > 0) && (F.mood.macabro || 0) / st.n >= g.moodMacaboMin && (F.mood.macabro || 0) / st.n <= g.moodMacaboMax),
      // CL-5c-c 2/4: con ≥ 40 casos con puzle aparecen código y línea de tiempo y ninguna combinación pasa del 65 % (lo esperado es 50 / 25 / 25) de los casos con puzle (no se exige si hay menos: Fácil y Normal no llevan)
      puzzle: !F.puzzle || (() => { const pc = Object.keys(F.puzzle).filter((k) => k !== 'ninguno'), tot = pc.reduce((a, k) => a + F.puzzle[k], 0); if (tot < g.puzzleMinCases) return true; return pc.some((k) => /codigo/.test(k)) && pc.some((k) => /linea/.test(k)) && Math.max.apply(null, pc.map((k) => F.puzzle[k])) / tot <= g.puzzleTopShareMax; })(),
      overall: st.topShare <= g.topShareMax && st.distinct >= (g.minDistinctPer1000 * st.n) / 1000,
    };
    res.ok = Object.values(res).every(Boolean);
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
