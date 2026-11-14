// elegir_mp.js — MP: busca semillas de prueba para la mini-prueba. Uso: node tools/elegir_mp.js [nivel=facil] [cuantas=5] [tope=400]
// Criterios (SESION.md «Paso MP»): NO la 74937935; el nivel sale NATURAL de la semilla (generateCase(seed) sin opciones, así el código G5-… basta para reproducirlo);
// calidad > 80, ≥ 20 min, 0 atascos, gana, huella única entre las candidatas, ambiente «claro», tono distinto de los extremos de duración (no caso límite: 21,5-26 min).
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
const args = process.argv.slice(2), LEVEL = args[0] || 'facil', WANT = +args[1] || 5, MAX = +args[2] || 400;
const seen = new Set(), out = [];
for (let i = 0; i < MAX && out.length < WANT; i++) {
  const seed = i * 7919 + 1; if (seed === 74937935) continue;
  const r = G.generateCase(seed); if (r.error || r.def.genLevel !== LEVEL) continue;
  const f = G.caseFingerprint(r.def, r.bible), fk = JSON.stringify(f); if (seen.has(fk) || f.mood !== 'claro') continue;
  const Q = G.qualityCase(r.def); if (!Q.ok || Q.quality <= 80 || !Q.bot.win || Q.bot.stuck || Q.bot.humanMinutes < 21.5 || Q.bot.humanMinutes > 26) continue;
  seen.add(fk); out.push({ seed, code: r.code, nivel: Q.level, nota: Q.quality, minutos: Q.bot.humanMinutes, tono: f.tone, ambiente: f.mood, mecanicas: f.mechanic, titulo: r.def.title });
}
console.log(JSON.stringify(out, null, 1));
