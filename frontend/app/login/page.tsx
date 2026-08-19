"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import AuthCard, { type AuthEstado } from "@/components/auth/AuthCard";
import AuthField, { EyeToggle } from "@/components/auth/AuthField";
import AuthButton from "@/components/auth/AuthButton";
import { AUTH } from "@/components/auth/tokens";
import { supabase } from "@/lib/supabase";
import { isValidPhoneBr, maskPhone } from "@/lib/cpf";
import { useLoadingGate } from "@/components/ui/LoadingScreen";

type LoginTarget = "admin" | "representative" | "onboarding";

const DUPLICATE_EMAIL_MESSAGE = "Este e-mail já está cadastrado.";

/**
 * Altura da marca no cabeçalho, em px. A largura sai daqui pelo fator 1.515.
 *
 * Pode crescer à vontade sem empurrar o card: a marca está fora do fluxo, então
 * a altura do cabeçalho continua sendo ditada apenas pelo link "Voltar ao
 * início". Se passar da faixa do cabeçalho, ela só avança sobre o off-white.
 */
const LOGO_H = 74;
/** Distância do topo da página até a marca. */
const LOGO_TOP = 16;
/** 2000×2000 com a marca em 66% da altura → caixa 1.515× mais larga que alta. */
const LOGO_BOX = Math.round(LOGO_H * 1.515);

