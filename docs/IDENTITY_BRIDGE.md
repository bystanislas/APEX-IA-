# Pont d'identité LibreChat ↔ apps/web

## Le problème

Apex IA a deux composants avec deux bases : le noyau chat **LibreChat**
(MongoDB) et les modules métier **apps/web** (PostgreSQL). Sans pont, un
utilisateur aurait deux comptes distincts et chaque nouveau module métier
ajouterait de la dette de synchronisation. On traite le pont **maintenant**,
avant d'empiler les modules, pour que tous partagent une seule identité.

## Principe retenu : LibreChat est la source d'autorité

LibreChat gère déjà l'auth complète (email/mot de passe, OAuth2, OpenID, 2FA).
On ne la réimplémente pas. `apps/web` **fait confiance** aux tokens émis par
LibreChat et provisionne un compte local miroir à la première connexion.

C'est un vrai SSO léger, pas une synchronisation bidirectionnelle : les
identifiants vivent dans LibreChat, `apps/web` n'en garde qu'un reflet
(`email`, `name`, lien `providerUserId`).

## Ce qui a été vérifié dans le code source de LibreChat

Source : `packages/data-schemas/src/methods/user.ts` + `crypto/index.ts`.

- Le token est signé avec **`jsonwebtoken`** → algorithme **HS256**.
- Secret : `process.env.JWT_SECRET`.
- Payload : `{ id, username, provider, email }` + `iat`/`exp`.
- Access token court (~15 min par défaut).

Ces faits sont la base du vérificateur ; ils ne sont pas devinés.

## Implémentation

- `packages/auth/src/librechat.ts` — `verifyLibreChatToken(token, secret)` :
  vérifie le JWT en **figeant l'algorithme à HS256** (`algorithms: ["HS256"]`),
  ce qui bloque les attaques de confusion d'algorithme (`alg: none`, RS→HS).
  Renvoie une `NormalizedIdentity` (`providerUserId`, `provider`, `email`,
  `name`) — le type que TOUS les modules Apex doivent consommer.
- `apps/web/prisma/schema.prisma` — `User.passwordHash` devient optionnel
  (les comptes liés n'ont pas de mot de passe local) ; ajout de `provider` et
  `providerUserId` (unique).
- `apps/web/src/lib/auth.ts` — second provider NextAuth `"librechat"` :
  vérifie le token, puis rattache le compte en 3 temps (par `providerUserId`,
  sinon par email existant, sinon création) pour éviter toute collision de
  contrainte d'unicité.
- `apps/web/src/app/api/auth/librechat/route.ts` — endpoint de vérification
  (débogage / contrôle préalable), sans effet de bord.
- Var d'env `LIBRECHAT_JWT_SECRET` (= `JWT_SECRET` de LibreChat).

## Flux de connexion

1. L'utilisateur se connecte sur LibreChat (`:3080`) → obtient un access token.
2. Le front appelle `signIn("librechat", { token })` côté `apps/web`.
3. NextAuth vérifie le token (secret partagé), provisionne/rattache le compte,
   ouvre une session `apps/web` (JWT NextAuth, indépendante et plus longue).
4. Le token LibreChat n'est utilisé qu'une fois, au moment du pont.

## Limites assumées (à traiter au runtime)

- **Hand-off du token** : LibreChat (`:3080`) et apps/web (`:3000`) sont des
  origines différentes ; les cookies ne sont pas partagés. En production, on
  les placera derrière **le même reverse-proxy / domaine** (Coolify) pour
  partager le cookie de session, ou on relaiera le token explicitement. Le
  cœur (vérification + provisioning) est prêt ; le transport reste à câbler
  selon le déploiement.
- **Révocation** : un compte désactivé côté LibreChat ne l'est pas
  automatiquement côté apps/web tant que sa session NextAuth est valide. À
  raccourcir la durée de session apps/web ou à ajouter une revérification
  périodique quand le module admin existera.
- **Non testé au runtime** : Docker n'était pas disponible au moment de
  l'écriture. Le vérificateur compile et sa logique est déterministe, mais le
  flux complet (login LibreChat réel → token → session apps/web) doit être
  validé une fois les deux services démarrés.
