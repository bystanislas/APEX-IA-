export type ModelTier = "fable" | "opus" | "sonnet" | "haiku";

export interface TierConfig {
  id: ModelTier;
  modelId: string;
  label: string;
  description: string;
  /** Relative speed, 1 (slowest) to 5 (fastest) — used for UI hints and router heuristics. */
  relativeSpeed: 1 | 2 | 3 | 4 | 5;
  /** Relative cost, 1 (cheapest) to 5 (most expensive). */
  relativeCost: 1 | 2 | 3 | 4 | 5;
  supportsExtendedThinking: boolean;
}

/**
 * Internal capability tiers. `modelId` maps to the real provider model.
 * Keeping tiers as the stable public contract lets us swap the underlying
 * model per tier (or per provider) without touching callers.
 */
export const MODEL_TIERS: Record<ModelTier, TierConfig> = {
  fable: {
    id: "fable",
    modelId: "claude-fable-5",
    label: "Fable — maximum",
    description:
      "Profondeur extrême : stratégie, architecture, code avancé, recherche longue, agents lourds.",
    relativeSpeed: 1,
    relativeCost: 5,
    supportsExtendedThinking: true,
  },
  opus: {
    id: "opus",
    modelId: "claude-opus-4-8",
    label: "Opus — très haut niveau",
    description: "Raisonnement complexe, code, analyse, planification, production premium.",
    relativeSpeed: 2,
    relativeCost: 4,
    supportsExtendedThinking: true,
  },
  sonnet: {
    id: "sonnet",
    modelId: "claude-sonnet-4-6",
    label: "Sonnet — équilibré",
    description: "Meilleur équilibre qualité / coût / vitesse pour la majorité des tâches.",
    relativeSpeed: 4,
    relativeCost: 2,
    supportsExtendedThinking: true,
  },
  haiku: {
    id: "haiku",
    modelId: "claude-haiku-4-5-20251001",
    label: "Haiku — rapide",
    description: "Rapide et léger : réponses simples, classification, tri, tâches de volume.",
    relativeSpeed: 5,
    relativeCost: 1,
    supportsExtendedThinking: false,
  },
};

export const TIER_ORDER: ModelTier[] = ["haiku", "sonnet", "opus", "fable"];

export function isModelTier(value: string): value is ModelTier {
  return value in MODEL_TIERS;
}

/** Highest tier from `allowed` that does not exceed `requested`, or the lowest allowed tier if none qualify. */
export function clampTierToAllowed(requested: ModelTier, allowed: ModelTier[]): ModelTier {
  if (allowed.includes(requested)) return requested;
  const requestedIdx = TIER_ORDER.indexOf(requested);
  const eligible = TIER_ORDER.filter((t) => allowed.includes(t) && TIER_ORDER.indexOf(t) <= requestedIdx);
  if (eligible.length > 0) return eligible[eligible.length - 1];
  return allowed[0] ?? requested;
}
