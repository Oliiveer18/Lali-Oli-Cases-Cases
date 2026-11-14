// c4-3 3/4-b (4) (cp. 249): REFUTACIÓN REAL EN CHARLA GRABADA (`tracesGrab`, tono sospechoso). Una a una: node test_refuta_charla.js [N=100]
// Interruptor `charlaSenuelos` encendido en memoria (v7). El rastro de un inocente que miente pasa de objeto a «grabación» con la plantilla `tracesGrab` y compile.js la entrega como charla grabada con el tono de `VEIL.senuelo`.
// Se vigila: (1) la pista convertida: tipo/título/texto de `tracesGrab`, mismo id y rol `refuta`, sigue en `refutedBy`, el descarte NO es otra grabación, el rastro está en la sala donde de verdad estaba, como mucho 1 por caso;
// (2) la cifra por nivel sigue `herr2.refGrab` (entre los casos que podían); (3) compilado: o es charla real con paso de grabadora (tono sospechoso, sin el sujeto) o un objeto «grabación» normal (nunca se pierde); (4) el bot gana.
// Mutaciones: tono de refutación normal · sin mirar el descarte · sin mirar la sala · siempre convierte (ignora la tabla) · no cambia el tipo.
const { mutador } = require('./tools/mutar.js');
const MOD = ['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js'], LV = ['facil', 'normal', 'dificil'], N = +process.argv[2] || 100;
let bad = 0, checks = 0; const ok = (m, c) => { checks++; if (!c) { bad++; console.log('✗ ' + m); } }; // (mensaje, condición)
const fillT = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(v, k) ? v[k] : m));
function medir(patch, n) {
  const on = mutador('gen_data.js', 'charlaSenuelos: false', 'charlaSenuelos: true');
  const pts = [on.patch, patch].filter(Boolean);
  const G = require('./tools/load_g.js')(MOD, (f, t) => pts.reduce((x, q) => q(f, x), t)); G.GEN_VERSION = 7;
  const D = G.GEN_DATA, TG = D.clueTpl.tracesGrab[0], VS = D.compile.listen.veil.senuelo, VR = D.compile.listen.veil.roles.refuta;
  const o = { err: 0, casos: 0, conv: 0, elig: 0, dos: 0, tipo: 0, texto: 0, ref: 0, descGrab: 0, sala: 0, kindAntes: 0, sinObjeto: 0, charla: 0, objeto: 0, paso: 0, tono: 0, tonoRef: 0, sujeto: 0, sujetoUltimo: 0, sinVelo: 0, bot: 0, botN: 0, rate: {} };
  LV.forEach((L) => { let k = 0, el = 0, cv = 0; for (let i = 1; k < n && i < n * 6; i++) { const sd = i * 7919 + 1; const r = G.generateCase(sd, { level: L }); if (r.error) { o.err++; continue; } k++; o.casos++;
    const b = r.bible, rooms = r.def.rooms, props = Object.keys(rooms).flatMap((p) => (rooms[p].props || []).map((q) => Object.assign({ _room: p }, q)));
    const w = b.truth.window, tl = b.truth.timeline, nm = (id) => (b.cast.find((c) => c.id === id) || {}).name;
    // elegibles: rastro_ en la sala donde de verdad estaba el mentiroso y con descarte que no es grabación (la misma regla que gen_clues)
    const rast = b.clues.filter((c) => /^rastro_/.test(c.id));
    const conv = rast.filter((c) => c.kind === 'grabación');
    const eligible = rast.some((c) => { const s = c.id.slice(7), e = tl.find((x) => x.who === s && x.place !== w.place && x.t < w.to && w.from < x.until), d = b.clues.find((x) => x.id === 'descarte_' + s); return e && c.source.place === e.place && d && d.kind !== 'grabación'; });
    if (eligible) { el++; o.elig++; } if (conv.length) { cv++; o.conv += conv.length; } if (conv.length > 1) o.dos++;
    conv.forEach((c) => { const s = c.id.slice(7), e = tl.find((x) => x.who === s && x.place !== w.place && x.t < w.to && w.from < x.until), d = b.clues.find((x) => x.id === 'descarte_' + s), lie = b.lies.find((l) => l.who === s);
      if (c.role !== 'refuta' || c.title !== TG.title) o.tipo++;
      if (!/Foto con hora de la cámara/.test(c.text) || /\{\w+\}/.test(c.text) || c.text.indexOf(G.placeById(c.source.place).name) < 0) o.texto++;
      if (!lie || lie.refutedBy.indexOf(c.id) < 0) o.ref++;
      if (!d || d.kind === 'grabación') o.descGrab++;
      if (!e || c.source.place !== e.place) o.sala++;
      if (c.kindAntes) o.kindAntes++;
      const prop = props.find((q) => q.id === 'obj_' + c.id);
      if (!prop) { o.sinObjeto++; return; }
      if (prop.listen) { o.charla++;
        const st = prop.steps[0]; if (st.tool !== 'grabadora' || st.clue !== c.id) o.paso++;
        const ls = prop.chat.lines;
        const sujeto = prop.chat.a === s || prop.chat.b === s; // pasadas 2-3 de la pareja (último recurso, como en las charlas reales): sin velo, solo la charla base
        // c4-4 (cp. 252): el ÚLTIMO RECURSO (pasada 3: todos los libres viven en la sala de la charla; pareja SIN el sujeto) también monta la charla base sin velo; se reconoce porque sus 4 frases son una de las del banco de charlas base
        const aa = { a: nm(prop.chat.a), b: nm(prop.chat.b) }, base = ls.length > 3 && Object.keys(D.compile.listen.mood).some((mk) => D.compile.listen.mood[mk].chats.some((q) => q.length > 3 && fillT(q[2], aa) === ls[2].text && fillT(q[3], aa) === ls[3].text));
        if (sujeto) o.sujetoUltimo++;
        else if (ls.length > 2 && !base) { const t3 = ls[2].text, t4 = ls[3].text, who = nm(s), pv = VS.find((v) => fillT(v[0], { who }) === t3), LK = D.compile.listen.veil.link; // la 2.ª charla del caso responde con `link` (confirma/contrasta) en vez de la 4.ª frase del par
          const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), liga = ['confirma', 'contrasta'].some((q) => LK[q].some((v) => new RegExp('^' + esc(v).replace(esc('{who}'), esc(who)).replace(esc('{prev}'), '.+') + '$').test(t4)));
          if (!pv || (fillT(pv[1], { who }) !== t4 && !liga)) o.tono++;
          if (VR.some((v) => fillT(v[0], { who }) === t3)) o.tonoRef++; }
        else o.sinVelo++;
      } else { o.objeto++; if (r.def.clues[c.id].kind !== 'grabación') o.tipo++; } });
    if (k <= 3) { o.botN++; if (G.botPlay(r.def).win) o.bot++; } }
    o.rate[L] = el ? Math.round(100 * cv / el) : 0; });
  return o;
}
const TABLA = { facil: 45, normal: 55, dificil: 60 };
function revisar(o) { const f = [], z = (k, m) => { if (o[k]) f.push(o[k] + ' ' + m); };
  if (o.err > Math.ceil(0.03 * 3 * N)) f.push('errores ' + o.err); // v7 ya rechaza alguna semilla con el interruptor apagado (dificil 443465): ≤ 3 %
  if (o.conv < 15) f.push('muy pocas refutaciones en charla (' + o.conv + ')');
  z('dos', 'casos con más de una'); z('tipo', 'con rol/título/tipo que no es el de `tracesGrab`'); z('texto', 'con texto sin la plantilla, sin lugar o con huecos sin rellenar'); z('ref', 'fuera de `refutedBy` de su mentira'); z('descGrab', 'con descarte que también es grabación');
  z('sala', 'en una sala que no es la del mentiroso'); z('kindAntes', 'marcadas como señuelo'); z('sinObjeto', 'sin objeto en el caso compilado'); z('paso', 'charlas sin paso de grabadora de su pista'); z('tono', 'charlas con tono que no es `VEIL.senuelo`'); z('tonoRef', 'charlas con tono de refutación normal');
  LV.forEach((L) => { if (Math.abs(o.rate[L] - TABLA[L]) > 20) f.push(L + ' convierte ' + o.rate[L] + ' % (tabla ' + TABLA[L] + ' %)'); });
  if (o.bot < o.botN) f.push('el bot no gana ' + (o.botN - o.bot)); return f; }
