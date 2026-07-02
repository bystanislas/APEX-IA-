import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** Export de toute la mémoire personnelle au format JSON (droit à la portabilité). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id },
    select: { category: true, label: true, value: true, enabled: true, createdAt: true },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), memories }, null, 2);

  return new Response(payload, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="apex-memoire.json"`,
    },
  });
}
