/**
 * POST /auth/signout
 * Clears the Supabase session cookies and returns to the login screen.
 */
import { NextResponse } from "next/server";
import { withRequestLogging } from "@/lib/logging/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signoutRoute(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export const POST = withRequestLogging("/auth/signout", signoutRoute);
