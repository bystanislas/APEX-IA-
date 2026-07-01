import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ResumeData } from "@apex-ia/documents";

const EMPTY_RESUME: ResumeData = {
  contact: { fullName: "", title: "" },
  summary: "",
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  locale: "fr",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, locale: true, updatedAt: true },
  });

  return NextResponse.json({ resumes });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title : "Mon CV";

  const resume = await prisma.resume.create({
    data: { userId: session.user.id, title, data: EMPTY_RESUME as object, locale: "fr" },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
