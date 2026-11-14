// muestra.js — genera docs/MUESTRA_CASOS.md: 6 casos (uno por tono) tal como los vería el jugador (saludos, temas, presionar, pruebas, epílogo).
// Uso: node tools/muestra.js   (escribe docs/MUESTRA_CASOS.md)
const fs = require('fs'), path = require('path');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js', 'report.js']);
const say = (x) => (Array.isArray(x) ? x : (x && x.say) || []).join(' ');
const want = ['noir', 'telenovela', 'documental', 'western', 'espias', 'cuento'], picked = {};
for (let s = 100; s < 3000 && Object.keys(picked).length < want.length; s++) {
  const r = G.generateCase(s); if (r.error) continue;
  const t = r.def.tone; if (picked[t] || want.indexOf(t) < 0) continue;
  if (!(r.bible.deceptive || []).length || r.bible.lies.length < 2) continue; // que tenga engañoso y mentirosos para enseñar sus reacciones
  picked[t] = { seed: s, r };
}
const out = [`# MUESTRA DE CASOS GENERADOS · Lali & Oli Cases v${G.VERSION}`, '',
  'Seis casos de la fábrica (fase 4B parte 2), **uno por tono**, tal como los vería el jugador: título, sinopsis, lo que dice cada personaje, cómo reacciona al presionar y ante las pruebas, y el final. Cada caso trae su **tono** (cine negro, telenovela, documental, western, espías, cuento) con su gag propio.', '',
  '**Cómo leerlos:** dime qué frases te hacen gracia, cuáles aburren o suenan raras, y si algún tono sobra o falta. Con eso se ajustan los bancos de `src/gen_data.js` (`G.GEN_DATA.compile`).', '', '---', ''];
want.forEach((t, k) => {
  const p = picked[t]; if (!p) return;
  const { r, seed } = p, d = r.def, b = r.bible, tr = b.truth;
  const nm = (id) => (b.cast.find((c) => c.id === id) || { name: id }).name;
  out.push(`## Caso ${k + 1} · tono: ${t} · semilla ${seed} · código ${r.code}`, '', `**${d.title}** — cliente: ${d.client}`, '', `> ${d.blurb}`, '');
  out.push(`Reparto: ${b.cast.map((c) => `${c.name} (${c.trait}${c.id === tr.culprit ? ', CULPABLE' : ''}${(b.deceptive || []).some((x) => x.who === c.id) ? ', engañoso' : ''}${b.lies.some((l) => l.who === c.id && c.id !== tr.culprit) ? ', miente' : ''})`).join(' · ')}.`, '');
  Object.keys(d.npcs).forEach((id) => {
    const n = d.npcs[id], cu = id === tr.culprit;
    out.push(`### ${n.name} (${n.title})`, '', `- **Saludo:** ${n.first[0]}`);
    n.topics.forEach((tp) => out.push(`- **«${tp.label}»** → ${tp.responses.map(say).join(' / ')}`));
    out.push(`- **Charla:** ${n.chat.slice(0, 2).map(say).join(' / ')} …`);
    out.push(`- **Presionar:** ${n.press.map((e) => say(e) + (e.when ? ' (con la presión alta)' : '')).join(' · ')}`);
    const keys = Object.keys(n.evidence).filter((k) => k !== '*');
    if (keys.length) out.push(`- **Ante las pruebas:** ` + keys.slice(0, 2).map((k) => `(${d.clues[k] ? d.clues[k].title : k}) ${say(n.evidence[k][0])}`).join(' · '));
    out.push('');
  });
  out.push('**Final:** ' + d.epilogue.win.map((l) => l.text).join(' '), '', '---', '');
});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'MUESTRA_CASOS.md'), out.join('\n'));
console.log('MUESTRA_CASOS.md: ' + Object.keys(picked).length + ' casos (' + Object.keys(picked).join(', ') + ')');
