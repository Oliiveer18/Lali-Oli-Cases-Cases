// report.js — INFORME DE CASO en texto legible (fábrica de casos, fase 3D-2).
// G.caseReport(bible) → string en español (una página por caso). Puro y determinista: solo lee la biblia.
// Carga: require('./tools/load_g.js')(['bible.js','gen_data.js','gen_truth.js','gen_clues.js','compile.js','report.js'])
(function (root) {
  'use strict';
  const G = root.G;
  const ROLE = { prueba: 'PRUEBA', descarte: 'descarte', falsa: 'pista falsa', refuta: 'refuta mentira', ambiente: 'ambiente' };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  G.caseReport = function (b) {
    const nm = (id) => (b.cast.find((c) => c.id === id) || { name: id }).name;
    const pn = (id) => (b.places.find((p) => p.id === id) || { name: id }).name;
    const tm = G.minToStr, tr = b.truth, w = tr.window, L = [];
    const cli = b.cast.find((c) => c.role === 'cliente');
    const title = G.compileBible(b).title; // el mismo título que verá el jugador
    const clueById = {}; b.clues.forEach((c) => { clueById[c.id] = c; });
    const src = (c) => (c.source.type === 'prop' ? 'objeto en ' + pn(c.source.place) : 'lo cuenta ' + nm(c.source.npc));
    const pts = (c) => { const k = Object.keys(c.points || {}); return k.length ? ' [' + k.map((x) => nm(x) + ' ' + (c.points[x] > 0 ? '+' : '') + c.points[x]).join(', ') + ']' : ''; };
    const clueLine = (id) => { const c = clueById[id]; return c ? `  - ${c.title} (${ROLE[c.role]}, ${c.kind}, ${src(c)})${pts(c)}: ${c.text}` : `  - (pista ${id} no encontrada)`; };

    L.push(`CASO ${b.code} · ${title}`, '='.repeat(60));
    L.push(`Cliente: ${cli.name} (${cli.trait}). Objeto robado: ${b.object.name}, que estaba en ${pn(b.object.place)}.`);
    L.push(`Lugares: ${b.places.map((p) => p.name).join(' → ')}.`, '');
    L.push('REPARTO');
    b.cast.filter((c) => c.role === 'sospechoso').forEach((c) => L.push(`  - ${c.name} (${c.trait}, aspecto ${c.look})${c.id === tr.culprit ? ' ← CULPABLE' : ''}`));
    L.push('', 'LA VERDAD');
    L.push(`  El robo ocurre en ${pn(w.place)} entre las ${tm(w.from)} y las ${tm(w.to)}.`);
    L.push(`  Culpable: ${nm(tr.culprit)}. Método: ${tr.method.text}. Móvil: ${tr.motive.text}.`);
    L.push(`  Método falso (señuelos): ${tr.decoys.methods.map((d) => d.text).join(' / ')}.`);
    L.push(`  Móvil falso (señuelos): ${tr.decoys.motives.map((d) => d.text).join(' / ')}.`, '');
    L.push('CRONOLOGÍA');
    tr.timeline.forEach((e) => L.push(`  ${tm(e.t)}-${tm(e.until)}  ${nm(e.who)} en ${pn(e.place)}: ${e.doing}${e.witnesses && e.witnesses.length ? ' (con ' + e.witnesses.map(nm).join(', ') + ')' : ''}`));
    L.push('', 'QUÉ DICE CADA SOSPECHOSO');
    Object.keys(b.alibis).forEach((id) => {
      const a = b.alibis[id];
      L.push(`  - ${nm(id)}: «estuve en ${pn(a.claim.place)} de ${tm(a.claim.from)} a ${tm(a.claim.to)}» → ${a.holds ? 'dice la verdad' : 'MIENTE'}${a.clearedBy ? '; se descarta con «' + (clueById[a.clearedBy] || { title: a.clearedBy }).title + '»' : '; sin descarte directo'}`);
    });
    L.push('', 'MENTIRAS Y CÓMO SE DESMONTAN');
    b.lies.forEach((l) => { L.push(`  - ${nm(l.who)} dice: «${l.said}»`, `    Verdad: ${l.truth}`, ...l.refutedBy.map(clueLine)); });
    L.push('', 'PRUEBAS CONTRA EL CULPABLE'); b.proof.forEach((id) => L.push(clueLine(id)));
    L.push('', 'DESCARTES'); b.clues.filter((c) => c.role === 'descarte').forEach((c) => L.push(clueLine(c.id)));
    L.push('', 'PISTAS FALSAS'); b.clues.filter((c) => c.role === 'falsa').forEach((c) => L.push(clueLine(c.id)));
    const inLies = {}; b.lies.forEach((l) => l.refutedBy.forEach((k) => { inLies[k] = 1; }));
    const rest = b.clues.filter((c) => !['prueba', 'descarte', 'falsa'].includes(c.role) && !b.proof.includes(c.id) && !inLies[c.id]);
    if (rest.length) { L.push('', 'OTRAS PISTAS'); rest.forEach((c) => L.push(clueLine(c.id))); }
    const tot = b.clues.reduce((s, c) => s + (c.points[tr.culprit] || 0), 0);
    L.push('', `Total: ${b.clues.length} pistas · ${tot} puntos de sospecha contra ${nm(tr.culprit)}.`);
    return L.join('\n');
  };
})(typeof window !== 'undefined' ? window : globalThis);
