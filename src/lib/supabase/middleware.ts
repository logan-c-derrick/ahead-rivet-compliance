import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/_next",
  "/favicon.ico",
  "/api/health",
  "/api/ready",
  "/api/monitor",
  "/api/regulations/sync",
  "/legal",
];

function isPublic(pathname: string) {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Supplier upload portal (no login; token is the credential)
  if (pathname.startsWith("/outreach/respond/")) return true;
  return false;
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  const names = request.cookies
    .getAll()
    .map((cookie) => cookie.name)
    .filter((name) => name.startsWith("sb-"));

  for (const name of names) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
    });
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing Supabase env vars");

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        // IMPORTANT: set cookies on the RESPONSE
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const pathname = request.nextUrl.pathname;
  const shouldCheckAuth = pathname.startsWith("/login") || !isPublic(pathname);
  if (!shouldCheckAuth) {
    return response;
  }

  let user = null;
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    if (authError.code === "refresh_token_not_found") {
      // Stale local cookies are common in dev; clear them to stop repeated refresh errors.
      clearSupabaseAuthCookies(request, response);
    } else {
      console.warn("Supabase auth middleware error:", authError.message);
    }
  } else {
    user = data.user;
  }

  // If logged in, keep them out of /login
  if (user && pathname.startsWith("/login")) {
    const u = request.nextUrl.clone();
    u.pathname = "/dashboard";
    u.searchParams.delete("redirectTo");
    return NextResponse.redirect(u);
  }

  // If not logged in, protect everything else
  if (!user && !isPublic(pathname)) {
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(u);
  }

  return response;
}
