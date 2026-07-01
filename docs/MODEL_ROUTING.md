# Module modèles / raisonnement / routage

## Où c'est implémenté

- `packages/ai/src/tiers.ts` — 4 tiers internes (`fable`, `opus`, `sonnet`, `haiku`),
  chacun mappé à un modèle Claude réel. Le tier est le contrat stable ; le modèle
  réel derrière peut changer sans casser les appelants.
- `packages/ai/src/reasoning.ts` — 5 niveaux de raisonnement (`very_low` → `max`),
  chacun avec un budget de tokens de réflexion (Claude extended thinking) et un
  plafond de réponse (`max_tokens`).
- `packages/ai/src/router.ts` — `routeRequest()` : fonction pure, testable, qui
  décide (tier, modèle, reasoning, budgets) à partir d'un mode explicite, d'overrides
  utilisateur, ou d'une heuristique de complexité si rien n'est fourni.
- `apps/web/src/lib/anthropic.ts` — appelle l'API Anthropic avec la décision du
  router (streaming SSE, extended thinking activé si `thinkingBudgetTokens > 0`).
- `apps/web/src/app/api/chat/route.ts` — orchestration : route la requête, log les
  fallbacks, persiste le modèle/reasoning utilisés sur chaque message assistant
  (colonnes `modelTier`, `modelId`, `reasoningLevel`, `usageMode` sur `Message`).
- `apps/web/src/components/ModelControls.tsx` — UI : 5 modes en un clic
  (Fast/Balanced/Deep/Expert/Max) + panneau "réglages avancés" replié par défaut
  (tier + raisonnement manuels), + bandeau indiquant le modèle/raisonnement
  réellement utilisé et si un fallback a eu lieu.

## Politique de fallback

Si le tier demandé n'est pas autorisé pour le tenant (`allowedTiers`), ou si le
reasoning demandé n'est pas supporté par le tier retenu (ex: `haiku` n'a pas
l'extended thinking), le router redescend automatiquement au niveau compatible
le plus proche, continue la conversation, et renvoie `fellBack: true` +
`fallbackReason`. Le serveur logue l'ajustement (`console.warn`), le client
l'affiche à l'utilisateur.

## Ce qui manque encore (itérations suivantes)

- `allowedTiers` par organisation/rôle n'est pas encore branché à un vrai modèle
  de permissions (dépend du panneau admin / RBAC, tâche #7).
- Le contenu de l'extended thinking est consommé mais jamais affiché ni persisté
  (choix conservateur pour la Phase 2 — à revisiter si on veut montrer le
  raisonnement à l'utilisateur).
- L'estimation de coût/latence affichée dans l'UI (demandée dans le cahier des
  charges) n'est pas encore calculée — nécessite un suivi réel des tokens
  consommés par appel (à ajouter avec l'observabilité, tâche future).
- `classifyComplexity()` est une heuristique volontairement simple (longueur +
  mots-clés) ; une vraie classification demandera un modèle léger dédié.
