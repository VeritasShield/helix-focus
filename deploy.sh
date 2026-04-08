#!/bin/bash

# Terminar la ejecución si algún comando falla
set -e

# --- VARIABLES Y COLORES ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando proceso de sincronización con GitHub...${NC}"

# --- VALIDACIÓN DE RAMA ---
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
    echo -e "${RED}❌ Error: Despliegue bloqueado. Estás en la rama '${BRANCH}'. El commit y push deben hacerse exclusivamente desde 'main'.${NC}"
    exit 1
fi

# --- VALIDACIÓN DE ESTADO ---
# Refrescar el index de git para capturar todos los cambios, incluyendo untracked
git add .

if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✅ El repositorio ya está actualizado. No hay cambios para subir.${NC}"
    exit 0
fi

# --- AUTO-BUMP CACHE VERSION ---
# Solo actualizamos la caché si realmente detectamos que hiciste cambios
TIMESTAMP=$(date +"%s")
sed -i "s/^const CACHE_NAME.*/const CACHE_NAME = 'helix-focus-$TIMESTAMP';/" sw.js
git add sw.js

# --- CONSTRUCCIÓN DEL COMMIT PROFESIONAL ---
DATE=$(date +"%Y-%m-%d %H:%M:%S")
TOTAL_FILES=$(git diff --name-only --cached | wc -l)
# Toma solo los primeros 5 archivos para no hacer un commit gigante
FILES_PREVIEW=$(git diff --name-only --cached | head -n 5 | paste -sd, -)

# Formato inspirado en Conventional Commits
COMMIT_TITLE="chore(auto-deploy): sync update [${DATE}]"
COMMIT_BODY="Rama: ${BRANCH} | Archivos modificados (${TOTAL_FILES}): ${FILES_PREVIEW}..."

# --- EJECUCIÓN ---
echo -e "${YELLOW}📝 Creando commit auto-generado...${NC}"
git commit -m "$COMMIT_TITLE" -m "$COMMIT_BODY"

echo -e "${YELLOW}☁️ Subiendo cambios a origin/${BRANCH}...${NC}"
git push origin "$BRANCH"

echo -e "${GREEN}✅ ¡Despliegue completado con éxito!${NC}"

# --- FEEDBACK DE GITHUB PAGES ---
echo -e "${GREEN}🌐 GitHub Pages se está actualizando automáticamente. Los cambios serán visibles en ~30 segundos.${NC}"