/** Mesma detecção de e-mail duplicado usada no cadastro, para o erro ser igual. */
function isDuplicateEmailError(error: any) {
  const message = String(
    [
      error?.message,
      error?.error_description,
      error?.details,
      error?.hint,
      error?.constraint,
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();

  return (
    message.includes("user already registered") ||
    message.includes("already registered") ||
    message.includes("email already exists") ||
    message.includes("already been registered") ||
    (error?.code === "23505" && message.includes("email")) ||
    (message.includes("email") && message.includes("exists"))
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<AuthEstado>("entrar");
  const [checkingSession, setCheckingSession] = useState(true);

  // ── entrar ──
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [info, setInfo] = useState<string | undefined>();
  const [sucesso, setSucesso] = useState(false);

  // ── criar conta ──
  const [cadastro, setCadastro] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    confirmar: "",
  });
  const [aceito, setAceito] = useState(false);
  const [verSenhaNova, setVerSenhaNova] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroTopo, setErroTopo] = useState<string | undefined>();

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
      setSucesso(false);

      if (fromSession) {
        setCheckingSession(false);
      }
    }
  }

  async function handleLogin(ev: React.FormEvent) {
    ev.preventDefault();
    if (loading) return; // bloqueia envio duplicado
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

    // Confirmação breve antes de sair da tela.
    setSucesso(true);
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

    setInfo("Enviamos um link de recuperação para o seu e-mail.");
  }

  function setCad<K extends keyof typeof cadastro>(key: K, val: string) {
    setCadastro((c) => ({ ...c, [key]: val }));
    setErros((e) => ({ ...e, [key]: "" }));
  }

  function validarCadastro(): boolean {
    const e: Record<string, string> = {};
    if (!cadastro.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cadastro.email)) {
      e.email = "E-mail inválido.";
    }
    if (!isValidPhoneBr(cadastro.telefone)) e.telefone = "Telefone inválido.";
    if (cadastro.senha.length < 6) e.senha = "Mínimo de 6 caracteres.";
    if (cadastro.senha !== cadastro.confirmar) {
      e.confirmar = "As senhas não coincidem.";
    }
    if (!aceito) e.aceito = "Você precisa aceitar os termos.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleCriarConta(ev: React.FormEvent) {
    ev.preventDefault();
    if (criando) return; // bloqueia envio duplicado
    setErroTopo(undefined);
    if (!validarCadastro()) return;

    setCriando(true);
    try {
      const normalizedEmail = cadastro.email.trim().toLowerCase();

      // Mesma checagem de duplicidade do cadastro, antes de gastar um signUp.
      const [representativeLookup, adminLookup] = await Promise.all([
        supabase
          .from("representatives")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle(),
        supabase
          .from("admins")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle(),
      ]);

      if (representativeLookup.data || adminLookup.data) {
        throw new Error(DUPLICATE_EMAIL_MESSAGE);
      }

      const { data: signUp, error: signErr } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: cadastro.senha,
      });

      if (signErr) {
        if (isDuplicateEmailError(signErr)) throw new Error(DUPLICATE_EMAIL_MESSAGE);
        throw signErr;
      }
      if (signUp.user && signUp.user.identities?.length === 0) {
        throw new Error(DUPLICATE_EMAIL_MESSAGE);
      }

      // A conta existe, mas ainda não é representante: /cadastro completa os
      // dados da turma (curso, instituição, cidade, semestre) e libera o painel.
      router.push("/cadastro");
    } catch (err: any) {
      if (err?.message === DUPLICATE_EMAIL_MESSAGE || isDuplicateEmailError(err)) {
        setErroTopo(DUPLICATE_EMAIL_MESSAGE);
        return;
      }
      // Nada de mensagem técnica de banco/API na tela.
      setErroTopo("Não foi possível criar a conta. Tente novamente.");
    } finally {
      setCriando(false);
    }
  }

  // Tela de carregamento premium; o gate a mantém viva até a saída terminar.
  const { mostrando: carregandoTela, tela } = useLoadingGate(checkingSession);
  if (carregandoTela) return tela;

  /* ─────────────────────────── formulário: entrar ─────────────────────────── */
  const formEntrar = (
    <form onSubmit={handleLogin} noValidate>
      <p
        className="text-[11px] font-medium uppercase"
        style={{ letterSpacing: "0.2em", color: AUTH.textMuted }}
      >
        Acesso à plataforma
      </p>
      <h1
        className="mt-5 font-light"
        style={{
          fontSize: "clamp(30px, 2.6vw, 38px)",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          color: AUTH.ink,
        }}
      >
        Bem-vindo de volta.
      </h1>
      <p className="mt-3 text-[14px] leading-[1.5]" style={{ color: AUTH.textMuted }}>
        Acesse o espaço exclusivo da sua turma.
      </p>

      <div className="mt-8">
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
          action={
            <EyeToggle visivel={verSenha} onToggle={() => setVerSenha((v) => !v)} />
          }
          required
        />
      </div>

      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="text-[12px] underline-offset-4 transition-colors duration-200 hover:underline"
          style={{ color: AUTH.textMuted }}
        >
          Esqueci minha senha
        </button>
      </div>

      <AnimatePresence>
        {(error || info) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            role={error ? "alert" : "status"}
            className="mb-5 px-4 py-3 text-[13px]"
            style={{
              borderRadius: 10,
              border: `1px solid ${error ? AUTH.alphaRed : AUTH.border}`,
              background: error ? "rgba(196,18,48,0.05)" : "rgba(17,18,16,0.03)",
              color: error ? AUTH.alphaRed : AUTH.ink,
            }}
          >
            {error ?? info}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duas fases: "Entrando..." enquanto valida e "Acesso liberado" no
          instante entre a senha ser aceita e o redirecionamento acontecer. */}
      <AuthButton
        type="submit"
        loading={loading}
        loadingLabel={sucesso ? "Acesso liberado" : "Entrando..."}
      >
        Entrar
      </AuthButton>

      <p className="mt-7 text-[13px]" style={{ color: AUTH.textMuted }}>
        Ainda não tem acesso?{" "}
        <button
          type="button"
          onClick={() => router.push("/cadastro")}
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: AUTH.ink }}
        >
          Criar conta
        </button>
      </p>
    </form>
  );

  /* ──────────────────────── formulário: criar conta ──────────────────────── */
  const formCriar = (
    <form onSubmit={handleCriarConta} noValidate>
      <p
        className="text-[11px] font-medium uppercase"
        style={{ letterSpacing: "0.2em", color: AUTH.textMuted }}
      >
        Criar acesso
      </p>
      <h1
        className="mt-5 font-light"
        style={{
          fontSize: "clamp(28px, 2.4vw, 36px)",
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          color: AUTH.ink,
        }}
      >
        Comece agora.
      </h1>
      <p className="mt-3 text-[14px] leading-[1.5]" style={{ color: AUTH.textMuted }}>
        Depois você completa os dados da turma.
      </p>

      {/* Dois campos por linha: empilhados, os cinco estouravam a altura do card. */}
      <div className="mt-6">
        <AuthField
          label="Nome completo"
          name="nome"
          autoComplete="name"
          placeholder="Seu nome"
          value={cadastro.nome}
          onChange={(e) => setCad("nome", e.target.value)}
          error={erros.nome}
          required
        />

        <div className="grid gap-x-4 sm:grid-cols-2">
          <AuthField
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={cadastro.email}
            onChange={(e) => setCad("email", e.target.value)}
            error={erros.email}
            required
          />
          <AuthField
            label="Telefone"
            type="tel"
            name="telefone"
            autoComplete="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            value={cadastro.telefone}
            onChange={(e) => setCad("telefone", maskPhone(e.target.value))}
            error={erros.telefone}
            required
          />
        </div>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <AuthField
            label="Senha"
            type={verSenhaNova ? "text" : "password"}
            name="novaSenha"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={cadastro.senha}
            onChange={(e) => setCad("senha", e.target.value)}
            error={erros.senha}
            action={
              <EyeToggle
                visivel={verSenhaNova}
                onToggle={() => setVerSenhaNova((v) => !v)}
              />
            }
            required
          />
          <AuthField
            label="Confirmar senha"
            type={verSenhaNova ? "text" : "password"}
            name="confirmarSenha"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={cadastro.confirmar}
            onChange={(e) => setCad("confirmar", e.target.value)}
            error={erros.confirmar}
            required
          />
        </div>
      </div>

      <label
        className="flex cursor-pointer items-start gap-3 text-[13px] leading-[1.5]"
        style={{ color: AUTH.textMuted }}
      >
        <input
          type="checkbox"
          checked={aceito}
          onChange={(e) => {
            setAceito(e.target.checked);
            setErros((er) => ({ ...er, aceito: "" }));
          }}
          className="mt-[3px] h-4 w-4 shrink-0"
          style={{ accentColor: AUTH.ink }}
        />
        <span>
          Aceito os{" "}
          <Link
            href="/termos"
            className="underline underline-offset-4"
            style={{ color: AUTH.ink }}
          >
            termos de uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-4"
            style={{ color: AUTH.ink }}
          >
            política de privacidade
          </Link>
          .
        </span>
      </label>
      <div className="min-h-[18px] pt-1">
        {erros.aceito && (
          <p role="alert" className="text-[12px]" style={{ color: AUTH.alphaRed }}>
            {erros.aceito}
          </p>
        )}
      </div>

      <AnimatePresence>
        {erroTopo && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            role="alert"
            className="mb-5 mt-2 px-4 py-3 text-[13px]"
            style={{
              borderRadius: 10,
              border: `1px solid ${AUTH.alphaRed}`,
              background: "rgba(196,18,48,0.05)",
              color: AUTH.alphaRed,
            }}
          >
            {erroTopo}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthButton
        type="submit"
        loading={criando}
        loadingLabel="Criando conta..."
        className="mt-4"
      >
        Criar minha conta
      </AuthButton>

      <p className="mt-7 text-[13px]" style={{ color: AUTH.textMuted }}>
        Já possui uma conta?{" "}
        <button
          type="button"
          onClick={() => setEstado("entrar")}
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: AUTH.ink }}
        >
          Entrar
        </button>
      </p>
    </form>
  );

  return (
    <main
      className="relative flex min-h-[100svh] flex-col"
      style={{ background: AUTH.offWhite }}
    >
      {/* topo discreto: volta ao início à esquerda, logo ao centro */}
      <header className="sticky top-0 z-30 flex min-h-[96px] items-start border-b border-black/[0.06] bg-[#F4F1EB] px-6 pb-4 pt-6 md:relative md:z-10 md:min-h-0 md:items-center md:border-0 md:bg-transparent md:px-10 md:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] transition-colors duration-200 hover:text-[#111210]"
          style={{ color: AUTH.textMuted }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
            <path
              d="M19 12H5M11 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao início
        </Link>

        {/* A caixa recorta a transparência do PNG (ver LOGO_H acima) e fica
            fora do fluxo, então crescer a marca não desce o card. */}
        {/* Ancorada pelo TOPO, não pelo centro: a marca é mais alta que a faixa
            do cabeçalho, e centralizar fazia a sobra ir para cima, onde a borda
            da página cortava. Presa em top, a sobra desce para o off-white
            vazio, que não corta nada. */}
        <span
          className="pointer-events-none absolute left-1/2 block -translate-x-1/2 overflow-hidden"
          style={{ top: LOGO_TOP, height: LOGO_H, width: LOGO_BOX }}
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
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-10 md:px-6">
        <AuthCard
          estado={estado}
          onTrocar={() => router.push("/cadastro")}
          formEntrar={formEntrar}
          formCriar={formCriar}
        />
      </div>

      {/* rodapé mínimo — a tela de acesso não leva o rodapé completo */}
      <footer
        className="px-6 pb-6 text-center text-[11px] md:px-10"
        style={{ color: AUTH.textMuted }}
      >
        © 2026 Alpha Convites · Acesso restrito a representantes de turma
      </footer>
    </main>
  );
}
