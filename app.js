// --- LÓGICA INTERNA ---
const CC_MAP = { "Drive": 4, "Bass": 5, "Mid": 6, "Treble": 7, "Presence": 8, "ChVol": 10, "Master": 9 };
let midiOut = null;
let presets = [null, null, null, null]; // [TL, TR, BL, BR]
let lastSentCC = {}; // Caché para evitar saturación MIDI
const STORAGE_KEY = 'helix_focus_presets';
const NODE_LABELS = ["A (Arr-Izq)", "B (Arr-Der)", "C (Aba-Izq)", "D (Aba-Der)"];
let wakeLock = null;

// Caché de elementos DOM y utilidades
const statusEl = document.getElementById('status');
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

// Carga inicial desde LocalStorage
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        presets = JSON.parse(saved);
        updateUI();
    }
    
    // Instalar Service Worker para modo Offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    // Si se instaló un nuevo SW y ya había uno previo controlando la app
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        const updateBanner = document.getElementById('update-banner');
                        updateBanner.style.display = 'block';
                        updateBanner.onclick = () => newWorker.postMessage({ action: 'skipWaiting' });
                    }
                });
            });
        }).catch(err => console.warn('SW Error:', err));

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }
});

// --- WAKE LOCK API (Evitar apagado de pantalla) ---
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.warn('Wake Lock denegado/no soportado:', err.message);
        }
    }
}

// Requiere interacción del usuario para activarse
document.addEventListener('pointerdown', requestWakeLock, { once: true });

// Re-solicitar si el usuario cambia de pestaña y vuelve
document.addEventListener('visibilitychange', () => {
    if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock();
});

// --- RESET PRESETS ---
function resetPresets() {
    if(!confirm("¿Estás seguro de que quieres borrar los 4 presets de la memoria?")) return;
    localStorage.removeItem(STORAGE_KEY);
    presets = [null, null, null, null];
    
    presets.forEach((_, i) => {
        document.getElementById(`lbl-${i}`).classList.remove('loaded');
        document.getElementById(`txt-${i}`).innerText = NODE_LABELS[i];
    });
    statusEl.innerText = "🗑️ Memoria borrada. Listo para cargar.";
}

function updateUI() {
    let loadedCount = 0;
    presets.forEach((p, i) => {
        if (!p) return;
        loadedCount++;
        document.getElementById(`lbl-${i}`).classList.add('loaded');
        document.getElementById(`txt-${i}`).innerText = `✅ Node ${['A','B','C','D'][i]}`;
    });
    statusEl.innerText = loadedCount === 4 ? "✅ Todos los nodos listos!" : `Nodos cargados: ${loadedCount}/4`;
}

async function toggleMIDI() {
    const btnCon = document.getElementById('btn-con');
    
    // Si ya hay conexión, desconectamos manualmente
    if (midiOut) {
        midiOut = null;
        btnCon.innerHTML = "🔌 Conectar HX Stomp";
        btnCon.style.background = "var(--btn-connect)";
        statusEl.innerText = "🔌 Desconectado manualmente.";
        return;
    }
    
    try {
        const access = await navigator.requestMIDIAccess();
        const outputs = Array.from(access.outputs.values());
        midiOut = outputs.find(o => o.name.includes("Helix") || o.name.includes("HX") || o.name.includes("Line 6")) || outputs[0];
        if(midiOut) {
            btnCon.innerHTML = "❌ <b>Desconectar (" + midiOut.name + ")</b>";
            btnCon.style.background = "#ffb74d"; // Naranja indicando estado activo/desconectable
            statusEl.innerText = "✅ Conectado a: " + midiOut.name;
        } else {
            statusEl.innerText = "❌ No se encontró dispositivo Line 6.";
        }
    } catch(e) { statusEl.innerText = "❌ Error: Permiso MIDI denegado o no soportado."; }
}

// Función pura de extracción recursiva
function extractHelixParams(obj, target) {
    if (!obj || typeof obj !== 'object') return;
    for (const key in obj) {
        if (CC_MAP[key] !== undefined && typeof obj[key] === 'number') {
            target[key] = obj[key];
        } else if (typeof obj[key] === 'object') {
            extractHelixParams(obj[key], target);
        }
    }
}

