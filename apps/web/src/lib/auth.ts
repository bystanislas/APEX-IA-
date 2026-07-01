import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyLibreChatToken, LibreChatTokenError } from "@apex-ia/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // Voie 1 : compte local email/mot de passe (comptes créés dans apps/web).
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        // passwordHash null = compte lié via provider externe : refuser le login local.
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name ?? user.email };
      },
    }),

    // Voie 2 : pont d'identité LibreChat. Reçoit un access token LibreChat,
    // le vérifie avec le JWT_SECRET partagé, puis provisionne/rattache le
    // compte local. Voir docs/IDENTITY_BRIDGE.md.
    CredentialsProvider({
      id: "librechat",
      name: "LibreChat",
      credentials: { token: { label: "LibreChat token", type: "text" } },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        let identity;
        try {
          identity = verifyLibreChatToken(credentials.token, process.env.LIBRECHAT_JWT_SECRET);
        } catch (err) {
          if (err instanceof LibreChatTokenError) {
            console.warn(`[identity-bridge] refus token LibreChat: ${err.reason}`);
          }
          return null;
        }

        // Rattachement en 3 temps pour éviter toute collision de contraintes :
        // 1) déjà lié via providerUserId → réutiliser ;
        // 2) compte local préexistant au même email → le lier (pas de doublon) ;
        // 3) sinon → créer un compte lié.
        let user = await prisma.user.findUnique({
          where: { providerUserId: identity.providerUserId },
        });

        if (!user) {
          const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });
          if (byEmail) {
            user = await prisma.user.update({
              where: { id: byEmail.id },
              data: { providerUserId: identity.providerUserId, name: byEmail.name ?? identity.name },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email: identity.email,
                name: identity.name,
                provider: "librechat",
                providerUserId: identity.providerUserId,
              },
            });
          }
        }

        return { id: user.id, email: user.email, name: user.name ?? user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
};
