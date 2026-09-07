#!/usr/bin/env bash
set -euo pipefail

# Compatibilidade com configuracoes legadas. Nao depende de permissao de
# execucao porque o build atual nao precisa chamar este arquivo.
if [[ "${1:-}" == "--" ]]; then
  shift
fi
if [[ "$#" -eq 0 ]]; then
  echo "usage: scripts/sites-env.sh -- command [args...]" >&2
  exit 64
fi
exec "$@"
