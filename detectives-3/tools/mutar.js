// mutar.js — ayudante para pruebas de MUTACIÓN del código (se estropea una pieza en memoria y la prueba DEBE fallar).
// Problema que resuelve: antes cada mutación buscaba una frase EXACTA dentro de src/; un retoque inocente del código (p. ej. `reading([step.text])` →
// `reading([coinFreeText(step)])`) la dejaba sin encajar y la prueba fallaba sin que el código tuviera ningún defecto (cp. 146, C1).
// Ahora el «desde» puede ser:
//   · un TEXTO: se busca ignorando los espacios y saltos de línea (cualquier número de blancos, también ninguno) → tolera el formato;
//   · una EXPRESIÓN REGULAR: para anclarse a lo esencial y dejar libre lo que puede cambiar (números, texto vecino…). El «hacia» admite $1, $2… y funciones.
// Reglas de seguridad (para no dar un «mutación detectada» falso ni un «no detectada» falso):
//   · si el patrón NO encaja → error claro «el patrón ya no encaja» (hay que actualizar la prueba, no el código);
//   · si el cambio no modifica el texto → error «la mutación no cambia nada» (si no, la prueba daría «no detectada» sin razón);
//   · si encaja más de una vez se estropea SOLO la 1.ª y se informa de cuántas veces encajaba (`veces`), para vigilar que sea la pieza buscada.
// Uso en una prueba:
//   const { mutador } = require('./tools/mutar.js');
//   const m = mutador('bot.js', /credit\(step\.tool, dur\);\s*/, '');      // o un texto: mutador('bot.js', 'credit(step.tool, dur);', '')
//   const Gm = loadG(EXTRA, m.patch);                                      // m.patch es el (archivo, texto) => texto que espera load_g.js
//   if (!m.ok) { /* m.motivo explica por qué: el patrón ya no encaja o no cambia nada */ }   // m.ok y m.veces se rellenan al cargar
// Autoprueba: node tools/mutar.js --prueba
'use strict';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// texto → expresión regular que ignora el formato: entre símbolos vale cualquier blanco (o ninguno); entre dos palabras hace falta al menos uno
const flexible = (s) => {
  const tk = s.match(/\w+|[^\w\s]/g) || [];
  return new RegExp(tk.map((t, i) => (i && /\w$/.test(tk[i - 1]) && /^\w/.test(t) ? '\\s+' : i ? '\\s*' : '') + esc(t)).join(''));
};

// Aplica una mutación a un texto. Devuelve { ok, texto, veces, motivo }
function mutar(texto, desde, hacia) {
  const re = typeof desde === 'string' ? flexible(desde) : desde;
  const flags = re.flags.replace('g', '');
  const todas = texto.match(new RegExp(re.source, flags + 'g'));
  if (!todas) return { ok: false, veces: 0, motivo: 'el patrón ya no encaja' };
  const out = texto.replace(new RegExp(re.source, flags), hacia);
  if (out === texto) return { ok: false, veces: todas.length, motivo: 'la mutación no cambia nada (el reemplazo deja el mismo texto)' };
  return { ok: true, texto: out, veces: todas.length };
}

// Crea el parche para load_g.js: solo toca `archivo`; el resultado queda en el propio objeto (ok, veces, motivo) cuando load_g lo ha leído.
function mutador(archivo, desde, hacia) {
  const est = { ok: false, veces: 0, motivo: 'el archivo no se llegó a cargar' };
  est.patch = (f, texto) => {
    if (f !== archivo) return texto;
    const r = mutar(texto, desde, hacia);
    est.ok = r.ok; est.veces = r.veces; est.motivo = r.motivo || '';
    return r.ok ? r.texto : texto;
  };
  return est;
}
module.exports = { mutar, mutador, flexible };

// ---- autoprueba
if (require.main === module && process.argv.includes('--prueba')) {
  let fails = 0;
  const ok = (c, m) => { if (!c) { fails++; console.log('  ✗ ' + m); } };
  const codigo = 'if (a) {\n      t += dur; work += dur; credit(step.tool, dur); reading([step.text]);\n    }';
  // 1. texto con otro formato (espacios y saltos distintos)
  let r = mutar('x;  credit( step.tool,dur );\n y;', 'credit(step.tool, dur);', '');
  ok(r.ok && r.texto === 'x;  \n y;', 'el texto tolera otros espacios (ahora: ' + JSON.stringify(r) + ')');
  // 2. EL CASO DE C1: lo que viene detrás cambia y la mutación sigue encajando si se ancla a lo esencial
  const nuevo = codigo.replace('reading([step.text])', 'reading([coinFreeText(step)])');
  ok(mutar(nuevo, 'credit(step.tool, dur); reading([step.text]);', '').motivo === 'el patrón ya no encaja', 'la forma LITERAL de antes ya no encaja tras el retoque (así falló C1)');
  ok(mutar(nuevo, /credit\(step\.tool, dur\);\s*/, '').ok, 'anclado a lo esencial, el mismo retoque NO rompe la mutación');
  ok(mutar(codigo, /credit\(step\.tool, dur\);\s*/, '').ok, 'y sigue valiendo con el código de antes');
  // 3. no encaja → motivo claro
  r = mutar('nada de esto', 'otra cosa', 'x');
  ok(!r.ok && r.motivo === 'el patrón ya no encaja' && r.veces === 0, 'sin encaje: error claro');
  // 4. el reemplazo no cambia nada → error (evita un falso «no detectada»)
  r = mutar('a = 1;', /a = 1;/, 'a = 1;');
  ok(!r.ok && /no cambia nada/.test(r.motivo), 'mutación que no cambia nada: error claro');
  // 5. varias coincidencias: se estropea solo la 1.ª y se cuenta
  r = mutar('f(1); f(1); f(1);', 'f(1);', 'g();');
  ok(r.ok && r.veces === 3 && r.texto === 'g(); f(1); f(1);', 'varias coincidencias: solo la primera, y se informa de cuántas');
  // 6. grupos ($1) y funciones en el «hacia»
  ok(mutar('if (v < 3) {', /if \((v) < (\d+)\)/, 'if ($1 <= $2)').texto === 'if (v <= 3) {', 'el «hacia» admite $1 y $2');
  ok(mutar('n = 7;', /n = (\d+);/, (m, d) => 'n = ' + (+d + 1) + ';').texto === 'n = 8;', 'el «hacia» admite funciones');
  // 7. caracteres especiales en un texto (se escapan solos)
  ok(mutar('a.b(c)[0]', 'a.b(c)[0]', 'z').texto === 'z', 'los caracteres especiales de un texto se escapan');
  // 8. el parche solo toca el archivo pedido y deja el resultado en el objeto
  const m = mutador('bot.js', 'credit(step.tool, dur);', '');
  ok(m.patch('otro.js', 'credit(step.tool, dur);') === 'credit(step.tool, dur);' && !m.ok, 'el parche no toca otros archivos');
  ok(m.patch('bot.js', codigo).indexOf('credit') < 0 && m.ok && m.veces === 1, 'el parche toca su archivo y deja ok/veces');
  console.log(fails ? '✗ mutar.js: ' + fails + ' problema(s)' : '✓ mutar.js: 12 comprobaciones correctas');
  process.exit(fails ? 1 : 0);
}
