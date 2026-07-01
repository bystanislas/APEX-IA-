"use client";

import { MODEL_TIERS, REASONING_LEVELS, type ModelTier, type ReasoningLevel, type UsageMode } from "@/lib/anthropic";

const MODES: { id: UsageMode; label: string; hint: string }[] = [
  { id: "fast", label: "Fast", hint: "Réponses immédiates" },
  { id: "balanced", label: "Balanced", hint: "Équilibre qualité/vitesse" },
  { id: "deep", label: "Deep", hint: "Analyse approfondie" },
  { id: "expert", label: "Expert", hint: "Raisonnement maximal" },
  { id: "max", label: "Max", hint: "Puissance maximale" },
];

const REASONING_ORDER: ReasoningLevel[] = ["very_low", "low", "normal", "high", "max"];
const TIER_ORDER: ModelTier[] = ["haiku", "sonnet", "opus", "fable"];

export interface ActiveRouting {
  tier: ModelTier;
  reasoning: ReasoningLevel;
  mode: UsageMode;
  fallback: boolean;
}

export default function ModelControls({
  mode,
  onModeChange,
  advancedOpen,
  onToggleAdvanced,
  tierOverride,
  onTierOverrideChange,
  reasoningOverride,
  onReasoningOverrideChange,
  active,
}: {
  mode: UsageMode;
  onModeChange: (m: UsageMode) => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  tierOverride: ModelTier | null;
  onTierOverrideChange: (t: ModelTier | null) => void;
  reasoningOverride: ReasoningLevel | null;
  onReasoningOverrideChange: (r: ReasoningLevel | null) => void;
  active: ActiveRouting | null;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-neutral-800 px-6 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            title={m.hint}
            onClick={() => onModeChange(m.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              mode === m.id
                ? "border-apex-gold bg-apex-gold/10 text-apex-gold"
                : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="ml-auto text-xs text-neutral-500 underline hover:text-neutral-300"
        >
          {advancedOpen ? "Masquer les réglages avancés" : "Réglages avancés"}
        </button>
      </div>

      {advancedOpen && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
          <label className="flex items-center gap-2">
            Modèle
            <select
              value={tierOverride ?? ""}
              onChange={(e) => onTierOverrideChange((e.target.value || null) as ModelTier | null)}
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            >
              <option value="">Auto (selon mode)</option>
              {TIER_ORDER.map((t) => (
                <option key={t} value={t}>
                  {MODEL_TIERS[t].label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            Raisonnement
            <select
              value={reasoningOverride ?? ""}
              onChange={(e) =>
                onReasoningOverrideChange((e.target.value || null) as ReasoningLevel | null)
              }
              className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
            >
              <option value="">Auto (selon mode)</option>
              {REASONING_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REASONING_LEVELS[r].label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {active && (
        <p className="text-xs text-neutral-500">
          Réponse générée avec <span className="text-apex-gold">{MODEL_TIERS[active.tier].label}</span>{" "}
          · raisonnement {REASONING_LEVELS[active.reasoning].label.toLowerCase()}
          {active.fallback && (
            <span className="ml-2 text-amber-400">(niveau ajusté automatiquement)</span>
          )}
        </p>
      )}
    </div>
  );
}
