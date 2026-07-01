import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  streamCompletion,
  routeRequest,
  type ChatMessage,
  type ModelTier,
  type ReasoningLevel,
  type UsageMode,
} from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { conversationId, message } = body as { conversationId?: string; message?: string };
  const mode = body.mode as UsageMode | undefined;
  const tierOverride = body.tierOverride as ModelTier | undefined;
  const reasoningOverride = body.reasoningOverride as ReasoningLevel | undefined;

  if (!conversationId || !message) {
    return new Response("conversationId and message are required", { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return new Response("Not found", { status: 404 });

  const decision = routeRequest({ mode, tierOverride, reasoningOverride, inputText: message });

  if (decision.fellBack) {
    console.warn(`[model-router] ${decision.fallbackReason ?? "fallback applied"}`, {
      userId: session.user.id,
      conversationId,
    });
  }

  await prisma.message.create({
    data: { conversationId, role: "user", content: message },
  });

  if (conversation.messages.length === 0) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: message.slice(0, 60) },
    });
  }

  const history: ChatMessage[] = [
    ...conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamCompletion(history, decision)) {
          if (event.type !== "text") continue;
          full += event.delta;
          controller.enqueue(encoder.encode(event.delta));
        }
        await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: full,
            modelTier: decision.tier,
            modelId: decision.modelId,
            reasoningLevel: decision.reasoning,
            usageMode: decision.mode,
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n[Erreur: ${err instanceof Error ? err.message : "inconnue"}]`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-apex-tier": decision.tier,
      "x-apex-model": decision.modelId,
      "x-apex-reasoning": decision.reasoning,
      "x-apex-mode": decision.mode,
      "x-apex-fallback": decision.fellBack ? "1" : "0",
    },
  });
}
