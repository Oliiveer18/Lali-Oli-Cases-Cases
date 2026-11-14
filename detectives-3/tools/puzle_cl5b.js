// puzle_cl5b.js — CL-5b subpaso 3 (SOLO MEDIR; nada de src/ cambia): ¿cuántos minutos HUMANOS (bot × 1,7, partida completa) suma 1-2 pasos tipo puzle (código / línea de tiempo) en Difícil v7?
// Uso: GENV=7 node tools/puzle_cl5b.js [N=60] [nivel=dificil]
// Método: genera N casos con la receta v7 y, SOBRE UNA COPIA en memoria, convierte las primeras k curiosidades (`cur_N`, paso sin pista) en pasos con minijuego (`mini`): código (4 cifras) o línea de tiempo (3 sucesos).
// El bot cuenta CFG.mini = 25 s (código) y 30 s (línea de tiempo) por paso (bot.js). Variantes: base · +1 código · +1 línea · +2 (código + línea) · +2 códigos. Mismas semillas en todas.
// Comprueba también que cada variante pasa G.validateCase (esquema del minijuego) y que el bot sigue ganando. Informe: /tmp/puzle_cl5b.json
const fs = require('fs');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'fingerprint.js']);
G.GEN_VERSION = +process.env.GENV || 7;
const args = process.argv.slice(2), N = +args[0] > 0 ? +args[0] : 60, L = args.find((a) => /^(facil|normal|dificil)$/.test(a)) || 'dificil';
const clone = (x) => JSON.parse(JSON.stringify(x));
const stat = (a) => { const s = a.slice().sort((x, y) => x - y), m = (x) => Math.round(x * 10) / 10; return { n: a.length, med: m(s[s.length >> 1]), media: m(a.reduce((x, y) => x + y, 0) / a.length), min: m(s[0]), max: m(s[s.length - 1]), p90: m(s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]) }; };
const MINI = {
  code: () => ({ type: 'code', code: '0412', title: 'Candado de cuatro cifras', hint: 'Cuatro cifras. Alguien lo apuntó en algún sitio...' }),
  timeline: () => ({ type: 'timeline', verb: 'Ordenar', icon: 'ico_clue', title: 'La noche, paso a paso', hint: 'Toca los sucesos de lo más antiguo a lo más reciente.', events: [{ text: 'Primer suceso', time: '22:00' }, { text: 'Segundo suceso', time: '23:00' }, { text: 'Tercer suceso', time: '00:30' }] }),
};
const VARS = { base: [], '+1 código': ['code'], '+1 línea de tiempo': ['timeline'], '+2 (código + línea)': ['code', 'timeline'], '+2 códigos': ['code', 'code'] };
function variante(def, tipos) {
  const d = clone(def); let k = 0;
  Object.keys(d.rooms).forEach((rid) => (d.rooms[rid].props || []).forEach((p) => { if (k < tipos.length && /^cur_/.test(p.id) && p.steps && p.steps.length === 1 && !p.steps[0].clue && !p.steps[0].mini) p.steps[0].mini = MINI[tipos[k++]](); }));
  return { d, puestos: k };
}
const seeds = []; for (let i = 1; i < 2000 && seeds.length < N; i++) { const sd = i * 7919 + 1, r = G.generateCase(sd, { register: true, level: L }); if (!r.error && r.def.genLevel === L) seeds.push([sd, r.def]); }
const out = { N: seeds.length, nivel: L, genV: G.GEN_VERSION, vars: {} };
console.log(`CL-5b · pasos tipo puzle (SOLO MEDIR) · ${L} · GEN_VERSION ${G.GEN_VERSION} · N=${seeds.length} · minutos HUMANOS = bot × 1,7 · Δ = mediana − base\n`);
Object.keys(VARS).forEach((nombre) => {
  const mins = [], q = []; let bad = 0, inval = 0, sinSitio = 0, over = 0;
  seeds.forEach(([sd, def]) => {
    const { d, puestos } = variante(def, VARS[nombre]); if (puestos < VARS[nombre].length) sinSitio++;
    const v = G.validateCase(d); if (v && v.errors && v.errors.length) inval++;
    const x = G.qualityCase(d), b = x.bot || {}; if (!b.win || b.stuck) bad++; if (b.humanMinutes > 45) over++; mins.push(b.humanMinutes); q.push(x.quality);
  });
  const s = stat(mins), base = out.vars.base ? out.vars.base.min.med : s.med, dl = Math.round((s.med - base) * 10) / 10;
  out.vars[nombre] = { min: s, calidad: stat(q), sobre45: over, atascosODerrotas: bad, invalidos: inval, sinSitio };
  console.log(`${nombre.padEnd(22)} med ${String(s.med).padStart(5)} (Δ ${(dl >= 0 ? '+' : '') + dl}) · media ${s.media} · ${s.min}–${s.max} · p90 ${s.p90} · >45: ${over} · atascos/derrotas ${bad} · inválidos ${inval} · sin sitio ${sinSitio} · calidad ${out.vars[nombre].calidad.min}/${out.vars[nombre].calidad.media}/${out.vars[nombre].calidad.max}`);
});
fs.writeFileSync('/tmp/puzle_cl5b.json', JSON.stringify(out, null, 1)); console.log('\nInforme: /tmp/puzle_cl5b.json');
