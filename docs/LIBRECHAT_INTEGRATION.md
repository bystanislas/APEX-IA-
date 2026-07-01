# Intégration LibreChat — décisions

Le cahier des charges est explicite : LibreChat est **le socle du noyau
conversationnel** d'Apex IA. On ne le réécrit pas, on le configure et on le
rebrande. Ce document liste précisément ce qui est réutilisé tel quel, ce qui
est configuré, ce qui est forké, et ce qui est remplacé.

## Emplacement

`apps/librechat/` — clone shallow de [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat)
(dernière version `main` au moment du clone). Ce n'est **pas** un package du
workspace pnpm racine : LibreChat est déjà son propre monorepo (Turborepo,
`client/`, `api/`, `packages/`) avec son propre outillage. On le garde
autonome et on l'intègre par configuration + Docker, pas par fusion de
tooling.

**Versionnement.** `apps/librechat/` est **git-ignoré** (49 Mo de code tiers
avec son propre historique, + un `.env` contenant des secrets qui ne doivent
jamais être committés). Seule la configuration Apex est versionnée, dans
`infra/librechat/` :

- `infra/librechat/librechat.yaml` — la config Apex (branding + 5 modes).
- `infra/librechat/docker-compose.override.yml` — montage de la config.
- `infra/librechat/setup.sh` — clone LibreChat, y copie la config Apex, et
  génère un `.env` avec des secrets frais.

Reproduire le noyau chat sur une machine neuve :

```bash
bash infra/librechat/setup.sh
# renseigner ANTHROPIC_API_KEY dans apps/librechat/.env
cd apps/librechat && docker compose up -d
```

## Réutilisé tel quel

- Le noyau chat complet : conversations, streaming, fork/édition de messages,
  pièces jointes, OCR, multimodal, recherche (Meilisearch), agents + MCP,
  artifacts, auth (email/password + OAuth2 + JWT), rôles de base, presets,
  historique, partage de conversations.
- Le endpoint Anthropic natif (`ANTHROPIC_API_KEY`), y compris le support de
  l'extended thinking (`thinking` + `thinkingBudget` par modèle) — exactement
  ce dont le module "raisonnement multi-niveaux" du cahier des charges a
  besoin, sans code custom.
- Le système `modelSpecs` (presets de modèles groupés dans l'UI) — c'est le
  mécanisme natif qui porte nos 5 modes (Fast/Balanced/Deep/Expert/Max).
- MongoDB, Meilisearch, docker-compose fournis par le projet.

## Configuré (pas de fork)

- `apps/librechat/.env` — copié depuis `.env.example`, secrets régénérés
  (`CREDS_KEY`, `CREDS_IV`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `MEILI_MASTER_KEY`, `ADMIN_PANEL_SESSION_SECRET`), `APP_TITLE=Apex IA`,
  `ANTHROPIC_API_KEY` à renseigner (placeholder `sk-ant-REPLACE_ME`).
- `apps/librechat/librechat.yaml` — `interface.customWelcome` (message
  d'accueil Apex IA) + `modelSpecs.list` : 5 entrées (`apex-fast`,
  `apex-balanced`, `apex-deep`, `apex-expert`, `apex-max`) mappant chaque mode
  du cahier des charges à un modèle Anthropic + un budget de raisonnement.
  Voir [MODEL_ROUTING.md](./MODEL_ROUTING.md) pour la politique complète.
- `apps/librechat/docker-compose.override.yml` — monte `librechat.yaml` dans
  le conteneur `api` (non fait par défaut dans le compose de base).

## Forké (nécessitera un vrai fork Git si on personnalise plus loin)

Rien pour l'instant. `APP_TITLE` couvre le nom affiché partout dans l'UI
(onglet navigateur, en-tête, page de connexion) sans toucher au code source.
Le remplacement du logo/favicon (assets binaires sous `client/public` et
`client/src/assets`) demandera un vrai fork (`git remote` propre, pas juste
un clone jetable) pour rester mergeable avec les mises à jour amont — **pas
fait dans cette itération**, à traiter comme tâche cosmétique séparée.

## Remplacé / encapsulé par des modules Apex IA séparés

Les modules métier du cahier des charges qui n'ont pas de sens *dans*
LibreChat (recherche d'emploi, entreprise/ERP, knowledge base, gestion de
projet, helpdesk, LMS, DMS/signature) vivent dans `apps/web` (Next.js +
PostgreSQL), pas dans LibreChat. Raison : LibreChat est optimisé pour la
conversation, pas pour du CRUD métier avec permissions fines par
organisation. L'intégration entre les deux (identité partagée, SSO) est un
point d'architecture explicite à traiter avant d'exposer ces modules aux
utilisateurs — **pas résolu aujourd'hui**, noté ici pour ne pas être oublié.

## Lancer LibreChat en local

```bash
cd apps/librechat
cp .env.example .env   # déjà fait pour ce repo, .env versionné localement (hors git)
# éditer .env : renseigner ANTHROPIC_API_KEY
docker compose up -d
```

Ouvrir http://localhost:3080 → créer un compte → les 5 modes Apex apparaissent
dans le sélecteur de modèle.

## Ce qui reste à faire

- Fork Git réel (pas un simple clone) si on va au-delà de la config
  `librechat.yaml`/`.env` (ex: logo, palette CSS profonde, textes d'onboarding
  spécifiques).
- Pont d'identité entre LibreChat (Mongo) et `apps/web` (Postgres) — SSO ou
  synchronisation d'utilisateurs. Actuellement deux comptes séparés.
- Valider en conditions réelles (`docker compose up`) — dépend de Docker
  disponible sur la machine et d'une clé Anthropic valide.
