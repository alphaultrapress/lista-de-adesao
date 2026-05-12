import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Sem env configurado, deixa passar — evita 500 em /login e /cadastro
  // quando o desenvolvedor ainda não criou .env.local. A própria página
  // tratará a indisponibilidade do Supabase.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;
    const isProtected = pathname.startsWith("/dashboard");
    const isAuthPage = pathname === "/login" || pathname === "/cadastro";

    if (isProtected && !session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (isAuthPage && session) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return res;
  } catch {
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/cadastro"],
};
