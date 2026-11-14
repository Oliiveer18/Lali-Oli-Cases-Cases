// Cuentakilómetros de CUPOS (docs/CUPOS_COMPLETITUD.md): cuenta lo que hay HOY en los bancos del generador y lo compara con el mínimo para el HITO y con la meta final.
// Uso: node tools/cupos.js   (solo lectura; no genera casos). Lo que aún no existe sale como «—» (se mide cuando llegue su paquete).
const load = require('./load_g.js');
const G = load(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const D = G.GEN_DATA, C = D.compile;
const len = (a) => (Array.isArray(a) ? a.length : 0);
const minArr = (o) => { const v = []; const w = (x) => { if (Array.isArray(x)) v.push(x.length); else if (x && typeof x === 'object') Object.values(x).forEach(w); }; w(o); return v.length ? Math.min(...v) : 0; };
const asp = G.POLICE_LOOKS ? 0 : 0;
const rooms = Object.values(D.rooms || {}).reduce((a, v) => a + len(v), 0);
const voiceSlots = Object.values(C.voice || {}).map((t) => minArr(t));
const trig = Object.keys(D.clueTpl || {}).filter((k) => k !== 'matiz');
// plantillas de pista: tipos con lista propia (trace, hide, traces, falsa, desliz…) y bancos de testimonios (rumor, said…); el mínimo es el tipo MÁS corto (hoy 2 variantes en varios)
const clueLens = Object.keys(D.clueTpl).filter((k) => Array.isArray(D.clueTpl[k])).map((k) => D.clueTpl[k].length);
const clueMin = clueLens.length ? Math.min(...clueLens) : 0;
const rows = [
  // [nombre, hoy, mínimo HITO, meta final, paquete que lo llena]
  ['Escenarios', 1, 9, 11, '4H-0/1/2 (+2 tras el HITO)'],
  ['Salas por escenario (panadería)', len(D.places), 6, 8, '4F-0b / 4H'],
  ['Variantes de sala (total)', rooms, 108, 250, '4H, 4F-0c (espejo y paletas)'],
  ['Curiosidades (generales)', len(C.extra && C.extra.curios), 200, 300, '4G-5a + cada escenario'],
  ['Charlas (generales)', len(C.extra && C.extra.chat), 150, 220, '4G-5b + cada escenario'],
  ['Variantes de texto por tipo de pista (mínimo)', clueMin, 8, 12, '4F-1…4 + 4G-1'],
  ['Objetos del caso (robo)', len(D.objects), 36, 60, '4T / 4H (≥ 20 por escenario en la meta final)'],
  ['Nombres de personaje', len(D.names), 60, 100, '4F-0d (identidad compuesta)'],
  ['Métodos', len(D.methods), 20, 30, '4T / 4G-1'],
  ['Motivos', len(D.motives), 20, 30, '4T / 4G-1'],
  ['Personalidades (rasgos)', len(D.traits), 10, 14, '4F-0d / 4G-5b'],
  ['Variantes de voz-texto por situación (mínimo)', voiceSlots.length ? Math.min(...voiceSlots) : 0, 5, 8, '4G-5b'],
  ['Aspectos de personaje (looks)', len(D.looks), 48, 60, '4T-4 Impostor, 4H'],
  ['Pares de ambiente [susto, remate]', 0, 250, 320, '4G-5 / 4G-1'],
  ['Historias base por temática', 0, 8, 14, '4T-1…5'],
  ['Oficios por escenario', 0, 8, 12, '4F-0d'], ['Manías', 0, 30, 40, '4F-0d'], ['Muletillas', 0, 30, 40, '4F-0d'], ['Ganchos de arranque por temática', 0, 6, 10, '4F-0d'],
  ['Eventos de ambiente', 0, 20, 40, '4G-3'], ['Frases de epílogo con condición', 0, 40, 80, '4G-4'], ['Nombres de aliados de policía', 11, 18, 24, '4G-5b'],
];
// pares de ambiente reales
{ let n = 0; const w = (x) => { if (Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && typeof x[1] === 'string') n++; else if (Array.isArray(x)) x.forEach(w); else if (x && typeof x === 'object') Object.values(x).forEach(w); }; w(C.mood); w(D.clueTpl.matiz); w(C.macabro); rows.find((r) => r[0].startsWith('Pares de ambiente'))[1] = n; }
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('Ingrediente', 48) + pad('Hoy', 6) + pad('HITO', 6) + pad('Meta', 6) + 'Estado  · paquete');
rows.forEach(([n, h, m, f, p]) => { const st = h >= f ? 'META ✓' : h >= m ? 'HITO ✓' : h === 0 && !/^(Escenarios)/.test(n) ? '—' : 'falta'; console.log(pad(n, 48) + pad(h || '—', 6) + pad(m, 6) + pad(f, 6) + pad(st, 8) + '· ' + p); });
