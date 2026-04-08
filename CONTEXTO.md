# Contexto Técnico: Helix Focus Controller

## Resumen del Proyecto
Aplicación web PWA "Zero-Install" orientada a presentaciones en vivo (Live Gig-Ready). Utiliza **Vanilla JS**, **HTML5** y la **Web MIDI API** para conectarse a procesadores Line 6 (Helix, HX Stomp). Transforma un dispositivo móvil en un Pad XY para interpolar parámetros (Morphing) entre 4 presets simultáneos.

## Arquitectura Actual (As-Is)
- **Motor Lógico:** Carga hasta 4 archivos `.hlx` (Nodos A, B, C, D). Realiza un parseo recursivo del árbol JSON para extraer el bloque `DSP0`. Calcula la mezcla en tiempo real mediante **Interpolación Bilineal**.
- **Rendimiento MIDI (Anti-Choke):** Implementa un motor de inercia (Lerp) atado al ciclo de repintado del navegador (`requestAnimationFrame`). Utiliza una caché de estado (`lastSentCC`) para transmitir únicamente deltas, previniendo la saturación del hardware receptor.
- **UI/UX (Mobile-First):**
  - Prevención de rebote táctil (`touch-action: none`).
  - **PWA / Service Worker:** Soporte Offline total con caché dinámico.
  - **WakeLock API:** Mantiene la pantalla encendida automáticamente.
  - **Mecanismos de Escape:** Doble toque en el Pad para auto-centrar (Reset 50/50).
  - **Customización Visual:** Soporte para temas externos e imágenes custom mediante el puente `theme.js`.

## Stack Tecnológico
- **Frontend Core:** HTML5, CSS3 Variables, Vanilla JS (ES6+).
- **Web APIs:** Web MIDI API, Service Workers, Web App Manifest, WakeLock API, LocalStorage, FileReader API.
- **CI/CD:** Bash nativo (`deploy.sh`) con inyección dinámica de versión para invalidación de caché.
- **Dependencias Externas:** Cero.

## Hitos Arquitectónicos Completados
- [x] Refactorización de parseo (Regex -> Árbol Recursivo).
- [x] Soporte para los 4 cuadrantes del Pad.
- [x] Despliegue en GitHub Pages automatizado.
- [x] Persistencia de estado en memoria local para resiliencia ante recargas.

## Mapa de Controladores (CC Default)
- 4: Drive
- 5: Bass
- 6: Mid
- 7: Treble
- 8: Presence
- 9: Master
- 10: Channel Volume
