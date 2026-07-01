export type ReasoningLevel = "very_low" | "low" | "normal" | "high" | "max";

export interface ReasoningConfig {
  id: ReasoningLevel;
  label: string;
  order: number;
  /** Extended-thinking token budget. 0 means thinking is disabled outright. */
  thinkingBudgetTokens: number;
  /** Response max_tokens ceiling (must exceed thinkingBudgetTokens when thinking is enabled). */
  maxTokens: number;
}

export const REASONING_LEVELS: Record<ReasoningLevel, ReasoningConfig> = {
  very_low: { id: "very_low", label: "Très faible", order: 0, thinkingBudgetTokens: 0, maxTokens: 1024 },
  low: { id: "low", label: "Faible", order: 1, thinkingBudgetTokens: 0, maxTokens: 1536 },
  normal: { id: "normal", label: "Normal", order: 2, thinkingBudgetTokens: 0, maxTokens: 2048 },
  high: { id: "high", label: "Élevé", order: 3, thinkingBudgetTokens: 4096, maxTokens: 8192 },
  max: { id: "max", label: "Maximum", order: 4, thinkingBudgetTokens: 12000, maxTokens: 16000 },
};

export const REASONING_ORDER: ReasoningLevel[] = ["very_low", "low", "normal", "high", "max"];

export function isReasoningLevel(value: string): value is ReasoningLevel {
  return value in REASONING_LEVELS;
}
