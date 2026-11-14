// review.js — REVISOR DE CASOS · parte 2A: equidad (fábrica de casos, fase 2)
// G.reviewCase(def) → { ok, fairness (0-100), findings:[{sev,code,msg}], stats }.
// Solo juzga casos que ya pasan G.validateCase. Severidades: error (el caso es injusto), warn (flojo), info (nota).
// A4 4/4 subpaso 3: con GEN_VERSION >= 6 y casos generados también exige el reparto EQ-1 (error `reparto_caso` / `reparto_capN`).
// La parte 2B añadirá el bot que juega el caso y la duración estimada.
// Límite conocido: el formato aún no guarda una cronología con horas por personaje, así que «solo el culpable encaja con
// la cronología» se comprueba con los datos que existen (sospecha por pistas, descartes y pruebas); la cronología
// estructurada llegará con el generador (fase 3).
(function (root) {
  'use strict';
  const G = root.G;
  G.REVIEW_VERSION = 2; // CL-5c-c 2/4: reglas J5-J6 de los puzles (objetos `pz_N`)
  const PENALTY = { error: 35, warn: 8, info: 0 };

  // CL-5c-c 2/4 · PUZLES (solo casos v7 de Difícil con objetos `pz_N`; el resto ni los mira).
  // G.puzzleClueIds(def) → ids de las pistas que exigen los pasos `pz_N` (las propias del puzle: rol `ambiente`).
  G.puzzleClueIds = function (def) {
    const ids = {};
    Object.keys(def.rooms || {}).forEach((rid) => (def.rooms[rid].props || []).forEach((q) => { if (/^pz_\d+$/.test(q.id)) (q.steps || []).forEach((st) => ((st.requires && st.requires.clue) || []).forEach((id) => { ids[id] = 1; })); }));
    return Object.keys(ids);
  };
  // G.stripPuzzles(def) → COPIA del caso sin puzles (sin objetos `pz_N`, sin sus pistas y sin los temas de charla que las entregan). Sirve para J6.
  G.stripPuzzles = function (def) {
    const ids = G.puzzleClueIds(def), d = JSON.parse(JSON.stringify(def));
    const gives = (q) => (q.steps || []).some((st) => ids.indexOf(st.clue) >= 0 || (st.fx && st.fx.clue && [].concat(st.fx.clue).some((x) => ids.indexOf(x) >= 0)));
    Object.keys(d.rooms).forEach((rid) => { d.rooms[rid].props = (d.rooms[rid].props || []).filter((q) => !/^pz_\d+$/.test(q.id) && !gives(q)); });
    ids.forEach((id) => { delete d.clues[id]; });
    (d.chapters || []).forEach((ch) => (ch.goals || []).forEach((g) => { if (g.clues) { g.clues = g.clues.filter((id) => ids.indexOf(id) < 0); if (g.min > g.clues.length) g.min = g.clues.length; } }));
    Object.keys(d.npcs || {}).forEach((nid) => { const n = d.npcs[nid]; if (n && n.topics) n.topics = n.topics.filter((t) => !ids.some((id) => JSON.stringify(t).indexOf('"' + id + '"') >= 0)); });
    return d;
  };

  // opts.bible (opcional): la biblia del caso; con ella J5 también comprueba la cronología (el suceso no es del culpable y cae fuera de la ventana del robo).
  G.reviewCase = function (def, opts) {
    opts = opts || {};
    const out = { ok: false, fairness: 0, findings: [], stats: {} };
    const add = (sev, code, msg) => out.findings.push({ sev, code, msg });
    const v = G.validateCase(def);
    if (!v.ok) {
      add('error', 'invalido', 'El caso no pasa el validador: ' + v.errors[0] + (v.errors.length > 1 ? ` (y ${v.errors.length - 1} más)` : ''));
      return out;
    }
    const sol = def.solution, culprit = sol.culprit;
    const all = new G.CaseState(def, 'normal');
    Object.keys(def.clues).forEach((c) => all.addClue(c)); // el validador ya garantiza que todas se pueden conseguir
    const sus = (id) => all.suspicion(id);
    const cs = def.suspects.find((s) => s.id === culprit);

    // ---- el culpable
    if (cs.clearedBy.length) add('error', 'culpable_descartable', `Se puede descartar al culpable (${cs.name}) con las pistas ${cs.clearedBy.join(', ')}: el jugador lo exculparía.`);
    const proofPos = sol.proof.filter((c) => (def.clues[c].sus || {})[culprit] > 0);
    if (proofPos.length < 3) add('error', 'pocas_pruebas', `Solo ${proofPos.length} de las pruebas señalan de verdad al culpable (mínimo 3).`);
    const rivals = def.suspects.filter((s) => s.id !== culprit);
    const culpritSus = sus(culprit);

    // ---- los inocentes
    let topInnocent = 0;
    rivals.forEach((s) => {
      const n = sus(s.id), cleared = s.clearedBy.length > 0;
      if (!cleared) topInnocent = Math.max(topInnocent, n);
      if (!cleared && n >= culpritSus) add('error', 'inocente_igual', `${s.name} no se puede descartar y levanta tanta o más sospecha (${n}) que el culpable (${culpritSus}): el caso no tiene una sola respuesta clara.`);
      else if (!cleared && culpritSus - n < 3) add('warn', 'inocente_cercano', `${s.name} no se puede descartar y queda muy cerca del culpable (${n} contra ${culpritSus}).`);
      // pista falsa creíble: alguna pista que sospeche de él y no sea una prueba contra el culpable
      const herring = Object.keys(def.clues).filter((c) => (def.clues[c].sus || {})[s.id] > 0 && sol.proof.indexOf(c) < 0);
      if (!herring.length) add(s.easyHidden ? 'info' : 'warn', 'sin_pista_falsa', s.easyHidden ? `${s.name} es un sospechoso decorativo (oculto en Fácil): no tiene pista falsa.` : `${s.name} no tiene ninguna pista falsa creíble: sospechar de él nunca es tentador.`);
      if (!cleared && !s.easyHidden && herring.length === 0 && n === 0) add('warn', 'inocente_sin_rastro', `${s.name} no se puede descartar ni deja rastro: sobra o falta una pista.`);
    });
    if (def.suspects.filter((s) => !s.easyHidden).length < 3) add('error', 'pocos_sospechosos_facil', 'En Fácil quedan menos de 3 sospechosos visibles.');

    // ---- mentiras: se pueden desmontar con algo que NO diga el propio mentiroso
    const grantedBy = (clue) => {
      const src = { props: false, npcs: [] };
      Object.keys(def.rooms).forEach((rid) => {
        def.rooms[rid].props.forEach((p) => (p.steps || []).forEach((s) => {
          if (s.clue === clue || (s.fx && s.fx.clue && [].concat(s.fx.clue).indexOf(clue) >= 0)) src.props = true;
          if (s.mini && s.mini.events && s.clue === clue) src.props = true;
        }));
        def.rooms[rid].doors.forEach((d) => { if (d.firstOpen && d.firstOpen.clue === clue) src.props = true; });
      });
      Object.keys(def.npcs).forEach((nid) => {
        const nd = def.npcs[nid];
        const lists = [].concat(nd.topics.map((t) => t.responses), [nd.chat || [], nd.press || []], Object.keys(nd.evidence).map((k) => nd.evidence[k]));
        lists.forEach((l) => l.forEach((e) => { const r = Array.isArray(e) ? {} : e; if (r.fx && r.fx.clue && [].concat(r.fx.clue).indexOf(clue) >= 0 && src.npcs.indexOf(nid) < 0) src.npcs.push(nid); }));
      });
      return src;
    };
    const lies = def.lies || {};
    let liesOk = 0;
    Object.keys(lies).forEach((nid) => {
      const L = lies[nid], name = def.npcs[nid].name;
      const works = L.refutedBy.filter((c) => {
        const s2 = new G.CaseState(def, 'normal');
        Object.keys(def.clues).forEach((k) => s2.addClue(k));
        s2.setFlag(L.flag);
        return !!s2.present(nid, c).objection;
      });
      if (!works.length) { add('error', 'mentira_indemostrable', `Ninguna prueba logra desmontar la mentira de ${name}.`); return; }
      const outside = L.refutedBy.filter((c) => { const g = grantedBy(c); return g.props || g.npcs.some((x) => x !== nid); });
      if (!outside.length) { add('error', 'mentira_circular', `La mentira de ${name} solo se desmonta con algo que dice el propio ${name}: es circular.`); return; }
      if (works.length < L.refutedBy.length) add('warn', 'prueba_sin_efecto', `Alguna prueba de la lista de ${name} no llega a desmontar su mentira.`);
      liesOk++;
    });
    if (!Object.keys(lies).length) add('warn', 'sin_mentiras', 'El caso no tiene ninguna mentira que desmontar.');

    // ---- reparto de herramientas Oli/Lali (EQ-1, A4 4/4 subpaso 3): cada detective entre el 40 y el 60 % del trabajo con herramienta, en número y en tiempo, por caso y por capítulo.
    // SOLO para casos generados (def.genLevel) con GEN_VERSION >= 6: el caso 1 (hecho a mano, Oli 8 / Lali 3) y los casos G5 quedan como estaban. La medida es la de siempre (G.workIssues, src/logic.js).
    let reparto = null;
    if (G.GEN_VERSION >= 6 && def.genLevel && G.workIssues) {
      const w = G.workShare(def);
      reparto = { oliNum: w.share.num, oliTime: w.share.time, trabajo: w.share.work };
      G.workIssues(def).forEach((i) => add('error', i.scope === 'caso' ? 'reparto_caso' : 'reparto_' + i.scope, i.msg));
    }
    // ---- CL-5c-c 2/4: PUZLES. J5 ambiente puro · J6 prescindible (docs/DISENO_PUZLES_CL5C.md §3)
    const pzIds = G.puzzleClueIds(def);
    if (pzIds.length && !opts.noPuzzles) {
      const cname = (def.npcs[culprit] || {}).name || cs.name, esc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const refs = {}; // quién usa cada pista: prueba, descarte, mentira, método o móvil
      sol.proof.forEach((c) => { refs[c] = 'prueba'; });
      def.suspects.forEach((s) => s.clearedBy.forEach((c) => { refs[c] = 'descarte'; }));
      Object.keys(lies).forEach((k) => lies[k].refutedBy.forEach((c) => { refs[c] = 'mentira'; }));
      (sol.methods || []).concat(sol.motives || []).forEach((o) => (o.needs || []).forEach((c) => { refs[c] = 'método/móvil'; }));
      pzIds.forEach((id) => {
        const c = def.clues[id]; if (!c) return;
        if (Object.keys(c.sus || {}).some((k) => c.sus[k])) add('error', 'puzle_con_puntos', `J5: la pista de puzle ${id} da puntos de sospecha (debe ser ambiente puro).`);
        if (refs[id]) add('error', 'puzle_en_solucion', `J5: la pista de puzle ${id} se usa como ${refs[id]} (debe ser ambiente puro).`);
        if (cname && new RegExp('(^|[^\\p{L}])' + esc(cname) + '([^\\p{L}]|$)', 'u').test(c.text || '')) add('error', 'puzle_nombra_culpable', `J5: la pista de puzle ${id} nombra al culpable (${cname}).`);
      });
      if (opts.bible && opts.bible.truth) {
        const tl = opts.bible.truth.timeline || [], W = opts.bible.truth.window;
        opts.bible.clues.filter((c) => pzIds.indexOf(c.id) >= 0).forEach((c) => {
          const e = Number.isInteger(c.derivedFrom) ? tl[c.derivedFrom] : null;
          if (c.role !== 'ambiente') add('error', 'puzle_rol', `J5: la pista de puzle ${c.id} es de rol «${c.role}» (debe ser ambiente).`);
          if (!e) add('error', 'puzle_sin_suceso', `J5: la pista de puzle ${c.id} no sale de ningún suceso de la cronología.`);
          else {
            if (e.who === culprit) add('error', 'puzle_del_culpable', `J5: la pista de puzle ${c.id} cuenta un suceso del culpable.`);
            if (W && e.until > W.from && e.t < W.to) add('error', 'puzle_en_ventana', `J5: la pista de puzle ${c.id} cae dentro de la ventana del robo.`);
          }
        });
      }
      // J6: sin los puzles el caso se resuelve igual: mismo veredicto, mismas pruebas y los mismos fallos que el caso completo
      const sd = G.stripPuzzles(def), sv = G.validateCase(sd);
      if (!sv.ok) add('error', 'puzle_no_prescindible', `J6: sin los puzles el caso deja de ser válido: ${sv.errors[0]}`);
      else {
        const sr = G.reviewCase(sd, { noPuzzles: true }), mine = out.findings.filter((f) => f.sev === 'error' && !/^puzle_/.test(f.code)).map((f) => f.code).sort().join(',');
        const base = sr.findings.filter((f) => f.sev === 'error').map((f) => f.code).sort().join(',');
        if (base !== mine || sr.stats.proofAgainstCulprit !== proofPos.length || sr.stats.culpritSuspicion !== culpritSus || sr.stats.topInnocentSuspicion !== topInnocent) add('error', 'puzle_no_prescindible', 'J6: sin los puzles cambian las pruebas, la sospecha o los fallos del caso.');
      }
    }
    out.stats = { reparto, puzzles: pzIds.length, suspects: def.suspects.length, clues: Object.keys(def.clues).length, proofAgainstCulprit: proofPos.length, culpritSuspicion: culpritSus, topInnocentSuspicion: topInnocent, lies: Object.keys(lies).length, liesRefutable: liesOk };
    let score = 100;
    out.findings.forEach((f) => { score -= PENALTY[f.sev] || 0; });
    out.fairness = Math.max(0, score);
    out.ok = !out.findings.some((f) => f.sev === 'error');
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
