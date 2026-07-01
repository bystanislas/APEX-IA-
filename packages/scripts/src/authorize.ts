import { createHash } from "node:crypto";
import type {
  AllowlistedScript,
  AuthorizationDecision,
  ScriptParameter,
  ScriptRole,
} from "./types";

/** Rôles pouvant exécuter un script. */
const EXECUTE_ROLES: ScriptRole[] = ["execute", "modify", "validate", "admin"];

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/** Le contenu correspond-il exactement au script audité (anti-substitution) ? */
export function matchesAuditedContent(content: string, script: AllowlistedScript): boolean {
  return sha256Hex(content) === script.sha256.toLowerCase();
}

export interface AuthorizeInput {
  script: AllowlistedScript;
  /** Contenu réel du script qu'on s'apprête à exécuter. */
  content: string;
  /** Rôles de l'utilisateur pour ce contexte (projet/équipe/tenant). */
  userRoles: ScriptRole[];
  /** L'utilisateur a-t-il fourni une confirmation explicite pour cette exécution ? */
  userConfirmed: boolean;
  /** Un admin a-t-il approuvé cette exécution (pour les scripts qui l'exigent) ? */
  adminApproved: boolean;
}

/**
 * Décide si un script peut être exécuté. Fonction pure et déterministe :
 * elle n'exécute rien, elle ne fait que trancher, pour être testable et pour
 * que l'appelant journalise systématiquement la décision (audit).
 *
 * Ordre des gardes (fail-closed) :
 *  1. le contenu doit correspondre au hash audité ;
 *  2. l'utilisateur doit avoir un rôle d'exécution ;
 *  3. validation admin si le script l'exige ;
 *  4. confirmation explicite obligatoire (action potentiellement destructive).
 */
export function authorizeExecution(input: AuthorizeInput): AuthorizationDecision {
  const { script, content, userRoles, userConfirmed, adminApproved } = input;

  if (!matchesAuditedContent(content, script)) {
    return {
      allowed: false,
      reason: `Contenu du script "${script.id}" différent de la version auditée (hash non concordant) — refus.`,
      requiresConfirmation: false,
    };
  }

  const canExecute = userRoles.some((r) => EXECUTE_ROLES.includes(r));
  if (!canExecute) {
    return {
      allowed: false,
      reason: `Rôle insuffisant pour exécuter "${script.id}" (rôles requis: ${EXECUTE_ROLES.join(", ")}).`,
      requiresConfirmation: false,
    };
  }

  if (script.requiresAdminApproval && !adminApproved && !userRoles.includes("admin")) {
    return {
      allowed: false,
      reason: `Le script "${script.id}" (risque ${script.risk}) exige une validation admin non fournie.`,
      requiresConfirmation: true,
    };
  }

  if (!userConfirmed) {
    return {
      allowed: false,
      reason: `Confirmation explicite requise avant d'exécuter "${script.id}".`,
      requiresConfirmation: true,
    };
  }

  return {
    allowed: true,
    reason: `Exécution autorisée pour "${script.id}".`,
    requiresConfirmation: false,
  };
}

/** Valide les paramètres fournis contre la déclaration du script. */
export function validateParameters(
  params: Record<string, unknown>,
  declared: ScriptParameter[]
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const decl of declared) {
    const value = params[decl.name];
    if (value === undefined || value === null) {
      if (decl.required) errors.push(`Paramètre requis manquant: ${decl.name}`);
      continue;
    }
    if (decl.type === "number") {
      if (typeof value !== "number") errors.push(`${decl.name} doit être un nombre`);
      else {
        if (decl.min !== undefined && value < decl.min) errors.push(`${decl.name} < min (${decl.min})`);
        if (decl.max !== undefined && value > decl.max) errors.push(`${decl.name} > max (${decl.max})`);
      }
    } else if (decl.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${decl.name} doit être un booléen`);
    } else if (decl.type === "enum") {
      if (!decl.enumValues?.includes(String(value)))
        errors.push(`${decl.name} doit être parmi: ${decl.enumValues?.join(", ")}`);
    } else if (decl.type === "string" && typeof value !== "string") {
      errors.push(`${decl.name} doit être une chaîne`);
    }
  }

  // Refuser tout paramètre non déclaré (surface d'attaque minimale).
  for (const key of Object.keys(params)) {
    if (!declared.some((d) => d.name === key)) errors.push(`Paramètre inconnu refusé: ${key}`);
  }

  return { ok: errors.length === 0, errors };
}
