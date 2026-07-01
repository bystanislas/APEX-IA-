# Apex IA

Plateforme IA modulaire, self-hostable. Deux composants aujourd'hui, conçus pour
rester indépendants et communiquer plus tard par identité partagée (pas encore
fait — voir [docs/LIBRECHAT_INTEGRATION.md](docs/LIBRECHAT_INTEGRATION.md)) :

- **`apps/librechat`** — le noyau conversationnel. Un clone configuré de
  [LibreChat](https://github.com/danny-avila/LibreChat) (pas une réécriture) :
  chat, streaming, agents, MCP, artifacts, auth, historique — tout ce que
  LibreChat fait déjà bien. Rebrandé "Apex IA" et configuré avec 5 modes de
  raisonnement (Fast/Balanced/Deep/Expert/Max) sur l'API Anthropic native. Voir
  [docs/LIBRECHAT_INTEGRATION.md](docs/LIBRECHAT_INTEGRATION.md) et
  [docs/MODEL_ROUTING.md](docs/MODEL_ROUTING.md).

- **`apps/web`** — les modules métier qui n'ont pas leur place dans un chat :
  actuellement l'auth (compte séparé, en attendant le pont d'identité) et un
  générateur de CV (PDF/DOCX). Prochains modules : recherche d'emploi,
  entreprise, knowledge base, projets, helpdesk, LMS, DMS/signature — chacun
  ajouté un par un, jamais en bloc. Voir [docs/DOCUMENTS.md](docs/DOCUMENTS.md).

## Structure

```
apps/
  librechat/   noyau chat (clone configuré de LibreChat)
  web/         modules métier (Next.js + PostgreSQL)
packages/
  ai/          tiers de modèles + politique de raisonnement (partagé, mappé vers librechat.yaml)
  auth/        pont d'identité LibreChat ↔ apps/web (vérif JWT HS256)
  documents/   génération de documents (CV aujourd'hui — PDF + DOCX)
  scripts/     module scripts design (GIMP/Krita) — allowlist pré-auditée, fail-closed
infra/
  docker/      docker-compose pour la base Postgres de apps/web
docs/          décisions d'architecture, un fichier par sujet
```

## Lancer en local

### Noyau chat (LibreChat)

```bash
cd apps/librechat
# éditer .env : renseigner ANTHROPIC_API_KEY
docker compose up -d
```
→ http://localhost:3080

### Modules métier (apps/web)

```bash
docker compose -f infra/docker/docker-compose.yml up -d   # Postgres
cp .env.example apps/web/.env
# éditer apps/web/.env : NEXTAUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm db:push
pnpm dev
```
→ http://localhost:3000

## Ce qui est fait

- Chat premium complet via LibreChat (réutilisé, pas réécrit), rebrandé et
  configuré avec 5 modes de raisonnement Anthropic natifs.
- Auth + génération de CV (structuré → PDF/DOCX) dans `apps/web`.

## Ce qui n'est pas fait

- Pont d'identité entre les deux comptes (LibreChat/Mongo et apps/web/Postgres).
- Agents Apex spécifiques configurés sur le framework agents natif de LibreChat.
- Modules métier restants : emploi, entreprise, KB, projets, automation,
  helpdesk, LMS, DMS/signature, sécurité avancée, panneau admin, desktop, mobile.

Chaque module est un chantier réel à part entière, ajouté par itération courte
sur cette base — jamais en bloc. Voir `docs/` pour le détail par sujet.
