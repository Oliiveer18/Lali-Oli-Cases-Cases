#!/usr/bin/env python3
# Parches ya verificados para cerrar 4C-4c-1 (pasos 1, 2 y 3 de docs/CIERRE_4C-4C-1.md). Uso (desde detectives/): python3 tools/cierre_4c4c1_parches.py
# Es idempotente: si un parche ya está aplicado lo dice y sigue. No toca nada más.
import io, sys
def rw(p, old, new, tag):
    s = io.open(p, encoding='utf8').read()
    if new in s: print('YA APLICADO:', tag); return
    if old not in s: print('NO ENCUENTRO EL TEXTO ANTIGUO:', tag); sys.exit(1)
    io.open(p, 'w', encoding='utf8').write(s.replace(old, new, 1)); print('OK:', tag)

# 1) test_mood.js: los HECHOS no incluyen el matiz que 4C-4c-1 pega al final del texto de las pistas (las salas copian ese texto)
rw('test_mood.js',
   "const facts = (d) => JSON.stringify([d.solution, noText(d.clues), d.lies, d.suspects, noAtmos(d.rooms), d.placement, d.chapters, Object.keys(d.npcs)]);",
   "const MZ = []; Object.values(G.GEN_DATA.clueTpl.matiz).forEach((o) => Object.values(o).forEach((a) => a.forEach((p) => MZ.push(JSON.stringify(' ' + p[0] + ' ' + p[1]).slice(1, -1)))));\n"
   "const noMatiz = (s) => MZ.reduce((a, m) => a.split(m).join(''), s); // las salas COPIAN el texto de la pista, y ahí sí aparece el matiz (solo texto, no es un hecho)\n"
   "const facts = (d) => noMatiz(JSON.stringify([d.solution, noText(d.clues), d.lies, d.suspects, noAtmos(d.rooms), d.placement, d.chapters, Object.keys(d.npcs)]));",
   'test_mood.js · facts() sin matiz')


# 1b) test_mood.js: al quitar los objetos de ambiente de `decor`/`decals` pueden quedar listas VACÍAS que en otro ambiente no existen; una lista vacía y una lista ausente son lo mismo
rw('test_mood.js',
   "(Array.isArray(v) && ['props', 'decals', 'decor'].indexOf(k) >= 0 ? v.filter((q) => !(q && (q.id === 'amb_silla' || ATS.has(q.sprite)))) : v)",
   "(Array.isArray(v) && ['props', 'decals', 'decor'].indexOf(k) >= 0 ? ((f) => (f.length || k === 'props' ? f : undefined))(v.filter((q) => !(q && (q.id === 'amb_silla' || ATS.has(q.sprite))))) : v)",
   'test_mood.js · noAtmos sin listas vacías')

# 2) test_police.js: desde 4C-4b el generador también usa decal_stain y decal_jam (manchas de ambiente)
rw('test_police.js',
   "const allowed = ['police_car_0', 'cone', 'station_counter', 'interrogation_table', 'clue_board']",
   "const allowed = ['police_car_0', 'cone', 'station_counter', 'interrogation_table', 'clue_board', 'decal_stain', 'decal_jam']",
   'test_police.js · allowed con las manchas de 4C-4b')
rw('test_police.js',
   "ok('desde 4C-3b-2 el generador usa este arte SOLO en la escena del aliado (coche, cono, mostrador, mesa, tablón y aspectos de policía); nada más (celda, cinta, cartel) todavía'",
   "ok('el generador usa este arte SOLO en la escena del aliado (coche, cono, mostrador, mesa, tablón y aspectos de policía) y en las manchas de ambiente de 4C-4b (decal_stain, decal_jam); nada más (celda, cinta, cartel) todavía'",
   'test_police.js · texto de la comprobación')

# 3) test_atmos.js: ya no es cierto que GEN_VERSION no se toque (4C-4c-1 lo sube a 5); la prueba pasa a comprobar que el baseline está recalculado
rw('test_atmos.js',
   "ok('GEN_VERSION no se toca en 4C-4b', G.GEN_VERSION ===",
   "ok('docs/BASELINE.json está recalculado con el GEN_VERSION actual (si falla: node tools/baseline.js --write)', G.GEN_VERSION ===",
   'test_atmos.js · texto y sentido de la comprobación')
