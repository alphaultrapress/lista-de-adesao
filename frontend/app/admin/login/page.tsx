"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signOutAndClearSession, supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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

      if (admin) {
        router.replace("/admin/dashboard");
      }
    })();
  }, [router]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
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
    <main className="page-canvas min-h-screen bg-bg flex flex-col">
      <PremiumHeader
        compact
        centeredBrand
        brandSize="lg"
        actions={[{ href: "/login", label: "Login" }]}
      />

      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-20 pt-32">
        <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
        <div className="absolute inset-0 cinematic-noise opacity-40 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />

        <div className="relative w-full max-w-md fade-up">
          <div className="mb-11 text-center">
            <span className="tech-eyebrow">
              <span className="dot" />
              Acesso administrativo
            </span>
            <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
              Painel da
              <br />
              <span className="italic font-light text-gray-500">Alpha.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-text-secondary">
              Área restrita para acompanhar representantes e alunos cadastrados.
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

            <Button type="submit" loading={loading} fullWidth>
              {loading ? "Entrando" : "Entrar como admin"}
            </Button>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}
