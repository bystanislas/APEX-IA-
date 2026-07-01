import { NextResponse } from "next/server";
import { verifyLibreChatToken, LibreChatTokenError } from "@apex-ia/auth";

/**
 * Point de contrôle du pont d'identité : vérifie (sans créer de session) qu'un
 * token LibreChat est valide et renvoie l'identité normalisée. Utile pour le
 * débogage du pont et pour une éventuelle vérification côté client avant
 * d'appeler `signIn("librechat", { token })`.
 *
 * L'établissement réel de la session apps/web passe par NextAuth (provider
 * "librechat" dans src/lib/auth.ts), pas par cette route.
 */
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) {
    return NextResponse.json({ ok: false, error: "token requis" }, { status: 400 });
  }

  try {
    const identity = verifyLibreChatToken(token, process.env.LIBRECHAT_JWT_SECRET);
    return NextResponse.json({ ok: true, identity });
  } catch (err) {
    if (err instanceof LibreChatTokenError) {
      const status = err.reason === "missing_secret" ? 500 : 401;
      return NextResponse.json({ ok: false, reason: err.reason }, { status });
    }
    return NextResponse.json({ ok: false, error: "erreur inattendue" }, { status: 500 });
  }
}
