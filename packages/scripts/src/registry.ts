import allowlistData from "../registry/allowlist.json";
import type { AllowlistedScript } from "./types";

interface RegistryFile {
  version: number;
  scripts: AllowlistedScript[];
}

const registry = allowlistData as unknown as RegistryFile;

/** Index par id pour une résolution O(1). */
const byId = new Map<string, AllowlistedScript>(registry.scripts.map((s) => [s.id, s]));

/** Renvoie le script audité correspondant à l'id, ou null s'il n'est PAS dans l'allowlist. */
export function findAllowlistedScript(id: string): AllowlistedScript | null {
  return byId.get(id) ?? null;
}

/** Un id est-il présent dans l'allowlist ? Tout ce qui n'y est pas est refusé. */
export function isAllowlisted(id: string): boolean {
  return byId.has(id);
}

export function listAllowlistedScripts(): AllowlistedScript[] {
  return [...registry.scripts];
}

export const ALLOWLIST_VERSION = registry.version;
