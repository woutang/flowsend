import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function isValidRedirectPath(path: string): boolean {
  // Must start with "/" and not "//" (protocol-relative URL)
  // Must not contain ":" before first "/" (no protocol injection like javascript:)
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  // Check for protocol injection (e.g., "javascript:", "data:")
  const colonIndex = path.indexOf(":");
  const slashIndex = path.indexOf("/", 1);
  if (colonIndex !== -1 && (slashIndex === -1 || colonIndex < slashIndex)) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safePath = isValidRedirectPath(next) ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
