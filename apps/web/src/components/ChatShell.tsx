"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import MessageBubble from "./MessageBubble";
import ModelControls, { type ActiveRouting } from "./ModelControls";
import type { ModelTier, ReasoningLevel, UsageMode } from "@/lib/anthropic";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatShell({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<UsageMode>("balanced");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tierOverride, setTierOverride] = useState<ModelTier | null>(null);
  const [reasoningOverride, setReasoningOverride] = useState<ReasoningLevel | null>(null);
  const [active, setActive] = useState<ActiveRouting | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((data) => setMessages(data.conversation?.messages ?? []));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ensureConversationId(): Promise<string> {
    if (conversationId) return conversationId;
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json();
    return data.conversation.id as string;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const activeId = await ensureConversationId();
    if (activeId !== conversationId) router.push(`/chat/${activeId}`);

    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text },
      { id: `local-assistant-${Date.now()}`, role: "assistant", content: "" },
    ]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversationId: activeId,
        message: text,
        mode,
        tierOverride,
        reasoningOverride,
      }),
    });

    if (!res.body) {
      setSending(false);
      return;
    }

    setActive({
      tier: (res.headers.get("x-apex-tier") as ModelTier) ?? "sonnet",
      reasoning: (res.headers.get("x-apex-reasoning") as ReasoningLevel) ?? "normal",
      mode: (res.headers.get("x-apex-mode") as UsageMode) ?? mode,
      fallback: res.headers.get("x-apex-fallback") === "1",
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          ...next[next.length - 1],
          content: next[next.length - 1].content + chunk,
        };
        return next;
      });
    }

    setSending(false);
    setSidebarKey((k) => k + 1);
  }

  return (
    <div className="flex h-screen">
      <Sidebar refreshKey={sidebarKey} />
      <main className="flex flex-1 flex-col">
        <ModelControls
          mode={mode}
          onModeChange={setMode}
          advancedOpen={advancedOpen}
          onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
          tierOverride={tierOverride}
          onTierOverrideChange={setTierOverride}
          reasoningOverride={reasoningOverride}
          onReasoningOverrideChange={setReasoningOverride}
          active={active}
        />

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <p className="mt-20 text-center text-neutral-500">
              Posez votre première question à Apex IA.
            </p>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} />
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 border-t border-neutral-800 p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-apex-gold"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-apex-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {sending ? "..." : "Envoyer"}
          </button>
        </form>
      </main>
    </div>
  );
}
