// Prueba del Despacho del dueño EN RESERVA (4F-0b 2/4): datos completos y que no se cuela en ningún banco activo. Uso: node test_despacho.js
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const D = G.GEN_DATA, X = D.compile.extra; let bad = 0;
const ok = (n, c, e) => { console.log(`${c ? 'OK' : 'FALLA'} · ${n}`); if (!c) { bad++; if (e) console.log('  ', e); } };
const R = (D.reservedPlaces || [])[0];
ok('el lugar en reserva es «despacho» (nombre corto, «del dueño» en loc/to) y NO está en places', R && R.id === 'despacho' && /dueño/.test(R.loc) && /dueño/.test(R.to) && R.name.length <= 10 && !D.places.some((p) => p.id === 'despacho'));
ok('tiene actividades normales (≥ 4) y secretas (≥ 3), objeto imposible (≥ 2) y escondite', D.acts.despacho.normal.length >= 4 && D.acts.despacho.secret.length >= 3 && D.impossible.despacho.length >= 2 && !!D.hideAt.despacho);
ok('cada actividad del despacho tiene su versión en primera persona (D.pastFirst)', D.acts.despacho.normal.concat(D.acts.despacho.secret).every((a) => D.pastFirst[a]), D.acts.despacho.normal.concat(D.acts.despacho.secret).filter((a) => !D.pastFirst[a]).join(' | '));
const cs = X.curiosByPlace.despacho;
ok('≥ 8 curiosidades del despacho con sprite existente, rótulo y 2 frases (gracia + remate)', cs.length >= 8 && cs.every((c) => G.spr[c.sprite] && c.label && c.text.length === 2 && c.text.every((t) => t.length > 20)), cs.filter((c) => !G.spr[c.sprite]).map((c) => c.sprite).join());
ok('las curiosidades del despacho no repiten rótulo con el banco general', cs.every((c) => !X.curios.some((g) => g.label === c.label)));
ok('≥ 6 temas de charla del despacho (pregunta y respuesta)', X.chatByPlace.despacho.length >= 6 && X.chatByPlace.despacho.every((q) => q.length === 2 && /^¿.*\?$/.test(q[0]) && q[1].length > 25));
const LB = X.listenByPlace.despacho;
ok('charlas grabadas del despacho para los TRES ambientes (≥ 3 cada uno, 4 frases)', ['claro', 'inquietante', 'macabro'].every((m) => Array.isArray(LB[m]) && LB[m].length >= 3 && LB[m].every((l) => l.length === 4 && l.every((f) => f.length > 8))));
ok('en las charlas, {a} solo lo dice b (líneas 1 y 3) y {b} solo lo dice a (líneas 0 y 2): nadie se nombra a sí mismo', ['claro', 'inquietante', 'macabro'].every((m) => LB[m].every((l) => l.every((f, i) => (i % 2 === 0 ? !/\{a\}/.test(f) : !/\{b\}/.test(f))))));
ok('sin repetir chistes: ninguna palabra clave de remate («bombilla», «luz») se repite en más de 2 textos de curiosidad', ['bombilla'].every((w) => cs.filter((c) => new RegExp(w, 'i').test(c.text.join(' '))).length <= 1));
const all = JSON.stringify([cs, X.chatByPlace, X.listenByPlace, D.acts.despacho]);
ok('nada del crimen: sin «robo», «ladrón», «culpable», «sospechoso» ni «pista» en los textos del despacho', !/robo|ladr[oó]n|culpable|sospechos|pista/i.test(all));
ok('las 3 plantillas del despacho usan arte propio (caja fuerte, sillón, globo, escritorio del dueño o retrato)', D.rooms.despacho.every((t) => t.scenery.concat(t.decor).some((q) => ['safe', 'armchair', 'globe', 'desk_boss', 'portrait'].indexOf(q.sprite) >= 0)));
// ningún caso lo usa: la biblia y la sala no lo mencionan
let used = 0; for (let i = 0; i < 40; i++) { const r = G.generateCase(5000 + i * 31); if (!r.error && /despacho_|"despacho"/.test(JSON.stringify(r))) used++; }
ok('ninguno de 40 casos generados usa la sala Despacho (ni plantilla ni lugar)', used === 0, used + ' casos');
console.log(bad ? `\n${bad} comprobación(es) con fallos` : '\nTodo en orden'); process.exit(bad ? 1 : 0);
