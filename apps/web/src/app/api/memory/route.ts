import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCategory } from "@/lib/memory";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memories = await prisma.memory.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const value = typeof body.value === "string" ? body.value.trim() : "";
  const category = isValidCategory(body.category) ? body.category : "general";

  if (!label || !value) {
    return NextResponse.json({ error: "label et value requis" }, { status: 400 });
  }

  const memory = await prisma.memory.create({
    data: { userId: session.user.id, label, value, category },
  });

  return NextResponse.json({ memory }, { status: 201 });
}
