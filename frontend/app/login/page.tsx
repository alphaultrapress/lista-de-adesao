"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand, Footer } from "@/components/Brand";
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
    <main className="min-h-screen bg-bg flex flex-col">
      <header className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center">
          <Brand size="sm" variant="light" />
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-4">
              Acesso do representante
            </p>
            <h1 className="font-serif text-4xl tracking-premium-tight text-text-primary">
              Entre na sua conta
            </h1>
            <p className="mt-4 text-sm text-text-secondary leading-relaxed">
              Apenas representantes de turma têm cadastro. Colegas que receberam
              o link devem acessá-lo diretamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
              <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
                {error}
              </div>
            )}
            {info && (
              <div className="border border-champagne/30 bg-champagne/5 px-4 py-3 text-sm text-champagne-deep">
                {info}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Entrando" : "Entrar"}
            </Button>

            <div className="flex items-center justify-between text-[11px] tracking-premium-wide uppercase pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-text-secondary hover:text-text-primary transition-colors duration-250"
              >
                Esqueci minha senha
              </button>
              <Link
                href="/cadastro"
                className="text-text-secondary hover:text-text-primary transition-colors duration-250"
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
