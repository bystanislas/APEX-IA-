import { MODEL_TIERS, TIER_ORDER, clampTierToAllowed, type ModelTier } from "./tiers";
import { REASONING_LEVELS, type ReasoningLevel } from "./reasoning";

export type UsageMode = "fast" | "balanced" | "deep" | "expert" | "max";

export const MODE_DEFAULTS: Record<UsageMode, { tier: ModelTier; reasoning: ReasoningLevel }> = {
  fast: { tier: "haiku", reasoning: "very_low" },
  balanced: { tier: "sonnet", reasoning: "normal" },
  deep: { tier: "opus", reasoning: "high" },
  expert: { tier: "opus", reasoning: "max" },
  max: { tier: "fable", reasoning: "max" },
};

export type QueryComplexity = "simple" | "standard" | "complex" | "critical";

const COMPLEXITY_TO_MODE: Record<QueryComplexity, UsageMode> = {
  simple: "fast",
  standard: "balanced",
  complex: "deep",
  critical: "max",
};

/**
 * Very cheap heuristic used only when the caller hasn't picked a mode
 * explicitly. Real task-complexity detection (multi-step planning, tool use,
 * code volume) belongs in the agents layer — this is a first-pass triage.
 */
export function classifyComplexity(text: string): QueryComplexity {
  const length = text.trim().length;
  const criticalMarkers = /\b(architecture|stratégie|strategy|audit|sécurité|security|migration|production)\b/i;
  const complexMarkers = /\b(code|analyse|compare|plan|debug|optimi[sz]e|design)\b/i;

  if (length > 1200 || criticalMarkers.test(text)) return "critical";
  if (length > 400 || complexMarkers.test(text)) return "complex";
  if (length > 80) return "standard";
  return "simple";
}

export interface RouteRequestInput {
  /** Explicit mode chosen by the user (a preset bundling tier + reasoning). */
  mode?: UsageMode;
  /** Manual overrides, applied after the mode preset. */
  tierOverride?: ModelTier;
  reasoningOverride?: ReasoningLevel;
  /** Free text used for auto-classification when no mode is given. */
  inputText?: string;
  /** Tiers this tenant/user is permitted to use, in priority order. Omit to allow all. */
  allowedTiers?: ModelTier[];
}

export interface RouteDecision {
  tier: ModelTier;
  modelId: string;
  reasoning: ReasoningLevel;
  thinkingBudgetTokens: number;
  maxTokens: number;
  mode: UsageMode;
  fellBack: boolean;
  fallbackReason?: string;
}

/**
 * Chooses a model tier + reasoning depth for a request. Deterministic and
 * side-effect free so it can be unit tested and reused by chat, agents and
 * batch jobs alike.
 */
export function routeRequest(input: RouteRequestInput): RouteDecision {
  const mode: UsageMode =
    input.mode ?? COMPLEXITY_TO_MODE[classifyComplexity(input.inputText ?? "")];

  const preset = MODE_DEFAULTS[mode];
  let tier = input.tierOverride ?? preset.tier;
  let reasoning = input.reasoningOverride ?? preset.reasoning;

  let fellBack = false;
  let fallbackReason: string | undefined;

  if (input.allowedTiers && input.allowedTiers.length > 0) {
    const clamped = clampTierToAllowed(tier, input.allowedTiers);
    if (clamped !== tier) {
      fellBack = true;
      fallbackReason = `Tier "${tier}" non autorisé pour ce tenant, repli sur "${clamped}"`;
      tier = clamped;
    }
  }

  const tierConfig = MODEL_TIERS[tier];
  if (!tierConfig.supportsExtendedThinking && REASONING_LEVELS[reasoning].thinkingBudgetTokens > 0) {
    const nextReasoning = TIER_ORDER.includes(tier) ? "normal" : reasoning;
    fellBack = true;
    fallbackReason = fallbackReason
      ? `${fallbackReason}; reasoning "${reasoning}" ramené à "${nextReasoning}" (modèle sans extended thinking)`
      : `Reasoning "${reasoning}" ramené à "${nextReasoning}" (modèle "${tier}" sans extended thinking)`;
    reasoning = nextReasoning as ReasoningLevel;
  }

  const reasoningConfig = REASONING_LEVELS[reasoning];

  return {
    tier,
    modelId: tierConfig.modelId,
    reasoning,
    thinkingBudgetTokens: reasoningConfig.thinkingBudgetTokens,
    maxTokens: reasoningConfig.maxTokens,
    mode,
    fellBack,
    fallbackReason,
  };
}
