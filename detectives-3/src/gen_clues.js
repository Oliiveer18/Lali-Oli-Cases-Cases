// gen_clues.js — PISTAS Y MENTIRAS (fábrica de casos, fase 3C). G.genClues(bible, { mood }?) → biblia COMPLETA (contrato: docs/BIBLIA_DEL_CASO.md).
// 4C-4c-1: con { mood } inquietante o macabro, unas pocas pistas de objeto llevan un MATIZ (detalle perturbador + remate pegado al texto; `bible.matiz` = ids). Azar propio: no mueve el resto.
// Pura y determinista: solo G.rng(seed ^ 0x51ed). No muta la biblia que recibe. Rellena clues, lies, proof, method.needs, motive.needs,
// decoys[].needs y alibis[x].clearedBy a partir de la cronología que dejó genTruth. Textos en gen_data.js (D.clueTpl).
// Si la biblia resultante no pasa G.checkBible, reintenta con otra variante del azar (máx. 6); G.genCluesInfo informa de cuántos intentos hicieron falta.
// Necesita bible.js, gen_data.js y gen_truth.js cargados antes.
(function (root) {
  'use strict';
  const G = root.G, D = G.GEN_DATA, T = D.clueTpl;
  const MAX_PROPS = 4, ATTEMPTS = 6;
  const rnd = (r, n) => Math.floor(r() * n);
  const pick = (r, a) => a[rnd(r, a.length)];
  const shuffle = (r, a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = rnd(r, i + 1), t = x[i]; x[i] = x[j]; x[j] = t; } return x; };
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(v, k) ? v[k] : m));
  const lc = (s) => { s = String(s).replace(/\.$/, ''); return s.charAt(0).toLowerCase() + s.slice(1); };
  const pl = (id) => G.placeById(id); // 4F-0b 3/4-b: busca también en los lugares de reserva (Despacho)
  const overlap = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

  function build(b0, r, mood, recent) {
    const b = JSON.parse(JSON.stringify(b0)), tr = b.truth, tl = tr.timeline, w = tr.window, cu = tr.culprit, wp = w.place;
    const name = {}; b.cast.forEach((c) => { name[c.id] = c.name; });
    const inn = b.cast.filter((c) => c.role === 'sospechoso' && c.id !== cu).map((c) => c.id);
    const base = { obj: b.object.name, time: G.minToStr(w.from + 5 * Math.floor((w.to - w.from) / 10)) };
    const place = (id) => ({ loc: pl(id).loc, to: pl(id).to, pname: pl(id).name });
    const clues = [], count = {}, topics = {};
    b.places.forEach((p) => { count[p.id] = 0; });
    const room = (id) => count[id] < MAX_PROPS;
    const anyPlace = (pref) => { if (pref && room(pref)) return pref; const l = shuffle(r, b.places.map((p) => p.id)).filter(room); return l.length ? l[0] : null; };
    const prop = (id) => { count[id]++; return { type: 'prop', place: id }; };
    const npc = (who, subject, word) => { // un tema de conversación único por personaje
      let t = word + '_' + subject, n = 2; while (topics[who + '|' + t]) t = word + '_' + subject + '_' + n++;
      topics[who + '|' + t] = 1; return { type: 'npc', npc: who, topic: t };
    };
    const add = (c) => { clues.push(c); return c.id; };
    const liar = (x) => !!(b.alibis[x] && b.alibis[x].holds === false); // quien miente sobre sí mismo no es testigo fiable
    const decoyIdx = {}; (b.deceptive || []).forEach((d, i) => { decoyIdx[d.who] = i; }); // sospechosos engañosos (4A): necesitan descarte y 3 pistas falsas fuertes; nunca son testigos de cargo
    const witnessesOf = (i, avoid) => tl[i].witnesses.filter((x) => avoid.indexOf(x) < 0);
    const honestFirst = (l) => l.filter((x) => !liar(x)).concat(l.filter(liar)); // estable: respeta el orden barajado

    const mine = tl.map((e, i) => (e.who === cu ? i : -1)).filter((i) => i >= 0);
    const theftI = mine.filter((i) => tl[i].place === wp)[0], hideI = mine[mine.length - 1], Z = tl[hideI].place;
    // ---- pruebas contra el culpable: las que pide la FORMA DE CAPTURA (G.CAPTURE_FORMS). Cada una sale de la cronología del culpable.
    // viaTheft = pruebas derivadas del robo y con otra fuente (objeto o testigo ajeno): son las que desmontan la mentira del culpable.
    const form = b.captureForm || 'clasica', proof = [], viaTheft = [], cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    const vm = { who: name[cu] };
    let wits = null, methodId = null;
    const theftWit = () => { if (!wits) wits = honestFirst(shuffle(r, witnessesOf(theftI, [cu]))); return wits[0] || null; }; // quien estaba en el lugar del robo (genTruth lo garantiza)
    const entOf = (wit) => tl.filter((e) => e.who === wit && e.place === wp && overlap(e.t, e.until, tl[theftI].t, tl[theftI].until))[0];
    const B = {
      rastro() { // objeto en el lugar del robo que señala al culpable
        const t = pick(r, T.trace), v = Object.assign({ who: name[cu] }, base, place(wp));
        const id = add({ id: 'rastro', title: fill(t.title, v), kind: t.kind, text: fill(t.text, v), role: 'prueba', points: { [cu]: 5 }, source: prop(wp), derivedFrom: theftI });
        viaTheft.push(id); return id;
      },
      testigo() { // alguien lo vio en el lugar del robo
        const wit = theftWit(); if (!wit) return null;
        const ent = entOf(wit), tp = ent && ent.until <= w.from ? T.seenBefore : T.seenAfter, v = Object.assign({ who: name[cu], wit: name[wit] }, base, place(wp));
        const id = add({ id: 'testigo_' + wit, title: fill(tp.title, v), kind: 'testimonio', text: fill(tp.text, v), role: 'prueba', points: { [cu]: 4 }, source: npc(wit, cu, 'visto'), derivedFrom: theftI });
        viaTheft.push(id); return id;
      },
      desliz() { // confesión indirecta: el testigo oyó al culpable decir dónde acabaría el botín
        const wit = theftWit(); if (!wit) return null;
        const t = pick(r, T.desliz), v = Object.assign({ who: name[cu], wit: name[wit], where: D.hideAt[Z] }, base);
        const id = add({ id: 'desliz_' + wit, title: fill(t.title, v), kind: 'testimonio', text: fill(t.text, v), role: 'prueba', points: { [cu]: 5 }, source: npc(wit, cu, 'desliz'), derivedFrom: theftI });
        viaTheft.push(id); return id;
      },
      ausente() { // testigos cruzados: quien estaba donde el culpable dice haber estado no lo vio
        const ac = b.alibis[cu].claim, all = inn.filter((x) => !liar(x) && tl.some((e) => e.who === x && e.place === ac.place && e.t <= w.from && e.until >= w.to));
        const wl = honestFirst(shuffle(r, all.filter((x) => decoyIdx[x] === undefined)));
        if (!wl.length) return null;
        const t = pick(r, T.ausente), v = Object.assign({ who: name[cu], wit: name[wl[0]], desde: G.minToStr(w.from), hasta: G.minToStr(w.to) }, place(ac.place));
        const id = add({ id: 'ausente_' + wl[0], title: fill(t.title, v), kind: 'testimonio', text: fill(t.text, v), role: 'prueba', points: { [cu]: 4 }, source: npc(wl[0], cu, 'ausente'), derivedFrom: theftI });
        viaTheft.push(id); return id;
      },
      escondite() { // el escondite del botín
        const t = pick(r, T.hide), v = Object.assign({ who: name[cu], where: D.hideAt[Z] }, base, place(Z));
        return add({ id: 'escondite', title: fill(t.title, v), kind: t.kind, text: fill(t.text, v), role: 'prueba', points: { [cu]: 4 }, source: prop(Z), derivedFrom: hideI });
      },
      imposible() { // en el escondite aparece algo que solo se guarda en el lugar del robo
        const item = pick(r, D.impossible[wp]), t = pick(r, T.imposible), v = Object.assign({ who: name[cu], where: D.hideAt[Z], item, Item: cap(item), wloc: pl(wp).loc });
        return add({ id: 'imposible', title: fill(t.title, v), kind: t.kind, text: fill(t.text, v), role: 'prueba', points: { [cu]: 5 }, source: prop(Z), derivedFrom: hideI });
      },
      metodo() { // cómo sacó el botín
        const mt = T.method[tr.method.id], mp = anyPlace(null);
        methodId = add({ id: 'metodo_' + tr.method.id, title: mt.title, kind: mp ? mt.kind : 'testimonio', text: fill(mt.text, vm), role: 'prueba', points: { [cu]: 4 }, source: mp ? prop(mp) : npc(inn[0], cu, 'metodo'), derivedFrom: theftI });
        return methodId;
      },
    };
    G.CAPTURE_FORMS[form].proof.forEach((k) => { const id = B[k](); if (id) proof.push(id); });
    // ---- el móvil: pista que lo demuestra (prueba contra el culpable, pero no cuenta en `proof`: no sale de la cronología)
    const mo = T.motive[tr.motive.id], op = anyPlace(null);
    const motiveId = add({ id: 'motivo_' + tr.motive.id, title: mo.title, kind: op ? mo.kind : 'testimonio', text: fill(mo.text, vm), role: 'prueba', points: { [cu]: 3 }, source: op ? prop(op) : npc(inn[0], cu, 'motivo'), derivedFrom: null });
    tr.method.needs = methodId ? [methodId] : []; tr.motive.needs = [motiveId];
    const top = clues.reduce((a, c) => a + (c.points[cu] || 0), 0); // sospecha total contra el culpable (los engañosos deben llegar al 60 % de esto)

    // ---- mentira del culpable: la desmontan el rastro y el testigo (ambos salen de su cronología y no del propio culpable)
    const lies = [], said = (a) => fill(T.said, Object.assign({ desde: G.minToStr(a.claim.from), hasta: G.minToStr(a.claim.to) }, place(a.claim.place)));
    let culRefs = viaTheft.slice(0, 2);
    if (G.GEN_VERSION >= 7) { // reparto de herramientas (cp. 184, S1): la mentira del culpable también lleva una refutación por testimonio (alguien lo vio en el lugar del robo)
      const isNpc = (id) => clues.find((c) => c.id === id).source.type === 'npc';
      if (!culRefs.some(isNpc)) { const have = viaTheft.filter(isNpc)[0] || B.testigo(); if (have) culRefs = [viaTheft[0], have]; }
    }
    lies.push({ who: cu, said: said(b.alibis[cu]), truth: fill(T.truthCulprit, Object.assign({}, base, place(wp))), refutedBy: culRefs });

    // ---- cada inocente: primero lo IMPRESCINDIBLE (descarte y, si miente, su refutación; los mentirosos van antes) y al final las pistas falsas,
    // que si no hay hueco para un objeto pasan a ser un rumor. Así nunca falta sitio para desmontar una mentira (3 lugares = 12 huecos; lo imprescindible ocupa ≤ 11).
    const decoys = [['methods', 0], ['motives', 0], ['methods', 1], ['motives', 1]], decoyNeeds = { methods: {}, motives: {} };
    const isLiar = (s) => (b.alibis[s].holds === false ? 1 : 0), prio = (s) => (isLiar(s) || decoyIdx[s] !== undefined ? 1 : 0), descPts = {};
    const rastroInfo = []; // c4-3 3/4-b (4): rastros de mentirosos que podrían entregarse como charla grabada (solo v7 con el interruptor)
    const descInfo = []; // c4-2c GRAB-4: datos de cada descarte para poder cambiarle el tipo después (solo v7)
    inn.map((s, k) => ({ s, k })).sort((x, y) => prio(y.s) - prio(x.s) || x.k - y.k).forEach(({ s }) => {
      const ei = tl.map((e, i) => (e.who === s && e.place !== wp && overlap(e.t, e.until, w.from, w.to) ? i : -1)).filter((i) => i >= 0)[0], e = tl[ei];
      const al = b.alibis[s], doing = lc(e.doing);
      const wl = honestFirst(shuffle(r, witnessesOf(ei, [cu, s]))), wit = wl.length && !liar(wl[0]) ? wl[0] : null, wLiar = wl[0] || null; // solo se usa un testigo mentiroso si no hay otra salida
      const kinds = shuffle(r, wit ? ['grabación', 'documento', 'testimonio'] : ['grabación', 'documento']);
      let kind = kinds[0], src;
      if (G.GEN_VERSION >= 7 && wit && isLiar(s)) kind = 'testimonio'; // reparto de herramientas (cp. 184, S1): la mentira lleva SIEMPRE una refutación por testimonio de personaje (camino libre sin gastar una pista de objeto)
      if (kind === 'testimonio') src = npc(wit, s, 'visto');
      else { const pp = anyPlace(e.place); if (pp) src = prop(pp); else if (wit || wLiar) { kind = 'testimonio'; src = npc(wit || wLiar, s, 'visto'); } }
      let clearId = null;
      if (src) {
        const cw = kind === 'testimonio' ? (src.npc) : wit, tp = T.clear[kind], v = Object.assign({ who: name[s], wit: cw ? name[cw] : '', doing }, base, place(e.place));
        clearId = add({ id: 'descarte_' + s, title: fill(tp.title, v), kind, text: fill(tp.text, v), role: 'descarte', points: { [s]: -(descPts[s] = 2 + rnd(r, 2)) }, source: src, derivedFrom: ei });
        al.clearedBy = clearId;
        descInfo.push({ clearId, kind, src, v, liar: isLiar(s), place: e.place, s });
      }
      if (isLiar(s)) {
        const refs = clearId ? [clearId] : [], tpp = anyPlace(e.place), tp = pick(r, tpp === e.place ? T.traces : T.tracesLoose), v = Object.assign({ who: name[s], doing }, place(e.place));
        if (tpp) refs.push(add({ id: 'rastro_' + s, title: fill(tp.title, v), kind: tp.kind, text: fill(tp.text, v), role: 'refuta', points: {}, source: prop(tpp), derivedFrom: ei }));
        if (tpp && tpp === e.place) rastroInfo.push({ id: 'rastro_' + s, clearId, v: Object.assign({ time: base.time }, v) }); // c4-3 3/4-b (4): candidatos a refutación en charla (rastro en la sala donde de verdad estaba; con `tracesLoose` la plantilla de la charla no tendría lugar)
        lies.push({ who: s, said: said(al), truth: fill(T.truthLiar, Object.assign({ doing }, place(e.place))), refutedBy: refs });
      }
    });
    // ---- c4-2c GRAB-4 (GEN_VERSION >= 7): TODO caso lleva al menos una pista de sostén tipo «grabación» de objeto (la charla grabada de Lali la entrega en compile.js). Si el sorteo de tipos no dejó ninguna,
    // se cambia el tipo de UN descarte de objeto «documento» a «grabación» (primero el de un inocente que no miente; luego el de un mentiroso). Solo cambian el tipo y el texto; ids, puntos, fuente y derivación quedan igual.
    // Azar PROPIO (seed ^ 0x6a4b4): no consume `r`, así que nada de lo demás se mueve. En v6 no se ejecuta (casos idénticos).
    if (G.GEN_VERSION >= 7 && !clues.some((q) => q.kind === 'grabación' && q.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(q.role) >= 0)) {
      const rg = G.rng(((b.seed >>> 0) ^ 0x6a4b4) >>> 0);
      const cand = shuffle(rg, descInfo.filter((d) => d.kind === 'documento' && d.src && d.src.type === 'prop')).sort((x, y) => (x.liar ? 1 : 0) - (y.liar ? 1 : 0));
      if (cand.length) { const d = cand[0], cl = clues.find((q) => q.id === d.clearId), tg = T.clear['grabación']; cl.kind = 'grabación'; cl.title = fill(tg.title, d.v); cl.text = fill(tg.text, d.v); }
      else { // 2.º recurso: todos los descartes son testimonio (mentirosos con testigo): el de un inocente que NO miente pasa a grabación de objeto (sala del descarte si hay hueco; si no, otra con hueco)
        const t2 = shuffle(rg, descInfo.filter((d) => d.kind === 'testimonio' && !d.liar && d.src && d.src.type === 'npc'));
        const pp = t2.length ? (room(t2[0].place) ? t2[0].place : shuffle(rg, b.places.map((q) => q.id)).filter(room)[0]) : null;
        if (t2.length && pp) {
          const d = t2[0], cl = clues.find((q) => q.id === d.clearId), tg = T.clear['grabación'];
          delete topics[d.src.npc + '|' + d.src.topic];
          cl.kind = 'grabación'; cl.source = prop(pp); cl.title = fill(tg.title, d.v); cl.text = fill(tg.text, d.v);
        }
      }
    }
    const decoyClues = (s, di) => { // engañoso: parece el culpable perfecto (móvil + método + presencia). Los puntos suben hasta el 60 % del culpable DESPUÉS de restar su descarte
      const need = Math.ceil(G.DECOY_RATIO * top) + (descPts[s] || 3) + 1, p1 = Math.ceil(need / 3), p2 = Math.ceil((need - p1) / 2), p3 = need - p1 - p2;
      const parts = [{ id: 'falsa_' + s, kd: 'motives', pts: p1 }, { id: 'falsa_' + s + '_metodo', kd: 'methods', pts: p2 }, { id: 'falsa_' + s + '_presencia', kd: null, pts: p3 }];
      parts.forEach((pt, j) => {
        const fp = anyPlace(null), idx = pt.kd ? di % tr.decoys[pt.kd].length : 0;
        if (fp) {
          const v = Object.assign({ who: name[s] }, base, place(fp)), tpl = pt.kd ? T[pt.kd === 'methods' ? 'method' : 'motive'][tr.decoys[pt.kd][idx].id] : pick(r, T.falsa);
          add({ id: pt.id, title: fill(tpl.title, v), kind: tpl.kind, text: fill(tpl.text, v), role: 'falsa', points: { [s]: pt.pts }, source: prop(fp), derivedFrom: null });
          if (pt.kd) (decoyNeeds[pt.kd][idx] = decoyNeeds[pt.kd][idx] || []).push(pt.id);
        } else {
          const rw = shuffle(r, b.cast.map((c) => c.id).filter((x) => x !== s))[0], v = Object.assign({ who: name[s], wit: name[rw] }, base);
          add({ id: pt.id, title: 'Rumor sobre ' + name[s], kind: 'testimonio', text: fill(pick(r, T.decoyRumor), v), role: 'falsa', points: { [s]: pt.pts }, source: npc(rw, s, 'rumor'), derivedFrom: null });
        }
      });
    };
    inn.forEach((s, k) => {
      if (decoyIdx[s] !== undefined) return decoyClues(s, decoyIdx[s]);
      // pista falsa (2-3 puntos): con el señuelo que le toca si hay hueco para un objeto; si no, un rumor
      const dec = decoys[k % decoys.length], dt = T[dec[0] === 'methods' ? 'method' : 'motive'][tr.decoys[dec[0]][dec[1]].id], fp = anyPlace(null), pts = { [s]: 2 + rnd(r, 2) };
      if (fp) {
        const v = Object.assign({ who: name[s] }, base, place(fp));
        const id = add({ id: 'falsa_' + s, title: fill(dt.title, v), kind: dt.kind, text: fill(dt.text, v), role: 'falsa', points: pts, source: prop(fp), derivedFrom: null });
        (decoyNeeds[dec[0]][dec[1]] = decoyNeeds[dec[0]][dec[1]] || []).push(id);
      } else {
        const rw = shuffle(r, b.cast.map((c) => c.id).filter((x) => x !== s))[0], v = Object.assign({ who: name[s], wit: name[rw] }, base);
        add({ id: 'falsa_' + s, title: 'Rumor sobre ' + name[s], kind: 'testimonio', text: fill(T.rumor, v), role: 'falsa', points: pts, source: npc(rw, s, 'rumor'), derivedFrom: null });
      }
    });
    Object.keys(decoyNeeds).forEach((kd) => Object.keys(decoyNeeds[kd]).forEach((i) => { tr.decoys[kd][i].needs = decoyNeeds[kd][i]; }));
    b.clues = clues; b.lies = lies; b.proof = proof;

    // ---- c4-3 3/4-b (4) (GEN_VERSION >= 7, interruptor `herr2.charlaSenuelos`, APAGADO hasta 4/4): REFUTACIÓN REAL EN CHARLA (decisión B del usuario, cp. 241). El rastro de un inocente que miente pasa de objeto (física/documento) a «grabación»
    // con la plantilla `tracesGrab` (mismo título que el descarte «Foto de la cámara»): `compile.js` la entrega como charla grabada de tono SOSPECHOSO sobre ese inocente, igual que la charla señuelo, así «charla sospechosa» no delata la pista falsa.
    // Cifra por nivel con mínimo, máximo y pesos en datos (`herr2.refGrab`, igual que `senuelos[nivel].charla` para que ambas salgan en proporción). Como mucho UNA por caso. Solo cambian tipo, título y texto: id, rol, fuente, `refutedBy` y puntos quedan IGUAL.
    // Candidato: rastro en la sala donde de verdad estaba (con `tracesLoose` no hay lugar que decir) y cuyo descarte NO es otra grabación (si no, saldrían dos «Fotos de la cámara» casi idénticas). Se ejecuta ANTES del señuelo (que evita las salas con grabación real).
    // Azar PROPIO (seed ^ 0xc43c45): no consume `r`. Con el interruptor apagado (o en v6) no se ejecuta: casos idénticos. Sin candidato, el caso sigue como siempre (rastro de objeto).
    const RG = G.GEN_VERSION >= 7 && D.compile && D.compile.mech && D.compile.mech.herr2;
    if (RG && RG.charlaSenuelos && RG.refGrab && b.level && RG.refGrab[b.level] && rastroInfo.length) {
      const gr = G.rng(((b.seed >>> 0) ^ 0xc43c45) >>> 0), tbl = RG.refGrab[b.level], tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = gr() * tot, n = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { n = tbl[i][0]; break; } }
      const cand = shuffle(gr, rastroInfo.filter((q) => { const d = clues.find((x) => x.id === q.clearId); return !!d && d.kind !== 'grabación' && clues.some((x) => x.id === q.id && x.kind !== 'grabación'); }));
      if (n >= 1 && cand.length) { const q = cand[0], cl = clues.find((x) => x.id === q.id), tg = pick(gr, T.tracesGrab); cl.kind = tg.kind; cl.title = fill(tg.title, q.v); cl.text = fill(tg.text, q.v); }
    }

    // ---- c4-3 3/4-a (GEN_VERSION >= 7, cp. 242): CHARLA SEÑUELO, parte 1 (interruptor `herr2.charlaSenuelos`, APAGADO hasta 4/4). Una pista FALSA de objeto pasa a tipo «grabación» (mismo icono que las reales; título, texto, puntos, fuente y `needs` quedan IGUAL).
    // `compile.js` (3/4-b) la entregará como charla grabada; aquí solo se elige y se cambia el tipo. Una por caso como máximo (`herr2.senuelos[nivel].charla` = [[0|1, peso]], mín., máx. y pesos en datos). Candidata: falsa de objeto (no rumor) cuya sala NO tiene ya una grabación de sostén (la charla real de esa sala ocuparía el rincón).
    // Azar PROPIO (seed ^ 0xc43c43): no consume `r`, así que nada de lo demás se mueve. Con el interruptor apagado (o en v6) no se ejecuta: casos idénticos. Si no hay candidata, no hay señuelo en ese caso.
    const CS = G.GEN_VERSION >= 7 && D.compile && D.compile.mech && D.compile.mech.herr2;
    if (CS && CS.charlaSenuelos && CS.senuelos && b.level && CS.senuelos[b.level] && CS.senuelos[b.level].charla) {
      const cr = G.rng(((b.seed >>> 0) ^ 0xc43c43) >>> 0), tbl = CS.senuelos[b.level].charla, tot = tbl.reduce((x, e) => x + e[1], 0);
      let k = cr() * tot, n = tbl[tbl.length - 1][0]; for (let i = 0; i < tbl.length; i++) { k -= tbl[i][1]; if (k < 0) { n = tbl[i][0]; break; } }
      const realRoom = {}; clues.forEach((q) => { if (q.kind === 'grabación' && q.source.type === 'prop' && ['prueba', 'descarte', 'refuta'].indexOf(q.role) >= 0) realRoom[q.source.place] = true; });
      const cand = shuffle(cr, clues.filter((q) => q.role === 'falsa' && q.source.type === 'prop' && q.kind !== 'grabación' && !realRoom[q.source.place]));
      if (n >= 1 && cand.length) { cand[0].kindAntes = cand[0].kind; cand[0].kind = 'grabación'; } // `kindAntes`: si compile.js no puede montar la charla (sin rincón o sin pareja libre), la pista vuelve a su tipo de antes
    }

    // ---- 4C-4c-1: MATIZ. Solo en inquietante y macabro; solo pistas de OBJETO con rol prueba, falsa o refuta (los descartes y los testimonios no cambian: el humor del descarte y la voz de cada
    // personaje se quedan como están). Solo se AÑADE texto al final: puntos, fuente, rol y derivación son idénticos en los tres ambientes. Azar propio (seed ^ 0x4c4c1).
    if (mood && G.MOODS.indexOf(mood) >= 0) {
      b.mood = mood;
      const want = G.MATIZ_COUNT[mood];
      if (want > 0) {
        const rm = G.rng(((b.seed >>> 0) ^ 0x4c4c1) >>> 0), KEY = { 'física': 'fisica', 'documento': 'documento', 'grabación': 'grabacion' };
        const used = {}, elig = shuffle(rm, clues.filter((c) => c.source.type === 'prop' && ['prueba', 'falsa', 'refuta'].indexOf(c.role) >= 0 && KEY[c.kind]));
        b.matiz = [];
        elig.slice(0, want).forEach((c) => {
          const bank = T.matiz[mood][KEY[c.kind]].filter((pr) => !used[pr[0]]), pr = pick(rm, bank);
          used[pr[0]] = 1; c.text = c.text + ' ' + pr[0] + ' ' + pr[1]; b.matiz.push(c.id);
        });
      }
    }

    // ---- CL-5c-b (GEN_VERSION >= 7, solo Difícil): PUZLES. 1 o 2 por caso (50/50; media 1,5): código de 4 cifras (HHMM de la llegada de un suceso) o línea de tiempo (3-4 sucesos). Diseño: docs/DISENO_PUZLES_CL5C.md.
    // Las pistas del puzle son PROPIAS (rol «ambiente»: sin puntos, fuera de proof/coartadas/mentiras) y llevan la hora real de un suceso de un INOCENTE fuera de la ventana del robo. Azar PROPIO (seed ^ 0x7a2c5c) y va DESPUÉS de todo lo demás:
    // no consume `r`, no cambia ids ni orden de las pistas anteriores. `recent` = ids del banco a evitar (memoria de «no repetir»: hoy siempre vacía). La colocación del paso `pz_N` la hace compile.js.
    if (G.GEN_VERSION >= 7 && b.level === 'dificil' && D.compile && D.compile.puzzlesV7) {
      const PZ = D.compile.puzzlesV7, pr = G.rng(((b.seed >>> 0) ^ 0x7a2c5c) >>> 0), pn = (n) => Math.floor(pr() * n), pp = (a) => a[pn(a.length)];
      const ps = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = pn(i + 1), q = x[i]; x[i] = x[j]; x[j] = q; } return x; };
      const hhmm = (m) => G.minToStr(m).replace(':', ''), mid = w.from + 5 * Math.floor((w.to - w.from) / 10);
      const apt = tl.map((e, i) => i).filter((i) => tl[i].who !== cu && tl[i].t < 1440 && (tl[i].until <= w.from || tl[i].t >= w.to) && [w.from, w.to, mid].every((m) => hhmm(tl[i].t) !== hhmm(m)));
      const usedEv = {}, usedTpl = {}, usedSprite = {}, made = [], free = (bank) => bank.filter((x) => recent.indexOf(x.id) < 0);
      const nPz = pn(2) + 1, want = nPz === 1 ? [pn(2) ? 'timeline' : 'code'] : ps(['code', 'timeline']);
      const timesOk = (i, list) => list.every((j) => Math.abs(tl[i].t - tl[j].t) >= 10 && tl[i].doing !== tl[j].doing);
      const mkClue = (idx, pid, letter) => { // una pista con la hora real del suceso `idx`: objeto en una sala con hueco o testimonio de un testigo honesto
        const e = tl[idx], wl = ps(witnessesOf(idx, [cu])).filter((x) => !liar(x) && decoyIdx[x] === undefined);
        const wit = wl[0] || null, roomId = room(e.place) ? e.place : (b.places.map((p) => p.id).filter(room)[0] || null);
        const viaNpc = wit && (!roomId || pr() < 0.4), bank = viaNpc ? PZ.clueNpc : PZ.clueObj;
        if (!viaNpc && !roomId) return null;
        const rid = viaNpc ? null : roomId, v = Object.assign({ who: name[e.who], wit: wit ? name[wit] : '', time: G.minToStr(e.t), doing: lc(e.doing), to: pl(e.place).to }, rid ? place(rid) : {});
        const tpls = ps(free(bank).filter((x) => !usedTpl[x.id]).concat(bank.filter((x) => recent.indexOf(x.id) >= 0 && !usedTpl[x.id]))), tp = tpls.filter((x) => !clues.some((c) => c.title === fill(x.title, v)))[0];
        if (!tp) return null;
        usedTpl[tp.id] = 1;
        return add({ id: pid + '_' + letter, title: fill(tp.title, v), kind: tp.kind, text: fill(tp.text, v), role: 'ambiente', points: {}, source: viaNpc ? npc(wit, e.who, 'hora') : prop(rid), derivedFrom: idx });
      };
      const undo = (ids) => ids.forEach((id) => { const k = clues.findIndex((q) => q.id === id), q = clues[k]; if (q.source.type === 'prop') count[q.source.place]--; clues.splice(k, 1); });
      want.forEach((kind0) => {
        const pid = 'pz' + (made.length + 1), pool = ps(apt.filter((i) => !usedEv[i])), other = made.reduce((a, m) => a.concat(m.events.map((x) => hhmm(tl[x.i].t))), []);
        const gather = (k, okFn) => { const got = []; pool.forEach((i) => { if (got.length < k && okFn(i, got.map((g) => g.i))) { const id = mkClue(i, pid, String.fromCharCode(97 + got.length)); if (id) got.push({ i, id }); } }); return got; }; // cada suceso solo cuenta si logra su pista (sala con hueco o testigo honesto)
        let kind = kind0, got = [];
        if (kind === 'timeline') { // 3 o 4 sucesos con horas separadas ≥ 10 min y textos distintos; el orden correcto es por hora
          got = gather(3 + pn(2), (i, ch) => timesOk(i, ch));
          if (got.length < 3) { undo(got.map((g) => g.id)); got = []; kind = 'code'; } // plaza de línea sin sitio: pasa a código
        }
        if (kind === 'code') got = gather(1, (i) => other.indexOf(hhmm(tl[i].t)) < 0);
        if (!got.length) return;
        const bankL = free(kind === 'code' ? PZ.codes : PZ.lines).filter((x) => !usedSprite[x.sprite]), entry = pp(bankL.length ? bankL : (kind === 'code' ? PZ.codes : PZ.lines));
        usedSprite[entry.sprite] = 1; got.forEach((g) => { usedEv[g.i] = 1; });
        const ord = got.slice().sort((x, y) => tl[x.i].t - tl[y.i].t); // en la línea, los sucesos van en orden cronológico
        made.push(Object.assign({ id: 'pz_' + (made.length + 1), type: kind, bank: entry.id, clues: ord.map((g) => g.id), events: ord.map((g) => ({ clue: g.id, i: g.i })) }, kind === 'code' ? { code: hhmm(tl[ord[0].i].t) } : {}));
      });
      if (made.length) b.puzzles = made;
    }
    return b;
  }

  // Devuelve { bible, attempts, ok }: la primera variante del azar que pasa G.checkBible completo (si ninguna, la última, con ok:false)
  G.genCluesInfo = function (bible, opts) {
    const mood = opts && opts.mood;
    const base = (bible.seed ^ 0x51ed) >>> 0;
    let out = null;
    for (let a = 0; a < ATTEMPTS; a++) {
      out = build(bible, G.rng((base + a * 0x9e3779b1) >>> 0), mood, (opts && opts.recentPuzzles) || []);
      if (G.checkBible(out).ok) return { bible: out, attempts: a + 1, ok: true };
    }
    return { bible: out, attempts: ATTEMPTS, ok: false };
  };
  G.genClues = (bible, opts) => G.genCluesInfo(bible, opts).bible;
})(typeof window !== 'undefined' ? window : globalThis);
