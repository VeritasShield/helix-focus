# 🎛️ Helix Focus Controller

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Web MIDI](https://img.shields.io/badge/Web_MIDI_API-0078D4?style=for-the-badge&logo=web&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**Helix Focus** es una Progressive Web App (PWA) *Zero-Install* diseñada para guitarristas y productores que utilizan procesadores **Line 6 (Helix, HX Stomp)**. Transforma tu dispositivo móvil o tablet en un Pad XY táctil de alta respuesta para realizar un *Morphing* (interpolación) continuo entre 4 presets (nodos) distintos en tiempo real.

## ✨ Características Principales

- **Interpolación Bilineal y Lerp:** Mezcla parámetros de 4 archivos `.hlx` de forma fluida, sumando un motor de inercia matemática (Lerp) para transiciones de audio "cremosas" y sin saltos abruptos.
- **Offline-First & PWA:** Instalable como aplicación nativa en tu dispositivo. Gracias a su Service Worker, **funciona sin conexión a internet** después de la primera visita.
- **Zero-Install & Cloud-Free:** 100% Vanilla JS. Todo ocurre en el navegador de tu cliente. No requiere instalar drivers adicionales ni software pesado.
- **Optimización MIDI (Anti-Choke):** Sincroniza el envío MIDI con el ciclo de pintado del navegador (`requestAnimationFrame`) y usa una caché de estado para transmitir únicamente *deltas*, evitando colgar el bus USB del hardware.
- **Mobile-First & Gig-Ready:** 
  - Prevención nativa de scroll y rebote táctil en pantallas móviles (`touch-action: none`).
  - **Double-Tap to Center:** Doble toque rápido en el pad para regresar la mezcla al centro (50/50) instantáneamente.
  - **Wake Lock API:** Mantiene la pantalla encendida automáticamente durante tus presentaciones.
  - **Persistencia de Estado:** Guarda tus 4 presets cargados en el `localStorage` para sobrevivir a recargas accidentales.
- **Personalización (Theming):** Archivo `theme.js` expuesto para modificar colores, fondos y cursores PNG sin necesidad de tocar el código fuente principal.
- **Parseo Inteligente:** Lee archivos nativos `.hlx` (estructuras JSON) y extrae dinámicamente el bloque de procesamiento `DSP0`.

---

## 🚀 Uso Rápido (Live)

Dado que la aplicación se apoya en GitHub Pages, puedes usarla directamente desde la web sin descargar nada:

1. Conecta tu procesador Line 6 a tu dispositivo mediante USB (necesitas un adaptador OTG si usas Android).
2. Abre un navegador compatible con **Web MIDI API** (Chrome, Edge, Opera, navegadores de Android).
3. Entra a la URL de GitHub Pages de este repositorio.
4. Haz clic en **"Conectar HX Stomp"** y otorga permisos MIDI.
5. Carga 4 archivos `.hlx` en las 4 esquinas del Pad (Nodos A, B, C y D).
6. ¡Mueve el cursor en el pad para empezar el morphing!

> **⚠️ Nota de Compatibilidad:** La Web MIDI API **no** está soportada de forma nativa en Safari para iOS/iPadOS. Si usas dispositivos Apple móviles, requerirás aplicaciones puente especiales como *Web MIDI Browser*.

---

## 🧮 Cómo Funciona (El Motor Matemático)

El sistema utiliza **Interpolación Bilineal** para calcular el valor de salida de los parámetros hacia el Helix. 
Al mover el cursor, el eje `X` (0.0 - 1.0) pondera la influencia horizontal entre los presets de la izquierda y la derecha. El eje `Y` (0.0 - 1.0) pondera la mezcla vertical.

Esto permite que, si arrastras el cursor hacia el centro absoluto (0.5, 0.5), tu tono de guitarra será un promedio exacto de los 4 archivos `.hlx` cargados.

### Mapa de Controladores (CC Default)
Actualmente el motor extrae e interpola los siguientes parámetros del bloque de amplificador:

| Parámetro       | MIDI CC | Rango  |
|-----------------|---------|--------|
| Drive           | 4       | 0 - 127|
| Bass            | 5       | 0 - 127|
| Mid             | 6       | 0 - 127|
| Treble          | 7       | 0 - 127|
| Presence        | 8       | 0 - 127|
| Master          | 9       | 0 - 127|
| Channel Volume  | 10      | 0 - 127|

---

## 💻 Desarrollo Local

El proyecto no tiene dependencias de Node.js (no hay `package.json` ni procesos de `build`).

### 1. Ejecución
Clona el repositorio y sirve el archivo `index.html` usando cualquier servidor local ligero para evitar problemas de CORS y asegurar el contexto de seguridad (necesario para la Web MIDI API):

```bash
git clone https://github.com/VeritasShield/helix-focus.git
cd helix-focus
# Ejemplo usando Python:
python3 -m http.server 8000
# O usando npx:
npx serve .
```

### 2. Despliegue Automatizado
El repositorio incluye un script Bash (`deploy.sh`) preparado para entornos profesionales. Automatiza la validación de la rama activa, empaqueta los archivos modificados, genera un commit estandarizado y empuja los cambios a GitHub para disparar el CI/CD nativo de GitHub Pages.

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x deploy.sh

# Subir cambios a producción
./deploy.sh
```
*Nota: El script aplica un candado de seguridad y solo permite despliegues desde la rama `main` o `master`.*

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE.md` para más información.

---
*Disclaimer: Este proyecto no está afiliado, asociado, autorizado, respaldado por, ni conectado de ninguna manera oficial con Line 6, Inc. Helix y HX Stomp son marcas registradas de Line 6.*