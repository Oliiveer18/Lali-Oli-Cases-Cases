// caso_libre_cl1.js — CL-1 del paquete CL (25 oct): diagnóstico de SOLO MEDIR para «Acusar por razones» (docs/CASO_LIBRE_Y_ACUSACION.md §5 y §7). No cambia el juego.
// Uso: GENV=7 node tools/caso_libre_cl1.js [N=200] [paso=7919]   (semilla = i*paso+1; N casos POR NIVEL con el nivel forzado: opts.level)
// Mide por nivel: (1) `needs` de método y motivo (rellenos, alcanzables con la partida del bot); (2) nº de pistas por razón; (3) P13: casos SIN pista que señale
// al culpable (sus[culpable] > 0); (4) EN QUÉ minuto de la partida del bot se tendrían las razones del nivel (Fácil: culpable · Normal: culpable y motivo ·
// Difícil: culpable, motivo y método), es decir, cuándo se PODRÍA acusar, comparado con el minuto en que se abre el capítulo 3 y con el final.
// Minutos = minutos HUMANOS del bot (segundos del bot × humanFactor / 60, como bot_masa). El instante de cada pista se lee de una copia en memoria de bot.js que
// solo EXPONE `t` (st.__bt); no se cambia ningún comportamiento ni se toca src/.
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'bot.js', 'quality.js'], (f, text) => {
  if (f !== 'bot.js') return text;
  const a = 'let t = 0, walk = 0, read = 0, work = 0, actions = 0, lastTool = null, fallbacks = 0, stealthWait = 0;';
  if (text.indexOf(a) < 0) throw new Error('caso_libre_cl1: bot.js ya no encaja con el parche de lectura de t');
  return text.replace(a, a + ' st.__bt = () => t;');
});
if (process.env.GENV) G.GEN_VERSION = +process.env.GENV;
const N = +process.argv[2] || 200, STEP = +process.argv[3] || 7919;
const LV = ['facil', 'normal', 'dificil'], HF = G.BOT_CFG.humanFactor;
const min = (s) => Math.round((s * HF) / 6) / 10;   // segundos del bot → minutos humanos (1 decimal)
// --- ganchos de solo lectura sobre el estado del bot (solo el que lleva __bt)
let REC = null;
const CS = G.CaseState.prototype, oAdd = CS.addClue, oTalk = CS.startTalk, oAdv = CS.checkAdvance;
CS.addClue = function (id, via) { const ok = oAdd.call(this, id, via); if (ok && REC && this.__bt && REC.clue[id] === undefined) REC.clue[id] = this.__bt(); return ok; };
CS.startTalk = function (id) { const r = oTalk.apply(this, arguments); if (REC && this.__bt && REC.talk[id] === undefined && this.npc[id] && this.npc[id].talks > 0) REC.talk[id] = this.__bt(); return r; };
CS.checkAdvance = function () { const r = oAdv.call(this); if (r && REC && this.__bt && REC.chap[this.chapter] === undefined) REC.chap[this.chapter] = this.__bt(); return r; };
const stat = () => ({ v: [] });
const put = (s, v) => { if (v !== null && v !== undefined && !Number.isNaN(v)) s.v.push(v); };
const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const fx = (x, d = 1) => (x === null || x === undefined ? '-' : (+x).toFixed(d));
const sm = (a, d = 1) => (a.length ? `media ${fx(avg(a), d)} · mín ${fx(Math.min(...a), d)} · p10 ${fx(q(a, 0.1), d)} · mediana ${fx(q(a, 0.5), d)} · p90 ${fx(q(a, 0.9), d)} · máx ${fx(Math.max(...a), d)}` : 'sin datos');
const A = {};
LV.forEach((l) => { A[l] = { gen: 0, err: 0, bot: 0, stuck: 0, noWin: 0,
  mNeeds: stat(), oNeeds: stat(), mFilled: 0, oFilled: 0, mReach: 0, oReach: 0, mExist: 0, oExist: 0, mNpc: 0, mProp: 0, oNpc: 0, oProp: 0, needsSolape: 0,
  decN: 0, decFilled: 0, decNeedsSz: stat(), decReach: 0,
  ptsCulp: stat(), ptsCulpProof: stat(), sinPtsCulp: 0, sinPtsCulpRole: 0, soloNoPrueba: 0, culpAny: stat(), sinAny: 0, ptsReach: 0, ptsFuerte: stat(), clueTot: stat(), proofN: stat(),
  roles: { prueba: stat(), descarte: stat(), falsa: stat(), refuta: stat(), ambiente: stat() },
  tTalk: stat(), tPts2: stat(), tPts3: stat(), tCulpHoy: stat(), tCulpP13: stat(), tMotivo: stat(), tMetodo: stat(), tFacil: stat(), tNormal: stat(), tDificil: stat(), tCh2: stat(), tCh3: stat(), tFin: stat(),
  fFacil: stat(), fNormal: stat(), fDificil: stat(), gapFacil: stat(), gapNormal: stat(), gapDificil: stat(), antes3: { facil: 0, normal: 0, dificil: 0 }, sinT: { facil: 0, normal: 0, dificil: 0 }, hoyMasTemprano: 0, ejemplos: [] }; });
