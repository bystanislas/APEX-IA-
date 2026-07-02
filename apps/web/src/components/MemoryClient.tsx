"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEMORY_CATEGORIES, categoryLabel } from "@/lib/memory";

interface Memory {
  id: string;
  category: string;
  label: string;
  value: string;
  enabled: boolean;
}

export default function MemoryClient() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("prenom");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  async function load() {
    const res = await fetch("/api/memory");
    const data = await res.json();
    setMemories(data.memories ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !value.trim()) return;
    await fetch("/api/memory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ category, label, value }),
    });
    setLabel("");
    setValue("");
    load();
  }

  async function toggle(m: Memory) {
    await fetch(`/api/memory/${m.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !m.enabled }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/memory/${id}`, { method: "DELETE" });
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-apex-gold">Ma mémoire</h1>
          <Link href="/chat" className="text-xs text-neutral-500 hover:text-neutral-300">
            ← Retour au chat
          </Link>
        </div>
        <a
          href="/api/memory/export"
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-apex-gold"
        >
          Exporter (JSON)
        </a>
      </div>

      <p className="mb-6 text-sm text-neutral-400">
        Ce qu&apos;Apex IA retient sur vous. Vous contrôlez tout : désactivez pour garder sans
        utiliser, supprimez définitivement, ou exportez.
      </p>

      <form onSubmit={add} className="mb-8 space-y-2 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-2 text-sm"
          >
            {MEMORY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Intitulé (ex: Prénom)"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Valeur (ex: Stanislas)"
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-apex-gold px-4 py-2 text-sm font-medium text-black"
          >
            Ajouter
          </button>
        </div>
      </form>

      {loading && <p className="text-neutral-500">Chargement...</p>}
      {!loading && memories.length === 0 && (
        <p className="text-neutral-500">Aucune préférence enregistrée pour l&apos;instant.</p>
      )}

      <ul className="space-y-2">
        {memories.map((m) => (
          <li
            key={m.id}
            className={`flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3 ${
              m.enabled ? "bg-neutral-900" : "bg-neutral-950 opacity-60"
            }`}
          >
            <div className="min-w-0">
              <span className="mr-2 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400">
                {categoryLabel(m.category)}
              </span>
              <span className="text-sm text-neutral-300">{m.label} :</span>{" "}
              <span className="text-sm">{m.value}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => toggle(m)}
                className="text-xs text-neutral-400 hover:text-apex-gold"
              >
                {m.enabled ? "Désactiver" : "Activer"}
              </button>
              <button onClick={() => remove(m.id)} className="text-xs text-neutral-500 hover:text-red-400">
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
