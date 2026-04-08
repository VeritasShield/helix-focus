# Contexto Técnico: Helix Focus Controller

## Resumen del Proyecto
Aplicación web "Zero-Install" que utiliza **Vanilla JS**, **HTML5** y la **Web MIDI API** para conectarse bidireccionalmente a procesadores de guitarra Line 6 (Helix, HX Stomp). El objetivo principal es ofrecer un pad XY para interpolar parámetros entre múltiples presets.

## Estado Actual (As-Is)
- **UI/UX:** Interfaz adaptada para móviles con prevención de scroll (`touch-action: none`, `100dvh`). Contiene un solo botón de carga de archivos y un canvas XY simulado con `div`s.
- **Lógica Core:** Lee archivos `.hlx` (que son estructuras JSON), extrae parámetros específicos (Drive, Bass, Treble, etc.) mediante RegEx y envía mensajes de `Control Change (CC)` de 7 bits (0-127) mediante Web MIDI.
- **Discrepancia de Funcionalidad:** La documentación indica un blend de 4 presets (A, B, C, D), pero el código actual solo admite cargar 1 archivo base y modifica los parámetros de forma algorítmica y rígida según la posición (x, y) del pad.

## Stack Tecnológico
- **Frontend:** HTML5, CSS3, JavaScript (ES6+).
- **APIs Clave:** `navigator.requestMIDIAccess()` para comunicación de hardware; `FileReader` para lectura del sistema de archivos local.
- **Dependencias Externas:** Ninguna (100% Nativo).

## Deuda Técnica y Roadmap Inmediato
1. **Refactorización de Parseo:** Eliminar el uso de expresiones regulares (`RegExp`) sobre strings JSON parseados. Iterar directamente el árbol de propiedades del JSON del `.hlx` para extraer los valores del bloque `DSP0`.
2. **Implementación Multi-Preset:** Escalar la variable `baseParams` a un array u objeto que pueda almacenar el estado de los 4 nodos (Arriba-Izq, Arriba-Der, Abajo-Izq, Abajo-Der).
3. **Algoritmo de Interpolación:** Implementar Interpolación Bilineal para mezclar suavemente los parámetros de los 4 presets según las coordenadas normalizadas `(0.0 - 1.0)` del cursor XY.
4. **Optimización de Rendimiento:** Implementar una función `throttle` o atar el evento `pointermove` a un `requestAnimationFrame` para limitar la tasa de envío de paquetes MIDI y prevenir el *MIDI Choke* en el dispositivo hardware.

## Mapa de Controladores (CC Default)
- 4: Drive
- 5: Bass
- 6: Mid
- 7: Treble
- 8: Presence
- 9: Master
- 10: Channel Volume
- 11: Mix
- 12: Decay