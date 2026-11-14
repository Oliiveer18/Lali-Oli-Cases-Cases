// Prueba (sin navegador) de la geometría del globo de diálogo (FIX-4a parte 2): siempre dentro de G.safe(), sin tapar a quien habla y con la punta bien.
const fs = require('fs'), vm = require('vm'), path = require('path');
const mkCtx = () => new Proxy({}, { get: (t, k) => (k === 'measureText' ? (s) => ({ width: String(s).length * 8.5 }) : k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) });
const sb = { console, Math, Date, JSON, Object, Array, Set, Map, String, Number, Uint8ClampedArray, Uint32Array, parseInt, isFinite, Infinity, Proxy, setTimeout, btoa: (s) => Buffer.from(s, 'binary').toString('base64'), atob: (s) => Buffer.from(s, 'base64').toString('binary') };
sb.globalThis = sb; sb.crypto = require('crypto').webcrypto;
const mkPlain = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : k === 'getImageData' ? undefined : () => {}), set: (t, k, v) => ((t[k] = v), true) });
sb.__makeCanvas = (w, h) => ({ width: w, height: h, getContext: () => mkPlain() });
vm.createContext(sb);
['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'), sb, { filename: f }));
const G = sb.G, U = G.ui, ctx = mkCtx();
G.save.data = G.defaultSave();
let fails = 0, n = 0;
const t = (name, ok, extra) => { n++; if (!ok) { fails++; console.log(' FALLA ' + name + (extra ? ' ' + extra : '')); } };
const sf = G.safe();
const texts = ['Pues yo vi a alguien salir corriendo por la puerta de atrás justo antes del apagón.', 'Yo no he sido, lo juro por mi receta secreta, y además tenía las manos llenas de harina todo el rato.', 'Hola', 'Aquí hay algo raro, ¿no os parece?', 'A ver, yo estaba en la cocina cuando oí un ruido muy extraño que venía de la despensa y me asusté mucho. '.repeat(2).trim()];
let below = 0, above = 0;
for (const bigText of [false, true]) {
  G.save.data.settings.bigText = bigText;
  for (const text of texts) {
    for (let sx = -60; sx <= 1020; sx += 20) {
      for (let sy = -40; sy <= 580; sy += 5) {
        const b = U.bubbleRect(ctx, text, sx, sy, { feetY: sy + 40 });
        const tag = `(${sx},${sy}) bigText=${bigText} «${text.slice(0, 12)}»`;
        t('dentro de la zona segura ' + tag, b.x >= sf.x - 0.01 && b.y >= sf.y - 0.01 && b.x + b.w <= sf.r + 0.01 && b.y + b.h <= sf.b + 0.01, JSON.stringify([b.x, b.y, b.w, b.h]));
        const tipY = b.below ? b.y - 9 : b.y + b.h + 9;
        t('la punta (tx) cae dentro del globo ' + tag, b.tx >= b.x + 14 - 0.01 && b.tx <= b.x + b.w - 14 + 0.01);
        // si el que habla está a la vista y hay sitio, el globo NO tapa su cuerpo (cabeza sy .. pies sy+40)
        const visible = sx > 30 && sx < 930 && sy > 70 && sy < 440;
        if (visible && b.h < 160) {
          const cover = b.x < sx + 14 && b.x + b.w > sx - 14 && b.y < sy + 40 && b.y + b.h > sy - 2;
          t('no tapa a quien habla ' + tag, !cover, JSON.stringify([b.x, b.y, b.w, b.h, b.below]));
        }
        if (b.below) below++; else above++;
      }
    }
  }
}
// el caso típico del fallo 2: sin margen arriba, el globo pasa a ir debajo, no se sale
const top = U.bubbleRect(ctx, 'Hola, soy Oli', 480, 20, { feetY: 70 });
t('cerca del borde superior va debajo', top.below && top.y >= sf.y);
const mid = U.bubbleRect(ctx, 'Hola, soy Oli', 480, 300, { feetY: 340 });
t('en el centro va encima', !mid.below);
const edge = U.bubbleRect(ctx, 'Hola, soy Oli', 950, 300, { feetY: 340 });
t('en el borde derecho se desplaza dentro y la punta apunta al hablante', edge.x + edge.w <= sf.r + 0.01 && edge.tx > edge.x + edge.w - 30);
// FIX-4a (a): dos (y tres) hablantes pegados: los globos no se solapan entre sí, siguen dentro de la zona segura y la punta apunta a su hablante
{
  const sh = ['Pues yo vi a alguien salir corriendo por la puerta de atrás.', 'Yo no he sido, lo juro por mi receta secreta.', 'Hola, soy Oli'];
  let pares = 0, solapes = 0, sinSitio = 0;
  const overlap = (a, c) => Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x) > 0.5 && Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y) > 0.5;
  for (const gap of [0, 10, 25, 45, 70, 120]) {
    for (let sx = 120; sx <= 840; sx += 60) {
      for (let sy = 90; sy <= 440; sy += 50) {
        for (const nSp of [2, 3]) {
          const avoid = [], bs = [];
          for (let k = 0; k < nSp; k++) bs.push(U.bubbleRect(ctx, sh[k % 3], sx + k * gap, sy + (k % 2) * 6, { feetY: sy + 46, avoid })), avoid.push({ x: bs[k].x, y: bs[k].y, w: bs[k].w, h: bs[k].h });
          pares++;
          let hay = false;
          for (let i = 0; i < bs.length; i++) {
            const b = bs[i];
            t(`pegados dentro zona segura gap=${gap} (${sx},${sy})`, b.x >= sf.x - 0.01 && b.y >= sf.y - 0.01 && b.x + b.w <= sf.r + 0.01 && b.y + b.h <= sf.b + 0.01);
            for (let j = i + 1; j < bs.length; j++) if (overlap(b, bs[j])) hay = true;
          }
          if (hay) { solapes++; if (gap >= 25) t(`globos solapados con hablantes separados gap=${gap} n=${nSp} (${sx},${sy})`, false); }
        }
      }
    }
  }
  t('con hablantes pegados casi nunca queda solape (<5 %)', solapes / pares < 0.05, solapes + ' de ' + pares);
  console.log(`globos pegados: ${pares} escenas · con solape ${solapes}`);
}
// FIX-4a (b): el globo evita las zonas del HUD (panel de dinero, objetivos, pausa, herramientas, botones)
{
  const Z = [{ x: 10, y: 10, w: 312, h: 120 }, { x: 650, y: 10, w: 246, h: 74 }, { x: 906, y: 8, w: 44, h: 44 }, { x: 10, y: 462, w: 258, h: 68 }, { x: 276, y: 462, w: 258, h: 68 }, { x: 810, y: 488, w: 140, h: 42 }, { x: 634, y: 488, w: 140, h: 42 }];
  const hit = (b, z) => Math.min(b.x + b.w, z.x + z.w) - Math.max(b.x, z.x) > 0.5 && Math.min(b.y + b.h, z.y + z.h) - Math.max(b.y, z.y) > 0.5;
  let esc = 0, tap = 0, tapSinHud = 0;
  for (const text of ['Hola, soy Oli', 'Pues yo vi a alguien salir corriendo por la puerta de atrás.']) {
    for (let sx = 60; sx <= 900; sx += 30) {
      for (let sy = 70; sy <= 440; sy += 10) {
        const b = U.bubbleRect(ctx, text, sx, sy, { feetY: sy + 46, avoid: Z.slice() }), b0 = U.bubbleRect(ctx, text, sx, sy, { feetY: sy + 46 });
        esc++;
        const hudHit = Z.some((z) => hit(b, z)), hudHit0 = Z.some((z) => hit(b0, z));
        if (hudHit) tap++;
        if (hudHit0) tapSinHud++;
        t(`con zonas del HUD sigue dentro de la zona segura (${sx},${sy})`, b.x >= sf.x - 0.01 && b.y >= sf.y - 0.01 && b.x + b.w <= sf.r + 0.01 && b.y + b.h <= sf.b + 0.01);
      }
    }
  }
  t('el caso del fallo: globo sobre alguien bajo el panel de dinero ya no lo tapa', !hit(U.bubbleRect(ctx, 'Yo estaba en la cocina cuando oí un ruido muy extraño.', 770, 100, { feetY: 146, avoid: Z.slice() }), Z[1]));
  t('las zonas del HUD reducen mucho los globos que tapan el HUD', tap < tapSinHud * 0.2, tap + ' con zonas frente a ' + tapSinHud + ' sin ellas');
  console.log(`globos y HUD: ${esc} casos · tapan HUD con zonas ${tap} · sin zonas ${tapSinHud}`);
}
console.log(`globos probados: ${n} comprobaciones · encima ${above} · debajo ${below}`);
console.log(fails ? fails + ' fallo(s)' : 'Todo en orden');
process.exit(fails ? 1 : 0);
