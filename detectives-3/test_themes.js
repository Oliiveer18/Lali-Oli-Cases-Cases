// test_themes.js — 4F-0a: el marco de temáticas (datos de gen_themes.js) es coherente. Sin navegador. Con mutaciones: cada mutación debe ser detectada.
const loadG = require('./tools/load_g.js');
const EXTRA = ['bible.js', 'gen_data.js'];
let ok = 0, bad = 0;
const t = (c, m) => { if (c) ok++; else { bad++; console.log('  ✗ ' + m); } };
const G = loadG(EXTRA);
const errs = G.checkThemes();
t(errs.length === 0, 'las tablas son coherentes: ' + errs.join(' | '));
t(G.THEME_IDS.join() === 'robo,sabotaje,concurso,impostor,sobrenatural,desaparecido', 'las 6 temáticas, en el orden oficial');
t(Object.keys(G.SCENARIOS).length === 9, '9 escenarios');
// cada escenario sirve a 2 temáticas y cada temática tiene 3 escenarios (18 casillas)
t(Object.keys(G.SCENARIOS).every((s) => G.scenarioThemes(s).length === 2), 'cada escenario sirve a exactamente 2 temáticas');
t(G.THEME_IDS.reduce((a, k) => a + G.THEMES[k].scenarios.length, 0) === 18, '18 casillas (6 × 3)');
// la tabla oficial de FICHAS_TEMATICAS §5
const TABLA = { robo: 'panaderia,museo,mercado', sabotaje: 'teatro,cine,parque', concurso: 'panaderia,circo,granja', impostor: 'mansion,circo,cine', sobrenatural: 'museo,mansion,teatro', desaparecido: 'granja,parque,mercado' };
Object.keys(TABLA).forEach((k) => t(G.THEMES[k].scenarios.join() === TABLA[k], 'escenarios de ' + k + ' = tabla oficial'));
// hoy solo Robo + panadería están listos; Desaparecido va después del HITO y su objetivo (localizar) no existe aún
t(G.readyThemes().join() === 'robo', 'solo Robo está lista');
t(G.readyScenarios('robo').join() === 'panaderia', 'de Robo solo la panadería está lista');
t(G.THEMES.desaparecido.afterHito === true && G.GOALS.localizar.ready === false, 'Desaparecido y «localizar» quedan para después del HITO');
t(G.themeFromLetter('') === 'robo' && G.themeFromLetter(undefined) === 'robo' && G.themeFromLetter('s') === 'sabotaje' && G.themeFromLetter('z') === null, 'letras de código');
// Robo conserva EXACTAMENTE los pesos de ambiente de siempre (si no, cambiarían los casos de los códigos G6)
const mw = require('fs').readFileSync(require('path').join(__dirname, 'src', 'compile.js'), 'utf8').match(/G\.MOOD_WEIGHTS = \{ claro: (\d+), inquietante: (\d+), macabro: (\d+) \}/);
t(mw && +mw[1] === G.THEMES.robo.mood.claro && +mw[2] === G.THEMES.robo.mood.inquietante && +mw[3] === G.THEMES.robo.mood.macabro, 'Robo = pesos de ambiente actuales de compile.js');
// consultas con basura no lanzan
t(G.themeReady('nada') === false && G.themeScenarios('nada').length === 0 && G.themeMoodWeights('nada').claro === 50, 'consultas con id desconocido');

// ---- mutaciones: cada una rompe una tabla y checkThemes debe quejarse
const MUT = [
  ['escenario repetido en una temática', (T) => { T.THEMES.robo.scenarios[1] = 'panaderia'; }],
  ['escenario inexistente', (T) => { T.THEMES.sabotaje.scenarios[0] = 'castillo'; }],
  ['letra repetida', (T) => { T.THEMES.concurso.letter = 's'; }],
  ['Robo con letra', (T) => { T.THEMES.robo.letter = 'r'; }],
  ['pesos que no suman 100', (T) => { T.THEMES.impostor.mood.claro = 10; }],
  ['tono inexistente', (T) => { T.THEMES.sobrenatural.tones = ['rap']; }],
  ['objetivo inexistente', (T) => { T.THEMES.desaparecido.goal = 'huir'; }],
  ['escenario que sirve a 3 temáticas', (T) => { T.THEMES.sabotaje.scenarios[2] = 'panaderia'; }],
  ['falta una temática', (T) => { delete T.THEMES.desaparecido; T.THEME_IDS = Object.keys(T.THEMES); }],
];
MUT.forEach(([name, f]) => { const g = loadG(EXTRA); f(g); t(g.checkThemes().length > 0, 'mutación NO detectada: ' + name); });
console.log(bad ? `test_themes: ${bad} fallo(s) de ${ok + bad}` : `test_themes: ${ok} comprobaciones OK (${MUT.length} mutaciones detectadas)`);
process.exit(bad ? 1 : 0);
