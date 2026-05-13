"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(undefined);
    setInfo(undefined);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha,
    });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos. Verifique e tente novamente.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleReset() {
    if (!email) {
      setError("Informe seu e-mail para recuperar a senha.");
      return;
    }
    setError(undefined);
    setInfo(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );
    if (error) {
      setError("Não foi possível enviar o e-mail. Tente novamente.");
      return;
    }
    setInfo("Enviamos um link de recuperação para o seu e-mail.");
  }

  return (
    <main className="page-canvas min-h-screen bg-bg flex flex-col">
      <PremiumHeader compact />

      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
        <div className="absolute inset-0 cinematic-noise opacity-40 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />

        <div className="relative w-full max-w-md fade-up">
          <div className="mb-11 text-center">
            <span className="tech-eyebrow">
              <span className="dot" />
              Acesso do representante
            </span>
            <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
              Entre na
              <br />
              <span className="italic font-light text-gray-500">sua conta.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-text-secondary">
              Apenas representantes de turma têm cadastro. Colegas que receberam
              o link devem acessá-lo diretamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card-hover space-y-5 p-6 md:p-8" noValidate>
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
