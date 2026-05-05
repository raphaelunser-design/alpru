import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getProxyAccessMode } from "@/lib/accessModeProxy";
import { ACCESS_COOKIE, ACCESS_QUERY, getAccessPassword } from "@/lib/accessModeShared";

function isPublicAsset(pathname: string) {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

function cookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  };
}

function isAuthRedirect(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/auth/callback") return true;
  if (pathname !== "/account") return false;
  const authMode = searchParams.get("auth");
  return authMode === "recovery" || authMode === "magic";
}

async function nextWithSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Required by Supabase SSR auth: this refreshes expired auth cookies without
  // trusting a stale session object in route/proxy code.
  await supabase.auth.getUser().catch(() => null);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (isPublicAsset(pathname)) return NextResponse.next();
  if (isAuthRedirect(pathname, searchParams)) return nextWithSupabaseSession(request);

  const accessMode = await getProxyAccessMode();
  const requiredToken = getAccessPassword();
  if (accessMode === "public") return nextWithSupabaseSession(request);

  if (pathname === "/private-access" && !requiredToken) return nextWithSupabaseSession(request);
  if (!requiredToken) return NextResponse.redirect(new URL("/private-access", request.url));

  const tokenFromQuery = (searchParams.get(ACCESS_QUERY) || "").trim();
  const tokenFromCookie = request.cookies.get(ACCESS_COOKIE)?.value || "";
  const hasAccess = tokenFromCookie === requiredToken;
  const usesValidAccessLink = tokenFromQuery === requiredToken;

  if (usesValidAccessLink) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete(ACCESS_QUERY);
    if (cleanUrl.pathname === "/private-access") cleanUrl.pathname = "/";

    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(ACCESS_COOKIE, requiredToken, cookieOptions(request));
    return response;
  }

  if (hasAccess) {
    if (pathname === "/private-access") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return nextWithSupabaseSession(request);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Alpivo ist aktuell privat freigeschaltet." }, { status: 401 });
  }

  if (pathname === "/private-access") return nextWithSupabaseSession(request);

  const accessUrl = new URL("/private-access", request.url);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
