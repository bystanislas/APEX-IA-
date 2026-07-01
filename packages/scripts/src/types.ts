/**
 * Modèle du module scripts design (GIMP / Krita).
 *
 * Décision de sécurité (proposition d'amélioration retenue) : PAS d'import
 * libre au jour 1. Seuls des scripts figurant dans une allowlist pré-auditée
 * peuvent être exécutés. Un script inconnu est refusé par défaut. L'import
 * libre viendra plus tard, derrière un flux de validation admin, en réutilisant
 * exactement ce modèle de permissions.
 */

export type ScriptEngine = "gimp-script-fu" | "gimp-python" | "krita-python";

/** Ce qu'un script est autorisé à toucher. Tout est refusé par défaut. */
export interface ScriptCapabilities {
  /** Lire le fichier projet/image d'entrée fourni par l'utilisateur. */
  readInput: boolean;
  /** Écrire un fichier de sortie (export). */
  writeOutput: boolean;
  /** Accès réseau. Doit rester false pour un script de traitement local. */
  network: boolean;
  /** Accès système de fichiers hors des dossiers d'entrée/sortie dédiés. */
  filesystemBeyondWorkdir: boolean;
}

export type ScriptRiskLevel = "low" | "medium" | "high";

/**
 * Une entrée de l'allowlist : un script pré-audité, identifié par le hash
 * SHA-256 de son contenu. Le hash est le contrat : si le contenu change d'un
 * octet, le hash ne correspond plus et le script est refusé (anti-substitution).
 */
export interface AllowlistedScript {
  id: string;
  name: string;
  description: string;
  engine: ScriptEngine;
  /** SHA-256 hex du contenu exact du script audité. */
  sha256: string;
  capabilities: ScriptCapabilities;
  risk: ScriptRiskLevel;
  /** Les scripts à risque medium/high exigent une validation admin par exécution. */
  requiresAdminApproval: boolean;
  /** Qui a audité, et quand (traçabilité). */
  audited: { by: string; date: string };
  /** Paramètres acceptés, pour valider les entrées avant exécution. */
  parameters: ScriptParameter[];
}

export interface ScriptParameter {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  required: boolean;
  /** Valeurs autorisées si type === "enum". */
  enumValues?: string[];
  /** Bornes si type === "number". */
  min?: number;
  max?: number;
}

/** Rôles d'accès aux scripts (cf. cahier des charges, module droits d'accès). */
export type ScriptRole =
  | "read"
  | "execute"
  | "import"
  | "modify"
  | "validate"
  | "admin"
  | "security_approval"
  | "team_share";

/** Résultat d'une décision d'autorisation, toujours journalisable. */
export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
  /** Vrai si une confirmation/validation humaine est encore requise. */
  requiresConfirmation: boolean;
}
