// FIX-6a (2.º tercio, fallos 2 y 3): los textos de las filas de U.Menu no se salen de su recuadro ni pisan el texto de la derecha
// («sin pistas», «ya mostrada»…), y las listas del selector de Acusar y de «Mostrar una prueba» ya no se cortan (antes slice(0,11)/slice(0,9)).
// Sin navegador. Una a una: node test_menutexto.js [N=60]
const G = require('./tools/load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const U = G.ui, N = +process.argv[2] || 60;
G.audio = G.audio || {}; G.audio.sfx = () => {};
let bad = 0, n = 0;
const ok = (c, m, extra) => { n++; if (!c) { bad++; if (bad <= 25) console.log('✗ ' + m + (extra ? ' ' + extra : '')); } };
// lienzo que registra cada fillText con su fuente y alineación; el ancho es 0,5·tamaño por carácter
const mkCtx = () => {
  const t = { font: '16px x', textAlign: 'left', log: [] };
  return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => ({ width: String(s).length * (parseFloat(o.font.replace(/^bold /, '')) || 16) * 0.5 }) : k === 'fillText' ? (s, x, y) => o.log.push({ s: String(s), x, y, size: parseFloat(o.font.replace(/^bold /, '')) || 16, align: o.textAlign }) : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) });
};
const long = 'Lo hizo aprovechando que todos estaban distraídos con la cena de gala y nadie miró hacia la despensa del fondo durante casi veinte minutos';
const noKeys = () => ({ up: false, down: false, left: false, right: false, ok: false, back: false });
G.input = { menu: noKeys(), mouse: { moved: false, clicked: false, x: -1, y: -1 } };

// comprueba una fila dibujada: sus líneas de la izquierda caben entre el icono y el texto de la derecha, y todo queda dentro de la fila
function checkRow(menu, i, tag) {
  const ctx = mkCtx();
  menu.sel = i; menu.lastSel = undefined; menu.draw(ctx);
  const r = menu.layout()[i], it = menu.items[i];
  const tx = r.x + (it.icon ? 46 : 16);
  const rightTxt = it.right ? ctx.log.find((l) => l.align === 'right' && l.s === it.right) : null;
  const rightLeft = rightTxt ? rightTxt.x - rightTxt.s.length * rightTxt.size * 0.5 : r.x + r.w - 12;
  const left = ctx.log.filter((l) => l.align !== 'right' && l.s !== '▲' && l.s !== '▼' && l.y >= r.y - 1 && l.y <= r.y + r.h);
  ok(left.length > 0, tag + ': hay texto');
  left.forEach((l) => {
    const isSub = it.sub && l.size <= 13 && l.y > r.y + 25;
    const lim = isSub ? r.x + r.w - 14 : rightLeft;
    ok(l.x + l.s.length * l.size * 0.5 <= lim + 1.5, tag + ': «' + l.s.slice(0, 30) + '» no pisa lo de su derecha', JSON.stringify([l.x + l.s.length * l.size * 0.5, lim]));
    ok(l.y >= r.y - 0.5 && l.y + l.size <= r.y + r.h + 0.5, tag + ': línea dentro de la fila', JSON.stringify([l.y, l.size, r.y, r.h]));
  });
}
// 1) filas sintéticas: etiqueta larga con texto a la derecha, con y sin icono, con y sin subtítulo, con «Texto grande»
for (const big of [false, true]) {
  G.save.data.settings.bigText = big;
  for (const h of [40, 56]) for (const right of ['', 'sin pistas', 'hay pistas', 'ya mostrada', 'descartado']) for (const icon of [null, 'ico_clue']) for (const sub of [undefined, 'Descripción algo larga del sospechoso que ocupa varias líneas en la tarjeta']) {
    const items = [{ label: long, right, icon, sub, h: sub ? 52 : h, rightColor: '#fff' }, { label: 'Corto', right }];
    const m = new U.Menu(items, { x: 480, y: 136, w: 400, h, gap: 5 });
    checkRow(m, 0, `sintética h=${h} right=«${right}» icon=${!!icon} sub=${!!sub} big=${big}`);
  }
}
G.save.data.settings.bigText = false;

// 2) selectores reales de 60 casos: motivos, métodos, pruebas y sospechosos
const cases = [];
for (let i = 1; cases.length < N && i < N * 4; i++) { const r = G.generateCase(i * 7919 + 1, { register: true }); if (!r.error) cases.push(r.def); }
ok(cases.length === N, 'casos generados ' + cases.length);
let rows = 0, maxLen = 0, maxClues = 0;
cases.forEach((def) => {
  const sol = def.solution;
  const mk = (list) => list.map((m) => ({ id: m.id, label: m.text, right: 'sin pistas', rightColor: '#999', h: 56 }));
  [['método', mk(sol.methods)], ['motivo', mk(sol.motives)]].forEach(([nm, items]) => {
    const m = new U.Menu(items, { x: 480, y: 136, w: 400, h: 40, gap: 5, view: { top: 136, bottom: 462 } });
    items.forEach((it, i) => { rows++; maxLen = Math.max(maxLen, it.label.length); checkRow(m, i, `caso ${def.id || ''} ${nm} ${i}`); });
  });
  const ids = Object.keys(def.clues);
  maxClues = Math.max(maxClues, ids.length);
  const pic = ids.map((c) => ({ id: c, label: def.clues[c].title, icon: def.clues[c].icon, right: 'ya mostrada' })).concat([{ id: null, label: 'Volver', icon: 'ico_arrow' }]);
  const pm = new U.Menu(pic, { x: 36, y: 14, w: 420, h: 38, gap: 5, view: { top: 14, bottom: 340 } });
  pic.forEach((it, i) => { rows++; checkRow(pm, i, `caso ${def.id || ''} prueba ${i}`); });
  const sus = def.suspects.map((s) => ({ id: s.id, label: s.name, sub: s.desc, h: 52, right: 'descartado' }));
  const sm = new U.Menu(sus, { x: 480, y: 136, w: 400, h: 40, gap: 5, view: { top: 136, bottom: 462 } });
  sus.forEach((it, i) => { rows++; checkRow(sm, i, `caso ${def.id || ''} sospechoso ${i}`); });
});

// 3) las listas largas NO se cortan: todas las filas son alcanzables con ↓ y la última («Volver»/«Listo») se ve entera
for (const [view, w, h] of [[{ top: 14, bottom: 340 }, 420, 38], [{ top: 136, bottom: 462 }, 400, 40]]) for (const k of [8, 9, 10, 11, 12, 15, 25]) {
  const items = Array.from({ length: k }, (_, i) => ({ label: 'Prueba ' + i }));
  const m = new U.Menu(items, { x: 36, y: view.top, w, h, gap: 5, view });
  m.o.y = Math.max(view.top, view.bottom - m.contentH());
  let reached = 0;
  for (let i = 0; i < k + 2; i++) { G.input.menu = Object.assign(noKeys(), { down: i > 0 }); m.update(); reached = Math.max(reached, m.sel); }
  G.input.menu = noKeys();
  ok(`lista de ${k}: se llega a la última`, reached === k - 1);
  m.fitScroll(); const r = m.layout()[k - 1];
  ok(`lista de ${k}: la última se ve entera`, r.y >= view.top - 0.01 && r.y + r.h <= view.bottom + 0.01);
}
console.log(`Textos de menú sin pisarse ni salirse: ${n} comprobaciones, ${bad} fallos (${rows} filas reales de ${cases.length} casos; motivo más largo ${maxLen} car.; máx. ${maxClues} pistas)`);
process.exit(bad ? 1 : 0);
