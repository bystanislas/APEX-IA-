import jwt from "jsonwebtoken";

/**
 * Identité normalisée qu'Apex IA utilise en interne, quelle que soit la source
 * (LibreChat, futur SSO, etc.). Chaque module métier doit consommer CE type,
 * pas la forme brute d'un provider particulier.
 */
export interface NormalizedIdentity {
  /** Identifiant stable et unique côté Apex : `<provider>:<id source>`. */
  providerUserId: string;
  /** Provider d'origine tel que LibreChat le déclare (local, google, openid...). */
  provider: string;
  email: string;
  name: string | null;
}

/**
 * Forme réelle du payload signé par LibreChat.
 * Source : apps/librechat, packages/data-schemas/src/methods/user.ts
 *   payload: { id, username, provider, email }
 * signé via jsonwebtoken (HS256 par défaut) avec le secret JWT_SECRET.
 */
interface LibreChatTokenPayload {
  id: string;
  email: string;
  username?: string | null;
  provider?: string | null;
  iat?: number;
  exp?: number;
}

export class LibreChatTokenError extends Error {
  constructor(
    message: string,
    readonly reason: "missing_secret" | "invalid" | "expired" | "malformed"
  ) {
    super(message);
    this.name = "LibreChatTokenError";
  }
}

/**
 * Vérifie un access token émis par LibreChat et renvoie une identité normalisée.
 *
 * Sécurité (zero-trust, cf. cahier des charges) :
 * - l'algorithme est figé à HS256 : `verify` refuse toute autre valeur d'`alg`,
 *   ce qui bloque les attaques de confusion d'algorithme (`alg: none`, RS→HS).
 * - un secret vide fait échouer explicitement plutôt que de laisser passer.
 * - le token expiré est distingué du token invalide pour un diagnostic propre.
 *
 * Ne fait AUCUN accès réseau ni base de données : purement déterministe, donc
 * testable en isolation. Le rattachement au compte local est fait par l'appelant.
 */
export function verifyLibreChatToken(token: string, secret: string | undefined): NormalizedIdentity {
  if (!secret) {
    throw new LibreChatTokenError(
      "JWT_SECRET partagé absent — impossible de vérifier le token LibreChat",
      "missing_secret"
    );
  }

  let payload: LibreChatTokenPayload;
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as LibreChatTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new LibreChatTokenError("Token LibreChat expiré", "expired");
    }
    throw new LibreChatTokenError("Token LibreChat invalide", "invalid");
  }

  if (!payload?.id || !payload?.email) {
    throw new LibreChatTokenError(
      "Payload LibreChat incomplet (id ou email manquant)",
      "malformed"
    );
  }

  return {
    providerUserId: `librechat:${payload.id}`,
    provider: payload.provider ?? "local",
    email: payload.email.toLowerCase(),
    name: payload.username ?? null,
  };
}
