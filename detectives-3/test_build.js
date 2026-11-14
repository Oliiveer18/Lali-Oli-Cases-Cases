// Prueba de la CONSTRUCCIÓN (v0.7.21): qué módulos viajan dentro del juego y en qué orden. Uso: node test_build.js (tras node build.js)
// Regla: todo archivo de src/ entra en el juego salvo la lista EXCLUIDOS (solo pruebas y desarrollo). Así un módulo nuevo
// no se queda fuera de los tres HTML sin que nadie lo note (justo lo que pasaba con el generador y la huella hasta la v0.7.20).
const fs = require('fs'), path = require('path');
const EXCLUIDOS = ['bot.js', 'quality.js', 'report.js']; // bot y nota de calidad (el bot no entra en el juego; 4D crea un estimador barato) e informe de texto de la biblia
const ORDEN = ['core.js', 'sprites_a.js', 'sprites_b.js', 'sprites_c.js', 'ui.js', 'logic.js', 'schema.js', 'review.js', 'bible.js', 'gen_data.js', 'gen_themes.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js', 'meter.js', 'case1.js', 'world.js', 'companion.js', 'net.js', 'play.js', 'scenes.js'];
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const src = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => /\.js$/.test(f)).sort();
const esperados = src.filter((f) => EXCLUIDOS.indexOf(f) < 0);
ok(EXCLUIDOS.every((f) => src.indexOf(f) >= 0), 'la lista EXCLUIDOS solo nombra archivos que existen');
ok(ORDEN.every((f) => src.indexOf(f) >= 0), 'el orden de referencia solo nombra archivos que existen');
['dist/index.html', 'dist/artifact.html', 'dist/web/index.html'].forEach((f) => {
  const html = fs.readFileSync(path.join(__dirname, f), 'utf8');
  const mods = [...html.matchAll(/\/\* ===== ([\w.]+) ===== \*\//g)].map((m) => m[1]);
  ok(mods.length === new Set(mods).size, `${f}: ningún módulo repetido`);
  const falta = esperados.filter((m) => mods.indexOf(m) < 0), sobra = mods.filter((m) => esperados.indexOf(m) < 0);
  ok(!falta.length, `${f}: están todos los módulos de src/ (faltan: ${falta.join(', ') || 'ninguno'})`);
  ok(!sobra.length, `${f}: no hay módulos de pruebas (sobran: ${sobra.join(', ') || 'ninguno'})`);
  let prev = -1, orden = true;
  mods.forEach((m) => { const i = ORDEN.indexOf(m); if (i < 0) return; if (i < prev) orden = false; prev = i; });
  ok(orden, `${f}: orden de carga correcto (el generador va tras el revisor y antes de los casos y del mundo)`);
});
console.log(fails ? `\n${fails} fallo(s) de ${checks}` : `Construcción: ${checks} comprobaciones OK`);
process.exit(fails ? 1 : 0);
