// Prueba (sin navegador) del MENÚ CON DESPLAZAMIENTO (FIX-6a)
// Comprueba: con ventana {top,bottom} la fila elegida queda siempre entera dentro; el desplazamiento sigue a la selección (arriba/abajo); la lista corta no se desplaza;
// las filas cortadas por el borde no se pueden pulsar; las flechas ▲▼ aparecen solo cuando hay más; sin `view` nada cambia.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => { const t = { font: '' }; return new Proxy(t, { get: (o, k) => (k === 'measureText' ? (s) => ({ width: String(s).length * (parseFloat(o.font.replace(/^bold /, '')) || 16) * 0.5 }) : k in o ? o[k] : () => {}), set: (o, k, v) => ((o[k] = v), true) }); };
const sb = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, Uint32Array, parseInt, parseFloat, isFinite, Infinity, Proxy, setTimeout, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
sb.globalThis = sb; sb.crypto = require('crypto').webcrypto;
const mkPlain = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
sb.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkPlain() });
vm.createContext(sb);
['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), sb, { filename: f }));
const G = sb.G, U = G.ui, ctx = mkCtx();
G.save.data = G.defaultSave();
// Prueba (sin navegador) del DESPLAZAMIENTO de U.Menu (FIX-6a, fallo 1: menú de charla largo cortado por arriba).
// Comprueba: con ventana {top,bottom} ninguna fila elegida queda fuera; el desplazamiento sigue a la selección con las 4 direcciones;
// la lista corta no se desplaza; las filas cortadas por el borde no se pueden pulsar; las flechas ▲▼ aparecen solo cuando hay más;
// sin `view` nada cambia respecto a antes.
G.audio = G.audio || {}; G.audio.sfx = () => {};
let fails2 = 0, n2 = 0;
const ok = (name, c, extra) => { n2++; if (!c) { fails2++; console.log(' FALLA ' + name + (extra ? ' ' + extra : '')); } };
const noKeys = () => ({ up: false, down: false, left: false, right: false, ok: false, back: false });
const press = (menu, k) => { G.input.menu = Object.assign(noKeys(), { [k]: true }); G.input.mouse = { moved: false, clicked: false, x: -1, y: -1 }; const r = menu.update(); G.input.menu = noKeys(); return r; };
const mkItems = (k, subEvery) => Array.from({ length: k }, (_, i) => ({ label: 'Tema ' + i, h: subEvery && i % subEvery === 0 ? 52 : 44, sub: subEvery && i % subEvery === 0 ? 'x' : undefined }));
const VIEW = { top: 14, bottom: 340 };
for (const k of [1, 3, 6, 7, 8, 12, 20, 40]) for (const subEvery of [0, 3]) {
  const items = mkItems(k, subEvery);
  const m = new U.Menu(items, { x: 36, y: 14, w: 330, h: 44, gap: 6, view: VIEW });
  m.o.y = Math.max(VIEW.top, VIEW.bottom - m.contentH());
  const tag = `k=${k} sub=${subEvery}`;
  const inside = () => { m.fitScroll(); const r = m.layout()[m.sel]; return r.y >= VIEW.top - 0.01 && r.y + r.h <= VIEW.bottom + 0.01; };
  ok('al abrir, la fila 0 se ve entera ' + tag, inside());
  // baja hasta el final y vuelve a subir: la elegida siempre se ve entera
  for (let i = 0; i < k + 2; i++) { press(m, 'down'); ok('bajando, la elegida se ve ' + tag + ' i=' + i, inside()); }
  for (let i = 0; i < k + 2; i++) { press(m, 'up'); ok('subiendo, la elegida se ve ' + tag + ' i=' + i, inside()); }
  // la lista corta no se desplaza ni muestra flechas; la larga sí
  m.sel = 0; m.lastSel = undefined; m.fitScroll();
  const short = m.contentH() <= VIEW.bottom - VIEW.top;
  ok('lista corta: sin desplazamiento y sin flechas ' + tag, !short || (m.scroll === 0 && !m.arrows().up && !m.arrows().down));
  ok('lista larga: arriba solo ▼, no ▲ ' + tag, short || (!m.arrows().up && !!m.arrows().down));
  if (!short) { m.sel = k - 1; m.lastSel = undefined; m.fitScroll(); ok('lista larga: abajo solo ▲, no ▼ ' + tag, !!m.arrows().up && !m.arrows().down); ok('la última fila acaba justo en el borde inferior ' + tag, Math.abs(m.layout()[k - 1].y + m.layout()[k - 1].h - VIEW.bottom) < 0.01); }
  // ninguna fila queda por encima del borde superior cuando hay desplazamiento y la elegida es la primera
  m.sel = 0; m.lastSel = undefined; m.fitScroll();
  ok('primera fila no queda cortada por arriba ' + tag, m.layout()[0].y >= VIEW.top - 0.01);
}
// clic: solo las filas enteras visibles son pulsables
{
  const m = new U.Menu(mkItems(20, 0), { x: 36, y: 14, w: 330, h: 44, gap: 6, view: VIEW });
  m.fitScroll();
  const rs = m.layout();
  const cut = rs.findIndex((r) => r.y < VIEW.bottom && r.y + r.h > VIEW.bottom);  // fila cortada por el borde inferior
  ok('hay una fila cortada por el borde inferior (el caso a evitar)', cut > 0);
  G.input.menu = noKeys(); G.input.mouse = { moved: false, clicked: true, x: 100, y: rs[cut].y + 5 };
  G.hit = G.hit;  // U.hit usa G.input.mouse
  const r = m.update();
  ok('pulsar una fila cortada por el borde no la elige', r.chosen !== cut, JSON.stringify(r));
  G.input.mouse = { moved: false, clicked: true, x: 100, y: rs[0].y + 5 };
  ok('pulsar una fila entera sí la elige', m.update().chosen === 0);
  // flecha ▼: avanza la selección 3 filas
  m.sel = 0; m.lastSel = undefined; m.fitScroll();
  const ar = m.arrows();
  G.input.mouse = { moved: false, clicked: true, x: ar.down.x + 5, y: ar.down.y + 5 };
  m.update();
  ok('tocar ▼ baja la selección 3 filas', m.sel === 3, 'sel=' + m.sel);
}
// FIX-6b (pendiente 1): las flechas ▲▼ no tapan el texto de la derecha («ya mostrada», «sin pistas», «¡nuevo!») de la fila que queda bajo ellas
{
  const rec = [];
  const realText = U.text;
  U.text = function (c, t, x, y, o2) { rec.push({ t, x, y, align: o2 && o2.align }); return realText.apply(this, arguments); };
  let overl = 0;
  for (const right of ['ya mostrada', 'sin pistas', '¡nuevo!']) for (const k of [12, 20]) {
    const items = Array.from({ length: k }, (_, i) => ({ label: 'Prueba ' + i, h: 38, right }));
    const m = new U.Menu(items, { x: 36, y: 14, w: 420, h: 38, gap: 5, view: VIEW });
    m.o.y = Math.max(VIEW.top, VIEW.bottom - m.contentH());
    for (let sel = 0; sel < k; sel++) {
      m.sel = sel; m.lastSel = undefined; m.fitScroll();
      rec.length = 0; m.draw(ctx);
      const ar = m.arrows(), rs = m.layout();
      for (const key of ['up', 'down']) {
        const a = ar[key]; if (!a) continue;
        rs.forEach((r, i) => {
          if (!(r.y < a.y + a.h && r.y + r.h > a.y) || r.y + r.h < VIEW.top || r.y > VIEW.bottom) return;
          overl++;
          const c = rec.find((q) => q.t === right && q.align === 'right' && Math.abs(q.y - (r.y + (r.h - 17 * 1.2) / 2)) < 0.01);
          ok('flecha ' + key + ' no tapa «' + right + '» (k=' + k + ' sel=' + sel + ' fila ' + i + ')', !!c && c.x <= a.x - 2, c ? 'x=' + c.x + ' flecha.x=' + a.x : 'texto no dibujado');
        });
      }
    }
  }
  U.text = realText;
  ok('hubo filas con texto derecho bajo una flecha (la prueba ejercita el caso)', overl > 20, 'solapes ' + overl);
}
// sin view: igual que antes (sin desplazamiento, sin flechas, mismas posiciones)
{
  const m = new U.Menu(mkItems(5, 0), { x: 10, y: 20, w: 300, h: 44, gap: 6 });
  const rs = m.layout();
  ok('sin view: posiciones de siempre', rs.every((r, i) => r.y === 20 + i * 50) && m.scroll === 0 && Object.keys(m.arrows()).length === 0);
}
console.log('MENÚ CON DESPLAZAMIENTO: ' + n2 + ' comprobaciones, ' + fails2 + ' fallos');
process.exit(fails2 ? 1 : 0);
