// Hoja de muestras de AMBIENTES (4C-4a): para cada tono, un caso `inquietante` y uno `macabro` (misma semilla, así se ve la diferencia con el `claro`).
// Uso: node tools/muestra_mood.js → escribe docs/MUESTRA_AMBIENTES.md
const fs = require('fs'), path = require('path');
const G = require('./load_g.js')(['bible.js', 'gen_data.js', 'gen_truth.js', 'gen_clues.js', 'compile.js']);
const tones = ['noir', 'telenovela', 'documental', 'western', 'espias', 'cuento'];
const L = (x) => '> ' + String(x).replace(/\n/g, ' ');
const first = (npc, id) => { const t = npc && npc.topics.find((x) => x.id === id); return t ? t.responses[0][0] : null; };
let out = '# MUESTRA DE AMBIENTES (4C-4a)\nPara cada tono, un caso **inquietante** y uno **macabro**. Entre cada pareja, el caso `claro` de la misma semilla tendría los mismos hechos con textos normales. Cada frase oscura va seguida de su remate gracioso. Los hechos (pistas, mentiras, solución) NO cambian con el ambiente.\n';
tones.forEach((tn) => {
  let seed = 0; for (let s = 1; s < 800 && !seed; s++) { const r = G.generateCase(s, { mood: 'claro' }); if (r.def && r.def.tone === tn) seed = s; }
  out += `\n---\n## Tono: ${tn} (semilla ${seed})\n`;
  ['inquietante', 'macabro'].forEach((mo) => {
    const d = G.generateCase(seed, { mood: mo }).def, cli = d.npcs[d.clientId];
    const raros = Object.keys(d.npcs).filter((k) => k !== d.clientId && k !== 'aliado' && !d.npcs[k].cat && first(d.npcs[k], 'f_raro'));
    out += `\n### ${mo.toUpperCase()} · «${d.title}»\n**Sinopsis:** ${d.blurb}\n\n**El cliente (${cli.name}) saluda:**\n${L(cli.first.join(' '))}\n\n**…y cuenta el caso:**\n${L(first(cli, 'caso'))}\n`;
    raros.slice(0, 2).forEach((k) => { out += `\n**${d.npcs[k].name} («¿Ha notado algo raro?»):**\n${L(first(d.npcs[k], 'f_raro'))}\n`; });
    if (d.npcs.aliado && first(d.npcs.aliado, 'a_noche')) out += `\n**${d.npcs.aliado.name} (aliado de policía):**\n${L(first(d.npcs.aliado, 'a_noche'))}\n`;
    const e = d.epilogue.win.slice(-1)[0]; out += `\n**Última línea del final feliz (${e.who}):**\n${L(e.text)}\n`;
  });
});
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'MUESTRA_AMBIENTES.md'), out);
console.log('docs/MUESTRA_AMBIENTES.md escrito (' + out.length + ' caracteres)');
