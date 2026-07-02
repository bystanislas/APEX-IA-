import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MemoryClient from "@/components/MemoryClient";

export default async function MemoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <MemoryClient />;
}
