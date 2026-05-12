"use client";

import { useState } from "react";
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
    <main className="min-h-screen bg-premium-black flex flex-col">
      <header className="border-b-[0.5px] border-premium-dark3">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Brand size="sm" />
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-premium-wide uppercase text-premium-gold mb-3">
              Acesso do representante
            </p>
            <h1 className="font-serif text-3xl tracking-premium-tight text-premium-white">
              Entre na sua conta
            </h1>
            <p className="mt-3 text-xs text-premium-light1">
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
              <div className="hairline border-premium-wine bg-premium-dark1 px-4 py-3 text-sm text-premium-wine">
                {error}
              </div>
            )}
            {info && (
              <div className="hairline border-premium-gold bg-premium-dark1 px-4 py-3 text-sm text-premium-gold">
                {info}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Entrando" : "Entrar"}
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="text-premium-light1 hover:text-premium-gold transition-colors tracking-premium-wide uppercase"
              >
                Esqueci minha senha
              </button>
              <Link
                href="/cadastro"
                className="text-premium-light1 hover:text-premium-gold transition-colors tracking-premium-wide uppercase"
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
