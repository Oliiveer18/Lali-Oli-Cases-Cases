// Prueba de la verdad generada (fase 3B): 3000 semillas → biblias parciales que cumplen los invariantes de verdad y son deterministas.
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js']);
let bad = 0;
const ok = (name, cond, extra) => { console.log(`${cond ? 'OK' : 'FALLA'} · ${name}`); if (!cond) { bad++; if (extra) console.log('  ', extra); } };
const N = 3000;
const TRUTH_CODES = ['formato', 'reparto', 'lugares', 'cronologia', 'ventana', 'coartada_culpable', 'coartada_inocente'];
const dist = (m, k) => { m[k] = (m[k] || 0) + 1; };
const show = (m) => Object.keys(m).sort((a, b) => m[b] - m[a]).map((k) => `${k} ${m[k]}`).join(' · ');

// 1. cada semilla pasa el comprobador en modo parcial (formato, reparto, lugares, cronología, ventana, coartadas)
const fails = [], other = [], shape = [], timelines = new Set();
const dCulp = {}, dMeth = {}, dMot = {}, dObj = {}, dPl = {}, dSus = {}, dLiars = {}, dLate = {}, dEarly = {};
for (let s = 0; s < N; s++) {
  const b = G.genTruth(s), r = G.checkBible(b, { partial: true });
  if (!r.ok) { if (fails.length < 3) fails.push(`semilla ${s}: ${JSON.stringify(r.errors.slice(0, 3))}`); continue; }
  if (r.errors.some((e) => TRUTH_CODES.indexOf(e.code) < 0)) other.push(s);
  const tr = b.truth, sus = b.cast.filter((c) => c.role === 'sospechoso'), cu = tr.culprit;
  const liars = Object.keys(b.alibis).filter((k) => !b.alibis[k].holds);
  const innLiars = liars.filter((k) => k !== cu);
  // forma de la parcial (lo que 3C espera encontrar)
  if (b.clues.length || b.lies.length || b.proof.length || tr.method.needs.length || tr.motive.needs.length
    || Object.keys(b.alibis).some((k) => b.alibis[k].clearedBy !== null)
    || tr.decoys.methods.length < 2 || tr.decoys.motives.length < 2
    || b.alibis[cu].holds !== false || innLiars.length < 1 || innLiars.length > 2
    || b.alibis[cu].claim.place === tr.window.place || b.code !== G.caseCode(s)) shape.push(s);
  timelines.add(JSON.stringify(tr.timeline));
  dist(dCulp, cu); dist(dMeth, tr.method.id); dist(dMot, tr.motive.id); dist(dObj, b.object.id);
  dist(dPl, b.places.length); dist(dSus, sus.length); dist(dLiars, liars.length);
  const lateIn = tr.timeline.some((e) => e.who === b.cast[0].id && e.place === tr.window.place && e.t >= tr.window.to);
  dist(dLate, lateIn ? 'cliente descubre' : 'descubre un sospechoso');
  dist(dEarly, tr.timeline.some((e) => e.who !== cu && e.place === tr.window.place && e.until <= tr.window.from && e.until > tr.window.from - 15 && e.witnesses.indexOf(cu) >= 0) ? 'con testigo previo' : 'sin testigo previo');
}
ok(`${N} semillas pasan G.checkBible(b, { partial:true }) (reparto, lugares, cronología, ventana, coartada del culpable y de los inocentes)`, !fails.length, fails.join('\n   '));
ok('ninguna falla por reglas que dependan de pistas', !other.length);
ok('forma de la biblia parcial: sin pistas/mentiras/pruebas, needs y clearedBy vacíos, ≥ 2 señuelos, culpable y 1-2 inocentes con holds:false', !shape.length, 'semillas: ' + shape.slice(0, 10));

// 1b. lo que 3C necesita: el robo siempre tiene a alguien que vio al culpable entrar o salir; cada inocente tiene una franja que lo sitúa fuera
let noWit = 0, noOut = 0;
for (let s = 0; s < N; s++) {
  const b = G.genTruth(s), tr = b.truth, cu = tr.culprit;
  const theft = tr.timeline.filter((e) => e.who === cu && e.place === tr.window.place)[0];
  if (!theft || !theft.witnesses.length) noWit++;
  b.cast.filter((c) => c.role === 'sospechoso' && c.id !== cu).forEach((c) => { if (!tr.timeline.some((e) => e.who === c.id && e.place !== tr.window.place && e.t <= tr.window.from && e.until >= tr.window.to)) noOut++; });
}
ok('el robo del culpable siempre tiene algún testigo (material para una prueba de testimonio)', noWit === 0, noWit + ' semillas');
ok('cada inocente tiene una sola franja fuera del lugar del robo que cubre toda la ventana (material para su descarte)', noOut === 0, noOut + ' casos');

// 2. determinismo: misma semilla ⇒ mismo JSON (y no se muta nada global)
let det = 0;
for (let s = 0; s < N; s += 7) { if (JSON.stringify(G.genTruth(s)) !== JSON.stringify(G.genTruth(s))) det++; }
ok('determinismo: dos llamadas con la misma semilla dan JSON idéntico (428 semillas)', det === 0);
ok('semillas fuera de rango o decimales no lanzan y dan biblia válida', [4294967295, 4294967296 + 5, -1, 12.7].every((s) => G.checkBible(G.genTruth(s), { partial: true }).ok));

