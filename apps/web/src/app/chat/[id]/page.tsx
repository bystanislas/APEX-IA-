import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatShell from "@/components/ChatShell";

export default async function ChatConversationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <ChatShell conversationId={params.id} />;
}
