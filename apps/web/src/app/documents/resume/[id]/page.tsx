import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ResumeEditor from "@/components/documents/ResumeEditor";

export default async function ResumeEditorPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <ResumeEditor resumeId={params.id} />;
}
