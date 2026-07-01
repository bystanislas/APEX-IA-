#!/usr/bin/env bash
# Prépare le noyau chat Apex IA (LibreChat configuré) dans apps/librechat/.
#
# apps/librechat/ n'est PAS versionné dans ce dépôt : c'est un clone d'un projet
# tiers (49 Mo, son propre historique git). Ce script le récupère et y applique
# la configuration Apex (branding + 5 modes de raisonnement) stockée ici, dans
# infra/librechat/, qui est la seule partie versionnée.
#
# Usage : depuis la racine du dépôt →  bash infra/librechat/setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET="$REPO_ROOT/apps/librechat"
CONFIG_DIR="$REPO_ROOT/infra/librechat"

if [ ! -d "$TARGET/.git" ]; then
  echo "→ Clone de LibreChat dans apps/librechat/ ..."
  git clone --depth 1 https://github.com/danny-avila/LibreChat.git "$TARGET"
else
  echo "→ apps/librechat/ existe déjà, clone ignoré."
fi

echo "→ Application de la configuration Apex IA ..."
cp "$CONFIG_DIR/librechat.yaml" "$TARGET/librechat.yaml"
cp "$CONFIG_DIR/docker-compose.override.yml" "$TARGET/docker-compose.override.yml"

if [ ! -f "$TARGET/.env" ]; then
  echo "→ Création de apps/librechat/.env (secrets régénérés) ..."
  cp "$TARGET/.env.example" "$TARGET/.env"
  # Régénère tous les secrets — ne JAMAIS committer ce .env.
  for pair in \
    "CREDS_KEY:$(openssl rand -hex 32)" \
    "CREDS_IV:$(openssl rand -hex 16)" \
    "JWT_SECRET:$(openssl rand -hex 32)" \
    "JWT_REFRESH_SECRET:$(openssl rand -hex 32)" \
    "MEILI_MASTER_KEY:$(openssl rand -hex 16)" \
    "ADMIN_PANEL_SESSION_SECRET:$(openssl rand -hex 32)"; do
    key="${pair%%:*}"; val="${pair#*:}"
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$TARGET/.env"
  done
  sed -i '' "s|^APP_TITLE=.*|APP_TITLE=Apex IA|" "$TARGET/.env"
  echo "  ⚠  Renseignez ANTHROPIC_API_KEY dans apps/librechat/.env avant de démarrer."
else
  echo "→ apps/librechat/.env déjà présent, laissé tel quel."
fi

echo "✓ Prêt. Démarrer : (cd apps/librechat && docker compose up -d) → http://localhost:3080"
