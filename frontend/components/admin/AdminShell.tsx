"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import { signOutAndClearSession, supabase } from "@/lib/supabase";
import { trilha } from "@/lib/admin/nav";
import { ADM, HEADER_H, SIDEBAR_MS, SIDEBAR_W, SIDEBAR_W_COLLAPSED } from "@/lib/admin/tokens";
import AdminSidebar from "./AdminSidebar";
import CommandPalette from "./CommandPalette";

const CHAVE_RECOLHIDA = "alpha-admin-sidebar-recolhida";

/**
 * Casca persistente do painel: sidebar + header fixos, conteúdo rolando dentro.
 *
 * A guarda de admin continua no cliente, como já era — validar papel no servidor
 * exige migrar a sessão do Supabase para cookies, o que mexe em todo o sistema
 * e ficou para uma etapa própria.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [recolhida, setRecolhida] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [emailAdmin, setEmailAdmin] = useState<string | null>(null);
  // A sidebar só desloca o conteúdo no desktop; no mobile ela é drawer.
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Preferência de recolhimento. Lida depois da montagem para não divergir do
  // HTML do servidor, que não tem acesso ao localStorage.
  useEffect(() => {
    try {
      setRecolhida(localStorage.getItem(CHAVE_RECOLHIDA) === "1");
    } catch {
      /* modo privado pode bloquear o storage; segue expandida */
    }
  }, []);

  const alternar = useCallback(() => {
    setRecolhida((v) => {
      const novo = !v;
      try {
        localStorage.setItem(CHAVE_RECOLHIDA, novo ? "1" : "0");
      } catch {
        /* sem persistência, só nesta sessão */
      }
      return novo;
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setEmailAdmin(data.session?.user.email ?? null);
    })();
  }, []);

  // Ctrl+K / Cmd+K abre a busca global.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaleta((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Trocar de página fecha o drawer.
  useEffect(() => setDrawer(false), [pathname]);

  const logout = useCallback(async () => {
    await signOutAndClearSession();
    router.replace("/admin/login");
  }, [router]);

  const migalhas = trilha(pathname);

  return (
    <div className="min-h-[100dvh]" style={{ background: ADM.bg }}>
      {/* sidebar fixa — desktop */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AdminSidebar
          recolhida={recolhida}
          onToggle={alternar}
          emailAdmin={emailAdmin}
          onLogout={logout}
        />
      </div>

      {/* drawer — mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 cursor-default"
            style={{ background: "rgba(17,24,22,0.42)" }}
          />
          <div className="absolute inset-y-0 left-0">
            <AdminSidebar
              recolhida={false}
              onToggle={alternar}
              emailAdmin={emailAdmin}
              onLogout={logout}
              mobile
              onFechar={() => setDrawer(false)}
            />
          </div>
        </div>
      )}

      {/* área de conteúdo, deslocada pela largura da sidebar */}
      <div
        style={{
          // O recuo acompanha a sidebar com a mesma curva, então expandir e
          // recolher não dá tranco no conteúdo.
          paddingLeft: desktop ? (recolhida ? SIDEBAR_W_COLLAPSED : SIDEBAR_W) : 0,
          transition: `padding-left ${SIDEBAR_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6"
          style={{
            height: HEADER_H,
            background: ADM.surface,
            borderBottom: `1px solid ${ADM.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-md lg:hidden"
            style={{ border: `1px solid ${ADM.border}`, color: ADM.text }}
          >
            <Menu size={17} strokeWidth={1.7} />
          </button>

          {/* migalha de pão */}
          <nav aria-label="Trilha" className="hidden min-w-0 md:block">
            <ol className="flex items-center gap-2 text-[12.5px]">
              {migalhas.map((m, i) => (
                <li key={`${m}-${i}`} className="flex items-center gap-2">
                  {i > 0 && <span style={{ color: ADM.border }}>/</span>}
                  <span
                    style={{
                      color: i === migalhas.length - 1 ? ADM.text : ADM.textMuted,
                      fontWeight: i === migalhas.length - 1 ? 500 : 400,
                    }}
                  >
                    {m}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* busca global */}
          <button
            type="button"
            onClick={() => setPaleta(true)}
            className="ml-auto flex items-center gap-2 rounded-md px-3 text-[13px] transition-colors"
            style={{
              height: 38,
              minWidth: 0,
              background: ADM.bg,
              border: `1px solid ${ADM.border}`,
              color: ADM.textMuted,
            }}
          >
            <Search size={15} strokeWidth={1.7} />
            <span className="hidden sm:inline">Buscar…</span>
            <kbd
              className="ml-2 hidden rounded px-1.5 py-0.5 text-[10px] md:inline"
              style={{ background: ADM.surface, border: `1px solid ${ADM.border}` }}
            >
              Ctrl K
            </kbd>
          </button>

          {/* Notificações e ajuda saíram: eram botões sem ação. Voltam quando
              os módulos existirem de fato. */}

          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: ADM.ink, color: "#FFFFFF" }}
            title={emailAdmin || "Administrador"}
          >
            {(emailAdmin || "A").slice(0, 1).toUpperCase()}
          </span>
        </header>

        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>

      <CommandPalette aberto={paleta} onFechar={() => setPaleta(false)} />
    </div>
  );
}
