/**
 * Protected tutor route. Middleware handles redirects; this server check is a
 * second line of defence and supplies the signed-in email to the workspace.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TutorWorkspace } from "@/components/tutor/TutorWorkspace";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function TutorPage() {
  const user = await getServerUser();
  if (!user) redirect("/login?next=/tutor");

  return <TutorWorkspace email={user.email ?? "learner"} />;
}