function loadFile(input, index) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            let tempParams = {};
            extractHelixParams(json, tempParams);

            if(Object.keys(tempParams).length > 0) {
                presets[index] = tempParams;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
                updateUI();
            } else {
                statusEl.innerText = "❌ Error: Archivo sin parámetros válidos.";
            }
        } catch (err) {
            statusEl.innerText = "❌ Error: Asegúrate de que es un .hlx válido.";
        }
        input.value = ""; // Permite recargar el mismo archivo si hubo error
    };
    reader.readAsText(file);
}

// --- JOYSTICK LOGIC ---
const pad = document.getElementById('pad-container');
const cursor = document.getElementById('cursor');
let targetX = 0.5, targetY = 0.5;
let currentX = 0.5, currentY = 0.5;
let isAnimating = false;
const LERP_FACTOR = 0.15; // 0.01 (muy lento) a 0.99 (casi instantáneo)

function animatePad() {
    // Interpolación matemática (Inercia)
    currentX = lerp(currentX, targetX, LERP_FACTOR);
    currentY = lerp(currentY, targetY, LERP_FACTOR);
    
    cursor.style.left = (currentX * 100) + '%';
    cursor.style.top = (currentY * 100) + '%';
    
    calculateAndSend(currentX, currentY);

    // Apagar el bucle de animación si ya llegamos al objetivo (delta mínimo)
    if (Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001) {
        currentX = targetX; currentY = targetY;
        isAnimating = false;
    } else {
        requestAnimationFrame(animatePad);
    }
}

pad.addEventListener('pointermove', (e) => {
    if(!e.isPrimary) return;
    if(e.pointerType === 'mouse' && e.buttons === 0) return; 

    const rect = pad.getBoundingClientRect();
    targetX = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    targetY = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    
    if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animatePad);
    }
});

pad.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// --- DOUBLE TAP TO CENTER (Vía de escape rápida) ---
pad.addEventListener('dblclick', () => {
    targetX = 0.5; targetY = 0.5;
    if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animatePad);
    }
});

function calculateAndSend(x, y) {
    // Bloquear interpolación si faltan presets
    if(presets.includes(null)) {
        statusEl.innerText = "⚠️ Requiere los 4 presets para interpolar.";
        return;
    }
    
    let msg = "";

    // Efecto visual dinámico basado en la distancia desde el centro
    const dist = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(y - 0.5, 2)) * 2;
    cursor.style.boxShadow = `0 0 ${15 + (dist * 20)}px rgba(255, 152, 0, ${0.6 + (dist * 0.4)})`;

    Object.keys(CC_MAP).forEach(key => {
        if(CC_MAP[key]) {
            // Extraer el valor de este parámetro para las 4 esquinas (Por defecto 5.0 si no existe)
            const valA = presets[0][key] ?? 5.0; // Top-Left
            const valB = presets[1][key] ?? 5.0; // Top-Right
            const valC = presets[2][key] ?? 5.0; // Bottom-Left
            const valD = presets[3][key] ?? 5.0; // Bottom-Right

            // INTERPOLACIÓN BILINEAL
            const blendTop = valA * (1 - x) + valB * x;
            const blendBottom = valC * (1 - x) + valD * x;
            const finalVal = blendTop * (1 - y) + blendBottom * y;

            let midiVal = Math.floor(finalVal * 12.7);
            midiVal = clamp(midiVal, 0, 127);

            if(lastSentCC[key] !== midiVal) {
                if(midiOut) midiOut.send([0xB0, CC_MAP[key], midiVal]);
                lastSentCC[key] = midiVal;
            }
            if(key === "Drive") msg += `DRV: ${(midiVal/12.7).toFixed(1)}  `;
            if(key === "Treble") msg += `TRB: ${(midiVal/12.7).toFixed(1)}`;
        }
    });
    if (msg) statusEl.innerText = msg;
}