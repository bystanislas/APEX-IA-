import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidCategory } from "@/lib/memory";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.memory.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: { label?: string; value?: string; category?: string; enabled?: boolean } = {};
  if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (typeof body.value === "string" && body.value.trim()) data.value = body.value.trim();
  if (isValidCategory(body.category)) data.category = body.category;
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;

  const memory = await prisma.memory.update({ where: { id: params.id }, data });
  return NextResponse.json({ memory });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.memory.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
