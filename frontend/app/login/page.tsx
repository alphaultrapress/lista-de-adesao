"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type LoginTarget = "admin" | "representative" | "onboarding";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;

      if (!userId) {
        setCheckingSession(false);
        return;
      }

      await routeAuthenticatedUser(userId, true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function findLoginTarget(userId: string): Promise<LoginTarget> {
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminError && adminError.code === "42P01") {
      throw new Error(
        "O banco ainda precisa receber o schema novo. Execute o arquivo supabase/schema.sql no Supabase.",
      );
    }

    if (admin) return "admin";

    const { data: representative, error: representativeError } = await supabase
      .from("representatives")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (representativeError && representativeError.code === "42P01") {
      throw new Error(
        "O banco ainda precisa receber o schema novo. Execute o arquivo supabase/schema.sql no Supabase.",
      );
    }

    return representative ? "representative" : "onboarding";
  }

  async function routeAuthenticatedUser(userId: string, fromSession = false) {
    try {
      const target = await findLoginTarget(userId);

      if (target === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (target === "representative") {
        router.replace("/dashboard");
        return;
      }

      router.replace("/cadastro");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível verificar seu acesso.",
      );

      if (fromSession) {
        setCheckingSession(false);
      }
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(undefined);
    setInfo(undefined);
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

    await routeAuthenticatedUser(data.user.id);
    setLoading(false);
  }

  async function handleReset() {
    if (!email) {
      setError("Informe seu e-mail para recuperar a senha.");
      return;
    }

    setError(undefined);
    setInfo(undefined);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );

    if (resetError) {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }

    setInfo("Enviamos um link de recuperacao para o seu e-mail.");
  }

  if (checkingSession) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando acesso
        </p>
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen bg-bg flex flex-col">
      <PremiumHeader compact centeredBrand brandSize="lg" />

      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
        <div className="absolute inset-0 cinematic-noise opacity-40 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />

        <div className="relative w-full max-w-md fade-up">
          <div className="mb-11 text-center">
            <span className="tech-eyebrow">
              <span className="dot" />
              Acesso ao sistema
            </span>
            <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
              Entre na
              <br />
              <span className="italic font-light text-gray-500">sua conta.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-text-secondary">
              Use seu acesso administrativo ou a conta de representante da turma.
              Alunos entram apenas pelo link publico da turma.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card-hover space-y-5 p-6 md:p-8"
            noValidate
          >
            <Input
              label="E-mail"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              name="senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />

            {error && (
              <div className="border border-crimson/30 bg-crimson/5 px-4 py-3 text-sm text-crimson">
                {error}
              </div>
            )}
            {info && (
              <div className="border border-ink/20 bg-ink/[0.03] px-4 py-3 text-sm text-text-primary">
                {info}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Entrando" : "Entrar"}
            </Button>

            <div className="flex items-center justify-between pt-2 text-[11px] uppercase tracking-premium-wide">
              <button
                type="button"
                onClick={handleReset}
                className="text-text-secondary transition-colors duration-250 hover:text-text-primary"
              >
                Esqueci minha senha
              </button>
              <Link
                href="/cadastro"
                className="text-text-secondary transition-colors duration-250 hover:text-text-primary"
              >
                Criar conta
              </Link>
            </div>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
