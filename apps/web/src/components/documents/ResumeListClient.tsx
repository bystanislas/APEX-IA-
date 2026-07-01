"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ResumeSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ResumeListClient() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents/resumes")
      .then((r) => r.json())
      .then((data) => {
        setResumes(data.resumes ?? []);
        setLoading(false);
      });
  }, []);

  async function createResume() {
    const res = await fetch("/api/documents/resumes", { method: "POST" });
    const data = await res.json();
    router.push(`/documents/resume/${data.resume.id}`);
  }

  async function deleteResume(id: string) {
    await fetch(`/api/documents/resumes/${id}`, { method: "DELETE" });
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-apex-gold">Mes CV</h1>
          <Link href="/chat" className="text-xs text-neutral-500 hover:text-neutral-300">
            ← Retour au chat
          </Link>
        </div>
        <button
          onClick={createResume}
          className="rounded-lg bg-apex-gold px-4 py-2 text-sm font-medium text-black"
        >
          + Nouveau CV
        </button>
      </div>

      {loading && <p className="text-neutral-500">Chargement...</p>}
      {!loading && resumes.length === 0 && (
        <p className="text-neutral-500">Aucun CV pour l&apos;instant. Créez-en un.</p>
      )}

      <ul className="space-y-2">
        {resumes.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <Link href={`/documents/resume/${r.id}`} className="text-sm hover:text-apex-gold">
              {r.title}
              <span className="ml-2 text-xs text-neutral-500">
                {new Date(r.updatedAt).toLocaleDateString("fr-FR")}
              </span>
            </Link>
            <button
              onClick={() => deleteResume(r.id)}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