const S = medir(null, N), F = revisar(S);
console.log('  refutaciones en charla ' + S.conv + ' (elegibles ' + S.elig + ') · montadas como charla ' + S.charla + ' · como objeto ' + S.objeto + ' · conversión F/N/D ' + LV.map((L) => S.rate[L] + ' %').join(' · ') + ' · bot gana ' + S.bot + '/' + S.botN);
ok('(1)-(4) refutación real en charla: ' + (F.join(' · ') || 'todo en regla'), F.length === 0);
ok('hay charlas montadas Y objetos de rescate o al menos charlas (' + S.charla + ')', S.charla >= 8);
const M = [
  ['tono de refutación normal (no el sospechoso)', { f: 'compile.js', d: "cl.role === 'refuta' && cl.kind === 'grabación' && VEIL.senuelo", h: 'false' }],
  ['sin mirar el descarte', { f: 'gen_clues.js', d: "return !!d && d.kind !== 'grabación' && clues.some(", h: 'return !!d && clues.some(' }],
  ['sin mirar la sala del rastro', { f: 'gen_clues.js', d: 'if (tpp && tpp === e.place) rastroInfo.push', h: 'if (tpp) rastroInfo.push' }],
  ['siempre convierte (ignora la tabla)', { f: 'gen_clues.js', d: 'if (n >= 1 && cand.length) { const q = cand[0]', h: 'if (cand.length) { const q = cand[0]' }],
  ['no cambia el tipo', { f: 'gen_clues.js', d: 'cl.kind = tg.kind; cl.title = fill(tg.title, q.v);', h: 'cl.title = fill(tg.title, q.v);' }],
];
M.forEach((mm, ix) => { if (process.env.SOLO && +process.env.SOLO !== ix) return; const m = mutador(mm[1].f, mm[1].d, mm[1].h), F2 = revisar(medir(m.patch, N)); // m.ok se rellena al cargar el archivo: se mira DESPUÉS de medir
  ok(`mutación «${mm[0]}»: el patrón encaja (${m.motivo || 'sí'})`, m.ok !== false); ok(`mutación «${mm[0]}» detectada`, F2.length > 0); console.log('  · «' + mm[0] + '»: ' + (F2.length ? 'detectada (' + F2[0] + ')' : 'NO detectada')); });
console.log(bad ? `✗ ${bad} fallos de ${checks}` : `✓ test_refuta_charla: ${checks} comprobaciones`); process.exit(bad ? 1 : 0);
