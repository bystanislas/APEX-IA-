"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ResumeData, ResumeExperience, ResumeEducation } from "@apex-ia/documents/types";

const EMPTY: ResumeData = {
  contact: { fullName: "", title: "" },
  summary: "",
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  locale: "fr",
};

function emptyExperience(): ResumeExperience {
  return { role: "", company: "", startDate: "", highlights: [""] };
}

function emptyEducation(): ResumeEducation {
  return { degree: "", school: "", startDate: "" };
}

export default function ResumeEditor({ resumeId }: { resumeId: string }) {
  const [title, setTitle] = useState("Mon CV");
  const [data, setData] = useState<ResumeData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    fetch(`/api/documents/resumes/${resumeId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.resume) {
          setTitle(res.resume.title);
          setData({ ...EMPTY, ...res.resume.data });
        }
        setLoading(false);
      });
  }, [resumeId]);

  async function save() {
    setSaving(true);
    await fetch(`/api/documents/resumes/${resumeId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, data }),
    });
    setSaving(false);
    setSavedAt(new Date());
  }

  if (loading) return <p className="p-10 text-neutral-500">Chargement...</p>;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/documents/resume" className="text-xs text-neutral-500 hover:text-neutral-300">
          ← Mes CV
        </Link>
        <div className="flex items-center gap-2">
          <select
            value={data.locale}
            onChange={(e) => setData({ ...data, locale: e.target.value as "fr" | "en" })}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <a
            href={`/api/documents/resumes/${resumeId}/export?format=pdf`}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-apex-gold"
          >
            Export PDF
          </a>
          <a
            href={`/api/documents/resumes/${resumeId}/export?format=docx`}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs hover:border-apex-gold"
          >
            Export DOCX
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-apex-gold px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50"
          >
            {saving ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>

      {savedAt && <p className="text-xs text-neutral-500">Enregistré à {savedAt.toLocaleTimeString("fr-FR")}</p>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du CV (ex: CV Développeur)"
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-apex-gold">Contact</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Nom complet"
            value={data.contact.fullName}
            onChange={(e) => setData({ ...data, contact: { ...data.contact, fullName: e.target.value } })}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Titre (ex: Développeur Full-Stack)"
            value={data.contact.title}
            onChange={(e) => setData({ ...data, contact: { ...data.contact, title: e.target.value } })}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            value={data.contact.email ?? ""}
            onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Téléphone"
            value={data.contact.phone ?? ""}
            onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Localisation"
            value={data.contact.location ?? ""}
            onChange={(e) => setData({ ...data, contact: { ...data.contact, location: e.target.value } })}
            className="col-span-2 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-apex-gold">Profil</h2>
        <textarea
          value={data.summary ?? ""}
          onChange={(e) => setData({ ...data, summary: e.target.value })}
          rows={3}
          placeholder="Résumé en 2-3 phrases"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-apex-gold">Expérience</h2>
          <button
            onClick={() => setData({ ...data, experiences: [...data.experiences, emptyExperience()] })}
            className="text-xs text-neutral-400 hover:text-apex-gold"
          >
            + Ajouter
          </button>
        </div>
        {data.experiences.map((exp, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-neutral-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Poste"
                value={exp.role}
                onChange={(e) => {
                  const next = [...data.experiences];
                  next[i] = { ...exp, role: e.target.value };
                  setData({ ...data, experiences: next });
                }}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Entreprise"
                value={exp.company}
                onChange={(e) => {
                  const next = [...data.experiences];
                  next[i] = { ...exp, company: e.target.value };
                  setData({ ...data, experiences: next });
                }}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Début (ex: Jan 2022)"
                value={exp.startDate}
                onChange={(e) => {
                  const next = [...data.experiences];
                  next[i] = { ...exp, startDate: e.target.value };
                  setData({ ...data, experiences: next });
                }}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
              />
              <input
                placeholder="Fin (vide si en cours)"
                value={exp.endDate ?? ""}
                onChange={(e) => {
                  const next = [...data.experiences];
                  next[i] = { ...exp, endDate: e.target.value };
                  setData({ ...data, experiences: next });
                }}
                className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
              />
            </div>
            <textarea
              placeholder="Réalisations, une par ligne"
              value={exp.highlights.join("\n")}
              onChange={(e) => {
                const next = [...data.experiences];
                next[i] = { ...exp, highlights: e.target.value.split("\n") };
                setData({ ...data, experiences: next });
              }}
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            />
            <button
              onClick={() =>
                setData({ ...data, experiences: data.experiences.filter((_, j) => j !== i) })
              }
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-apex-gold">Formation</h2>
          <button
            onClick={() => setData({ ...data, education: [...data.education, emptyEducation()] })}
            className="text-xs text-neutral-400 hover:text-apex-gold"
          >
            + Ajouter
          </button>
        </div>
        {data.education.map((ed, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-800 p-3">
            <input
              placeholder="Diplôme"
              value={ed.degree}
              onChange={(e) => {
                const next = [...data.education];
                next[i] = { ...ed, degree: e.target.value };
                setData({ ...data, education: next });
              }}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="École"
              value={ed.school}
              onChange={(e) => {
                const next = [...data.education];
                next[i] = { ...ed, school: e.target.value };
                setData({ ...data, education: next });
              }}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Début"
              value={ed.startDate}
              onChange={(e) => {
                const next = [...data.education];
                next[i] = { ...ed, startDate: e.target.value };
                setData({ ...data, education: next });
              }}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Fin"
              value={ed.endDate ?? ""}
              onChange={(e) => {
                const next = [...data.education];
                next[i] = { ...ed, endDate: e.target.value };
                setData({ ...data, education: next });
              }}
              className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => setData({ ...data, education: data.education.filter((_, j) => j !== i) })}
              className="col-span-2 text-left text-xs text-neutral-500 hover:text-red-400"
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-apex-gold">Compétences (séparées par des virgules)</h2>
        <input
          value={data.skills.join(", ")}
          onChange={(e) =>
            setData({ ...data, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
          }
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-apex-gold">Langues (format: Nom:Niveau, séparées par des virgules)</h2>
        <input
          value={data.languages.map((l) => `${l.name}:${l.level}`).join(", ")}
          onChange={(e) =>
            setData({
              ...data,
              languages: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => {
                  const [name, level] = s.split(":");
                  return { name: (name ?? "").trim(), level: (level ?? "").trim() };
                }),
            })
          }
          placeholder="Français:Natif, Anglais:Courant"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
        />
      </section>
    </main>
  );
}