LV.forEach((lv) => {
  const a = A[lv];
  for (let i = 1; i <= N; i++) {
    const seed = i * STEP + 1;
    const r = G.generateCase(seed, { register: true, level: lv });
    if (!r || r.error || !r.def) { a.err++; continue; }
    a.gen++;
    const def = r.def, bib = r.bible, sol = def.solution, cul = sol.culprit;
    REC = { clue: {}, talk: {}, chap: {} };
    const b = G.botPlay(JSON.parse(JSON.stringify(def)));
    const rec = REC; REC = null;
    if (b.stuck) { a.stuck++; continue; }
    if (!(b.ok && b.win)) { a.noWin++; continue; }
    a.bot++;
    const byId = {}; (bib.clues || []).forEach((c) => { byId[c.id] = c; });
    const held = (id) => rec.clue[id] !== undefined;
    // (1) needs de la opción verdadera
    const mo = sol.methods.find((o) => o.id === sol.method), to = sol.motives.find((o) => o.id === sol.motive);
    const mN = (mo && mo.needs) || [], oN = (to && to.needs) || [];
    put(a.mNeeds, mN.length); put(a.oNeeds, oN.length);
    if (mN.length) a.mFilled++; if (oN.length) a.oFilled++;
    if (mN.length && mN.every((c) => def.clues[c])) a.mExist++; if (oN.length && oN.every((c) => def.clues[c])) a.oExist++;
    if (mN.length && mN.every(held)) a.mReach++; if (oN.length && oN.every(held)) a.oReach++;
    mN.forEach((c) => { const s = byId[c] && byId[c].source.type; if (s === 'npc') a.mNpc++; else a.mProp++; }); oN.forEach((c) => { const s = byId[c] && byId[c].source.type; if (s === 'npc') a.oNpc++; else a.oProp++; });
    if (mN.some((c) => oN.indexOf(c) >= 0)) a.needsSolape++;
    // señuelos (opciones falsas): ¿llevan needs? ¿alcanzables?
    sol.methods.concat(sol.motives).forEach((o) => { if (o.id === sol.method || o.id === sol.motive) return; a.decN++; if (o.needs && o.needs.length) { a.decFilled++; put(a.decNeedsSz, o.needs.length); if (o.needs.every(held)) a.decReach++; } });
    // (2)+(3) pistas por razón y pista que señala al culpable
    const ids = Object.keys(def.clues);
    const pts = ids.filter((c) => def.clues[c].sus && def.clues[c].sus[cul] > 0);
    const any = ids.filter((c) => def.clues[c].sus && def.clues[c].sus[cul]);
    put(a.clueTot, ids.length); put(a.proofN, sol.proof.length); put(a.ptsCulp, pts.length); put(a.culpAny, any.length);
    put(a.ptsCulpProof, pts.filter((c) => sol.proof.indexOf(c) >= 0).length);
    pts.forEach((c) => put(a.ptsFuerte, def.clues[c].sus[cul]));
    if (!pts.length) a.sinPtsCulp++;
    if (!any.length) a.sinAny++;
    if (pts.length && pts.every((c) => !byId[c] || byId[c].role !== 'prueba')) a.soloNoPrueba++;
    if (pts.length && pts.some(held)) a.ptsReach++;
    Object.keys(a.roles).forEach((k) => put(a.roles[k], (bib.clues || []).filter((c) => c.role === k).length));
    // (4) cuándo se podría acusar (minutos humanos)
    const tmax = (arr) => (arr.length && arr.every(held) ? Math.max(...arr.map((c) => rec.clue[c])) : null);
    const tPts = pts.filter(held).length ? Math.min(...pts.filter(held).map((c) => rec.clue[c])) : null;
    const hp = pts.filter(held).map((c) => rec.clue[c]).sort((x, y) => x - y);   // instantes de las pistas que señalan al culpable, de menor a mayor
    put(a.tPts2, hp.length >= 2 ? min(hp[1]) : null); put(a.tPts3, hp.length >= 3 ? min(hp[2]) : null);
    const tAny = any.filter(held).length ? Math.min(...any.filter(held).map((c) => rec.clue[c])) : null;
    const tTalk = rec.talk[cul] !== undefined ? rec.talk[cul] : null;
    const tHoy = [tTalk, tAny].filter((x) => x !== null).length ? Math.min(...[tTalk, tAny].filter((x) => x !== null)) : null;
    const tMo = tmax(oN), tMe = tmax(mN);
    const tot = b.botSeconds;
    const c2 = rec.chap[2] !== undefined ? rec.chap[2] : null, c3 = rec.chap[3] !== undefined ? rec.chap[3] : null;
    put(a.tTalk, tTalk === null ? null : min(tTalk)); put(a.tCulpHoy, tHoy === null ? null : min(tHoy)); put(a.tCulpP13, tPts === null ? null : min(tPts));
    put(a.tMotivo, tMo === null ? null : min(tMo)); put(a.tMetodo, tMe === null ? null : min(tMe));
    put(a.tCh2, c2 === null ? null : min(c2)); put(a.tCh3, c3 === null ? null : min(c3)); put(a.tFin, min(tot));
    if (tHoy !== null && tPts !== null && tHoy < tPts) a.hoyMasTemprano++;
    const req = { facil: [tPts], normal: [tPts, tMo], dificil: [tPts, tMo, tMe] };
    const key = { facil: 'Facil', normal: 'Normal', dificil: 'Dificil' };
    Object.keys(req).forEach((nv) => {
      const xs = req[nv];
      if (xs.some((x) => x === null)) { a.sinT[nv]++; return; }
      const T = Math.max(...xs);
      put(a['t' + key[nv]], min(T)); put(a['f' + key[nv]], Math.round((100 * T) / tot));
      if (c3 !== null) { put(a['gap' + key[nv]], min(c3 - T)); if (T < c3) a.antes3[nv]++; }
    });
    if (a.ejemplos.length < 3 && (!pts.length || tPts === null)) a.ejemplos.push(seed);
  }
});
const out = []; const pr = (x) => { out.push(x); console.log(x); };
pr(`=== CL-1 · caso libre · ${N} semillas POR NIVEL (i*${STEP}+1, nivel forzado) · GEN_VERSION ${G.GEN_VERSION} · minutos humanos (×${HF}) ===`);
const pc = (n, d) => `${n} de ${d} (${d ? Math.round((100 * n) / d) : 0} %)`;
LV.forEach((lv) => {
  const a = A[lv], B = a.bot;
  pr(`\n##### ${lv.toUpperCase()} · generados ${a.gen} (errores ${a.err}) · partidas del bot ganadas ${B} (atascos ${a.stuck}, sin ganar ${a.noWin})`);
  pr('[1] NEEDS de la opción VERDADERA (en la biblia final, tras el generador completo)');
  pr(`  método : relleno ${pc(a.mFilled, B)} · pistas existen ${pc(a.mExist, B)} · TODAS alcanzadas por el bot ${pc(a.mReach, B)} · nº de pistas ${sm(a.mNeeds.v, 2)} · origen objeto ${a.mProp} / testimonio ${a.mNpc}`);
  pr(`  motivo : relleno ${pc(a.oFilled, B)} · pistas existen ${pc(a.oExist, B)} · TODAS alcanzadas por el bot ${pc(a.oReach, B)} · nº de pistas ${sm(a.oNeeds.v, 2)} · origen objeto ${a.oProp} / testimonio ${a.oNpc}`);
  pr(`  método y motivo comparten alguna pista en ${pc(a.needsSolape, B)} casos`);
  pr(`  opciones FALSAS (señuelos) de método y motivo: ${a.decN} · con needs ${pc(a.decFilled, a.decN)} · de ellas alcanzadas ${pc(a.decReach, a.decFilled)} · nº de pistas ${sm(a.decNeedsSz.v, 2)}`);
  pr('[2] PISTAS POR RAZÓN (por caso)');
  pr(`  pistas totales ${sm(a.clueTot.v)} · «clave» (proof) ${sm(a.proofN.v, 2)}`);
  pr(`  que SEÑALAN al culpable (sus[culpable] > 0): ${sm(a.ptsCulp.v, 2)} · de ellas «clave»: media ${fx(avg(a.ptsCulpProof.v), 2)} · puntos de la pista: media ${fx(avg(a.ptsFuerte.v), 2)}`);
  pr(`  que lo señalan o lo descartan (lo que hoy abre el candado): ${sm(a.culpAny.v, 2)}`);
  pr(`  método: ${sm(a.mNeeds.v, 2)} · motivo: ${sm(a.oNeeds.v, 2)}`);
  pr('  por rol en la biblia: ' + Object.keys(a.roles).map((k) => `${k} ${fx(avg(a.roles[k].v), 2)}`).join(' · '));
  pr('[3] P13 · pista que señale al culpable');
  pr(`  casos SIN ninguna pista que señale al culpable: ${pc(a.sinPtsCulp, B)} · sin pista que lo señale NI descarte: ${pc(a.sinAny, B)} · con señal, pero el bot no llegó a ninguna: ${pc(B - a.sinPtsCulp - a.ptsReach, B)}`);
  pr(`  casos cuyas señales NO son de rol «prueba» (solo ambiente/otras): ${pc(a.soloNoPrueba, B)}${a.ejemplos.length ? ' · semillas de ejemplo sin señal alcanzable: ' + a.ejemplos.join(' ') : ''}`);
  pr('[4] MINUTO de la partida en que se tienen las razones (cuándo se PODRÍA acusar)');
  pr(`  hablar con el culpable por 1.ª vez: ${sm(a.tTalk.v)}`);
  pr(`  culpable HOY (hablado o pista lo señala/descarta): ${sm(a.tCulpHoy.v)} · el candado de hoy se abre ANTES que el de P13 en ${pc(a.hoyMasTemprano, B)} casos`);
  pr(`  culpable P13 (1.ª pista que lo señala): ${sm(a.tCulpP13.v)}`);
  pr(`  2.ª pista que señala al culpable: ${sm(a.tPts2.v)} · 3.ª: ${sm(a.tPts3.v)}  (por si P13 pidiera ≥ 2 ó ≥ 3 señales)`);
  pr(`  motivo (todas sus needs): ${sm(a.tMotivo.v)}`);
  pr(`  método (todas sus needs): ${sm(a.tMetodo.v)}`);
  pr(`  se abre el capítulo 2: ${sm(a.tCh2.v)} · se abre el capítulo 3 («Acusar»): ${sm(a.tCh3.v)} · FINAL de la partida del bot: ${sm(a.tFin.v)}`);
  const nm = { facil: ['Facil', 'culpable'], normal: ['Normal', 'culpable + motivo'], dificil: ['Dificil', 'culpable + motivo + método'] }[lv];
  const k = nm[0];
  pr(`  >>> NIVEL ${lv.toUpperCase()} (${nm[1]}): se PODRÍA acusar en el minuto ${sm(a['t' + k].v)}`);
  pr(`      como % de la partida: ${sm(a['f' + k].v, 0)} · minutos ANTES de que el capítulo 3 lo permita hoy: ${sm(a['gap' + k].v)} · antes del cap. 3 en ${pc(a.antes3[lv], B)} casos · sin dato (razón no alcanzada) en ${a.sinT[lv]}`);
  // para los otros dos formatos, en este mismo nivel (referencia)
  ['facil', 'normal', 'dificil'].filter((x) => x !== lv).forEach((x) => { const kk = { facil: 'Facil', normal: 'Normal', dificil: 'Dificil' }[x]; pr(`      (referencia, si este nivel pidiera lo de ${x}: minuto ${fx(avg(a['t' + kk].v))} de media, ${fx(avg(a['f' + kk].v), 0)} % de la partida)`); });
});
require('fs').writeFileSync('/tmp/caso_libre_cl1.txt', out.join('\n'));
require('fs').writeFileSync('/tmp/caso_libre_cl1.json', JSON.stringify(A));
