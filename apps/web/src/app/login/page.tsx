"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      return;
    }
    router.push("/chat");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-xl font-semibold text-apex-gold">Apex IA</h1>
        <p className="text-sm text-neutral-400">Connexion à votre espace</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-apex-gold"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-apex-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-apex-gold px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-center text-sm text-neutral-400">
          Pas de compte ? <Link href="/register" className="text-apex-gold">Créer un compte</Link>
        </p>
      </form>
    </main>
  );
}
