import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware desabilitado intencionalmente.
 *
 * O cliente Supabase JS (browser) armazena a sessão no localStorage, não em
 * cookies. Como o middleware roda no Edge e só enxerga cookies, ele não
 * conseguia detectar a sessão e criava um loop de redirecionamento entre
 * /login e /dashboard.
 *
 * A proteção das rotas autenticadas (/dashboard) é feita do lado do cliente
 * dentro da própria página, via supabase.auth.getSession() — se não houver
 * sessão, redireciona para /login. Esse padrão é o recomendado pelo Supabase
 * quando se usa apenas auth-js (sem auth-helpers com cookies).
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
