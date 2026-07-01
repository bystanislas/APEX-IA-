import {
  MODEL_TIERS,
  REASONING_LEVELS,
  routeRequest,
  type ModelTier,
  type ReasoningLevel,
  type RouteDecision,
  type UsageMode,
} from "@apex-ia/ai";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamResult {
  text: string;
  thinking: string;
}

export { MODEL_TIERS, REASONING_LEVELS, routeRequest };
export type { ModelTier, ReasoningLevel, RouteDecision, UsageMode };

/**
 * Streams a completion from the Anthropic Messages API following a routing
 * decision (model tier + reasoning depth). Extended thinking deltas are
 * exposed on a separate channel so the UI can choose to show or hide them;
 * they are never persisted as conversation history.
 */
export async function* streamCompletion(
  messages: ChatMessage[],
  decision: RouteDecision
): AsyncGenerator<{ type: "text" | "thinking"; delta: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const body: Record<string, unknown> = {
    model: decision.modelId,
    max_tokens: decision.maxTokens,
    stream: true,
    messages,
  };

  if (decision.thinkingBudgetTokens > 0) {
    body.thinking = { type: "enabled", budget_tokens: decision.thinkingBudgetTokens };
  } else {
    body.temperature = 1;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload);
        if (event.type !== "content_block_delta") continue;
        if (event.delta?.type === "text_delta") {
          yield { type: "text", delta: event.delta.text as string };
        } else if (event.delta?.type === "thinking_delta") {
          yield { type: "thinking", delta: event.delta.thinking as string };
        }
      } catch {
        // ignore malformed SSE fragments
      }
    }
  }
}