// 2b. 4A: nivel, forma de captura y sospechosos engañosos (los decide genTruth; los comprueba además G.checkBible)
{
  const dForm = {}, dDec = {}, dLv = {}, rot = [];
  for (let s = 0; s < N; s++) {
    const b = G.genTruth(s), sus = b.cast.filter((c) => c.role === 'sospechoso'), cu = b.truth.culprit, dec = b.deceptive || [];
    const rg = G.DECOY_RANGE[b.level], md = G.maxDecoys(sus.length), lo = rg ? Math.min(rg[0], md) : -1, hi = rg ? Math.min(rg[1], md) : -1;
    const who = dec.map((d) => d.who);
    if (!G.CAPTURE_FORMS[b.captureForm] || G.LEVELS.indexOf(b.level) < 0 || dec.length < lo || dec.length > hi
      || who.some((w) => w === cu || !sus.some((c) => c.id === w)) || new Set(who).size !== who.length || dec.some((d) => !d.why || typeof d.why !== 'string')) { if (rot.length < 5) rot.push(s); continue; }
    dist(dForm, b.captureForm); dist(dDec, dec.length); dist(dLv, b.level);
  }
  const share = (m) => Math.max.apply(null, Object.keys(m).map((k) => m[k])) / N;
  ok('4A: cada semilla trae forma de captura válida, nivel válido y 0-3 engañosos inocentes y únicos (con su explicación), dentro del rango del nivel', !rot.length, 'semillas: ' + rot);
  ok(`4A: ${Object.keys(dForm).length} formas de captura y ninguna supera el 40 % (${show(dForm)})`, Object.keys(dForm).length === Object.keys(G.CAPTURE_FORMS).length && Object.keys(dForm).length >= 4 && share(dForm) <= 0.4);
  ok(`4A: aparecen los recuentos de engañosos 0, 1, 2 y 3 y ninguno supera el 40 % (${show(dDec)})`, [0, 1, 2, 3].every((n) => dDec[n] > 0) && share(dDec) <= 0.4);
  ok(`4A: aparecen los tres niveles (${show(dLv)})`, G.LEVELS.every((l) => dLv[l] > 200));
  let forced = true, fwhere = '';
  for (let s = 0; s < 120; s++) {
    G.LEVELS.forEach((l) => {
      const b = G.genTruth(s, { level: l }), sus = b.cast.filter((c) => c.role === 'sospechoso').length, rg = G.DECOY_RANGE[l], md = G.maxDecoys(sus);
      if (b.level !== l || b.deceptive.length < Math.min(rg[0], md) || b.deceptive.length > Math.min(rg[1], md)) { forced = false; fwhere = 'level ' + l + ' semilla ' + s; }
    });
    Object.keys(G.CAPTURE_FORMS).forEach((f) => { const got = G.genTruth(s, { form: f }).captureForm; if (got !== f && !(f === 'testigos_cruzados' && got === 'clasica')) { forced = false; fwhere = 'form ' + f + ' semilla ' + s; } }); // testigos_cruzados pasa a clasica si no hay testigo válido (regla de gen_truth.js)
  }
  ok('4A: las opciones { level } y { form } de genTruth fuerzan el nivel (con su rango de engañosos) y la forma (única excepción: testigos_cruzados sin testigo válido pasa a clasica)', forced, fwhere);
  ok('4A: sin opciones, el nivel y la forma salen solo de la semilla (determinista)', G.genTruth(77).level === G.genTruth(77).level && G.genTruth(77).captureForm === G.genTruth(77).captureForm);
}

// 3. variedad
const cul = Object.keys(dCulp), minC = Math.min.apply(null, cul.map((k) => dCulp[k]));
ok(`el culpable varía (${cul.length} personajes distintos, el menos frecuente sale ${minC} veces)`, cul.length >= 12 && minC > 50);
ok(`los métodos y móviles varían (${Object.keys(dMeth).length} métodos, ${Object.keys(dMot).length} móviles)`, Object.keys(dMeth).length === G.GEN_DATA.methods.length && Object.keys(dMot).length === G.GEN_DATA.motives.length);
ok(`los objetos y lugares varían (${Object.keys(dObj).length} objetos; 3, 4 y 5 lugares)`, Object.keys(dObj).length === G.GEN_DATA.objects.length && dPl[3] > 300 && dPl[4] > 300 && dPl[5] > 300);
ok(`las cronologías son distintas (${timelines.size} distintas de ${N})`, timelines.size > N * 0.99);

console.log('\nDistribución en ' + N + ' semillas');
console.log('  culpable : ' + show(dCulp));
console.log('  método   : ' + show(dMeth));
console.log('  móvil    : ' + show(dMot));
console.log('  objeto   : ' + show(dObj));
console.log('  lugares  : ' + show(dPl) + '  |  sospechosos: ' + show(dSus));
console.log('  mienten  : ' + show(dLiars) + ' (culpable + inocentes)  |  ' + show(dLate) + '  |  ' + show(dEarly));
console.log(bad ? `\n${bad} comprobación(es) fallaron` : '\nTodo en orden');
process.exit(bad ? 1 : 0);
