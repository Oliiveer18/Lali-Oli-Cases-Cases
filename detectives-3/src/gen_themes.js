// gen_themes.js — MARCO DE TEMÁTICAS (4F-0a): solo DATOS y consultas. No toca nada del generador por sí solo.
// Qué es cada cosa: docs/FICHAS_TEMATICAS.md (temáticas), docs/ESCENARIOS.md (escenarios y tabla), docs/VARIEDAD.md.
// Regla de oro: hasta que una temática o un escenario tenga `ready: true` el generador NO los usa; hoy solo Robo + panadería están listos
// y TODO caso sale como { theme: 'robo', goal: 'acusar', scenario: 'panaderia' } (los códigos G6-xxxx de antes dan el mismo caso).
(function (root) {
  'use strict';
  const G = root.G;

  // Tipos de objetivo final. Hasta el HITO solo existe «acusar»; «localizar» llega con Desaparecido (4T-6, después del HITO).
  G.GOALS = { acusar: { name: 'Acusar al culpable', ready: true }, localizar: { name: 'Localizar a quien falta', ready: false } };

  // Escenarios (ESCENARIOS.md §3-§4): 9, de 6 salas cada uno. `rooms` = salas hechas hoy (la panadería tiene 5; la 6.ª se decide en 4H-0).
  G.SCENARIOS = {
    panaderia: { name: 'La panadería', rooms: 5, ready: true, step: 'hecho' },
    museo: { name: 'El museo', rooms: 0, ready: false, step: '4H-0' },
    teatro: { name: 'El teatro', rooms: 0, ready: false, step: '4H-1' },
    cine: { name: 'El cine', rooms: 0, ready: false, step: '4H-1' },
    circo: { name: 'El circo', rooms: 0, ready: false, step: '4H-1' },
    mansion: { name: 'La mansión', rooms: 0, ready: false, step: '4H-1' },
    mercado: { name: 'El mercado', rooms: 0, ready: false, step: '4H-2' },
    granja: { name: 'La granja', rooms: 0, ready: false, step: '4H-2' },
    parque: { name: 'El parque de atracciones', rooms: 0, ready: false, step: '4H-2' },
  };

  // Temáticas (FICHAS_TEMATICAS.md §4-§5). `letter` va en el código del caso (Robo no lleva letra: G6-xxxx = Robo).
  // `mood` = pesos [claro, inquietante, macabro] (ESCENARIOS.md §7; Robo = los pesos de siempre, 50/32/18).
  // `tones` = tonos recomendados (ids de GEN_DATA.compile.tones); el generador elige uno al azar de la semilla (no es un mando del menú).
  // `step` = paquete que la deja lista; `afterHito` = no se construye antes del HITO.
  G.THEMES = {
    robo: { letter: '', name: 'Robo', about: 'Desaparece un objeto absurdo; hay que averiguar quién se lo llevó.', goal: 'acusar',
      scenarios: ['panaderia', 'museo', 'mercado'], mood: { claro: 50, inquietante: 32, macabro: 18 }, tones: ['noir', 'telenovela', 'documental', 'western', 'espias', 'cuento'], ready: true, step: '4T-1' },
    sabotaje: { letter: 's', name: 'Sabotaje', about: 'Algo aparece roto; hay que averiguar quién, cómo y en qué orden.', goal: 'acusar',
      scenarios: ['teatro', 'cine', 'parque'], mood: { claro: 88, inquietante: 12, macabro: 0 }, tones: ['telenovela', 'documental', 'cuento', 'western'], ready: false, step: '4T-2' },
    concurso: { letter: 'c', name: 'Concurso amañado', about: 'Alguien hizo trampa en un concurso; hay que acusarle y explicar la trampa.', goal: 'acusar',
      scenarios: ['panaderia', 'circo', 'granja'], mood: { claro: 90, inquietante: 10, macabro: 0 }, tones: ['telenovela', 'documental', 'cuento', 'espias'], ready: false, step: '4T-3' },
    impostor: { letter: 'i', name: 'Impostor', about: 'Alguien no es quien dice ser; hay que desenmascararlo.', goal: 'acusar',
      scenarios: ['mansion', 'circo', 'cine'], mood: { claro: 35, inquietante: 50, macabro: 15 }, tones: ['noir', 'espias', 'telenovela', 'western'], ready: false, step: '4T-4' },
    sobrenatural: { letter: 'n', name: '¿Sobrenatural?', about: 'Apariciones y ruidos con una explicación muy poco fantasmal.', goal: 'acusar',
      scenarios: ['museo', 'mansion', 'teatro'], mood: { claro: 5, inquietante: 55, macabro: 40 }, tones: ['noir', 'cuento', 'documental'], ready: false, step: '4T-5' },
    desaparecido: { letter: 'd', name: 'Desaparecido', about: 'Falta una mascota o una persona; hay que localizarla.', goal: 'localizar',
      scenarios: ['granja', 'parque', 'mercado'], mood: { claro: 55, inquietante: 45, macabro: 0 }, tones: ['documental', 'cuento', 'western', 'noir'], ready: false, step: '4T-6', afterHito: true },
  };
  G.THEME_IDS = Object.keys(G.THEMES);
  G.DEFAULT_THEME = 'robo';
  G.DEFAULT_SCENARIO = 'panaderia';
  G.DEFAULT_GOAL = 'acusar';

  // ---- consultas
  G.themeOk = (id) => Object.prototype.hasOwnProperty.call(G.THEMES, id);
  G.themeReady = (id) => !!(G.themeOk(id) && G.THEMES[id].ready && G.GOALS[G.THEMES[id].goal].ready && G.THEMES[id].scenarios.some((s) => G.SCENARIOS[s].ready));
  G.readyThemes = () => G.THEME_IDS.filter(G.themeReady);
  G.themeScenarios = (id) => (G.themeOk(id) ? G.THEMES[id].scenarios.slice() : []);
  G.readyScenarios = (id) => G.themeScenarios(id).filter((s) => G.SCENARIOS[s].ready);
  // temática de una letra de código (''/undefined = Robo); null si no existe
  G.themeFromLetter = (ch) => { ch = String(ch || '').toLowerCase(); const k = G.THEME_IDS.filter((t) => G.THEMES[t].letter === ch); return k.length ? k[0] : null; };
  // temáticas de un escenario (cada escenario sirve a exactamente dos)
  G.scenarioThemes = (sc) => G.THEME_IDS.filter((t) => G.THEMES[t].scenarios.indexOf(sc) >= 0);
  // pesos de ambiente de una temática (Robo = G.MOOD_WEIGHTS de siempre); { claro, inquietante, macabro }
  G.themeMoodWeights = (id) => Object.assign({}, G.themeOk(id) ? G.THEMES[id].mood : G.THEMES[G.DEFAULT_THEME].mood);

  // Comprueba la coherencia de todas las tablas (lo usa test_themes.js). Devuelve la lista de errores (vacía = bien).
  G.checkThemes = () => {
    const e = [], letters = {};
    G.THEME_IDS.forEach((t) => {
      const T = G.THEMES[t];
      if (T.letter !== '' && !/^[a-z]$/.test(T.letter)) e.push(t + ': letra no válida');
      if (letters[T.letter]) e.push(t + ': letra repetida con ' + letters[T.letter]); letters[T.letter] = t;
      if (!G.GOALS[T.goal]) e.push(t + ': objetivo desconocido ' + T.goal);
      if (T.scenarios.length !== 3 || new Set(T.scenarios).size !== 3) e.push(t + ': debe tener 3 escenarios distintos');
      T.scenarios.forEach((s) => { if (!G.SCENARIOS[s]) e.push(t + ': escenario desconocido ' + s); });
      const mw = T.mood, tot = (mw.claro || 0) + (mw.inquietante || 0) + (mw.macabro || 0);
      if (tot !== 100) e.push(t + ': los pesos de ambiente suman ' + tot + ' (deben sumar 100)');
      G.MOODS.forEach((m) => { if (!(mw[m] >= 0)) e.push(t + ': falta el peso de ' + m); });
      if (!T.tones.length) e.push(t + ': sin tonos');
      if (G.GEN_DATA && G.GEN_DATA.compile) { const ids = G.GEN_DATA.compile.tones.map((x) => x.id); T.tones.forEach((x) => { if (ids.indexOf(x) < 0) e.push(t + ': tono desconocido ' + x); }); }
    });
    if (G.THEMES.robo.letter !== '') e.push('Robo no debe llevar letra (los códigos G6-xxxx son Robo)');
    Object.keys(G.SCENARIOS).forEach((s) => { const n = G.scenarioThemes(s).length; if (n !== 2) e.push(s + ': sirve a ' + n + ' temáticas (deben ser 2)'); });
    if (G.THEME_IDS.length !== 6) e.push('debe haber 6 temáticas');
    if (Object.keys(G.SCENARIOS).length !== 9) e.push('debe haber 9 escenarios');
    if (G.THEMES[G.DEFAULT_THEME].scenarios.indexOf(G.DEFAULT_SCENARIO) < 0) e.push('el escenario por defecto no es de la temática por defecto');
    return e;
  };
})(typeof window !== 'undefined' ? window : globalThis);
