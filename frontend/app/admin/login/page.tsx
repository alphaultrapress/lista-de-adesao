"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AuthField, { EyeToggle } from "@/components/auth/AuthField";
import AuthButton from "@/components/auth/AuthButton";
import { signOutAndClearSession, supabase } from "@/lib/supabase";
import { ADM, RADIUS } from "@/lib/admin/tokens";

/** logo-dark.png é 2000×2000 com a marca em 66% da altura → caixa 1.515:1. */
const LOGO_H = 56;
const LOGO_BOX = Math.round(LOGO_H * 1.515);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return;

      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (admin) router.replace("/admin/dashboard");
    })();
  }, [router]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading) return; // bloqueia envio duplicado
    setError(undefined);
    setLoading(true);

    const { data, error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });

    if (signError || !data.user) {
      setLoading(false);
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    setLoading(false);

    if (adminError || !admin) {
      await signOutAndClearSession();
      setError("Este usuário não possui permissão administrativa.");
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 py-10"
      style={{ background: ADM.bg }}
    >
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-[12.5px] transition-colors hover:text-[#171816]"
        style={{ color: ADM.textMuted }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        Voltar ao início
      </Link>

      <div className="w-full" style={{ maxWidth: 420 }}>
        {/* marca, com a transparência do PNG quadrado recortada */}
        <span
          className="mx-auto mb-8 block overflow-hidden"
          style={{ height: LOGO_H, width: LOGO_BOX }}
        >
          <Image
            src="/logos/logo-dark.png"
            alt="Alpha Convites"
            width={LOGO_BOX}
            height={LOGO_H}
            priority
            className="h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </span>

        <div
          style={{
            background: ADM.surface,
            border: `1px solid ${ADM.border}`,
            borderRadius: RADIUS + 2,
            padding: 28,
            boxShadow: "0 18px 48px rgba(17,24,22,0.06)",
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium uppercase"
            style={{ letterSpacing: "0.1em", background: ADM.bg, color: ADM.textMuted }}
          >
            <ShieldCheck size={12} strokeWidth={2} />
            Área restrita
          </span>

          <h1
            className="mt-4 font-semibold"
            style={{ fontSize: 22, letterSpacing: "-0.02em", color: ADM.text }}
          >
            Acesso administrativo
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.5]" style={{ color: ADM.textMuted }}>
            Entre com suas credenciais para acessar a gestão da plataforma.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-7">
            <AuthField
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AuthField
              label="Senha"
              type={verSenha ? "text" : "password"}
              name="senha"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              action={<EyeToggle visivel={verSenha} onToggle={() => setVerSenha((v) => !v)} />}
              required
            />

            {error && (
              <div
                role="alert"
                className="mb-5 px-4 py-3 text-[13px]"
                style={{
                  borderRadius: RADIUS,
                  border: `1px solid ${ADM.danger}`,
                  background: "rgba(180,35,45,0.05)",
                  color: ADM.danger,
                }}
              >
                {error}
              </div>
            )}

            <AuthButton type="submit" loading={loading} loadingLabel="Entrando...">
              Entrar no painel
            </AuthButton>
          </form>

          {/* Sem "criar conta": administrador é criado por outro administrador. */}
          <p className="mt-6 text-[12px] leading-[1.5]" style={{ color: ADM.textMuted }}>
            O acesso administrativo é concedido internamente. Se você representa uma
            turma,{" "}
            <Link
              href="/login"
              className="font-medium underline underline-offset-2"
              style={{ color: ADM.text }}
            >
              entre por aqui
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
