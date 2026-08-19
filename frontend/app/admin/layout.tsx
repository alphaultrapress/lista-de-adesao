"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Layout da área administrativa.
 *
 * Um layout em app/admin/ vale para tudo abaixo de /admin — inclusive a tela de
 * login, que não pode ganhar sidebar nem header. Por isso o pathname decide:
 * /admin/login sai cru, o resto entra na casca.
 */
const SEM_CASCA = ["/admin/login"];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (SEM_CASCA.some((rota) => pathname.startsWith(rota))) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
