/** Catégories de mémoire personnelle exposées à l'utilisateur. */
export const MEMORY_CATEGORIES = [
  { id: "prenom", label: "Prénom" },
  { id: "langue", label: "Langue" },
  { id: "style", label: "Style" },
  { id: "habitudes", label: "Habitudes" },
  { id: "objectifs", label: "Objectifs" },
  { id: "projets", label: "Projets" },
  { id: "interets", label: "Intérêts" },
  { id: "besoins", label: "Besoins récurrents" },
  { id: "general", label: "Général" },
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number]["id"];

const VALID = new Set<string>(MEMORY_CATEGORIES.map((c) => c.id));

export function isValidCategory(value: string): value is MemoryCategory {
  return VALID.has(value);
}

export function categoryLabel(id: string): string {
  return MEMORY_CATEGORIES.find((c) => c.id === id)?.label ?? "Général";
}
