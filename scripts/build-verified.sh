#!/usr/bin/env bash
set -euo pipefail

# Compatibilidade defensiva: se alguma configuracao antiga ainda chamar
# scripts/build-verified.sh, execute diretamente o build Next.js atual.
echo "[SC Central] Executando build Next.js portavel..."
exec npx next build
