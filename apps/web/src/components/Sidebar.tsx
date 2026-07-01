"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface ConversationSummary {
  id: string;
  title: string;
}

export default function Sidebar({ refreshKey }: { refreshKey: number }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations ?? []));
  }, [refreshKey]);

  async function newConversation() {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json();
    router.push(`/chat/${data.conversation.id}`);
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-neutral-800 bg-neutral-950">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-apex-gold">Apex IA</h2>
        <button
          onClick={newConversation}
          className="mt-3 w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:border-apex-gold"
        >
          + Nouvelle conversation
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/chat/${c.id}`)}
            className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-900 ${
              pathname === `/chat/${c.id}` ? "bg-neutral-900 text-apex-gold" : "text-neutral-300"
            }`}
          >
            {c.title}
          </button>
        ))}
      </nav>
      <div className="space-y-1 p-4">
        <Link
          href="/documents/resume"
          className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-apex-gold"
        >
          Mes documents (CV)
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-900"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
