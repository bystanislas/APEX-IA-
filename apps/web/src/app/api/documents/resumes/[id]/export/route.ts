import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { renderResumePdf, renderResumeDocx, type ResumeData } from "@apex-ia/documents";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const format = new URL(req.url).searchParams.get("format") === "docx" ? "docx" : "pdf";

  const resume = await prisma.resume.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!resume) return new Response("Not found", { status: 404 });

  const data = resume.data as unknown as ResumeData;
  const filename = `${resume.title.replace(/[^a-z0-9-_]+/gi, "_") || "cv"}.${format}`;

  if (format === "docx") {
    const buffer = await renderResumeDocx(data);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buffer = await renderResumePdf(data);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
