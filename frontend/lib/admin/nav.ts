import { FileBarChart, LayoutDashboard, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Menu do painel.
 *
 * Só entram módulos que existem de verdade. Nada de item "em breve": link que
 * não leva a lugar nenhum só ocupa espaço e cansa quem usa todo dia.
 * Para adicionar um módulo novo, basta uma linha aqui.
 */
export const NAV: NavItem[] = [
  { label: "Visão geral", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Representantes", href: "/admin/representantes", icon: Users },
  { label: "Relatórios", href: "/admin/relatorios", icon: FileBarChart },
];

/** Migalha de pão a partir do pathname. */
export function trilha(pathname: string): string[] {
  if (pathname.startsWith("/admin/relatorios")) {
    return ["Administração", "Relatórios"];
  }
  if (pathname.startsWith("/admin/representantes")) {
    return ["Administração", "Representantes"];
  }
  if (pathname.startsWith("/admin/dashboard/")) {
    return ["Administração", "Representantes", "Detalhes"];
  }
  if (pathname.startsWith("/admin/dashboard")) {
    return ["Administração", "Visão geral"];
  }
  return ["Administração"];
}
