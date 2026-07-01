# Module scripts design (GIMP / Krita)

## Décision : allowlist d'abord, import libre plus tard

Le cahier des charges décrit l'import libre de scripts par l'utilisateur. C'est
la fonctionnalité la plus dangereuse de toute la plateforme : un script
Script-Fu ou Python exécuté sur la machine peut lire des fichiers, appeler le
réseau, tout casser.

**Choix retenu (proposition d'amélioration) : on ne démarre PAS par l'import
libre.** On démarre par une **allowlist de scripts pré-audités**. Un script qui
n'est pas dans l'allowlist ne peut pas être exécuté — refus par défaut
(fail-closed). C'est plus sûr et plus rapide à livrer : on obtient tout de suite
un traitement d'images automatisé utile, sans ouvrir la boîte de Pandore de
l'exécution de code arbitraire. L'import libre viendra ensuite, derrière un flux
de validation admin, en **réutilisant exactement** le modèle de permissions
déjà en place ici.

## Où c'est implémenté

- `packages/scripts/src/types.ts` — modèle : `AllowlistedScript` (identifié par
  le SHA-256 de son contenu audité), capacités (`readInput`, `writeOutput`,
  `network`, `filesystemBeyondWorkdir` — tout à `false` par défaut), niveau de
  risque, rôles d'accès.
- `packages/scripts/registry/allowlist.json` — l'allowlist elle-même. Deux
  entrées d'exemple (recadrage/export web, redimensionnement par lot). Les
  `sha256` sont à `000...` en attendant l'audit du contenu réel de chaque
  script (voir « Auditer un script » plus bas).
- `packages/scripts/src/registry.ts` — résolution : `findAllowlistedScript(id)`
  renvoie `null` pour tout ce qui n'est pas dans la liste.
- `packages/scripts/src/authorize.ts` — décision d'autorisation, **fonction
  pure** (n'exécute rien), gardes fail-closed dans l'ordre :
  1. le contenu doit correspondre au hash audité (anti-substitution) ;
  2. rôle d'exécution requis ;
  3. validation admin si le script l'exige (risque medium/high) ;
  4. confirmation explicite obligatoire (action potentiellement destructive).
  Plus `validateParameters()` qui refuse tout paramètre non déclaré.

## Ce qui manque encore (runtime, hors de ce package)

Ce package est la **couche de décision**. Il ne fait pas encore tourner GIMP.
Restent à construire, quand le worker design existera :

- L'exécuteur réel (worker isolé) qui lance GIMP/Krita en batch (`gimp -i -b`,
  `krita --nosplash`) dans un **sandbox** : dossiers d'entrée/sortie dédiés,
  pas de réseau, timeout, limites CPU/mémoire.
- La journalisation d'audit de chaque exécution (qui, quoi, quand, résultat).
- L'UI de sélection dans un script autorisé + confirmation.

Le point important : **aucune exécution n'est possible sans passer par
`authorizeExecution()`**, et celle-ci refuse par défaut.

## Auditer un script (procédure)

1. Écrire/relire le script, vérifier qu'il ne fait que ce qu'il déclare.
2. Calculer son hash : `shasum -a 256 mon-script.scm`.
3. Renseigner `sha256`, `capabilities`, `risk`, `requiresAdminApproval`,
   `audited` dans `allowlist.json`.
4. Commit — la revue de code fait office de second regard sur l'audit.

Tant qu'un `sha256` vaut `000...`, le script est de fait inexécutable (aucun
contenu réel ne produira ce hash), ce qui est le comportement sûr voulu.
