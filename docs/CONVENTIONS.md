# Conventions Apex IA

## Structure du monorepo : peuplement incrémental (décision)

Le cahier des charges liste une arborescence cible large : `apps/web`,
`apps/desktop`, `apps/mobile`, `apps/admin`, `apps/api`, `apps/workers`,
`packages/{ui,core,ai,auth,storage,search,jobs,shared,types,utils,security,connectors,scripts,plugins,workflows}`,
`infra/{docker,deployment,monitoring}`, `docs`.

**Décision : on ne crée PAS ces dossiers à l'avance en coquilles vides.**
Chaque `app`/`package` est créé au moment où un module en a réellement besoin,
avec du code qui compile et qui sert. Un dossier vide (ou un `index.ts` qui
`export {}`) est du code mort : il ment sur l'avancement, il faut le maintenir
(configs, lint, CI) pour rien, et il brouille la lecture du dépôt.

### État réel à ce jour

Existant et fonctionnel :

- `apps/web` — modules métier (auth + pont d'identité, CV).
- `apps/librechat` — noyau chat (clone configuré, git-ignoré ; voir
  `infra/librechat/`).
- `packages/ai` — tiers de modèles + politique de raisonnement.
- `packages/auth` — pont d'identité LibreChat.
- `packages/documents` — génération de documents (CV).
- `infra/docker`, `infra/librechat` — orchestration.
- `docs/` — une décision par fichier.

À créer **quand le module correspondant arrive**, pas avant :

- `apps/admin` → avec le panneau d'administration.
- `apps/workers` → avec le premier job lourd réel (image/vidéo/OCR).
- `apps/desktop` (Tauri), `apps/mobile` (Expo) → quand le web est stable.
- `apps/api` → **peut-être jamais** : les routes Next.js d'`apps/web` tiennent
  lieu d'API. On n'extraira un service API séparé que si un besoin concret
  l'exige (ex: consommateurs non-web, scaling indépendant). Ne pas créer par
  mimétisme du cahier des charges.
- `packages/{security,connectors,scripts,plugins,workflows,ui,shared,types,...}`
  → chacun à sa première utilisation réelle.

### Corollaire

Quand un nouveau module est ajouté, mettre à jour **cette liste** et le README.
La structure du dépôt doit toujours refléter ce qui existe vraiment.

## Langue

- Code (identifiants, types) : anglais.
- Commentaires et documentation : français (langue de travail du projet).
- UI : français d'abord, i18n FR/EN prévu au niveau des libellés.

## Sécurité — invariants non négociables

Repris du cahier des charges, appliqués à tout nouveau module :

- Contenu externe = non fiable par défaut.
- Moindre privilège systématique.
- Action destructive = confirmation explicite.
- Secrets : jamais dans le code, jamais dans un commit, jamais exposés à un
  script/plugin/modèle.
- Toute action sensible : validée, tracée (audit), limitée par rôle.
