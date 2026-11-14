# PUESTA EN MARCHA EN CURSOR (para ti, 5 minutos; una sola vez)
1. Descomprime el ZIP y abre en Cursor la carpeta **`detectives/`** (Archivo → Abrir carpeta). Debe ser esa, no la de fuera: así Cursor lee `AGENTS.md` y `.cursor/rules/` solos.
2. Necesitas **Node 18 o superior** (`node -v` en la terminal de Cursor). No hace falta `npm install` (el proyecto no tiene dependencias).
3. Opcional, solo si quieres que corran también las pruebas de navegador: tener Chrome o Chromium instalado. Si no, se saltan solas y no cuentan como fallo.
4. En Cursor: abre el chat, elige el modo **Agente**, el modelo **Composer 2.5**, y activa la **ejecución automática de comandos** (Auto-run / «Run everything» en los ajustes del Agente; con la lista de permitidos vale si incluye `node`, `git`, `npm`, `zip`, `grep`, `sed`, `tail`, `cat`, `ls`, `cp`, `mkdir`, `rm`, `mv`). Sin esto se detendrá a pedirte confirmación en cada comando.
5. Abre `docs/PROMPT_CURSOR.md`, copia su contenido en el chat y envíalo. Ya no tienes que hacer nada más.
6. Mientras trabaja: ve el progreso en `docs/PASOS_IA.md` (líneas `ESTADO:`) y en `git log`. No hace falta que mires el chat.
7. Si Cursor se queda parado esperando algo (por ejemplo, confirmar un comando), pulsa «continuar» o escribe «continúa con el siguiente paso de docs/PASOS_IA.md». No hace falta explicar nada más.
8. Al final, los ZIP de entrega estarán en la carpeta `entregas/` dentro de `detectives/`.
**Sistema operativo:** el proyecto se ha probado en Linux. En Mac funciona igual. En Windows usa WSL o Git Bash; si `tools/cierre.js` falla por rutas `/tmp`, la guía le indica a la IA cómo adaptarse (GUIA §3).
