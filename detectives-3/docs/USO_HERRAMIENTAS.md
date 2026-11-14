# USO DE HERRAMIENTAS POR CASO (25 oct, cp. 231) · medido y objetivo
Medido (`GENV=7 node tools/senuelos_c4.js 100`, estado entregado = señuelos con UV APAGADOS; pasos por caso = sostén + señuelos; aproximado desde los porcentajes):
| Herramienta (quién) | Fácil | Normal | Difícil |
|---|---|---|---|
| Lupa (Oli) | 2,25 | 2,47 | 2,66 |
| Ganzúa (Oli) | 0,67 | 0,67 | 0,74 |
| UV (Lali) | 1,40 | 1,35 | 1,49 |
| Grabadora (Lali) | 0,72 | 0,90 | 1,03 |
| Sigilo | 0,55 | 0,59 | 0,60 |
Oli hace 56-57 % de los pasos y 50 % del tiempo (banda 40-60 OK). Con los señuelos UV encendidos la lupa sube a 2,67 · 3,50 · 4,10 (`INFORME_SENUELOS_C4_PASO2B2.txt` §2).

## DECISIÓN DEL USUARIO (25 oct): QUITAR lupa y DAR a las demás
La lupa es la herramienta más usada y debe BAJAR; ganzúa, UV y grabadora deben SUBIR. Equilibradas aunque no iguales; ninguna abusiva; un mínimo no alcanzado deja el paso ABIERTO (METODO_DE_TRABAJO §4).
**BANDAS CONFIRMADAS por el usuario (25 oct, cp. 233; en datos con mín./máx./pesos, regla R1):** lupa 1,7-2,2 · ganzúa 1,0-1,5 · UV 1,7-2,3 · grabadora 1,0-1,5 por caso (**cambio 26 oct, cp. 241: grabadora 1,0-2,0**, en `herr2.bandas`) (sumas: Oli ≈ 3,2 · Lali ≈ 3,2; banda 40-60 % en pasos y tiempo; techo 45 min; 0 atascos).

## Cómo se llega (2b-4, en subpasos pequeños, ZIP tras cada uno)
1. Recorte de lupa: `freeLupa` hoy libera solo si Oli > 1,5 × Lali; cambiar a un TOPE de lupa por nivel en datos (libera primero las de señuelo, luego las de sostén) y que no dependa de los pasos de Lali.
2. Encender `herr2.uvSenuelos` (ya hecho y probado) y subir ganzúa/UV/grabadora hacia su mínimo: relajar `okGate` para la UV (A) o más documentos en la biblia (B, cambia receta: pide permiso); más charlas con pista para la grabadora.
3. Remedir ≥ 100 casos por nivel con esta tabla y la duración/calidad de CADA nivel.
Recomendación: hacer 2b-4 ANTES de 2b-3 (los señuelos con ganzúa añaden pasos a Oli y complican el recorte); requiere que el usuario lo autorice.
